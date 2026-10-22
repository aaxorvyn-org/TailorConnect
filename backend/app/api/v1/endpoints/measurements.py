from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.measurement import (
    CustomerMeasurementCreate,
    CustomerMeasurementResponse,
    CustomerMeasurementUpdate,
    MeasurementTemplateDetailResponse,
    MeasurementTemplateSummaryResponse,
)
from app.services.measurement_service import measurement_service

# Router for measurement templates
templates_router = APIRouter()

# Router for customer measurement profiles
measurements_router = APIRouter()


# ==============================================================
# 1. Measurement Templates Endpoints
# ==============================================================


@templates_router.get(
    "",
    response_model=List[MeasurementTemplateSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List garment measurement templates",
    description="Retrieves all available garment measurement templates (Shirt, Pants, Blouse, Dress, Lehenga, Suit, Kids Wear, etc.).",
)
def list_measurement_templates(
    db: Session = Depends(get_db),
) -> List[MeasurementTemplateSummaryResponse]:
    # Auto seed default templates if empty
    measurement_service.seed_default_templates(db)
    return measurement_service.list_templates(db)


@templates_router.get(
    "/{id}",
    response_model=MeasurementTemplateDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get measurement template details with required fields",
    description="Retrieves a specific garment template with all its defined measurement fields, units, and ranges in display order.",
)
def get_measurement_template(
    id: int,
    db: Session = Depends(get_db),
) -> MeasurementTemplateDetailResponse:
    # Auto seed default templates if empty
    measurement_service.seed_default_templates(db)
    return measurement_service.get_template_detail(db, template_id=id)


# ==============================================================
# 2. Customer Measurements Endpoints
# ==============================================================


@measurements_router.post(
    "",
    response_model=CustomerMeasurementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a customer measurement profile",
    description="Creates a new customer measurement profile based on a chosen template and validates all field inputs.",
)
def create_customer_measurement(
    data: CustomerMeasurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CustomerMeasurementResponse:
    return measurement_service.create_customer_measurement(
        db=db,
        customer_id=current_user.id,
        data=data,
    )


@measurements_router.get(
    "",
    response_model=List[CustomerMeasurementResponse],
    status_code=status.HTTP_200_OK,
    summary="List customer measurement profiles",
    description="Retrieves all saved measurement profiles belonging to the authenticated customer.",
)
def list_customer_measurements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[CustomerMeasurementResponse]:
    return measurement_service.list_customer_measurements(
        db=db,
        customer_id=current_user.id,
    )


@measurements_router.get(
    "/{id}",
    response_model=CustomerMeasurementResponse,
    status_code=status.HTTP_200_OK,
    summary="Get customer measurement profile by ID",
    description="Retrieves full measurement values and field labels for a specific customer measurement profile.",
)
def get_customer_measurement(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CustomerMeasurementResponse:
    return measurement_service.get_customer_measurement(
        db=db,
        measurement_id=id,
        customer_id=current_user.id,
    )


@measurements_router.put(
    "/{id}",
    response_model=CustomerMeasurementResponse,
    status_code=status.HTTP_200_OK,
    summary="Update customer measurement profile",
    description="Updates existing customer measurement values, name, or fitting notes. Enforces customer ownership.",
)
def update_customer_measurement(
    id: int,
    data: CustomerMeasurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CustomerMeasurementResponse:
    return measurement_service.update_customer_measurement(
        db=db,
        measurement_id=id,
        customer_id=current_user.id,
        data=data,
    )


@measurements_router.delete(
    "/{id}",
    status_code=status.HTTP_200_OK,
    summary="Delete customer measurement profile",
    description="Permanently removes a measurement profile belonging to the customer.",
)
def delete_customer_measurement(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return measurement_service.delete_customer_measurement(
        db=db,
        measurement_id=id,
        customer_id=current_user.id,
    )
