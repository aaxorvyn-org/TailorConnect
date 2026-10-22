import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD_PATH = os.path.join(ROOT, "PROJECT_STATUS_AND_MODULE_INVENTORY.md")
DOCX_OUT = os.path.join(ROOT, "PROJECT_STATUS_AND_MODULE_INVENTORY.docx")
STATIC_DOCS = os.path.join(ROOT, "backend", "app", "static", "docs")
os.makedirs(STATIC_DOCS, exist_ok=True)

with open(MD_PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

doc = docx.Document()

# Configure A4 Margins
for section in doc.sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)
    section.different_first_page_header_footer = False
    
    # Configure Header & Footer
    footer = section.footer
    f_p = footer.paragraphs[0]
    f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    f_run = f_p.add_run("ThreadCraft • Tailoring Marketplace Project Status & Module Inventory")
    f_run.font.size = Pt(8.5)
    f_run.font.color.rgb = RGBColor(148, 163, 184)

# Set base normal style
normal_style = doc.styles['Normal']
normal_style.font.name = 'Calibri'
normal_style.font.size = Pt(10)
normal_style.font.color.rgb = RGBColor(51, 65, 85)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_header_box():
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=260, bottom=260, left=300, right=300)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    run1 = p.add_run("ThreadCraft Tailoring Marketplace\n")
    run1.font.bold = True
    run1.font.size = Pt(19)
    run1.font.color.rgb = RGBColor(255, 255, 255)
    
    run2 = p.add_run("Project Status & Module Inventory Audit Document\n")
    run2.font.bold = True
    run2.font.size = Pt(13)
    run2.font.color.rgb = RGBColor(52, 211, 153) # emerald-400
    
    run3 = p.add_run("System Overview • API Endpoints • Data Models • Request Flow • Verification & Roadmap\n")
    run3.font.size = Pt(9.5)
    run3.font.color.rgb = RGBColor(203, 213, 225)
    
    run4 = p.add_run("Date: October 2026   |   Mode: Read-Only Verification   |   Status: Production Foundation Ready")
    run4.font.size = Pt(8.5)
    run4.font.italic = True
    run4.font.color.rgb = RGBColor(148, 163, 184)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

add_header_box()

def apply_text_formatting(paragraph, text):
    # Regex split for bold and inline code
    # e.g., **bold**, `code`, etc.
    tokens = re.split(r'(\*\*.*?\*\*|\`.*?\`|\*.*?\*)', text)
    for tok in tokens:
        if not tok:
            continue
        if tok.startswith('**') and tok.endswith('**'):
            clean = tok[2:-2]
            r = paragraph.add_run(clean)
            r.font.bold = True
            r.font.color.rgb = RGBColor(15, 23, 42)
        elif tok.startswith('`') and tok.endswith('`'):
            clean = tok[1:-1]
            r = paragraph.add_run(clean)
            r.font.name = 'Consolas'
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(15, 23, 42)
        elif tok.startswith('*') and tok.endswith('*'):
            clean = tok[1:-1]
            r = paragraph.add_run(clean)
            r.font.italic = True
        else:
            r = paragraph.add_run(tok)
            r.font.color.rgb = RGBColor(51, 65, 85)

i = 0
in_code_block = False
code_lines = []

while i < len(lines):
    line = lines[i].rstrip('\r\n')
    
    # Check for code blocks
    if line.startswith('```'):
        if in_code_block:
            # End code block
            code_text = "\n".join(code_lines)
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.left_indent = Inches(0.2)
            run = p.add_run(code_text)
            run.font.name = 'Consolas'
            run.font.size = Pt(8)
            run.font.color.rgb = RGBColor(15, 23, 42)
            
            code_lines = []
            in_code_block = False
        else:
            in_code_block = True
            code_lines = []
        i += 1
        continue
    
    if in_code_block:
        code_lines.append(line)
        i += 1
        continue
        
    stripped = line.strip()
    
    # Skip title lines that were handled in cover box
    if stripped.startswith('# Project Status') or stripped.startswith('**ThreadCraft —'):
        i += 1
        continue
        
    # Check for Tables (starts with |)
    if stripped.startswith('|') and '|' in stripped[1:]:
        table_lines = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            table_lines.append(lines[i].strip())
            i += 1
            
        # Parse table lines
        if len(table_lines) >= 2:
            # First line is header
            headers = [c.strip() for c in table_lines[0].split('|')[1:-1]]
            # Second line is delimiter
            # Subsequent lines are data rows
            data_rows = []
            for r_line in table_lines[2:]:
                cells = [c.strip() for c in r_line.split('|')[1:-1]]
                # clean <br> tags in cells
                cells = [c.replace('<br>', '\n') for c in cells]
                data_rows.append(cells)
                
            col_count = len(headers)
            table = doc.add_table(rows=len(data_rows) + 1, cols=col_count)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = True
            
            # Header Row
            hdr_cells = table.rows[0].cells
            for c_idx, h_text in enumerate(headers):
                cell = hdr_cells[c_idx]
                set_cell_background(cell, "0F172A")
                set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                r = p.add_run(h_text)
                r.font.bold = True
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(255, 255, 255)
                
            # Data Rows
            for r_idx, row_data in enumerate(data_rows):
                row_cells = table.rows[r_idx + 1].cells
                bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                for c_idx in range(min(col_count, len(row_data))):
                    cell = row_cells[c_idx]
                    set_cell_background(cell, bg_color)
                    set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_before = Pt(1)
                    p.paragraph_format.space_after = Pt(1)
                    apply_text_formatting(p, row_data[c_idx])
                    
            p_after = doc.add_paragraph()
            p_after.paragraph_format.space_before = Pt(0)
            p_after.paragraph_format.space_after = Pt(6)
        continue

    # Headings
    if stripped.startswith('# '):
        h = doc.add_heading(level=1)
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(4)
        run = h.add_run(stripped[2:])
        run.font.bold = True
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(15, 23, 42)
    elif stripped.startswith('## '):
        h = doc.add_heading(level=2)
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(3)
        run = h.add_run(stripped[3:])
        run.font.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(5, 150, 105) # Emerald
    elif stripped.startswith('### '):
        h = doc.add_heading(level=3)
        h.paragraph_format.space_before = Pt(11)
        h.paragraph_format.space_after = Pt(2)
        run = h.add_run(stripped[4:])
        run.font.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(30, 41, 59)
    elif stripped.startswith('#### '):
        h = doc.add_heading(level=4)
        h.paragraph_format.space_before = Pt(9)
        h.paragraph_format.space_after = Pt(2)
        run = h.add_run(stripped[5:])
        run.font.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(71, 85, 105)
    elif stripped.startswith('> '):
        # Blockquote / Note
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.left_indent = Inches(0.2)
        run_lead = p.add_run("NOTE: ")
        run_lead.font.bold = True
        run_lead.font.size = Pt(9)
        run_lead.font.color.rgb = RGBColor(5, 150, 105)
        apply_text_formatting(p, stripped[2:])
    elif stripped.startswith('- ') or stripped.startswith('* '):
        # Bullet list
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        apply_text_formatting(p, stripped[2:])
    elif re.match(r'^\d+\.\s', stripped):
        # Numbered list
        num_str = re.match(r'^\d+\.\s', stripped).group(0)
        p = doc.add_paragraph(style='List Number')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        apply_text_formatting(p, stripped[len(num_str):])
    elif stripped == '---':
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run("_________________________________________________________________________________")
        run.font.color.rgb = RGBColor(226, 232, 240)
        run.font.size = Pt(8)
    elif stripped:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        apply_text_formatting(p, stripped)
        
    i += 1

doc.save(DOCX_OUT)
print(f"[OK] Generated Word Document (.docx): {DOCX_OUT} ({os.path.getsize(DOCX_OUT)} bytes)")

# Copy to static docs for direct browser download
STATIC_DOCX_OUT = os.path.join(STATIC_DOCS, "PROJECT_STATUS_AND_MODULE_INVENTORY.docx")
import shutil
shutil.copy2(DOCX_OUT, STATIC_DOCX_OUT)
print(f"[OK] Copied .docx to static: {STATIC_DOCX_OUT}")
