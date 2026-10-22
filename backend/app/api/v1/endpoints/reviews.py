from typing import Dict, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_customer
from app.database.session import get_db
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewResponse,
    ReviewUpdate,
    ShopReviewSummaryResponse,
)
from app.services.review_service import review_service

router = APIRouter()


@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a customer review for a completed order",
)
def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """
    Submit a 1-5 star rating and optional commentary.
    Enforces authorization: Only the customer with a completed order may review.
    Enforces uniqueness: Strictly 1 review per completed order.
    """
    return review_service.create_review(
        db=db,
        customer=current_user,
        payload=payload,
    )


@router.get(
    "/shop/{shop_id}",
    response_model=ShopReviewSummaryResponse,
    summary="Get public customer reviews for a tailor atelier",
)
def get_shop_reviews(
    shop_id: int,
    db: Session = Depends(get_db),
) -> ShopReviewSummaryResponse:
    """
    Retrieves aggregated rating, star distribution, and verified customer reviews.
    Publicly accessible to help customers evaluate artisan workshops.
    """
    return review_service.get_shop_reviews(db=db, shop_id=shop_id)


@router.get(
    "/order/{order_id}",
    response_model=ReviewResponse,
    summary="Get customer review for a specific order",
)
def get_order_review(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """
    Fetches the review submitted for an order.
    """
    return review_service.get_order_review(
        db=db,
        user=current_user,
        order_id=order_id,
    )


@router.put(
    "/{id}",
    response_model=ReviewResponse,
    summary="Edit an existing customer review",
)
def update_review(
    id: int,
    payload: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """
    Updates star rating or comment for a previously submitted review.
    Enforces customer ownership.
    """
    return review_service.update_review(
        db=db,
        customer=current_user,
        review_id=id,
        payload=payload,
    )


@router.delete(
    "/{id}",
    summary="Delete a customer review",
)
def delete_review(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """
    Removes a review and updates the tailor shop's average rating.
    Enforces customer ownership.
    """
    return review_service.delete_review(
        db=db,
        user=current_user,
        review_id=id,
    )
