import os
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(r"c:\Users\saini\OneDrive\Desktop\multi vendor web")
OUT_DIR = ROOT / "demo-recordings"
OUT_DIR.mkdir(exist_ok=True)

# Use a standard browser recording then convert to mp4 for compatibility.
VIDEO_WEBM = OUT_DIR / "threadcraft_demo_updated.webm"
VIDEO_MP4 = OUT_DIR / "threadcraft_demo_updated.mp4"
VTT = OUT_DIR / "threadcraft_demo_updated.vtt"
SRT = OUT_DIR / "threadcraft_demo_updated.srt"


def check_and_make(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path}")


def write_vtt_and_srt():
    vtt = '''WEBVTT

00:00:00.000 --> 00:00:04.000
Welcome to ThreadCraft, the multi-vendor tailor marketplace.

00:00:04.000 --> 00:00:08.500
Customers can sign in, register, and explore nearby tailors in seconds.

00:00:08.500 --> 00:00:12.500
This app supports three languages: English, Telugu, and Hindi.

00:00:12.500 --> 00:00:18.500
The language switcher lets users instantly change the interface.

00:00:18.500 --> 00:00:24.500
Now we open the customer registration form and complete the details.

00:00:24.500 --> 00:00:31.500
Next, the tailor registration form is shown for shop owners and specialists.

00:00:31.500 --> 00:00:38.500
The admin registration form includes a secure passcode and department setup.

00:00:38.500 --> 00:00:46.500
After registration, the tailor dashboard lets shop owners add a new design by uploading media.

00:00:46.500 --> 00:00:54.000
The design is published to the portfolio and the website is ready to use.

00:00:54.000 --> 00:00:59.000
This demo shows how ThreadCraft works end to end.
'''
    VTT.write_text(vtt, encoding="utf-8")

    srt = '''1
00:00:00,000 --> 00:00:04,000
Welcome to ThreadCraft, the multi-vendor tailor marketplace.

2
00:00:04,000 --> 00:00:08,500
Customers can sign in, register, and explore nearby tailors in seconds.

3
00:00:08,500 --> 00:00:12,500
This app supports three languages: English, Telugu, and Hindi.

4
00:00:12,500 --> 00:00:18,500
The language switcher lets users instantly change the interface.

5
00:00:18,500 --> 00:00:24,500
Now we open the customer registration form and complete the details.

6
00:00:24,500 --> 00:00:31,500
Next, the tailor registration form is shown for shop owners and specialists.

7
00:00:31,500 --> 00:00:38,500
The admin registration form includes a secure passcode and department setup.

8
00:00:38,500 --> 00:00:46,500
After registration, the tailor dashboard lets shop owners add a new design by uploading media.

9
00:00:46,500 --> 00:00:54,000
The design is published to the portfolio and the website is ready to use.

10
00:00:54,000 --> 00:00:59,000
This demo shows how ThreadCraft works end to end.
'''
    SRT.write_text(srt, encoding="utf-8")


def convert_webm_to_mp4():
    # imageio-ffmpeg is used because ffmpeg isn't on PATH.
    try:
        import imageio_ffmpeg
    except Exception as exc:
        raise RuntimeError("imageio-ffmpeg is required for MP4 conversion.") from exc

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-i",
            str(VIDEO_WEBM),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(VIDEO_MP4),
        ],
        check=True,
    )


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1440, "height": 980},
        record_video_dir=str(OUT_DIR),
    )
    page = context.new_page()

    page.goto("http://127.0.0.1:5173/login", wait_until="networkidle")
    page.wait_for_timeout(1500)

    # Language selector flow
    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='हिन्दी').click()
    page.wait_for_timeout(1200)
    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='తెలుగు').click()
    page.wait_for_timeout(1200)
    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='English').click()
    page.wait_for_timeout(1000)

    # customer registration flow
    page.goto("http://127.0.0.1:5173/register", wait_until="networkidle")
    page.wait_for_timeout(1200)
    page.get_by_label('Full Name').fill('Rahul Sharma')
    page.get_by_label('Email').fill('rahul.sharma@example.com')
    page.get_by_label('Phone').fill('+91 98765 43210')
    page.get_by_label('City').fill('Hyderabad')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.get_by_role('button', name='Register as Customer').click()
    page.wait_for_timeout(2500)

    # tailor registration flow
    page.goto("http://127.0.0.1:5173/register-tailor", wait_until="networkidle")
    page.wait_for_timeout(1500)
    page.get_by_label('Shop Name').fill('Royal Silk Atelier')
    page.get_by_label('Master Tailor Name').fill('Vikram Rao')
    page.get_by_label('Business Email').fill('vikram@royalsilkatelier.com')
    page.get_by_label('Phone').fill('+91 99887 66554')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.get_by_label('City').fill('Bengaluru')
    page.get_by_label('Experience').fill('12')
    page.get_by_label('Starting Price').fill('350')
    page.get_by_label('Turnaround Days').fill('8')
    page.get_by_label('Bio').fill('Luxury bespoke tailoring and bridal crafting.')
    page.get_by_role('button', name='Register Tailor Shop').click()
    page.wait_for_timeout(2500)

    # admin registration flow
    page.goto("http://127.0.0.1:5173/register?role=admin", wait_until="networkidle")
    page.wait_for_timeout(1500)
    page.get_by_label('Full Name').fill('Nisha Verma')
    page.get_by_label('Email').fill('nisha@threadcraft.luxury')
    page.get_by_label('Phone').fill('+91 90000 11111')
    page.get_by_label('Department').select_option('deptOperations')
    page.get_by_label('Admin Security Key').fill('threadcraft_admin_2026')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.get_by_role('button', name='Register Administrator').click()
    page.wait_for_timeout(2500)

    # Tailor design publishing flow
    page.goto("http://127.0.0.1:5173/dashboard/tailor/designs", wait_until="networkidle")
    page.wait_for_timeout(2000)
    page.get_by_role('button', name='Add New Design').click()
    page.wait_for_timeout(1200)
    page.get_by_label('Design Title').fill('Royal Peacock Bridal Blouse')
    page.get_by_label('Category').select_option('Blouse Stitching')
    page.get_by_label('Price Estimate').fill('245')
    page.get_by_label('Tags').fill('Peacock, Bridal, Handwork')
    page.get_by_label('Description').fill('Luxury bridal blouse with fine embroidery and structured fit.')
    page.get_by_label('Fabric Options').fill('Raw Silk, Zardozi, Satin')
    page.get_by_role('button', name='Publish Design').click()
    page.wait_for_timeout(2500)

    # finish the recording
    page.wait_for_timeout(1000)
    context.close()
    browser.close()

# Convert to MP4 for reliable browser playback.
convert_webm_to_mp4()
write_vtt_and_srt()

print(f"Record saved: {VIDEO_WEBM}")
print(f"Converted MP4: {VIDEO_MP4}")
print(f"Captions: {VTT}")
print(f"SRT: {SRT}")
