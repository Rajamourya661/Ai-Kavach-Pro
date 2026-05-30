"""
KAVACH AI Pro - Production Main Application
Enterprise-grade with all security features
"""

import redis.asyncio as aioredis
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys
import os
from datetime import datetime, timezone

from app.core.config import settings
from app.core.middleware import SecurityMiddleware, RateLimitMiddleware
from app.api.v1.endpoints import detection, auth, admin, complaints
from app.db.session import engine
from app.models.database import Base

# Structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting KAVACH AI Pro...")

    # Initialize Redis (optional — graceful fallback)
    try:
        app.state.redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await app.state.redis.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.warning(f"Redis not available: {e} — running without cache")
        app.state.redis = None

    # Create database tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

    # Create upload directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "deepfake"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "voice"), exist_ok=True)

    yield

    # Shutdown
    logger.info("Shutting down KAVACH AI Pro...")
    if app.state.redis:
        await app.state.redis.close()
    await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    description="India's Advanced Deepfake & Social Engineering Detection Platform",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security headers middleware
app.add_middleware(SecurityMiddleware)

# Rate limiting middleware
app.add_middleware(
    RateLimitMiddleware,
    redis_url=settings.REDIS_URL,
    max_requests=settings.RATE_LIMIT_REQUESTS,
    window_seconds=settings.RATE_LIMIT_WINDOW
)

# CORS middleware — MUST be last (so it runs outermost, handling preflight first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) if settings.DEBUG else "An unexpected error occurred.",
                "request_id": getattr(request.state, 'request_id', 'unknown')
            }
        }
    )

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "error": str(e)}
        )

@app.get("/metrics")
async def metrics():
    """Basic metrics endpoint"""
    from sqlalchemy import text
    try:
        async with engine.connect() as conn:
            user_count = (await conn.execute(text("SELECT COUNT(*) FROM users"))).scalar() or 0
            detection_count = (await conn.execute(text("SELECT COUNT(*) FROM detections"))).scalar() or 0
        return {
            "users_total": user_count,
            "detections_total": detection_count,
            "status": "healthy"
        }
    except Exception:
        return {"status": "healthy", "note": "database metrics unavailable"}

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(detection.router, prefix="/api/v1", tags=["Detection"])
app.include_router(complaints.router, prefix="/api/v1", tags=["Complaints"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1,
        log_level="info"
    )
