import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import httpx
from app.core.security import create_access_token

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("ADMIN PANEL E2E INTEGRATION TEST")
    print("=" * 60)

    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[SUCCESS] 1. Backend health check passed.")

    # 2. RBAC Security Tests (Backend authorization enforcement)
    # 2a. Unauthenticated request to admin API -> 401
    unauth_res = client.get("/api/admin/dashboard/stats")
    assert unauth_res.status_code in [401, 403], f"Security fail: unauthenticated request allowed! Code: {unauth_res.status_code}"
    print("[SUCCESS] 2a. Unauthenticated request blocked (401/403).")

    # 2b. Customer role request to admin API -> 403 Forbidden
    cust_token = create_access_token(subject=1, role="CUSTOMER")
    cust_res = client.get("/api/admin/dashboard/stats", headers={"Authorization": f"Bearer {cust_token}"})
    assert cust_res.status_code == 403, f"Security fail: Customer allowed into admin API! Code: {cust_res.status_code}"
    print("[SUCCESS] 2b. Customer role blocked from admin APIs (403 Forbidden).")

    # 2c. Tailor role request to admin API -> 403 Forbidden
    tailor_token = create_access_token(subject=2, role="TAILOR")
    tailor_res = client.get("/api/admin/dashboard/stats", headers={"Authorization": f"Bearer {tailor_token}"})
    assert tailor_res.status_code == 403, f"Security fail: Tailor allowed into admin API! Code: {tailor_res.status_code}"
    print("[SUCCESS] 2c. Tailor role blocked from admin APIs (403 Forbidden).")

    # 3. Admin Authentication
    admin_token = create_access_token(subject=3, role="ADMIN")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[SUCCESS] 3. Admin authenticated with signed JWT token.")

    # 4. Admin Dashboard Stats
    stats_res = client.get("/api/admin/dashboard/stats", headers=admin_headers)
    assert stats_res.status_code == 200, f"Get stats failed: {stats_res.text}"
    stats = stats_res.json()
    assert "total_customers" in stats and stats["total_customers"] >= 1
    assert "total_tailors" in stats and stats["total_tailors"] >= 1
    assert "total_shops" in stats and stats["total_shops"] >= 1
    assert "total_orders" in stats and stats["total_orders"] >= 1
    assert "pending_shop_approvals" in stats
    assert "completed_orders" in stats
    assert "total_revenue" in stats
    print(f"[SUCCESS] 4. Admin Dashboard Metrics verified: "
          f"Customers={stats['total_customers']}, Tailors={stats['total_tailors']}, "
          f"Shops={stats['total_shops']}, Orders={stats['total_orders']}, "
          f"PendingApprovals={stats['pending_shop_approvals']}, CompletedOrders={stats['completed_orders']}, "
          f"Revenue=${stats['total_revenue']}")

    # 5. Tailor Management
    tailors_res = client.get("/api/admin/tailors?page=1&page_size=10", headers=admin_headers)
    assert tailors_res.status_code == 200, f"Get tailors failed: {tailors_res.text}"
    tailors_data = tailors_res.json()
    assert len(tailors_data["items"]) >= 1
    test_tailor = tailors_data["items"][0]
    tailor_id = test_tailor["id"]
    print(f"[SUCCESS] 5a. Tailors list retrieved ({tailors_data['total']} total tailors). Testing Tailor #{tailor_id} ({test_tailor['full_name']}).")

    # 5b. Toggle Tailor status
    new_tailor_status = not test_tailor["is_active"]
    upd_tailor_res = client.put(f"/api/admin/tailors/{tailor_id}/status", headers=admin_headers, json={"is_active": new_tailor_status})
    assert upd_tailor_res.status_code == 200
    assert upd_tailor_res.json()["is_active"] == new_tailor_status
    # Revert back
    client.put(f"/api/admin/tailors/{tailor_id}/status", headers=admin_headers, json={"is_active": test_tailor["is_active"]})
    print(f"[SUCCESS] 5b. Tailor status toggled and reverted cleanly.")

    # 6. Customer Management
    cust_list_res = client.get("/api/admin/customers?page=1&page_size=10", headers=admin_headers)
    assert cust_list_res.status_code == 200, f"Get customers failed: {cust_list_res.text}"
    customers_data = cust_list_res.json()
    assert len(customers_data["items"]) >= 1
    test_cust = customers_data["items"][0]
    cust_id = test_cust["id"]
    print(f"[SUCCESS] 6a. Customers list retrieved ({customers_data['total']} total). Testing Patron #{cust_id} ({test_cust['full_name']}).")

    # 6b. Toggle Customer status
    upd_cust_res = client.put(f"/api/admin/customers/{cust_id}/status", headers=admin_headers, json={"is_active": False})
    assert upd_cust_res.status_code == 200
    assert upd_cust_res.json()["is_active"] is False
    client.put(f"/api/admin/customers/{cust_id}/status", headers=admin_headers, json={"is_active": True})
    print(f"[SUCCESS] 6b. Customer status toggled and restored cleanly.")

    # 7. Shop Management
    shops_res = client.get("/api/admin/shops?page=1&page_size=10", headers=admin_headers)
    assert shops_res.status_code == 200, f"Get shops failed: {shops_res.text}"
    shops_data = shops_res.json()
    assert len(shops_data["items"]) >= 1
    test_shop = shops_data["items"][0]
    shop_id = test_shop["id"]
    print(f"[SUCCESS] 7a. Atelier shops list retrieved ({shops_data['total']} total). Testing Shop #{shop_id} ({test_shop['shop_name']}).")

    # 7b. Toggle Shop status (Storefront approval / suspension)
    upd_shop_res = client.put(f"/api/admin/shops/{shop_id}/status", headers=admin_headers, json={"is_active": False})
    assert upd_shop_res.status_code == 200
    assert upd_shop_res.json()["is_active"] is False
    # Check that pending_shop_approvals in dashboard stats increased
    pending_stats = client.get("/api/admin/dashboard/stats", headers=admin_headers).json()
    assert pending_stats["pending_shop_approvals"] >= 1
    # Restore shop
    client.put(f"/api/admin/shops/{shop_id}/status", headers=admin_headers, json={"is_active": True})
    print(f"[SUCCESS] 7b. Shop approval / suspension toggled, dashboard pending approvals counter reacted correctly.")

    # 8. Order Management
    orders_res = client.get("/api/admin/orders?page=1&page_size=10", headers=admin_headers)
    assert orders_res.status_code == 200, f"Get orders failed: {orders_res.text}"
    orders_data = orders_res.json()
    assert len(orders_data["items"]) >= 1
    test_order = orders_data["items"][0]
    order_id = test_order["id"]
    print(f"[SUCCESS] 8a. Orders list retrieved ({orders_data['total']} total). Testing Order #{order_id} ({test_order['order_number']}).")

    # 8b. Administrative Order status override
    upd_order_res = client.put(f"/api/admin/orders/{order_id}/status", headers=admin_headers, json={
        "status": "ACCEPTED",
        "notes": "Admin verified atelier capacity and confirmed commission."
    })
    assert upd_order_res.status_code == 200
    assert upd_order_res.json()["status"] == "ACCEPTED"
    print(f"[SUCCESS] 8b. Order status administrative override verified.")

    # 9. Review Management
    reviews_res = client.get("/api/admin/reviews?page=1&page_size=10", headers=admin_headers)
    assert reviews_res.status_code == 200, f"Get reviews failed: {reviews_res.text}"
    reviews_data = reviews_res.json()
    print(f"[SUCCESS] 9a. Reviews list retrieved ({reviews_data['total']} total reviews).")

    # 9b. Seed a test review on an existing order and verify moderation flow
    import app.models  # Ensure all model tables are loaded in metadata
    from app.database.base import Base
    from app.models.review import ShopReview
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    db_backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', 'tailor_marketplace_dev.db'))
    test_engine = create_engine(f"sqlite:///{db_backend_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestSessionLocal()
    try:
        # We already have an order from step 8a
        test_cust_id = test_order["customer_id"]
        test_shop_id = test_order["tailor_shop_id"]
        
        # Check if review already exists for this order, or clean it
        existing_rev = db.query(ShopReview).filter(ShopReview.order_id == order_id).first()
        if existing_rev:
            db.delete(existing_rev)
            db.commit()

        test_review = ShopReview(
            customer_id=test_cust_id,
            tailor_shop_id=test_shop_id,
            order_id=order_id,
            rating=5,
            comment="Exceptional Italian cashmere craftsmanship and perfect bespoke lapels!"
        )
        db.add(test_review)
        db.commit()
        db.refresh(test_review)
        test_review_id = test_review.id
        print(f"[SUCCESS] 9b. Seeded test review #{test_review_id} for Order #{order_id}.")
    finally:
        db.close()

    # 9c. Admin lists reviews and searches for text
    search_rev_res = client.get(f"/api/admin/reviews?search=cashmere", headers=admin_headers)
    assert search_rev_res.status_code == 200
    search_items = search_rev_res.json()["items"]
    assert any(r["id"] == test_review_id for r in search_items), "Review search by keyword failed"
    print(f"[SUCCESS] 9c. Review search by keyword ('cashmere') verified.")

    # 9d. Admin filters reviews by rating
    filter_rev_res = client.get(f"/api/admin/reviews?rating=5", headers=admin_headers)
    assert filter_rev_res.status_code == 200
    assert any(r["id"] == test_review_id for r in filter_rev_res.json()["items"]), "Review rating filter failed"
    print(f"[SUCCESS] 9d. Review star rating filter (5-star) verified.")

    # 9e. Security check: Customer cannot delete review via admin endpoint
    cust_del_res = client.delete(f"/api/admin/reviews/{test_review_id}", headers={"Authorization": f"Bearer {cust_token}"})
    assert cust_del_res.status_code == 403, "Security fail: Customer allowed to delete review via admin API!"
    print(f"[SUCCESS] 9e. Unauthorized deletion blocked (403 Forbidden).")

    # 9f. Admin moderates and deletes the review
    del_rev_res = client.delete(f"/api/admin/reviews/{test_review_id}", headers=admin_headers)
    assert del_rev_res.status_code == 200
    assert del_rev_res.json()["status"] == "ok"
    print(f"[SUCCESS] 9f. Admin review moderation / deletion verified.")

    # Verify review is gone
    after_del_res = client.get(f"/api/admin/reviews?search=cashmere", headers=admin_headers)
    assert after_del_res.status_code == 200
    assert not any(r["id"] == test_review_id for r in after_del_res.json()["items"]), "Review still exists after deletion"
    print(f"[SUCCESS] 9g. Verified review removed from system.")

    print("=" * 60)
    print("ALL ADMIN PANEL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"[ERROR] TEST RUN FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
