import os
import sys
import json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD_PATH = os.path.join(ROOT, "PROJECT_STATUS_AND_MODULE_INVENTORY.md")
HTML_OUT = os.path.join(ROOT, "PROJECT_STATUS_AND_MODULE_INVENTORY.html")
PDF_OUT = os.path.join(ROOT, "PROJECT_STATUS_AND_MODULE_INVENTORY.pdf")
STATIC_DOCS = os.path.join(ROOT, "backend", "app", "static", "docs")
os.makedirs(STATIC_DOCS, exist_ok=True)

with open(MD_PATH, "r", encoding="utf-8") as f:
    md_content = f.read()

# Load marked.js
MARKED_JS_PATH = os.path.join(ROOT, "scratch", "marked.min.js")
with open(MARKED_JS_PATH, "r", encoding="utf-8") as f:
    marked_js = f.read()

template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ThreadCraft — Project Status & Module Inventory</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {
    size: A4 portrait;
    margin: 18mm 14mm 20mm 14mm;
    @top-right {
      content: "ThreadCraft Tailoring Marketplace — Module Inventory";
      font-size: 8pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #94a3b8;
    }
    @bottom-left {
      content: "Confidential • Architectural Code Audit Report";
      font-size: 8pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #94a3b8;
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: bold;
      color: #64748b;
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.55;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  .container {
    max-width: 100%;
    margin: 0 auto;
    padding: 10px 0;
  }

  /* Header Cover Card */
  .cover-card {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #064e3b 100%);
    color: #ffffff;
    border-radius: 12px;
    padding: 24px 28px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  }

  .cover-card h1 {
    margin: 0 0 6px 0;
    font-size: 20pt;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
    border: none;
    padding: 0;
  }

  .cover-card .subtitle {
    font-size: 11pt;
    font-weight: 600;
    color: #34d399;
    margin-bottom: 14px;
    letter-spacing: 0.01em;
  }

  .cover-card .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 8pt;
  }

  .cover-card .meta-item strong {
    display: block;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 7pt;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }

  .cover-card .meta-item span {
    color: #f8fafc;
    font-weight: 600;
  }

  /* Headings */
  h1 {
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin-top: 24px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
    page-break-after: avoid;
  }

  h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
    margin-top: 20px;
    margin-bottom: 10px;
    padding-bottom: 4px;
    border-bottom: 1.5px solid #059669;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 16px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }

  h4 {
    font-size: 10pt;
    font-weight: 700;
    color: #334155;
    margin-top: 12px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  p {
    margin-top: 0;
    margin-bottom: 10px;
    color: #334155;
  }

  ul, ol {
    margin-top: 0;
    margin-bottom: 10px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
    color: #334155;
  }

  blockquote {
    margin: 12px 0;
    padding: 10px 14px;
    background-color: #f8fafc;
    border-left: 4px solid #059669;
    border-radius: 0 8px 8px 0;
    color: #334155;
    font-size: 9pt;
  }

  blockquote p {
    margin: 0 0 4px 0;
  }

  blockquote p:last-child {
    margin-bottom: 0;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 14px 0 20px 0;
    font-size: 8pt;
    line-height: 1.45;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    page-break-inside: avoid;
  }

  thead {
    background-color: #0f172a;
    color: #ffffff;
  }

  th {
    padding: 8px 10px;
    text-align: left;
    font-weight: 700;
    font-size: 8pt;
    letter-spacing: 0.02em;
    border-bottom: 1px solid #334155;
    color: #f8fafc;
  }

  td {
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  tr:hover td {
    background-color: #f1f5f9;
  }

  /* Code & Pre */
  code {
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 8pt;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 12px 14px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 8pt;
    line-height: 1.4;
    margin: 12px 0;
    page-break-inside: avoid;
    border: 1px solid #1e293b;
  }

  pre code {
    background: none;
    border: none;
    padding: 0;
    color: #f8fafc;
    font-size: 8pt;
  }

  /* Badges & Chips */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    font-size: 7.5pt;
    font-weight: 700;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    line-height: 1.2;
    white-space: nowrap;
  }

  .badge-success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  }

  .badge-warning {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  .badge-danger {
    background-color: #ffe4e6;
    color: #9f1239;
    border: 1px solid #fda4af;
  }

  .badge-info {
    background-color: #e0f2fe;
    color: #0369a1;
    border: 1px solid #7dd3fc;
  }

  .badge-neutral {
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 22px 0;
  }

  /* Print specific utilities */
  .page-break {
    page-break-before: always;
  }

  .no-break {
    page-break-inside: avoid;
  }

  /* Print Action Button (Hidden on Print) */
  .action-bar {
    position: fixed;
    top: 16px;
    right: 20px;
    display: flex;
    gap: 8px;
    z-index: 1000;
  }

  .btn-print {
    background-color: #059669;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    font-size: 9pt;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-print:hover {
    background-color: #047857;
  }

  @media print {
    .action-bar {
      display: none !important;
    }
  }
</style>
</head>
<body>

<div class="action-bar">
  <button class="btn-print" onclick="window.print()">
    🖨️ Print / Download PDF
  </button>
</div>

<div class="container">
  <div id="content"></div>
</div>

<script>
""" + marked_js + """

// Setup marked
marked.setOptions({
  gfm: true,
  breaks: false,
});

const rawMd = """ + json.dumps(md_content) + """;
let html = marked.parse(rawMd);

// Post-processing to style status badges and tags
html = html.replace(/<strong>Implemented<\\/strong>/g, '<span class="badge badge-success">Implemented</span>');
html = html.replace(/<strong>Partially Implemented<\\/strong>/g, '<span class="badge badge-warning">Partially Implemented</span>');
html = html.replace(/<strong>Missing<\\/strong>/g, '<span class="badge badge-danger">Missing</span>');

html = html.replace(/<td>Fully Implemented<\\/td>/g, '<td><span class="badge badge-success">Fully Implemented</span></td>');
html = html.replace(/<td>Role: <code>CUSTOMER<\\/code><\\/td>/g, '<td><span class="badge badge-info">Role: CUSTOMER</span></td>');
html = html.replace(/<td>Role: <code>TAILOR<\\/code><\\/td>/g, '<td><span class="badge badge-warning">Role: TAILOR</span></td>');
html = html.replace(/<td>Role: <code>ADMIN<\\/code><\\/td>/g, '<td><span class="badge badge-danger">Role: ADMIN</span></td>');
html = html.replace(/<td>Public<\\/td>/g, '<td><span class="badge badge-neutral">Public</span></td>');

document.getElementById('content').innerHTML = html;
</script>
</body>
</html>
"""

# Write HTML file
with open(HTML_OUT, "w", encoding="utf-8") as f:
    f.write(template)

# Also write to backend static docs
STATIC_HTML_OUT = os.path.join(STATIC_DOCS, "PROJECT_STATUS_AND_MODULE_INVENTORY.html")
with open(STATIC_HTML_OUT, "w", encoding="utf-8") as f:
    f.write(template)

print(f"[OK] Generated HTML: {HTML_OUT} ({os.path.getsize(HTML_OUT)} bytes)")

# Convert to PDF via Playwright
print("Launching Chromium for PDF rendering...")
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f"file:///{HTML_OUT.replace(os.sep, '/')}")
    page.wait_for_timeout(1000)  # Allow DOM rendering & styling script to complete
    
    page.pdf(
        path=PDF_OUT,
        format="A4",
        print_background=True,
        margin={
            "top": "16mm",
            "bottom": "18mm",
            "left": "14mm",
            "right": "14mm",
        },
        display_header_footer=True,
        header_template='<div style="font-size: 8pt; font-family: sans-serif; color: #94a3b8; width: 100%; text-align: right; padding-right: 14mm;">ThreadCraft Tailoring Marketplace — Module Inventory</div>',
        footer_template='<div style="font-size: 8pt; font-family: sans-serif; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 14mm;"><span style="color: #94a3b8;">Confidential • Code Audit Report</span><span style="font-weight: bold; color: #64748b;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
    )
    browser.close()

# Copy to static docs for easy browser download
STATIC_PDF_OUT = os.path.join(STATIC_DOCS, "PROJECT_STATUS_AND_MODULE_INVENTORY.pdf")
import shutil
shutil.copy2(PDF_OUT, STATIC_PDF_OUT)

print(f"[OK] Generated PDF: {PDF_OUT} ({os.path.getsize(PDF_OUT)} bytes)")
print(f"[OK] Copied PDF to static: {STATIC_PDF_OUT}")
