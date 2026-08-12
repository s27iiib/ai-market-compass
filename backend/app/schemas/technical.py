from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SwingOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    timestamp: int
    price: float
    kind: str
    label: str | None = None


class StructureBreakOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    timestamp: int
    price: float
    kind: str
    direction: str
    broken_level: float = Field(serialization_alias="brokenLevel")


class LevelOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    price: float
    touches: int
    kind: str
    last_timestamp: int = Field(serialization_alias="lastTimestamp")


class LiquidityOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    price: float
    kind: str
    swept: bool


class TechnicalOut(BaseModel):
    """Mirrors the frontend's TechnicalMetrics in src/lib/types.ts, plus the
    structure/liquidity findings the workspace tabs render."""

    model_config = ConfigDict(populate_by_name=True)

    symbol: str
    timeframe: str
    timestamp: int

    # TechnicalMetrics
    trend: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    rsi: float
    adx: float
    atr: float
    vwap: Literal["ABOVE", "BELOW"]
    momentum: Literal["POSITIVE", "NEGATIVE", "FLAT"]
    volatility: Literal["ELEVATED", "NORMAL", "COMPRESSED"]
    volume: Literal["EXPANDING", "AVERAGE", "CONTRACTING"]
    ema20: float
    ema50: float
    ema200: float
    bb_width: float = Field(serialization_alias="bbWidth")
    macd: float

    # Structure findings
    structure_trend: str = Field(serialization_alias="structureTrend")
    swings: list[SwingOut]
    breaks: list[StructureBreakOut]
    levels: list[LevelOut]
    liquidity: list[LiquidityOut]
