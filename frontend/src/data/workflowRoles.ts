// Approval-workflow role model.
//
// The RNFM approval flow is: Draft → SME Review → Legal Review → Approved, run
// INDEPENDENTLY per subsection. Each subsection carries four assignable roles
// (Input Provider / Informed / Owner sign-off / Legal sign-off). This module is
// the single source of truth for WHICH role acts at each transition and whether
// a given actor is allowed to perform it.
//
// Mapping (matches the customer's requirements):
//   Draft         → SME Review   : the Input Provider submits their draft
//   SME Review    → Legal Review : the Owner reviews tracked changes and signs off
//   Legal Review  → Approved     : Legal sign-off confirms compliance
//
// Because the demo runs as a single federated user, we expose a "view as role"
// switch so one person can walk the whole flow. When a real Cognito identity is
// present the acting role still defaults from the user, but the switch lets a
// reviewer preview the flow from any seat without granting silent bypass.

import type { SubsectionRoles, WorkflowStage } from './reportSections';

// Role model (Adrian 2026-08-31):
//   input_provider — edits their subsection in track-changes + comments. A
//                    section may have MULTIPLE input providers. They NO LONGER
//                    sign off; an edit marks the subsection "edited".
//   owner          — edits in track-changes + comments (via "edit" at L2) and
//                    signs off at L2. A section can have MULTIPLE owners; Legal/
//                    Compliance owners are flagged (single legal sign-off suffices).
//   editor         — special: accepts/rejects tracked changes, edits WITHOUT
//                    track changes, resolves comments, marks sections "updated".
//                    Does not sign off.
//   admin          — special: full access (superset of editor).
//   guest          — special: read-only + comment; assignable to the whole
//                    report or specific sections. No edit, no sign-off.
//   auditor        — external assurance (Adrian 2026-08-31): a DEDICATED,
//                    read-only Audit view ONLY. No drafting environment, no AI
//                    chat, no audit-trail export. Sees the sections an Owner has
//                    RELEASED to audit, their data points, and supporting
//                    evidence, plus the released report PDF.
export type ActingRole = 'input_provider' | 'owner' | 'editor' | 'admin' | 'guest' | 'auditor';

// The level at which each sign-off happens. Only Owners sign off now, at L2
// (section level). Input Providers no longer sign off (L3 removed 2026-08-31).
export type SignOffLevel = 'L2';
export const SIGNOFF_LEVEL: Partial<Record<ActingRole, SignOffLevel>> = {
  owner: 'L2',
};

// --- Role permission matrix (single source of truth) ------------------------
// Encodes the customer's matrix so every gate in the UI derives from one place.
export interface RolePermissions {
  canEdit: boolean;              // edit subsection text (in track changes)
  canEditWithoutTracking: boolean; // apply edits directly, not as tracked changes (Editor/Admin)
  canReviewChanges: boolean;     // accept/reject tracked changes + resolve comments
  canComment: boolean;
  canSignOff: boolean;
  signOffLevel: SignOffLevel | null;
  editScope: 'own_subsection' | 'all' | 'none';
  canViewAuditTrail: boolean;    // view + export the audit trail (Guest excluded)
}

export const ROLE_PERMISSIONS: Record<ActingRole, RolePermissions> = {
  // Input Provider no longer signs off (Adrian 2026-08-31): they edit + comment only.
  input_provider: { canEdit: true,  canEditWithoutTracking: false, canReviewChanges: false, canComment: true,  canSignOff: false, signOffLevel: null,  editScope: 'own_subsection', canViewAuditTrail: false },
  owner:          { canEdit: true,  canEditWithoutTracking: false, canReviewChanges: false, canComment: true,  canSignOff: true,  signOffLevel: 'L2',  editScope: 'own_subsection', canViewAuditTrail: false },
  // Export + audit trail are restricted to Editors/Admins (Adrian 2026-08-31).
  editor:         { canEdit: true,  canEditWithoutTracking: true,  canReviewChanges: true,  canComment: true,  canSignOff: false, signOffLevel: null,  editScope: 'all',            canViewAuditTrail: true },
  admin:          { canEdit: true,  canEditWithoutTracking: true,  canReviewChanges: true,  canComment: true,  canSignOff: true,  signOffLevel: 'L2',  editScope: 'all',            canViewAuditTrail: true },
  // Guest = read-only + comment. The audit trail is an assurance-grade record and
  // is NOT visible or exportable to a Guest (2026-08-21 customer decision).
  guest:          { canEdit: false, canEditWithoutTracking: false, canReviewChanges: false, canComment: true,  canSignOff: false, signOffLevel: null,  editScope: 'none',           canViewAuditTrail: false },
  // Auditor = external assurance. Read-only in a DEDICATED audit view; cannot
  // comment in the drafting environment, cannot edit/sign off, and the internal
  // audit trail is not theirs to view/export (they receive the released report +
  // evidence instead).
  auditor:        { canEdit: false, canEditWithoutTracking: false, canReviewChanges: false, canComment: false, canSignOff: false, signOffLevel: null,  editScope: 'none',           canViewAuditTrail: false },
};

// A role may view/export the audit trail unless it is a read-only Guest.
export function canViewAuditTrail(role: ActingRole): boolean {
  return ROLE_PERMISSIONS[role].canViewAuditTrail;
}

// Editors are a small team (~3 people), assigned globally rather than
// per subsection. In the real system this maps to a Cognito group.
export const EDITOR_TEAM = ['Quinn Harper', 'Noa Vance', 'Emerson Cole'] as const;

// The ESG Reporting Lead / logged-in structure-admin is part of the editor/admin
// group in practice, so the default demo seat can accept/reject and edit. These
// demo login identities (the "me" seat when federated as the ESG Lead / admin)
// are recognised as Editors alongside the named editor team.
const EDITOR_ALIASES = ['you (esg lead)', 'jordan avery', 'jordanavery', 'jordan.avery', 'admin', 'esglead'];

export function isEditor(name: string): boolean {
  if ((EDITOR_TEAM as readonly string[]).includes(name)) return true;
  return EDITOR_ALIASES.includes(name.trim().toLowerCase());
}

export const ACTING_ROLE_LABEL: Record<ActingRole, string> = {
  input_provider: 'Input Provider',
  owner: 'Owner',
  editor: 'Editor',
  admin: 'Admin',
  guest: 'Guest',
  auditor: 'Auditor',
};

// Whether a person is one of the assigned owners of a section (multi-owner).
export function isOwner(roles: SubsectionRoles, actorName: string): boolean {
  return roles.owners.includes(actorName);
}

// Accept/reject of tracked changes + resolving comments is restricted to
// Editors/Admins (the default ESG-Lead "me" seat qualifies). Owners and Input
// Providers edit in track-changes but do not curate others' changes.
export function canReviewChanges(_roles: SubsectionRoles, _stage: WorkflowStage, actorName: string): boolean {
  return isEditor(actorName);
}

// Whether an actor may EDIT a subsection's text (in track changes for IP/Owner;
// directly for Editor/Admin). Editors/Admins edit anything (incl. locked / post-
// approval). Any assigned Input Provider may edit in track changes (there is no
// longer an IP sign-off lock). Any assigned Owner may edit in track changes.
// `opts.lockedToInputProvider` is retained for call-site compatibility but no
// longer blocks input providers, since L3 sign-off was removed (2026-08-31).
export function canEditSubsection(roles: SubsectionRoles, actorName: string, _opts?: { lockedToInputProvider?: boolean }): boolean {
  if (isEditor(actorName)) return true; // editors/admins are exempt from locks + post-approval
  if (roles.inputProviders.includes(actorName)) return true;
  if (isOwner(roles, actorName)) return true; // owners edit in track changes
  return false;
}

// Everyone except a pure read-only seat can comment. Guests can comment too
// (read-only + comment), so this stays permissive for all named seats.
export function canComment(_actorName: string): boolean {
  return true;
}
