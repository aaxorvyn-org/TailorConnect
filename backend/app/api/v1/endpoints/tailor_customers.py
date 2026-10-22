from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_tailor
from app.database.session import get_db
from app.models.user import User
from app.schemas.customer import (
    CustomerCreate,
    CustomerDetailResponse,
    CustomerListResponse,
    CustomerNoteCreate,
    CustomerNoteResponse,
    CustomerUpdate,
)
from app.services.customer_service import customer_service

router = APIRouter()


@router.post(
    "",
    response_model=CustomerDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new patron customer",
    description="Creates a new customer profile belonging exclusively to the authenticated tailor atelier.",
)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_tailor: User = Depends(require_tailor),
) -> CustomerDetailResponse:
    """
    Creates a new customer record under the tailor's atelier.
    Includes optional initial note support.
    """
    return customer_service.create_customer(
        db=db,
        current_user=current_tailor,
        customer_in=customer_in,
    )


@router.get(
    "",
    response_model=CustomerListResponse,
    status_code=status.HTTP_200_OK,
    summary="List atelier customers",
    description="Retrieves a paginated list of customers belonging to the authenticated tailor atelier with search and filtering.",
)
def list_customers(
    search: Optional[str] = Query(
        None, description="Search across customer full name, email, phone, and city"
    ),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status ('ACTIVE', 'INACTIVE')"
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
    current_tailor: User = Depends(require_tailor),
) -> CustomerListResponse:
    """
    Lists paginated customers for the authenticated tailor atelier.
    Enforces multi-tenant scoping: only returns customers belonging to the current tailor.
    """
    # Seed demo patrons for default master tailor if no records exist yet
    customer_service.seed_demo_customers_for_tailor(
        db, tailor_id=current_tailor.id, shop_name=current_tailor.shop_name
    )

    return customer_service.list_customers(
        db=db,
        current_user=current_tailor,
        search=search,
        status_filter=status_filter,
        page=page,
        limit=limit,
    )


@router.get(
    "/{id}",
    response_model=CustomerDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get customer profile details",
    description="Retrieves detailed profile, notes history, and order history for a single customer belonging to the tailor.",
)
def get_customer(
    id: int,
    db: Session = Depends(get_db),
    current_tailor: User = Depends(require_tailor),
) -> CustomerDetailResponse:
    """
    Retrieves a single customer profile by ID.
    Raises 404 if not found or if the customer belongs to another tailor.
    """
    return customer_service.get_customer(
        db=db, customer_id=id, current_user=current_tailor
    )


@router.put(
    "/{id}",
    response_model=CustomerDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Edit customer profile",
    description="Updates existing customer details. Validates inputs and enforces tailor ownership.",
)
def update_customer(
    id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_tailor: User = Depends(require_tailor),
) -> CustomerDetailResponse:
    """
    Updates patron information for the specified customer ID.
    Raises 404 if not found or unauthorized.
    """
    return customer_service.update_customer(
        db=db,
        customer_id=id,
        current_user=current_tailor,
        customer_in=customer_in,
    )


@router.delete(
    "/{id}",
    status_code=status.HTTP_200_OK,
    summary="Delete customer profile",
    description="Deletes a customer and cascade deletes all associated atelier notes.",
)
def delete_customer(
    id: int,
    db: Session = Depends(get_db),
    current_tailor: User = Depends(require_tailor),
) -> Dict[str, Any]:
    """
    Permanently deletes a patron from the atelier directory.
    Enforces tenant ownership.
    """
    return customer_service.delete_customer(
        db=db, customer_id=id, current_user=current_tailor
    )


# --- Customer Notes Sub-Endpoints ---


@router.post(
    "/{id}/notes",
    response_model=CustomerNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an atelier note to customer",
    description="Stores a new atelier note or fitting observation for the customer.",
)
def add_customer_note(
    id: int,
    note_in: CustomerNoteCreate,
    db: Session = Depends(get_db),
    current_tailor: User = Depends(require_tailor),
) -> CustomerNoteResponse:
    """
    Appends a new note to the customer's atelier file.
    """
    return customer_service.add_customer_note(
        db=db,
        customer_id=id,
        current_user=current_tailor,
        note_in=note_in,
    )


@router.get(
    "/{id}/notes",
    response_model=List[CustomerNoteResponse],
    status_code=status.HTTP_200_OK,
    summary="List customer notes",
    description="Retrieves chronological notes recorded for this customer.",
)
def list_customer_notes(
    id: int,
    db: Session = Depends(get_db),
    current_tailor: User = Depends(require_tailor),
) -> List[CustomerNoteResponse]:
    """
    Retrieves all atelier notes for this customer.
    """
    return customer_service.list_customer_notes(
        db=db, customer_id=id, current_user=current_tailor
    )


@router.delete(
    "/{id}/notes/{note_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete customer note",
    description="Removes a specific atelier note from the customer's file.",
)
def delete_customer_note(
    id: int,
    note_id: int,
    db: Session = Depends(get_db),
    current_tailor: User = Depends(require_tailor),
) -> Dict[str, Any]:
    """
    Removes the specified note.
    """
    return customer_service.delete_customer_note(
        db=db,
        customer_id=id,
        note_id=note_id,
        current_user=current_tailor,
    )
