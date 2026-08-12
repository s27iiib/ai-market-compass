from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.slugs import slug_to_symbol
from app.db.session import get_db
from app.models.asset import Asset
from app.schemas.asset import AssetOut

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=list[AssetOut])
async def list_assets(db: AsyncSession = Depends(get_db)) -> list[Asset]:
    result = await db.execute(select(Asset).order_by(Asset.symbol))
    return list(result.scalars().all())


@router.get("/{slug}", response_model=AssetOut)
async def get_asset(slug: str, db: AsyncSession = Depends(get_db)) -> Asset:
    symbol = slug_to_symbol(slug)
    asset = await db.get(Asset, symbol)
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown asset: {symbol}"
        )
    return asset
