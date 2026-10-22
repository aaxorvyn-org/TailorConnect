import math
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer, CustomerNote
from app.models.user import User
from app.repositories.customer_repository import customer_repository
from app.schemas.customer import (
    CustomerCreate,
    CustomerDetailResponse,
    CustomerListResponse,
    CustomerNoteCreate,
    CustomerNoteResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.utils.logger import logger


class CustomerService:
    """
    Business logic and validation service for Tailor Customer Management.
    Enforces multi-tenant authorization so tailors can strictly access only their own clientele.
    """

    @staticmethod
    def _to_customer_response(customer: Customer) -> CustomerResponse:
        """
        Converts Customer entity to CustomerResponse with notes_count.
        """
        notes_count = len(customer.notes) if customer.notes else 0
        return CustomerResponse(
            id=customer.id,
            tailor_id=customer.tailor_id,
            shop_id=customer.shop_id,
            shop_name=customer.shop_name,
            full_name=customer.full_name,
            email=customer.email,
            phone=customer.phone,
            gender=customer.gender,
            address=customer.address,
            city=customer.city,
            state=customer.state,
            pincode=customer.pincode,
            postal_code=getattr(customer, "postal_code", None) or customer.pincode,
            country=getattr(customer, "country", None) or "India",
            country_code=getattr(customer, "country_code", None) or "IN",
            currency=getattr(customer, "currency", None) or "INR",
            preferred_contact_method=customer.preferred_contact_method,
            status=customer.status,
            total_orders=customer.total_orders,
            total_spend=customer.total_spend,
            notes_count=notes_count,
            created_at=customer.created_at,
            updated_at=customer.updated_at,
        )

    @staticmethod
    def _to_customer_detail_response(customer: Customer) -> CustomerDetailResponse:
        """
        Converts Customer entity to detailed CustomerDetailResponse with full notes list
        and order history preview (Phase 5).
        """
        notes_list = [
            CustomerNoteResponse.model_validate(note)
            for note in (customer.notes or [])
        ]

        # Phase 5: Orders are deferred to Phase 6. Return structured order history status.
        order_history: List[Dict[str, Any]] = []

        return CustomerDetailResponse(
            id=customer.id,
            tailor_id=customer.tailor_id,
            shop_id=customer.shop_id,
            shop_name=customer.shop_name,
            full_name=customer.full_name,
            email=customer.email,
            phone=customer.phone,
            gender=customer.gender,
            address=customer.address,
            city=customer.city,
            state=customer.state,
            pincode=customer.pincode,
            postal_code=getattr(customer, "postal_code", None) or customer.pincode,
            country=getattr(customer, "country", None) or "India",
            country_code=getattr(customer, "country_code", None) or "IN",
            currency=getattr(customer, "currency", None) or "INR",
            preferred_contact_method=customer.preferred_contact_method,
            status=customer.status,
            total_orders=customer.total_orders,
            total_spend=customer.total_spend,
            notes_count=len(notes_list),
            created_at=customer.created_at,
            updated_at=customer.updated_at,
            notes=notes_list,
            order_history=order_history,
        )

    def get_customer(self, db: Session, customer_id: int, current_user: User) -> CustomerDetailResponse:
        """
        Retrieves a single customer by ID, strictly enforcing tailor ownership.
        """
        customer = customer_repository.get_by_id_and_tailor(
            db, customer_id=customer_id, tailor_id=current_user.id
        )
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} was not found in your atelier records.",
            )
        return self._to_customer_detail_response(customer)

    def list_customers(
        self,
        db: Session,
        current_user: User,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> CustomerListResponse:
        """
        Lists paginated customers for the authenticated tailor with search and status filter.
        """
        if page < 1:
            page = 1
        if limit < 1:
            limit = 10
        if limit > 100:
            limit = 100

        skip = (page - 1) * limit
        items, total = customer_repository.list_for_tailor(
            db,
            tailor_id=current_user.id,
            search=search,
            status=status_filter,
            skip=skip,
            limit=limit,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1

        return CustomerListResponse(
            items=[self._to_customer_response(item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    def create_customer(
        self,
        db: Session,
        current_user: User,
        customer_in: CustomerCreate,
    ) -> CustomerDetailResponse:
        """
        Creates a new customer for the authenticated tailor atelier.
        """
        # Validate full_name
        if not customer_in.full_name or not customer_in.full_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer full name is required.",
            )

        # Validate duplicate email under the same tailor (if email provided)
        if customer_in.email:
            existing = (
                db.query(Customer)
                .filter(
                    Customer.tailor_id == current_user.id,
                    Customer.email == customer_in.email.strip().lower(),
                )
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A customer with email '{customer_in.email}' is already registered in your atelier.",
                )

        customer = customer_repository.create_customer(
            db,
            tailor_id=current_user.id,
            customer_in=customer_in,
            shop_id=None,
            shop_name=current_user.shop_name,
        )
        logger.info(
            f"Tailor {current_user.id} ({current_user.email}) added patron '{customer.full_name}' (ID: {customer.id})"
        )
        return self._to_customer_detail_response(customer)

    def update_customer(
        self,
        db: Session,
        customer_id: int,
        current_user: User,
        customer_in: CustomerUpdate,
    ) -> CustomerDetailResponse:
        """
        Updates an existing customer belonging to the authenticated tailor.
        """
        customer = customer_repository.get_by_id_and_tailor(
            db, customer_id=customer_id, tailor_id=current_user.id
        )
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} was not found in your atelier records.",
            )

        # If email is updated, check for duplicate within this tailor
        if customer_in.email and customer_in.email.strip().lower() != (customer.email or "").lower():
            existing = (
                db.query(Customer)
                .filter(
                    Customer.tailor_id == current_user.id,
                    Customer.id != customer_id,
                    Customer.email == customer_in.email.strip().lower(),
                )
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Another customer with email '{customer_in.email}' already exists in your atelier.",
                )

        updated_customer = customer_repository.update_customer(
            db, customer=customer, customer_in=customer_in
        )
        logger.info(
            f"Tailor {current_user.id} updated patron '{updated_customer.full_name}' (ID: {updated_customer.id})"
        )
        return self._to_customer_detail_response(updated_customer)

    def delete_customer(
        self,
        db: Session,
        customer_id: int,
        current_user: User,
    ) -> Dict[str, Any]:
        """
        Deletes a customer belonging to the authenticated tailor.
        """
        customer = customer_repository.get_by_id_and_tailor(
            db, customer_id=customer_id, tailor_id=current_user.id
        )
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} was not found in your atelier records.",
            )

        name = customer.full_name
        customer_repository.delete_customer(db, customer=customer)
        logger.info(
            f"Tailor {current_user.id} deleted patron '{name}' (ID: {customer_id})"
        )
        return {
            "success": True,
            "message": f"Patron '{name}' deleted successfully.",
            "id": customer_id,
        }

    def add_customer_note(
        self,
        db: Session,
        customer_id: int,
        current_user: User,
        note_in: CustomerNoteCreate,
    ) -> CustomerNoteResponse:
        """
        Stores a new note for a customer belonging to the authenticated tailor.
        """
        customer = customer_repository.get_by_id_and_tailor(
            db, customer_id=customer_id, tailor_id=current_user.id
        )
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} was not found in your atelier records.",
            )

        note = customer_repository.add_note(
            db,
            customer_id=customer_id,
            tailor_id=current_user.id,
            note_in=note_in,
        )
        logger.info(
            f"Tailor {current_user.id} added note to customer {customer_id} (Note ID: {note.id})"
        )
        return CustomerNoteResponse.model_validate(note)

    def list_customer_notes(
        self,
        db: Session,
        customer_id: int,
        current_user: User,
    ) -> List[CustomerNoteResponse]:
        """
        Lists all notes for a customer belonging to the authenticated tailor.
        """
        customer = customer_repository.get_by_id_and_tailor(
            db, customer_id=customer_id, tailor_id=current_user.id
        )
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} was not found in your atelier records.",
            )

        notes = customer_repository.get_notes(
            db, customer_id=customer_id, tailor_id=current_user.id
        )
        return [CustomerNoteResponse.model_validate(n) for n in notes]

    def delete_customer_note(
        self,
        db: Session,
        customer_id: int,
        note_id: int,
        current_user: User,
    ) -> Dict[str, Any]:
        """
        Deletes a customer note belonging to the authenticated tailor.
        """
        success = customer_repository.delete_note(
            db,
            note_id=note_id,
            customer_id=customer_id,
            tailor_id=current_user.id,
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {note_id} not found for this customer.",
            )

        logger.info(f"Tailor {current_user.id} deleted note {note_id}")
        return {
            "success": True,
            "message": "Note deleted successfully.",
            "id": note_id,
        }

    def seed_demo_customers_for_tailor(self, db: Session, tailor_id: int, shop_name: Optional[str] = None) -> None:
        """
        Seeds initial demo customers and notes for a tailor if they currently have no customers.
        """
        count = db.query(Customer).filter(Customer.tailor_id == tailor_id).count()
        if count > 0:
            return

        demo_customers = [
            {
                "full_name": "Aarav Sharma",
                "email": "aarav.sharma@mumbaicouture.in",
                "phone": "+91 98765 43210",
                "gender": "Male",
                "address": "104 Marine Drive, Nariman Point",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "postal_code": "400001",
                "country": "India",
                "country_code": "IN",
                "currency": "INR",
                "preferred_contact_method": "WHATSAPP",
                "status": "ACTIVE",
                "total_orders": 3,
                "total_spend": 85000.0,
                "notes": [
                    ("Prefers pure Banarasi raw silk and hand zardozi detailing for sherwani.", "FABRIC"),
                    ("Requested trial fitting on Saturday afternoon.", "FITTING"),
                ],
            },
            {
                "full_name": "Alexander Hayes",
                "email": "alexander.hayes@mayfair.co.uk",
                "phone": "+44 20 7946 0912",
                "gender": "Male",
                "address": "42 Grosvenor Square, Mayfair",
                "city": "London",
                "state": "Greater London",
                "pincode": "W1K 2HP",
                "postal_code": "W1K 2HP",
                "country": "United Kingdom",
                "country_code": "GB",
                "currency": "GBP",
                "preferred_contact_method": "EMAIL",
                "status": "ACTIVE",
                "total_orders": 4,
                "total_spend": 3450.0,
                "notes": [
                    ("Prefers Holland & Sherry Super 150s wool. Slanted pockets requested on dinner jackets.", "PREFERENCE"),
                    ("Initial bespoke suit fitting scheduled for next Thursday 11am.", "FITTING"),
                ],
            },
            {
                "full_name": "Sophia Montgomery",
                "email": "sophia.m@kensington.com",
                "phone": "+44 20 7946 0843",
                "gender": "Female",
                "address": "18 Kensington Palace Gardens",
                "city": "London",
                "state": "Greater London",
                "pincode": "W8 4QP",
                "postal_code": "W8 4QP",
                "country": "United Kingdom",
                "country_code": "GB",
                "currency": "GBP",
                "preferred_contact_method": "PHONE",
                "status": "ACTIVE",
                "total_orders": 2,
                "total_spend": 1850.0,
                "notes": [
                    ("Requested Italian silk lining in midnight sapphire.", "FABRIC"),
                    ("Prefers phone calls over text message for fittings.", "GENERAL"),
                ],
            },
            {
                "full_name": "Marcus Sterling",
                "email": "sterling.marcus@cityfinance.com",
                "phone": "+44 20 7946 0321",
                "gender": "Male",
                "address": "88 Leadenhall Street, City",
                "city": "London",
                "state": "Greater London",
                "pincode": "EC3A 3BP",
                "postal_code": "EC3A 3BP",
                "country": "United Kingdom",
                "country_code": "GB",
                "currency": "GBP",
                "preferred_contact_method": "WHATSAPP",
                "status": "ACTIVE",
                "total_orders": 1,
                "total_spend": 310.0,
                "notes": [
                    ("Trousers taper preference: 17cm leg opening with 4cm cuffs.", "PREFERENCE"),
                ],
            },
            {
                "full_name": "Sir Charles Thornton",
                "email": "thornton.charles@heritage.org",
                "phone": "+44 20 7946 0777",
                "gender": "Male",
                "address": "12 St James's Place",
                "city": "London",
                "state": "Greater London",
                "pincode": "SW1A 1NP",
                "postal_code": "SW1A 1NP",
                "country": "United Kingdom",
                "country_code": "GB",
                "currency": "GBP",
                "preferred_contact_method": "EMAIL",
                "status": "ACTIVE",
                "total_orders": 6,
                "total_spend": 5900.0,
                "notes": [
                    ("VIP Patron. Hand-stitched horn buttons and monogrammed collar felt (CT).", "URGENT"),
                    ("Heavy Scottish tweed specialist commissions.", "FABRIC"),
                ],
            },
        ]

        for item in demo_customers:
            notes_data = item.pop("notes", [])
            cust = Customer(
                tailor_id=tailor_id,
                shop_name=shop_name,
                **item,
            )
            db.add(cust)
            db.flush()

            for note_text, cat in notes_data:
                db_note = CustomerNote(
                    customer_id=cust.id,
                    tailor_id=tailor_id,
                    note=note_text,
                    category=cat,
                )
                db.add(db_note)

        db.commit()
        logger.info(f"Seeded demo patrons for Tailor ID {tailor_id}")


customer_service = CustomerService()
