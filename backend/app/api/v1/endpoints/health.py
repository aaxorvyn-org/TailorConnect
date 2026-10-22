from fastapi import APIRouter, Depends
from app.api.deps import get_health_service
from app.schemas.health import HealthResponse, DetailedHealthResponse
from app.services.health_service import HealthService

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="Basic Health Check")
@router.get("/", response_model=HealthResponse, include_in_schema=False)
def health_check(
    service: HealthService = Depends(get_health_service),
) -> HealthResponse:
    """
    Basic health check confirming the API server is online.
    Returns:
        {
            "status": "ok",
            "message": "Tailor Marketplace API is running"
        }
    """
    return service.get_basic_health()


@router.get("/detailed", response_model=DetailedHealthResponse, summary="Detailed System Health Diagnostics")
def detailed_health_check(
    service: HealthService = Depends(get_health_service),
) -> DetailedHealthResponse:
    """
    Detailed system health check including database connection state,
    environment info, and application settings.
    """
    return service.get_detailed_health()
