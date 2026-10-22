from typing import Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.order import Order, OrderStatus
from app.models.review import ShopReview
from app.models.shop import TailorShop
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewResponse,
    ReviewUpdate,
    ShopReviewSummaryResponse,
)
from app.utils.logger import logger


class ReviewService:
    """
    Shop review and rating service.
    Enforces that only customers with a completed/delivered order can submit a review.
    Enforces strictly 1 review per completed order.
    """

    def _recalculate_shop_rating(self, db: Session, shop: TailorShop) -> None:
        """
        Recalculate average star rating and review count for a tailor shop.
        """
        reviews = db.query(ShopReview).filter(ShopReview.tailor_shop_id == shop.id).all()
        if reviews:
            shop.rating = round(sum(r.rating for r in reviews) / len(reviews), 2)
            shop.review_count = len(reviews)
        else:
            shop.rating = 5.0
            shop.review_count = 0
        db.commit()

    def _to_review_response(self, review: ShopReview) -> ReviewResponse:
        item_title = None
        if review.order and review.order.items and len(review.order.items) > 0:
            first_item = review.order.items[0]
            item_title = getattr(first_item, "item_title", None) or (first_item.design.title if getattr(first_item, "design", None) else None)

        return ReviewResponse(
            id=review.id,
            customer_id=review.customer_id,
            customer_name=review.customer.full_name if review.customer else "Bespoke Patron",
            tailor_shop_id=review.tailor_shop_id,
            tailor_shop_name=review.tailor_shop.shop_name if review.tailor_shop else "Atelier Studio",
            order_id=review.order_id,
            order_number=review.order.order_number if review.order else str(review.order_id),
            item_title=item_title,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )

    def create_review(
        self,
        db: Session,
        customer: User,
        payload: ReviewCreate,
    ) -> ReviewResponse:
        """
        Submit a verified review for a completed order.
        Only the customer who placed the order may review it, and only once completed.
        """
        order = db.query(Order).filter(Order.id == payload.order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {payload.order_id} not found.",
            )

        # 1. Ownership check: Must be the customer who placed the order
        if order.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only review orders commissioned under your own account.",
            )

        # 2. Status verification: Order must be delivered or completed
        eligible_statuses = [
            OrderStatus.DELIVERED.value,
            "DELIVERED",
            "COMPLETED",
        ]
        if order.status not in eligible_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only completed or delivered orders can be reviewed. "
                    f"Current order status is '{order.status}'."
                ),
            )

        # 3. Duplicate check: Prevent multiple reviews on the same order
        existing = db.query(ShopReview).filter(ShopReview.order_id == order.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A review has already been submitted for this order.",
            )

        # Create review entity
        review = ShopReview(
            customer_id=customer.id,
            tailor_shop_id=order.tailor_shop_id,
            order_id=order.id,
            rating=payload.rating,
            comment=payload.comment.strip() if payload.comment else None,
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        # Recalculate tailor shop rating
        if review.tailor_shop:
            self._recalculate_shop_rating(db, review.tailor_shop)

        logger.info(
            f"Customer {customer.id} submitted {payload.rating}-star review for "
            f"Shop #{order.tailor_shop_id} on Order #{order.id}"
        )
        return self._to_review_response(review)

    def get_shop_reviews(
        self,
        db: Session,
        shop_id: int,
    ) -> ShopReviewSummaryResponse:
        """
        Public summary of customer reviews and rating breakdown for a tailor atelier.
        """
        shop = db.query(TailorShop).filter(TailorShop.id == shop_id).first()
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tailor shop ID {shop_id} not found.",
            )

        reviews = (
            db.query(ShopReview)
            .filter(ShopReview.tailor_shop_id == shop_id)
            .order_by(ShopReview.id.desc())
            .all()
        )

        breakdown = {str(i): 0 for i in range(1, 6)}
        for r in reviews:
            star_key = str(r.rating)
            if star_key in breakdown:
                breakdown[star_key] += 1

        avg_rating = (
            round(sum(r.rating for r in reviews) / len(reviews), 2)
            if reviews
            else float(shop.rating or 5.0)
        )

        return ShopReviewSummaryResponse(
            shop_id=shop.id,
            shop_name=shop.shop_name,
            average_rating=avg_rating,
            review_count=len(reviews),
            rating_breakdown=breakdown,
            reviews=[self._to_review_response(r) for r in reviews],
        )

    def get_order_review(
        self,
        db: Session,
        user: User,
        order_id: int,
    ) -> Optional[ReviewResponse]:
        """
        Retrieve existing review for a specific order.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )

        # Authorization check
        if user.role in ["CUSTOMER", "customer"] and order.customer_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view review details for this order.",
            )

        review = db.query(ShopReview).filter(ShopReview.order_id == order_id).first()
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No review has been posted for Order #{order_id}.",
            )

        return self._to_review_response(review)

    def update_review(
        self,
        db: Session,
        customer: User,
        review_id: int,
        payload: ReviewUpdate,
    ) -> ReviewResponse:
        """
        Allow customer to update their own review.
        """
        review = db.query(ShopReview).filter(ShopReview.id == review_id).first()
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review ID {review_id} not found.",
            )

        if review.customer_id != customer.id and customer.role not in ["ADMIN", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are only permitted to edit your own reviews.",
            )

        if payload.rating is not None:
            review.rating = payload.rating
        if payload.comment is not None:
            review.comment = payload.comment.strip()

        db.commit()
        db.refresh(review)

        if review.tailor_shop:
            self._recalculate_shop_rating(db, review.tailor_shop)

        return self._to_review_response(review)

    def delete_review(
        self,
        db: Session,
        user: User,
        review_id: int,
    ) -> Dict[str, str]:
        """
        Allow customer to delete their own review (or admin moderation).
        """
        review = db.query(ShopReview).filter(ShopReview.id == review_id).first()
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review ID {review_id} not found.",
            )

        if review.customer_id != user.id and user.role not in ["ADMIN", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are only permitted to remove your own reviews.",
            )

        shop = review.tailor_shop
        db.delete(review)
        db.commit()

        if shop:
            self._recalculate_shop_rating(db, shop)

        return {"status": "ok", "message": f"Review ID {review_id} successfully deleted."}


review_service = ReviewService()
