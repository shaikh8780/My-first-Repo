// Shared model + store for the report section structure.
//
// The Section Structure admin page edits a DRAFT structure (a flat, ordered list
// of rows carrying L1/L2/L3). When the admin publishes, the draft is written to a
// PUBLISHED channel. The Report Editor watches that channel and, when it differs
// from what the editor last applied, shows a review banner so the editor user can
// see the diff and apply it (new sections come in as draft/new-rollforward; edits
// to existing sections' content are preserved).
//
// Everything is localStorage-backed so the demo works without a backend, and the
// keys are versioned to match EditorView's SCHEMA_VERSION.

import { reportSections } from './reportSections';
import type { ContentFormat, ReportSection, SubsectionRoles } from './reportSections';

export interface StructRow {
  id: string;          // stable id; = slug of ref, or sub-new-* for added rows
  ref: string;         // reference number (e.g. "7.1.1"); "*" suffix for new rows
  topicL1: string;
  topicL2?: string;
  topicL3?: string;
  contentFormat: ContentFormat;
}

const SCHEMA = 'v3';
export const DRAFT_KEY = `structure-draft:${SCHEMA}`;
export const PUBLISHED_KEY = `structure-published:${SCHEMA}`;
export const APPLIED_KEY = `structure-applied:${SCHEMA}`;
export const VERSIONS_KEY = `structure-versions:${SCHEMA}`;
// History of every publish (a permanent, rollback-able record — distinct from
// VERSIONS_KEY, which snapshots the local draft on "Commit version").
export const PUBLISHED_VERSIONS_KEY = `structure-published-versions:${SCHEMA}`;

export interface PublishedStructure {
  rows: StructRow[];
  publishedBy: string;
  publishedAt: string;   // ISO; passed in (no Date.now in shared code paths that matter)
  note?: string;
}

// A permanent, immutable record of one publish — appended to the published-version
// history so an admin can see who changed what and roll back to any prior publish.
export interface PublishedVersion {
  id: number;
  label: string;           // e.g. "Publish v3"
  publishedBy: string;
  publishedAt: string;     // ISO
  rows: StructRow[];       // the full structure as published
  summary: string;         // human-readable change summary vs the prior publish
  note?: string;           // optional admin note captured at confirm time
}

export interface StructVersion {
  id: number;
  label: string;
  timestamp: string;
  rows: StructRow[];
}

// The canonical baseline: the report structure as defined in code.
export function baselineRows(): StructRow[] {
  return reportSections.map(s => ({
    id: s.id,
    ref: s.ref,
    topicL1: s.topicL1,
    topicL2: s.topicL2,
    topicL3: s.topicL3,
    contentFormat: s.contentFormat,
  }));
}

// NOTE: persistence for the structure channel now lives in the data-access layer
// (api.structure.*, backed by LocalAdapter/RestAdapter). This module keeps the
// key constants (above — the single source of truth the LocalAdapter reads), the
// types, and the pure diff/apply helpers below. The load*/save* wrappers were
// removed when call sites moved to the api layer.

// Most-specific display title for a row.
export const rowTitle = (r: StructRow): string => r.topicL3 || r.topicL2 || r.topicL1;

// ---- Diff between an applied structure and a newly published one ------------
export interface StructDiff {
  added: StructRow[];
  removed: StructRow[];
  renamed: { row: StructRow; from: string; to: string }[];
  moved: StructRow[];
  reformatted: { row: StructRow; from: string; to: string }[];
  total: number;
}

export function diffStructures(prev: StructRow[], next: StructRow[]): StructDiff {
  const prevById = new Map(prev.map(r => [r.id, r]));
  const nextById = new Map(next.map(r => [r.id, r]));

  const added = next.filter(r => !prevById.has(r.id));
  const removed = prev.filter(r => !nextById.has(r.id));

  const renamed: StructDiff['renamed'] = [];
  const reformatted: StructDiff['reformatted'] = [];
  for (const r of next) {
    const p = prevById.get(r.id);
    if (!p) continue;
    if (rowTitle(p) !== rowTitle(r)) renamed.push({ row: r, from: rowTitle(p), to: rowTitle(r) });
    if (p.contentFormat !== r.contentFormat) reformatted.push({ row: r, from: p.contentFormat, to: r.contentFormat });
  }

  // Moved: same id present in both, but relative order changed. Compare the
  // sequence of common ids in each list.
  const commonPrev = prev.filter(r => nextById.has(r.id)).map(r => r.id);
  const commonNext = next.filter(r => prevById.has(r.id)).map(r => r.id);
  const moved: StructRow[] = [];
  for (let i = 0; i < commonNext.length; i++) {
    if (commonNext[i] !== commonPrev[i]) {
      const r = nextById.get(commonNext[i]);
      if (r) moved.push(r);
    }
  }

  return {
    added, removed, renamed, moved, reformatted,
    total: added.length + removed.length + renamed.length + moved.length + reformatted.length,
  };
}

// Compact one-line change summary, e.g. "+2 added · 3 moved · 1 renamed".
export function summarizeDiff(d: StructDiff): string {
  const parts = [
    d.added.length ? `+${d.added.length} added` : null,
    d.removed.length ? `${d.removed.length} removed` : null,
    d.moved.length ? `${d.moved.length} moved` : null,
    d.renamed.length ? `${d.renamed.length} renamed` : null,
    d.reformatted.length ? `${d.reformatted.length} reformatted` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'No changes';
}

// Apply a published structure to the editor's current sections. Existing sections
// keep ALL their content/workflow/roll-forward state (only title/level/format/
// order follow the structure); rows removed in the structure are dropped; new
// rows become fresh 'draft' sections flagged 'new' for year-on-year review. The
// result is returned in the published order. `nowIso` is passed in so this stays
// deterministic and avoids Date.now in shared code.
export function applyStructureToSections(
  published: StructRow[],
  current: ReportSection[],
  nowIso: string,
): ReportSection[] {
  const byId = new Map(current.map(s => [s.id, s]));

  return published.map(row => {
    const existing = byId.get(row.id);
    const title = rowTitle(row);
    if (existing) {
      // Preserve content + state; adopt structural fields (title/levels/format/order).
      return {
        ...existing,
        ref: row.ref,
        number: row.ref,
        title,
        topicL1: row.topicL1,
        topicL2: row.topicL2,
        topicL3: row.topicL3,
        contentFormat: row.contentFormat,
      };
    }
    // New section from the structure edit.
    const roles: SubsectionRoles = {
      inputProviders: ['Unassigned'],
      owners: ['Unassigned'],
      legalOwners: [],
    };
    return {
      id: row.id,
      number: row.ref,
      ref: row.ref,
      title,
      topicL1: row.topicL1,
      topicL2: row.topicL2,
      topicL3: row.topicL3,
      contentFormat: row.contentFormat,
      parentId: undefined,
      stage: 'draft',
      assignee: 'Unassigned',
      roles,
      wordCount: 0,
      citations: [],
      content: `Draft narrative for "${title}". This subsection was added via a structure change and is awaiting an assigned Input Provider.`,
      lastModified: nowIso,
      drsCovered: [],
      rollForwardStatus: 'new',
      rollForwardNote: 'Added via a structure change — assign roles and draft content.',
    } satisfies ReportSection;
  });
}
