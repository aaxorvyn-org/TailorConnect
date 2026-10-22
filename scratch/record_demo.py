import os
import sys
import time
import glob
import shutil

from playwright.sync_api import sync_playwright

ROOT = r"C:\Users\saini\OneDrive\Desktop\multi vendor web"
BASE = "http://localhost:5173"
OUT = os.path.join(ROOT, "scratch", "recordings")
SHOTS = os.path.join(ROOT, "scratch", "demo-shots")

os.makedirs(OUT, exist_ok=True)
os.makedirs(SHOTS, exist_ok=True)

for f in glob.glob(os.path.join(OUT, "*")):
    try:
        os.remove(f)
    except OSError:
        pass
for f in glob.glob(os.path.join(SHOTS, "*")):
    try:
        os.remove(f)
    except OSError:
        pass

STEP = [0]


def log(msg):
    STEP[0] += 1
    print(f"[{STEP[0]:03d}] {msg}", flush=True)


def wait(page, ms=800):
    page.wait_for_timeout(ms)


def shot(page, name):
    path = os.path.join(SHOTS, f"{STEP[0]:03d}-{name}.png")
    try:
        page.screenshot(path=path)
    except Exception as e:
        print(f"  shot failed: {e}", flush=True)


def settle(page, ms=1400):
    try:
        page.wait_for_load_state("networkidle", timeout=8000)
    except Exception:
        pass
    wait(page, ms)


def scroll(page, steps=5, delta=650, pause=0.55):
    for _ in range(steps):
        page.mouse.wheel(0, delta)
        wait(page, int(pause * 1000))


def to_top(page, pause=700):
    page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
    wait(page, pause)


def wait_url(page, suffix, timeout=25000):
    """SPA-safe URL wait (client side routing does not fire a 'load' event)."""
    end = time.time() + timeout / 1000.0
    while time.time() < end:
        if page.url.rstrip("/").endswith(suffix.rstrip("/")) or suffix in page.url:
            return True
        wait(page, 250)
    print(f"    !! url wait timed out for {suffix} (at {page.url})", flush=True)
    return False


def wait_content(page, timeout=12000):
    """Wait until skeleton shimmering is done so we never film empty loading states."""
    end = time.time() + timeout / 1000.0
    while time.time() < end:
        try:
            if page.locator(".animate-pulse:not(.rounded-full)").count() == 0:
                break
        except Exception:
            break
        wait(page, 300)
    wait(page, 600)


def goto(page, path, name, ms=1600, scroll_steps=0):
    log(f"OPEN {path}  ({name})")
    page.goto(BASE + path, wait_until="domcontentloaded")
    settle(page, ms)
    wait_content(page)
    shot(page, name)
    if scroll_steps:
        scroll(page, scroll_steps)


def open_lang(page):
    btn = page.locator('#language-selector-button:visible')
    btn.first.click()
    wait(page, 600)


def pick_lang(page, idx, label):
    items = page.locator('[role="menuitem"]:visible')
    n = items.count()
    log(f"LANGUAGE -> {label}  (menu items: {n})")
    items.nth(idx).click()
    wait(page, 900)


def set_lang(page, idx, label):
    open_lang(page)
    pick_lang(page, idx, label)


def login_as(page, idx, label, dash_path):
    log(f"LOGIN as {label}")
    page.goto(BASE + "/login", wait_until="domcontentloaded")
    settle(page, 1400)
    shot(page, f"login-page")
    quick = page.locator("//span[normalize-space()='Quick Demo Login']/following-sibling::div//button")
    log(f"  quick demo buttons found: {quick.count()}")
    quick.nth(idx).click()
    wait_url(page, dash_path, 25000)
    settle(page, 2000)
    wait_content(page)
    shot(page, f"{label.lower()}-logged-in")


def logout(page, label):
    log(f"SIGN OUT ({label})")
    btn = page.locator('aside button:has-text("Sign Out")')
    if btn.count() == 0:
        btn = page.get_by_role("button", name="Sign Out")
    btn.first.click()
    wait_url(page, "/login", 20000)
    settle(page, 1500)
    shot(page, f"after-logout-{label.lower()}")


def side(page, href, name):
    log(f"  sidebar -> {name}  [{href}]")
    link = page.locator(f'aside a[href="{href}"]')
    if link.count() == 0:
        print(f"    !! sidebar link not found for {href}", flush=True)
        return
    link.first.click()
    wait_url(page, href, 12000)
    settle(page, 1200)
    wait_content(page)
    shot(page, name)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-gpu"])
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=OUT,
            record_video_size={"width": 1440, "height": 900},
            locale="en-US",
            color_scheme="dark",
        )
        context.set_default_timeout(15000)
        page = context.new_page()

        # ---------------- 1. PUBLIC MARKETPLACE ----------------
        log("CHAPTER 1: PUBLIC MARKETPLACE")
        goto(page, "/", "home-hero", 2200, scroll_steps=7)
        to_top(page)

        # language switcher on the public navbar (3 languages)
        log("CHAPTER 2: LANGUAGES (3 supported: English / Telugu / Hindi)")
        set_lang(page, 1, "Telugu (te)")
        shot(page, "home-telugu")
        wait(page, 700)
        set_lang(page, 2, "Hindi (hi)")
        shot(page, "home-hindi")
        wait(page, 700)
        set_lang(page, 0, "English (en)")
        shot(page, "home-english")
        wait(page, 700)

        goto(page, "/tailors", "find-tailors", 2000, scroll_steps=5)
        to_top(page)
        goto(page, "/services", "services", 1600, scroll_steps=3)
        to_top(page)
        goto(page, "/about", "about", 1600, scroll_steps=3)
        to_top(page)

        # ---------------- 2. LOGIN / ROLES ----------------
        log("CHAPTER 3: MULTI-ROLE LOGIN")
        page.goto(BASE + "/login", wait_until="domcontentloaded")
        settle(page, 1600)
        tabs = page.locator("//div[contains(@class,'grid-cols-3') and contains(@class,'gap-1')]//button")
        log(f"  role tabs found: {tabs.count()}")
        tabs.nth(1).click()
        wait(page, 800)
        shot(page, "login-tailor-tab")
        tabs.nth(2).click()
        wait(page, 800)
        shot(page, "login-admin-tab")
        tabs.nth(0).click()
        wait(page, 800)
        shot(page, "login-customer-tab")
        wait(page, 600)

        # ---------------- 3. CUSTOMER DASHBOARD ----------------
        log("CHAPTER 4: CUSTOMER DASHBOARD")
        login_as(page, 0, "Customer", "/dashboard/customer")
        goto(page, "/dashboard/customer", "customer-overview", 2000, scroll_steps=4)
        side(page, "/dashboard/customer/nearby", "customer-nearby")
        scroll(page, 3, 600)
        to_top(page)
        side(page, "/dashboard/customer/measurements", "customer-measurements")
        scroll(page, 3, 600)
        to_top(page)
        side(page, "/dashboard/customer/orders", "customer-orders")
        scroll(page, 3, 600)
        to_top(page)
        side(page, "/dashboard/customer/profile", "customer-profile")
        scroll(page, 5, 600)
        to_top(page)

        # language switch inside the dashboard
        log("CHAPTER 5: DASHBOARD LANGUAGE SWITCH")
        set_lang(page, 1, "Telugu (te)")
        shot(page, "customer-telugu")
        wait(page, 800)
        set_lang(page, 2, "Hindi (hi)")
        shot(page, "customer-hindi")
        wait(page, 800)
        set_lang(page, 0, "English (en)")
        shot(page, "customer-english")
        wait(page, 700)

        logout(page, "Customer")

        # ---------------- 4. TAILOR DASHBOARD ----------------
        log("CHAPTER 6: TAILOR ATELIER DASHBOARD")
        login_as(page, 1, "Tailor", "/dashboard/tailor")
        goto(page, "/dashboard/tailor", "tailor-overview", 2000, scroll_steps=4)
        side(page, "/dashboard/tailor/profile", "tailor-shop-profile")
        scroll(page, 3, 600)
        to_top(page)
        side(page, "/dashboard/tailor/customers", "tailor-customers")
        scroll(page, 3, 600)
        to_top(page)
        side(page, "/dashboard/tailor/designs", "tailor-designs")
        scroll(page, 3, 600)
        to_top(page)
        side(page, "/dashboard/tailor/orders", "tailor-orders")
        scroll(page, 3, 600)
        to_top(page)
        side(page, "/dashboard/tailor/settings", "tailor-settings")
        scroll(page, 3, 600)
        to_top(page)

        logout(page, "Tailor")

        # ---------------- 5. ADMIN DASHBOARD ----------------
        log("CHAPTER 7: ADMIN CONSOLE")
        login_as(page, 2, "Admin", "/dashboard/admin")
        goto(page, "/dashboard/admin", "admin-console", 2000, scroll_steps=4)
        side(page, "/dashboard/admin?tab=tailors", "admin-tailors")
        side(page, "/dashboard/admin?tab=customers", "admin-customers")
        side(page, "/dashboard/admin?tab=shops", "admin-shops")
        side(page, "/dashboard/admin?tab=orders", "admin-orders")
        side(page, "/dashboard/admin?tab=reviews", "admin-reviews")

        logout(page, "Admin")

        # ---------------- 6. OUTRO ----------------
        log("CHAPTER 8: OUTRO - BACK TO MARKETPLACE")
        goto(page, "/", "outro-home", 2000, scroll_steps=3)

        wait(page, 1500)
        video_path = page.video.path()
        context.close()
        browser.close()
        print("VIDEO_PATH=" + video_path, flush=True)


if __name__ == "__main__":
    main()
