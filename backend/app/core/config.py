from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Information
    APP_NAME: str = "Tailor Marketplace API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # JWT Authentication & Security
    SECRET_KEY: str = "threadcraft_jwt_secret_key_sartorial_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS Allowed Origins (accepts list, JSON string, or comma-separated string)
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.BACKEND_CORS_ORIGINS, list):
            return self.BACKEND_CORS_ORIGINS
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            val = self.BACKEND_CORS_ORIGINS.strip()
            if val.startswith("[") and val.endswith("]"):
                import json
                try:
                    return json.loads(val)
                except Exception:
                    pass
            return [x.strip() for x in val.split(",") if x.strip()]
        return ["*"]

    # PostgreSQL Database Configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "tailor_marketplace_dev"
    DATABASE_URL: Union[str, None] = None

    # Payment Gateway Configuration (Strictly configurable via environment variables)
    PAYMENT_PROVIDER: str = "MOCK_SANDBOX"  # Options: MOCK_SANDBOX, STRIPE, RAZORPAY, PAYPAL
    PAYMENT_ENVIRONMENT: str = "sandbox"     # sandbox / production
    PAYMENT_SECRET_KEY: str = "mock_sec_key_sartorial_atelier_2026"  # Never exposed to frontend!
    PAYMENT_PUBLIC_KEY: str = "pk_test_sartorial_mock_2026"          # Safe for frontend
    PAYMENT_WEBHOOK_SECRET: str = "whsec_mock_sartorial_2026"
    PAYMENT_CURRENCY: str = "USD"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            url = self.DATABASE_URL.strip()
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            return url
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
