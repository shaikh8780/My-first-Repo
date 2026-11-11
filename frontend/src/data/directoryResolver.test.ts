// Tests for the AD/Entra synthetic-directory resolver — the capability (AD group)
// vs. assignment (app-managed) model and the combined effective-role check.
import { describe, it, expect } from 'vitest';
import { AD_USERS, AD_GROUPS, claimFor } from './syntheticDirectory';
import {
  rolesForUser, primaryRole, resolveGroupsFromClaim,
  assignmentsForUser, effectiveRoleOnSection, directorySummary,
} from './directoryResolver';

const byName = (n: string) => AD_USERS.find(u => u.displayName === n)!;

describe('capability — AD groups resolve to roles', () => {
  it('an Admins-group user resolves to admin', () => {
    expect(rolesForUser(byName('Jordan Avery'))).toContain('admin');
    expect(primaryRole(byName('Jordan Avery'))).toBe('admin');
  });
  it('an Editors-group user resolves to editor', () => {
    expect(primaryRole(byName('Quinn Harper'))).toBe('editor');
  });
  it('a user in two groups gets both roles; primary is the most powerful', () => {
    const sam = byName('Sam Delgado'); // Owners + Contributors
    expect(rolesForUser(sam).sort()).toEqual(['input_provider', 'owner']);
    expect(primaryRole(sam)).toBe('owner'); // owner outranks input_provider
  });
  it('a Reviewers-group user resolves to guest', () => {
    expect(primaryRole(byName('Sky Reviewer'))).toBe('guest');
  });
  it('an Auditors-group user resolves to auditor (external assurance)', () => {
    expect(primaryRole(byName('KPMG Assurance'))).toBe('auditor');
  });
  it('a user in NO group has no access (fail closed)', () => {
    expect(rolesForUser(byName('Pat Nogroups'))).toEqual([]);
    expect(primaryRole(byName('Pat Nogroups'))).toBeNull();
  });
});

describe('resolveGroupsFromClaim mirrors the production token path', () => {
  it('reads cognito:groups (group names) back to roles', () => {
    const claim = claimFor(byName('Sam Delgado'));
    expect(claim['cognito:groups']).toContain('ESG-RNFM-Owners');
    expect(resolveGroupsFromClaim(claim).sort()).toEqual(['input_provider', 'owner']);
  });
  it('every AD group name round-trips to its role', () => {
    for (const g of AD_GROUPS) {
      const claim = { sub: 's', oid: 'o', email: 'e', name: 'n', 'cognito:groups': [g.name] };
      expect(resolveGroupsFromClaim(claim)).toEqual([g.role]);
    }
  });
});

describe('assignment — app-managed, per section', () => {
  it('resolves the sections a user owns / provides input for', () => {
    const a = assignmentsForUser(byName('Sam Delgado'));
    // Sam is the Environmental content owner + an Input Provider on climate sections.
    expect(a.asOwner.length).toBeGreaterThan(0);
    expect(a.asInputProvider.length).toBeGreaterThan(0);
  });
  it('a guest-only user owns nothing', () => {
    const a = assignmentsForUser(byName('Sky Reviewer'));
    expect(a.asOwner).toEqual([]);
    expect(a.asInputProvider).toEqual([]);
  });
});

describe('effective role = capability AND assignment', () => {
  it('Admin acts as admin on ANY section (capability alone)', () => {
    expect(effectiveRoleOnSection(byName('Jordan Avery'), '8.1.2')).toBe('admin');
  });
  it('Editor acts as editor on ANY section (capability alone)', () => {
    expect(effectiveRoleOnSection(byName('Quinn Harper'), '8.1.2')).toBe('editor');
  });
  it('an Owner-group user is only an owner on sections they are ASSIGNED to', () => {
    const sam = byName('Sam Delgado');
    const owned = assignmentsForUser(sam).asOwner[0].ref;
    expect(effectiveRoleOnSection(sam, owned)).toBe('owner');
    // A governance section Sam does not own -> not owner there.
    const notOwned = '10.1';
    expect(effectiveRoleOnSection(sam, notOwned)).not.toBe('owner');
  });
  it('a no-group user has no access anywhere', () => {
    expect(effectiveRoleOnSection(byName('Pat Nogroups'), '8.1.2')).toBeNull();
  });
});

describe('directorySummary covers every synthetic user', () => {
  it('returns one row per directory user', () => {
    expect(directorySummary().length).toBe(AD_USERS.length);
  });
});
