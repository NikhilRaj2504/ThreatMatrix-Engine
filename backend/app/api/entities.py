from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import Dict, Any, List, Optional

from app.db.database import get_db
from app.models.schema import UpiEntity, Transaction, FraudReport
from app.services.entity_engine import entity_engine
from app.services.network_engine import network_engine

router = APIRouter(prefix="/entities", tags=["UPI Entity Intelligence"])


@router.get("/list")
async def list_entities(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(UpiEntity)
        .order_by(UpiEntity.entity_risk_score.desc())
        .limit(limit)
    )
    entities = res.scalars().all()
    return [
        {
            "upi_id": e.upi_id,
            "account_holder": e.account_holder,
            "declared_category": e.declared_category,
            "total_inflow": e.total_inflow,
            "total_transactions": e.total_transactions,
            "unique_senders_count": e.unique_senders_count,
            "fraud_reports_count": e.fraud_reports_count,
            "entity_risk_score": e.entity_risk_score,
            "first_seen": e.first_seen.isoformat() if e.first_seen else None
        }
        for e in entities
    ]


@router.get("/search")
async def search_entities(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db)
):
    query = f"%{q}%"
    res = await db.execute(
        select(UpiEntity)
        .where(or_(UpiEntity.upi_id.ilike(query), UpiEntity.account_holder.ilike(query)))
        .limit(20)
    )
    entities = res.scalars().all()
    return [
        {
            "upi_id": e.upi_id,
            "account_holder": e.account_holder,
            "declared_category": e.declared_category,
            "entity_risk_score": e.entity_risk_score,
            "fraud_reports_count": e.fraud_reports_count
        }
        for e in entities
    ]


@router.get("/{upi_id}")
async def get_entity_profile(
    upi_id: str,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UpiEntity).where(UpiEntity.upi_id == upi_id))
    entity = res.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="UPI Entity not found")

    # Fetch recent transactions
    tx_res = await db.execute(
        select(Transaction)
        .where(Transaction.receiver_upi == upi_id)
        .order_by(Transaction.timestamp.desc())
        .limit(20)
    )
    txs = tx_res.scalars().all()

    # Fetch reports
    rep_res = await db.execute(
        select(FraudReport)
        .where(FraudReport.reported_upi == upi_id)
        .order_by(FraudReport.timestamp.desc())
    )
    reports = rep_res.scalars().all()

    analysis = await entity_engine.analyze(db=db, receiver_upi=upi_id, current_amount=0.0)

    return {
        "upi_id": entity.upi_id,
        "account_holder": entity.account_holder,
        "declared_category": entity.declared_category,
        "total_inflow": entity.total_inflow,
        "total_transactions": entity.total_transactions,
        "unique_senders_count": entity.unique_senders_count,
        "fraud_reports_count": entity.fraud_reports_count,
        "entity_risk_score": entity.entity_risk_score,
        "first_seen": entity.first_seen.isoformat() if entity.first_seen else None,
        "metrics": analysis,
        "recent_transactions": [
            {
                "id": t.id,
                "sender_id": t.sender_id,
                "amount": t.amount,
                "location": t.location,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                "status": t.status,
                "description": t.description
            }
            for t in txs
        ],
        "fraud_reports": [
            {
                "id": r.id,
                "category": r.category,
                "description": r.description,
                "loss_amount": r.loss_amount,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "status": r.status
            }
            for r in reports
        ]
    }


@router.get("/{upi_id}/network")
async def get_entity_network(
    upi_id: str,
    depth: int = Query(2, ge=1, le=3),
    db: AsyncSession = Depends(get_db)
):
    subgraph = await network_engine.get_subgraph_for_entity(db=db, entity_id=upi_id, depth=depth)
    return subgraph
