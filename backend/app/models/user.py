from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class User(Base, TimestampMixin):
    """
    PostgreSQL User entity supporting CUSTOMER, TAILOR, and ADMIN roles.
    """
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="CUSTOMER", nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    country = Column(String(100), nullable=True, default="India")
    currency = Column(String(10), nullable=True, default="INR")
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Tailor atelier foundation fields
    shop_name = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    experience_years = Column(Integer, nullable=True)
    specialties = Column(String(500), nullable=True)
    country = Column(String(100), nullable=True, default="India")
    currency = Column(String(10), nullable=True, default="INR")

    # Relationship to shop
    shop = relationship("TailorShop", back_populates="user", uselist=False, cascade="all, delete-orphan")

    @property
    def shop_id(self):
        return self.shop.id if self.shop else None

    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"
