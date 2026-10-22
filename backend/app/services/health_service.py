from app.core.config import settings
from app.database.session import check_database_connection
from app.schemas.health import HealthResponse, DetailedHealthResponse, DatabaseHealth


class HealthService:
    """
    Business service layer managing application and dependency health status.
    """

    @staticmethod
    def get_basic_health() -> HealthResponse:
        """
        Returns basic operational health status conforming to GET /api/health specification.
        """
        return HealthResponse(
            status="ok",
            message="Tailor Marketplace API is running",
        )

    @staticmethod
    def get_detailed_health() -> DetailedHealthResponse:
        """
        Returns rich health diagnostics including database connectivity and environment info.
        """
        db_status = check_database_connection()
        return DetailedHealthResponse(
            status="ok",
            message=f"{settings.APP_NAME} is running",
            app_name=settings.APP_NAME,
            environment=settings.APP_ENV,
            database=DatabaseHealth(**db_status),
        )
