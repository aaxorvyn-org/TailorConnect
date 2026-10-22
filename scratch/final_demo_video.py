import shutil
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(r"c:\Users\saini\OneDrive\Desktop\multi vendor web")
OUT_DIR = ROOT / "demo-recordings"
OUT_DIR.mkdir(exist_ok=True)

VIDEO_WEBM = OUT_DIR / "threadcraft_registration_design_demo.webm"
VIDEO_MP4 = OUT_DIR / "threadcraft_registration_design_demo.mp4"
VTT = OUT_DIR / "threadcraft_registration_design_demo.vtt"
SRT = OUT_DIR / "threadcraft_registration_design_demo.srt"

# Remove previous outputs to keep the final artifact clean.
for file in [VIDEO_WEBM, VIDEO_MP4, VTT, SRT]:
    if file.exists():
        file.unlink()


def create_subtitles():
    vtt = '''WEBVTT

00:00:00.000 --> 00:00:04.200
Welcome to ThreadCraft, the multi-vendor tailor marketplace.

00:00:04.200 --> 00:00:09.500
This website supports multiple languages, including English, Telugu, and Hindi.

00:00:09.500 --> 00:00:15.500
Use the language selector to switch the entire interface instantly.

00:00:15.500 --> 00:00:22.500
Now we show the customer registration form with name, email, phone, and password details.

00:00:22.500 --> 00:00:30.000
Next, the tailor registration form collects shop information, specialties, and service pricing.

00:00:30.000 --> 00:00:37.500
The admin onboarding form includes department selection and a security passcode.

00:00:37.500 --> 00:00:45.000
After registration, the tailor can open the design studio and publish a new design.

00:00:45.000 --> 00:00:55.000
Upload a product image, add title, category, and fabric details, then publish the design.

00:00:55.000 --> 00:01:02.000
This is how ThreadCraft works from registration to design publishing.
'''
    VTT.write_text(vtt, encoding='utf-8')

    srt = '''1
00:00:00,000 --> 00:00:04,200
Welcome to ThreadCraft, the multi-vendor tailor marketplace.

2
00:00:04,200 --> 00:00:09,500
This website supports multiple languages, including English, Telugu, and Hindi.

3
00:00:09,500 --> 00:00:15,500
Use the language selector to switch the entire interface instantly.

4
00:00:15,500 --> 00:00:22,500
Now we show the customer registration form with name, email, phone, and password details.

5
00:00:22,500 --> 00:00:30,000
Next, the tailor registration form collects shop information, specialties, and service pricing.

6
00:00:30,000 --> 00:00:37,500
The admin onboarding form includes department selection and a security passcode.

7
00:00:37,500 --> 00:00:45,000
After registration, the tailor can open the design studio and publish a new design.

8
00:00:45,000 --> 00:00:55,000
Upload a product image, add title, category, and fabric details, then publish the design.

9
00:00:55,000 --> 00:01:02,000
This is how ThreadCraft works from registration to design publishing.
'''
    SRT.write_text(srt, encoding='utf-8')


def convert_to_mp4():
    import imageio_ffmpeg

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [
            ffmpeg,
            '-y',
            '-i',
            str(VIDEO_WEBM),
            '-c:v',
            'libx264',
            '-pix_fmt',
            'yuv420p',
            '-movflags',
            '+faststart',
            str(VIDEO_MP4),
        ],
        check=True,
    )


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1440, 'height': 980},
        record_video_dir=str(OUT_DIR),
        locale='en-US',
        timezone_id='Asia/Kolkata',
    )
    page = context.new_page()

    page.goto('http://127.0.0.1:5173/login', wait_until='networkidle')
    page.wait_for_timeout(1200)

    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='हिन्दी').click()
    page.wait_for_timeout(1200)
    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='తెలుగు').click()
    page.wait_for_timeout(1200)
    page.locator('#language-selector-button').click()
    page.get_by_role('menuitem', name='English').click()
    page.wait_for_timeout(1000)

    page.goto('http://127.0.0.1:5173/register', wait_until='networkidle')
    page.wait_for_timeout(1200)
    page.get_by_label('Full Name').fill('Rahul Sharma')
    page.get_by_label('Email Address').fill('rahul.sharma@example.com')
    page.get_by_label('Phone / WhatsApp').fill('+91 98765 43210')
    page.get_by_label('City / Area').fill('Hyderabad')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.wait_for_timeout(2000)

    page.get_by_role('button', name='Tailor Shop Registration').click()
    page.wait_for_timeout(1200)
    page.get_by_label('Shop Name').fill('Royal Silk Atelier')
    page.get_by_label('Tailor / Owner Name').fill('Vikram Rao')
    page.get_by_label('Email Address').fill('vikram@royalsilkatelier.com')
    page.get_by_label('Phone Number').fill('+91 99887 66554')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.get_by_label('City').fill('Bengaluru')
    page.get_by_label('Shop Address / Area').fill('MG Road, Bengaluru')
    page.get_by_label('I agree to the quality standards and platform terms.').check()
    page.wait_for_timeout(1500)

    page.goto('http://127.0.0.1:5173/register', wait_until='networkidle')
    page.wait_for_timeout(1200)
    page.get_by_role('button', name='Admin Onboarding').click()
    page.wait_for_timeout(1000)
    page.get_by_label('Full Name').fill('Nisha Verma')
    page.get_by_label('Email Address').fill('nisha@threadcraft.luxury')
    page.get_by_label('Phone / WhatsApp').fill('+91 90000 11111')
    page.locator('select').select_option('deptOperations')
    page.get_by_label('Admin Master Passcode').fill('threadcraft_admin_2026')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.wait_for_timeout(2000)

    page.goto('http://127.0.0.1:5173/register-tailor', wait_until='networkidle')
    page.wait_for_timeout(1200)
    page.get_by_label('Shop Name').fill('Royal Silk Atelier')
    page.get_by_label('Tailor / Owner Name').fill('Vikram Rao')
    page.get_by_label('Email Address').fill('vikram@royalsilkatelier.com')
    page.get_by_label('Phone Number').fill('+91 99887 66554')
    page.locator('input[type="password"]').nth(0).fill('Password123')
    page.locator('input[type="password"]').nth(1).fill('Password123')
    page.get_by_label('City').fill('Bengaluru')
    page.get_by_label('Shop Address / Area').fill('MG Road, Bengaluru')
    page.get_by_label('I agree to the quality standards and platform terms.').check()
    page.get_by_role('button', name='Submit Shop Registration').click()
    page.wait_for_timeout(2500)

    page.goto('http://127.0.0.1:5173/dashboard/tailor/designs', wait_until='networkidle')
    page.wait_for_timeout(1500)
    page.get_by_role('button', name='Add New Design').click()
    page.wait_for_timeout(1200)
    page.get_by_label('Design Title').fill('Royal Peacock Bridal Blouse')
    page.locator('select').nth(0).select_option('Blouse Stitching')
    page.get_by_label('Price Estimate').fill('245')
    page.get_by_label('Tags').fill('Peacock, Bridal, Handwork')
    page.get_by_label('Description').fill('Luxury bridal blouse with fine embroidery and structured fit.')
    page.get_by_label('Fabric Options').fill('Raw Silk, Zardozi, Satin')
    page.get_by_role('button', name='Publish Design').click()
    page.wait_for_timeout(2500)

    page.wait_for_timeout(1000)
    context.close()
    browser.close()

for webm_file in sorted(OUT_DIR.glob('*.webm')):
    if webm_file.name != VIDEO_WEBM.name:
        shutil.move(str(webm_file), str(VIDEO_WEBM))
        break

if not VIDEO_WEBM.exists():
    raise FileNotFoundError('WebM recording was not created.')

convert_to_mp4()
create_subtitles()

print(f'Created MP4: {VIDEO_MP4}')
print(f'Created VTT: {VTT}')
print(f'Created SRT: {SRT}')
