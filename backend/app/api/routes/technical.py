from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.slugs import slug_to_symbol
from app.db.session import get_db
from app.models.indicator import Indicator
from app.schemas.technical import (
    LevelOut,
    LiquidityOut,
    StructureBreakOut,
    SwingOut,
    TechnicalOut,
)
from app.services.indicator_store import load_candles
from app.services.structure import (
    current_trend,
    find_levels,
    find_liquidity,
    find_structure_breaks,
    find_swings,
    label_swings,
)

router = APIRouter(prefix="/markets", tags=["technical"])

# How far bb_width must sit from its own recent average before volatility is
# called elevated or compressed. Bollinger width is already normalised as a
# percentage of price, so one threshold works across instruments.
VOLATILITY_BAND = 0.25
VOLUME_BAND = 0.20


def _classify_trend(ema20: float, ema50: float, ema200: float) -> str:
    if ema20 > ema50 > ema200:
        return "BULLISH"
    if ema20 < ema50 < ema200:
        return "BEARISH"
    return "NEUTRAL"


def _classify_momentum(macd_hist: float | None, rsi: float | None) -> str:
    """MACD histogram leads, RSI breaks the tie when the histogram is flat."""
    if macd_hist is None or rsi is None:
        return "FLAT"
    if macd_hist > 0 and rsi > 50:
        return "POSITIVE"
    if macd_hist < 0 and rsi < 50:
        return "NEGATIVE"
    return "FLAT"


def _relative_band(current: float | None, average: float | None, band: float,
                   high: str, mid: str, low: str) -> str:
    if current is None or average is None or average == 0:
        return mid
    ratio = current / average
    if ratio > 1 + band:
        return high
    if ratio < 1 - band:
        return low
    return mid


@router.get("/{slug}/technical", response_model=TechnicalOut, response_model_by_alias=True)
async def get_technical(
    slug: str,
    timeframe: str = Query("1H"),
    db: AsyncSession = Depends(get_db),
) -> TechnicalOut:
    symbol = slug_to_symbol(slug)

    rows = (
        await db.execute(
            select(Indicator)
            .where(Indicator.symbol == symbol, Indicator.timeframe == timeframe)
            .order_by(Indicator.timestamp)
        )
    ).scalars().all()
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No indicators stored for {symbol} {timeframe} — has the backfill run?",
        )

    latest = rows[-1]
    if latest.ema20 is None or latest.ema50 is None or latest.ema200 is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Not enough history for {symbol} {timeframe}: the 200-period "
            "moving average needs at least 200 candles.",
        )

    # Compare the latest reading against its own recent history rather than a
    # fixed threshold — "elevated volatility" only means anything relative to
    # what is normal for this instrument and timeframe.
    recent = rows[-50:]
    widths = [r.bb_width for r in recent if r.bb_width is not None]
    avg_width = sum(widths) / len(widths) if widths else None

    candles = await load_candles(db, symbol, timeframe)
    recent_vol = candles["volume"].tail(20)
    avg_vol = float(recent_vol.mean()) if len(recent_vol) else None
    last_vol = float(candles["volume"].iloc[-1]) if len(candles) else None

    swings = label_swings(find_swings(candles, lookback=3))
    breaks = find_structure_breaks(candles, swings)
    levels = find_levels(candles, swings)
    liquidity = find_liquidity(candles, swings)

    close = float(candles["close"].iloc[-1])

    return TechnicalOut(
        symbol=symbol,
        timeframe=timeframe,
        timestamp=latest.timestamp,
        trend=_classify_trend(latest.ema20, latest.ema50, latest.ema200),  # type: ignore[arg-type]
        rsi=round(latest.rsi14 or 0.0, 2),
        adx=round(latest.adx14 or 0.0, 2),
        atr=round(latest.atr14 or 0.0, 5),
        vwap="ABOVE" if latest.vwap is not None and close > latest.vwap else "BELOW",
        momentum=_classify_momentum(latest.macd_hist, latest.rsi14),  # type: ignore[arg-type]
        volatility=_relative_band(  # type: ignore[arg-type]
            latest.bb_width, avg_width, VOLATILITY_BAND, "ELEVATED", "NORMAL", "COMPRESSED"
        ),
        volume=_relative_band(  # type: ignore[arg-type]
            last_vol, avg_vol, VOLUME_BAND, "EXPANDING", "AVERAGE", "CONTRACTING"
        ),
        ema20=round(latest.ema20, 5),
        ema50=round(latest.ema50, 5),
        ema200=round(latest.ema200, 5),
        bb_width=round(latest.bb_width or 0.0, 4),
        macd=round(latest.macd or 0.0, 5),
        structure_trend=current_trend(swings),
        swings=[SwingOut(timestamp=s.timestamp, price=round(s.price, 5), kind=s.kind, label=s.label)
                for s in swings[-20:]],
        breaks=[StructureBreakOut(timestamp=b.timestamp, price=round(b.price, 5), kind=b.kind,
                                  direction=b.direction, broken_level=round(b.broken_level, 5))
                for b in breaks[-10:]],
        levels=[LevelOut(price=round(level.price, 5), touches=level.touches, kind=level.kind,
                         last_timestamp=level.last_timestamp)
                for level in levels[:10]],
        liquidity=[LiquidityOut(price=round(p.price, 5), kind=p.kind, swept=p.swept)
                   for p in liquidity],
    )
