from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AssetOut(BaseModel):
    """Mirrors the frontend's Asset type in src/lib/types.ts field-for-field."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    symbol: str
    name: str
    kind: Literal["metal", "forex"]
    pip_decimals: int = Field(alias="pipDecimals")
