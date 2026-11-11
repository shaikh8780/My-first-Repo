// Release-to-Audit model (Adrian 2026-08-31).
//
// The Owner is the role who RELEASES a signed-off section to the external
// Auditor view. Until a section is released it is not visible to an Auditor —
// the Auditor only ever sees approved, released content plus its data points and
// supporting evidence. A release is recorded per L2 section (the unit an Owner
// signs off), keyed by the same "topicL1||topicL2" key used for L2 sign-offs.

export interface AuditRelease {
  by: string;      // the owner/admin who released it
  at: string;      // ISO timestamp
}

// Keyed by l2StatusKey(topicL1, topicL2).
export type AuditReleaseMap = Record<string, AuditRelease>;

// No seed — nothing is released until an Owner acts.
export const initialAuditReleases: AuditReleaseMap = {};
