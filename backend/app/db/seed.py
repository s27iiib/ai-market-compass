from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset

# Mirrors ASSETS in src/lib/mock-data.ts exactly, so the real API returns the
# same 8 instruments the frontend already renders from mock data.
SEED_ASSETS = [
    {"symbol": "XAU/USD", "name": "Gold / US Dollar", "kind": "metal", "pip_decimals": 2},
    {"symbol": "EUR/USD", "name": "Euro / US Dollar", "kind": "forex", "pip_decimals": 5},
    {
        "symbol": "GBP/USD",
        "name": "British Pound / US Dollar",
        "kind": "forex",
        "pip_decimals": 5,
    },
    {
        "symbol": "USD/JPY",
        "name": "US Dollar / Japanese Yen",
        "kind": "forex",
        "pip_decimals": 3,
    },
    {
        "symbol": "USD/CHF",
        "name": "US Dollar / Swiss Franc",
        "kind": "forex",
        "pip_decimals": 5,
    },
    {
        "symbol": "AUD/USD",
        "name": "Australian Dollar / US Dollar",
        "kind": "forex",
        "pip_decimals": 5,
    },
    {
        "symbol": "USD/CAD",
        "name": "US Dollar / Canadian Dollar",
        "kind": "forex",
        "pip_decimals": 5,
    },
    {
        "symbol": "NZD/USD",
        "name": "New Zealand Dollar / US Dollar",
        "kind": "forex",
        "pip_decimals": 5,
    },
]


async def seed_assets_if_empty(session: AsyncSession) -> None:
    existing = await session.execute(select(Asset.symbol).limit(1))
    if existing.first() is not None:
        return
    session.add_all(Asset(**row) for row in SEED_ASSETS)
    await session.commit()
