// ---------------------------------------------------------------------------
// SYNTHETIC Entra ID (Azure AD) directory — a simulation seam, NOT a live
// connection. It mirrors exactly the data a real Microsoft Entra ID federation
// would provide, so the app can demonstrate end-to-end how roles integrate with
// the customer's directory before any real IdP is wired.
//
// The production swap-in is a one-file change: replace the constants below with
// (a) Cognito reading the SAML/OIDC "groups" claim Entra puts in the token, and
// (b) a Microsoft Graph lookup for the people-picker. Everything downstream
// (group -> role resolution, capability-vs-assignment) stays identical.
//
// The design rule this encodes (see novartis-esg-roles-deck memory):
//   * CAPABILITY  = "what KIND of actor are you?"  -> from an AD GROUP.
//   * ASSIGNMENT  = "WHICH section do you own?"     -> app-managed, keyed to the
//                    stable AD object id (oid). We do NOT create an AD group per
//                    subsection — a handful of role groups is all AD needs.
// ---------------------------------------------------------------------------

import type { ActingRole } from './workflowRoles';

// --- 1. The AD security groups Novartis would create -----------------------
// Role-only groups (the recommended granularity): AD answers "can you own /
// edit / administer", never "which section". Names follow a typical convention.
export interface AdGroup {
  id: string;          // Entra group object id (guid in production)
  name: string;        // on-prem sAMAccountName / Entra display name
  role: ActingRole;    // the acting role this group grants
  description: string;
}

export const AD_GROUPS: AdGroup[] = [
  { id: 'grp-admins',       name: 'ESG-RNFM-Admins',       role: 'admin',          description: 'ESG Reporting Lead / platform administrators — full access.' },
  { id: 'grp-editors',      name: 'ESG-RNFM-Editors',      role: 'editor',         description: 'Central editing team — accept/reject changes, edit anything.' },
  { id: 'grp-owners',       name: 'ESG-RNFM-Owners',       role: 'owner',          description: 'Section owners (incl. Legal/Compliance) — sign off at L2.' },
  { id: 'grp-contributors', name: 'ESG-RNFM-Contributors', role: 'input_provider', description: 'Subject-matter experts who draft/edit subsections (no sign-off).' },
  { id: 'grp-reviewers',    name: 'ESG-RNFM-Reviewers',    role: 'guest',          description: 'Read-only reviewers — view + comment on content only.' },
  { id: 'grp-auditors',     name: 'ESG-RNFM-Auditors',     role: 'auditor',        description: 'External assurance — dedicated read-only Audit view (released sections + evidence).' },
];

// group id -> role, for the resolver.
export const GROUP_ROLE: Record<string, ActingRole> = Object.fromEntries(
  AD_GROUPS.map(g => [g.id, g.role]),
) as Record<string, ActingRole>;

// --- 2. Synthetic directory users ------------------------------------------
// Each carries what a real Entra token/Graph record would: a stable object id
// (oid), userPrincipalName (UPN), email, display name, department, and the set
// of AD group ids they belong to. Names match the demo personas already used in
// reportSections.ts so directory identity lines up with section assignments.
export interface AdUser {
  oid: string;                 // immutable Entra object id — the join key for assignments
  upn: string;                 // user principal name (login)
  email: string;
  displayName: string;
  department: string;
  jobTitle: string;
  groupIds: string[];          // AD group memberships
}

export const AD_USERS: AdUser[] = [
  { oid: 'oid-0001', upn: 'jordan.avery@novartis.com',  email: 'jordan.avery@novartis.com',  displayName: 'Jordan Avery',      department: 'Sustainability (SI&S)', jobTitle: 'ESG Reporting Lead',          groupIds: ['grp-admins'] },
  { oid: 'oid-0002', upn: 'quinn.harper@novartis.com',  email: 'quinn.harper@novartis.com',  displayName: 'Quinn Harper',      department: 'Corporate Reporting',   jobTitle: 'ESG Report Editor',           groupIds: ['grp-editors'] },
  { oid: 'oid-0003', upn: 'noa.vance@novartis.com',     email: 'noa.vance@novartis.com',     displayName: 'Noa Vance',         department: 'Corporate Reporting',   jobTitle: 'ESG Report Editor',           groupIds: ['grp-editors'] },
  { oid: 'oid-0004', upn: 'sam.delgado@novartis.com',   email: 'sam.delgado@novartis.com',   displayName: 'Sam Delgado',       department: 'Environment / HSE',     jobTitle: 'Environmental Manager',       groupIds: ['grp-owners', 'grp-contributors'] },
  { oid: 'oid-0005', upn: 'robin.faust@novartis.com',   email: 'robin.faust@novartis.com',   displayName: 'Robin Faust',       department: 'Environment / HSE',     jobTitle: 'EHS Specialist',              groupIds: ['grp-contributors'] },
  { oid: 'oid-0006', upn: 'riley.okafor@novartis.com',  email: 'riley.okafor@novartis.com',  displayName: 'Riley Okafor',      department: 'Global Health',         jobTitle: 'Global Health Lead',          groupIds: ['grp-owners', 'grp-contributors'] },
  { oid: 'oid-0007', upn: 'taylor.brenner@novartis.com',email: 'taylor.brenner@novartis.com',displayName: 'Dr. Taylor Brenner', department: 'Legal',                jobTitle: 'Legal / Compliance Reviewer', groupIds: ['grp-owners'] },
  { oid: 'oid-0008', upn: 'jamie.kessler@novartis.com', email: 'jamie.kessler@novartis.com', displayName: 'Jamie Kessler',     department: 'Ethics, Risk & Compliance', jobTitle: 'Compliance Counsel',      groupIds: ['grp-owners'] },
  { oid: 'oid-0009', upn: 'alex.moreau@novartis.com',   email: 'alex.moreau@novartis.com',   displayName: 'Alex Moreau',       department: 'Procurement',           jobTitle: 'Procurement Lead',            groupIds: ['grp-contributors'] },
  { oid: 'oid-0010', upn: 'casey.lindqvist@novartis.com',email: 'casey.lindqvist@novartis.com',displayName: 'Casey Lindqvist',  department: 'People & Organization', jobTitle: 'HR Analytics Lead',           groupIds: ['grp-contributors'] },
  { oid: 'oid-0011', upn: 'morgan.reyes@novartis.com',  email: 'morgan.reyes@novartis.com',  displayName: 'Morgan Reyes',      department: 'Finance',               jobTitle: 'Finance / GHG Accounting',    groupIds: ['grp-contributors'] },
  { oid: 'oid-0012', upn: 'devin.marsh@novartis.com',   email: 'devin.marsh@novartis.com',   displayName: 'Devin Marsh',       department: 'Corporate Communications', jobTitle: 'Comms Manager',            groupIds: ['grp-contributors'] },
  { oid: 'oid-0013', upn: 'external.assurer@kpmg.com',  email: 'external.assurer@kpmg.com',  displayName: 'KPMG Assurance',    department: 'External (KPMG)',       jobTitle: 'External Assurance',          groupIds: ['grp-auditors'] },
  { oid: 'oid-0014', upn: 'no.groups@novartis.com',     email: 'no.groups@novartis.com',     displayName: 'Pat Nogroups',      department: 'Unassigned',            jobTitle: '—',                           groupIds: [] },
  { oid: 'oid-0015', upn: 'sky.reviewer@novartis.com',  email: 'sky.reviewer@novartis.com',  displayName: 'Sky Reviewer',      department: 'Corporate Reporting',   jobTitle: 'Internal Reviewer',           groupIds: ['grp-reviewers'] },
];

// The synthetic OIDC/SAML claim Cognito would receive from Entra for a user —
// used to show the exact token shape the resolver reads in production.
export interface DirectoryClaim {
  sub: string;              // Cognito subject
  oid: string;              // Entra object id (custom:oid or the mapped attribute)
  email: string;
  name: string;
  'cognito:groups': string[]; // group names, as Cognito surfaces a mapped groups claim
}

export function claimFor(user: AdUser): DirectoryClaim {
  return {
    sub: `cognito-${user.oid}`,
    oid: user.oid,
    email: user.email,
    name: user.displayName,
    'cognito:groups': user.groupIds.map(gid => AD_GROUPS.find(g => g.id === gid)?.name ?? gid),
  };
}
