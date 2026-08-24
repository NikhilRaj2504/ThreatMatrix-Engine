import networkx as nx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schema import User, Device, UserDevice, UpiEntity, Transaction, CallRecord, FraudReport


class PaymentNetworkIntelligenceEngine:
    """
    Module G: Payment Network Intelligence Engine.
    Builds and analyzes heterogeneous graph structures linking Users, Devices,
    Receiver UPI IDs, and Phishing Caller phone numbers to uncover syndicate topologies.
    """

    async def build_network_graph(self, db: AsyncSession) -> nx.DiGraph:
        G = nx.DiGraph()

        # 1. Fetch Users
        users_res = await db.execute(select(User).limit(300))
        for u in users_res.scalars().all():
            G.add_node(f"user:{u.id}", node_type="USER", label=u.full_name, id=u.id, risk_score=10.0)

        # 2. Fetch Receiver UPI Entities
        entities_res = await db.execute(select(UpiEntity).limit(300))
        for e in entities_res.scalars().all():
            G.add_node(
                f"upi:{e.upi_id}",
                node_type="UPI_ENTITY",
                label=e.upi_id,
                holder=e.account_holder,
                id=e.upi_id,
                risk_score=e.entity_risk_score or 0.0,
                inflow=e.total_inflow,
                reports=e.fraud_reports_count
            )

        # 3. Fetch Devices
        devices_res = await db.execute(select(Device).limit(300))
        for d in devices_res.scalars().all():
            G.add_node(
                f"dev:{d.id}",
                node_type="DEVICE",
                label=d.model or d.id,
                id=d.id,
                is_suspicious=d.is_suspicious,
                risk_score=60.0 if d.is_suspicious else 10.0
            )

        # 4. Fetch User-Device Links
        ud_res = await db.execute(select(UserDevice).limit(500))
        for ud in ud_res.scalars().all():
            u_node = f"user:{ud.user_id}"
            d_node = f"dev:{ud.device_id}"
            if G.has_node(u_node) and G.has_node(d_node):
                G.add_edge(u_node, d_node, relation="USED_DEVICE")

        # 5. Fetch Transactions
        tx_res = await db.execute(select(Transaction).order_by(Transaction.timestamp.desc()).limit(1000))
        for tx in tx_res.scalars().all():
            u_node = f"user:{tx.sender_id}"
            upi_node = f"upi:{tx.receiver_upi}"
            if G.has_node(u_node) and G.has_node(upi_node):
                if G.has_edge(u_node, upi_node):
                    G[u_node][upi_node]["weight"] = G[u_node][upi_node].get("weight", 1) + 1
                    G[u_node][upi_node]["amount"] = G[u_node][upi_node].get("amount", 0.0) + tx.amount
                else:
                    G.add_edge(u_node, upi_node, relation="PAID_TO", weight=1, amount=tx.amount, status=tx.status)

        # 6. Fetch Call Records
        calls_res = await db.execute(select(CallRecord).limit(500))
        for c in calls_res.scalars().all():
            caller_node = f"caller:{c.caller_number}"
            if not G.has_node(caller_node):
                G.add_node(
                    caller_node,
                    node_type="CALLER",
                    label=c.caller_number,
                    id=c.caller_number,
                    risk_score=c.voice_risk_score or 0.0
                )
            if c.recipient_id:
                u_node = f"user:{c.recipient_id}"
                if G.has_node(u_node):
                    G.add_edge(caller_node, u_node, relation="CALLED", score=c.voice_risk_score)

        return G

    async def analyze_transaction_network(
        self,
        db: AsyncSession,
        sender_id: str,
        receiver_upi: str,
        caller_number: Optional[str] = None,
        device_id: Optional[str] = None
    ) -> Dict[str, Any]:
        G = await self.build_network_graph(db)

        network_risk_score = 0.0
        signals_triggered = []

        sender_node = f"user:{sender_id}"
        receiver_node = f"upi:{receiver_upi}"
        caller_node = f"caller:{caller_number}" if caller_number else None
        device_node = f"dev:{device_id}" if device_id else None

        # 1. Receiver In-Degree & Sender Diversity
        if G.has_node(receiver_node):
            in_degree = G.in_degree(receiver_node)
            unique_senders = sum(1 for src, _ in G.in_edges(receiver_node) if src.startswith("user:"))
            if unique_senders >= 20:
                network_risk_score += 25.0
                signals_triggered.append({
                    "code": "GRAPH_MULE_HUB",
                    "message": f"Graph analysis: Receiver is a central payment hub connected to {unique_senders} distinct user nodes",
                    "weight": 25.0
                })
            elif unique_senders >= 8:
                network_risk_score += 15.0
                signals_triggered.append({
                    "code": "ELEVATED_IN_DEGREE",
                    "message": f"Receiver has elevated in-degree connectivity ({unique_senders} active sender edges)",
                    "weight": 15.0
                })

        # 2. Shared Device Syndicate Pattern
        if device_node and G.has_node(device_node):
            users_on_device = sum(1 for src, _ in G.in_edges(device_node) if src.startswith("user:"))
            if users_on_device >= 3:
                network_risk_score += 30.0
                signals_triggered.append({
                    "code": "SHARED_DEVICE_SYNDICATE",
                    "message": f"Device '{device_id}' is shared across {users_on_device} different user accounts (hardware multiplexing)",
                    "weight": 30.0
                })

        # 3. Caller -> Victim -> Receiver Triangle / Star Pattern
        if caller_node and G.has_node(caller_node):
            targeted_victims = [tgt for _, tgt in G.out_edges(caller_node) if tgt.startswith("user:")]
            if len(targeted_victims) >= 2:
                # Check if any targeted victim paid this receiver
                co_victims_paying_receiver = 0
                for v in targeted_victims:
                    if G.has_edge(v, receiver_node):
                        co_victims_paying_receiver += 1

                if co_victims_paying_receiver >= 1:
                    network_risk_score += 40.0
                    signals_triggered.append({
                        "code": "COORDINATED_SCAM_SYNDICATE_LINK",
                        "message": f"Syndicate Alert: Caller '{caller_number}' contacted {len(targeted_victims)} users who subsequently transferred funds to receiver '{receiver_upi}'",
                        "weight": 40.0
                    })
                else:
                    network_risk_score += 20.0
                    signals_triggered.append({
                        "code": "SERIAL_CALLER_CAMPAIGN",
                        "message": f"Caller is connected to {len(targeted_victims)} active user nodes in graph",
                        "weight": 20.0
                    })

        final_net_score = min(100.0, max(0.0, network_risk_score))

        return {
            "network_risk_score": final_net_score,
            "signals": signals_triggered,
            "receiver_in_degree": G.in_degree(receiver_node) if G.has_node(receiver_node) else 0,
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges()
        }

    async def get_subgraph_for_entity(self, db: AsyncSession, entity_id: str, depth: int = 2) -> Dict[str, Any]:
        G = await self.build_network_graph(db)
        target = f"upi:{entity_id}" if not entity_id.startswith(("user:", "upi:", "dev:", "caller:")) else entity_id

        if not G.has_node(target):
            # Try finding by user or caller prefix
            candidates = [n for n in G.nodes if entity_id in n]
            if candidates:
                target = candidates[0]
            else:
                return {"nodes": [], "edges": [], "stats": {"total_nodes": 0, "total_edges": 0}}

        sub_nodes = set([target])
        current_layer = set([target])
        for _ in range(depth):
            next_layer = set()
            for node in current_layer:
                neighbors = set(G.predecessors(node)).union(set(G.successors(node)))
                next_layer.update(neighbors)
            sub_nodes.update(next_layer)
            current_layer = next_layer

        subgraph = G.subgraph(sub_nodes)

        nodes = []
        for n, d in subgraph.nodes(data=True):
            nodes.append({
                "id": n,
                "label": d.get("label", n),
                "type": d.get("node_type", "UNKNOWN"),
                "risk_score": d.get("risk_score", 0.0),
                "holder": d.get("holder", ""),
                "inflow": d.get("inflow", 0.0),
                "reports": d.get("reports", 0)
            })

        edges = []
        for u, v, d in subgraph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "relation": d.get("relation", "LINKED"),
                "amount": d.get("amount", 0.0),
                "weight": d.get("weight", 1)
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "center_node": target
            }
        }


network_engine = PaymentNetworkIntelligenceEngine()
