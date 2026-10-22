from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.utils.international import (
    SUPPORTED_COUNTRIES,
    SUPPORTED_CURRENCIES,
    validate_international_address,
    validate_international_phone,
    find_country,
    get_currency_config,
)

router = APIRouter()


class PhoneValidationRequest(BaseModel):
    phone: str = Field(..., description="Phone number to validate")
    country_code: Optional[str] = Field(None, description="Optional ISO country code (e.g. IN, US, GB)")


class PhoneValidationResponse(BaseModel):
    is_valid: bool
    normalized_phone: Optional[str] = None
    country_code: Optional[str] = None
    country_name: Optional[str] = None
    error_message: Optional[str] = None


class AddressValidationRequest(BaseModel):
    full_name: str
    phone: str
    address_line_1: str
    city: str
    state: str
    country: str
    pincode: str
    country_code: Optional[str] = None


class AddressValidationResponse(BaseModel):
    is_valid: bool
    validated_address: Optional[Dict[str, Any]] = None
    country_name: Optional[str] = None
    country_code: Optional[str] = None
    error_message: Optional[str] = None


@router.get(
    "/countries",
    response_model=List[Dict[str, Any]],
    summary="List supported international countries",
    description="Returns global jurisdictions with dialing codes, currency defaults, and postal code requirements.",
)
def list_countries() -> List[Dict[str, Any]]:
    return SUPPORTED_COUNTRIES


@router.get(
    "/currencies",
    response_model=List[Dict[str, Any]],
    summary="List supported international billing currencies",
    description="Returns international currencies with symbols, exchange rates, and delivery fees.",
)
def list_currencies() -> List[Dict[str, Any]]:
    return SUPPORTED_CURRENCIES


@router.post(
    "/validate-phone",
    response_model=PhoneValidationResponse,
    summary="Validate international phone number",
)
def validate_phone(payload: PhoneValidationRequest) -> PhoneValidationResponse:
    try:
        normalized = validate_international_phone(
            phone=payload.phone,
            country_code=payload.country_code,
        )
        c_cfg = find_country(payload.country_code)
        return PhoneValidationResponse(
            is_valid=True,
            normalized_phone=normalized,
            country_code=c_cfg["code"] if c_cfg else None,
            country_name=c_cfg["name"] if c_cfg else None,
        )
    except HTTPException as exc:
        return PhoneValidationResponse(
            is_valid=False,
            normalized_phone=None,
            error_message=exc.detail,
        )
    except Exception as exc:
        return PhoneValidationResponse(
            is_valid=False,
            normalized_phone=None,
            error_message=str(exc),
        )


@router.post(
    "/validate-address",
    response_model=AddressValidationResponse,
    summary="Validate international shipping destination",
)
def validate_address(payload: AddressValidationRequest) -> AddressValidationResponse:
    try:
        validated = validate_international_address(
            full_name=payload.full_name,
            phone=payload.phone,
            address_line_1=payload.address_line_1,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            pincode=payload.pincode,
            country_code=payload.country_code,
        )
        return AddressValidationResponse(
            is_valid=True,
            validated_address=validated,
            country_name=validated.get("country"),
            country_code=validated.get("country_code"),
        )
    except HTTPException as exc:
        return AddressValidationResponse(
            is_valid=False,
            validated_address=None,
            error_message=exc.detail,
        )
    except Exception as exc:
        return AddressValidationResponse(
            is_valid=False,
            validated_address=None,
            error_message=str(exc),
        )
