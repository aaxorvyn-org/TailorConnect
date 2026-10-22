from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PaymentCreateIntent(BaseModel):
    """
    Request to initiate a payment.
    CRITICAL: Does NOT accept 'amount' from client.
    The backend computes the verified amount strictly from the database order.
    """
    order_id: int = Field(..., description="Order ID to pay for")
    payment_method: str = Field("CARD", description="Selected payment method (CARD, UPI, NET_BANKING, WALLET, CASH_ON_DELIVERY)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional customer payment notes")


class PaymentConfirm(BaseModel):
    """
    Payment confirmation/verification payload from frontend or webhook simulator.
    """
    payment_id: str = Field(..., description="Unique payment identifier (PAY-...)")
    transaction_reference: Optional[str] = Field(None, description="External gateway reference or simulated transaction ID")
    mock_card_last4: Optional[str] = Field(None, max_length=4, description="Card last 4 digits for receipt display")
    simulate_failure: Optional[bool] = Field(False, description="Flag for sandbox failure testing")
    notes: Optional[str] = Field(None, max_length=500)


class PaymentResponse(BaseModel):
    """
    Payment record response.
    Never exposes secret gateway keys.
    """
    id: int
    order_id: int
    payment_id: str
    amount: float
    currency: str
    status: str
    payment_method: str
    provider: str
    transaction_reference: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentConfigResponse(BaseModel):
    """
    Public payment configuration for frontend.
    Guarantees no secret keys are exposed.
    """
    provider: str
    environment: str
    public_key: Optional[str] = None
    supported_methods: List[str]
    currency: str
