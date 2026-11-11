// Word-level diff used by the roll-forward "Changes from 2025" redline.
//
// The demo has no diff dependency, so this is a compact LCS (longest common
// subsequence) over whitespace-delimited tokens. It powers the inline
// track-changes view that shows what the AI changed when it rolled a section
// forward from the FY2025 approved baseline to the FY2026 draft.
//
// Tokens keep their trailing whitespace so re-joining a run of tokens
// reproduces the original spacing. Punctuation stays attached to its word,
// which is good enough for a human-readable narrative redline (we are not
// diffing code).

export type DiffOp = 'equal' | 'add' | 'del';

export interface DiffToken {
  op: DiffOp;
  text: string; // includes any trailing whitespace
}

// Split into tokens of "word + following whitespace" so joins are lossless.
function tokenize(s: string): string[] {
  const m = s.match(/\S+\s*/g);
  return m ?? [];
}

// Compare tokens for equality ignoring trailing whitespace differences, so a
// word that only changed the spacing around it is still treated as unchanged.
function core(tok: string): string {
  return tok.trim();
}

// Classic LCS table over token cores. Inputs are short paragraphs, so the
// O(n·m) table is fine (sections are a few hundred words at most).
export function diffWords(oldText: string, newText: string): DiffToken[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const n = a.length;
  const m = b.length;

  // lcs[i][j] = LCS length of a[i:] and b[j:]
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = core(a[i]) === core(b[j])
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (core(a[i]) === core(b[j])) {
      out.push({ op: 'equal', text: b[j] });
      i++; j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ op: 'del', text: a[i] });
      i++;
    } else {
      out.push({ op: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) { out.push({ op: 'del', text: a[i] }); i++; }
  while (j < m) { out.push({ op: 'add', text: b[j] }); j++; }
  return out;
}

export interface DiffStats {
  added: number;    // tokens added
  removed: number;  // tokens removed
  changed: boolean;
}

export function diffStats(tokens: DiffToken[]): DiffStats {
  let added = 0;
  let removed = 0;
  for (const t of tokens) {
    if (t.op === 'add') added++;
    else if (t.op === 'del') removed++;
  }
  return { added, removed, changed: added > 0 || removed > 0 };
}

// Paragraph-aligned diff: split both texts on blank lines and diff each
// paragraph against its counterpart. Returns one token list per NEW-side
// paragraph (plus trailing removed paragraphs), so the redline renders in the
// same paragraph structure as the current draft.
export interface ParaDiff {
  tokens: DiffToken[];
  stats: DiffStats;
  // 'added' = paragraph is wholly new in FY2026; 'removed' = present in FY2025
  // only; 'changed' = edited; 'equal' = identical.
  kind: 'added' | 'removed' | 'changed' | 'equal';
}

function splitParas(s: string): string[] {
  return s.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
}

// Similarity of two paragraphs = shared word tokens / longer length. Used to
// PAIR paragraphs across years so a paragraph that only had a few words changed
// (e.g. the reporting year) is shown as an inline word-level redline rather than
// a whole-paragraph delete-then-insert (which reads as noise). Paragraphs below
// the threshold are treated as genuinely added/removed.
function similarity(a: string, b: string): number {
  const wa = a.toLowerCase().match(/\w+/g) ?? [];
  const wb = b.toLowerCase().match(/\w+/g) ?? [];
  if (wa.length === 0 && wb.length === 0) return 1;
  const setB = new Map<string, number>();
  for (const w of wb) setB.set(w, (setB.get(w) ?? 0) + 1);
  let shared = 0;
  for (const w of wa) {
    const c = setB.get(w);
    if (c) { shared++; setB.set(w, c - 1); }
  }
  return shared / Math.max(wa.length, wb.length);
}

const PARA_MATCH_THRESHOLD = 0.5;

// Paragraph alignment exposing the PAIRED old/new text per change, so a caller
// can resolve a roll-forward change-by-change: Accept keeps `newText` (the
// FY2026 draft), Revert restores `oldText` (the FY2025 approved paragraph).
// `newIndex` is the paragraph's position in the NEW text (for 'removed' it's the
// insertion point). Same similarity-LCS pairing as diffParagraphs.
export interface AlignedPara {
  kind: 'added' | 'removed' | 'changed' | 'equal';
  oldText: string;   // FY2025 side ('' when added)
  newText: string;   // FY2026 side ('' when removed)
  newIndex: number;  // index within the NEW paragraph list
  tokens: DiffToken[];
}

export function alignParagraphs(oldText: string, newText: string): AlignedPara[] {
  const oldParas = splitParas(oldText);
  const newParas = splitParas(newText);
  const n = oldParas.length;
  const m = newParas.length;
  const match = (i: number, j: number) => similarity(oldParas[i], newParas[j]) >= PARA_MATCH_THRESHOLD;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = match(i, j) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: AlignedPara[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (match(i, j)) {
      const tokens = diffWords(oldParas[i], newParas[j]);
      out.push({ kind: diffStats(tokens).changed ? 'changed' : 'equal', oldText: oldParas[i], newText: newParas[j], newIndex: j, tokens });
      i++; j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ kind: 'removed', oldText: oldParas[i], newText: '', newIndex: j, tokens: diffWords(oldParas[i], '') });
      i++;
    } else {
      out.push({ kind: 'added', oldText: '', newText: newParas[j], newIndex: j, tokens: diffWords('', newParas[j]) });
      j++;
    }
  }
  while (i < n) { out.push({ kind: 'removed', oldText: oldParas[i], newText: '', newIndex: m, tokens: diffWords(oldParas[i], '') }); i++; }
  while (j < m) { out.push({ kind: 'added', oldText: '', newText: newParas[j], newIndex: j, tokens: diffWords('', newParas[j]) }); j++; }
  return out;
}

export function diffParagraphs(oldText: string, newText: string): ParaDiff[] {
  const oldParas = splitParas(oldText);
  const newParas = splitParas(newText);
  const n = oldParas.length;
  const m = newParas.length;

  // Align paragraphs by a similarity-weighted LCS: two paragraphs "match" (and
  // are diffed inline) when their similarity clears the threshold. This keeps
  // near-identical paragraphs paired so only the changed words are highlighted.
  const match = (i: number, j: number) => similarity(oldParas[i], newParas[j]) >= PARA_MATCH_THRESHOLD;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = match(i, j)
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: ParaDiff[] = [];
  let i = 0;
  let j = 0;
  const pushDiff = (o: string, nw: string) => {
    const tokens = diffWords(o, nw);
    const stats = diffStats(tokens);
    out.push({ tokens, stats, kind: stats.changed ? 'changed' : 'equal' });
  };
  while (i < n && j < m) {
    if (match(i, j)) {
      pushDiff(oldParas[i], newParas[j]);
      i++; j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      const tokens = diffWords(oldParas[i], '');
      out.push({ tokens, stats: diffStats(tokens), kind: 'removed' });
      i++;
    } else {
      const tokens = diffWords('', newParas[j]);
      out.push({ tokens, stats: diffStats(tokens), kind: 'added' });
      j++;
    }
  }
  while (i < n) {
    const tokens = diffWords(oldParas[i], '');
    out.push({ tokens, stats: diffStats(tokens), kind: 'removed' });
    i++;
  }
  while (j < m) {
    const tokens = diffWords('', newParas[j]);
    out.push({ tokens, stats: diffStats(tokens), kind: 'added' });
    j++;
  }
  return out;
}
