"""
Comprehensive Phase 8 Verification Script
Validates all Part 10 verification criteria:
1. Customer logs in.
2. Customer selects Shirt.
3. Frontend requests template from API.
4. Backend returns Shirt measurement fields.
5. Dynamic display field requirements verified.
6. Customer enters measurements.
7. Frontend sends data to API.
8. Backend validates data (positive numbers, required fields, range limits).
9. Database stores measurement with values and foreign keys.
10. Customer can view saved measurement.
11. Customer can edit measurement.
12. Customer cannot access another customer's measurement (security isolation).
"""

import sys
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 70)
    print("STARTING PHASE 8: CUSTOMER MEASUREMENT MANAGEMENT TEST SUITE")
    print("=" * 70)

    with TestClient(app) as client:
        # Step 1: Customer Login
        print("\n[STEP 1] Customer logs in...")
        login_resp = client.post(
            "/api/auth/login",
            json={"email": "alexander.hayes@mayfair.co.uk", "password": "Password123"}
        )
        assert login_resp.status_code == 200, f"Customer login failed: {login_resp.text}"
        customer_token = login_resp.json()["access_token"]
        customer_headers = {"Authorization": f"Bearer {customer_token}"}
        print("  [OK] Customer logged in successfully. JWT Token acquired.")

        # Step 2: Fetch Garment Templates
        print("\n[STEP 2] Requesting garment templates from API (/api/measurement-templates)...")
        templates_resp = client.get("/api/measurement-templates", headers=customer_headers)
        assert templates_resp.status_code == 200, f"Templates list failed: {templates_resp.text}"
        templates = templates_resp.json()
        print(f"  [OK] Found {len(templates)} seeded templates:")
        for t in templates:
            print(f"       - {t['name']} (Garment: {t['garment_type']}, Fields: {t['field_count']})")

        shirt_tpl = next((t for t in templates if t["garment_type"] == "SHIRT"), None)
        assert shirt_tpl is not None, "Shirt template not found!"
        shirt_id = shirt_tpl["id"]

        # Step 3: Fetch Shirt Details with Fields
        print(f"\n[STEP 3 & 4] Customer selects Shirt (ID: {shirt_id}). Fetching template details...")
        shirt_detail_resp = client.get(f"/api/measurement-templates/{shirt_id}", headers=customer_headers)
        assert shirt_detail_resp.status_code == 200, f"Template detail failed: {shirt_detail_resp.text}"
        shirt_detail = shirt_detail_resp.json()
        fields = shirt_detail["fields"]
        print(f"  [OK] Backend returned {len(fields)} measurement fields for Shirt:")
        for f in fields:
            print(f"       * {f['field_label']} ({f['field_name']}): req={f['required']}, unit={f['unit']}, range=[{f['min_value']}-{f['max_value']}]")
        
        # Verify required Shirt fields exist
        field_names = [f["field_name"] for f in fields]
        for expected in ["chest", "shoulder", "sleeve_length", "shirt_length", "neck"]:
            assert expected in field_names, f"Expected field '{expected}' missing from Shirt template!"
        print("  [OK] All core anatomical fields verified.")

        # Step 5: Validation Check (Testing rejected cases)
        print("\n[STEP 5 & 8] Testing Backend Validation rules...")
        # 5a: Missing required fields
        field_map = {f["field_name"]: f["id"] for f in fields}
        invalid_payload_missing = {
            "template_id": shirt_id,
            "measurement_name": "Incomplete Shirt",
            "unit": "inches",
            "values": [{"field_id": field_map["chest"], "value": 40.0}] # Missing shoulder, neck, etc.
        }
        res_fail_req = client.post("/api/customers/measurements", json=invalid_payload_missing, headers=customer_headers)
        assert res_fail_req.status_code == 400, "Backend should reject missing required fields!"
        print(f"  [OK] Correctly rejected incomplete measurements: {res_fail_req.json()['detail']}")

        # 5b: Negative/Zero measurement
        invalid_payload_neg = {
            "template_id": shirt_id,
            "measurement_name": "Invalid Negative",
            "unit": "inches",
            "values": [{"field_id": field_map["chest"], "value": -5.0}]
        }
        res_fail_neg = client.post("/api/customers/measurements", json=invalid_payload_neg, headers=customer_headers)
        assert res_fail_neg.status_code in [400, 422], f"Expected 400 or 422, got {res_fail_neg.status_code}: {res_fail_neg.text}"
        print(f"  [OK] Correctly rejected negative values (HTTP {res_fail_neg.status_code}): {res_fail_neg.json()['detail']}")

        # 5c: Unrealistic range
        invalid_payload_range = {
            "template_id": shirt_id,
            "measurement_name": "Unrealistic Range",
            "unit": "inches",
            "values": [
                {"field_id": field_map["chest"], "value": 250.0}, # Max is 80
                {"field_id": field_map["shoulder"], "value": 18.0},
                {"field_id": field_map["sleeve_length"], "value": 25.0},
                {"field_id": field_map["shirt_length"], "value": 30.0},
                {"field_id": field_map["neck"], "value": 16.0},
            ]
        }
        res_fail_range = client.post("/api/customers/measurements", json=invalid_payload_range, headers=customer_headers)
        assert res_fail_range.status_code == 400, "Backend should reject out-of-range values!"
        print(f"  [OK] Correctly rejected out-of-range value: {res_fail_range.json()['detail']}")

        # Step 6 & 7 & 9: Create Valid Customer Measurement
        print("\n[STEP 6, 7 & 9] Customer enters valid Shirt measurements and saves to DB...")
        valid_payload = {
            "template_id": shirt_id,
            "measurement_name": "My Savile Row Fit Shirt",
            "unit": "inches",
            "notes": "Prefer slim cut around waist and 0.5 inch extra ease in cuffs.",
            "values": [
                {"field_id": field_map["chest"], "value": 41.5},
                {"field_id": field_map["shoulder"], "value": 18.25},
                {"field_id": field_map["sleeve_length"], "value": 25.5},
                {"field_id": field_map["shirt_length"], "value": 31.0},
                {"field_id": field_map["neck"], "value": 16.5},
                {"field_id": field_map["waist"], "value": 34.0},
                {"field_id": field_map["bicep"], "value": 14.5},
                {"field_id": field_map["wrist"], "value": 7.5},
            ]
        }
        create_resp = client.post("/api/customers/measurements", json=valid_payload, headers=customer_headers)
        assert create_resp.status_code == 201, f"Create measurement failed: {create_resp.text}"
        created_meas = create_resp.json()
        measurement_id = created_meas["id"]
        print(f"  [OK] Measurement profile created successfully with ID: {measurement_id}")
        print(f"       Name: '{created_meas['measurement_name']}'")
        print(f"       Garment: {created_meas['garment_type']} ({created_meas['template_name']})")
        print(f"       Values saved: {len(created_meas['values'])} field values recorded.")

        # Step 10: Customer Views Saved Measurement
        print(f"\n[STEP 10] Customer views saved measurement (GET /api/customers/measurements/{measurement_id})...")
        view_resp = client.get(f"/api/customers/measurements/{measurement_id}", headers=customer_headers)
        assert view_resp.status_code == 200, f"Get measurement failed: {view_resp.text}"
        view_data = view_resp.json()
        assert view_data["measurement_name"] == "My Savile Row Fit Shirt"
        assert len(view_data["values"]) == 8
        print("  [OK] Retrieved saved measurement profile successfully.")

        # Also test list endpoint
        list_resp = client.get("/api/customers/measurements", headers=customer_headers)
        assert list_resp.status_code == 200
        assert any(m["id"] == measurement_id for m in list_resp.json())
        print(f"  [OK] Customer measurements list endpoint returns profile.")

        # Step 11: Customer Edits Measurement
        print(f"\n[STEP 11] Customer edits measurement profile (PUT /api/customers/measurements/{measurement_id})...")
        update_payload = {
            "measurement_name": "My Updated Savile Row Fit Shirt",
            "notes": "Adjusted collar ease for formal tie wear.",
            "values": [
                {"field_id": field_map["chest"], "value": 42.0},
                {"field_id": field_map["neck"], "value": 17.0},
            ]
        }
        update_resp = client.put(f"/api/customers/measurements/{measurement_id}", json=update_payload, headers=customer_headers)
        assert update_resp.status_code == 200, f"Update measurement failed: {update_resp.text}"
        updated_data = update_resp.json()
        assert updated_data["measurement_name"] == "My Updated Savile Row Fit Shirt"
        updated_chest = next(v["value"] for v in updated_data["values"] if v["field_id"] == field_map["chest"])
        assert updated_chest == 42.0, f"Chest was not updated to 42.0! Got {updated_chest}"
        print("  [OK] Customer successfully edited measurement profile name, notes, and values.")

        # Step 12: Security Isolation Check (Customer cannot access another's measurements)
        print("\n[STEP 12] Security isolation check: Another user cannot access Customer 1's measurement...")
        # Login as tailor (Master Vance)
        tailor_login = client.post(
            "/api/auth/login",
            json={"email": "master.vance@vanceatelier.com", "password": "Password123"}
        )
        assert tailor_login.status_code == 200
        tailor_headers = {"Authorization": f"Bearer {tailor_login.json()['access_token']}"}

        # Attempt to access customer's measurement as Tailor
        unauthorized_view = client.get(f"/api/customers/measurements/{measurement_id}", headers=tailor_headers)
        assert unauthorized_view.status_code in [404, 403], f"Security breach! Expected 404/403, got {unauthorized_view.status_code}"
        print(f"  [OK] Unauthorized access blocked with status {unauthorized_view.status_code}.")

        # Attempt to update customer's measurement as Tailor
        unauthorized_update = client.put(f"/api/customers/measurements/{measurement_id}", json=update_payload, headers=tailor_headers)
        assert unauthorized_update.status_code in [404, 403], f"Security breach! Expected 404/403, got {unauthorized_update.status_code}"
        print(f"  [OK] Unauthorized modification blocked with status {unauthorized_update.status_code}.")

        # Step 13: Customer Deletes Measurement
        print(f"\n[STEP 13] Customer deletes measurement profile (DELETE /api/customers/measurements/{measurement_id})...")
        delete_resp = client.delete(f"/api/customers/measurements/{measurement_id}", headers=customer_headers)
        assert delete_resp.status_code == 200, f"Delete measurement failed: {delete_resp.text}"
        print(f"  [OK] Measurement profile successfully deleted: {delete_resp.json()['message']}")

        # Verify it's gone
        get_deleted = client.get(f"/api/customers/measurements/{measurement_id}", headers=customer_headers)
        assert get_deleted.status_code == 404
        print("  [OK] Verified measurement is no longer accessible (404 Not Found).")

    print("\n" + "=" * 70)
    print("ALL PHASE 8 TESTS PASSED SUCCESSFULLY! (100% COMPLIANT)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
