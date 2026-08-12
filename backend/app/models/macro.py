from sqlalchemy import BigInteger, Boolean, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MacroSeries(Base):
    """Time series for a macro input — roadmap Step 7.1.

    Deliberately generic (name/timestamp/value) rather than a wide table:
    unlike indicators, the macro input set is expected to grow as new
    drivers are added, and each series is queried on its own rather than
    joined row-wise across all of them.
    """

    __tablename__ = "macro_series"

    name: Mapped[str] = mapped_column(String(24), primary_key=True)
    timestamp: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    value: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(24))


class EconomicEvent(Base):
    """Scheduled macro release — roadmap Step 7.2.

    `event_id` is a deterministic hash of (timestamp, country, title) rather
    than a provider id: the upstream feed carries no stable identifier, and
    re-fetching the same week must update rows instead of duplicating them.
    """

    __tablename__ = "economic_events"

    event_id: Mapped[str] = mapped_column(String(40), primary_key=True)
    timestamp: Mapped[int] = mapped_column(BigInteger, index=True)
    country: Mapped[str] = mapped_column(String(8))
    title: Mapped[str] = mapped_column(String(160))
    importance: Mapped[str] = mapped_column(String(10))  # LOW | MEDIUM | HIGH | CRITICAL
    previous: Mapped[str | None] = mapped_column(String(32), nullable=True)
    forecast: Mapped[str | None] = mapped_column(String(32), nullable=True)
    actual: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_holiday: Mapped[bool] = mapped_column(Boolean, default=False)
