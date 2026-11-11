// "Send To" recipient resolution (Adrian 2026-08-31).
//
// A "Send To" action assigns an action/request to a person. The recipient can be
// an existing directory user, OR a novartis.com email that is not yet in the
// directory — in which case the system auto-provisions a Guest. A non-novartis.com
// address that isn't a known external assurer is rejected (external sharing is
// not open to arbitrary domains).
//
// In production the directory lookup is Microsoft Graph and the auto-Guest is a
// Cognito guest-group invite; here it resolves against the synthetic directory.

import { AD_USERS, type AdUser } from './syntheticDirectory';
import { primaryRole } from './directoryResolver';
import { ACTING_ROLE_LABEL, type ActingRole } from './workflowRoles';

const CORPORATE_DOMAIN = 'novartis.com';

export interface RecipientResolution {
  ok: boolean;
  // Display name to record on the assignment.
  displayName?: string;
  email?: string;
  // The role the recipient acts as (existing role, or 'guest' when auto-provisioned).
  role?: ActingRole;
  roleLabel?: string;
  // True when the recipient was not in the directory and got auto-Guest status.
  autoProvisionedGuest?: boolean;
  // Populated when ok === false.
  error?: string;
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1) : '';
}

// Resolve a free-text recipient (an email, or an exact directory display name).
export function resolveRecipient(input: string): RecipientResolution {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'Enter a name or a novartis.com email address.' };

  // 1) Exact directory display-name match (people-picker selection).
  const byName = AD_USERS.find(u => u.displayName.toLowerCase() === raw.toLowerCase());
  if (byName) return fromDirectoryUser(byName);

  // 2) Email path.
  if (raw.includes('@')) {
    const email = normalizeEmail(raw);
    const byEmail = AD_USERS.find(u => u.email.toLowerCase() === email);
    if (byEmail) return fromDirectoryUser(byEmail);

    const domain = domainOf(email);
    if (domain === CORPORATE_DOMAIN) {
      // A novartis.com person not yet in the directory → auto-assign Guest.
      const displayName = deriveNameFromEmail(email);
      return {
        ok: true,
        displayName,
        email,
        role: 'guest',
        roleLabel: ACTING_ROLE_LABEL.guest,
        autoProvisionedGuest: true,
      };
    }
    return {
      ok: false,
      error: `Only @${CORPORATE_DOMAIN} recipients can be added automatically. “${email}” is external — add them through the directory/assurance onboarding instead.`,
    };
  }

  // 3) A non-email string that didn't match anyone.
  return { ok: false, error: `No directory user named “${raw}”. Enter their novartis.com email to send to them.` };
}

function fromDirectoryUser(u: AdUser): RecipientResolution {
  const role = primaryRole(u) ?? 'guest';
  return {
    ok: true,
    displayName: u.displayName,
    email: u.email,
    role,
    roleLabel: ACTING_ROLE_LABEL[role],
    autoProvisionedGuest: false,
  };
}

// "jane.doe@novartis.com" -> "Jane Doe" for the auto-provisioned guest label.
function deriveNameFromEmail(email: string): string {
  const local = email.slice(0, email.indexOf('@'));
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ') || email;
}
