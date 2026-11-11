#!/usr/bin/env python3
"""Build the Novartis ESG Studio — Roles, Permissions & Approval Workflow deck.

Customer-facing deep-dive: exactly what each role can do (action-by-action, the
full action x role matrix, where roles overlap), how owners are assigned, and
the two-level (L3 -> L2) sign-off workflow. Every screenshot is purpose-captured
for the slide it sits on (see e2e/capture-roles*.spec.ts -> e2e/shots-roles/),
and each has been visually validated to show the control under discussion.

Verified against the code: data/workflowRoles.ts (ROLE_PERMISSIONS),
data/permissions.ts (structure-admin + report-wide gates), reportSections.ts
(owner assignment), workflowStatus.ts (state machine), EditorView.tsx (gates).
Backed by data/permissions-matrix.test.ts (33 passing assertions).

Run:  /tmp/pptx-venv/bin/python scripts/build_roles_deck.py
Output: frontend/public/Novartis-ESG-Studio-Roles-and-Approval.pptx
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SHOTS = os.path.join(ROOT, "frontend", "e2e", "shots-roles")
OUT = os.path.join(ROOT, "frontend", "public", "Novartis-ESG-Studio-Roles-and-Approval.pptx")

NAVY = RGBColor(0x0A, 0x1F, 0x44)
BLUE = RGBColor(0x1B, 0x5E, 0xC4)
INK = RGBColor(0x1A, 0x1A, 0x2E)
GREY = RGBColor(0x55, 0x5A, 0x66)
LIGHT = RGBColor(0xF2, 0xF5, 0xFA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREEN = RGBColor(0x15, 0x80, 0x3D)
AMBER = RGBColor(0xB4, 0x53, 0x09)
RED = RGBColor(0xC0, 0x2A, 0x2A)
PURPLE = RGBColor(0x7C, 0x3A, 0xED)
FAINT = RGBColor(0xD8, 0xDF, 0xEA)

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


def box(slide, l, t, w, h, fill=None, line=None, line_w=1.0):
    sp = slide.shapes.add_shape(1, l, t, w, h)
    sp.shadow.inherit = False
    if fill is None: sp.fill.background()
    else: sp.fill.solid(); sp.fill.fore_color.rgb = fill
    if line is None: sp.line.fill.background()
    else: sp.line.color.rgb = line; sp.line.width = Pt(line_w)
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


def section_divider(title, subtitle):
    s = prs.slides.add_slide(BLANK)
    box(s, 0, 0, SW, SH, fill=NAVY)
    box(s, 0, Inches(3.0), SW, Inches(0.06), fill=BLUE)
    tf = textbox(s, Inches(0.9), Inches(2.05), SW - Inches(1.8), Inches(1.0)); _set(tf, title, 32, WHITE, bold=True)
    tf = textbox(s, Inches(0.9), Inches(3.25), SW - Inches(1.8), Inches(0.8)); _set(tf, subtitle, 16, RGBColor(0xC7, 0xD3, 0xE8))
    return s


def shot_slide(kicker, title, screenshot, what, steps=None, points=None, caption=None):
    """Left explanation column, right screenshot (validated for this slide)."""
    s = prs.slides.add_slide(BLANK)
    box(s, 0, 0, SW, Inches(0.12), fill=BLUE)
    colw = Inches(4.95)
    box(s, 0, Inches(0.12), colw, SH, fill=LIGHT)
    pad = Inches(0.35)
    tf = textbox(s, pad, Inches(0.4), colw - Inches(0.6), Inches(0.4)); _set(tf, kicker, 12, BLUE, bold=True)
    tf = textbox(s, pad, Inches(0.74), colw - Inches(0.6), Inches(0.95)); _set(tf, title, 22, NAVY, bold=True)
    y = Inches(1.9)
    tf = textbox(s, pad, y, colw - Inches(0.6), Inches(1.0))
    _set(tf, "WHAT IT IS", 10.5, GREY, bold=True, space_after=3)
    para(tf, what, 12.5, INK)
    y = Inches(3.05)
    if steps:
        tf = textbox(s, pad, y, colw - Inches(0.6), Inches(3.9))
        _set(tf, "STEP BY STEP", 10.5, GREY, bold=True, space_after=5)
        for i, stp in enumerate(steps):
            p = para(tf, stp, 11.5, INK, gap=6)
            p.text = f"{i+1}.  {stp}"
            p.runs[0].font.size = Pt(11.5); p.runs[0].font.color.rgb = INK; p.runs[0].font.name = "Calibri"
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
        box(s, l, t, cardw, cardh, fill=WHITE, line=FAINT)
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
tf = textbox(s, Inches(0.9), Inches(2.0), SW - Inches(1.8), Inches(1.3))
_set(tf, "Roles, Permissions & Approval Workflow", 34, WHITE, bold=True)
tf = textbox(s, Inches(0.9), Inches(3.55), SW - Inches(1.8), Inches(0.9))
_set(tf, "Exactly what each role can do — shown on the real screens", 18, RGBColor(0xC7, 0xD3, 0xE8))
tf = textbox(s, Inches(0.9), Inches(6.6), SW - Inches(1.8), Inches(0.5))
_set(tf, "Novartis ESG AI-Enabled Authoring Studio · RNFM FY2026 · Prepared for Novartis SI&S / ESG FRA", 12, RGBColor(0x8E, 0xA0, 0xC0))

# ============================================================================
# 2. AGENDA
# ============================================================================
cards_slide(
    "OVERVIEW", "What this deck answers", None,
    [
        ("1 · Two kinds of 'role'", ["Acting role vs. per-section assignment", "How they combine to decide access", "How owners are assigned to sections"]),
        ("2 · The five roles", ["Input Provider, Owner, Editor, Admin, Guest", "What each is for, in one line", "Structure-admin as a separate gate"]),
        ("3 · The master matrix", ["Every action × every role", "Edit, review, sign-off, export", "Where roles overlap"]),
        ("4 · Action by action", ["Editing & track changes", "Comments & change requests", "AI, structure & admin"]),
        ("5 · The approval workflow", ["Two-level sign-off (L3 → L2)", "Tasks, export & audit trail", "Every owner must sign"]),
        ("6 · Roles + Active Directory", ["Capability from AD groups", "Assignment stays app-managed", "Shown as a live simulation"]),
        ("7 · Before production", ["Demo auth vs. SSO", "One compliance rule to wire", "What Novartis confirms"]),
    ], cols=3,
)

# ============================================================================
# SECTION 1 — TWO KINDS OF ROLE + OWNER ASSIGNMENT
# ============================================================================
section_divider("1 · Two kinds of 'role'", "The one thing to understand before the matrix makes sense.")

s = prs.slides.add_slide(BLANK)
title_bar(s, "MODEL", "Access = your acting role  +  your assignment on THAT section")
tf = textbox(s, Inches(0.6), Inches(1.3), SW - Inches(1.2), Inches(0.6))
_set(tf, "A person's permissions are not global. What you can do on a given subsection depends on two things combined:", 13.5, INK)
gap = Inches(0.4); cardw = (SW - Inches(1.2) - gap) / 2; top = Inches(2.15); cardh = Inches(3.5)
left = [
    ("1 · Acting role", BLUE, [
        "One of five: Input Provider, Owner, Editor, Admin, Guest.",
        "Decides the KIND of thing you can do — edit in track changes, accept/reject, sign off, comment only.",
        "Defined once in a single source of truth (ROLE_PERMISSIONS) — every screen derives from it.",
        "In production this comes from your corporate SSO (Cognito) group.",
    ]),
    ("2 · Assignment on the section", PURPLE, [
        "Every subsection names its own Input Provider (one person) and Owner(s) (one or more).",
        "You can only draft/sign a subsection you are assigned to.",
        "'Legal' is not a separate role — a legal reviewer is simply named as an Owner.",
        "So the same person can be an Owner on one section and have no role on another.",
    ]),
]
for i, (h, col, body) in enumerate(left):
    l = Inches(0.6) + (cardw + gap) * i
    box(s, l, top, cardw, cardh, fill=WHITE, line=FAINT)
    box(s, l, top, cardw, Inches(0.6), fill=col)
    tf = textbox(s, l + Inches(0.2), top + Inches(0.1), cardw - Inches(0.4), Inches(0.5)); _set(tf, h, 15, WHITE, bold=True)
    tf = textbox(s, l + Inches(0.2), top + Inches(0.78), cardw - Inches(0.4), cardh - Inches(0.9))
    for j, b in enumerate(body):
        para(tf, b, 12, INK, gap=8, bullet=True, first=(j == 0))
tf = textbox(s, Inches(0.6), top + cardh + Inches(0.15), SW - Inches(1.2), Inches(0.5))
_set(tf, "Plus a third, separate gate — the 'structure admin' group — controls who can change the report's structure, manage the knowledge base, run AI analysis and start a new reporting cycle.", 11, GREY, italic=True)

# How owners are assigned (answers the customer's explicit question)
s = prs.slides.add_slide(BLANK)
title_bar(s, "ASSIGNMENT", "How Owners are assigned to a section")
tf = textbox(s, Inches(0.6), Inches(1.3), SW - Inches(1.2), Inches(0.6))
_set(tf, "In the prototype, ownership is assigned by a rule per chapter/topic (not hand-picked per subsection). In the Novartis environment the ESG Reporting Lead assigns real people per section.", 13, INK)
gap = Inches(0.3); cardw = (SW - Inches(1.2) - gap * 2) / 3; top = Inches(2.35); cardh = Inches(3.5)
cards = [
    ("Input Provider", ["Named directly on each subsection row.", "The SME who drafts that subsection.", "Example: section 8.1.2 Climate Policies → the Environmental Manager."]),
    ("Content Owner", ["One accountable owner per top-level chapter.", "Signs off at L2 for the whole section.", "Example: all Environmental sections → the Environmental lead."]),
    ("Legal / Compliance Owner", ["Added as a SECOND owner on a section.", "No separate 'Legal' role — legal review = an owner sign-off.", "Modern-slavery / conduct topics route to Compliance Counsel."]),
]
for i, (h, body) in enumerate(cards):
    l = Inches(0.6) + (cardw + gap) * i
    box(s, l, top, cardw, cardh, fill=WHITE, line=FAINT)
    box(s, l, top, cardw, Inches(0.55), fill=NAVY)
    tf = textbox(s, l + Inches(0.15), top + Inches(0.08), cardw - Inches(0.3), Inches(0.45)); _set(tf, h, 13, WHITE, bold=True)
    tf = textbox(s, l + Inches(0.15), top + Inches(0.66), cardw - Inches(0.3), cardh - Inches(0.8))
    for j, b in enumerate(body):
        para(tf, b, 11.5, INK, gap=7, bullet=True, first=(j == 0))
tf = textbox(s, Inches(0.6), top + cardh + Inches(0.12), SW - Inches(1.2), Inches(0.5))
_set(tf, "A section is fully approved only once EVERY assigned owner has signed off (content owner + legal owner). Both are shown as 'Owner 1' and 'Owner 2' on the section.", 11, GREY, italic=True)

# The role switcher (validated screenshot)
shot_slide(
    "SEEING IT", "One login, every seat: the 'View as' switch", "r1-role-switcher.png",
    "The studio opens as Admin (the ESG Reporting Lead — the full-access seat). The 'View as' switch lets one person preview the studio exactly as any role sees it, to confirm what that role can and cannot do.",
    points=[
        "Five roles: Admin, Editor, Owner, Input Provider, Guest.",
        "'Owner — 2nd of this section' appears on multi-owner sections.",
        "Each seat behaves exactly as its permission definition — no hidden elevation.",
        "In production the role comes from the signed-in user; this switch is a demo aid.",
    ],
    caption="Report Editor header — the 'View as' role switch (Admin default)",
)

# ============================================================================
# SECTION 2 — THE FIVE ROLES
# ============================================================================
section_divider("2 · The five roles", "What each seat is for.")

cards_slide(
    "ROLES", "The five roles at a glance",
    "Each role maps to a real person in the reporting cycle. Ordered from most-scoped to most-powerful.",
    [
        ("Input Provider", ["The SME who drafts a subsection.", "Edits their OWN subsection in track changes; comments.", "Signs off at L3 (their subsection).", "Cannot accept/reject others' changes."]),
        ("Owner (1 or more)", ["Accountable for a section's content.", "Edits in track changes; comments.", "Signs off at L2 — every owner must sign.", "A Legal / Compliance reviewer is modelled as an Owner."]),
        ("Editor", ["The small central editing team (~3 people).", "Edits ANY section, with or without track changes.", "The only role that accepts / rejects changes.", "Curates; does not sign off."]),
        ("Admin", ["Full access — a superset of Editor.", "Everything an Editor can do, plus sign off at L2.", "Reaches Structure + Admin + KB + analysis.", "The ESG Reporting Lead's seat."]),
        ("Guest", ["A reviewer who may see and comment only.", "Read-only across the report.", "Can add comments / raise change requests.", "No editing, no sign-off, ever."]),
        ("Structure Admin (gate)", ["Not a 6th role — a separate group.", "Edit structure; manage knowledge base.", "Run AI scans; start a new report cycle.", "Maps to a Cognito group in production."]),
    ], cols=3,
)

# ============================================================================
# SECTION 3 — THE MASTER MATRIX
# ============================================================================
section_divider("3 · The master matrix", "Every action, every role, in one table.")

s = prs.slides.add_slide(BLANK)
title_bar(s, "PERMISSIONS", "Action × role — the complete matrix")

roles = ["Input\nProvider", "Owner", "Editor", "Admin", "Guest"]
matrix = [
    ("Edit subsection text (track changes)", ["own", "own", "any", "any", "—"]),
    ("Edit directly, no track changes", ["—", "—", "Y", "Y", "—"]),
    ("Accept / reject tracked changes", ["—", "—", "Y", "Y", "—"]),
    ("Review AI roll-forward change-by-change", ["—", "—", "Y", "Y", "—"]),
    ("Accept AI draft as working base", ["Y", "Y", "Y", "Y", "—"]),
    ("Add comment / raise change request", ["Y", "Y", "Y", "Y", "Y"]),
    ("Assign / approve / dismiss a request", ["—", "—", "Y", "Y", "—"]),
    ("Sign off L3 (subsection)", ["Y*", "—", "—", "—", "—"]),
    ("Sign off L2 (section)", ["—", "Y*", "—", "Y*", "—"]),
    ("Re-open a signed / approved section", ["—", "—", "Y", "Y", "—"]),
    ("Use AI assistant / draft datapoint", ["Y", "Y", "Y", "Y", "—"]),
    ("Export report (Word / PDF), any time", ["Y", "Y", "Y", "Y", "—"]),
    ("KB upload · run AI scan · new cycle", ["—", "—", "Y", "Y", "—"]),
    ("Edit structure · Admin panel", ["—", "—", "—", "Y†", "—"]),
    ("View / export audit trail", ["Y", "Y", "Y", "Y", "—"]),
]
tl = Inches(0.5); tt = Inches(1.45)
labelw = Inches(4.9); colw = (SW - Inches(1.0) - labelw) / len(roles)
rowh = (SH - tt - Inches(1.2)) / (len(matrix) + 1)

# header
box(s, tl, tt, labelw, rowh, fill=NAVY, line=FAINT)
tf = textbox(s, tl + Inches(0.1), tt + Inches(0.02), labelw - Inches(0.2), rowh - Inches(0.06))
_set(tf, "Action", 10.5, WHITE, bold=True, space_after=0)
for ci, rname in enumerate(roles):
    x = tl + labelw + colw * ci
    box(s, x, tt, colw, rowh, fill=NAVY, line=FAINT)
    tf = textbox(s, x + Inches(0.02), tt + Inches(0.01), colw - Inches(0.04), rowh - Inches(0.02))
    tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    for k, line in enumerate(rname.split("\n")):
        pp = p if k == 0 else tf.add_paragraph()
        pp.alignment = PP_ALIGN.CENTER; pp.space_after = Pt(0)
        pp.text = line; pp.runs[0].font.size = Pt(9); pp.runs[0].font.bold = True
        pp.runs[0].font.color.rgb = WHITE; pp.runs[0].font.name = "Calibri"

VAL_FILL = {
    "Y": (RGBColor(0xDC, 0xFC, 0xE7), GREEN), "any": (RGBColor(0xDC, 0xFC, 0xE7), GREEN),
    "own": (RGBColor(0xE0, 0xEC, 0xFB), BLUE),
    "Y*": (RGBColor(0xED, 0xE6, 0xFC), PURPLE), "Y†": (RGBColor(0xED, 0xE6, 0xFC), PURPLE),
    "—": (RGBColor(0xF3, 0xF4, 0xF6), RGBColor(0xB0, 0xB4, 0xBB)),
}
DISP = {"Y": "✓", "any": "✓ any", "own": "✓ own", "Y*": "✓", "Y†": "✓", "—": "—"}
for ri, (label, vals) in enumerate(matrix):
    y = tt + rowh * (ri + 1)
    box(s, tl, y, labelw, rowh, fill=(LIGHT if ri % 2 else WHITE), line=FAINT)
    tf = textbox(s, tl + Inches(0.1), y + Inches(0.01), labelw - Inches(0.2), rowh - Inches(0.02))
    _set(tf, label, 10, INK, bold=False, space_after=0)
    for ci, v in enumerate(vals):
        x = tl + labelw + colw * ci
        fill, txtcol = VAL_FILL.get(v, (WHITE, INK))
        box(s, x, y, colw, rowh, fill=fill, line=FAINT)
        tf = textbox(s, x, y + Inches(0.01), colw, rowh - Inches(0.02))
        _set(tf, DISP.get(v, v), 10.5, txtcol, bold=True, align=PP_ALIGN.CENTER, space_after=0)

# colour legend
legend = [
    (RGBColor(0xDC, 0xFC, 0xE7), GREEN, "Yes — always"),
    (RGBColor(0xE0, 0xEC, 0xFB), BLUE, "Yes — own sections only"),
    (RGBColor(0xED, 0xE6, 0xFC), PURPLE, "Conditional — assignment / group"),
    (RGBColor(0xF3, 0xF4, 0xF6), RGBColor(0xB0, 0xB4, 0xBB), "Not permitted"),
]
ly = tt + rowh * (len(matrix) + 1) + Inches(0.08)
lx = tl; sw_ = Inches(0.22)
for fill, edge, txt in legend:
    box(s, lx, ly, sw_, sw_, fill=fill, line=edge)
    tw = Inches(2.55) if "assignment" in txt else Inches(2.0)
    tf = textbox(s, lx + sw_ + Inches(0.06), ly - Inches(0.03), tw, Inches(0.3))
    _set(tf, txt, 9.5, INK, bold=False, space_after=0)
    lx += sw_ + Inches(0.06) + tw

tf = textbox(s, Inches(0.5), SH - Inches(0.34), SW - Inches(1.0), Inches(0.3))
_set(tf, "* own = only sections you're assigned to; L3 = Input Provider, L2 = every assigned Owner must sign.   † via the structure-admin group (a Cognito group in production).   Export produces a draft-watermarked Word file until all subsections are Approved.", 8.5, GREY, italic=True, space_after=0)

# Overlap slide
cards_slide(
    "WHERE ROLES OVERLAP", "Roles that share permissions — and the one thing that differs",
    "There are two near-identical pairs, plus what everyone shares.",
    [
        ("Editor ≈ Admin", [
            "IDENTICAL on content: edit anything, with or without track changes, accept / reject.",
            "DIFFERENCE 1: Admin can also sign off at L2; an Editor never signs off.",
            "DIFFERENCE 2: Admin reaches Structure / Admin / KB / analysis; an Editor does not.",
        ]),
        ("Input Provider ≈ Owner", [
            "IDENTICAL on editing: track-changes only, own sections, comment, cannot accept/reject.",
            "DIFFERENCE: the sign-off level. Input Provider signs L3 (their subsection); Owner signs L2 (the section).",
            "An Owner's L2 sign-off is what actually approves a section.",
        ]),
        ("Shared by (almost) everyone", [
            "Commenting and raising change requests — all five roles, incl. Guest.",
            "Viewing / exporting the audit trail — all roles EXCEPT the read-only Guest.",
            "AI proposals always arrive as tracked changes an Editor must accept — AI never writes final text.",
        ]),
    ], cols=3,
)

# ============================================================================
# SECTION 4 — ACTION BY ACTION (validated screenshots)
# ============================================================================
section_divider("4 · Action by action", "The same rules, shown on the real screens.")

shot_slide(
    "GUEST", "Guest — read-only + comment", "r3-guest-readonly.png",
    "Viewing as Guest, the section is read-only: a clear banner explains the seat, the 'Comment-only role' chip replaces the Edit button, and no editing or AI controls are shown. A Guest can still add comments.",
    points=[
        "Banner: 'read-only access — you can add comments but cannot edit or sign off'.",
        "No Edit Section, AI, or sign-off controls appear.",
        "Cannot see or export the audit trail (assurance-grade record).",
        "The safe seat for external stakeholders who review content only.",
    ],
    caption="Editor as Guest — read-only, comment-only",
)

shot_slide(
    "INPUT PROVIDER", "Contributors edit in tracked changes", "r4-ip-track-changes.png",
    "An Input Provider (or Owner) edits their own subsection with track changes always on: what they type is a green insertion, what they delete is struck through. Nothing is applied until an Editor accepts it.",
    points=[
        "Edits are attributed and marked, never silently applied.",
        "The Input Provider edits until they sign off (L3), which locks the subsection to them.",
        "Owners edit the same way, in track changes.",
        "They cannot accept/reject — that is the Editor's job.",
    ],
    caption="Input Provider editing in track changes",
)

shot_slide(
    "EDITOR", "Only Editors/Admins accept or reject", "r5-editor-accept-reject.png",
    "In the Editor view, every pending change is shown inline (green insertion, red deletion) with per-change Accept / Reject controls. This curation step is restricted to Editors and Admins.",
    points=[
        "Insertions and deletions are listed with who made them and why.",
        "Accept folds the change into the approved text; Reject reverts it.",
        "Input Providers and Owners never see these controls.",
        "This is the separation of duties: contributors propose, Editors dispose.",
    ],
    caption="Editor view — tracked change with Accept / Reject",
)

shot_slide(
    "COMMENT-ONLY", "A comment-only seat raises a change request", "r6-comment-request.png",
    "A read-only seat (here, Guest) cannot edit — so it raises a change request instead. The composer states 'you can't edit this subsection — raise a request and an Editor/Admin will action it', and the request is routed to the Editors.",
    points=[
        "Request kind: 'Change request (routes to Editors)'.",
        "Example: 'add the Scope 3 category breakdown required by ESRS E1-6'.",
        "The raised request shows as 'open · routed to Editors/Admins'.",
        "Nothing is lost to email — the ask lives on the section.",
    ],
    caption="Guest raising a change request that routes to Editors",
)

shot_slide(
    "EDITOR ACTIONS IT", "The Editor assigns, gets an AI draft, approves", "r7-editor-actions-request.png",
    "Switching to the Editor seat, the same request can be assigned and actioned. The AI drafts suggested wording; the Editor reviews it and approves it — which applies it as a tracked change for sign-off (or dismisses it).",
    steps=[
        "Assign the request (here, to Quinn Harper).",
        "The AI recommends wording that preserves the reported facts.",
        "Edit the suggested text if needed.",
        "'Approve & apply as tracked change' — or Dismiss.",
    ],
    caption="Editor actioning the request with an AI recommendation",
)

shot_slide(
    "AI ASSISTANCE", "AI proposes — a human always disposes", "r8-ai-assistant.png",
    "The in-document AI Assistant (available to editing seats) drafts and revises on request. Its own copy states the rule: 'Proposed edits are inserted as tracked changes for the Editor to accept.' AI never changes approved text silently.",
    points=[
        "Chat, Review (style/consistency flags) and Evidence tabs.",
        "Every AI output enters the same governed accept/reject path as human edits.",
        "Grounded in the section's attached evidence when provided.",
        "Full traceability — every AI touch is in the audit trail.",
    ],
    caption="AI Assistant — proposals arrive as tracked suggestions",
)

shot_slide(
    "ADMIN GATE", "Structure & Admin — a separate group", "r14-admin-roles.png",
    "Editing the report structure, managing the knowledge base, running AI scans, starting a new cycle and the Admin panel are gated to the structure-admin group — not the five acting roles. The Admin panel even documents the role model itself.",
    points=[
        "Only the ESG-Lead / admin group sees these controls; others get read-only.",
        "Maps to a dedicated Cognito group in the Novartis environment.",
        "Structure changes are reviewed, versioned and published — never silent.",
        "The Roles & Permissions reference lives in-app for onboarding.",
    ],
    caption="Admin panel — Roles & Permissions reference (admin-gated)",
)

# ============================================================================
# SECTION 5 — THE APPROVAL WORKFLOW
# ============================================================================
section_divider("5 · The approval workflow", "How a section actually gets approved.")

s = prs.slides.add_slide(BLANK)
title_bar(s, "APPROVAL", "Two-level sign-off — each of the 86 subsections advances on its own")
stages = [
    ("Draft", "AI first draft", RGBColor(0x63, 0x66, 0xF1)),
    ("In review", "Input Provider edits", AMBER),
    ("Input signed (L3)", "IP signs their subsection", BLUE),
    ("Owner signed (L2)", "some owners signed", PURPLE),
    ("Approved", "ALL owners signed", GREEN),
    ("Exported", "MDD Word produced", RGBColor(0x05, 0x96, 0x69)),
]
n = len(stages); gap = Inches(0.2)
bw = (SW - Inches(1.2) - gap * (n - 1)) / n
top = Inches(1.7); bh = Inches(1.15)
for i, (name, sub, col) in enumerate(stages):
    l = Inches(0.6) + (bw + gap) * i
    box(s, l, top, bw, bh, fill=col)
    tf = textbox(s, l + Inches(0.08), top + Inches(0.12), bw - Inches(0.16), bh - Inches(0.24))
    _set(tf, name, 12, WHITE, bold=True, align=PP_ALIGN.CENTER, space_after=2)
    p = tf.add_paragraph(); p.alignment = PP_ALIGN.CENTER; p.text = sub
    p.runs[0].font.size = Pt(9); p.runs[0].font.color.rgb = RGBColor(0xEE, 0xF2, 0xFB); p.runs[0].font.name = "Calibri"
    if i < n - 1:
        ar = textbox(s, l + bw - Inches(0.02), top + Inches(0.35), Inches(0.24), Inches(0.4))
        _set(ar, "→", 16, GREY, bold=True, align=PP_ALIGN.CENTER, space_after=0)

gap = Inches(0.4); cardw = (SW - Inches(1.2) - gap) / 2; ctop = Inches(3.2); ch = Inches(3.35)
cols = [
    ("L3 — subsection sign-off", BLUE, [
        "Each subsection's Input Provider drafts it and signs off (L3).",
        "Sign-off locks the subsection to them — Editors/Admins can still edit.",
        "A section's Owners can't sign until ALL its subsections are L3-signed.",
    ]),
    ("L2 — section sign-off", PURPLE, [
        "Owners review the whole section as one consolidated document.",
        "EVERY assigned owner must sign off for the section to be Approved.",
        "Legal review happens here — the legal reviewer is one of the owners.",
        "Re-editing an approved section resets it for re-approval.",
    ]),
]
for i, (h, col, body) in enumerate(cols):
    l = Inches(0.6) + (cardw + gap) * i
    box(s, l, ctop, cardw, ch, fill=WHITE, line=FAINT)
    box(s, l, ctop, cardw, Inches(0.55), fill=col)
    tf = textbox(s, l + Inches(0.2), ctop + Inches(0.09), cardw - Inches(0.4), Inches(0.45)); _set(tf, h, 14, WHITE, bold=True)
    tf = textbox(s, l + Inches(0.2), ctop + Inches(0.72), cardw - Inches(0.4), ch - Inches(0.85))
    for j, b in enumerate(body):
        para(tf, b, 12, INK, gap=8, bullet=True, first=(j == 0))

shot_slide(
    "APPROVAL · STEPPER", "The sign-off stepper on a subsection", "r9-signoff-stepper.png",
    "Every subsection shows a visual stepper: the Input Provider (L3), then one step per assigned Owner (L2). One glance shows where the section is and who it is waiting on.",
    points=[
        "Purple = current step; grey = pending; green = signed.",
        "Here: Input Provider awaiting sign-off; Owner 1 and Owner 2 (L2) pending.",
        "'Every owner must sign to approve' is stated on the panel.",
        "Timestamps and optional notes are recorded per step.",
    ],
    caption="Approval stepper — Input Provider → Owner(s)",
)

shot_slide(
    "APPROVAL · L2 GATE", "Owners sign off the whole section together", "r10-l2-owner-signoff.png",
    "At the section (L2) level the subsections are shown as one document. The gate is explicit: Input Provider sign-off 5/5, Owner sign-off 0/2 — and the section is approved 'once all 2 owners have signed off'.",
    points=[
        "Both owners are named (content owner + legal-as-owner).",
        "An owner signs with an optional note ('Sign off as …').",
        "Approval only completes when EVERY owner has signed.",
        "This is where the legal review is recorded.",
    ],
    caption="L2 consolidated view — the all-owners sign-off gate",
)

shot_slide(
    "APPROVAL · TASKS", "Every role sees only its own tasks", "r12-tasks-per-role.png",
    "The dashboard gives each person a task queue built from their permissions. The 'View tasks as' switch previews any role's queue — validated against that role, so it never offers an action the role cannot perform.",
    points=[
        "Input Provider → drafting tasks; Owner → sign-off tasks; Guest → none.",
        "Overdue-first ordering; each task names the seat-holder.",
        "Click a task to jump straight to that subsection.",
        "Live report progress by stage across all subsections.",
    ],
    caption="Dashboard — per-role open-task queue",
)

shot_slide(
    "APPROVAL · EXPORT", "Export any time — draft or final", "r11-export.png",
    "The MDD Word document (and a PDF) can be generated at any time by anyone except the read-only Guest. Before every subsection is Approved, the Word file is produced as a clearly-marked DRAFT rather than being blocked.",
    points=[
        "Word (MDD) and PDF both available any time — no approval gate.",
        "Not-yet-approved sections export as their current draft; watermarked 'draft'.",
        "The panel shows how many subsections remain unapproved, for awareness.",
        "Guests (read-only) cannot export.",
    ],
    caption="Export — Word or PDF any time; draft-watermarked until fully approved",
)

shot_slide(
    "APPROVAL · AUDIT", "An append-only record for assurance", "r13-audit.png",
    "Every edit, sign-off, comment, upload, scan, export and evidence attachment is captured with user, timestamp and before/after context — who did what, when, on which section.",
    points=[
        "Sign-offs (L3 and L2) are recorded with the signer and time.",
        "Nothing is overwritten silently — full traceability.",
        "Filterable by action and by user; exportable.",
        "Visible to all roles EXCEPT the read-only Guest; 7-year retention.",
    ],
    caption="Audit Trail — the assurance-grade record (not visible to Guests)",
)

shot_slide(
    "AUDIT · GUEST LOCKOUT", "The audit trail is closed to Guests", "r16-audit-guest-denied.png",
    "The audit trail is an assurance-grade record of every change, sign-off and export. A read-only Guest can review and comment on report content but cannot see or export the audit log — the view is replaced by a clear access notice.",
    points=[
        "Guest gets a locked panel, not the log — no view, no export.",
        "Input Provider, Owner, Editor and Admin all retain full access.",
        "Enforced from the single permission source of truth (tested).",
        "In production the role comes from the user's AD / SSO group.",
    ],
    caption="Audit Trail as Guest — access denied by role",
)

# ============================================================================
# SECTION 6 — DIRECTORY / AD INTEGRATION (synthetic-connection simulation)
# ============================================================================
section_divider("6 · How roles integrate with AD", "Capability from the directory; assignment stays in the app.")

# Concept slide: capability vs assignment + the flow
s = prs.slides.add_slide(BLANK)
title_bar(s, "DIRECTORY", "Roles from Active Directory — the model")
tf = textbox(s, Inches(0.6), Inches(1.25), SW - Inches(1.2), Inches(0.55))
_set(tf, "Sign-in federates Novartis Entra ID (Azure AD) into Amazon Cognito. Access resolves in two layers — this is the decision that keeps AD simple:", 13, INK)
# flow strip
flow = ["Novartis Entra ID", "SAML / OIDC", "Amazon Cognito", "groups claim", "Acting role"]
fx = Inches(0.6); fy = Inches(1.95); fh = Inches(0.5)
for i, step in enumerate(flow):
    fw = Inches(2.0)
    box(s, fx, fy, fw, fh, fill=LIGHT, line=FAINT)
    tf = textbox(s, fx, fy + Inches(0.07), fw, fh - Inches(0.14)); _set(tf, step, 11, NAVY, bold=True, align=PP_ALIGN.CENTER, space_after=0)
    fx += fw
    if i < len(flow) - 1:
        ar = textbox(s, fx, fy + Inches(0.05), Inches(0.35), fh); _set(ar, "→", 15, GREY, bold=True, align=PP_ALIGN.CENTER, space_after=0)
        fx += Inches(0.35)
gap = Inches(0.4); cardw = (SW - Inches(1.2) - gap) / 2; top = Inches(2.85); cardh = Inches(2.7)
adcards = [
    ("Capability — from AD group", PURPLE, [
        "Answers 'what KIND of actor are you?'",
        "One of ~5 role groups (Admins / Editors / Owners / Contributors / Reviewers) → an acting role.",
        "Managed in AD; changes rarely.",
        "AD never needs a group per section.",
    ]),
    ("Assignment — app-managed", BLUE, [
        "Answers 'WHICH section do you own?'",
        "Assigned per section/subsection in the app, keyed to the user's stable directory id (oid).",
        "Managed by the ESG Lead each cycle; no AD ticket.",
        "You get owner powers only where BOTH hold.",
    ]),
]
for i, (h, col, body) in enumerate(adcards):
    l = Inches(0.6) + (cardw + gap) * i
    box(s, l, top, cardw, cardh, fill=WHITE, line=FAINT)
    box(s, l, top, cardw, Inches(0.55), fill=col)
    tf = textbox(s, l + Inches(0.2), top + Inches(0.09), cardw - Inches(0.4), Inches(0.45)); _set(tf, h, 14, WHITE, bold=True)
    tf = textbox(s, l + Inches(0.2), top + Inches(0.7), cardw - Inches(0.4), cardh - Inches(0.85))
    for j, b in enumerate(body):
        para(tf, b, 11.5, INK, gap=6, bullet=True, first=(j == 0))
tf = textbox(s, Inches(0.6), top + cardh + Inches(0.15), SW - Inches(1.2), Inches(0.5))
_set(tf, "Built now as a synthetic-connection simulation (synthetic Entra directory + group→role resolver) so the flow is demonstrable before the real federation is wired.", 11, GREY, italic=True)

shot_slide(
    "DIRECTORY · IN-APP", "The directory integration, simulated in-app", "r17-ad-directory.png",
    "The Admin → Directory (AD/SSO) tab shows the whole flow live on synthetic data: the Entra→Cognito seam, the capability-vs-assignment split, and the AD group → role mapping Novartis would confirm with IT.",
    points=[
        "Marked 'Simulated connection' — honest about what's live.",
        "Five role groups map to the five acting roles.",
        "Per-section ownership stays app-managed (not in AD).",
        "The production swap-in is a one-file change at this seam.",
    ],
    caption="Admin → Directory (AD / SSO) — the simulation",
)

shot_slide(
    "DIRECTORY · TOKEN CLAIM", "Group → role → assignment, end to end", "r18-ad-claim.png",
    "Clicking a synthetic user shows the exact token claim Cognito would receive from Entra. The app reads 'cognito:groups' to resolve the role and 'oid' to look up that person's app-managed section assignments.",
    points=[
        "A user in two groups (Owners + Contributors) gets both capabilities.",
        "The 'oid' is the stable key section assignments hang off.",
        "Resolved assignments are shown beneath the claim.",
        "In production the claim comes from Entra; a Graph lookup powers the people-picker.",
    ],
    caption="Token claim + resolved section assignments (Sam Delgado)",
)

# ============================================================================
# SECTION 7 — BEFORE PRODUCTION
# ============================================================================
section_divider("7 · Before production", "What to confirm before this moves to the Novartis environment.")

s = prs.slides.add_slide(BLANK)
title_bar(s, "BEFORE PRODUCTION", "Two things to confirm — stated plainly")
items = [
    ("Demo auth vs. production SSO", AMBER,
     "Today one signed-in person can preview every seat via the 'View as' switch. In production the acting role comes from the user's Entra/AD group via Cognito — the flow is already prototyped in Admin → Directory (see section 6). Remaining: wire the real Entra federation + release the groups claim; then remove the 'View as' switch (or limit to admin support)."),
    ("One compliance rule still to wire", RED,
     "The design states 'Legal sign-off is blocked if any mandatory ESRS disclosure is missing without a documented justification.' That specific block on an Owner's L2 sign-off is described but not yet enforced in the UI — it is a scoped item (the Workflow service's mandatory-DR blocker). Note: export is intentionally NOT a gate — a draft-watermarked Word file can be produced any time."),
    ("Roles & assignments to confirm with Novartis", BLUE,
     "The role model is implemented and consistent; the per-section Input Provider / Owner assignments are seeded for the demo. Novartis confirms the real people per section, the owner sign-off policy (all owners vs. quorum), and which SSO groups map to Editor / Admin / structure-admin."),
]
y = Inches(1.55)
for h, col, body in items:
    ih = Inches(1.7)
    box(s, Inches(0.6), y, SW - Inches(1.2), ih, fill=LIGHT, line=FAINT)
    box(s, Inches(0.6), y, Inches(0.14), ih, fill=col)
    tf = textbox(s, Inches(0.95), y + Inches(0.14), SW - Inches(1.7), Inches(0.45)); _set(tf, h, 15, NAVY, bold=True)
    tf = textbox(s, Inches(0.95), y + Inches(0.62), SW - Inches(1.7), ih - Inches(0.72)); _set(tf, body, 12, INK)
    y += ih + Inches(0.18)

# ============================================================================
# CLOSING
# ============================================================================
s = prs.slides.add_slide(BLANK)
box(s, 0, 0, SW, SH, fill=NAVY)
box(s, 0, Inches(3.0), SW, Inches(0.06), fill=BLUE)
tf = textbox(s, Inches(0.9), Inches(1.5), SW - Inches(1.8), Inches(1.1))
_set(tf, "Governed roles. Two-level sign-off. Full audit.", 28, WHITE, bold=True)
tf = textbox(s, Inches(0.9), Inches(3.25), SW - Inches(1.8), Inches(3.0))
for j, b in enumerate([
    "Five clear roles — access is your acting role combined with your assignment on that section.",
    "Contributors edit in track changes; only Editors/Admins accept or reject; only Owners/Admins sign off.",
    "Two-level sign-off (L3 subsection → L2 section), export any time, and an assurance-grade audit trail.",
    "A short, honest list of items to confirm before the move to the Novartis environment.",
]):
    p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
    p.text = "•  " + b; p.space_after = Pt(13)
    p.runs[0].font.size = Pt(15); p.runs[0].font.color.rgb = RGBColor(0xE7, 0xED, 0xF7); p.runs[0].font.name = "Calibri"

os.makedirs(os.path.dirname(OUT), exist_ok=True)
prs.save(OUT)
print(f"Saved deck: {OUT} ({len(prs.slides.__iter__.__self__._sldIdLst)} slides)")
