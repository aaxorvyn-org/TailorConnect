import sys
import os

# Add backend directory to sys.path so we can import config/security
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import httpx
from app.core.security import create_access_token

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("ORDER DELIVERY MANAGEMENT E2E INTEGRATION TEST")
    print("=" * 60)

    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[SUCCESS] 1. Backend health check passed.")

    # 2. Generate Auth Tokens for Tailor (ID 2, Shop 1) and Customer (ID 1)
    tailor_token = create_access_token(subject=2, role="TAILOR")
    tailor_headers = {"Authorization": f"Bearer {tailor_token}"}
    print("[SUCCESS] 2. Tailor authenticated (Master Vance, Atelier #1).")

    cust_token = create_access_token(subject=1, role="CUSTOMER")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("[SUCCESS] 3. Customer authenticated (Alexander Hayes).")

    # 3. Verify Design and Measurement
    designs_res = client.get("/api/designs")
    assert designs_res.status_code == 200, f"Get designs failed: {designs_res.text}"
    designs = designs_res.json()
    design_id = designs[0]["id"] if designs else 1

    meas_res = client.get("/api/measurements", headers=cust_headers)
    measurements = meas_res.json() if meas_res.status_code == 200 else []
    meas_id = measurements[0]["id"] if measurements else 1

    # 4. Customer Places Bespoke Order to Shop 1
    order_payload = {
        "tailor_shop_id": 1,
        "customer_notes": "Urgent commission for state gala",
        "currency": "GBP",
        "delivery_address": {
            "full_name": "Alexander Hayes",
            "phone": "+44 7911 123456",
            "address_line_1": "10 Downing Lane",
            "city": "London",
            "state": "Greater London",
            "country": "United Kingdom",
            "country_code": "GB",
            "pincode": "SW1A 2AA"
        },
        "items": [
            {
                "design_id": design_id,
                "quantity": 1,
                "customization_notes": "Silk lapel, hand-stitched",
                "measurement_id": meas_id
            }
        ]
    }
    create_ord_res = client.post("/api/orders", headers=cust_headers, json=order_payload)
    assert create_ord_res.status_code == 201, f"Create order failed: {create_ord_res.text}"
    order_data = create_ord_res.json()
    order_id = order_data["id"]
    print(f"[SUCCESS] 4. Order created: ID #{order_id}, Order No: {order_data.get('order_number')}, Status: {order_data['status']}")

    # 5. Customer fetches initial delivery details
    deliv_get_res = client.get(f"/api/orders/{order_id}/delivery", headers=cust_headers)
    assert deliv_get_res.status_code == 200, f"Get initial delivery failed: {deliv_get_res.text}"
    init_delivery = deliv_get_res.json()
    assert init_delivery["order_id"] == order_id
    assert init_delivery["status"] == "PENDING"
    print(f"[SUCCESS] 5. Initial Delivery record verified (Status: {init_delivery['status']}, Method: {init_delivery['delivery_method']})")

    # 6. Customer attempts to alter tracking details -> RBAC Forbidden
    unauth_update = client.put(f"/api/orders/{order_id}/delivery", headers=cust_headers, json={
        "courier_name": "Hacked Courier",
        "tracking_number": "HACK-999"
    })
    assert unauth_update.status_code in [403, 401], f"Security fail: Customer was allowed to alter delivery! Code: {unauth_update.status_code}"
    print("[SUCCESS] 6. RBAC verified: Customer cannot modify courier tracking details (403 Forbidden).")

    # 7. Tailor updates delivery info (Manual courier dispatch: DHL / Blue Dart, Tracking #)
    tracking_payload = {
        "delivery_method": "EXPRESS_COURIER",
        "courier_name": "Blue Dart / DHL Express",
        "tracking_number": "BD-884920199",
        "expected_delivery_date": "2026-10-25",
        "status": "SHIPPED",
        "notes": "Handed over to courier in sealed tamper-evident velvet box."
    }
    update_deliv_res = client.put(f"/api/tailors/orders/{order_id}/delivery", headers=tailor_headers, json=tracking_payload)
    assert update_deliv_res.status_code == 200, f"Tailor delivery update failed: {update_deliv_res.text}"
    updated_delivery = update_deliv_res.json()
    assert updated_delivery["courier_name"] == "Blue Dart / DHL Express"
    assert updated_delivery["tracking_number"] == "BD-884920199"
    assert updated_delivery["delivery_method"] == "EXPRESS_COURIER"
    assert updated_delivery["status"] == "SHIPPED"
    assert updated_delivery["shipped_at"] is not None
    print(f"[SUCCESS] 7. Tailor updated tracking: {updated_delivery['courier_name']} | #{updated_delivery['tracking_number']} | Status: {updated_delivery['status']}")

    # 8. Verify Order status automatically synchronized to SHIPPED
    order_check = client.get(f"/api/orders/{order_id}", headers=cust_headers).json()
    assert order_check["status"] == "SHIPPED", f"Order status should be SHIPPED, got {order_check['status']}"
    assert order_check.get("delivery") is not None
    assert order_check["delivery"]["tracking_number"] == "BD-884920199"
    print("[SUCCESS] 8. Order stage automatically synchronized with delivery status ('SHIPPED').")

    # 9. Customer retrieves delivery status and tracking number
    cust_view_deliv = client.get(f"/api/orders/{order_id}/delivery", headers=cust_headers).json()
    assert cust_view_deliv["tracking_number"] == "BD-884920199"
    assert cust_view_deliv["courier_name"] == "Blue Dart / DHL Express"
    assert cust_view_deliv["status"] == "SHIPPED"
    assert "2026-10-25" in str(cust_view_deliv["expected_delivery_date"])
    print("[SUCCESS] 9. Customer successfully viewed tracking number and delivery status.")

    # 10. Tailor marks order as DELIVERED
    delivered_payload = {
        "status": "DELIVERED",
        "notes": "Delivered to patron and signed for at residence."
    }
    deliv_complete_res = client.put(f"/api/tailors/orders/{order_id}/delivery", headers=tailor_headers, json=delivered_payload)
    assert deliv_complete_res.status_code == 200, f"Deliver complete failed: {deliv_complete_res.text}"
    final_delivery = deliv_complete_res.json()
    assert final_delivery["status"] == "DELIVERED"
    assert final_delivery["delivered_at"] is not None
    print(f"[SUCCESS] 10. Delivery updated to DELIVERED with timestamp: {final_delivery['delivered_at']}")

    # 11. Final order verification
    final_order = client.get(f"/api/orders/{order_id}", headers=cust_headers).json()
    assert final_order["status"] == "DELIVERED", f"Final order status expected DELIVERED, got {final_order['status']}"
    print(f"[SUCCESS] 11. Final order verification complete: Order #{order_id} is DELIVERED.")

    print("=" * 60)
    print("ALL ORDER DELIVERY MANAGEMENT TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"[ERROR] TEST RUN FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
