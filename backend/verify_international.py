import sys
import os

# Set working directory to backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_international_verification():
    print("=" * 70)
    print("STARTING INTERNATIONAL CUSTOMER SUPPORT E2E VERIFICATION")
    print("=" * 70)

    client = TestClient(app)
    client.__enter__()

    # -------------------------------------------------------------------------
    # TEST 1: Country Catalog API
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Testing GET /api/international/countries...")
    res = client.get("/api/international/countries")
    assert res.status_code == 200, f"Failed getting countries: {res.text}"
    countries = res.json()
    assert len(countries) >= 7, f"Expected at least 7 countries, got {len(countries)}"
    
    country_codes = {c["code"] for c in countries}
    for expected_code in ["IN", "US", "GB", "AE", "CA", "AU"]:
        assert expected_code in country_codes, f"Missing country code {expected_code}"
    
    india = next(c for c in countries if c["code"] == "IN")
    assert india["name"] == "India"
    assert india["dial_code"] == "+91"
    assert india["currency"] == "INR"
    assert india["postal_label"] == "PIN Code"
    print(f"  [OK] Successfully retrieved {len(countries)} supported countries.")

    # -------------------------------------------------------------------------
    # TEST 2: Currency Catalog API
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Testing GET /api/international/currencies...")
    res = client.get("/api/international/currencies")
    assert res.status_code == 200, f"Failed getting currencies: {res.text}"
    currencies = res.json()
    currency_codes = {c["code"] for c in currencies}
    for expected_curr in ["INR", "USD", "GBP", "EUR", "AED"]:
        assert expected_curr in currency_codes, f"Missing currency {expected_curr}"

    inr_cfg = next(c for c in currencies if c["code"] == "INR")
    assert inr_cfg["symbol"] == "₹"
    assert inr_cfg["exchange_rate_from_usd"] > 1.0
    assert inr_cfg["standard_delivery_fee"] == 350.0
    print(f"  [OK] Successfully retrieved {len(currencies)} supported billing currencies.")

    # -------------------------------------------------------------------------
    # TEST 3: Phone Validation API
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Testing POST /api/international/validate-phone...")
    
    # 3a. Domestic Indian 10-digit mobile
    res = client.post("/api/international/validate-phone", json={"phone": "9876543210", "country_code": "IN"})
    assert res.status_code == 200, f"Phone validation failed: {res.text}"
    assert res.json()["is_valid"] is True
    assert res.json()["normalized_phone"] == "+919876543210"

    # 3b. UK E.164 phone
    res = client.post("/api/international/validate-phone", json={"phone": "+44 20 7946 0912", "country_code": "GB"})
    assert res.status_code == 200
    assert res.json()["is_valid"] is True
    assert res.json()["normalized_phone"] == "+442079460912"

    # 3c. US E.164 phone
    res = client.post("/api/international/validate-phone", json={"phone": "+1 (415) 555-2671", "country_code": "US"})
    assert res.status_code == 200
    assert res.json()["is_valid"] is True
    assert res.json()["normalized_phone"] == "+14155552671"

    # 3d. Rejection of invalid phone
    res = client.post("/api/international/validate-phone", json={"phone": "123", "country_code": "US"})
    assert res.status_code == 200
    assert res.json()["is_valid"] is False
    assert "Invalid phone number" in res.json()["error_message"]
    print("  [OK] International phone normalization and validation passed.")

    # -------------------------------------------------------------------------
    # TEST 4: Address Validation API
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Testing POST /api/international/validate-address...")
    
    # 4a. Valid Indian Address
    res = client.post("/api/international/validate-address", json={
        "full_name": "Aarav Sharma",
        "phone": "+91 98765 43210",
        "address_line_1": "Flat 8B, Sea View Tower, Marine Drive",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "country_code": "IN",
        "pincode": "400021"
    })
    assert res.status_code == 200, f"Address validation failed: {res.text}"
    assert res.json()["is_valid"] is True
    assert res.json()["country_name"] == "India"

    # 4b. Valid UK Address
    res = client.post("/api/international/validate-address", json={
        "full_name": "Alexander Hayes",
        "phone": "+44 20 7946 0912",
        "address_line_1": "14 Savile Row",
        "city": "London",
        "state": "Greater London",
        "country": "United Kingdom",
        "country_code": "GB",
        "pincode": "W1S 3JN"
    })
    assert res.status_code == 200
    assert res.json()["is_valid"] is True
    assert res.json()["country_name"] == "United Kingdom"

    # 4c. Reject invalid Indian PIN code
    res = client.post("/api/international/validate-address", json={
        "full_name": "Invalid Patron",
        "phone": "+91 98765 43210",
        "address_line_1": "123 MG Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "country_code": "IN",
        "pincode": "5600" # Invalid: only 4 digits
    })
    assert res.status_code == 200
    assert res.json()["is_valid"] is False
    assert "Invalid PIN Code" in res.json()["error_message"]
    print("  [OK] Address validation endpoint accurately verifies international formats.")

    # -------------------------------------------------------------------------
    # TEST 5: Authentication & Tailor Customer Management
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Testing Tailor Patron Management with International Support...")
    login_res = client.post("/api/auth/login", json={"email": "master.vance@vanceatelier.com", "password": "Password123"})
    assert login_res.status_code == 200, f"Tailor login failed: {login_res.text}"
    tailor_token = login_res.json()["access_token"]
    tailor_headers = {"Authorization": f"Bearer {tailor_token}"}

    # 5a. Create international customer
    import time
    ts = int(time.time())
    new_cust_payload = {
        "full_name": "Lady Eleanor Vance",
        "email": f"eleanor.vance.{ts}@mayfair.co.uk",
        "phone": "+44 20 7946 0888",
        "gender": "Female",
        "address": "45 Grosvenor Square",
        "city": "London",
        "state": "Greater London",
        "pincode": "W1K 2HP",
        "country": "United Kingdom",
        "country_code": "GB",
        "currency": "GBP",
        "preferred_contact_method": "EMAIL",
        "status": "ACTIVE",
        "initial_note": "Prefers lightweight worsted wool and horn buttons.",
        "note_category": "FABRIC"
    }
    create_cust_res = client.post("/api/tailors/customers", json=new_cust_payload, headers=tailor_headers)
    assert create_cust_res.status_code == 201, f"Failed creating customer: {create_cust_res.text}"
    created_cust = create_cust_res.json()
    assert created_cust["country"] == "United Kingdom"
    assert created_cust["country_code"] == "GB"
    assert created_cust["currency"] == "GBP"
    cust_id = created_cust["id"]

    # 5b. Retrieve patron profile
    get_cust_res = client.get(f"/api/tailors/customers/{cust_id}", headers=tailor_headers)
    assert get_cust_res.status_code == 200
    assert get_cust_res.json()["country"] == "United Kingdom"
    assert get_cust_res.json()["currency"] == "GBP"

    # 5c. Search patrons by international country
    search_res = client.get("/api/tailors/customers?search=London", headers=tailor_headers)
    assert search_res.status_code == 200
    assert any(c["id"] == cust_id for c in search_res.json()["items"])
    print("  [OK] Tailor customer management correctly persists and searches international patrons.")

    # -------------------------------------------------------------------------
    # TEST 6: Order Commissioning in INR (Indian Customer Flow)
    # -------------------------------------------------------------------------
    print("\n[TEST 6] Testing Order Commissioning in INR...")
    cust_login = client.post("/api/auth/login", json={"email": "alexander.hayes@mayfair.co.uk", "password": "Password123"})
    assert cust_login.status_code == 200, f"Customer login failed: {cust_login.text}"
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Fetch designs
    designs_res = client.get("/api/designs")
    assert designs_res.status_code == 200
    designs = designs_res.json()
    design = designs[0]
    base_price = design["price_from"]

    meas_res = client.get("/api/customers/measurements", headers=cust_headers)
    assert meas_res.status_code == 200
    measurements = meas_res.json()
    if not measurements:
        tpl_res = client.get("/api/measurement-templates")
        tpl_id = tpl_res.json()[0]["id"]
        tpl_detail = client.get(f"/api/measurement-templates/{tpl_id}").json()
        vals = [
            {
                "field_id": f["id"],
                "value": round((f["min_value"] + f["max_value"]) / 2, 1) if f.get("min_value") and f.get("max_value") else 30.0
            }
            for f in tpl_detail["fields"]
        ]
        new_m = client.post(
            "/api/customers/measurements",
            json={
                "template_id": tpl_id,
                "measurement_name": "Alexander Hayes Profile",
                "unit": "inches",
                "values": vals,
            },
            headers=cust_headers
        ).json()
        meas_id = new_m["id"]
    else:
        meas_id = measurements[0]["id"]

    inr_order_payload = {
        "tailor_shop_id": 1,
        "customer_notes": "Traditional Indian wedding bespoke sherwani.",
        "currency": "INR",
        "delivery_address": {
            "full_name": "Aarav Sharma",
            "phone": "+91 98765 43210",
            "address_line_1": "Flat 8B, Sea View Tower, Marine Drive",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "country_code": "IN",
            "pincode": "400021"
        },
        "items": [
            {
                "design_id": design["id"],
                "quantity": 1,
                "customization_notes": "Raw silk with gold zardozi embroidery",
                "measurement_id": meas_id
            }
        ]
    }
    inr_order_res = client.post("/api/orders", json=inr_order_payload, headers=cust_headers)
    assert inr_order_res.status_code == 201, f"Failed placing INR order: {inr_order_res.text}"
    inr_order = inr_order_res.json()
    assert inr_order["currency"] == "INR"
    assert inr_order["delivery_charge"] == 350.0  # ₹350 standard Indian courier
    expected_inr_subtotal = round(base_price * 83.5, 2)
    assert inr_order["subtotal"] == expected_inr_subtotal
    assert inr_order["total_amount"] == round(expected_inr_subtotal + 350.0, 2)
    assert inr_order["delivery_address"]["country"] == "India"
    assert inr_order["delivery_address"]["pincode"] == "400021"
    print(f"  [OK] INR Order successfully placed (#{inr_order['order_number']}): Subtotal INR {inr_order['subtotal']}, Delivery INR {inr_order['delivery_charge']}, Total INR {inr_order['total_amount']}")

    # -------------------------------------------------------------------------
    # TEST 7: Order Commissioning in GBP (UK Patron Flow)
    # -------------------------------------------------------------------------
    print("\n[TEST 7] Testing Order Commissioning in GBP...")
    gbp_order_payload = {
        "tailor_shop_id": 1,
        "customer_notes": "Mayfair club bespoke tuxedo.",
        "currency": "GBP",
        "delivery_address": {
            "full_name": "Alexander Hayes",
            "phone": "+44 20 7946 0912",
            "address_line_1": "14 Savile Row",
            "address_line_2": "Suite 4B",
            "city": "London",
            "state": "Greater London",
            "country": "United Kingdom",
            "country_code": "GB",
            "pincode": "W1S 3JN"
        },
        "items": [
            {
                "design_id": design["id"],
                "quantity": 2,
                "customization_notes": "Midnight blue barathea with grosgrain silk facings",
                "measurement_id": meas_id
            }
        ]
    }
    gbp_order_res = client.post("/api/orders", json=gbp_order_payload, headers=cust_headers)
    assert gbp_order_res.status_code == 201, f"Failed placing GBP order: {gbp_order_res.text}"
    gbp_order = gbp_order_res.json()
    assert gbp_order["currency"] == "GBP"
    assert gbp_order["delivery_charge"] == 12.0  # £12 UK standard delivery
    expected_gbp_unit = round(base_price * 0.79, 2)
    expected_gbp_subtotal = round(expected_gbp_unit * 2, 2)
    assert gbp_order["subtotal"] == expected_gbp_subtotal
    assert gbp_order["total_amount"] == round(expected_gbp_subtotal + 12.0, 2)
    assert gbp_order["delivery_address"]["country"] == "United Kingdom"
    assert gbp_order["delivery_address"]["country_code"] == "GB"
    print(f"  [OK] GBP Order successfully placed (#{gbp_order['order_number']}): Subtotal GBP {gbp_order['subtotal']}, Delivery GBP {gbp_order['delivery_charge']}, Total GBP {gbp_order['total_amount']}")

    # -------------------------------------------------------------------------
    # TEST 8: Validation Enforcement on Bad International Data
    # -------------------------------------------------------------------------
    print("\n[TEST 8] Testing Validation Enforcement on Bad Address / Phone...")
    bad_postal_payload = {
        "tailor_shop_id": 1,
        "currency": "USD",
        "delivery_address": {
            "full_name": "John Doe",
            "phone": "+1 415 555 2671",
            "address_line_1": "123 Main St",
            "city": "San Francisco",
            "state": "California",
            "country": "United States",
            "country_code": "US",
            "pincode": "INVALID_ZIP_12345678"
        },
        "items": [
            {
                "design_id": design["id"],
                "quantity": 1,
                "measurement_id": meas_id
            }
        ]
    }
    bad_postal_res = client.post("/api/orders", json=bad_postal_payload, headers=cust_headers)
    assert bad_postal_res.status_code == 400
    assert "Invalid ZIP Code" in bad_postal_res.json()["detail"]
    print("  [OK] Correctly rejected invalid US ZIP code.")

    bad_phone_payload = {
        "tailor_shop_id": 1,
        "currency": "USD",
        "delivery_address": {
            "full_name": "John Doe",
            "phone": "not-a-phone",
            "address_line_1": "123 Main St",
            "city": "San Francisco",
            "state": "California",
            "country": "United States",
            "country_code": "US",
            "pincode": "94105"
        },
        "items": [
            {
                "design_id": design["id"],
                "quantity": 1,
                "measurement_id": meas_id
            }
        ]
    }
    bad_phone_res = client.post("/api/orders", json=bad_phone_payload, headers=cust_headers)
    assert bad_phone_res.status_code == 400
    assert "Invalid phone number" in bad_phone_res.json()["detail"]
    print("  [OK] Correctly rejected invalid phone number format.")

    print("\n" + "=" * 70)
    print("ALL INTERNATIONAL CUSTOMER SUPPORT TESTS PASSED (100% SUITE SUCCESS)")
    print("=" * 70)

if __name__ == "__main__":
    run_international_verification()
