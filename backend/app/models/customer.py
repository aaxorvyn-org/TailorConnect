from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class Customer(Base, TimestampMixin):
    """
    Customer / Patron entity belonging to a specific tailor/shop.
    Enforces multi-tenant isolation so each tailor only accesses their own customers.
    """
    __tablename__ = "customers"

    tailor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    shop_id = Column(Integer, nullable=True, index=True)
    shop_name = Column(String(255), nullable=True)

    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True, index=True)
    gender = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(50), nullable=True)
    postal_code = Column(String(50), nullable=True)
    country = Column(String(100), nullable=False, default="India", index=True)
    country_code = Column(String(10), nullable=True, default="IN")
    currency = Column(String(10), nullable=False, default="INR")
    preferred_contact_method = Column(String(50), nullable=True, default="EMAIL")
    status = Column(String(50), nullable=False, default="ACTIVE", index=True)

    # Cached or tracking summary metrics
    total_orders = Column(Integer, default=0, nullable=False)
    total_spend = Column(Float, default=0.0, nullable=False)

    # Relationships
    tailor = relationship("User", foreign_keys=[tailor_id])
    notes = relationship(
        "CustomerNote",
        back_populates="customer",
        cascade="all, delete-orphan",
        order_by="CustomerNote.created_at.desc()"
    )

    def __repr__(self) -> str:
        return f"<Customer id={self.id} tailor_id={self.tailor_id} name='{self.full_name}'>"


class CustomerNote(Base, TimestampMixin):
    """
    Atelier notes and fitting observations for a customer.
    Scoped directly to both the customer and the tailor.
    """
    __tablename__ = "customer_notes"

    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    tailor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    note = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default="GENERAL")

    # Relationships
    customer = relationship("Customer", back_populates="notes")
    tailor = relationship("User", foreign_keys=[tailor_id])

    def __repr__(self) -> str:
        return f"<CustomerNote id={self.id} customer_id={self.customer_id} category='{self.category}'>"
