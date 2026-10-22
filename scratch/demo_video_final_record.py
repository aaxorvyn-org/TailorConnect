import os
import shutil
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(r"c:\Users\saini\OneDrive\Desktop\multi vendor web")
OUT_DIR = ROOT / "demo-recordings"
OUT_DIR.mkdir(exist_ok=True)

FINAL_MP4 = OUT_DIR / "threadcraft-registration-design-demo.mp4"
FINAL_VTT = OUT_DIR / "threadcraft-registration-design-demo.vtt"
FINAL_SRT = OUT_DIR / "threadcraft-registration-design-demo.srt"

for p in [FINAL_MP4, FINAL_VTT, FINAL_SRT]:
    if p.exists():
        p.unlink()

# Subtitle content matching the final recorded flow.
FINAL_VTT = '''WEBVTT

00:00:00.000 --> 00:00:03.000
Welcome to ThreadCraft.

00:00:03.000 --> 00:00:08.500
This website supports three languages: English, Telugu, and Hindi.

00:00:08.500 --> 00:00:13.500
Use the language selector to switch the interface instantly.

00:00:13.500 --> 00:00:20.500
First, we review the customer registration form with full name, email, phone, city, and password.

00:00:20.500 --> 00:00:29.000
Next, the tailor registration form captures shop details, experience, pricing, and service promises.

00:00:29.000 --> 00:00:36.500
Then we open the admin onboarding form with a security passcode and department setup.

00:00:36.500 --> 00:00:46.000
After registration, the tailor dashboard allows adding a new design with title, category, price, and fabric details.

00:00:46.000 --> 00:00:54.000
The new design is published and the platform is ready to serve customers.
'''

FINAL_SRT = '''1
00:00:00,000 --> 00:00:03,000
Welcome to ThreadCraft.

2
00:00:03,000 --> 00:00:08,500
This website supports three languages: English, Telugu, and Hindi.

3
00:00:08,500 --> 00:00:13,500
Use the language selector to switch the interface instantly.

4
00:00:13,500 --> 00:00:20,500
First, we review the customer registration form with full name, email, phone, city, and password.

5
00:00:20,500 --> 00:00:29,000
Next, the tailor registration form captures shop details, experience, pricing, and service promises.

6
00:00:29,000 --> 00:00:36,500
Then we open the admin onboarding form with a security passcode and department setup.

7
00:00:36,500 --> 00:00:46,000
After registration, the tailor dashboard allows adding a new design with title, category, price, and fabric details.

8
00:00:46,000 --> 00:00:54,000
The new design is published and the platform is ready to serve customers.
'''

(OUT_DIR / 'threadcraft-registration-design-demo.vtt').write_text(FINAL_VTT, encoding='utf-8')
(OUT_DIR / 'threadcraft-registration-design-demo.srt').write_text(FINAL_SRT, encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1440, 'height': 980},
        locale='en-US',
        timezone_id='Asia/Kolkata',
        record_video_dir=str(OUT_DIR),
    )
    page = context.new_page()

    page.goto('http://127.0.0.1:5173/login', wait_until='networkidle')
    page.wait_for_timeout(1000)
    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='हिन्दी').click()
    page.wait_for_timeout(1200)
    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='తెలుగు').click()
    page.wait_for_timeout(1200)
    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='English').click()
    page.wait_for_timeout(1500)

    page.goto('http://127.0.0.1:5173/register', wait_until='networkidle')
    page.wait_for_timeout(1200)
    page.locator('input').nth(0).fill('Rahul Sharma')
    page.locator('input').nth(1).fill('rahul.sharma@example.com')
    page.locator('input').nth(2).fill('+91 98765 43210')
    page.locator('input').nth(3).fill('Hyderabad')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.wait_for_timeout(1500)

    page.goto('http://127.0.0.1:5173/register-tailor', wait_until='networkidle')
    page.wait_for_timeout(1200)
    page.locator('input').nth(0).fill('Royal Silk Atelier')
    page.locator('input').nth(1).fill('Vikram Rao')
    page.locator('input').nth(2).fill('vikram@royalsilkatelier.com')
    page.locator('input').nth(3).fill('+91 99887 66554')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.locator('input').nth(6).fill('Bengaluru')
    page.locator('input').nth(7).fill('MG Road, Bengaluru')
    page.locator('input[type="checkbox"]').first.check()
    page.wait_for_timeout(2000)

    page.goto('http://127.0.0.1:5173/register', wait_until='networkidle')
    page.wait_for_timeout(1200)
    page.get_by_role('button', name='Admin Onboarding').click()
    page.wait_for_timeout(1000)
    page.locator('input').nth(0).fill('Nisha Verma')
    page.locator('input').nth(1).fill('nisha@threadcraft.luxury')
    page.locator('input').nth(2).fill('+91 90000 11111')
    page.locator('select').select_option('deptOperations')
    page.locator('input[type="password"]').nth(0).fill('threadcraft_admin_2026')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.locator('input[type="password"]').nth(2).fill('Password123')
    page.wait_for_timeout(2000)

    page.goto('http://127.0.0.1:5173/login', wait_until='networkidle')
    page.wait_for_timeout(1000)
    page.locator('input').nth(0).fill('master.vance@vanceatelier.com')
    page.locator('input').nth(1).fill('Password123')
    page.get_by_role('button', name='Sign In as Tailor').click()
    page.wait_for_timeout(5000)

    page.goto('http://127.0.0.1:5173/dashboard/tailor/designs', wait_until='networkidle')
    page.wait_for_timeout(2000)
    page.get_by_role('button', name='Add New Design').click()
    page.wait_for_timeout(1200)
    page.locator('input').nth(0).fill('Royal Peacock Bridal Blouse')
    page.locator('select').select_option('Blouse Stitching')
    page.locator('input').nth(1).fill('245')
    page.locator('input').nth(2).fill('Peacock, Bridal, Handwork')
    page.locator('textarea').nth(0).fill('Luxury bridal blouse with fine embroidery and structured fit.')
    page.locator('input').nth(3).fill('Raw Silk, Zardozi, Satin')
    page.get_by_role('button', name='Publish Design').click()
    page.wait_for_timeout(3000)

    page.wait_for_timeout(1000)
    context.close()
    browser.close()

webm_candidates = sorted(OUT_DIR.glob('*.webm'))
if not webm_candidates:
    raise FileNotFoundError('No WebM video was created by Playwright.')
webm_path = webm_candidates[-1]
mp4_path = OUT_DIR / 'threadcraft-registration-design-demo.mp4'
ffmpeg = 'C:/Users/saini/OneDrive/Desktop/multi vendor web/backend/.venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
subprocess.run([
    ffmpeg,
    '-y',
    '-i', str(webm_path),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    str(mp4_path)
], check=True)

print(f'Created final MP4: {mp4_path}')
print(f'Created VTT: {OUT_DIR / "threadcraft-registration-design-demo.vtt"}')
print(f'Created SRT: {OUT_DIR / "threadcraft-registration-design-demo.srt"}')
