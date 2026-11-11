// ---------------------------------------------------------------------------
// Directory resolver — the SIMULATED bridge between the (synthetic) Entra
// directory and the app's role model. This is the exact logic a production
// build runs, just fed from synthetic data instead of a live token + Graph:
//
//   1. CAPABILITY: read the user's AD groups -> the acting roles they may hold.
//   2. ASSIGNMENT: read the app-managed per-section assignments (keyed to the
//      user's stable oid) -> the specific sections they own / provide input for.
//   3. EFFECTIVE ROLE: combine the two — you only get an owner's powers on a
//      section if you are BOTH in the Owners group AND assigned to that section.
//
// Production swap-in: replace `resolveGroupsFromClaim` to read the real Cognito
// groups claim, and back `SECTION_ASSIGNMENTS` with the workflow-state store
// (keyed by oid). Nothing else changes.
// ---------------------------------------------------------------------------

import type { ActingRole } from './workflowRoles';
import { ROLE_PERMISSIONS } from './workflowRoles';
import {
  AD_GROUPS, AD_USERS, GROUP_ROLE, type AdUser, type DirectoryClaim,
} from './syntheticDirectory';
import { reportSections } from './reportSections';

// --- 1. CAPABILITY: AD groups -> roles -------------------------------------
// In production the group NAMES arrive in the token; here we resolve from ids.
export function rolesForUser(user: AdUser): ActingRole[] {
  const roles = user.groupIds.map(gid => GROUP_ROLE[gid]).filter(Boolean) as ActingRole[];
  return Array.from(new Set(roles));
}

// The single "effective" acting role when the UI needs one: the most powerful
// group the user is in (admin > editor > owner > input_provider > guest).
// Auditor is a segregated, external role — ranked lowest so it never overrides a
// contributing role, but resolved explicitly where a user is ONLY an auditor.
const ROLE_RANK: Record<ActingRole, number> = {
  admin: 5, editor: 4, owner: 3, input_provider: 2, guest: 1, auditor: 0,
};
export function primaryRole(user: AdUser): ActingRole | null {
  const roles = rolesForUser(user);
  if (!roles.length) return null; // no group -> no access (fail closed)
  return roles.sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0];
}

// Resolve the acting roles from a raw Cognito/Entra claim (the production path).
export function resolveGroupsFromClaim(claim: DirectoryClaim): ActingRole[] {
  const byName = new Map(AD_GROUPS.map(g => [g.name, g.role]));
  const roles = claim['cognito:groups'].map(n => byName.get(n)).filter(Boolean) as ActingRole[];
  return Array.from(new Set(roles));
}

// --- 2. ASSIGNMENT: app-managed, keyed to oid ------------------------------
// Which sections a user is Input Provider / Owner of. Derived here from the
// existing per-subsection role assignment (reportSections.ts) matched to the
// directory by DISPLAY NAME (the demo's join). Production keys on oid via the
// workflow-state store. This is the layer AD deliberately does NOT hold.
export interface SectionAssignmentView {
  asInputProvider: { ref: string; title: string }[];
  asOwner: { ref: string; title: string }[];
}

export function assignmentsForUser(user: AdUser): SectionAssignmentView {
  const name = user.displayName;
  const asInputProvider = reportSections
    .filter(s => s.roles.inputProviders.includes(name))
    .map(s => ({ ref: s.ref, title: s.title }));
  const asOwner = reportSections
    .filter(s => s.roles.owners.includes(name))
    .map(s => ({ ref: s.ref, title: s.title }));
  return { asInputProvider, asOwner };
}

// --- 3. EFFECTIVE authority on a specific section --------------------------
// The combined check the app makes at runtime: a user acts as an Owner on a
// given section only if they hold the Owner CAPABILITY (group) AND carry the
// ASSIGNMENT for that section. Editors/Admins act across all sections by
// capability alone (editScope 'all'), no per-section assignment required.
export function effectiveRoleOnSection(user: AdUser, sectionRef: string): ActingRole | null {
  const roles = rolesForUser(user);
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('editor')) return 'editor';
  const sec = reportSections.find(s => s.ref === sectionRef);
  if (!sec) return roles.includes('guest') ? 'guest' : null;
  if (roles.includes('owner') && sec.roles.owners.includes(user.displayName)) return 'owner';
  if (roles.includes('input_provider') && sec.roles.inputProviders.includes(user.displayName)) return 'input_provider';
  // Holds a contributing group but isn't assigned to THIS section -> read-only here.
  if (roles.includes('guest')) return 'guest';
  // An auditor with no contributing role acts as an auditor (segregated view).
  if (roles.includes('auditor')) return 'auditor';
  return roles.length ? 'guest' : null;
}

// Convenience: does the user have edit rights on this section (for demo tables).
export function canActOnSection(user: AdUser, sectionRef: string): boolean {
  const r = effectiveRoleOnSection(user, sectionRef);
  return !!r && ROLE_PERMISSIONS[r].editScope !== 'none';
}

// A compact directory summary for the admin visualisation.
export interface DirectoryRow {
  user: AdUser;
  roles: ActingRole[];
  primary: ActingRole | null;
  assignments: SectionAssignmentView;
}
export function directorySummary(): DirectoryRow[] {
  return AD_USERS.map(user => ({
    user,
    roles: rolesForUser(user),
    primary: primaryRole(user),
    assignments: assignmentsForUser(user),
  }));
}
