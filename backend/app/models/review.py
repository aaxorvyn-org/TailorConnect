from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class ShopReview(Base, TimestampMixin):
    """
    Shop review and rating entity.
    Linked to customer (User), tailor shop (TailorShop), and completed order (Order).
    Strictly enforces unique review per completed order.
    """
    __tablename__ = "shop_reviews"

    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tailor_shop_id = Column(
        Integer,
        ForeignKey("tailor_shops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating_range"),
        UniqueConstraint("order_id", name="uq_shop_reviews_order_id"),
    )

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], lazy="joined")
    tailor_shop = relationship("TailorShop", foreign_keys=[tailor_shop_id], back_populates="reviews", lazy="joined")
    order = relationship("Order", foreign_keys=[order_id], back_populates="review", lazy="joined")

    def __repr__(self) -> str:
        return f"<ShopReview id={self.id} shop_id={self.tailor_shop_id} order_id={self.order_id} rating={self.rating}>"
