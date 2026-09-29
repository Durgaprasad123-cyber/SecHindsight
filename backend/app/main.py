import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db
from app.api.v1 import (
    incidents,
    memories,
    threats,
    responses,
    analytics,
    health,
    seed
)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("sec_hindsight.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SecHindsight Database & Engine...")
    await init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down SecHindsight Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SecHindsight — A Cybersecurity SOC Copilot That Learns From Every Incident.",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(memories.router, prefix=settings.API_V1_STR)
app.include_router(threats.router, prefix=settings.API_V1_STR)
app.include_router(responses.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(seed.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "title": settings.PROJECT_NAME,
        "tagline": "A Cybersecurity SOC Copilot That Learns From Every Incident.",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }
