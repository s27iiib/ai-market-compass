import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import assets, health
from app.core.config import get_settings
from app.db.base import Base
from app.db.seed import seed_assets_if_empty
from app.db.session import get_engine
from app.models import Asset  # noqa: F401 — registers the table on Base.metadata

logger = logging.getLogger("aurum")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    engine = get_engine()
    if engine is None:
        logger.warning("DATABASE_URL not set — /assets will 503 until backend/.env is configured.")
    else:
        from sqlalchemy.ext.asyncio import AsyncSession

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(engine) as session:
            await seed_assets_if_empty(session)
    yield


app = FastAPI(title="Aurum API", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(assets.router)
