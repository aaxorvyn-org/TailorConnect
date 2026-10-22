from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.database.base import Base
from app.database.session import engine, SessionLocal, sync_database_columns
from app.models import (  # Registers models on Base.metadata
    User,
    Customer,
    CustomerNote,
    TailorShop,
    ShopLocation,
    ShopBusinessHour,
    ShopService,
    MeasurementTemplate,
    MeasurementField,
    CustomerMeasurement,
    CustomerMeasurementValue,
    DesignCategory,
    Design,
    DesignImage,
    Order,
    OrderItem,
    OrderReferenceImage,
    DeliveryAddress,
    OrderStatusHistory,
    OrderDelivery,
    Payment,
    ShopReview,
)

from app.services.auth_service import auth_service
from app.services.tailor_discovery_service import tailor_discovery_service
from app.services.measurement_service import measurement_service
from app.services.order_service import order_service
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup lifecycle
    logger.info(f"Starting {settings.APP_NAME} in '{settings.APP_ENV}' mode...")
    
    # Initialize database tables
    try:
        Base.metadata.create_all(bind=engine)
        sync_database_columns(engine)
        logger.info("Database tables verified/created successfully.")
        
        # Seed default demonstration accounts for immediate testing
        db = SessionLocal()
        try:
            auth_service.seed_initial_demo_users(db)
            tailor_discovery_service.seed_initial_shops_if_empty(db)
            measurement_service.seed_default_templates(db)
            order_service.seed_default_designs(db)
            logger.info("Demo users, templates, and atelier designs verification complete.")
        finally:
            db.close()
    except Exception as exc:
        logger.warning(f"Database initialization note: {exc}")

    yield

    # Shutdown lifecycle
    logger.info(f"Shutting down {settings.APP_NAME}...")



app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    lifespan=lifespan,
)

# CORS middleware configuration
origins = settings.cors_origins
if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
elif origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

import os
from fastapi.staticfiles import StaticFiles

# Ensure static upload directories exist and mount static route
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(os.path.join(static_dir, "order_references"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include API Router under /api prefix and root for full backwards compatibility
app.include_router(api_router, prefix=settings.API_PREFIX)
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root_redirect():
    """
    Root endpoint providing service metadata and documentation links.
    """
    return {
        "name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "docs_url": f"{settings.API_PREFIX}/docs",
        "health_check": f"{settings.API_PREFIX}/health",
        "auth_register": f"{settings.API_PREFIX}/auth/register",
        "auth_login": f"{settings.API_PREFIX}/auth/login",
        "auth_me": f"{settings.API_PREFIX}/auth/me",
        "auth_logout": f"{settings.API_PREFIX}/auth/logout",
        "tailor_customers": f"{settings.API_PREFIX}/tailors/customers",
        "tailors_nearby": f"{settings.API_PREFIX}/tailors/nearby",
        "measurement_templates": f"{settings.API_PREFIX}/measurement-templates",
        "customer_measurements": f"{settings.API_PREFIX}/customers/measurements",
        "orders": f"{settings.API_PREFIX}/orders",
        "tailor_orders": f"{settings.API_PREFIX}/tailors/orders",
        "designs": f"{settings.API_PREFIX}/designs",
        "international_countries": f"{settings.API_PREFIX}/international/countries",
        "international_currencies": f"{settings.API_PREFIX}/international/currencies",
    }

