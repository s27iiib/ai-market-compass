import asyncio
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.routes import assets, candles, health, macro, technical, ws
from app.core.config import get_settings
from app.db.base import Base
from app.db.seed import seed_assets_if_empty
from app.db.session import get_engine
from app.models import (  # noqa: F401 — registers tables on Base.metadata
    Asset,
    Candle,
    EconomicEvent,
    Indicator,
    MacroSeries,
)
from app.services.market_data_worker import run_market_data_worker

logger = logging.getLogger("aurum")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    engine = get_engine()
    worker_task: asyncio.Task[None] | None = None

    if engine is None:
        logger.warning("DATABASE_URL not set — /assets will 503 until backend/.env is configured.")
    else:
        from sqlalchemy.ext.asyncio import AsyncSession

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(engine) as session:
            await seed_assets_if_empty(session)
            symbols = [row[0] for row in await session.execute(select(Asset.symbol))]

        settings = get_settings()
        if settings.oanda_api_token and settings.oanda_account_id and settings.redis_url:
            worker_task = asyncio.create_task(run_market_data_worker(symbols))
        else:
            logger.warning(
                "OANDA_ACCOUNT_ID / REDIS_URL not fully configured — live price streaming disabled."
            )

    yield

    if worker_task is not None:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


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
app.include_router(candles.router)
app.include_router(technical.router)
app.include_router(macro.router)
app.include_router(ws.router)
