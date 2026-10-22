import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://127.0.0.1:8000/api"

def api_post(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def api_get(endpoint, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="GET"
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def test_fullstack_flow():
    ts = int(time.time())
    print("Testing Fullstack Registration & Dashboard Access for Customer, Tailor, Admin...")

    # 1. Customer Registration
    cust_data = {
        "email": f"customer_{ts}@example.com",
        "password": "Password123",
        "full_name": "Ramesh Kumar (Customer)",
        "phone": "9876543210",
        "role": "CUSTOMER",
        "country": "India",
        "currency": "INR",
        "city": "Hyderabad"
    }
    status, res = api_post("/auth/register", cust_data)
    print(f"Customer Register Status: {status}")
    cust_token = res["access_token"]
    assert res["user"]["role"] == "CUSTOMER"

    # Verify Customer Me endpoint
    st, user_profile = api_get("/auth/me", cust_token)
    assert st == 200
    print("[SUCCESS] Customer successfully registered & verified profile:", user_profile["full_name"])

    # 2. Tailor Registration
    tailor_data = {
        "email": f"tailor_{ts}@example.com",
        "password": "Password123",
        "full_name": "Suresh Master Tailor",
        "phone": "9876543211",
        "role": "TAILOR",
        "shop_name": "Suresh Bespoke Stitching Shop",
        "city": "Vijayawada",
        "experience_years": 15,
        "specialties": "Suits, Bridal Blouses, Alterations"
    }
    status, res = api_post("/auth/register", tailor_data)
    print(f"Tailor Register Status: {status}")
    tailor_token = res["access_token"]
    assert res["user"]["role"] == "TAILOR"
    assert res["user"]["shop_name"] == "Suresh Bespoke Stitching Shop"

    # Verify Tailor can immediately fetch shop orders without 404!
    st, orders = api_get("/tailors/orders", tailor_token)
    print(f"Tailor Orders Fetch Status: {st}, Found {len(orders)} orders")
    assert st == 200, "Tailor orders fetch failed"
    print("[SUCCESS] Tailor successfully registered & shop auto-provisioned!")

    # 3. Admin Registration
    admin_data = {
        "email": f"admin_{ts}@example.com",
        "password": "Password123",
        "full_name": "Kavitha Reddy (Admin)",
        "phone": "9876543212",
        "role": "ADMIN",
        "admin_secret": "threadcraft_admin_2026"
    }
    status, res = api_post("/auth/register", admin_data)
    print(f"Admin Register Status: {status}")
    admin_token = res["access_token"]
    assert res["user"]["role"] == "ADMIN"
    assert res["user"]["is_verified"] is True

    # Verify Admin can access dashboard stats
    st, stats = api_get("/admin/dashboard/stats", admin_token)
    print(f"Admin Stats Fetch Status: {st}")
    assert st == 200, "Admin stats fetch failed"
    print("Admin stats:", stats)
    print("[SUCCESS] Admin successfully registered & accessed platform governance metrics!")

    print("\n>>> ALL 3 REAL FULLSTACK REGISTRATION & DASHBOARD FLOWS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    test_fullstack_flow()
