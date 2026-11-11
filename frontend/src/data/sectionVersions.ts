// Per-subsection version history.
//
// When an already-Approved subsection is re-opened for editing, its approved
// content and the sign-offs that approved it are frozen into an immutable
// version before the edit proceeds. This preserves the audit trail (who signed
// off on exactly what text) and lets a reviewer see / restore any prior version.
// The section itself is reset to Draft so it must be re-approved (SME → Legal).

import type { ReportSection } from './reportSections';
import type { ApprovalRecord } from './editorApprovals';

export interface SectionVersion {
  id: number;                  // per-section, 1-based
  sectionId: string;
  label: string;               // e.g. "v1 — Approved 2026-05-12"
  content: string;             // frozen content at snapshot time
  wordCount: number;
  stageAtSnapshot: string;     // the stage the section was in when frozen (usually 'approved')
  approvals: ApprovalRecord[]; // the sign-off records that approved this version
  snapshotBy: string;          // who triggered the snapshot
  snapshotAt: string;          // ISO
  trigger: VersionTrigger;     // what created this version
  note?: string;               // save reason / sign-off note that produced it
}

// What caused a version to be frozen. Versions are now captured at every
// meaningful state transition (a saved edit, each sign-off) — not only when an
// approved subsection is re-opened — so the history is a full audit timeline.
export type VersionTrigger =
  | 'edit'          // a save-with-reason in the editor
  | 'ip_signoff'    // (legacy value) Editor marked the subsection "updated"
  | 'owner_signoff' // Owner signed off the section (L2)
  | 'legal_signoff' // Legal signed off the section (L2) — fully approved
  | 'reopen';       // an approved subsection was re-opened for editing

export const VERSION_TRIGGER_LABEL: Record<VersionTrigger, string> = {
  edit: 'Edited',
  ip_signoff: 'Marked updated',
  owner_signoff: 'Owner sign-off',
  legal_signoff: 'Legal sign-off (approved)',
  reopen: 'Re-opened for editing',
};

// v4: aligned with EditorView SCHEMA_VERSION after the Wave 2 roles reshape —
// version snapshots embed section objects, so a v3 snapshot carries the old
// roles shape. Abandon v3 snapshots rather than rehydrate a crashing shape.
const SCHEMA = 'v4';
// Live persistence key, owned by the data-access layer (api.report.versions via
// LocalAdapter). Exported so the adapter and any migration code share one source
// of truth for the key. This module keeps only types + pure snapshot helpers.
export const SECTION_VERSIONS_KEY = `editor-section-versions:${SCHEMA}`;

// Build an immutable snapshot of a section's current state. Called at every
// meaningful transition (save, each sign-off, re-open). `nowIso` is passed in so
// callers control the timestamp (kept deterministic in tests).
export function makeVersion(
  section: ReportSection,
  opts: {
    approvals: ApprovalRecord[];
    existing: SectionVersion[];
    snapshotBy: string;
    nowIso: string;
    trigger: VersionTrigger;
    note?: string;
    contentOverride?: string; // freeze this content instead of section.content
  },
): SectionVersion {
  const { approvals, existing, snapshotBy, nowIso, trigger, note, contentOverride } = opts;
  const nextId = existing.filter(v => v.sectionId === section.id).length + 1;
  const content = contentOverride ?? section.content;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return {
    id: nextId,
    sectionId: section.id,
    label: `v${nextId} — ${VERSION_TRIGGER_LABEL[trigger]} · ${nowIso.slice(0, 10)}`,
    content,
    wordCount: words,
    stageAtSnapshot: section.stage,
    approvals: approvals.filter(a => a.sectionId === section.id).map(a => ({ ...a })),
    snapshotBy,
    snapshotAt: nowIso,
    trigger,
    note,
  };
}

// Backward-compatible wrapper for the re-open flow.
export function snapshotVersion(
  section: ReportSection,
  approvals: ApprovalRecord[],
  existing: SectionVersion[],
  snapshotBy: string,
  nowIso: string,
): SectionVersion {
  return makeVersion(section, { approvals, existing, snapshotBy, nowIso, trigger: 'reopen' });
}

export function versionsForSection(all: SectionVersion[], sectionId: string): SectionVersion[] {
  return all.filter(v => v.sectionId === sectionId);
}
