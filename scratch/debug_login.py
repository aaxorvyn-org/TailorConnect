import time, json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
SHOTS = r"C:\Users\saini\OneDrive\Desktop\multi vendor web\scratch\debug"

import os
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.on("console", lambda m: print("CONSOLE:", m.type, m.text[:300], flush=True))
    page.on("response", lambda r: print("RESP:", r.status, r.url[:160], flush=True) if "/api/" in r.url else None)
    page.on("pageerror", lambda e: print("PAGEERROR:", str(e)[:400], flush=True))

    page.goto(BASE + "/login", wait_until="domcontentloaded")
    page.wait_for_timeout(2500)

    quick = page.locator("//span[normalize-space()='Quick Demo Login']/following-sibling::div//button")
    print("quick count", quick.count(), flush=True)
    for i in range(quick.count()):
        print(i, repr(quick.nth(i).inner_text()), quick.nth(i).is_visible(), flush=True)

    quick.nth(0).click()
    page.wait_for_timeout(6000)
    print("URL after click:", page.url, flush=True)
    print("BODY SNIPPET:", page.locator("body").inner_text()[:800].replace("\n", " | "), flush=True)
    page.screenshot(path=os.path.join(SHOTS, "after-login-click.png"))
    ctx.close()
    b.close()
