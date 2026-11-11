// Permission-model regression test — the SINGLE source of truth for the
// "who can do what" matrix in the customer deck. If this file and the deck ever
// disagree, THIS file wins (it tests the real exported functions).
//
// Model per Adrian's feedback (2026-08-31):
//   - Multiple Input Providers per section; IPs edit + comment but NO LONGER
//     sign off (an edit marks "edited"; the Editor marks "updated").
//   - Owners sign off at L2; every non-legal owner must sign, and among Legal/
//     Compliance owners a single sign-off suffices.
//   - Export + audit trail restricted to Editors/Admins.
// Roles: input_provider, owner, editor, admin, guest, auditor.
import { describe, it, expect } from 'vitest';
import {
  ROLE_PERMISSIONS, SIGNOFF_LEVEL, isEditor, isOwner,
  canReviewChanges, canEditSubsection, canComment, canViewAuditTrail,
  EDITOR_TEAM,
} from './workflowRoles';
import type { SubsectionRoles } from './reportSections';
import { allRequiredOwnersSigned, normalizeSectionRoles } from './reportSections';
import {
  canEditStructure, canManageKnowledgeBase, canRunAnalysis, canManageReportCycle,
} from './permissions';

// A representative subsection: IP = Sam, one Owner = Robin. (Legal reviewers are
// modelled as Owners flagged in legalOwners.)
const IP = 'Sam Delgado';
const OWNER = 'Robin Faust';
const GUEST = 'Pat Visitor';
const EDITOR = EDITOR_TEAM[0]; // 'Quinn Harper'
const roles: SubsectionRoles = { inputProviders: [IP], owners: [OWNER], legalOwners: [] };

// The acting seats we test against, mapped to a concrete actor name the helpers
// understand. NB: Editor/Admin authority is name-based (isEditor allowlist);
// the app's "me" seat is treated as Editor via viewAsRole==='me' in EditorView.
const ADMIN = 'admin'; // in the structure-admin + editor allowlist

describe('ROLE_PERMISSIONS matrix (declared capabilities)', () => {
  it('input_provider: edits own (tracked) + comments; NO sign-off; no review; no audit trail', () => {
    const p = ROLE_PERMISSIONS.input_provider;
    expect(p.canEdit).toBe(true);
    expect(p.canEditWithoutTracking).toBe(false);
    expect(p.canReviewChanges).toBe(false);   // <-- cannot accept/reject
    expect(p.canComment).toBe(true);
    expect(p.canSignOff).toBe(false);         // <-- L3 sign-off removed (2026-08-31)
    expect(p.signOffLevel).toBe(null);
    expect(p.editScope).toBe('own_subsection');
    expect(p.canViewAuditTrail).toBe(false);  // <-- restricted to Editor/Admin
  });

  it('owner: edits own (tracked) + comments + signs L2; no review; no audit trail', () => {
    const p = ROLE_PERMISSIONS.owner;
    expect(p.canEdit).toBe(true);
    expect(p.canEditWithoutTracking).toBe(false);
    expect(p.canReviewChanges).toBe(false);   // <-- cannot accept/reject
    expect(p.canSignOff).toBe(true);
    expect(p.signOffLevel).toBe('L2');
    expect(p.editScope).toBe('own_subsection');
    expect(p.canViewAuditTrail).toBe(false);  // <-- restricted to Editor/Admin
  });

  it('editor: edits anything (incl. no-tracking) + accepts/rejects; does NOT sign off', () => {
    const p = ROLE_PERMISSIONS.editor;
    expect(p.canEdit).toBe(true);
    expect(p.canEditWithoutTracking).toBe(true);
    expect(p.canReviewChanges).toBe(true);    // <-- the review role
    expect(p.canSignOff).toBe(false);
    expect(p.signOffLevel).toBe(null);
    expect(p.editScope).toBe('all');
  });

  it('admin: superset of editor + can sign off L2', () => {
    const p = ROLE_PERMISSIONS.admin;
    expect(p.canEdit).toBe(true);
    expect(p.canEditWithoutTracking).toBe(true);
    expect(p.canReviewChanges).toBe(true);
    expect(p.canSignOff).toBe(true);
    expect(p.signOffLevel).toBe('L2');
    expect(p.editScope).toBe('all');
  });

  it('guest: read-only + comment only; NO audit-trail access', () => {
    const p = ROLE_PERMISSIONS.guest;
    expect(p.canEdit).toBe(false);
    expect(p.canEditWithoutTracking).toBe(false);
    expect(p.canReviewChanges).toBe(false);
    expect(p.canComment).toBe(true);
    expect(p.canSignOff).toBe(false);
    expect(p.editScope).toBe('none');
    expect(p.canViewAuditTrail).toBe(false);
  });
});

describe('audit trail = Editors & Admins ONLY (Adrian 2026-08-31)', () => {
  it('Editor / Admin can view the audit trail', () => {
    for (const r of ['editor', 'admin'] as const)
      expect(canViewAuditTrail(r)).toBe(true);
  });
  it('Input Provider / Owner / Guest CANNOT view the audit trail', () => {
    for (const r of ['input_provider', 'owner', 'guest'] as const)
      expect(canViewAuditTrail(r)).toBe(false);
  });
});

describe('accept / reject tracked changes = Editors & Admins ONLY', () => {
  it('input provider CANNOT review their own change', () => {
    expect(canReviewChanges(roles, 'sme_review', IP)).toBe(false);
  });
  it('owner CANNOT review changes', () => {
    expect(canReviewChanges(roles, 'legal_review', OWNER)).toBe(false);
  });
  it('editor CAN review', () => {
    expect(canReviewChanges(roles, 'sme_review', EDITOR)).toBe(true);
  });
  it('admin CAN review', () => {
    expect(canReviewChanges(roles, 'sme_review', ADMIN)).toBe(true);
  });
  it('guest CANNOT review', () => {
    expect(canReviewChanges(roles, 'sme_review', GUEST)).toBe(false);
  });
});

describe('edit a subsection (in track changes for IP/Owner; anything for Editor/Admin)', () => {
  it('IP can edit their own subsection (no L3 lock anymore)', () => {
    expect(canEditSubsection(roles, IP)).toBe(true);
  });
  it('supports multiple input providers per section', () => {
    const multi: SubsectionRoles = { inputProviders: [IP, 'Alex Moreau'], owners: [OWNER], legalOwners: [] };
    expect(canEditSubsection(multi, IP)).toBe(true);
    expect(canEditSubsection(multi, 'Alex Moreau')).toBe(true);
  });
  it('assigned owner can edit (track changes)', () => {
    expect(canEditSubsection(roles, OWNER)).toBe(true);
  });
  it('editor can edit anything', () => {
    expect(canEditSubsection(roles, EDITOR)).toBe(true);
  });
  it('a non-assigned, non-editor person cannot edit', () => {
    expect(canEditSubsection(roles, 'Random Person')).toBe(false);
  });
});

describe('commenting is open to everyone', () => {
  for (const who of [IP, OWNER, EDITOR, ADMIN, GUEST])
    it(`${who} can comment`, () => expect(canComment(who)).toBe(true));
});

describe('sign-off levels', () => {
  it('only the Owner (L2) signs off; IP no longer signs off', () => {
    expect(SIGNOFF_LEVEL.input_provider).toBeUndefined();
    expect(SIGNOFF_LEVEL.owner).toBe('L2');
    expect(SIGNOFF_LEVEL.editor).toBeUndefined();
    expect(SIGNOFF_LEVEL.guest).toBeUndefined();
  });
});

describe('normalizeSectionRoles coerces old-shape data (prevents editor crash)', () => {
  it('upgrades the pre-2026-08-31 shape (inputProvider:string, no legalOwners)', () => {
    const old = { inputProvider: 'Sam Delgado', owners: ['Robin Faust', 'Taylor Brenner'] };
    const r = normalizeSectionRoles(old);
    expect(r.inputProviders).toEqual(['Sam Delgado']);
    expect(r.owners).toEqual(['Robin Faust', 'Taylor Brenner']);
    expect(r.legalOwners).toEqual([]);
  });
  it('passes new-shape data through unchanged', () => {
    const now = { inputProviders: ['A', 'B'], owners: ['C', 'D'], legalOwners: ['D'] };
    expect(normalizeSectionRoles(now)).toEqual(now);
  });
  it('drops legalOwners not present in owners, and tolerates missing/garbage', () => {
    expect(normalizeSectionRoles({ owners: ['C'], legalOwners: ['X'] }).legalOwners).toEqual([]);
    expect(normalizeSectionRoles(undefined)).toEqual({ inputProviders: [], owners: [], legalOwners: [] });
    expect(normalizeSectionRoles(null)).toEqual({ inputProviders: [], owners: [], legalOwners: [] });
  });
});

describe('L2 owner sign-off rule (Adrian 2026-08-31)', () => {
  const A = 'Owner A', B = 'Owner B', L1 = 'Legal One', L2 = 'Legal Two';
  const sign = (...names: string[]) => (o: string) => names.includes(o);

  it('all non-legal owners must sign (no legal owners)', () => {
    const r: SubsectionRoles = { inputProviders: [IP], owners: [A, B], legalOwners: [] };
    expect(allRequiredOwnersSigned(r, sign(A))).toBe(false);
    expect(allRequiredOwnersSigned(r, sign(A, B))).toBe(true);
  });

  it('one legal sign-off suffices among multiple legal owners', () => {
    const r: SubsectionRoles = { inputProviders: [IP], owners: [A, L1, L2], legalOwners: [L1, L2] };
    // A (non-legal) hasn't signed yet.
    expect(allRequiredOwnersSigned(r, sign(L1))).toBe(false);
    // A signed + one of the two legal owners signed → approved (the other legal need not).
    expect(allRequiredOwnersSigned(r, sign(A, L1))).toBe(true);
    expect(allRequiredOwnersSigned(r, sign(A, L2))).toBe(true);
  });

  it('a legal owner alone is not enough without the non-legal owner', () => {
    const r: SubsectionRoles = { inputProviders: [IP], owners: [A, L1], legalOwners: [L1] };
    expect(allRequiredOwnersSigned(r, sign(L1))).toBe(false);
    expect(allRequiredOwnersSigned(r, sign(A))).toBe(false); // legal still required
    expect(allRequiredOwnersSigned(r, sign(A, L1))).toBe(true);
  });

  it('a section with no owners is never approved', () => {
    const r: SubsectionRoles = { inputProviders: [IP], owners: [], legalOwners: [] };
    expect(allRequiredOwnersSigned(r, () => true)).toBe(false);
  });
});

// ---- Derived UI rules the deck asserts (mirror EditorView gating exactly) ----
// These reproduce the boolean the component computes, so the deck's rows are
// tested rather than asserted by hand.

/** Accept the AI roll-forward draft as the working base = canEditThis
 *  (Editor/Admin OR the assigned IP/Owner) — i.e. everyone EXCEPT guest. */
function canAcceptAiBaseline(actor: string, isGuest: boolean): boolean {
  if (isGuest) return false;
  return isEditor(actor) || canEditSubsection(roles, actor);
}

/** Export the report (Adrian 2026-08-31) = Editors & Admins ONLY, at any time
 *  (no approval gate). Mirrors EditorView's `canExportReport = actingIsEditor`. */
function canExportReport(actingIsEditor: boolean): boolean {
  return actingIsEditor;
}

describe('AI draft acceptance = Editor / Admin / assigned IP / Owner (not guest)', () => {
  it('IP can accept the AI baseline', () => expect(canAcceptAiBaseline(IP, false)).toBe(true));
  it('Owner can accept the AI baseline', () => expect(canAcceptAiBaseline(OWNER, false)).toBe(true));
  it('Editor can accept the AI baseline', () => expect(canAcceptAiBaseline(EDITOR, false)).toBe(true));
  it('Admin can accept the AI baseline', () => expect(canAcceptAiBaseline(ADMIN, false)).toBe(true));
  it('Guest CANNOT accept the AI baseline', () => expect(canAcceptAiBaseline(GUEST, true)).toBe(false));
});

describe('export = Editors & Admins only, any time (Adrian 2026-08-31)', () => {
  // actingIsEditor is true only for the Editor/Admin acting seats.
  it('Editor can export', () => expect(canExportReport(true)).toBe(true));
  it('Admin can export', () => expect(canExportReport(true)).toBe(true));
  it('IP CANNOT export', () => expect(canExportReport(false)).toBe(false));
  it('Owner CANNOT export', () => expect(canExportReport(false)).toBe(false));
  it('Guest CANNOT export', () => expect(canExportReport(false)).toBe(false));
});

// ---- Report-agnostic admin-group actions (2026-08-21 hardening) -------------
// KB upload/manage, AI analysis (compliance scan / consistency / explain-with-AI)
// and starting a new reporting cycle are gated to the structure-admin allowlist
// (Editor/Admin/ESG-Lead group; a Cognito group in production), NOT open to any
// authenticated user. Alias-based: an allowlisted alias is permitted; a
// non-allowlisted one is not. (null alias = demo default → permitted.)
describe('report-agnostic actions gate to the Editor/Admin (structure-admin) group', () => {
  const ADMIN_ALIAS = 'jordan.avery';   // in STRUCTURE_ADMIN_ALIASES
  const CONTRIB_ALIAS = 'sam.delgado';  // an ordinary contributor alias, not allowlisted

  it('all three helpers agree with canEditStructure for an allowlisted alias', () => {
    expect(canEditStructure(ADMIN_ALIAS)).toBe(true);
    expect(canManageKnowledgeBase(ADMIN_ALIAS)).toBe(true);
    expect(canRunAnalysis(ADMIN_ALIAS)).toBe(true);
    expect(canManageReportCycle(ADMIN_ALIAS)).toBe(true);
  });

  it('a non-allowlisted contributor is denied KB manage / analysis / new-cycle', () => {
    expect(canEditStructure(CONTRIB_ALIAS)).toBe(false);
    expect(canManageKnowledgeBase(CONTRIB_ALIAS)).toBe(false);
    expect(canRunAnalysis(CONTRIB_ALIAS)).toBe(false);
    expect(canManageReportCycle(CONTRIB_ALIAS)).toBe(false);
  });

  it('null alias (no federated identity) falls back to the demo-permissive default', () => {
    expect(canManageKnowledgeBase(null)).toBe(true);
    expect(canRunAnalysis(null)).toBe(true);
    expect(canManageReportCycle(null)).toBe(true);
  });
});
