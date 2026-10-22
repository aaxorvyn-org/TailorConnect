from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """
    Standard health check response schema.
    Matches exact specification for GET /api/health.
    """
    status: str = Field(default="ok", description="API health status")
    message: str = Field(
        default="Tailor Marketplace API is running",
        description="Informational status message",
    )


class DatabaseHealth(BaseModel):
    status: str
    connected: bool
    message: str
    host: str
    database: str
    error: Optional[str] = None


class DetailedHealthResponse(HealthResponse):
    """
    Detailed system health status including database and environment metadata.
    """
    app_name: str
    environment: str
    database: DatabaseHealth
