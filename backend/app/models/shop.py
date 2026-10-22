from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class TailorShop(Base, TimestampMixin):
    """
    Tailor shop entity belonging to an authenticated tailor owner.
    """
    __tablename__ = "tailor_shops"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    shop_name = Column(String(255), nullable=False, index=True)
    owner_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Public storefront and discovery attributes
    rating = Column(Float, default=4.9, nullable=True)
    review_count = Column(Integer, default=0, nullable=True)
    profile_image = Column(String(500), nullable=True)
    cover_image = Column(String(500), nullable=True)
    experience_years = Column(Integer, nullable=True)
    specialties = Column(String(500), nullable=True)
    starting_price = Column(Float, nullable=True)
    turnaround_days = Column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="shop")
    location = relationship(
        "ShopLocation",
        back_populates="shop",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined"
    )
    business_hours = relationship(
        "ShopBusinessHour",
        back_populates="shop",
        cascade="all, delete-orphan",
        lazy="joined",
        order_by="ShopBusinessHour.id"
    )
    services = relationship(
        "ShopService",
        back_populates="shop",
        cascade="all, delete-orphan",
        lazy="joined",
        order_by="ShopService.id"
    )
    designs = relationship(
        "Design",
        back_populates="shop",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="Design.id.desc()"
    )
    reviews = relationship(
        "ShopReview",
        back_populates="tailor_shop",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="ShopReview.id.desc()"
    )

    def __repr__(self) -> str:

        return f"<TailorShop id={self.id} name='{self.shop_name}' owner='{self.owner_name}'>"


class ShopLocation(Base, TimestampMixin):
    """
    Physical address and geographic coordinates for a tailor shop.
    Supports distance calculation and spatial discovery.
    """
    __tablename__ = "shop_locations"

    shop_id = Column(Integer, ForeignKey("tailor_shops.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    country = Column(String(100), nullable=False, default="United Kingdom")
    state = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=True)
    address = Column(String(255), nullable=False)
    pincode = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)

    shop = relationship("TailorShop", back_populates="location")

    def __repr__(self) -> str:
        return f"<ShopLocation id={self.id} city='{self.city}' address='{self.address}' lat={self.latitude} lon={self.longitude}>"


class ShopBusinessHour(Base, TimestampMixin):
    """
    Operating hours for a tailor shop for a specific day of the week.
    """
    __tablename__ = "shop_business_hours"

    shop_id = Column(Integer, ForeignKey("tailor_shops.id", ondelete="CASCADE"), index=True, nullable=False)
    day_of_week = Column(String(20), nullable=False)
    open_time = Column(String(10), nullable=True)
    close_time = Column(String(10), nullable=True)
    is_closed = Column(Boolean, default=False, nullable=False)

    shop = relationship("TailorShop", back_populates="business_hours")

    def __repr__(self) -> str:
        return f"<ShopBusinessHour day='{self.day_of_week}' open='{self.open_time}' close='{self.close_time}' closed={self.is_closed}>"


class ShopService(Base, TimestampMixin):
    """
    Bespoke and tailoring services offered by a shop.
    """
    __tablename__ = "shop_services"

    shop_id = Column(Integer, ForeignKey("tailor_shops.id", ondelete="CASCADE"), index=True, nullable=False)
    service_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    starting_price = Column(Float, nullable=True)
    turnaround_days = Column(Integer, nullable=True)
    category = Column(String(100), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)

    shop = relationship("TailorShop", back_populates="services")

    def __repr__(self) -> str:
        return f"<ShopService id={self.id} name='{self.service_name}' price={self.starting_price}>"
