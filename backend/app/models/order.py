import enum
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    MEASUREMENT_CONFIRMED = "MEASUREMENT_CONFIRMED"
    CUTTING = "CUTTING"
    STITCHING = "STITCHING"
    QUALITY_CHECK = "QUALITY_CHECK"
    READY = "READY"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


# Allowed status transitions by role
# Maps current status -> set of allowed next statuses
ALLOWED_TRANSITIONS = {
    OrderStatus.PENDING: {
        OrderStatus.ACCEPTED,
        OrderStatus.REJECTED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.ACCEPTED: {
        OrderStatus.MEASUREMENT_CONFIRMED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.MEASUREMENT_CONFIRMED: {
        OrderStatus.CUTTING,
        OrderStatus.CANCELLED,
    },
    OrderStatus.CUTTING: {
        OrderStatus.STITCHING,
        OrderStatus.CANCELLED,
    },
    OrderStatus.STITCHING: {
        OrderStatus.QUALITY_CHECK,
    },
    OrderStatus.QUALITY_CHECK: {
        OrderStatus.READY,
    },
    OrderStatus.READY: {
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
    },
    OrderStatus.SHIPPED: {
        OrderStatus.DELIVERED,
    },
    OrderStatus.DELIVERED: set(),  # Terminal state
    OrderStatus.REJECTED: set(),   # Terminal state
    OrderStatus.CANCELLED: set(),  # Terminal state
}


class DeliveryAddress(Base, TimestampMixin):
    """
    Physical shipping/delivery address for customer orders.
    """
    __tablename__ = "delivery_addresses"

    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    address_line_1 = Column(String(255), nullable=False)
    address_line_2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False, default="India")
    country_code = Column(String(10), nullable=True, default="IN")
    pincode = Column(String(50), nullable=False)
    postal_code = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    orders = relationship("Order", back_populates="delivery_address")

    def __repr__(self) -> str:
        return f"<DeliveryAddress id={self.id} customer_id={self.customer_id} city='{self.city}'>"


class Order(Base, TimestampMixin):
    """
    Online tailoring order linking customer, atelier shop, items, delivery, and lifecycle stages.
    """
    __tablename__ = "orders"

    order_number = Column(String(64), unique=True, nullable=False, index=True)
    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tailor_shop_id = Column(
        Integer,
        ForeignKey("tailor_shops.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    delivery_address_id = Column(
        Integer,
        ForeignKey("delivery_addresses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status = Column(String(50), nullable=False, default=OrderStatus.PENDING.value, index=True)
    payment_status = Column(String(50), nullable=False, default="UNPAID", index=True)
    subtotal = Column(Float, nullable=False, default=0.0)
    delivery_charge = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), nullable=False, default="USD")
    customer_notes = Column(Text, nullable=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], lazy="joined")
    tailor_shop = relationship("TailorShop", foreign_keys=[tailor_shop_id], lazy="joined")
    delivery_address = relationship("DeliveryAddress", back_populates="orders", lazy="joined")
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.id.asc()",
        lazy="joined",
    )
    reference_images = relationship(
        "OrderReferenceImage",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderReferenceImage.id.asc()",
        lazy="joined",
    )
    status_history = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.id.asc()",
        lazy="joined",
    )
    delivery = relationship(
        "OrderDelivery",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined",
    )
    payments = relationship(
        "Payment",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="Payment.id.desc()",
        lazy="joined",
    )
    review = relationship(
        "ShopReview",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} number='{self.order_number}' status='{self.status}'>"


class OrderItem(Base, TimestampMixin):
    """
    Line item within an order specifying design, quantity, unit price, notes, and anatomical measurement profile.
    """
    __tablename__ = "order_items"

    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    design_id = Column(
        Integer,
        ForeignKey("designs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    item_title = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    customization_notes = Column(Text, nullable=True)
    measurement_id = Column(
        Integer,
        ForeignKey("customer_measurements.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    order = relationship("Order", back_populates="items")
    design = relationship("Design", foreign_keys=[design_id], lazy="joined")
    measurement = relationship("CustomerMeasurement", foreign_keys=[measurement_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<OrderItem id={self.id} order_id={self.order_id} title='{self.item_title}'>"


class OrderReferenceImage(Base):
    """
    Reference styling/inspiration images uploaded for an order.
    """
    __tablename__ = "order_reference_images"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="reference_images")

    def __repr__(self) -> str:
        return f"<OrderReferenceImage id={self.id} order_id={self.order_id}>"


class OrderStatusHistory(Base):
    """
    Chronological audit trail for order status transitions.
    """
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(50), nullable=False)
    changed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="status_history")
    user = relationship("User", foreign_keys=[changed_by], lazy="joined")

    def __repr__(self) -> str:
        return f"<OrderStatusHistory id={self.id} order_id={self.order_id} status='{self.status}'>"
