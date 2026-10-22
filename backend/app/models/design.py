from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class DesignCategory(Base, TimestampMixin):
    """
    Design category (e.g. Men Suits, Women Couture, Traditional, Formal Wear, Alterations).
    """
    __tablename__ = "design_categories"

    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    designs = relationship("Design", back_populates="category")

    def __repr__(self) -> str:
        return f"<DesignCategory id={self.id} name='{self.name}'>"


class Design(Base, TimestampMixin):
    """
    Bespoke garment design belonging to a specific tailor shop.
    """
    __tablename__ = "designs"

    shop_id = Column(
        Integer,
        ForeignKey("tailor_shops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = Column(
        Integer,
        ForeignKey("design_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price_from = Column(Float, nullable=False)
    price_to = Column(Float, nullable=True)
    fabric = Column(String(255), nullable=True)
    customization_available = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    image_url = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)

    # Relationships
    shop = relationship("TailorShop", back_populates="designs", lazy="joined")
    category = relationship("DesignCategory", back_populates="designs", lazy="joined")
    images = relationship("DesignImage", back_populates="design", cascade="all, delete-orphan", lazy="joined")

    def __repr__(self) -> str:
        return f"<Design id={self.id} title='{self.title}' shop_id={self.shop_id} price={self.price_from}>"


class DesignImage(Base, TimestampMixin):
    """
    High-resolution lookbook images for a tailor design.
    """
    __tablename__ = "design_images"

    design_id = Column(
        Integer,
        ForeignKey("designs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    design = relationship("Design", back_populates="images")

    def __repr__(self) -> str:
        return f"<DesignImage id={self.id} design_id={self.design_id}>"
