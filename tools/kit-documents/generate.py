import json, sys, os
import segno
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, NextPageTemplate, Flowable, KeepTogether, Image)

BASE_URL = os.environ.get('BASE_URL', 'https://ectmarinestore.com')
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'images', 'logo-wordmark.png')
REV = 'Rev. 1 · Oct 2026'
NAVY = colors.HexColor('#1F3A5F'); GREY = colors.HexColor('#5B6770'); LIGHT = colors.HexColor('#EEF3F8'); LINE = colors.HexColor('#9AA5B1')
COMPANY = 'Eco Cleaning Technologies Consulting Srl · VAT IT02488080504'

ss = lambda **k: ParagraphStyle('s', fontName=k.pop('font', 'Helvetica'), **k)
H1 = ss(fontSize=17, leading=21, textColor=NAVY, font='Helvetica-Bold', spaceAfter=2)
SUB = ss(fontSize=9.5, leading=13, textColor=GREY, spaceAfter=6)
H2 = ss(fontSize=10.5, leading=13, textColor=NAVY, font='Helvetica-Bold', spaceBefore=8, spaceAfter=3)
BODY = ss(fontSize=9, leading=12)
SMALL = ss(fontSize=7.5, leading=9.5, textColor=GREY)
CELL = ss(fontSize=8, leading=10)
CELLB = ss(fontSize=8, leading=10, font='Helvetica-Bold', textColor=colors.white)
NOTE = ss(fontSize=8.5, leading=11.5)

SHORT = {
 'ECT-SK-BALLAST-01': 'Ballast Water', 'ECT-SK-BIOFILM-01': 'Biofilm Investigation', 'ECT-SK-FIREWATER-01': 'Fire-Fighting Water',
 'ECT-SK-FW-MICRO-01': 'Fresh Water Microbiology', 'ECT-SK-GREYBLACK-01': 'Grey & Black Water', 'ECT-SK-HVAC-AIR-01': 'HVAC & Air Hygiene',
 'ECT-SK-LEGIONELLA-01': 'Legionella', 'ECT-SK-METALS-01': 'Lead & Heavy Metals', 'ECT-SK-POOL-01': 'Pool & Spa',
 'ECT-SK-PW-COMPLETE-01': 'Potable Water Complete', 'ECT-SK-SURFACE-01': 'Surface Hygiene Swab', 'ECT-SK-YACHT-COMPLETE-01': 'Yacht Water & Hygiene Box'}

# Record-sheet layout per kit. Rows equal the number of containers the catalogue states; otherwise a generic count.
CFG = {
 'ECT-SK-FW-MICRO-01':      dict(kind='water', rows=3, labels=None),
 'ECT-SK-LEGIONELLA-01':    dict(kind='water', rows=3, labels=None, point_labels=True),
 'ECT-SK-METALS-01':        dict(kind='metals', rows=3, labels=None),
 'ECT-SK-PW-COMPLETE-01':   dict(kind='water', rows=6, labels=['Micro', 'Chemistry', 'Metals']),
 'ECT-SK-YACHT-COMPLETE-01':dict(kind='water', rows=8, labels=['Micro', 'Legionella', 'Chemistry', 'Metals', 'Swab/biofilm'], point_labels=True),
 'ECT-SK-POOL-01':          dict(kind='pool', rows=6, labels=None),
 'ECT-SK-GREYBLACK-01':     dict(kind='waste', rows=6, labels=None),
 'ECT-SK-BALLAST-01':       dict(kind='ballast', rows=2, labels=['Before treatment', 'After treatment']),
 'ECT-SK-FIREWATER-01':     dict(kind='fire', rows=1, labels=None),
 'ECT-SK-HVAC-AIR-01':      dict(kind='hvac', rows=6, labels=['Swab', 'Petri dish']),
 'ECT-SK-SURFACE-01':       dict(kind='surface', rows=6, labels=None),
 'ECT-SK-BIOFILM-01':       dict(kind='biofilm', rows=6, labels=None),
}
COLS = {  # (header, relative width)
 'water':  [('No.', 6), ('Sampling point / location', 30), ('Hot / Cold / Tank', 14), ('Time', 9), ('Water °C', 9), ('Free chlorine mg/L', 11), ('pH', 7), ('Flush / stagnation (per lab protocol)', 20), ('Container / label ID', 16), ('Notes', 24)],
 'metals': [('No.', 6), ('Sampling point / location', 34), ('Cold / Hot', 12), ('Time', 10), ('Flush / stagnation (per lab protocol)', 24), ('Container / label ID', 18), ('Notes', 36)],
 'pool':   [('No.', 6), ('Pool / jacuzzi / spa', 28), ('Time', 10), ('Water °C', 10), ('pH', 8), ('Disinfectant type', 16), ('Disinfectant mg/L', 13), ('Container / label ID', 16), ('Notes', 28)],
 'waste':  [('No.', 6), ('Tank / system', 28), ('Sampling point', 24), ('Time', 10), ('Temp. °C', 10), ('Odour (none / mild / strong)', 16), ('Container / label ID', 16), ('Notes', 28)],
 'ballast':[('No.', 6), ('Sample (before / after treatment)', 24), ('Sampling point / tank', 30), ('Time', 10), ('Temp. °C', 10), ('Container / label ID', 18), ('Notes', 36)],
 'fire':   [('No.', 6), ('System (tank / main / pump)', 30), ('Sampling point', 28), ('Time', 10), ('Temp. °C', 10), ('Container / label ID', 18), ('Notes', 36)],
 'hvac':   [('No.', 6), ('Component (FCU / AHU / grille / duct)', 30), ('Location (cabin / salon / space)', 28), ('Time', 10), ('Swab / dish ID', 16), ('Notes', 40)],
 'surface':[('No.', 6), ('Location / surface', 32), ('Material / type', 18), ('Area swabbed (template / cm²)', 18), ('Time', 10), ('Swab / label ID', 16), ('Notes', 30)],
 'biofilm':[('No.', 6), ('Location / component', 32), ('Material', 16), ('Visual condition', 18), ('Time', 10), ('Swab / container ID', 16), ('Notes', 32)],
}

class Box(Flowable):
    def __init__(self, size=3.4*mm): super().__init__(); self.size = size; self.width = size; self.height = size
    def draw(self): self.canv.setLineWidth(0.7); self.canv.setStrokeColor(colors.black); self.canv.rect(0, 0, self.size, self.size)

class QR(Flowable):
    def __init__(self, url, size): super().__init__(); self.url = url; self.size = size; self.width = size; self.height = size
    def draw(self): draw_qr(self.canv, self.url, 0, 0, self.size)

def draw_qr(c, url, x, y, size):
    q = segno.make(url, error='m', micro=False); rows = [list(r) for r in q.matrix]; n = len(rows) + 4  # 2-module quiet zone
    m = size / n; c.saveState(); c.setFillColor(colors.black)
    for ri, row in enumerate(rows):
        for ci, v in enumerate(row):
            if v: c.rect(x + (ci + 2) * m, y + size - (ri + 3) * m, m + 0.02, m + 0.02, stroke=0, fill=1)
    c.restoreState()

def checklist(items, cols=2, row_major=False):
    cells = [[Box(), Paragraph(t, BODY)] for t in items]
    per = (len(cells) + cols - 1) // cols; data = []
    for r in range(per):
        row = []
        for c in range(cols):
            i = (r * cols + c) if row_major else (c * per + r); row += cells[i] if i < len(cells) else ['', '']
        data.append(row)
    w = (180 * mm) / cols
    t = Table(data, colWidths=[6 * mm, w - 6 * mm] * cols); t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5), ('TOPPADDING', (0, 0), (-1, -1), 1), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 3)]))
    return t

def field_table(pairs, total, cols=3):
    """Boxed form fields: label above an empty line."""
    w = total / cols; rows = []
    for i in range(0, len(pairs), cols):
        chunk = pairs[i:i + cols]; rows.append([Paragraph(f'<font size=7 color="#5B6770">{a}</font>', CELL) for a in chunk] + [''] * (cols - len(chunk)))
    t = Table(rows, colWidths=[w] * cols, rowHeights=[11 * mm] * len(rows))
    t.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.6, LINE), ('INNERGRID', (0, 0), (-1, -1), 0.4, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP')])); return t

def grid(headers, nrows, total, row_h=11 * mm):
    ws = [h[1] for h in headers]; s = sum(ws); widths = [total * x / s for x in ws]
    data = [[Paragraph(h[0], CELLB) for h in headers]] + [[str(i + 1)] + [''] * (len(headers) - 1) for i in range(nrows)]
    t = Table(data, colWidths=widths, rowHeights=[12 * mm] + [row_h] * nrows, repeatRows=1)
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), NAVY), ('GRID', (0, 0), (-1, -1), 0.5, LINE), ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                           ('VALIGN', (0, 1), (-1, -1), 'TOP'), ('FONTSIZE', (0, 1), (-1, -1), 8), ('TEXTCOLOR', (0, 1), (0, -1), GREY)])); return t

def build(kit, outdir):
    s = kit['technical_specs']; sku = kit['sku']; cfg = CFG[sku]; name = kit['name']; short = SHORT[sku]
    url = f"{BASE_URL}/sample-registration?product={kit['id']}"
    path = os.path.join(outdir, f'{sku}_Support-Documents.pdf')

    def chrome(c, doc, landscape_page=False):
        w, h = (landscape(A4) if landscape_page else A4); c.saveState()
        c.drawImage(LOGO, 15 * mm, h - 20 * mm, width=42 * mm, height=42 * mm * 260 / 1694, mask='auto')
        c.setFont('Helvetica', 7.5); c.setFillColor(GREY)
        c.drawRightString(w - 15 * mm, h - 14 * mm, f'{short} Sampling Kit · {sku}')
        c.setStrokeColor(NAVY); c.setLineWidth(1.2); c.line(15 * mm, h - 24 * mm, w - 15 * mm, h - 24 * mm)
        c.setLineWidth(0.4); c.setStrokeColor(LINE); c.line(15 * mm, 13 * mm, w - 15 * mm, 13 * mm)
        c.setFont('Helvetica', 6.5); c.drawString(15 * mm, 9 * mm, f'{COMPANY} · Pisa, Italy · ectmarinestore.com')
        c.drawRightString(w - 15 * mm, 9 * mm, f'ECT-DOC-{sku} · {REV} · Page {doc.page}'); c.restoreState()

    def labels_page(c, doc):
        # Avery L7159-style sheet: A4, 3 x 8 labels of 63.5 x 33.9 mm. No header/footer: it would print on the labels.
        c.saveState(); lw, lh = 63.5 * mm, 33.9 * mm; x0 = 7.2 * mm; top = A4[1] - 13 * mm
        for r in range(8):
            for col in range(3):
                x = x0 + col * (lw + 2.5 * mm); y = top - (r + 1) * lh
                c.setStrokeColor(colors.HexColor('#E3E6EA')); c.setLineWidth(0.25); c.roundRect(x, y, lw, lh, 1.5 * mm)
                draw_qr(c, url, x + 1.5 * mm, y + (lh - 23 * mm) / 2, 23 * mm)
                c.setFillColor(colors.black); tx = x + 26.5 * mm
                c.setFont('Helvetica-Bold', 6.8); c.drawString(tx, y + lh - 5 * mm, 'ECT Marine Store')
                c.setFont('Helvetica', 6); c.setFillColor(GREY); c.drawString(tx, y + lh - 8.3 * mm, short[:30])
                c.setFillColor(colors.black); c.setFont('Helvetica', 6.2)
                for i, lab in enumerate(['Sample ID', 'Point / location', 'Date / time', 'Sampled by']):
                    yy = y + lh - (12.4 + i * 3.9) * mm; c.drawString(tx, yy, lab); c.setLineWidth(0.3); c.setStrokeColor(LINE)
                    c.line(tx + c.stringWidth(lab, 'Helvetica', 6.2) + 1 * mm, yy - 0.6 * mm, x + lw - 2 * mm, yy - 0.6 * mm)
                if cfg['labels']:
                    # tick options, wrapped onto a second row when they do not fit inside the label
                    c.setFont('Helvetica', 5.6); avail = lw - 26.5 * mm - 1.5 * mm; rows_, cur, curw = [], [], 0
                    for opt in cfg['labels']:
                        wopt = 2.3 * mm + c.stringWidth(opt, 'Helvetica', 5.6) + 1.5 * mm
                        if cur and curw + wopt > avail: rows_.append(cur); cur, curw = [], 0
                        cur.append(opt); curw += wopt
                    rows_.append(cur)
                    base = 3.4 * mm if len(rows_) == 1 else 5.6 * mm
                    for ri, row_opts in enumerate(rows_):
                        xx = tx; yy = y + base - ri * 3.4 * mm
                        for opt in row_opts:
                            c.setStrokeColor(colors.black); c.setLineWidth(0.5); c.rect(xx, yy - 0.2 * mm, 1.8 * mm, 1.8 * mm)
                            c.drawString(xx + 2.3 * mm, yy, opt); xx += 2.3 * mm + c.stringWidth(opt, 'Helvetica', 5.6) + 1.5 * mm
        c.setFont('Helvetica', 5.5); c.setFillColor(GREY); c.drawString(7.2 * mm, 5 * mm, f'ECT-DOC-{sku} · Sample labels · Print at 100% on A4 label sheets 63.5 x 33.9 mm (3 x 8)')
        c.restoreState()

    def point_labels_page(c, doc):
        c.saveState(); lw, lh = 99.1 * mm, 67.7 * mm; x0 = 4.65 * mm; top = A4[1] - 13 * mm
        for r in range(4):
            for col in range(2):
                x = x0 + col * (lw + 2.5 * mm); y = top - (r + 1) * lh
                c.setStrokeColor(colors.HexColor('#E3E6EA')); c.setLineWidth(0.25); c.roundRect(x, y, lw, lh, 2 * mm)
                c.setFillColor(NAVY); c.setFont('Helvetica-Bold', 8); c.drawString(x + 6 * mm, y + lh - 8 * mm, 'SAMPLING POINT')
                c.setFillColor(colors.black); c.setFont('Helvetica-Bold', 22); c.drawString(x + 6 * mm, y + lh - 21 * mm, 'No.')
                c.setLineWidth(0.8); c.setStrokeColor(colors.black); c.line(x + 20 * mm, y + lh - 21.5 * mm, x + 45 * mm, y + lh - 21.5 * mm)
                c.setFont('Helvetica', 8); c.drawString(x + 6 * mm, y + lh - 31 * mm, 'Location / description'); c.setLineWidth(0.4); c.setStrokeColor(LINE)
                c.line(x + 6 * mm, y + lh - 37 * mm, x + lw - 6 * mm, y + lh - 37 * mm); c.line(x + 6 * mm, y + lh - 44 * mm, x + lw - 6 * mm, y + lh - 44 * mm)
                xx = x + 6 * mm; yy = y + 8 * mm; c.setFont('Helvetica', 7.5)
                for opt in ['Hot', 'Cold', 'Return', 'Tank', 'Other']:
                    c.setStrokeColor(colors.black); c.setLineWidth(0.6); c.rect(xx, yy - 0.3 * mm, 3 * mm, 3 * mm); c.drawString(xx + 4 * mm, yy, opt); xx += 4 * mm + c.stringWidth(opt, 'Helvetica', 7.5) + 5 * mm
        c.setFont('Helvetica', 5.5); c.setFillColor(GREY); c.drawString(4.65 * mm, 5 * mm, f'ECT-DOC-{sku} · Sampling point labels · Print at 100% on A4 label sheets 99.1 x 67.7 mm (2 x 4)')
        c.restoreState()

    doc = BaseDocTemplate(path, pagesize=A4, title=f'{name} - Support documents', author='Eco Cleaning Technologies Consulting Srl',
                          leftMargin=15 * mm, rightMargin=15 * mm, topMargin=28 * mm, bottomMargin=17 * mm)
    pf = Frame(15 * mm, 17 * mm, A4[0] - 30 * mm, A4[1] - 45 * mm, id='p', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    LS = landscape(A4)
    lf = Frame(15 * mm, 17 * mm, LS[0] - 30 * mm, LS[1] - 45 * mm, id='l', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    tiny = Frame(15 * mm, 17 * mm, 30, 30, id='t', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id='card', frames=[pf], pagesize=A4, onPage=lambda c, d: chrome(c, d)),
        PageTemplate(id='land', frames=[lf], pagesize=LS, onPage=lambda c, d: chrome(c, d, True)),
        PageTemplate(id='labels', frames=[tiny], pagesize=A4, onPage=labels_page),
        PageTemplate(id='points', frames=[tiny], pagesize=A4, onPage=point_labels_page)])

    W = A4[0] - 30 * mm; WL = LS[0] - 30 * mm
    story = []
    # ---------------- 1. Instruction card ----------------
    story += [Paragraph(f'{name}', H1), Paragraph('Sampling instructions', SUB)]
    if kit.get('short_description'): story += [Paragraph(f'<b>Intended use:</b> {kit["short_description"]}', BODY)]
    if s.get('applications_detail'): story += [Spacer(1, 3), Paragraph('<b>Typical applications:</b> ' + ' · '.join(s['applications_detail']), BODY)]
    story += [Paragraph('Check your kit on receipt', H2), Paragraph('Tick each item as you check it. Report anything missing before sampling.', SMALL), Spacer(1, 3), checklist(s['contents'], cols=1 if max(len(x) for x in s['contents']) > 70 else 2)]
    story += [Paragraph('How it works', H2)]
    steps = s.get('how_it_works') or []
    story += [Table([[Paragraph(f'<b>{i}</b>', BODY), Paragraph(t, BODY)] for i, t in enumerate(steps, 1)], colWidths=[7 * mm, W - 7 * mm],
                    style=TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))]
    story += [Paragraph('Good practice while sampling', H2)]
    tips = ['Wash or sanitise your hands and put on the supplied gloves before touching any sampling material.',
            'Do not touch the inside of containers, caps, swabs or tubes, and do not put caps down on surfaces.',
            'Do not rinse the sampling containers: they are supplied ready for use, unless your laboratory instructs otherwise.',
            'Label each container immediately at the sampling point and complete the Sample Record Sheet before moving on.',
            'Keep samples cool and out of direct light, and deliver them to your laboratory within the time the laboratory specifies.']
    if s.get('safety_notes'): tips.insert(0, s['safety_notes'])
    story += [Table([[Paragraph('•', BODY), Paragraph(t, BODY)] for t in tips], colWidths=[5 * mm, W - 5 * mm], style=TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))]
    imp = ['This kit is for <b>sample collection only</b>. Laboratory analysis is arranged separately, with the parameters agreed with your laboratory.']
    if s.get('regulatory_notes'):
        if 'sample collection only' in s['regulatory_notes'].lower(): imp = []
        imp.append(s['regulatory_notes'])
    story += [Spacer(1, 6)]
    qr_cell = [QR(url, 34 * mm)]
    right = [Paragraph('<b>Register your sample digitally</b>', ss(fontSize=10, leading=13, textColor=NAVY, font='Helvetica-Bold')),
             Paragraph('Scan the QR code, sign in to your ECT account and log the vessel, sampling point and conditions before you send or hand the sample to the laboratory. '
                       'Laboratory results are added separately once they come back.', NOTE), Spacer(1, 3),
             Paragraph(f'<font size=7 color="#5B6770">{url}</font>', SMALL)]
    box = Table([[[Paragraph('<b>Important</b>', ss(fontSize=10, leading=13, textColor=NAVY, font='Helvetica-Bold'))] + [Paragraph(t, NOTE) for t in imp]]], colWidths=[W],
                style=TableStyle([('BACKGROUND', (0, 0), (-1, -1), LIGHT), ('BOX', (0, 0), (-1, -1), 0.6, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    qrbox = Table([[qr_cell, right]], colWidths=[38 * mm, W - 38 * mm], style=TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('BOX', (0, 0), (-1, -1), 0.6, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    story += [KeepTogether([box, Spacer(1, 6), qrbox])]

    # ---------------- 2. Sample record sheet (landscape) ----------------
    story += [NextPageTemplate('land'), PageBreak(), Paragraph('Sample Record Sheet', H1), Paragraph(f'{name} · complete at the time of collection. The fields match the ECT digital sample registration.', SUB)]
    story += [field_table(['Vessel name', 'Vessel IMO (if applicable)', 'Sampled by (name)', 'Date of sampling', 'Laboratory', 'Laboratory reference'], WL, cols=6), Spacer(1, 3)]
    reasons = ['Routine monitoring', 'Complaint / odour', 'Post-cleaning or disinfection check', 'Investigation', 'Commissioning / refit', 'Other']
    story += [Table([[Paragraph('<b>Reason for sampling</b>', CELL)] + sum([[Box(3 * mm), Paragraph(r, CELL)] for r in reasons], [])],
                    colWidths=[30 * mm] + [4 * mm, (WL - 30 * mm - 6 * 4 * mm) / 6] * 6, style=TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('BOX', (0, 0), (-1, -1), 0.6, LINE), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4), ('LEFTPADDING', (0, 0), (-1, -1), 2), ('RIGHTPADDING', (0, 0), (-1, -1), 2)])), Spacer(1, 4)]
    story += [grid(COLS[cfg['kind']], cfg['rows'], WL, row_h=(16 if cfg['rows'] <= 3 else 12 if cfg['rows'] <= 6 else 10) * mm)]
    story += [Spacer(1, 4), field_table(['General comments / observations', 'Sampler signature'], WL, cols=2)]
    if cfg['kind'] == 'pool': story += [Spacer(1, 3), Paragraph('Field readings (pH, disinfectant) are logged separately at the time of sampling; they do not replace laboratory analysis.', SMALL)]

    # ---------------- 3. Chain of custody (landscape) ----------------
    story += [PageBreak(), Paragraph('Chain of Custody', H1), Paragraph('Record every hand-over of the samples from collection to laboratory receipt.', SUB)]
    story += [field_table(['Vessel name', 'Vessel IMO', 'Sampled by', 'Date / time of collection', 'Laboratory name', 'Laboratory reference'], WL, cols=6), Spacer(1, 4)]
    params = s.get('potential_parameters') or []
    if params:
        story += [Paragraph('Analysis requested (tick, or specify with the laboratory)', H2), checklist([p for p in params if not p.lower().startswith('other')] + ['Other (specify): ___________________'], cols=4, row_major=True)]
    else:
        story += [Paragraph('Analysis requested', H2), field_table(['Parameters / analysis requested (as agreed with the laboratory)'], WL, cols=1)]
    story += [Spacer(1, 2), grid([('No.', 6), ('Sample ID', 20), ('Sampling point / location', 34), ('Container / matrix', 22), ('Date / time sampled', 18), ('Seal / bag no.', 14)], min(cfg['rows'], 6), WL, row_h=6 * mm)]
    story += [Paragraph('Hand-over', H2)]
    hand = [[Paragraph(h, CELLB) for h in ['Released by (name / company)', 'Signature', 'Date / time', 'Received by (name / company)', 'Signature', 'Date / time', 'Seals intact', 'Temp. on receipt °C']]]
    hand += [['', '', '', '', '', '', Table([[Box(3 * mm), Paragraph('Yes', CELL), Box(3 * mm), Paragraph('No', CELL)]], colWidths=[4 * mm, 7 * mm, 4 * mm, 7 * mm], style=TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 1)])), ''] for _ in range(3)]
    ht = Table(hand, colWidths=[WL * x for x in [.18, .12, .10, .18, .12, .10, .10, .10]], rowHeights=[9 * mm] + [8.5 * mm] * 3)
    ht.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), NAVY), ('GRID', (0, 0), (-1, -1), 0.5, LINE), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')])); story += [ht, Spacer(1, 4)]
    story += [field_table(['Laboratory use only: received on (date / time)', 'Laboratory sample number(s)', 'Laboratory remarks'], WL, cols=3)]

    # ---------------- 4. Labels ----------------
    story += [NextPageTemplate('labels'), PageBreak(), Spacer(1, 1)]
    if cfg.get('point_labels'): story += [NextPageTemplate('points'), PageBreak(), Spacer(1, 1)]
    doc.build(story)
    return path, url

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for k in json.load(open(sys.argv[2] if len(sys.argv) > 2 else 'kits.json')):
        p, u = build(k, out); print(os.path.basename(p), '<-', u)
