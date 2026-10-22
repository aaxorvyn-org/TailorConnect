from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DeliveryCreateOrUpdate(BaseModel):
    """
    Payload for tailors to add or update courier dispatch and tracking info.
    """
    delivery_method: Optional[str] = Field("STANDARD_COURIER", description="Delivery method (STANDARD_COURIER, EXPRESS_COURIER, WHITE_GLOVE, SELF_PICKUP, LOCAL_DELIVERY)")
    courier_name: Optional[str] = Field(None, max_length=100, description="Manual courier service name (e.g. DHL Express, Blue Dart, FedEx, India Post)")
    tracking_number: Optional[str] = Field(None, max_length=100, description="Courier tracking or consignment number")
    tracking_url: Optional[str] = Field(None, max_length=500, description="Optional public tracking URL")
    status: Optional[str] = Field("PENDING", description="Delivery status (PENDING, LABEL_CREATED, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED)")
    expected_delivery_date: Optional[datetime] = Field(None, description="Expected delivery date/time")
    shipped_at: Optional[datetime] = Field(None, description="Timestamp when order was handed to courier")
    delivered_at: Optional[datetime] = Field(None, description="Timestamp when package was delivered")
    notes: Optional[str] = Field(None, max_length=1000, description="Courier dispatch notes or instructions")


class DeliveryResponse(BaseModel):
    """
    Response model for order delivery details.
    """
    id: int
    order_id: int
    delivery_method: str
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    status: str
    expected_delivery_date: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
