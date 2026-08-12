from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    # Supabase Postgres connection string (session pooler URI). Optional so
    # the app can boot and serve /health before this is configured.
    database_url: str | None = None

    # Origins allowed to call this API from the browser.
    cors_origins: list[str] = ["http://localhost:8080"]

    # OANDA v20 API — practice account token. Optional so the app boots
    # without it; ingestion just isn't available until it's set.
    oanda_api_token: str | None = None
    oanda_account_id: str | None = None  # only needed for the pricing stream
    oanda_environment: str = "practice"  # "practice" | "live"

    @property
    def oanda_base_url(self) -> str:
        host = "api-fxpractice.oanda.com" if self.oanda_environment == "practice" else "api-fxtrade.oanda.com"
        return f"https://{host}"

    @property
    def oanda_stream_url(self) -> str:
        host = "stream-fxpractice.oanda.com" if self.oanda_environment == "practice" else "stream-fxtrade.oanda.com"
        return f"https://{host}"

    # Upstash Redis — rediss:// (TLS). Optional; the worker just won't cache
    # hot state without it.
    redis_url: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
