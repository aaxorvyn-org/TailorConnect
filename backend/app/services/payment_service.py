import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.shop import TailorShop
from app.models.user import User
from app.schemas.payment import (
    PaymentConfigResponse,
    PaymentConfirm,
    PaymentCreateIntent,
    PaymentResponse,
)
from app.utils.logger import logger


class PaymentService:
    """
    Secure payment gateway service for online tailoring commissions.
    Enforces server-side amount calculation and prevents client price tampering.
    Never exposes sensitive payment secrets.
    """

    def get_payment_config(self) -> PaymentConfigResponse:
        """
        Return public gateway configuration for frontend client.
        Safely omits PAYMENT_SECRET_KEY.
        """
        return PaymentConfigResponse(
            provider=settings.PAYMENT_PROVIDER,
            environment=settings.PAYMENT_ENVIRONMENT,
            public_key=settings.PAYMENT_PUBLIC_KEY,
            supported_methods=[
                "CARD",
                "UPI",
                "NET_BANKING",
                "WALLET",
                "CASH_ON_DELIVERY",
            ],
            currency=settings.PAYMENT_CURRENCY,
        )

    def create_payment_intent(
        self,
        db: Session,
        user: User,
        payload: PaymentCreateIntent,
    ) -> PaymentResponse:
        """
        Initialize a payment intent for an order.
        Strictly computes verified amount from the database Order entity.
        """
        order = db.query(Order).filter(Order.id == payload.order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {payload.order_id} not found.",
            )

        # Enforce customer ownership or admin override
        if user.role in ["CUSTOMER", "customer"] and order.customer_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to make a payment for this order.",
            )

        # Prevent duplicate payment on already settled commissions
        if getattr(order, "payment_status", "UNPAID") == "PAID":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This order has already been fully paid and settled.",
            )

        # Validate payment method enum
        valid_methods = [m.value for m in PaymentMethod]
        chosen_method = payload.payment_method.upper().strip()
        if chosen_method not in valid_methods:
            chosen_method = PaymentMethod.CARD.value

        # Generate unique transaction reference ID
        payment_id = f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8].upper()}"

        payment = Payment(
            order_id=order.id,
            payment_id=payment_id,
            amount=order.total_amount,
            currency=order.currency or "USD",
            status=PaymentStatus.PENDING.value,
            payment_method=chosen_method,
            provider=settings.PAYMENT_PROVIDER,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        logger.info(
            f"User {user.id} created payment intent {payment_id} for order #{order.id} "
            f"({order.currency} {order.total_amount})"
        )
        return PaymentResponse.model_validate(payment)

    def confirm_payment(
        self,
        db: Session,
        user: User,
        payload: PaymentConfirm,
    ) -> PaymentResponse:
        """
        Confirm payment status from frontend completion callback or simulated gateway.
        """
        payment = db.query(Payment).filter(Payment.payment_id == payload.payment_id).first()
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment reference '{payload.payment_id}' not found.",
            )

        order = payment.order
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated order could not be located.",
            )

        # Authorization check
        if user.role in ["CUSTOMER", "customer"] and order.customer_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to confirm payment for this order.",
            )

        if payload.simulate_failure:
            payment.status = PaymentStatus.FAILED.value
            payment.error_message = "Payment authorization declined by issuing banking simulator."
            db.commit()
            db.refresh(payment)
            logger.warning(f"Payment {payment.payment_id} recorded as FAILED (simulation).")
            return PaymentResponse.model_validate(payment)

        # Successful payment confirmation
        payment.status = PaymentStatus.COMPLETED.value
        payment.transaction_reference = payload.transaction_reference or f"TXN-{uuid.uuid4().hex[:12].upper()}"
        payment.error_message = None

        # Synchronize order payment status
        order.payment_status = "PAID"
        db.commit()
        db.refresh(payment)

        logger.info(f"Payment {payment.payment_id} completed successfully for order #{order.id}.")
        return PaymentResponse.model_validate(payment)

    def get_order_payments(
        self,
        db: Session,
        user: User,
        order_id: int,
    ) -> List[PaymentResponse]:
        """
        Retrieve all payment history records for an order.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )

        # Authorization check
        if user.role in ["CUSTOMER", "customer"] and order.customer_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view payments for this order.",
            )
        elif user.role in ["TAILOR", "tailor"]:
            shop = db.query(TailorShop).filter(TailorShop.user_id == user.id).first()
            if not shop or order.tailor_shop_id != shop.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This order does not belong to your atelier workshop.",
                )

        payments = db.query(Payment).filter(Payment.order_id == order_id).order_by(Payment.id.desc()).all()
        return [PaymentResponse.model_validate(p) for p in payments]


payment_service = PaymentService()
