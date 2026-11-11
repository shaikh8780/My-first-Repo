# Production Track-Changes Engine — Implementation Plan

**Date:** 2026-07-15
**Scope:** 15-Jul call asks #1 (change-by-change AI acceptance), #2 (live track
changes in a single unified editor, like Word), #3 (AI chat refinement → tracked
changes). Anchor decision: build a **real ProseMirror inline-suggestion layer**,
not the pragmatic live-diff — this editor is moving from prototype to the
deployed customer solution.

**Author:** AWS.

---

## 0. TL;DR

Add a ProseMirror **suggestion-marks** layer to the existing TipTap editor so
insertions and deletions are stored as marks in the document and accepted/
rejected in place — one unified editing view with track-changes always on, like
Word. AI edits (roll-forward draft + chat refinements) become the *same* kind of
suggestion marks, which makes #1 and #3 fall out of #2.

**The whole thing ships behind a feature flag (`trackChangesEngine`), OFF by
default, with a one-line runtime kill-switch.** Nothing about the current editor
changes until the flag is turned on. That is the revert guarantee (§6).

---

## 1. Current architecture (what we're building on)

| Piece | Today | File |
|---|---|---|
| Editor | TipTap + starter-kit, behind `isEnabled('richTextEditor')` | `RichContentEditor.tsx` |
| Content model | plain **string** (markdown-ish); HTML only inside the editor | `richTextSerializer.ts` (`contentToHtml`/`htmlToContent`) |
| Tracked changes | **separate** `TrackedChange[]` list; per-change accept/reject | `editorChanges.ts`, `ChangeTracker.tsx` |
| "Track changes" view | **diff** of baseline vs working strings, rendered as redline | `RollForwardCompare.tsx` (`WorkingRedline`), `utils/wordDiff.ts` |
| AI draft acceptance | **all-at-once** (`acceptAiBaseline`) | `EditorView.tsx` |
| View split | "Editor view" (redline, read-only) + "Clean view" (edit) | `DraftViewToggle`, `EditorView.tsx` |
| Feature flags | env default + localStorage runtime override | `config/featureFlags.ts` |

**Key insight:** content is a string and changes are a side list. The new engine
introduces a *document-embedded* representation of changes (marks). We keep the
string as the persisted source of truth and derive marks — so the data model on
disk does not change (critical for revert; see §6).

---

## 2. Target behaviour (from the call)

1. **#2 Single unified view, track-changes always on.** Type in one editor;
   deletions render struck-through, insertions in a distinct colour, live as you
   type. No more Editor-view/Clean-view switch. Clean view becomes an optional
   read-only preview of the accepted state.
2. **#1 Change-by-change acceptance.** Each insertion/deletion (human OR AI) is
   individually Accept/Reject, plus "Accept all" / "Reject all". The AI
   roll-forward draft arrives as suggestions to walk through — not one button.
3. **#3 AI chat refinement.** From the editor, ask the AI to revise ("keep the
   2nd paragraph", "rephrase this", "add detail on X"); its edits come back as
   suggestion marks to accept/reject. Also fixes the "AI deleted a paragraph,
   how do I restore it" gap (ask AI to keep it, or reject the deletion).

---

## 3. Technical approach

### 3.1 Suggestion marks (the core)
Add two ProseMirror marks via a TipTap extension:
- `insertion` — text added but not yet accepted (author + timestamp + origin
  human|ai attrs).
- `deletion` — text marked for removal but still shown struck-through until
  accepted.

A ProseMirror **plugin with `appendTransaction`** intercepts edits while
"suggesting mode" is on:
- Typing/paste → wrap new text in an `insertion` mark instead of inserting plain.
- Delete/backspace → instead of removing, wrap the target in a `deletion` mark
  (don't delete from the doc yet).
- Accept insertion = strip the mark (text stays). Reject insertion = delete the
  text. Accept deletion = delete the text. Reject deletion = strip the mark.

This is the standard ProseMirror track-changes pattern. We write it ourselves
(small, auditable) rather than pull a heavy third-party dep, unless we find a
well-maintained MIT lib that fits (evaluate `prosemirror-changeset` /
`@tiptap-pro` — note Pro is paid; likely self-author).

### 3.2 Attribution + roles
Marks carry `author` and `origin` (human/ai). Accept/reject stays gated by the
existing permission model (`canReviewChanges` → Editors/Admins), so the role
rules from Wave 2 are unchanged. Owners/IPs create suggestions; Editors curate.

### 3.3 Persisted model — UNCHANGED on disk
The section `content` string stays the source of truth (accepted text). Open
suggestions persist in the existing `TrackedChange[]` store, extended with the
data needed to re-hydrate marks (position/anchor + text). On load we map
`TrackedChange[]` → marks in the doc; on accept/reject we update BOTH the doc and
the string. **No schema bump to the content string** → an old build still reads
today's data. (Suggestion overlays simply aren't shown by the old build.)

### 3.4 AI flows on top
- **#1:** convert the roll-forward diff (`diffParagraphs`) into `insertion`/
  `deletion` marks (origin=ai) instead of a single `acceptAiBaseline`. Reuse the
  same accept/reject UI. Keep an "Accept all remaining" button.
- **#3:** the Wave 3 AI chat already emits `TrackedChange`s; point its output at
  the mark layer so chat edits appear inline as AI suggestions.

### 3.5 Serializer + export
`richTextSerializer` must ignore suggestion marks when producing the persisted
string (persist the *accepted* state), and `exportDocx` must resolve to accepted
text (optionally: emit real Word tracked-changes later — out of scope for v1).
Footnotes/tables/images must round-trip unchanged — explicit regression tests.

---

## 4. Work breakdown (incremental, each independently shippable behind the flag)

- **B1 — Flag + scaffolding.** Add `trackChangesEngine` flag (OFF). New
  `SuggestingEditor` component parallel to `RichContentEditor`; render it only
  when the flag is on. No behaviour change yet. *Ship.*
- **B2 — Marks + plugin.** insertion/deletion marks, suggesting-mode plugin,
  CSS. Typing produces marks. *Ship (flag still off in prod).*
- **B3 — Accept/reject UI in place.** Inline controls + Accept-all/Reject-all,
  wired to the permission gate. *Ship.*
- **B4 — Persistence bridge.** `TrackedChange[]` ↔ marks hydrate/dehydrate;
  string stays source of truth. Round-trip tests. *Ship.*
- **B5 — Unify the view.** Behind the flag, collapse Editor/Clean toggle to the
  single suggesting editor; Clean = read-only preview. *Ship.*
- **B6 — AI #1.** Roll-forward draft → AI suggestion marks; change-by-change +
  Accept-all. *Ship.*
- **B7 — AI #3.** Editor AI chat → suggestion marks. *Ship.*
- **B8 — Serializer/export/footnotes/tables/images regression hardening.**
- **B9 — Flip the flag ON in prod** once B1–B8 are green and demo-verified.

Each B-step: tsc + build green, full Playwright suite green, deploy, live-verify.
The flag stays OFF in prod through B1–B8, so production keeps the current editor
the entire time.

---

## 5. Testing

- New `e2e/track-changes.spec.ts`: type → insertion mark; delete → deletion
  mark; accept one; reject one; accept-all; AI draft walk-through; AI chat edit
  as suggestion; **round-trip** (edit → save → reload → accepted string correct);
  footnote/table/image survive a suggesting-mode edit.
- Every existing test must stay green with the flag OFF (proves no regression on
  the shipped path) AND a flag-ON variant for the new spec.
- Manual demo-script pass before B9.

---

## 6. REVERT / ROLLBACK STRATEGY  ← the safety guarantee

Three independent layers, smallest blast radius first:

1. **Runtime kill-switch (instant, no deploy).** The engine is gated by
   `isEnabled('trackChangesEngine')`. In any browser:
   `localStorage.setItem('ff:trackChangesEngine','false')` → back to the current
   editor immediately. During the demo this is a single console line.
2. **Env default (one config line + redeploy).** The prod build ships with the
   flag **OFF by default** (`VITE_FF_TRACK_CHANGES !== 'true'`). Turning it on is
   a deliberate flip at B9. If B9 misbehaves, flip the env back and redeploy —
   the current editor returns with no code revert.
3. **Git revert (clean).** All work lands as discrete commits on
   `report-scoped-views` (and in CR-288862624). Because the persisted **content
   string model is unchanged** (§3.3), reverting the commits cannot corrupt saved
   data — an old build just ignores any open suggestion marks. `git revert
   <range>` + redeploy fully removes the engine.

**Data-safety invariant:** the on-disk content string is always the *accepted*
text and never depends on the new marks. So no matter which layer we roll back
to, existing reports remain readable and correct. (This is the same discipline
that the schema-version guard enforces elsewhere — see the blank-screen
post-mortem in deploy-status memory: when a persisted shape changes, bump the
version. This plan avoids a shape change entirely.)

**Pre-flight for B9 (flag-on):** snapshot the current live bundle name before
deploy so we can confirm exactly what to roll back to; hard-verify the flag-off
path still works in the same build (both editors compiled in).

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| ProseMirror plugin regresses typing/tables/images/footnotes | Flag OFF until B8; dedicated round-trip + element-survival tests; incremental ship |
| Position mapping drift (marks vs string offsets) | Anchor marks to ProseMirror positions, re-derive on transaction; never store raw string offsets long-term |
| DOCX export diverges from accepted text | Serializer strips suggestion marks → accepted string is the single source for export; export tests |
| Scope creep into "real Word tracked-changes in .docx" | Out of scope for v1 (accepted-state export only); note as future |
| Adrian OOO — can't confirm edge cases | Build to the call notes; keep flag off; demo when Thevi/Adrian back |

---

## 8. Open questions (need Adrian, non-blocking for B1–B5)
- #7 approval gate: "either owner can approve" vs the current all-must-sign —
  **kept all-must-sign; confirm before changing.**
- Should the DOCX export eventually carry real Word tracked-changes, or always
  export the accepted state? (v1 = accepted state.)
- Do Input Providers' suggestions need a separate visual lane from AI
  suggestions in the same doc? (Assume: colour by origin.)
