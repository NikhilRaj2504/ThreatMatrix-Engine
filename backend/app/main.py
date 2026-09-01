from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

from app.config import settings
from app.db.database import engine, Base, AsyncSessionLocal
from app.data.seed_data import seed_database
from app.ml.model import ml_service
from app.api.auth import router as auth_router
from app.api.risk import router as risk_router
from app.api.entities import router as entities_router
from app.api.voice import router as voice_router
from app.api.dashboard import router as dashboard_router
from app.api.investigations import router as investigations_router
from app.api.simulation import router as simulation_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fraud_shield")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Fraud Shield Database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Populating synthetic seed data if empty...")
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    logger.info("Initializing ML Model and weights...")
    ml_service._ensure_model_loaded()

    logger.info("Fraud Shield Engine ready to process transactions.")
    yield
    logger.info("Shutting down Fraud Shield Engine...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Explainable Real-Time Fraud Shield Engine API for payment systems, banks, and voice phishing protection.",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount Routers under API V1 Prefix
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(risk_router, prefix=api_prefix)
app.include_router(entities_router, prefix=api_prefix)
app.include_router(voice_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(investigations_router, prefix=api_prefix)
app.include_router(simulation_router, prefix=api_prefix)

# Mount Frontend Static Build if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(
            os.path.join(frontend_dist, "index.html"),
            headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
        )
else:
    @app.get("/")
    async def root():
        return {
            "engine": settings.PROJECT_NAME,
            "status": "ONLINE",
            "version": "1.0.0",
            "docs": "/docs",
            "api_v1": settings.API_V1_STR
        }


@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "Fraud Shield Engine",
        "timestamp": "2026-08-24T10:00:00Z"
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
