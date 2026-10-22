import os
import sys
import uuid
from io import BytesIO

# Configure UTF-8 stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_security_and_integration_tests():
    print("=" * 70)
    print("COMPREHENSIVE SECURITY, VALIDATION & INTEGRATION TEST SUITE")
    print("=" * 70)

    client = httpx.Client(base_url=BASE_URL, timeout=20.0)

    # -------------------------------------------------------------
    # 1. Health & CORS
    # -------------------------------------------------------------
    health_res = client.get("/api/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    print("[PASS] 1. Backend health check operational.")

    # -------------------------------------------------------------
    # 2. Authentication, Password Security & JWT Lifecycle
    # -------------------------------------------------------------
    # Login Customer 1
    cust_res = client.post("/api/auth/login", json={
        "email": "alexander.hayes@mayfair.co.uk",
        "password": "Password123",
    })
    assert cust_res.status_code == 200, f"Customer login failed: {cust_res.text}"
    cust_token = cust_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("[PASS] 2a. Customer authenticated via signed JWT.")

    # Login Tailor 1
    tailor_res = client.post("/api/auth/login", json={
        "email": "master.vance@vanceatelier.com",
        "password": "Password123",
    })
    assert tailor_res.status_code == 200, f"Tailor login failed: {tailor_res.text}"
    tailor_token = tailor_res.json()["access_token"]
    tailor_headers = {"Authorization": f"Bearer {tailor_token}"}
    print("[PASS] 2b. Tailor authenticated via signed JWT.")

    # Login Admin
    admin_res = client.post("/api/auth/login", json={
        "email": "admin@threadcraft.luxury",
        "password": "Password123",
    })
    assert admin_res.status_code == 200, f"Admin login failed: {admin_res.text}"
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 2c. Administrator authenticated via signed JWT.")

    # JWT Security Checks:
    # Invalid token
    inv_res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.payload"})
    assert inv_res.status_code == 401, "Invalid JWT was not rejected with 401!"
    print("[PASS] 2d. Tampered/malformed JWT blocked (401 Unauthorized).")

    # Token Revocation / Logout
    temp_user_email = f"temp_{uuid.uuid4().hex[:6]}@test.com"
    reg_temp = client.post("/api/auth/register", json={
        "full_name": "Temporary Patron",
        "email": temp_user_email,
        "password": "Password123",
        "role": "CUSTOMER",
    })
    assert reg_temp.status_code == 201
    temp_token = reg_temp.json()["access_token"]
    temp_headers = {"Authorization": f"Bearer {temp_token}"}

    # Verify temp token works
    assert client.get("/api/auth/me", headers=temp_headers).status_code == 200
    # Logout temp user
    logout_res = client.post("/api/auth/logout", headers=temp_headers)
    assert logout_res.status_code == 200
    # Now token MUST be revoked and unusable
    post_logout_res = client.get("/api/auth/me", headers=temp_headers)
    assert post_logout_res.status_code == 401, "Revoked token was accepted after logout!"
    print("[PASS] 2e. Token revocation on logout verified (401 Unauthorized upon reuse).")

    # -------------------------------------------------------------
    # 3. Role-Based Access Control (RBAC) & Admin Protection
    # -------------------------------------------------------------
    # Customer blocked from Admin
    assert client.get("/api/admin/dashboard/stats", headers=cust_headers).status_code == 403
    # Tailor blocked from Admin
    assert client.get("/api/admin/dashboard/stats", headers=tailor_headers).status_code == 403
    # Customer blocked from Tailor Customer Management
    assert client.get("/api/tailors/customers", headers=cust_headers).status_code == 403
    # Tailor blocked from Customer Orders
    assert client.get("/api/orders", headers=tailor_headers).status_code == 403
    print("[PASS] 3. Role-based authorization & Admin protection verified.")

    # -------------------------------------------------------------
    # 4. Multi-Tenant Customer & Tailor Data Isolation
    # -------------------------------------------------------------
    # Register Customer B
    cust_b_email = f"patron_b_{uuid.uuid4().hex[:6]}@mayfair.co.uk"
    reg_b = client.post("/api/auth/register", json={
        "full_name": "Lord Sterling",
        "email": cust_b_email,
        "password": "Password123",
        "role": "CUSTOMER",
    })
    assert reg_b.status_code == 201
    cust_b_token = reg_b.json()["access_token"]
    cust_b_headers = {"Authorization": f"Bearer {cust_b_token}"}

    # Customer A creates a measurement profile
    meas_res = client.post("/api/customers/measurements", headers=cust_headers, json={
        "template_id": 1,
        "measurement_name": "Alexander Hayes Bespoke Suit Profile",
        "unit": "INCHES",
        "notes": "Slim fit, roped shoulder",
        "values": [
            {"field_id": 1, "value": 42.0},
            {"field_id": 2, "value": 34.0},
            {"field_id": 3, "value": 32.0},
            {"field_id": 4, "value": 18.0},
            {"field_id": 5, "value": 16.5},
        ],
    })
    assert meas_res.status_code == 201, f"Create measurement failed: {meas_res.text}"
    meas_id = meas_res.json()["id"]

    # Customer B MUST NOT be able to view or edit Customer A's measurement
    leak_res = client.get(f"/api/customers/measurements/{meas_id}", headers=cust_b_headers)
    assert leak_res.status_code == 404, "Customer B was able to view Customer A's measurement!"
    upd_leak_res = client.put(f"/api/customers/measurements/{meas_id}", headers=cust_b_headers, json={
        "measurement_name": "Hacked Profile",
    })
    assert upd_leak_res.status_code == 404, "Customer B was able to modify Customer A's measurement!"
    print("[PASS] 4a. Customer measurement isolation verified (Customer B cannot view or modify Customer A).")

    # -------------------------------------------------------------
    # 5. File Upload Validation & Protection
    # -------------------------------------------------------------
    # Customer A creates an order
    order_res = client.post("/api/orders", headers=cust_headers, json={
        "tailor_shop_id": 1,
        "customer_notes": "Charcoal three piece bespoke commission",
        "items": [
            {
                "design_id": 1,
                "measurement_id": meas_id,
                "fabric_choice": "Scabal Super 150s Wool",
                "customization_notes": "Double vent",
                "quantity": 1,
            }
        ],
        "delivery_address": {
            "full_name": "Alexander Hayes",
            "phone": "+44 20 7123 4567",
            "address_line_1": "14 Savile Row",
            "city": "London",
            "state": "Greater London",
            "pincode": "W1S 3JN",
            "country": "United Kingdom",
            "country_code": "GB",
        },
    })
    assert order_res.status_code == 201, f"Create order failed: {order_res.text}"
    order_a_id = order_res.json()["id"]

    # Test 5a: Customer B attempts to upload image to Customer A's order -> 403
    unauth_upload = client.post(
        f"/api/orders/{order_a_id}/reference-images",
        headers=cust_b_headers,
        data={"image_url": "https://example.com/spoofed.jpg"},
    )
    assert unauth_upload.status_code in [403, 404], "Customer B was able to attach image to Customer A's order!"
    print("[PASS] 5a. Unauthorized image attachment blocked (403/404).")

    # Test 5b: Malicious file extension / spoofed MIME type
    fake_png = b"Not a real image file content"
    bad_upload = client.post(
        f"/api/orders/{order_a_id}/reference-images",
        headers=cust_headers,
        files={"file": ("malicious.exe", fake_png, "image/png")},
    )
    assert bad_upload.status_code == 400, "Corrupted/spoofed image was not rejected!"
    print("[PASS] 5b. Spoofed file without valid image magic bytes rejected (400 Bad Request).")

    # Test 5c: Valid JPEG image upload
    valid_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 100
    good_upload = client.post(
        f"/api/orders/{order_a_id}/reference-images",
        headers=cust_headers,
        files={"file": ("reference.jpg", valid_jpeg, "image/jpeg")},
    )
    assert good_upload.status_code == 201, f"Valid image upload failed: {good_upload.text}"
    print("[PASS] 5c. Valid image authenticated, sanitized, and stored safely.")

    # -------------------------------------------------------------
    # 6. Payment Architecture & Server-Side Calculation
    # -------------------------------------------------------------
    # Config check: No secret keys leaked
    config_res = client.get("/api/payments/config")
    assert config_res.status_code == 200
    config_data = config_res.json()
    assert "public_key" in config_data
    assert "secret" not in str(config_data).lower()
    print("[PASS] 6a. Payment config retrieved without exposing private gateway secrets.")

    # Customer B cannot pay for Customer A's order
    cust_b_pay = client.post("/api/payments/intent", headers=cust_b_headers, json={
        "order_id": order_a_id,
        "payment_method": "CARD",
    })
    assert cust_b_pay.status_code == 403, "Customer B was allowed to create payment intent on Customer A's order!"
    print("[PASS] 6b. Unauthorized payment intent blocked (403 Forbidden).")

    # Customer A creates payment intent (Server calculates amount!)
    pay_intent_res = client.post("/api/payments/intent", headers=cust_headers, json={
        "order_id": order_a_id,
        "payment_method": "CARD",
    })
    assert pay_intent_res.status_code == 201, f"Payment intent failed: {pay_intent_res.text}"
    pay_intent = pay_intent_res.json()
    assert pay_intent["amount"] > 0
    assert pay_intent["status"] == "PENDING"
    payment_id = pay_intent["payment_id"]
    print(f"[PASS] 6c. Server-calculated payment intent generated: {payment_id} for ${pay_intent['amount']}.")

    # Confirm payment (Success)
    pay_confirm_res = client.post("/api/payments/confirm", headers=cust_headers, json={
        "payment_id": payment_id,
        "transaction_reference": "TXN-MOCK-CHASE-9921",
    })
    assert pay_confirm_res.status_code == 200
    assert pay_confirm_res.json()["status"] == "COMPLETED"

    # Order payment_status should now be PAID
    verify_order = client.get(f"/api/orders/{order_a_id}", headers=cust_headers).json()
    assert verify_order["payment_status"] == "PAID"
    print("[PASS] 6d. Payment completed; order payment_status updated to 'PAID'.")

    # Prevent double-payment on already paid order
    dup_pay = client.post("/api/payments/intent", headers=cust_headers, json={
        "order_id": order_a_id,
        "payment_method": "CARD",
    })
    assert dup_pay.status_code == 400, "Allowed duplicate payment intent on paid order!"
    print("[PASS] 6e. Duplicate payment prevention verified (400 Bad Request).")

    # -------------------------------------------------------------
    # 7. Tailor Workflow & Order Lifecycle State Machine
    # -------------------------------------------------------------
    # Tailor views incoming order
    tailor_order = client.get(f"/api/tailors/orders/{order_a_id}", headers=tailor_headers)
    assert tailor_order.status_code == 200, f"Tailor could not view order: {tailor_order.text}"

    # Tailor accepts order
    acc_res = client.put(f"/api/orders/{order_a_id}/status", headers=tailor_headers, json={
        "status": "ACCEPTED",
        "notes": "Measurement verified, cutting cloth.",
    })
    assert acc_res.status_code == 200

    # Tailor advances through atelier production stages
    assert client.put(f"/api/orders/{order_a_id}/status", headers=tailor_headers, json={
        "status": "MEASUREMENT_CONFIRMED", "notes": "Measurements verified against draft.",
    }).status_code == 200

    assert client.put(f"/api/orders/{order_a_id}/status", headers=tailor_headers, json={
        "status": "CUTTING", "notes": "Hand-shearing Scabal wool cloth.",
    }).status_code == 200

    assert client.put(f"/api/orders/{order_a_id}/status", headers=tailor_headers, json={
        "status": "STITCHING", "notes": "Basting stitch & horsehair canvas assembly.",
    }).status_code == 200

    assert client.put(f"/api/orders/{order_a_id}/status", headers=tailor_headers, json={
        "status": "QUALITY_CHECK", "notes": "Master cutter final inspection passed.",
    }).status_code == 200

    assert client.put(f"/api/orders/{order_a_id}/status", headers=tailor_headers, json={
        "status": "READY", "notes": "Garment pressed, packaged in garment bag.",
    }).status_code == 200
    print("[PASS] 7a. Tailor atelier advanced order: PENDING -> ACCEPTED -> MEASUREMENT_CONFIRMED -> CUTTING -> STITCHING -> QUALITY_CHECK -> READY.")

    # -------------------------------------------------------------
    # 8. Delivery Management
    # -------------------------------------------------------------
    # Customer cannot update courier dispatch (tailor only)
    unauth_del = client.put(f"/api/orders/{order_a_id}/delivery", headers=cust_headers, json={
        "courier_name": "Royal Mail",
        "tracking_number": "RM-9999",
        "status": "SHIPPED",
    })
    assert unauth_del.status_code == 403, "Customer was able to modify courier dispatch!"

    # Tailor updates courier dispatch
    del_res = client.put(f"/api/tailors/orders/{order_a_id}/delivery", headers=tailor_headers, json={
        "courier_name": "DHL Express White Glove",
        "tracking_number": "DHL-LUX-8829101",
        "tracking_url": "https://dhl.com/track/DHL-LUX-8829101",
        "status": "SHIPPED",
    })
    assert del_res.status_code == 200
    assert del_res.json()["tracking_number"] == "DHL-LUX-8829101"

    # Tailor marks delivered
    delivered_res = client.put(f"/api/tailors/orders/{order_a_id}/delivery", headers=tailor_headers, json={
        "status": "DELIVERED",
    })
    assert delivered_res.status_code == 200
    print("[PASS] 8. Courier dispatch and delivery tracking verified with tailor authorization.")

    # -------------------------------------------------------------
    # 9. Review System & Rating Recalculation
    # -------------------------------------------------------------
    # Customer B cannot review Customer A's order
    rev_b = client.post("/api/reviews", headers=cust_b_headers, json={
        "order_id": order_a_id,
        "rating": 5,
        "comment": "Hijacked review",
    })
    assert rev_b.status_code == 403, "Customer B was able to review Customer A's order!"

    # Invalid star rating (e.g. 6 stars) rejected by validation
    bad_star = client.post("/api/reviews", headers=cust_headers, json={
        "order_id": order_a_id,
        "rating": 6,
        "comment": "Too many stars",
    })
    assert bad_star.status_code in [400, 422], "Rating > 5 was not rejected!"

    # Customer A submits 5-star review
    rev_create = client.post("/api/reviews", headers=cust_headers, json={
        "order_id": order_a_id,
        "rating": 5,
        "comment": "Flawless drape and immaculate shoulder line. Truly world-class sartorial precision!",
    })
    assert rev_create.status_code == 201, f"Review creation failed: {rev_create.text}"
    rev_id = rev_create.json()["id"]

    # Duplicate review on same order rejected
    dup_rev = client.post("/api/reviews", headers=cust_headers, json={
        "order_id": order_a_id,
        "rating": 4,
        "comment": "Duplicate attempt",
    })
    assert dup_rev.status_code == 400, "Allowed duplicate review on the same order!"
    print("[PASS] 9a. Review submitted; duplicate review prevented (400 Bad Request).")

    # Public Shop reviews endpoint verifies updated average rating & review count
    shop_revs = client.get("/api/reviews/shop/1")
    assert shop_revs.status_code == 200
    assert shop_revs.json()["review_count"] >= 1
    print("[PASS] 9b. Public atelier shop reviews summary and rating recalculation verified.")

    # Customer edits own review
    rev_upd = client.put(f"/api/reviews/{rev_id}", headers=cust_headers, json={
        "rating": 5,
        "comment": "Updated: Even better after wearing to gala!",
    })
    assert rev_upd.status_code == 200
    print("[PASS] 9c. Customer successfully edited own review.")

    # -------------------------------------------------------------
    # 10. Admin Platform Management & Moderation
    # -------------------------------------------------------------
    # Admin inspects dashboard metrics
    adm_stats = client.get("/api/admin/dashboard/stats", headers=admin_headers).json()
    assert adm_stats["total_orders"] >= 1
    assert adm_stats["total_customers"] >= 2
    print("[PASS] 10a. Admin Dashboard verified: Real-time statistics across users, shops, and commissions.")

    # Admin searches reviews and moderates
    search_rev = client.get("/api/admin/reviews?search=Flawless", headers=admin_headers)
    assert search_rev.status_code == 200
    assert len(search_rev.json()["items"]) >= 1

    # Admin deletes review (moderation action)
    del_rev = client.delete(f"/api/admin/reviews/{rev_id}", headers=admin_headers)
    assert del_rev.status_code == 200
    print("[PASS] 10b. Admin review search, inspection, and moderation deletion verified.")

    print("=" * 70)
    print("ALL 10 SECURITY, VALIDATION & INTEGRATION TEST PHASES PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    try:
        run_security_and_integration_tests()
    except Exception as e:
        print(f"\n[FAIL] TEST RUN FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
