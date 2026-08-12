from pydantic import BaseModel, ConfigDict, Field


class CandleOut(BaseModel):
    """Mirrors the frontend's Candle type in src/lib/types.ts field-for-field."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    t: int = Field(validation_alias="timestamp")
    o: float = Field(validation_alias="open")
    h: float = Field(validation_alias="high")
    l: float = Field(validation_alias="low")  # noqa: E741 — matches the frontend field name exactly
    c: float = Field(validation_alias="close")
    v: float = Field(validation_alias="volume")
