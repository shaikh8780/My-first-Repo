// J — parallel-editing conflict prevention.
// When a user is actively editing a subsection, others see it as "In Use by
// [Name]". A second editor cannot silently overwrite; they join a notification
// queue and access is sequential. Locks are demo-state (localStorage-backed via
// the editor), seeded here so multi-user scenarios are visible out of the box.

export interface SectionLock {
  sectionId: string;
  heldBy: string;
  since: string;
  queue: string[]; // users waiting for sequential access
}

// Seed a couple of subsections as locked by other contributors so the
// "In Use by" state and the queue are demonstrable immediately.
export const initialSectionLocks: SectionLock[] = [
  { sectionId: 'sub-8-1-4', heldBy: 'Sam Delgado', since: '2026-06-18T09:20:00Z', queue: [] },
  { sectionId: 'sub-9-2-3', heldBy: 'Alex Moreau', since: '2026-06-18T10:05:00Z', queue: ['Jamie Kessler'] },
];

export function findLock(locks: SectionLock[], sectionId: string): SectionLock | undefined {
  return locks.find(l => l.sectionId === sectionId);
}
