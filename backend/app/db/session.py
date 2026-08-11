from collections.abc import AsyncGenerator

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _to_async_url(url: str) -> str:
    """Supabase/Postgres URIs come as postgresql://; SQLAlchemy needs the
    asyncpg dialect spelled out."""
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def get_engine() -> AsyncEngine | None:
    global _engine, _session_factory
    settings = get_settings()
    if not settings.database_url:
        return None
    if _engine is None:
        connect_args = {} if "localhost" in settings.database_url or "127.0.0.1" in settings.database_url else {"ssl": "require"}
        _engine = create_async_engine(_to_async_url(settings.database_url), connect_args=connect_args)
        _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    engine = get_engine()
    if engine is None or _session_factory is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DATABASE_URL is not configured. Set it in backend/.env.",
        )
    async with _session_factory() as session:
        yield session
