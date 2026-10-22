from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://127.0.0.1:5173/login', wait_until='networkidle')
    page.evaluate("""
        localStorage.setItem('threadcraft_token', 'demo-token');
        localStorage.setItem('threadcraft_user', JSON.stringify({
            id: 1,
            email: 'tailor@example.com',
            full_name: 'Demo Tailor',
            role: 'TAILOR',
            is_active: true,
            is_verified: true,
            created_at: '2026-01-01T00:00:00Z'
        }));
    """)
    page.goto('http://127.0.0.1:5173/dashboard/tailor/designs', wait_until='networkidle')
    print('TITLE', page.title())
    print('BUTTONS')
    for btn in page.locator('button').all():
        txt = btn.text_content().strip()
        if txt:
            print(txt)
    print('INPUTS')
    for i in range(page.locator('input').count()):
        el = page.locator('input').nth(i)
        print(i, el.get_attribute('type'), el.get_attribute('placeholder'), el.get_attribute('aria-label'))
    print('TEXTAREA', page.locator('textarea').count())
    print('SELECT', page.locator('select').count())
    browser.close()
