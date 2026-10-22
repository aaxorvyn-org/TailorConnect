import enum
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class DeliveryStatus(str, enum.Enum):
    PENDING = "PENDING"
    LABEL_CREATED = "LABEL_CREATED"
    SHIPPED = "SHIPPED"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"


class DeliveryMethod(str, enum.Enum):
    STANDARD_COURIER = "STANDARD_COURIER"
    EXPRESS_COURIER = "EXPRESS_COURIER"
    WHITE_GLOVE = "WHITE_GLOVE"
    SELF_PICKUP = "SELF_PICKUP"
    LOCAL_DELIVERY = "LOCAL_DELIVERY"


class OrderDelivery(Base, TimestampMixin):
    """
    Physical shipping and delivery tracking record linked to an order.
    Enables tailors to manage courier dispatch and customers to inspect live tracking.
    """
    __tablename__ = "order_deliveries"

    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    delivery_method = Column(String(50), nullable=False, default="STANDARD_COURIER")
    courier_name = Column(String(100), nullable=True)
    tracking_number = Column(String(100), nullable=True, index=True)
    tracking_url = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="PENDING", index=True)
    expected_delivery_date = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationship to order
    order = relationship("Order", back_populates="delivery")

    def __repr__(self) -> str:
        return f"<OrderDelivery id={self.id} order_id={self.order_id} courier='{self.courier_name}' status='{self.status}'>"
