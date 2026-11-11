// Track-changes engine (preview slice, behind the `trackChangesEngine` flag).
//
// A Word-like inline suggestion layer for the TipTap/ProseMirror editor:
//   - typing/paste wraps the new text in an `insertion` mark (shown coloured),
//   - deleting wraps the target text in a `deletion` mark (shown struck-through)
//     instead of removing it,
//   - accept/reject resolve a suggestion in place.
//
// This is intentionally self-contained (no third-party track-changes dep) so it
// is small and auditable. It does NOT change how content is persisted — the host
// component decides when to serialise the ACCEPTED text. See the plan doc.

import { Mark, mergeAttributes, type Editor } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { MarkType } from '@tiptap/pm/model';

export type SuggestionOrigin = 'human' | 'ai';

// --- Marks ------------------------------------------------------------------
// Both marks carry who made the suggestion and where it came from, so the UI can
// colour AI vs human and attribute it. `data-*` attrs round-trip through HTML.
const commonAttrs = {
  author: { default: 'You' },
  origin: { default: 'human' as SuggestionOrigin },
  at: { default: '' },
};

export const InsertionMark = Mark.create({
  name: 'insertion',
  inclusive: true,
  addAttributes() {
    return {
      author: { default: commonAttrs.author.default, parseHTML: el => el.getAttribute('data-author'), renderHTML: a => ({ 'data-author': a.author }) },
      origin: { default: commonAttrs.origin.default, parseHTML: el => el.getAttribute('data-origin'), renderHTML: a => ({ 'data-origin': a.origin }) },
      at: { default: commonAttrs.at.default, parseHTML: el => el.getAttribute('data-at'), renderHTML: a => ({ 'data-at': a.at }) },
    };
  },
  parseHTML() { return [{ tag: 'ins[data-track]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['ins', mergeAttributes(HTMLAttributes, { 'data-track': 'insertion', class: 'tc-ins' }), 0];
  },
});

export const DeletionMark = Mark.create({
  name: 'deletion',
  inclusive: true,
  addAttributes() {
    return {
      author: { default: commonAttrs.author.default, parseHTML: el => el.getAttribute('data-author'), renderHTML: a => ({ 'data-author': a.author }) },
      origin: { default: commonAttrs.origin.default, parseHTML: el => el.getAttribute('data-origin'), renderHTML: a => ({ 'data-origin': a.origin }) },
      at: { default: commonAttrs.at.default, parseHTML: el => el.getAttribute('data-at'), renderHTML: a => ({ 'data-at': a.at }) },
    };
  },
  parseHTML() { return [{ tag: 'del[data-track]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['del', mergeAttributes(HTMLAttributes, { 'data-track': 'deletion', class: 'tc-del' }), 0];
  },
});

// --- Suggesting-mode plugin -------------------------------------------------
// When suggesting mode is ON, `appendTransaction` rewrites the user's edit so:
//   - inserted text gets the `insertion` mark,
//   - a deletion is turned into a `deletion` mark on the affected text (the text
//     is NOT removed from the doc; it stays struck-through until accepted).
// Author/origin for new suggestions come from the plugin's meta (set by the
// host so the current seat's name is attributed).

export const suggestKey = new PluginKey('trackChangesSuggest');

interface SuggestState {
  enabled: boolean;
  author: string;
}

// A ProseMirror step is roughly a replace of [from,to) with some slice. We infer
// intent from the mapping: newly added text → insertion; removed range → mark as
// deletion instead of dropping it.
export function suggestingPlugin(getConfig: () => SuggestState) {
  return new Plugin({
    key: suggestKey,
    props: {
      // Deletion must be intercepted BEFORE the text is removed, so we handle
      // Backspace/Delete here: instead of deleting, mark the affected character
      // (or selection) with the `deletion` mark and move the cursor past it.
      // Text already inside an insertion mark is deleted outright (rejecting your
      // own not-yet-accepted typing), which matches Word.
      handleKeyDown(view, event) {
        const cfg = getConfig();
        if (!cfg.enabled) return false;
        if (event.key !== 'Backspace' && event.key !== 'Delete') return false;
        const { state } = view;
        const delType = state.schema.marks.deletion;
        const insType = state.schema.marks.insertion;
        if (!delType || !insType) return false;
        const { selection } = state;
        const { empty, from, to, $from } = selection;

        // STRUCTURAL edit at a block boundary — this is not a text deletion but a
        // block operation (e.g. removing a bullet: Backspace at the start of a
        // list item lifts/joins it). Character-level deletion marks can't express
        // that: they'd mark a boundary position that renders nothing, so the
        // bullet marker could never be removed until accept-all. Let ProseMirror's
        // default keymap handle these so lists/blocks behave like a normal editor.
        //   - Backspace with the cursor at the very start of its block ($from
        //     parentOffset 0), or
        //   - Delete with the cursor at the very end of its block.
        // Only for a collapsed selection; a ranged delete is always text.
        if (empty) {
          const atBlockStart = $from.parentOffset === 0;
          const atBlockEnd = $from.parentOffset === $from.parent.content.size;
          if ((event.key === 'Backspace' && atBlockStart) ||
              (event.key === 'Delete' && atBlockEnd)) {
            return false; // fall through to default structural handling
          }
        }

        let delFrom = from, delTo = to;
        if (empty) {
          // Collapsed cursor: Backspace targets the char before, Delete the char after.
          if (event.key === 'Backspace') { delFrom = Math.max(0, from - 1); delTo = from; }
          else { delFrom = from; delTo = Math.min(state.doc.content.size, from + 1); }
        }
        if (delFrom >= delTo) return true; // nothing to delete (doc edge)

        const tr = state.tr;
        // If the target is our own pending insertion, remove it outright.
        const targetNode = state.doc.nodeAt(delFrom);
        const isOwnInsertion = targetNode ? insType.isInSet(targetNode.marks) : false;
        if (isOwnInsertion) {
          tr.delete(delFrom, delTo);
        } else {
          tr.addMark(delFrom, delTo, delType.create({ author: cfg.author, origin: 'human', at: '' }));
          // Move the cursor so repeated presses extend the deletion naturally.
          const target = event.key === 'Backspace' ? delFrom : delTo;
          tr.setSelection(TextSelection.near(tr.doc.resolve(target)));
        }
        tr.setMeta(suggestKey, 'skip');
        view.dispatch(tr);
        return true;
      },
    },
    // We re-run the user's transaction as a suggestion by inspecting each step.
    appendTransaction(transactions, oldState, newState) {
      const cfg = getConfig();
      if (!cfg.enabled) return null;
      // Skip our own re-writes and non-doc-changing txns.
      if (!transactions.some(t => t.docChanged)) return null;
      if (transactions.some(t => t.getMeta(suggestKey) === 'skip')) return null;

      const insType = newState.schema.marks.insertion as MarkType | undefined;
      if (!insType) return null;

      // Collect the ranges that were inserted in this batch of transactions, by
      // mapping through each transaction's steps and reading added spans.
      const tr = newState.tr;
      let touched = false;
      const author = cfg.author;
      const at = ''; // timestamp injected by host on accept; kept empty in-doc

      transactions.forEach(t => {
        t.steps.forEach((step, i) => {
          const map = t.mapping.maps[i];
          map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
            if (newEnd > newStart) {
              const from = tr.mapping.map(newStart);
              const to = tr.mapping.map(newEnd);
              if (to <= from) return;
              // Mark only TEXT nodes in the added span as insertions. Block/atom
              // nodes (MDD tables, images) can't carry an inline mark and are
              // left as-is so inserting them doesn't error or drop them.
              newState.doc.nodesBetween(from, to, (node, pos) => {
                if (!node.isText) return true;
                const s = Math.max(from, pos);
                const e = Math.min(to, pos + node.nodeSize);
                if (e > s) { tr.addMark(s, e, insType.create({ author, origin: 'human', at })); touched = true; }
                return true;
              });
            }
          });
        });
      });

      if (!touched) return null;
      tr.setMeta(suggestKey, 'skip'); // don't recurse on our own mark-adding txn
      tr.setMeta('addToHistory', true);
      return tr;
    },
  });
}

// --- Accept / reject helpers ------------------------------------------------
// Operate on the whole doc: resolve every insertion (strip mark) / deletion
// (remove text) for "accept all", or the inverse for "reject all". Single-change
// variants take a position inside the target mark.

interface MarkRange { from: number; to: number; }

function eachMarkRange(editor: Editor, markName: string, fn: (r: MarkRange) => void) {
  const { doc, schema } = editor.state;
  const type = schema.marks[markName];
  if (!type) return;
  const ranges: MarkRange[] = [];
  let start = -1;
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const has = type.isInSet(node.marks);
    if (has && start === -1) start = pos;
    if (!has && start !== -1) { ranges.push({ from: start, to: pos }); start = -1; }
    if (has && start !== -1) { /* extend */ }
    return true;
  });
  // Flush a trailing run.
  if (start !== -1) ranges.push({ from: start, to: doc.content.size });
  // Apply from the end so positions don't shift.
  ranges.sort((a, b) => b.from - a.from).forEach(fn);
}

// After a deletion's TEXT is removed, the block that held it (e.g. a list item)
// may be left empty. Raw tr.delete on the text range leaves that empty node
// behind — so accepting the deletion of a bullet's text removes the words but
// leaves an empty bullet. This removes list items (and other non-first empty
// textblocks) that this transaction emptied, so accepting a deletion cleans up
// the structure like a normal editor would. Runs on the transaction's current
// doc; deletes from the end so earlier positions don't shift.
function removeEmptiedBlocks(tr: import('@tiptap/pm/state').Transaction) {
  const empties: { pos: number; size: number }[] = [];
  tr.doc.descendants((node, pos) => {
    // An empty list item (its paragraph has no content) — drop the whole item.
    if (node.type.name === 'listItem' && node.textContent.trim() === '' && node.childCount <= 1) {
      empties.push({ pos, size: node.nodeSize });
      return false; // don't descend into a node we're deleting
    }
    return true;
  });
  empties.sort((a, b) => b.pos - a.pos).forEach(({ pos, size }) => {
    tr.delete(pos, pos + size);
  });
}

export function acceptAll(editor: Editor) {
  editor.chain().focus().command(({ tr, state, dispatch }) => {
    const ins = state.schema.marks.insertion;
    // Accept insertions = strip the mark (keep text). Accept deletions = remove text.
    eachMarkRange(editor, 'insertion', ({ from, to }) => { if (ins) tr.removeMark(from, to, ins); });
    eachMarkRange(editor, 'deletion', ({ from, to }) => { tr.delete(tr.mapping.map(from), tr.mapping.map(to)); });
    // Clean up any list item left empty by an accepted deletion so the bullet
    // doesn't linger with no text.
    removeEmptiedBlocks(tr);
    tr.setMeta(suggestKey, 'skip');
    if (dispatch) dispatch(tr);
    return true;
  }).run();
}

export function rejectAll(editor: Editor) {
  editor.chain().focus().command(({ tr, state, dispatch }) => {
    const del = state.schema.marks.deletion;
    // Reject insertions = remove the inserted text. Reject deletions = strip the mark (keep text).
    eachMarkRange(editor, 'insertion', ({ from, to }) => { tr.delete(tr.mapping.map(from), tr.mapping.map(to)); });
    eachMarkRange(editor, 'deletion', ({ from, to }) => { if (del) tr.removeMark(tr.mapping.map(from), tr.mapping.map(to), del); });
    tr.setMeta(suggestKey, 'skip');
    if (dispatch) dispatch(tr);
    return true;
  }).run();
}

// --- Draft persistence (open suggestions survive reload) --------------------
// The persisted section CONTENT string stays the accepted-text source of truth
// (revert-safe). Open suggestions live in a SEPARATE side-channel: the editor's
// HTML (with <ins>/<del> marks) keyed by section id. On reopen we hydrate from
// it; on Save (accept-all) or Reset Demo it is cleared. If it's ever absent or
// unparseable we fall back to the accepted content — so a stale/legacy blob can
// never corrupt a section (same discipline as the schema-version guard).
const DRAFT_KEY = 'editor-tc-drafts:v4';

type DraftMap = Record<string, string>; // sectionId -> HTML with marks

function loadDraftMap(): DraftMap {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed as DraftMap : {};
  } catch { return {}; }
}

// Editor HTML for a section's in-progress suggestions, or null if none saved.
export function loadTrackedDraft(sectionId: string): string | null {
  const html = loadDraftMap()[sectionId];
  return typeof html === 'string' && html.length > 0 ? html : null;
}

// Persist the editor HTML for a section (only meaningful when it has open marks;
// callers pass '' / call clearTrackedDraft when there are none).
export function saveTrackedDraft(sectionId: string, html: string): void {
  try {
    const map = loadDraftMap();
    map[sectionId] = html;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(map));
  } catch { /* storage unavailable — ignore */ }
}

export function clearTrackedDraft(sectionId: string): void {
  try {
    const map = loadDraftMap();
    if (sectionId in map) { delete map[sectionId]; localStorage.setItem(DRAFT_KEY, JSON.stringify(map)); }
  } catch { /* ignore */ }
}

// Clear ALL saved suggestion drafts (used by Reset Demo).
export function clearAllTrackedDrafts(): void {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

// Whether an HTML string still contains open suggestion marks — used to decide
// whether to keep or clear the side-channel after an edit.
export function htmlHasSuggestions(html: string): boolean {
  return /data-track=/.test(html);
}

// --- Per-change enumeration + resolve --------------------------------------
// One open suggestion = a contiguous run of insertion or deletion text.
export interface Suggestion {
  kind: 'insertion' | 'deletion';
  from: number;
  to: number;
  text: string;
  author: string;
  origin: SuggestionOrigin;
}

// List all open suggestions in document order (so the review list reads top to
// bottom). Author/origin are read from the mark on the run's first text node.
export function listSuggestions(editor: Editor): Suggestion[] {
  const { doc, schema } = editor.state;
  const out: Suggestion[] = [];
  (['insertion', 'deletion'] as const).forEach(kind => {
    const type = schema.marks[kind];
    if (!type) return;
    let start = -1;
    let text = '';
    let attrs: { author: string; origin: SuggestionOrigin } = { author: 'You', origin: 'human' };
    const flush = (end: number) => {
      if (start !== -1) { out.push({ kind, from: start, to: end, text, author: attrs.author, origin: attrs.origin }); start = -1; text = ''; }
    };
    doc.descendants((node, pos) => {
      if (!node.isText) { flush(pos); return; }
      const mark = type.isInSet(node.marks);
      if (mark) {
        if (start === -1) { start = pos; attrs = { author: (mark.attrs.author as string) || 'You', origin: (mark.attrs.origin as SuggestionOrigin) || 'human' }; }
        text += node.text ?? '';
      } else {
        flush(pos);
      }
      return true;
    });
    flush(doc.content.size);
  });
  return out.sort((a, b) => a.from - b.from);
}

// Accept/reject a SINGLE suggestion at a known range. Accept insertion = strip
// mark (keep text); accept deletion = remove text. Reject is the inverse.
export function resolveOne(editor: Editor, s: Suggestion, action: 'accept' | 'reject') {
  editor.chain().focus().command(({ tr, state, dispatch }) => {
    const type = state.schema.marks[s.kind];
    if (!type) return false;
    const remove = (s.kind === 'insertion') === (action === 'reject'); // ins+reject or del+accept → delete text
    if (remove) {
      tr.delete(s.from, s.to);
      // If removing this text emptied its list item, drop the empty bullet too.
      removeEmptiedBlocks(tr);
    } else {
      tr.removeMark(s.from, s.to, type);
    }
    tr.setMeta(suggestKey, 'skip');
    if (dispatch) dispatch(tr);
    return true;
  }).run();
}

// Insert AI-proposed text as an AI-origin insertion suggestion. If there's a
// non-empty selection, the selected text is marked as a deletion and the new
// text inserted after it (a "rephrase this" as a tracked replace); otherwise the
// text is inserted as a new paragraph at the end. Bypasses the human suggesting
// plugin (meta 'skip') and applies the marks directly with origin:'ai'.
export function insertAiSuggestion(editor: Editor, text: string, author = 'AI Assistant') {
  editor.chain().focus().command(({ tr, state, dispatch }) => {
    const insType = state.schema.marks.insertion;
    const delType = state.schema.marks.deletion;
    if (!insType) return false;
    const { from, to, empty } = state.selection;
    const insMark = insType.create({ author, origin: 'ai', at: '' });

    if (!empty && delType) {
      // Rephrase: mark the selection deleted, then insert the AI text (as an
      // insertion) right after it.
      tr.addMark(from, to, delType.create({ author, origin: 'ai', at: '' }));
      tr.insertText(` ${text}`, to);
      tr.addMark(to, to + text.length + 1, insMark);
    } else {
      // Append as a new paragraph carrying the insertion mark.
      const end = state.doc.content.size;
      tr.insertText(`\n\n${text}`, end);
      // Mark just the inserted text (skip the two newline chars).
      tr.addMark(end + 2, end + 2 + text.length, insMark);
    }
    tr.setMeta(suggestKey, 'skip');
    if (dispatch) dispatch(tr);
    return true;
  }).run();
}

// Count open suggestions (insertion or deletion runs) for the UI badge.
export function countSuggestions(editor: Editor): number {
  let n = 0;
  eachMarkRange(editor, 'insertion', () => { n++; });
  eachMarkRange(editor, 'deletion', () => { n++; });
  return n;
}
