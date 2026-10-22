from app.services.health_service import HealthService
from app.services.auth_service import AuthService, auth_service
from app.services.customer_service import CustomerService, customer_service
from app.services.tailor_discovery_service import TailorDiscoveryService, tailor_discovery_service
from app.services.measurement_service import MeasurementService, measurement_service
from app.services.order_service import OrderService, order_service

__all__ = [
    "HealthService",
    "AuthService",
    "auth_service",
    "CustomerService",
    "customer_service",
    "TailorDiscoveryService",
    "tailor_discovery_service",
    "MeasurementService",
    "measurement_service",
    "OrderService",
    "order_service",
]

