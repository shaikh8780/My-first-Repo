// ---------------------------------------------------------------------------
// Single source of truth for a subsection's workflow status.
//
// The workflow (Adrian 2026-08-31): Input Providers edit content, which marks a
// subsection "edited". The Editor advances it to "updated" once all comments
// are addressed. Owners then sign off at L2; a section is fully approved when
// every NON-legal owner has signed AND at least one Legal owner has signed (if
// any legal owner is assigned) — a single legal sign-off suffices.
//
// `deriveStatus` reconciles all signals into ONE status so every surface agrees.
// Order of the chain: Draft → In review → Edited → Updated →
// Owner signed (L2, partial) → Approved (L2, complete) → Exported.
// ---------------------------------------------------------------------------

import type { ReportSection, SectionProgressMap } from './reportSections';
import { allRequiredOwnersSigned } from './reportSections';
import type { L2SignOffState } from '../components/editor/ConsolidatedSectionView';
import { api } from '../api';

export type DerivedStatusKey =
  | 'draft'
  | 'in_review'
  | 'edited'         // an input provider edited; awaiting Editor to finalise
  | 'updated'        // Editor confirmed all comments addressed; ready for owners
  | 'owner_signed'   // some (not all) required owners have signed at L2
  | 'approved'       // all required owners signed (incl. one legal sign-off)
  | 'exported';

export interface DerivedStatus {
  key: DerivedStatusKey;
  label: string;
  short: string;   // compact label for tight spots (sidebar tooltip, chips)
  color: string;
  isApproved: boolean; // counts as done for the export gate + completion %
}

// Display metadata + linear ordering (index = progress). Colors align with the
// existing palette: L2 (Owner/Legal) uses the purple accent seen elsewhere.
const META: Record<DerivedStatusKey, Omit<DerivedStatus, 'key'> & { order: number }> = {
  draft:        { order: 0, label: 'Draft',                            short: 'Draft',           color: '#6366f1', isApproved: false },
  in_review:    { order: 1, label: 'In review',                        short: 'In review',       color: '#f59e0b', isApproved: false },
  edited:       { order: 2, label: 'Edited — awaiting Editor',         short: 'Edited',          color: '#3b82f6', isApproved: false },
  updated:      { order: 3, label: 'Updated — ready for Owners',       short: 'Updated',         color: '#0ea5e9', isApproved: false },
  owner_signed: { order: 4, label: 'Owner signed — awaiting others',   short: 'Owner signed',    color: '#8b5cf6', isApproved: false },
  approved:     { order: 5, label: 'Approved',                         short: 'Approved',        color: '#16a34a', isApproved: true },
  exported:     { order: 6, label: 'Exported',                         short: 'Exported',        color: '#059669', isApproved: true },
};

export const STATUS_ORDER: DerivedStatusKey[] = (Object.keys(META) as DerivedStatusKey[])
  .sort((a, b) => META[a].order - META[b].order);

function make(key: DerivedStatusKey): DerivedStatus {
  const { label, short, color, isApproved } = META[key];
  return { key, label, short, color, isApproved };
}

export function l2StatusKey(topicL1: string, topicL2: string): string {
  return `${topicL1}||${topicL2}`;
}

// Derive the authoritative status for one subsection from the live signals.
// `progress` maps section id → 'edited' | 'updated' (pre-sign-off editing phase,
// Adrian 2026-08-31). `l2SignOffs` holds the Owner sign-offs at L2.
export function deriveStatus(
  section: ReportSection,
  progress: SectionProgressMap,
  l2SignOffs: Record<string, L2SignOffState>,
): DerivedStatus {
  if (section.stage === 'exported') return make('exported');

  const l2 = section.topicL2 ? l2SignOffs[l2StatusKey(section.topicL1, section.topicL2)] : undefined;

  // L2 approval requires every REQUIRED owner to have signed (Adrian 2026-08-31):
  // all non-legal owners + at least one legal owner (if any legal owner exists).
  // Null-safe: a stale cache may lack roles/owners — treat as no owners rather
  // than crashing the Dashboard rollup (defense-in-depth with the schema key).
  const owners = section.roles?.owners ?? [];
  const signedOwners = owners.filter(o => l2 && l2[o]);
  const allOwnersSigned = section.roles
    ? allRequiredOwnersSigned(section.roles, o => !!(l2 && l2[o]))
    : false;

  // Fully approved: all required owners signed, or a legacy seed already approved.
  if (allOwnersSigned || section.stage === 'approved') return make('approved');
  // Some (but not all) owners have signed at L2.
  if (signedOwners.length > 0) return make('owner_signed');
  // Pre-sign-off editing phase: Editor has confirmed the section is updated.
  const prog = progress[section.id];
  if (prog === 'updated') return make('updated');
  if (prog === 'edited') return make('edited');
  // No progress recorded yet — fall back to the baseline review stage.
  if (section.stage === 'draft') return make('draft');
  return make('in_review');
}

// --- Live rollup for the Dashboard -----------------------------------------
// The editor persists its working state via the data-access layer (api.report.*).
// The Dashboard reads the SAME channels so its progress bar reflects real
// sign-offs (IP L3 → Owner/Legal L2) rather than the static seed. The api layer
// owns the storage keys, seeds and shape-validation, so this module no longer
// reads localStorage directly — it just derives status from whatever the ports
// return (byte-identical under the LocalAdapter; a real backend under RestAdapter).
export interface LiveWorkflowRollup {
  statuses: DerivedStatus[];               // one per subsection, in section order
  byKey: Record<DerivedStatusKey, number>; // count per status
  total: number;
  completionPercent: number;               // % approved or exported
}

// Read the editor's live state (or the seed baseline if nothing persisted yet)
// and derive a status rollup for every subsection.
export async function loadLiveWorkflowRollup(): Promise<LiveWorkflowRollup> {
  const [sections, progress, l2SignOffs] = await Promise.all([
    api.report.sections.get(),
    api.report.sectionProgress.get(),
    api.report.l2Signoff.get(),
  ]);

  const statuses = sections.map(s => deriveStatus(s, progress, l2SignOffs));
  const byKey = STATUS_ORDER.reduce((acc, k) => { acc[k] = 0; return acc; }, {} as Record<DerivedStatusKey, number>);
  for (const st of statuses) byKey[st.key] += 1;

  const total = statuses.length;
  const done = statuses.filter(s => s.isApproved).length;
  return {
    statuses,
    byKey,
    total,
    completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}
