from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.slugs import slug_to_symbol
from app.db.session import get_db
from app.models.candle import Candle
from app.schemas.candle import CandleOut

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("/{slug}/candles", response_model=list[CandleOut])
async def get_candles(
    slug: str,
    timeframe: str = Query("1H"),
    from_: int | None = Query(None, alias="from", description="epoch ms, inclusive"),
    to: int | None = Query(None, description="epoch ms, inclusive"),
    db: AsyncSession = Depends(get_db),
) -> list[Candle]:
    symbol = slug_to_symbol(slug)
    stmt = select(Candle).where(Candle.symbol == symbol, Candle.timeframe == timeframe)
    if from_ is not None:
        stmt = stmt.where(Candle.timestamp >= from_)
    if to is not None:
        stmt = stmt.where(Candle.timestamp <= to)
    stmt = stmt.order_by(Candle.timestamp)

    candles = list((await db.execute(stmt)).scalars().all())
    if not candles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No candles stored for {symbol} {timeframe} — has it been backfilled?",
        )
    return candles
