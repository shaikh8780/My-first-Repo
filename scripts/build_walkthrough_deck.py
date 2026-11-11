#!/usr/bin/env python3
"""Build the customer walkthrough PowerPoint from the captured studio screenshots.

Screenshots are produced by frontend/e2e/capture-screens.spec.ts into
frontend/e2e/shots/. This assembles them into a narrated deck:
  - title
  - what the platform does (capabilities)
  - how the workflow runs (5 stages)
  - one slide per screen: left = plain-language "what/how", right = screenshot
  - closing / value summary

Output: frontend/public/Novartis-ESG-Studio-Walkthrough.pptx so the Vite build
copies it into dist/ and the deploy syncs it to S3 for download from the app.

Run:  /tmp/pptx-venv/bin/python scripts/build_walkthrough_deck.py
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SHOTS = os.path.join(ROOT, "frontend", "e2e", "shots")
OUT = os.path.join(ROOT, "frontend", "public", "Novartis-ESG-Studio-Walkthrough.pptx")

# Novartis-ish palette
NAVY = RGBColor(0x0A, 0x1F, 0x44)
BLUE = RGBColor(0x1B, 0x5E, 0xC4)
INK = RGBColor(0x1A, 0x1A, 0x2E)
GREY = RGBColor(0x55, 0x5A, 0x66)
LIGHT = RGBColor(0xF2, 0xF5, 0xFA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]


def _set(fr, text, size, color, bold=False, align=PP_ALIGN.LEFT, space_after=6):
    fr.text = text
    p = fr.paragraphs[0]
    p.alignment = align
    p.space_after = Pt(space_after)
    r = p.runs[0]
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.name = "Calibri"
    return p


def box(slide, l, t, w, h, fill=None, line=None):
    sp = slide.shapes.add_shape(1, l, t, w, h)  # rectangle
    sp.shadow.inherit = False
    if fill is None:
        sp.fill.background()
    else:
        sp.fill.solid()
        sp.fill.fore_color.rgb = fill
    if line is None:
        sp.line.fill.background()
    else:
        sp.line.color.rgb = line
        sp.line.width = Pt(1)
    return sp


def textbox(slide, l, t, w, h):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tb.text_frame.word_wrap = True
    return tb.text_frame


def bullets(tf, items, size=13, color=INK, gap=8):
    for i, (txt, lvl) in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = lvl
        p.space_after = Pt(gap)
        bullet = ("•  " if lvl == 0 else "–  ") + txt
        p.text = bullet
        r = p.runs[0]
        r.font.size = Pt(size if lvl == 0 else size - 1)
        r.font.color.rgb = color if lvl == 0 else GREY
        r.font.name = "Calibri"


def add_image_fit(slide, img_path, region_l, region_t, region_w, region_h, border=True):
    """Place an image scaled to fit inside a region, top-aligned & centered."""
    with Image.open(img_path) as im:
        iw, ih = im.size
    ar = iw / ih
    region_ar = region_w / region_h
    if ar > region_ar:
        w = region_w
        h = Emu(int(region_w / ar))
    else:
        h = region_h
        w = Emu(int(region_h * ar))
    l = region_l + Emu(int((region_w - w) / 2))
    t = region_t  # top-align (full-page shots read from the top)
    pic = slide.shapes.add_picture(img_path, l, t, width=w, height=h)
    if border:
        pic.line.color.rgb = RGBColor(0xCF, 0xD6, 0xE0)
        pic.line.width = Pt(1)
    return pic


def content_slide(title, kicker, screenshot, what, how, points):
    """Left explanation column + screenshot on the right."""
    s = prs.slides.add_slide(BLANK)
    # top accent bar
    box(s, 0, 0, SW, Inches(0.12), fill=BLUE)
    # left column background
    colw = Inches(4.9)
    box(s, 0, Inches(0.12), colw, SH, fill=LIGHT)

    pad = Inches(0.4)
    tf = textbox(s, pad, Inches(0.45), colw - Inches(0.7), Inches(0.5))
    _set(tf, kicker, 12, BLUE, bold=True)
    tf = textbox(s, pad, Inches(0.8), colw - Inches(0.7), Inches(1.0))
    _set(tf, title, 24, NAVY, bold=True)

    tf = textbox(s, pad, Inches(1.85), colw - Inches(0.7), Inches(1.1))
    _set(tf, "WHAT THIS IS", 11, GREY, bold=True, space_after=3)
    p = tf.add_paragraph(); p.text = what
    p.runs[0].font.size = Pt(13); p.runs[0].font.color.rgb = INK; p.runs[0].font.name = "Calibri"

    tf = textbox(s, pad, Inches(3.15), colw - Inches(0.7), Inches(1.0))
    _set(tf, "HOW IT WORKS", 11, GREY, bold=True, space_after=3)
    p = tf.add_paragraph(); p.text = how
    p.runs[0].font.size = Pt(13); p.runs[0].font.color.rgb = INK; p.runs[0].font.name = "Calibri"

    tf = textbox(s, pad, Inches(4.55), colw - Inches(0.7), Inches(2.6))
    _set(tf, "KEY POINTS", 11, GREY, bold=True, space_after=6)
    for txt in points:
        p = tf.add_paragraph(); p.text = "•  " + txt
        p.space_after = Pt(7)
        p.runs[0].font.size = Pt(12); p.runs[0].font.color.rgb = INK; p.runs[0].font.name = "Calibri"

    # screenshot region on the right
    img = os.path.join(SHOTS, screenshot)
    if os.path.exists(img):
        add_image_fit(s, img, colw + Inches(0.25), Inches(0.35),
                      SW - colw - Inches(0.5), SH - Inches(0.7))
    return s


def section_slide(title, subtitle, items):
    s = prs.slides.add_slide(BLANK)
    box(s, 0, 0, SW, SH, fill=NAVY)
    box(s, 0, 0, SW, Inches(0.12), fill=BLUE)
    tf = textbox(s, Inches(0.8), Inches(0.7), SW - Inches(1.6), Inches(1.0))
    _set(tf, title, 30, WHITE, bold=True)
    tf = textbox(s, Inches(0.8), Inches(1.6), SW - Inches(1.6), Inches(0.6))
    _set(tf, subtitle, 15, RGBColor(0xC7, 0xD3, 0xE8))
    # cards
    n = len(items)
    gap = Inches(0.3)
    cardw = (SW - Inches(1.6) - gap * (n - 1)) / n
    top = Inches(2.7)
    cardh = Inches(3.9)
    for i, (h, body) in enumerate(items):
        l = Inches(0.8) + (cardw + gap) * i
        box(s, l, top, cardw, cardh, fill=WHITE)
        box(s, l, top, cardw, Inches(0.7), fill=BLUE)
        tf = textbox(s, l + Inches(0.2), top + Inches(0.12), cardw - Inches(0.4), Inches(0.5))
        _set(tf, h, 15, WHITE, bold=True)
        tf = textbox(s, l + Inches(0.2), top + Inches(0.9), cardw - Inches(0.4), cardh - Inches(1.1))
        for j, b in enumerate(body):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            p.text = "•  " + b
            p.space_after = Pt(7)
            p.runs[0].font.size = Pt(11.5)
            p.runs[0].font.color.rgb = INK
            p.runs[0].font.name = "Calibri"
    return s


# ---- 1. Title slide ---------------------------------------------------------
s = prs.slides.add_slide(BLANK)
box(s, 0, 0, SW, SH, fill=NAVY)
box(s, 0, Inches(3.05), SW, Inches(0.06), fill=BLUE)
tf = textbox(s, Inches(0.9), Inches(2.0), SW - Inches(1.8), Inches(1.0))
_set(tf, "Novartis ESG AI-Enabled Authoring Studio", 34, WHITE, bold=True)
tf = textbox(s, Inches(0.9), Inches(3.2), SW - Inches(1.8), Inches(0.8))
_set(tf, "Product walkthrough — capabilities, workflow and how it works", 18, RGBColor(0xC7, 0xD3, 0xE8))
tf = textbox(s, Inches(0.9), Inches(6.5), SW - Inches(1.8), Inches(0.5))
_set(tf, "Report on Nonfinancial Matters (RNFM) · FY2026 · Prototype build", 12, RGBColor(0x8E, 0xA0, 0xC0))

# ---- 2. What it does --------------------------------------------------------
section_slide(
    "What the platform does",
    "An AI-drafted, human-governed studio for the annual Report on Nonfinancial Matters (RNFM).",
    [
        ("AI first draft", [
            "Generates each section from your own indexed documents (RAG).",
            "Rolls last year's approved report forward and flags what changed.",
            "Every claim carries a citation to its source.",
        ]),
        ("Compliance mapping", [
            "Maps content to ESRS, GRI, TCFD, ISSB, MSA & NTA.",
            "Traffic-light coverage: covered / partial / missing.",
            "AI-suggested fill text for gaps, grounded in evidence.",
        ]),
        ("Governed workflow", [
            "Role-based review with tracked changes.",
            "Two-level sign-off: Input Provider → Owner → Legal.",
            "Immutable audit trail; MDD-compliant Word export.",
        ]),
    ],
)

# ---- 3. How the workflow runs ----------------------------------------------
s = prs.slides.add_slide(BLANK)
box(s, 0, 0, SW, Inches(0.12), fill=BLUE)
tf = textbox(s, Inches(0.6), Inches(0.4), SW - Inches(1.2), Inches(0.7))
_set(tf, "How the workflow runs", 26, NAVY, bold=True)
tf = textbox(s, Inches(0.6), Inches(1.05), SW - Inches(1.2), Inches(0.5))
_set(tf, "Every subsection moves through the same five stages — no stage can be skipped.", 14, GREY)
stages = [
    ("1  AI Draft Generation", "AI drafts each subsection from the knowledge base and the prior-year baseline."),
    ("2  Input & SME Review", "Input Providers draft and subject-matter experts verify facts, edit, and check citations."),
    ("3  Legal Sign-off", "Legal / Compliance sign off per subsection; blocked if a mandatory DR is missing."),
    ("4  Owner Sign-off", "Section Owner is accountable for content accuracy and signs off at section (L2) level."),
    ("5  Exported", "MDD-compliant DOCX generated and delivered once every subsection is approved."),
]
gap = Inches(0.25)
cardw = (SW - Inches(1.2) - gap * (len(stages) - 1)) / len(stages)
top = Inches(2.0)
cardh = Inches(4.4)
for i, (h, body) in enumerate(stages):
    l = Inches(0.6) + (cardw + gap) * i
    box(s, l, top, cardw, cardh, fill=LIGHT, line=RGBColor(0xD8, 0xDF, 0xEA))
    box(s, l, top, cardw, Inches(1.0), fill=NAVY)
    tf = textbox(s, l + Inches(0.15), top + Inches(0.18), cardw - Inches(0.3), Inches(0.7))
    _set(tf, h, 14, WHITE, bold=True)
    tf = textbox(s, l + Inches(0.15), top + Inches(1.15), cardw - Inches(0.3), cardh - Inches(1.3))
    p = tf.paragraphs[0]; p.text = body
    p.runs[0].font.size = Pt(12); p.runs[0].font.color.rgb = INK; p.runs[0].font.name = "Calibri"
    if i < len(stages) - 1:
        ar = textbox(s, l + cardw - Inches(0.02), top + Inches(1.9), gap + Inches(0.1), Inches(0.5))
        _set(ar, "→", 20, BLUE, bold=True, align=PP_ALIGN.CENTER)

# ---- 4..N. One slide per screen --------------------------------------------
content_slide(
    "Dashboard", "CAPABILITY · COMMAND CENTRE", "01-dashboard.png",
    "The single control centre for the whole reporting cycle.",
    "Live rollups read from the working data: progress by stage, 2027 ESRS readiness, roll-forward status and per-subsection assignments.",
    [
        "86 subsections tracked independently across five stages.",
        "Year-on-year roll-forward: updated / needs update / unchanged / new.",
        "Compliance summary and recent activity at a glance.",
    ],
)
content_slide(
    "Knowledge Base", "CAPABILITY · GROUNDING", "02-knowledge-base.png",
    "The indexed source library that grounds every AI output.",
    "Documents are parsed, chunked and embedded into a vector index; the AI retrieves from here so nothing is invented.",
    [
        "Policies, standards, prior RNFMs, peer reports, style guide.",
        "Tagged by framework, year, type and source.",
        "This is what makes every claim traceable to a source.",
    ],
)
content_slide(
    "Report Editor", "CAPABILITY · AUTHORING", "03-editor-section.png",
    "A Word-like editor where AI drafts are reviewed and approved.",
    "Each subsection shows the AI draft, its citations, and an expandable FY2025 approved panel — the baseline the AI rolled forward.",
    [
        "Collapsible cards: roll-forward, content, comments, approval.",
        "Citation markers open the source evidence panel.",
        "Editor vs Clean view tabs separate review from reading.",
    ],
)
content_slide(
    "Tracked changes", "CAPABILITY · REVIEW", "04-editor-tracked-changes.png",
    "Full-section inline redline of what the AI or a person changed.",
    "The Editor view shows the whole section with edits marked inline; only the Editor role accepts/rejects. Clean view shows approved text only.",
    [
        "Green = added, red = removed, shown in context.",
        "Unapproved edits never leak into the clean reading view.",
        "Every change is attributed and audit-logged.",
    ],
)
content_slide(
    "2027 ESRS Readiness", "CAPABILITY · COMPLIANCE", "05-compliance.png",
    "A forward-looking gap analysis against future ESRS requirements.",
    "Today's report is filed under Swiss CO Art. 964a; this overlay maps it to ESRS/ISSB/GRI/TCFD to show 2027 readiness by standard.",
    [
        "Traffic-light coverage per disclosure requirement.",
        "Filter by framework and by materiality (DMA).",
        "AI-suggested fill text for partial / missing items.",
    ],
)
content_slide(
    "Consistency Check", "CAPABILITY · QUALITY", "06-consistency.png",
    "Automated cross-document validation of the numbers and terms.",
    "Compares figures and terminology across the RNFM and Annual Report and flags discrepancies for resolution.",
    [
        "Catches Scope 3 totals, unit mismatches, terminology drift.",
        "Flags IFRS error corrections needing alignment.",
        "Quality assurance that manual review often misses.",
    ],
)
content_slide(
    "Peer Benchmarking", "CAPABILITY · INSIGHT", "07-benchmarking.png",
    "Cited Q&A against indexed peer sustainability reports.",
    "Ask a natural-language question; the AI retrieves from Roche, AstraZeneca, Pfizer, GSK and Sanofi reports and answers with citations.",
    [
        "Evidence-based disclosure decisions before drafting.",
        "Every answer links to the peer report and page.",
        "Compare approaches on Scope 3, biodiversity, social KPIs.",
    ],
)
content_slide(
    "Audit Trail", "GOVERNANCE · EVIDENCE", "08-audit.png",
    "An append-only record of every action for assurance.",
    "Edits, approvals, uploads, scans and exports are captured with user, timestamp and before/after snapshots — retained for seven years.",
    [
        "Primary evidence source for external assurance.",
        "Nothing is overwritten silently.",
        "Full traceability from claim to source to sign-off.",
    ],
)
content_slide(
    "Approval Workflow", "GOVERNANCE · SIGN-OFF", "09-approval-workflow.png",
    "A visual stepper showing exactly where a section stands.",
    "Input Provider → Owner → Legal, with per-step status and details. Legal sign-off is blocked while mandatory disclosures are missing.",
    [
        "Two-level model: subsection (L3) then section (L2).",
        "Re-editing an approved section resets it for re-approval.",
        "Clear accountability at every step.",
    ],
)
content_slide(
    "Section Structure", "CAPABILITY · CONFIGURATION", "10-structure.png",
    "Manage the report's chapter / sub-topic / subsection tree.",
    "Add, rename, move or remove sections, then publish the structure to the editor with a reviewed, versioned change.",
    [
        "Mirrors the customer's RNFM section breakdown 1:1.",
        "Publish is confirmed and version-tracked.",
        "Editor is notified and reviews before applying.",
    ],
)

# ---- Closing ----------------------------------------------------------------
s = prs.slides.add_slide(BLANK)
box(s, 0, 0, SW, SH, fill=NAVY)
box(s, 0, Inches(3.05), SW, Inches(0.06), fill=BLUE)
tf = textbox(s, Inches(0.9), Inches(1.6), SW - Inches(1.8), Inches(1.2))
_set(tf, "AI-assisted, human-governed, audit-ready", 30, WHITE, bold=True)
tf = textbox(s, Inches(0.9), Inches(3.3), SW - Inches(1.8), Inches(2.5))
for j, b in enumerate([
    "80%+ faster first-draft generation — from weeks to minutes.",
    "100% citation traceability — every claim links to a source.",
    "Automated ESRS/ISSB gap detection ahead of the 2027 mandate.",
    "Governed workflow and immutable audit trail for assurance.",
]):
    p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
    p.text = "•  " + b
    p.space_after = Pt(12)
    p.runs[0].font.size = Pt(16); p.runs[0].font.color.rgb = RGBColor(0xE7, 0xED, 0xF7)
    p.runs[0].font.name = "Calibri"

os.makedirs(os.path.dirname(OUT), exist_ok=True)
prs.save(OUT)
print(f"Saved deck: {OUT} ({len(prs.slides.__iter__.__self__._sldIdLst)} slides)")
