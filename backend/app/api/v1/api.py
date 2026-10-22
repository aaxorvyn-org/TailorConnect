from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    tailor_customers,
    tailor_discovery,
    measurements,
    orders,
    international,
    admin,
    payments,
    reviews,
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tailor_customers.router, prefix="/tailors/customers", tags=["Tailor Customers"])
api_router.include_router(tailor_discovery.router, prefix="/tailors", tags=["Tailor Discovery"])
api_router.include_router(measurements.templates_router, prefix="/measurement-templates", tags=["Measurement Templates"])
api_router.include_router(measurements.measurements_router, prefix="/customers/measurements", tags=["Customer Measurements"])
api_router.include_router(orders.orders_router, prefix="/orders", tags=["Customer Orders"])
api_router.include_router(orders.tailor_orders_router, prefix="/tailors/orders", tags=["Tailor Orders"])
api_router.include_router(orders.designs_router, prefix="/designs", tags=["Designs"])
api_router.include_router(international.router, prefix="/international", tags=["International Support"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Operations"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])


