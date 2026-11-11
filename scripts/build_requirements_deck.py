#!/usr/bin/env python3
"""Build the comprehensive Novartis ESG Studio requirements & capabilities deck.

A detailed customer-facing deck covering: capabilities & requirements, a
step-by-step editor walkthrough, roles & approval workflow, versioning &
comparison, datapoints & confidence scoring, what is still to be completed, and
what the customer needs to provide to move the application into the Novartis
environment.

Screenshots come from frontend/e2e/shots/ (capture-screens.spec.ts).
Output: frontend/public/Novartis-ESG-Studio-Overview.pptx

Run:  /tmp/pptx-venv/bin/python scripts/build_requirements_deck.py
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SHOTS = os.path.join(ROOT, "frontend", "e2e", "shots")
OUT = os.path.join(ROOT, "frontend", "public", "Novartis-ESG-Studio-Overview.pptx")

NAVY = RGBColor(0x0A, 0x1F, 0x44)
BLUE = RGBColor(0x1B, 0x5E, 0xC4)
INK = RGBColor(0x1A, 0x1A, 0x2E)
GREY = RGBColor(0x55, 0x5A, 0x66)
LIGHT = RGBColor(0xF2, 0xF5, 0xFA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREEN = RGBColor(0x15, 0x80, 0x3D)
AMBER = RGBColor(0xB4, 0x53, 0x09)
PURPLE = RGBColor(0x7C, 0x3A, 0xED)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]


def _set(fr, text, size, color, bold=False, align=PP_ALIGN.LEFT, space_after=6, italic=False):
    fr.text = text
    p = fr.paragraphs[0]
    p.alignment = align
    p.space_after = Pt(space_after)
    r = p.runs[0]
    r.font.size = Pt(size); r.font.bold = bold; r.font.italic = italic
    r.font.color.rgb = color; r.font.name = "Calibri"
    return p


def box(slide, l, t, w, h, fill=None, line=None):
    sp = slide.shapes.add_shape(1, l, t, w, h)
    sp.shadow.inherit = False
    if fill is None: sp.fill.background()
    else: sp.fill.solid(); sp.fill.fore_color.rgb = fill
    if line is None: sp.line.fill.background()
    else: sp.line.color.rgb = line; sp.line.width = Pt(1)
    return sp


def textbox(slide, l, t, w, h):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tb.text_frame.word_wrap = True
    return tb.text_frame


def para(tf, text, size, color, bold=False, gap=6, first=False, bullet=False, level=0, italic=False):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.level = level
    p.space_after = Pt(gap)
    p.text = ("•  " if bullet and level == 0 else "–  " if bullet else "") + text
    r = p.runs[0]
    r.font.size = Pt(size); r.font.bold = bold; r.font.italic = italic
    r.font.color.rgb = color; r.font.name = "Calibri"
    return p


def add_image_fit(slide, img_path, rl, rt, rw, rh, border=True, top_align=True):
    with Image.open(img_path) as im:
        iw, ih = im.size
    ar = iw / ih
    if ar > rw / rh:
        w = rw; h = Emu(int(rw / ar))
    else:
        h = rh; w = Emu(int(rh * ar))
    l = rl + Emu(int((rw - w) / 2))
    t = rt if top_align else rt + Emu(int((rh - h) / 2))
    pic = slide.shapes.add_picture(img_path, l, t, width=w, height=h)
    if border:
        pic.line.color.rgb = RGBColor(0xCF, 0xD6, 0xE0); pic.line.width = Pt(1)
    return pic


def title_bar(s, kicker, title):
    box(s, 0, 0, SW, Inches(0.12), fill=BLUE)
    tf = textbox(s, Inches(0.6), Inches(0.30), SW - Inches(1.2), Inches(0.4))
    _set(tf, kicker, 12, BLUE, bold=True)
    tf = textbox(s, Inches(0.6), Inches(0.62), SW - Inches(1.2), Inches(0.7))
    _set(tf, title, 25, NAVY, bold=True)


# --- Screenshot slide: left explanation, right image ------------------------
def shot_slide(kicker, title, screenshot, what, steps=None, points=None, caption=None):
    s = prs.slides.add_slide(BLANK)
    box(s, 0, 0, SW, Inches(0.12), fill=BLUE)
    colw = Inches(4.95)
    box(s, 0, Inches(0.12), colw, SH, fill=LIGHT)
    pad = Inches(0.35)
    tf = textbox(s, pad, Inches(0.4), colw - Inches(0.6), Inches(0.4)); _set(tf, kicker, 12, BLUE, bold=True)
    tf = textbox(s, pad, Inches(0.74), colw - Inches(0.6), Inches(0.9)); _set(tf, title, 22, NAVY, bold=True)
    y = Inches(1.85)
    tf = textbox(s, pad, y, colw - Inches(0.6), Inches(1.0))
    _set(tf, "WHAT IT IS", 10.5, GREY, bold=True, space_after=3)
    para(tf, what, 12.5, INK)
    y = Inches(3.0)
    if steps:
        tf = textbox(s, pad, y, colw - Inches(0.6), Inches(3.9))
        _set(tf, "STEP BY STEP", 10.5, GREY, bold=True, space_after=5)
        for i, stp in enumerate(steps):
            para(tf, stp, 11.5, INK, gap=6, bullet=False)
            tf.paragraphs[-1].text = f"{i+1}.  {stp}"
            tf.paragraphs[-1].runs[0].font.size = Pt(11.5)
            tf.paragraphs[-1].runs[0].font.color.rgb = INK
            tf.paragraphs[-1].runs[0].font.name = "Calibri"
    elif points:
        tf = textbox(s, pad, y, colw - Inches(0.6), Inches(3.9))
        _set(tf, "KEY POINTS", 10.5, GREY, bold=True, space_after=5)
        for pt in points:
            para(tf, pt, 12, INK, gap=7, bullet=True)
    add_image_fit(s, os.path.join(SHOTS, screenshot), colw + Inches(0.2), Inches(0.35),
                  SW - colw - Inches(0.45), SH - Inches(0.9))
    if caption:
        tf = textbox(s, colw + Inches(0.2), SH - Inches(0.5), SW - colw - Inches(0.45), Inches(0.4))
        _set(tf, caption, 10, GREY, italic=True, align=PP_ALIGN.CENTER)
    return s


def section_divider(title, subtitle):
    s = prs.slides.add_slide(BLANK)
    box(s, 0, 0, SW, SH, fill=NAVY)
    box(s, 0, Inches(3.0), SW, Inches(0.06), fill=BLUE)
    tf = textbox(s, Inches(0.9), Inches(2.05), SW - Inches(1.8), Inches(1.0)); _set(tf, title, 32, WHITE, bold=True)
    tf = textbox(s, Inches(0.9), Inches(3.25), SW - Inches(1.8), Inches(0.8)); _set(tf, subtitle, 16, RGBColor(0xC7, 0xD3, 0xE8))
    return s


def big_shot(kicker, title, screenshot, blurb, impact=None, caption=None):
    """A large, near-full-bleed screenshot with a slim header — for look & feel.

    When `impact` is given, the screenshot region shrinks slightly and an
    IMPACT strip is drawn at the bottom so every tour slide states the value,
    not just what the screen is. `caption` prints a small italic note under the
    blurb (used to say "a few examples shown — the full list scrolls").
    """
    s = prs.slides.add_slide(BLANK)
    box(s, 0, 0, SW, Inches(0.12), fill=BLUE)
    tf = textbox(s, Inches(0.5), Inches(0.22), SW - Inches(1.0), Inches(0.4)); _set(tf, kicker, 11, BLUE, bold=True, space_after=0)
    tf = textbox(s, Inches(0.5), Inches(0.5), Inches(8.5), Inches(0.5)); _set(tf, title, 20, NAVY, bold=True, space_after=0)
    tf = textbox(s, Inches(0.5), Inches(1.02), SW - Inches(1.0), Inches(0.45)); _set(tf, blurb, 12, GREY, space_after=0)
    img_top = Inches(1.55)
    if caption:
        ctf = textbox(s, Inches(0.5), Inches(1.44), SW - Inches(1.0), Inches(0.3))
        _set(ctf, caption, 10, BLUE, italic=True, space_after=0)
        img_top = Inches(1.78)
    img_h = SH - img_top - Inches(0.3) - (Inches(0.62) if impact else Inches(0))
    add_image_fit(s, os.path.join(SHOTS, screenshot), Inches(0.5), img_top,
                  SW - Inches(1.0), img_h)
    if impact:
        it = SH - Inches(0.72)
        box(s, Inches(0.5), it, SW - Inches(1.0), Inches(0.52), fill=LIGHT, line=RGBColor(0xD8, 0xDF, 0xEA))
        box(s, Inches(0.5), it, Inches(0.12), Inches(0.52), fill=GREEN)
        tf = textbox(s, Inches(0.75), it + Inches(0.05), SW - Inches(1.4), Inches(0.42))
        p = _set(tf, "IMPACT   ", 10.5, GREEN, bold=True, space_after=0)
        r = p.add_run(); r.text = impact
        r.font.size = Pt(11); r.font.color.rgb = INK; r.font.name = "Calibri"
    return s


def cards_slide(kicker, title, subtitle, cards, cols=3):
    s = prs.slides.add_slide(BLANK)
    title_bar(s, kicker, title)
    if subtitle:
        tf = textbox(s, Inches(0.6), Inches(1.25), SW - Inches(1.2), Inches(0.5)); _set(tf, subtitle, 13.5, GREY)
    n = len(cards); rows = (n + cols - 1) // cols
    gap = Inches(0.28)
    cardw = (SW - Inches(1.2) - gap * (cols - 1)) / cols
    top0 = Inches(1.9)
    cardh = (SH - top0 - Inches(0.4) - gap * (rows - 1)) / rows
    for i, (h, body) in enumerate(cards):
        r, c = divmod(i, cols)
        l = Inches(0.6) + (cardw + gap) * c
        t = top0 + (cardh + gap) * r
        box(s, l, t, cardw, cardh, fill=WHITE, line=RGBColor(0xD8, 0xDF, 0xEA))
        box(s, l, t, cardw, Inches(0.55), fill=NAVY)
        tf = textbox(s, l + Inches(0.15), t + Inches(0.08), cardw - Inches(0.3), Inches(0.45)); _set(tf, h, 13, WHITE, bold=True)
        tf = textbox(s, l + Inches(0.15), t + Inches(0.66), cardw - Inches(0.3), cardh - Inches(0.8))
        for j, b in enumerate(body):
            para(tf, b, 11, INK, gap=5, bullet=True, first=(j == 0))
    return s


# ============================================================================
# 1. TITLE
# ============================================================================
s = prs.slides.add_slide(BLANK)
box(s, 0, 0, SW, SH, fill=NAVY)
box(s, 0, Inches(3.35), SW, Inches(0.06), fill=BLUE)
tf = textbox(s, Inches(0.9), Inches(2.1), SW - Inches(1.8), Inches(1.2))
_set(tf, "Novartis ESG AI-Enabled Authoring Studio", 34, WHITE, bold=True)
tf = textbox(s, Inches(0.9), Inches(3.55), SW - Inches(1.8), Inches(0.9))
_set(tf, "Capabilities, workflow, and the path to the Novartis environment", 18, RGBColor(0xC7, 0xD3, 0xE8))
tf = textbox(s, Inches(0.9), Inches(6.6), SW - Inches(1.8), Inches(0.5))
_set(tf, "Report on Nonfinancial Matters (RNFM) · FY2026 · Prepared for Novartis SI&S / ESG FRA", 12, RGBColor(0x8E, 0xA0, 0xC0))

# ============================================================================
# 2. AGENDA
# ============================================================================
cards_slide(
    "OVERVIEW", "What this deck covers", None,
    [
        ("1 · Capabilities", ["What the studio does end to end", "How AI drafting is grounded", "Compliance, evidence, export"]),
        ("2 · The Editor", ["Step-by-step authoring", "Track-changes review", "AI assistance in the doc"]),
        ("3 · Roles & Approval", ["Who can do what, and when", "Two-level sign-off model", "Audit trail"]),
        ("4 · Versioning", ["Automatic version history", "Side-by-side comparison", "Re-approval rules"]),
        ("5 · Datapoints & Confidence", ["ESRS/ISSB/GRI/TCFD mapping", "Coverage + rationale", "How confidence is scored"]),
        ("6 · Roadmap & Inputs", ["What is still to complete", "The wider report suite", "What Novartis provides"]),
        ("7 · Architecture & AWS", ["Solution architecture", "AI components at the core", "AWS services used"]),
    ], cols=3,
)

# ============================================================================
# SECTION 1 — CAPABILITIES
# ============================================================================
section_divider("1 · Capabilities", "An AI-drafted, human-governed studio for the annual RNFM.")

cards_slide(
    "CAPABILITY MAP", "What the platform does", "Each capability is designed to remove a manual, error-prone step in today's process.",
    [
        ("AI first draft", ["Generates each section from your indexed documents (RAG).", "Rolls last year's approved report forward and flags what changed.", "Every claim carries a citation to its source."]),
        ("Compliance mapping", ["Maps content to ESRS, GRI, TCFD, ISSB, MSA & NTA.", "Coverage: covered / partial / missing, with rationale.", "AI-suggested fill text for gaps, grounded in evidence."]),
        ("Word-like editor", ["Track changes with per-change accept / reject.", "In-editor AI chat that drafts and revises.", "Source-evidence attachment per section."]),
        ("Governed workflow", ["Role-based review; two-level sign-off.", "Immutable audit trail with before/after.", "MDD-compliant Word + PDF export."]),
        ("Versioning", ["A version is frozen on every save and sign-off.", "Side-by-side comparison of any two versions.", "Re-editing an approved section is controlled."]),
        ("Peer benchmarking", ["Cited Q&A against indexed peer reports.", "Evidence-based disclosure decisions.", "Prioritises the customer's own datapoints."]),
    ], cols=3,
)

# ============================================================================
# SECTION 2 — THE EDITOR (step by step)
# ============================================================================
section_divider("2 · The Editor", "How a section is drafted, reviewed and approved — step by step.")

shot_slide(
    "EDITOR · ORIENTATION", "The authoring surface", "03-editor-section.png",
    "One subsection at a time: the AI draft, its citations, the assigned datapoints, and the prior-year approved baseline it was rolled forward from.",
    points=[
        "Left: the 86-subsection tree, colour-coded by status.",
        "Collapsible cards: Content, Roll-forward, Evidence, Comments, Approval.",
        "Header shows Input Provider, word count, status and version count.",
        "“View as” switch previews any role's experience (demo aid).",
    ],
    caption="Report Editor — a single subsection open for review",
)

shot_slide(
    "EDITOR · TRACK CHANGES", "Reviewing edits like Word", "19-track-changes-editor.png",
    "A single editing view with track changes always on: what you type is a green insertion, what you delete is a struck-through deletion — nothing is applied until it is accepted.",
    steps=[
        "Open a section and choose Edit.",
        "Type or delete — edits appear inline, marked.",
        "Review each suggestion: accept (✓) or reject (✗).",
        "Or resolve all at once with Accept all / Reject all.",
        "Save — the accepted text becomes the working draft.",
    ],
    caption="Inline insertions (green) and deletions (struck-through) with per-change accept/reject",
)

shot_slide(
    "EDITOR · AI ASSISTANCE", "Draft and revise with AI, in the document", "20-ai-chat-suggestion.png",
    "Ask the AI to draft a paragraph or revise a passage. Its output arrives as tracked suggestions you accept or reject — the AI never changes approved text silently.",
    points=[
        "“Draft a paragraph on …” or select text and ask to rephrase.",
        "AI edits are marked as AI-origin and reviewed like any change.",
        "Grounded in the section's attached evidence when provided.",
        "Same governance path as human edits — full traceability.",
    ],
    caption="AI-proposed text enters as an accept/reject suggestion",
)

shot_slide(
    "EDITOR · ROLL-FORWARD", "Carrying last year forward, change by change", "18-rollforward-change-by-change.png",
    "The AI rolls the FY2025 approved section forward to FY2026 and shows every change. The author keeps or reverts each paragraph, or accepts them all as the working base.",
    points=[
        "Each changed / added / removed paragraph is listed with its redline.",
        "Keep FY2026 wording, or revert a paragraph to FY2025.",
        "“Accept all remaining” finalises the rest in one click.",
        "Reduces re-drafting to a focused review of what actually changed.",
    ],
    caption="Change-by-change acceptance of the AI roll-forward",
)

shot_slide(
    "EDITOR · EVIDENCE", "Attaching source evidence to a claim", "13-evidence.png",
    "Input Providers attach the proof behind a figure — a screenshot, SOP excerpt, email or report page — anchored to the exact claim it supports. Recorded in the audit trail.",
    points=[
        "Distinct from the AI's automatic citations — this is human provenance.",
        "Each item names what it evidences and who added it.",
        "Feeds the AI as grounding context for that section.",
        "Read-only reviewers can view but not change evidence.",
    ],
    caption="“Evidence & sources” — human-supplied provenance per section",
)

# ============================================================================
# SECTION 3 — ROLES & APPROVAL
# ============================================================================
section_divider("3 · Roles & Approval", "Who can approve what, and when.")

# Roles table slide
s = prs.slides.add_slide(BLANK)
title_bar(s, "GOVERNANCE · ROLES", "The five roles and what each can do")
rows = [
    ("Role", "Can edit", "Approves", "When", NAVY, True),
    ("Input Provider", "Own subsection, in track changes; can comment", "Signs off L3 (subsection)", "During drafting; sign-off locks it to them", INK, False),
    ("Owner (1+)", "In track changes; comments. Absorbs the legal reviewer.", "Signs off L2 (section) — ALL owners must sign", "After all subsections signed off by their IPs", INK, False),
    ("Editor", "Any section, with/without tracking; accepts/rejects changes", "Curates; does not sign off", "Any time — the only role that accepts/rejects", INK, False),
    ("Admin", "Full access (superset of Editor)", "Can also sign off at L2", "Any time (ESG Reporting Lead seat)", INK, False),
    ("Guest", "Read-only; can comment", "Never", "For reviewers who see + comment only", GREY, False),
]
tl = Inches(0.6); tt = Inches(1.5); tw = SW - Inches(1.2)
colw = [Inches(2.2), Inches(3.7), Inches(2.8), Inches(3.43)]
rowh = Inches(0.9)
for ri, (c0, c1, c2, c3, color, header) in enumerate(rows):
    y = tt + rowh * ri if ri == 0 else tt + Inches(0.6) + Inches(0.98) * (ri - 1)
    rh = Inches(0.6) if ri == 0 else Inches(0.98)
    x = tl
    for ci, (txt, w) in enumerate(zip((c0, c1, c2, c3), colw)):
        box(s, x, y, w, rh, fill=(NAVY if header else (LIGHT if ri % 2 else WHITE)), line=RGBColor(0xD8, 0xDF, 0xEA))
        tf = textbox(s, x + Inches(0.1), y + Inches(0.06), w - Inches(0.2), rh - Inches(0.12))
        tf.word_wrap = True
        _set(tf, txt, 11.5 if header else 11, WHITE if header else color, bold=(header or ci == 0), space_after=0)
        x += w

shot_slide(
    "GOVERNANCE · SIGN-OFF", "The approval workflow", "09-approval-workflow.png",
    "Two sign-off levels: L3 is the subsection (its Input Provider); L2 is the section (its Owners). A section is fully approved only when every assigned owner has signed off.",
    steps=[
        "Input Provider drafts and signs off their subsection (L3).",
        "When all subsections in a section are L3-signed, Owners review at L2.",
        "Every assigned Owner must sign off to approve the section.",
        "Editors accept/reject tracked changes throughout.",
        "Re-editing an approved section resets it for re-approval.",
    ],
    caption="Visual stepper: Input Provider → Owner(s), with per-step status",
)

shot_slide(
    "GOVERNANCE · DASHBOARD", "Every role sees its own open tasks", "15-dashboard-role-switch.png",
    "The dashboard shows a personalised task queue. A “View tasks as” switch previews each role's queue — and it is validated against that role's permissions, so it never shows an action the role cannot perform.",
    points=[
        "Input Provider sees drafting tasks; Owner sees sign-off tasks.",
        "Editor/Admin see everything in flight; Guest has none.",
        "Overdue-first ordering; click a task to open that subsection.",
        "Live progress by stage across all subsections.",
    ],
    caption="“My Open Tasks” with the role switch in the page header",
)

shot_slide(
    "GOVERNANCE · AUDIT", "An append-only record for assurance", "08-audit.png",
    "Every edit, approval, upload, scan, export and evidence attachment is captured with user, timestamp and before/after context — the primary evidence source for external assurance.",
    points=[
        "Attached source evidence appears here automatically.",
        "Nothing is overwritten silently; full traceability.",
        "Filterable by action and user; exportable.",
        "Designed for 7-year retention.",
    ],
    caption="Audit Trail — the assurance-grade activity log",
)

# ============================================================================
# SECTION 4 — VERSIONING
# ============================================================================
section_divider("4 · Versioning & comparison", "Every change is captured and comparable.")

shot_slide(
    "VERSIONING", "Version history & side-by-side compare", "21-versions-compare.png",
    "A version is frozen automatically on every saved edit and every sign-off. Any two versions can be compared as a redline, so a reviewer sees exactly what changed between two points in time.",
    steps=[
        "Each save/sign-off adds a timestamped, attributed version.",
        "Open Versions on a subsection to see its timeline.",
        "Select a version to see its redline vs the current draft.",
        "Use it to answer “what changed since Legal last saw this?”",
    ],
    caption="Version timeline with an inline redline comparison",
)

# ============================================================================
# SECTION 5 — DATAPOINTS & CONFIDENCE
# ============================================================================
section_divider("5 · Datapoints & confidence", "How disclosure requirements are assigned and scored.")

shot_slide(
    "DATAPOINTS · ASSIGNMENT", "Datapoints assigned to a section", "11-datapoint-details.png",
    "Each subsection is tagged with the disclosure requirements it addresses (ESRS, ISSB, GRI, TCFD, MSA, NTA). Clicking a datapoint opens one details view — coverage, rationale and the verbatim requirement text — without leaving the editor.",
    points=[
        "Datapoints are assigned by the AI compliance mapping.",
        "Status dot per datapoint: covered / partial / missing.",
        "One “View details” popup — no navigating away and back.",
        "Bi-directional: jump to every section that addresses a datapoint.",
    ],
    caption="Datapoint details — coverage, rationale and standard text in one popup",
)

shot_slide(
    "DATAPOINTS · GAP ANALYSIS", "Why partial, why missing, and what to add", "16-compliance-gap-detail.png",
    "For every requirement the system shows coverage, a confidence score, and — for partial or missing — a rationale explaining what is present versus still needed, plus whether adding it is beneficial.",
    points=[
        "“Why partially covered” names the data points still outstanding.",
        "“Why missing” / “Should this be added?” guides the decision.",
        "AI-suggested fill text, grounded in the knowledge base.",
        "Filter by framework and by materiality.",
    ],
    caption="Gap detail with rationale and suggested fill",
)

# Confidence explainer slide
s = prs.slides.add_slide(BLANK)
title_bar(s, "DATAPOINTS · CONFIDENCE", "How the confidence score is calculated")
tf = textbox(s, Inches(0.6), Inches(1.35), SW - Inches(1.2), Inches(0.7))
_set(tf, "The confidence score expresses how sure the compliance mapping is that a disclosure requirement is genuinely satisfied by the mapped section — shown as a 0–100% bar next to each datapoint.", 13.5, INK)
cards = [
    ("Semantic coverage", ["The mapping compares the requirement's expected data points against the section text.", "A higher share of expected data points present → higher confidence.", "Covered ≈ high, partial ≈ medium, missing ≈ low."]),
    ("Signals combined", ["Presence of the required quantitative figures and prior-year comparatives.", "Methodology / boundary statements the standard expects.", "Citation coverage — whether claims trace to a source."]),
    ("How to read it", ["High: the requirement is well evidenced — light-touch review.", "Medium: present but incomplete — see the “why partial” note.", "Low: little or no matching content — candidate to draft or justify."]),
]
gap = Inches(0.3); cardw = (SW - Inches(1.2) - gap * 2) / 3; top = Inches(2.35); cardh = Inches(4.4)
for i, (h, body) in enumerate(cards):
    l = Inches(0.6) + (cardw + gap) * i
    box(s, l, top, cardw, cardh, fill=WHITE, line=RGBColor(0xD8, 0xDF, 0xEA))
    box(s, l, top, cardw, Inches(0.6), fill=BLUE)
    tf = textbox(s, l + Inches(0.15), top + Inches(0.1), cardw - Inches(0.3), Inches(0.5)); _set(tf, h, 14, WHITE, bold=True)
    tf = textbox(s, l + Inches(0.15), top + Inches(0.75), cardw - Inches(0.3), cardh - Inches(0.9))
    for j, b in enumerate(body):
        para(tf, b, 11.5, INK, gap=7, bullet=True, first=(j == 0))
tf = textbox(s, Inches(0.6), top + cardh + Inches(0.1), SW - Inches(1.2), Inches(0.4))
_set(tf, "Today's scores reflect a curated mapping; in the Novartis environment the score is produced by the compliance agent from the live section text and requirement library (see roadmap).", 10.5, GREY, italic=True)

# ============================================================================
# SECTION 6 — ROADMAP & CUSTOMER INPUTS
# ============================================================================
section_divider("6 · Roadmap & inputs", "What is still to complete, and what we need from Novartis.")

cards_slide(
    "ROADMAP", "What is still to be completed", "Capabilities designed and scoped, to be finished as the application moves into the Novartis environment.",
    [
        ("Compliance validation", ["Automated validation of coverage against the full ESRS/ISSB requirement library.", "Blocking rules for mandatory disclosures at sign-off.", "Confidence produced live from section text."]),
        ("Admin & monitoring panel", ["Central console for users, roles and assignments.", "Pipeline / job monitoring and ingestion status.", "Usage, adoption and cycle-time dashboards."]),
        ("Knowledge base at scale", ["Full ingestion of Novartis source corpus.", "Retrieval tuning for precision and cost.", "Trusted external standards as reference sources."]),
        ("Live MDD tables", ["Direct pull of table data from MDD (source of truth).", "Round-trip on export with MDD codes.", "Refresh-from-MDD in the editor."]),
        ("Real generation", ["Section drafting, compliance scan and peer Q&A on the managed AI service.", "Style-guide and consistency enforcement.", "Assurance-ready citation coverage."]),
        ("Enterprise integration", ["SSO / identity, roles from corporate groups.", "Secure document storage and retention.", "Deployment into the Novartis-approved environment."]),
    ], cols=3,
)

# The wider report suite — the other reports the platform is being extended to
# cover, and how AI helps in each. Grounded in frontend/src/data/reports.ts.
cards_slide(
    "ONE PLATFORM · MANY REPORTS", "The wider report suite",
    "Everything so far is the RNFM. The same studio and one shared knowledge base extend to Novartis's other sustainability disclosures — so a figure is drafted, cited and approved once, then reused everywhere.",
    [
        ("RNFM — active", [
            "Swiss CO Art. 964a today; ESRS-compliant from FY2027.",
            "AI: first-draft RAG generation, roll-forward, citations.",
            "The primary report and source of truth for the rest.",
        ]),
        ("ESG Index — new", [
            "Consolidated index of every ESG metric + disclosure.",
            "AI: auto-generates ESRS / GRI / ISSB / SASB cross-refs.",
            "Pointers resolve to the authoritative RNFM section.",
        ]),
        ("Update on Public Commitments — new", [
            "SI&S targets, performance tables and narrative.",
            "AI: reuses RNFM numbers + methodology, drafts narrative.",
            "No re-collection — figures reconcile across documents.",
        ]),
        ("Australian ASRS — from FY2027", [
            "AASB S1 / S2 report for the Australian legal entity.",
            "AI: maps global ISSB content → local ASRS requirements.",
            "Drafted once from the ISSB basis, reused locally.",
        ]),
        ("Human Rights Statement — 2026", [
            "Modern-slavery / transparency across UK, AU, CA, NO, CH acts.",
            "AI: drafts from the same human-rights evidence base.",
            "Standalone for 2026, then folds into the RNFM from 2027.",
        ]),
        ("Why one platform", [
            "One indexed source of truth — no reconciliation gaps.",
            "Cross-references keep every report consistent.",
            "One governance + audit trail across the whole suite.",
        ]),
    ], cols=3,
)

# What the customer needs to provide
s = prs.slides.add_slide(BLANK)
title_bar(s, "WHAT WE NEED FROM NOVARTIS", "Inputs that make the move fast, low-risk and low-complexity")
tf = textbox(s, Inches(0.6), Inches(1.3), SW - Inches(1.2), Inches(0.55))
_set(tf, "The more of these are ready, the more the move becomes configuration rather than build — keeping integration and setup straightforward.", 13, GREY)
groups = [
    ("Content & standards", [
        "Current MDD / Master Document Design template (Word styles).",
        "Novartis Style Guide.",
        "Recent approved RNFMs (2–3 years) for structure & baseline.",
        "GRI / TCFD requirement text to match ESRS/ISSB coverage.",
    ]),
    ("Source data & systems", [
        "The document corpus to index (policies, SOPs, standards, peer reports).",
        "MDD table data + access method for the live pull.",
        "The datapoint / DR list per report to prioritise mapping.",
        "Report structures for the other reports (ESG Index, UPC, ASRS).",
    ]),
    ("People & governance", [
        "Role assignments: Input Providers, Owners, Legal, Editors, Admins.",
        "Approval rules to confirm (e.g. owner sign-off policy).",
        "Materiality assessment outcomes to scope disclosures.",
        "Business KPIs / ROI targets to measure success.",
    ]),
    ("Environment & security", [
        "Target AWS environment and identity provider (SSO) details.",
        "Data-handling, retention and residency requirements.",
        "DDIT / security review path and approvers.",
        "Integration points with existing Novartis systems.",
    ]),
]
gap = Inches(0.3); cardw = (SW - Inches(1.2) - gap) / 2; top = Inches(2.0); cardh = Inches(2.45)
for i, (h, body) in enumerate(groups):
    r, c = divmod(i, 2)
    l = Inches(0.6) + (cardw + gap) * c
    t = top + (cardh + Inches(0.25)) * r
    box(s, l, t, cardw, cardh, fill=LIGHT, line=RGBColor(0xD8, 0xDF, 0xEA))
    box(s, l, t, Inches(0.12), cardh, fill=BLUE)
    tf = textbox(s, l + Inches(0.3), t + Inches(0.12), cardw - Inches(0.5), Inches(0.4)); _set(tf, h, 14, NAVY, bold=True)
    tf = textbox(s, l + Inches(0.3), t + Inches(0.6), cardw - Inches(0.5), cardh - Inches(0.7))
    for j, b in enumerate(body):
        para(tf, b, 11, INK, gap=5, bullet=True, first=(j == 0))

# Export slide (explicitly requested screenshot)
shot_slide(
    "OUTPUT · EXPORT", "Export: MDD Word + PDF", "14-export.png",
    "The report exports as an MDD-compatible Word document — the authoritative artefact, produced once every subsection is approved — or as a readable PDF for review and sharing at any time.",
    points=[
        "Word/MDD applies Novartis paragraph styles; tables map to MDD codes.",
        "PDF is a review copy — available before full approval.",
        "Disabled actions explain why (e.g. approvals still pending).",
        "Word/MDD remains the single source of truth for publication.",
    ],
    caption="Export panel — Generate PDF (any time) or DOCX/MDD (once approved)",
)

# ============================================================================
# 7. PLATFORM TOUR — large screenshots for look & feel (no demo access needed)
# ============================================================================
section_divider("7 · Platform tour", "A visual walk through the main screens.")

big_shot("TOUR · DASHBOARD", "Dashboard — the reporting command centre", "01-dashboard.png",
         "Live progress by stage, 2027 ESRS readiness, roll-forward status, personalised open tasks and recent activity — one place to run the cycle.",
         impact="One live view of the whole cycle replaces status chased across email and spreadsheets.")
big_shot("TOUR · KNOWLEDGE BASE", "Knowledge Base — grounded in Novartis's own documents", "02-knowledge-base.png",
         "These are Novartis's own documents — policies, standards, prior RNFMs, peer reports and the Style Guide (a few shown here). In the Novartis environment this connects to Novartis's trusted document systems (SharePoint / DMS) so the library stays current automatically. Every AI claim traces back to a source indexed here.",
         impact="AI drafts only from Novartis-trusted sources — nothing invented, every claim citable to its origin.",
         caption="A few example documents shown — the indexed library is far larger and scrolls.")
big_shot("TOUR · REPORT EDITOR", "Report Editor — a subsection open for review", "03-editor-section.png",
         "The AI draft with its citations, assigned datapoints, the prior-year baseline, and the collapsible workflow cards — all for one subsection at a time.",
         impact="Reviewers start from a cited draft, not a blank page — the bulk of first-draft effort is removed.")
big_shot("TOUR · TRACK CHANGES", "Editor — Word-like track changes", "19-track-changes-editor.png",
         "Insertions (green) and deletions (struck-through) are shown inline with per-change accept/reject, plus an in-document AI assistant.",
         impact="Familiar Word-style review with full attribution — no new tool to learn, every edit is auditable.")
big_shot("TOUR · COMPLIANCE", "2027 ESRS Readiness — coverage overview", "05-compliance.png",
         "A forward-looking gap analysis mapping today's report to ESRS/ISSB/GRI/TCFD, with traffic-light coverage per requirement.",
         impact="See CSRD/ESRS gaps years ahead of the FY2027 mandate — de-risks the transition.")
big_shot("TOUR · COMPLIANCE BY STANDARD", "Coverage by standard, datapoint by datapoint", "22-compliance-by-standard.png",
         "Expand any standard to see each disclosure requirement, its coverage status and the report sections that address it.",
         impact="Evidence of mandatory-disclosure coverage on demand — ready for external assurance.",
         caption="Top of the coverage grid shown — every framework and requirement continues below.")
big_shot("TOUR · GRI REQUIREMENT TEXT", "Requirement text for every framework", "24-gri-requirement-text.png",
         "ESRS, ISSB, GRI, TCFD, MSA and NTA requirements open the actual standard wording — so a reviewer interprets the source, not an AI paraphrase.",
         impact="Reviewers judge against the real standard text — removes interpretation risk on compliance calls.")
big_shot("TOUR · CONSISTENCY", "Consistency Check — cross-document validation", "06-consistency.png",
         "Compares figures and terminology across the RNFM and the Annual Report and flags discrepancies for resolution.",
         impact="Catches numbers that don't reconcile between documents before they reach publication.",
         caption="A few example checks shown — the full validation list scrolls.")
big_shot("TOUR · PEER BENCHMARKING", "Peer Benchmarking — cited Q&A", "07-benchmarking.png",
         "Natural-language questions answered from indexed peer sustainability reports, with citations to the source and page.",
         impact="Benchmark disclosure approaches in minutes instead of manual peer-report reading.")
big_shot("TOUR · COMMENTS", "Comments & change requests", "23-comments.png",
         "Any role can comment; comment-only roles raise change requests that route to Editors, who apply them as tracked changes.",
         impact="Review conversation lives in the document — no context lost across email threads.")
big_shot("TOUR · SECTION STRUCTURE", "Section Structure — configure the report tree", "10-structure.png",
         "Add, rename, move or remove chapters / sub-topics / subsections, then publish a reviewed, versioned structure change to the editor.",
         impact="The report structure adapts to Novartis as standards evolve — a governed, versioned change.",
         caption="Top of the section tree shown — the full report structure continues below.")
big_shot("TOUR · ROLES & UPDATES", "In-app roles & change reference", "17-roles-updates.png",
         "The studio also carries an in-app reference of the role model and the latest changes — useful for onboarding reviewers.",
         impact="New reviewers onboard from inside the app — less ramp-up per reporting cycle.")

# ============================================================================
# SECTION 8 — ARCHITECTURE & AWS SERVICES
# ============================================================================
section_divider("8 · Architecture & AWS", "How the solution is built — with AI at its core — and the AWS services that run it.")

# --- Architecture overview: layered tiers, AI components highlighted ---------
s = prs.slides.add_slide(BLANK)
title_bar(s, "SOLUTION ARCHITECTURE", "Overall architecture — AI components highlighted")
tf = textbox(s, Inches(0.6), Inches(1.25), SW - Inches(1.2), Inches(0.45))
_set(tf, "A serverless AWS application: a static web studio, a governed API/workflow tier, and — at its core — Amazon Bedrock AI agents grounded in an indexed knowledge base. AI components are shown in purple.", 12, GREY)

LX = Inches(0.6); LW = SW - Inches(1.2)
rowh = Inches(0.92); rgap = Inches(0.18); y0 = Inches(1.95)


def arch_band(idx, label, boxes, band_fill):
    """One horizontal tier: a label strip on the left, component boxes on the right."""
    t = y0 + (rowh + rgap) * idx
    box(s, LX, t, LW, rowh, fill=band_fill, line=RGBColor(0xD8, 0xDF, 0xEA))
    lb = textbox(s, LX + Inches(0.12), t + Inches(0.05), Inches(1.55), rowh - Inches(0.1))
    _set(lb, label, 10.5, NAVY, bold=True)
    lb.word_wrap = True
    inner_l = LX + Inches(1.75)
    inner_w = LW - Inches(1.9)
    n = len(boxes)
    g = Inches(0.16)
    bw = (inner_w - g * (n - 1)) / n
    for i, (name, sub, is_ai) in enumerate(boxes):
        bl = inner_l + (bw + g) * i
        fill = PURPLE if is_ai else WHITE
        box(s, bl, t + Inches(0.1), bw, rowh - Inches(0.2), fill=fill,
            line=(PURPLE if is_ai else RGBColor(0xC2, 0xCC, 0xDA)))
        ctf = textbox(s, bl + Inches(0.08), t + Inches(0.15), bw - Inches(0.16), rowh - Inches(0.28))
        _set(ctf, name, 10.5, (WHITE if is_ai else NAVY), bold=True, space_after=1)
        para(ctf, sub, 8.5, (RGBColor(0xE7, 0xE0, 0xFB) if is_ai else GREY))


arch_band(0, "Users", [
    ("ESG Lead · SME · Legal · Editor · Admin", "Sign in via corporate SSO (Cognito → Novartis IdP)", False),
], LIGHT)
arch_band(1, "Presentation", [
    ("Authoring Studio SPA (React)", "CloudFront + S3 static hosting", False),
    ("Amazon Cognito", "SAML/OIDC federation, role claims", False),
], LIGHT)
arch_band(2, "Application", [
    ("API Service (ECS Fargate + ALB)", "Document CRUD, workflow, RBAC, audit queries", False),
    ("Workflow & Audit Service", "State machine, sign-off rules, immutable log", False),
    ("SQS job queues", "Async draft / scan / export dispatch", False),
], LIGHT)
arch_band(3, "AI core", [
    ("RNFM Draft Agent", "Bedrock AgentCore · Claude", True),
    ("Compliance Gap Agent", "ESRS/GRI/ISSB coverage", True),
    ("Peer Benchmarking Agent", "Cited Q&A over peers", True),
    ("Bedrock Knowledge Base", "Titan embeddings · OpenSearch", True),
], LIGHT)
arch_band(4, "Data & pipelines", [
    ("DynamoDB", "Docs, sections, mappings, workflow, audit", False),
    ("S3 (KMS)", "Source docs + MDD exports", False),
    ("Ingestion (Step Functions + Textract)", "Parse → chunk → embed → index", True),
    ("DOCX Export (Lambda)", "MDD-compliant Word / PDF", False),
], LIGHT)

tf = textbox(s, Inches(0.6), y0 + (rowh + rgap) * 5 + Inches(0.02), LW, Inches(0.4))
_set(tf, "Purple = AI components. All AI runs on Amazon Bedrock inside Novartis's own AWS tenancy; content is never used to train foundation models. Every AI claim traces back to an indexed source in the knowledge base.", 10, GREY, italic=True)

# --- AWS services slide ------------------------------------------------------
cards_slide(
    "AWS SERVICES", "AWS services needed for this solution",
    "Fully serverless and managed — no servers to patch, and AI is a managed Bedrock capability rather than self-hosted models.",
    [
        ("Front end & identity", [
            "Amazon CloudFront + Amazon S3 (static SPA).",
            "Amazon Cognito (SAML/OIDC federation to Novartis IdP).",
            "AWS WAF on the ALB.",
        ]),
        ("Compute & API", [
            "Amazon ECS (Fargate) — API + Workflow/Audit services.",
            "Application Load Balancer.",
            "AWS Lambda — DOCX/PDF export + ingestion steps.",
        ]),
        ("AI / ML (Amazon Bedrock)", [
            "Bedrock AgentCore — the three Strands agents.",
            "Claude (Sonnet / Opus / Haiku) for drafting & analysis.",
            "Titan Embeddings + Knowledge Bases for RAG.",
        ]),
        ("Retrieval & search", [
            "Amazon OpenSearch Serverless (vector store).",
            "Amazon Bedrock Knowledge Bases (managed RAG).",
            "Amazon Textract — PDF/DOCX text extraction.",
        ]),
        ("Data, messaging & orchestration", [
            "Amazon DynamoDB (docs, workflow, audit, mappings).",
            "Amazon S3 (KMS-encrypted source + exports).",
            "Amazon SQS, AWS Step Functions, Amazon EventBridge, SNS.",
        ]),
        ("Security & operations", [
            "AWS KMS (customer-managed keys), AWS Secrets Manager.",
            "AWS IAM — least-privilege roles + Cognito groups.",
            "Amazon CloudWatch + AWS X-Ray observability.",
        ]),
    ], cols=3,
)

# ============================================================================
# CLOSING
# ============================================================================
s = prs.slides.add_slide(BLANK)
box(s, 0, 0, SW, SH, fill=NAVY)
box(s, 0, Inches(3.0), SW, Inches(0.06), fill=BLUE)
tf = textbox(s, Inches(0.9), Inches(1.5), SW - Inches(1.8), Inches(1.1))
_set(tf, "AI-assisted, human-governed, audit-ready", 30, WHITE, bold=True)
tf = textbox(s, Inches(0.9), Inches(3.25), SW - Inches(1.8), Inches(3.0))
for j, b in enumerate([
    "A Word-like editor with true track changes, per-change review and in-document AI.",
    "Framework mapping with coverage, rationale and confidence for ESRS/ISSB/GRI/TCFD.",
    "Governed roles, two-level sign-off, versioning and an assurance-grade audit trail.",
    "Clear roadmap and a short list of Novartis inputs to move into the environment with confidence.",
]):
    p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
    p.text = "•  " + b; p.space_after = Pt(13)
    p.runs[0].font.size = Pt(15); p.runs[0].font.color.rgb = RGBColor(0xE7, 0xED, 0xF7); p.runs[0].font.name = "Calibri"

os.makedirs(os.path.dirname(OUT), exist_ok=True)
prs.save(OUT)
print(f"Saved deck: {OUT} ({len(prs.slides.__iter__.__self__._sldIdLst)} slides)")
