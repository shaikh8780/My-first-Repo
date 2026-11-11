export type ChangeType = 'insertion' | 'deletion' | 'modification';
export type ChangeStatus = 'pending' | 'accepted' | 'rejected';
// D — origin distinguishes AI-drafted suggestions from human edits so AI text
// is always visually distinguishable and can be Accepted/Rejected by the Owner.
export type ChangeOrigin = 'human' | 'ai';

export interface TrackedChange {
  id: string;
  sectionId: string;
  author: string;
  timestamp: string;
  type: ChangeType;
  originalText: string;
  newText: string;
  paragraphIndex: number;
  reason: string;
  status: ChangeStatus;
  origin?: ChangeOrigin;   // defaults to 'human' when absent
  drRef?: string;          // D — datapoint the AI draft addresses, e.g. "E1-4"
}

// Reconstruct the clean / approved baseline of a section by undoing every
// PENDING change from its current (working) content. Accepted changes are left
// in place (they are part of the approved text); rejected changes are already
// reverted in the content. This lets the Clean view show only approved text and
// the Editor view redline the pending edits against it, without a separate
// stored baseline — the tracked-change list is the single source of truth.
//
// Modifications only revert when the current paragraph still matches the
// change's newText, so an inconsistent/illustrative seed can never corrupt the
// baseline. Insertions/deletions are undone from the highest paragraph index
// down so earlier indices don't shift under us.
export function revertPendingChanges(content: string, pending: TrackedChange[]): string {
  if (pending.length === 0) return content;
  const paras = content.split('\n\n');
  const ordered = [...pending].sort((a, b) => b.paragraphIndex - a.paragraphIndex);
  for (const c of ordered) {
    if (c.type === 'insertion') {
      // Remove the inserted paragraph (only if it is actually there).
      if (paras[c.paragraphIndex] === c.newText) paras.splice(c.paragraphIndex, 1);
    } else if (c.type === 'deletion') {
      // Restore the deleted paragraph at its original position.
      paras.splice(c.paragraphIndex, 0, c.originalText);
    } else {
      // Modification — revert to the original text if the edit is still present.
      if (c.paragraphIndex < paras.length && paras[c.paragraphIndex] === c.newText) {
        paras[c.paragraphIndex] = c.originalText;
      }
    }
  }
  return paras.join('\n\n');
}

export const initialTrackedChanges: TrackedChange[] = [
  // NOTE: 8.1.3 (Climate strategy and roadmap) is intentionally left with NO
  // seeded tracked changes so it reads as a pristine fresh AI draft for the
  // demo — the year-on-year "Changes from 2025" redline (driven by prior-year
  // content, not tracked changes) is the star of that section. The paragraph
  // text those changes used to introduce is already part of the seeded content.
  {
    id: 'tc-003',
    sectionId: 'sub-9-1-1',
    author: 'Casey Lindqvist',
    timestamp: '2026-04-05T14:00:00Z',
    type: 'modification',
    originalText: 'the lost-time injury and illness rate for employees was 0.12 per 200 000 work hours',
    newText: 'the lost-time injury and illness rate for employees was 0.12 per 200 000 work hours (down from 0.13), and is in scope for KPMG limited assurance under ISAE 3000',
    paragraphIndex: 0,
    reason: 'Added assurance reference and prior-year comparison per legal review comment',
    status: 'pending',
    origin: 'human',
  },
  {
    // D — AI-drafted insertion for a new ESRS S1 datapoint
    id: 'tc-ai-002',
    sectionId: 'sub-9-1-1',
    author: 'AI Draft Assistant',
    timestamp: '2026-06-16T09:12:00Z',
    type: 'insertion',
    originalText: '',
    newText: 'Employee engagement score: 78% favourable (Global People Survey, Nov 2025, 89% response rate). Top engagement drivers: purpose alignment, development opportunities, and manager effectiveness.',
    paragraphIndex: 0,
    reason: 'AI proposed text to address newly assigned datapoint ESRS S1-15 (work-life balance / engagement metrics)',
    status: 'pending',
    origin: 'ai',
    drRef: 'ESRS-S1-15',
  },
  {
    id: 'tc-005',
    sectionId: 'sub-8-2-3',
    author: 'Robin Faust',
    timestamp: '2026-04-14T11:00:00Z',
    type: 'modification',
    originalText: 'we consider our water quality targets for 2025 to be met.',
    newText: 'we consider our water quality targets for 2026 to be met, verified by an independent EHS audit.',
    paragraphIndex: 0,
    reason: 'Rolled forward target year to 2026 and added assurance reference',
    status: 'pending',
    origin: 'human',
  },
];
