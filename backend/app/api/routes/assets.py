from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.asset import Asset
from app.schemas.asset import AssetOut

router = APIRouter(prefix="/assets", tags=["assets"])


def _slug_to_symbol(slug: str) -> str:
    """Mirrors slugToSymbol in src/lib/mock-data.ts so /assets/xau-usd lines
    up with the frontend's existing /markets/$symbol routing."""
    return slug.replace("-", "/").upper()


@router.get("", response_model=list[AssetOut])
async def list_assets(db: AsyncSession = Depends(get_db)) -> list[Asset]:
    result = await db.execute(select(Asset).order_by(Asset.symbol))
    return list(result.scalars().all())


@router.get("/{slug}", response_model=AssetOut)
async def get_asset(slug: str, db: AsyncSession = Depends(get_db)) -> Asset:
    symbol = _slug_to_symbol(slug)
    asset = await db.get(Asset, symbol)
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown asset: {symbol}"
        )
    return asset
