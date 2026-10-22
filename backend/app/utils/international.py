"""
International customer support utility module.
Provides:
1. Supported countries catalog with dialing codes, currencies, and postal formats.
2. Supported currencies catalog with exchange rates and delivery fee tiers.
3. Phone number validation (E.164 international and domestic formats).
4. International address validation supporting India and global jurisdictions.
"""

import re
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

SUPPORTED_COUNTRIES: List[Dict[str, Any]] = [
    {
        "code": "IN",
        "name": "India",
        "dial_code": "+91",
        "currency": "INR",
        "currency_symbol": "₹",
        "postal_label": "PIN Code",
        "postal_placeholder": "110001",
        "postal_regex": r"^\d{6}$",
    },
    {
        "code": "US",
        "name": "United States",
        "dial_code": "+1",
        "currency": "USD",
        "currency_symbol": "$",
        "postal_label": "ZIP Code",
        "postal_placeholder": "90210",
        "postal_regex": r"^\d{5}(-\d{4})?$",
    },
    {
        "code": "GB",
        "name": "United Kingdom",
        "dial_code": "+44",
        "currency": "GBP",
        "currency_symbol": "£",
        "postal_label": "Postcode",
        "postal_placeholder": "W1S 3JN",
        "postal_regex": r"^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$",
    },
    {
        "code": "AE",
        "name": "United Arab Emirates",
        "dial_code": "+971",
        "currency": "AED",
        "currency_symbol": "AED",
        "postal_label": "Area / PO Box",
        "postal_placeholder": "00000",
        "postal_regex": r"^[A-Za-z0-9\s\-]{3,10}$",
    },
    {
        "code": "CA",
        "name": "Canada",
        "dial_code": "+1",
        "currency": "CAD",
        "currency_symbol": "C$",
        "postal_label": "Postal Code",
        "postal_placeholder": "M5V 2T6",
        "postal_regex": r"^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$",
    },
    {
        "code": "AU",
        "name": "Australia",
        "dial_code": "+61",
        "currency": "AUD",
        "currency_symbol": "A$",
        "postal_label": "Postal Code",
        "postal_placeholder": "2000",
        "postal_regex": r"^\d{4}$",
    },
    {
        "code": "SG",
        "name": "Singapore",
        "dial_code": "+65",
        "currency": "SGD",
        "currency_symbol": "S$",
        "postal_label": "Postal Code",
        "postal_placeholder": "238858",
        "postal_regex": r"^\d{6}$",
    },
    {
        "code": "DE",
        "name": "Germany",
        "dial_code": "+49",
        "currency": "EUR",
        "currency_symbol": "€",
        "postal_label": "Postal Code (PLZ)",
        "postal_placeholder": "10115",
        "postal_regex": r"^\d{5}$",
    },
    {
        "code": "FR",
        "name": "France",
        "dial_code": "+33",
        "currency": "EUR",
        "currency_symbol": "€",
        "postal_label": "Code Postal",
        "postal_placeholder": "75001",
        "postal_regex": r"^\d{5}$",
    },
]

COUNTRY_BY_CODE: Dict[str, Dict[str, Any]] = {c["code"]: c for c in SUPPORTED_COUNTRIES}
COUNTRY_BY_NAME: Dict[str, Dict[str, Any]] = {c["name"].lower(): c for c in SUPPORTED_COUNTRIES}

SUPPORTED_CURRENCIES: List[Dict[str, Any]] = [
    {
        "code": "INR",
        "name": "Indian Rupee",
        "symbol": "₹",
        "exchange_rate_from_usd": 83.50,
        "standard_delivery_fee": 60.00,
    },
    {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "exchange_rate_from_usd": 1.00,
        "standard_delivery_fee": 15.00,
    },
    {
        "code": "GBP",
        "name": "British Pound",
        "symbol": "£",
        "exchange_rate_from_usd": 0.79,
        "standard_delivery_fee": 12.00,
    },
    {
        "code": "EUR",
        "name": "Euro",
        "symbol": "€",
        "exchange_rate_from_usd": 0.92,
        "standard_delivery_fee": 14.00,
    },
    {
        "code": "AED",
        "name": "UAE Dirham",
        "symbol": "AED",
        "exchange_rate_from_usd": 3.67,
        "standard_delivery_fee": 55.00,
    },
    {
        "code": "CAD",
        "name": "Canadian Dollar",
        "symbol": "C$",
        "exchange_rate_from_usd": 1.36,
        "standard_delivery_fee": 20.00,
    },
    {
        "code": "AUD",
        "name": "Australian Dollar",
        "symbol": "A$",
        "exchange_rate_from_usd": 1.52,
        "standard_delivery_fee": 22.00,
    },
    {
        "code": "SGD",
        "name": "Singapore Dollar",
        "symbol": "S$",
        "exchange_rate_from_usd": 1.34,
        "standard_delivery_fee": 20.00,
    },
]

CURRENCY_BY_CODE: Dict[str, Dict[str, Any]] = {c["code"]: c for c in SUPPORTED_CURRENCIES}


def find_country(identifier: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Finds country config by 2-letter code or country name.
    """
    if not identifier:
        return None
    cleaned = identifier.strip()
    if len(cleaned) == 2 and cleaned.upper() in COUNTRY_BY_CODE:
        return COUNTRY_BY_CODE[cleaned.upper()]
    return COUNTRY_BY_NAME.get(cleaned.lower())


def validate_international_phone(phone: Optional[str], country_code: Optional[str] = None) -> str:
    """
    Validates international or domestic phone numbers.
    Supports:
    - E.164 international format (+919876543210, +14155552671, +442079460912)
    - Domestic Indian 10-digit format (9876543210 or 09876543210)
    - Formatted international numbers with spaces/hyphens (+91 98765 43210)
    """
    if not phone or not phone.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required.",
        )

    raw = phone.strip()
    # Normalize by removing common formatting characters (spaces, dashes, parentheses, dots)
    normalized = re.sub(r"[\s\-\(\)\.]", "", raw)

    # 1. Check Indian 10-digit mobile pattern
    if re.match(r"^[6-9]\d{9}$", normalized):
        return f"+91{normalized}"
    if re.match(r"^0[6-9]\d{9}$", normalized):
        return f"+91{normalized[1:]}"

    # 2. Check international E.164 pattern
    if not normalized.startswith("+"):
        # If country code is provided, prepend dial code
        country_cfg = find_country(country_code)
        if country_cfg:
            dial = country_cfg["dial_code"]
            normalized = f"{dial}{normalized}"
        else:
            normalized = f"+{normalized}"

    # Verify E.164 pattern: + followed by 7 to 15 digits
    if not re.match(r"^\+[1-9]\d{6,14}$", normalized):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid phone number '{raw}'. "
                "Must include country code (e.g. +91 98765 43210, +1 415 555 2671, or +44 20 7946 0912)."
            ),
        )

    return normalized


def validate_international_postal_code(postal_code: str, country_name_or_code: str) -> str:
    """
    Validates postal code / PIN code against country-specific rules.
    """
    cleaned = postal_code.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Postal / PIN code cannot be empty.",
        )

    country_cfg = find_country(country_name_or_code)
    if country_cfg and "postal_regex" in country_cfg:
        pattern = country_cfg["postal_regex"]
        if not re.match(pattern, cleaned, re.IGNORECASE):
            label = country_cfg["postal_label"]
            placeholder = country_cfg["postal_placeholder"]
            country_name = country_cfg["name"]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {label} '{cleaned}' for {country_name}. Example format: {placeholder}",
            )
    else:
        # Generic international postal code check (3 to 12 alphanumeric characters)
        if not re.match(r"^[A-Za-z0-9\s\-]{3,12}$", cleaned):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid international postal code format '{cleaned}'.",
            )

    return cleaned


def validate_international_address(
    full_name: str,
    phone: str,
    address_line_1: str,
    city: str,
    state: str,
    country: str,
    pincode: str,
    country_code: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Comprehensive validator for made-to-measure order delivery destinations.
    Enforces required fields, international phone format, and postal format.
    """
    fn = full_name.strip()
    if len(fn) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient full name must contain at least 2 characters.",
        )

    addr1 = address_line_1.strip()
    if len(addr1) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Address line 1 must contain at least 3 characters.",
        )

    c_city = city.strip()
    if len(c_city) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="City must contain at least 2 characters.",
        )

    c_country = country.strip()
    if len(c_country) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Country must contain at least 2 characters.",
        )

    # Resolve country configuration
    matched_country = None
    if c_country and c_country.lower() != "india":
        matched_country = find_country(c_country)
    if not matched_country and country_code and country_code.upper() != "IN":
        matched_country = find_country(country_code)
    if not matched_country:
        matched_country = find_country(c_country) or find_country(country_code)

    resolved_country_name = matched_country["name"] if matched_country else c_country
    resolved_country_code = matched_country["code"] if matched_country else (country_code or "IN")

    # Validate phone
    normalized_phone = validate_international_phone(phone, country_code=resolved_country_code)

    # Validate postal code
    validated_postal = validate_international_postal_code(pincode, resolved_country_name)

    return {
        "full_name": fn,
        "phone": normalized_phone,
        "address_line_1": addr1,
        "city": c_city,
        "state": state.strip(),
        "country": resolved_country_name,
        "country_code": resolved_country_code,
        "pincode": validated_postal,
        "postal_code": validated_postal,
    }


def get_currency_config(currency_code: Optional[str]) -> Dict[str, Any]:
    """
    Returns currency configuration. Defaults to INR if not specified or unknown.
    """
    if not currency_code:
        return CURRENCY_BY_CODE["INR"]
    code_upper = currency_code.strip().upper()
    return CURRENCY_BY_CODE.get(code_upper, CURRENCY_BY_CODE["INR"])


def calculate_pricing_for_currency(
    base_unit_price: float,
    quantity: int,
    target_currency: str = "INR",
    is_local: bool = True,
) -> Dict[str, float]:
    """
    Calculates item subtotal, delivery fee, GST (5% for tailoring job work), and total amount.
    For INR / India, catalog prices are in INR directly.
    """
    cfg = get_currency_config(target_currency)
    curr = (target_currency or "INR").upper()

    if curr == "INR":
        converted_unit_price = round(base_unit_price, 2)
        delivery_charge = 60.0 if is_local else 100.0
    else:
        rate = cfg.get("exchange_rate_from_usd", 1.0)
        base = (base_unit_price / 83.5) if base_unit_price > 100 else base_unit_price
        converted_unit_price = round(base * rate, 2)
        delivery_charge = float(cfg.get("standard_delivery_fee", 15.0))

    subtotal = round(converted_unit_price * quantity, 2)
    gst = round(subtotal * 0.05, 2) if curr == "INR" else 0.0
    total_amount = round(subtotal + delivery_charge + gst, 2)

    return {
        "unit_price": converted_unit_price,
        "subtotal": subtotal,
        "delivery_charge": delivery_charge,
        "gst": gst,
        "total_amount": total_amount,
        "currency": cfg["code"],
        "currency_symbol": cfg["symbol"],
    }

