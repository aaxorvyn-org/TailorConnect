from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.payment import (
    PaymentConfigResponse,
    PaymentConfirm,
    PaymentCreateIntent,
    PaymentResponse,
)
from app.services.payment_service import payment_service

router = APIRouter()


@router.get(
    "/config",
    response_model=PaymentConfigResponse,
    summary="Get public payment gateway configuration",
)
def get_payment_config() -> PaymentConfigResponse:
    """
    Returns public gateway provider parameters and supported payment methods.
    Never exposes private/secret credentials.
    """
    return payment_service.get_payment_config()


@router.post(
    "/intent",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate payment intent for an order",
)
def create_payment_intent(
    payload: PaymentCreateIntent,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    """
    Initiates payment for an order.
    The order total is calculated on the server and verified against the database.
    """
    return payment_service.create_payment_intent(
        db=db,
        user=current_user,
        payload=payload,
    )


@router.post(
    "/confirm",
    response_model=PaymentResponse,
    summary="Confirm payment completion",
)
def confirm_payment(
    payload: PaymentConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    """
    Finalizes payment transaction and updates order payment status to PAID.
    """
    return payment_service.confirm_payment(
        db=db,
        user=current_user,
        payload=payload,
    )


@router.get(
    "/order/{order_id}",
    response_model=List[PaymentResponse],
    summary="Get payment history for an order",
)
def get_order_payments(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[PaymentResponse]:
    """
    Retrieves chronological payment records for an order.
    Available to the commissioning customer, atelier tailor, and administrators.
    """
    return payment_service.get_order_payments(
        db=db,
        user=current_user,
        order_id=order_id,
    )
