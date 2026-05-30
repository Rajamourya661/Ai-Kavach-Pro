"""
KAVACH AI Pro - Database Session Management
Supports both PostgreSQL (production) and SQLite (development/demo)
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Detect database type and configure accordingly
db_url = settings.DATABASE_URL
is_sqlite = "sqlite" in db_url

if is_sqlite:
    # SQLite — no connection pooling needed
    engine = create_async_engine(
        db_url,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},  # Required for SQLite
    )
    logger.info(f"Using SQLite database: {db_url}")
else:
    # PostgreSQL — with connection pooling
    engine = create_async_engine(
        db_url,
        echo=settings.DEBUG,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_timeout=30,
    )
    logger.info(f"Using PostgreSQL database")

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db():
    """Dependency for database sessions"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
