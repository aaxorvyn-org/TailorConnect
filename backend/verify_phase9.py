from fastapi.testclient import TestClient
from app.main import app

def run_phase9_verification():
    with TestClient(app) as client:
        print("\n=======================================================")
        print("PHASE 9: ONLINE TAILORING ORDER MANAGEMENT E2E VERIFICATION")
        print("=======================================================\n")

        # Step 1: Customer login
        print("Step 1: Customer login...")
        login_res = client.post(
            "/api/auth/login",
            json={"email": "alexander.hayes@mayfair.co.uk", "password": "Password123"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        customer_token = login_res.json()["access_token"]
        customer_headers = {"Authorization": f"Bearer {customer_token}"}
        print("[OK] Customer logged in successfully: Alexander Hayes")

        # Step 2: Tailor login
        print("\nStep 2: Tailor atelier login...")
        tailor_login_res = client.post(
            "/api/auth/login",
            json={"email": "master.vance@vanceatelier.com", "password": "Password123"}
        )
        assert tailor_login_res.status_code == 200, f"Tailor login failed: {tailor_login_res.text}"
        tailor_token = tailor_login_res.json()["access_token"]
        tailor_headers = {"Authorization": f"Bearer {tailor_token}"}
        print("[OK] Tailor logged in successfully: Vance & Co. Bespoke Atelier")

        # Step 3: Customer opens tailor shop & selects design
        print("\nStep 3: Customer browses designs...")
        designs_res = client.get("/api/designs")
        assert designs_res.status_code == 200
        designs = designs_res.json()
        assert len(designs) >= 1
        selected_design = designs[0]
        shop_id = selected_design["shop_id"]
        print(f"[OK] Customer selects design: '{selected_design['title']}' (${selected_design['price_from']}) for Shop {shop_id}")

        # Step 4: Customer selects measurement profile
        print("\nStep 4: Customer selects measurement profile (Phase 8 integration)...")
        measurements_res = client.get("/api/customers/measurements", headers=customer_headers)
        assert measurements_res.status_code == 200
        measurements_list = measurements_res.json()
        if not measurements_list:
            tpl_res = client.get("/api/measurement-templates")
            tpl_id = tpl_res.json()[0]["id"]
            tpl_detail = client.get(f"/api/measurement-templates/{tpl_id}").json()
            vals = [
                {
                    "field_id": f["id"],
                    "value": round((f["min_value"] + f["max_value"]) / 2, 1) if f["min_value"] and f["max_value"] else 30.0
                }
                for f in tpl_detail["fields"]
            ]
            new_m = client.post(
                "/api/customers/measurements",
                json={
                    "template_id": tpl_id,
                    "measurement_name": "Savile Row Formal Profile",
                    "unit": "inches",
                    "values": vals,
                },
                headers=customer_headers
            ).json()
            measurement_id = new_m["id"]
        else:
            measurement_id = measurements_list[0]["id"]
        print(f"[OK] Customer measurement profile selected: ID {measurement_id}")

        # Step 5: Customer enters delivery address & uploads reference image
        print("\nStep 5: Customer specifies delivery address & reference image...")
        order_payload = {
            "tailor_shop_id": shop_id,
            "customer_notes": "Silk grosgrain lapels, double interior pocket with monogram.",
            "delivery_address": {
                "full_name": "Alexander Hayes",
                "phone": "+44 20 7946 0912",
                "address_line_1": "14 Savile Row",
                "address_line_2": "Apt 4B",
                "city": "London",
                "state": "Greater London",
                "country": "United Kingdom",
                "pincode": "W1S 3JN"
            },
            "items": [
                {
                    "design_id": selected_design["id"],
                    "quantity": 1,
                    "customization_notes": "Super 150s Wool with silk jacquard lining",
                    "measurement_id": measurement_id
                }
            ],
            "reference_image_urls": ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35"]
        }
        print("[OK] Delivery address & reference payload prepared.")

        # Step 6: Customer reviews and places order (POST /api/orders)
        print("\nStep 6: Customer places order -> POST /api/orders...")
        place_res = client.post("/api/orders", json=order_payload, headers=customer_headers)
        assert place_res.status_code == 201, f"Failed placing order: {place_res.text}"
        order = place_res.json()
        order_id = order["id"]
        order_number = order["order_number"]

        # Step 7: Verify backend calculated price
        expected_subtotal = selected_design["price_from"]
        expected_total = expected_subtotal + 15.00  # Delivery charge
        assert order["subtotal"] == expected_subtotal
        assert order["delivery_charge"] == 15.00
        assert order["total_amount"] == expected_total
        assert order_number.startswith("TAILOR-")
        print(f"[OK] Order created with unique Order Number: #{order_number}")
        print(f"     Subtotal (backend calculated): ${order['subtotal']}")
        print(f"     Delivery Fee:                  ${order['delivery_charge']}")
        print(f"     Total Amount:                  ${order['total_amount']}")
        print(f"     Initial Status:                {order['status']}")

        # Step 8: Order appears in Customer's My Orders
        print("\nStep 8: Verifying order appears in Customer 'My Orders'...")
        cust_orders_res = client.get("/api/orders", headers=customer_headers)
        assert cust_orders_res.status_code == 200
        assert any(o["id"] == order_id for o in cust_orders_res.json())
        print(f"[OK] Order #{order_number} confirmed in Customer orders list.")

        # Step 9: Order appears in Tailor Atelier Dashboard
        print("\nStep 9: Verifying order appears in Tailor Dashboard orders...")
        tailor_orders_res = client.get("/api/tailors/orders", headers=tailor_headers)
        assert tailor_orders_res.status_code == 200
        assert any(o["id"] == order_id for o in tailor_orders_res.json())
        print(f"[OK] Order #{order_number} confirmed in Tailor atelier incoming orders.")

        # Step 10: Tailor opens order and inspects customer information
        print("\nStep 10: Tailor opens order details (GET /api/tailors/orders/{id})...")
        t_order_res = client.get(f"/api/tailors/orders/{order_id}", headers=tailor_headers)
        assert t_order_res.status_code == 200
        t_order = t_order_res.json()
        assert t_order["customer_name"] == "Alexander Hayes"
        assert t_order["delivery_address"]["city"] == "London"
        assert t_order["items"][0]["measurement_id"] == measurement_id
        print(f"[OK] Tailor inspected order: Patron '{t_order['customer_name']}', delivery to '{t_order['delivery_address']['city']}', measurement ID {measurement_id}")

        # Step 11: Tailor accepts order -> PUT /api/orders/{id}/status -> ACCEPTED
        print("\nStep 11: Tailor accepts order -> PUT /api/orders/{id}/status...")
        accept_res = client.put(
            f"/api/orders/{order_id}/status",
            json={"status": "ACCEPTED", "notes": "Commission accepted. Cloth reserved at atelier."},
            headers=tailor_headers
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "ACCEPTED"
        print("[OK] Tailor accepted order. Status updated to: ACCEPTED")

        # Step 12: Customer sees updated status & status history
        print("\nStep 12: Customer verifies updated status & history trail...")
        cust_check_res = client.get(f"/api/orders/{order_id}", headers=customer_headers)
        assert cust_check_res.status_code == 200
        assert cust_check_res.json()["status"] == "ACCEPTED"

        history_res = client.get(f"/api/orders/{order_id}/status-history", headers=customer_headers)
        assert history_res.status_code == 200
        history = history_res.json()
        assert len(history) >= 2
        print(f"[OK] Customer sees updated status 'ACCEPTED' with audit history:")
        for h in history:
            print(f"     - [{h['status']}] by User {h['changed_by']} ({h['changed_by_name']}): '{h['notes']}'")

        # Step 13: Security checks
        print("\nStep 13: Verifying security isolation...")
        # Another customer cannot view this order
        cust2_res = client.post(
            "/api/auth/register",
            json={
                "email": "customer2.order@tailor.com",
                "password": "Password123",
                "full_name": "Eleanor Vance",
                "role": "CUSTOMER",
                "phone": "+44 20 7946 0999"
            }
        )
        if cust2_res.status_code == 200:
            c2_token = cust2_res.json()["access_token"]
        else:
            c2_token = client.post(
                "/api/auth/login",
                json={"email": "customer2.order@tailor.com", "password": "Password123"}
            ).json()["access_token"]
        c2_headers = {"Authorization": f"Bearer {c2_token}"}

        blocked_get = client.get(f"/api/orders/{order_id}", headers=c2_headers)
        assert blocked_get.status_code == 404
        blocked_put = client.put(f"/api/orders/{order_id}/status", json={"status": "CANCELLED"}, headers=c2_headers)
        assert blocked_put.status_code == 404
        print("[OK] Unauthorized customer blocked with 404 Not Found.")

        print("\n=======================================================")
        print("ALL PART 13 COMPLETE E2E ORDER FLOW REQUIREMENTS PASSED!")
        print("=======================================================\n")

if __name__ == "__main__":
    run_phase9_verification()
