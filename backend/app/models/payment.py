import enum
from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, enum.Enum):
    CARD = "CARD"
    UPI = "UPI"
    NET_BANKING = "NET_BANKING"
    WALLET = "WALLET"
    CASH_ON_DELIVERY = "CASH_ON_DELIVERY"


class Payment(Base, TimestampMixin):
    """
    Payment entity linked directly to an order.
    Amount is strictly calculated on the backend to prevent frontend tampering.
    """
    __tablename__ = "payments"

    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payment_id = Column(String(100), unique=True, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    status = Column(String(50), nullable=False, default=PaymentStatus.PENDING.value, index=True)
    payment_method = Column(String(50), nullable=False, default=PaymentMethod.CARD.value)

    # Provider and transaction metadata
    provider = Column(String(50), nullable=False, default="MOCK_SANDBOX")
    transaction_reference = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="payments")

    def __repr__(self) -> str:
        return (
            f"<Payment id={self.id} order_id={self.order_id} "
            f"payment_id='{self.payment_id}' amount={self.amount} status='{self.status}'>"
        )
