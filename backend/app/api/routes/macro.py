import time

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.macro import EconomicEvent, MacroSeries
from app.services.macro import (
    GOLD_MACRO_WEIGHTS,
    MACRO_DISPLAY_NAMES,
    gold_impact,
    macro_score,
    pct_change,
)

router = APIRouter(tags=["macro"])

# Which instruments each currency's releases move. Used to tag calendar
# events so the UI can filter by what the user actually trades.
CURRENCY_INSTRUMENTS: dict[str, list[str]] = {
    "USD": ["XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD"],
    "EUR": ["EUR/USD"],
    "GBP": ["GBP/USD"],
    "JPY": ["USD/JPY"],
    "CHF": ["USD/CHF"],
    "AUD": ["AUD/USD"],
    "CAD": ["USD/CAD"],
    "NZD": ["NZD/USD"],
}

DISPLAY_UNITS: dict[str, str] = {"WTI": "$", "BRENT": "$", "SILVER": "$"}


class MacroMetricOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    value: str
    change_pct: float = Field(serialization_alias="changePct")
    gold_impact: str = Field(serialization_alias="goldImpact")
    weight: int


class MacroOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    metrics: list[MacroMetricOut]
    macro_score: int = Field(serialization_alias="macroScore")


class EconomicEventOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    time: str
    minutes_away: int = Field(serialization_alias="minutesAway")
    country: str
    event: str
    importance: str
    previous: str
    forecast: str
    actual: str | None
    affected: list[str]


@router.get("/macro", response_model=MacroOut, response_model_by_alias=True)
async def get_macro(db: AsyncSession = Depends(get_db)) -> MacroOut:
    metrics: list[MacroMetricOut] = []
    changes: dict[str, float | None] = {}

    for name, (_, weight) in GOLD_MACRO_WEIGHTS.items():
        rows = (
            await db.execute(
                select(MacroSeries.value)
                .where(MacroSeries.name == name)
                .order_by(MacroSeries.timestamp.desc())
                .limit(25)
            )
        ).scalars().all()
        if not rows:
            continue

        series = list(reversed(rows))
        # 24 periods back on hourly data ~= one trading day, which is the
        # horizon the dashboard's "change" column implies.
        change = pct_change(series, periods=min(24, len(series) - 1))
        changes[name] = change

        unit = DISPLAY_UNITS.get(name, "")
        metrics.append(
            MacroMetricOut(
                name=MACRO_DISPLAY_NAMES.get(name, name),
                value=f"{unit}{series[-1]:,.2f}",
                change_pct=round(change, 2) if change is not None else 0.0,
                gold_impact=gold_impact(name, change),
                weight=weight,
            )
        )

    return MacroOut(metrics=metrics, macro_score=macro_score(changes))


@router.get(
    "/economic-calendar", response_model=list[EconomicEventOut], response_model_by_alias=True
)
async def get_calendar(
    days: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
) -> list[EconomicEventOut]:
    now_ms = int(time.time() * 1000)
    window_start = now_ms - 24 * 60 * 60 * 1000  # keep yesterday's actuals visible
    window_end = now_ms + days * 24 * 60 * 60 * 1000

    rows = (
        await db.execute(
            select(EconomicEvent)
            .where(EconomicEvent.timestamp >= window_start, EconomicEvent.timestamp <= window_end)
            .order_by(EconomicEvent.timestamp)
        )
    ).scalars().all()

    out: list[EconomicEventOut] = []
    for e in rows:
        dt = time.gmtime(e.timestamp / 1000)
        out.append(
            EconomicEventOut(
                id=e.event_id,
                time=time.strftime("%H:%M", dt),
                minutes_away=int((e.timestamp - now_ms) / 60000),
                country=e.country,
                event=e.title,
                importance=e.importance,
                previous=e.previous or "—",
                forecast=e.forecast or "—",
                actual=e.actual,
                affected=CURRENCY_INSTRUMENTS.get(e.country, []),
            )
        )
    return out
