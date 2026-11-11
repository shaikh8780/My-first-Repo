import { describe, it, expect } from 'vitest';
import { resolveRecipient } from './sendTo';

describe('Send To — recipient resolution (Adrian 2026-08-31)', () => {
  it('resolves an existing directory user by display name to their role', () => {
    const r = resolveRecipient('Quinn Harper');
    expect(r.ok).toBe(true);
    expect(r.role).toBe('editor');
    expect(r.autoProvisionedGuest).toBe(false);
  });

  it('resolves an existing directory user by email', () => {
    const r = resolveRecipient('sam.delgado@novartis.com');
    expect(r.ok).toBe(true);
    expect(r.displayName).toBe('Sam Delgado');
    expect(r.autoProvisionedGuest).toBe(false);
  });

  it('auto-provisions a Guest for an unknown novartis.com email', () => {
    const r = resolveRecipient('new.person@novartis.com');
    expect(r.ok).toBe(true);
    expect(r.role).toBe('guest');
    expect(r.autoProvisionedGuest).toBe(true);
    expect(r.displayName).toBe('New Person'); // derived from the local part
  });

  it('rejects a non-novartis.com external email', () => {
    const r = resolveRecipient('someone@gmail.com');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/external/i);
  });

  it('rejects an unknown plain name (no email to fall back to)', () => {
    const r = resolveRecipient('Nobody Here');
    expect(r.ok).toBe(false);
  });

  it('rejects empty input', () => {
    expect(resolveRecipient('   ').ok).toBe(false);
  });

  it('is case-insensitive on the corporate domain', () => {
    const r = resolveRecipient('Jane.Doe@Novartis.com');
    expect(r.ok).toBe(true);
    expect(r.autoProvisionedGuest).toBe(true);
  });
});
