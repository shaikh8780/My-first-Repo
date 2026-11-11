import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/apiClient', () => ({ apiFetch: vi.fn() }));
vi.mock('./index', () => ({ API_MODE: 'rest' }));

import { getAdminConfig, saveAdminConfig, refreshKnowledgeBase, DEFAULT_ADMIN_CONFIG } from './adminClient';
import { apiFetch as apiFetchImport } from '../services/apiClient';
const apiFetch = apiFetchImport as unknown as ReturnType<typeof vi.fn>;

function json(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300, status,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => apiFetch.mockReset());

describe('adminClient', () => {
  it('getAdminConfig GETs /api/admin/config', async () => {
    apiFetch.mockResolvedValue(json({ ...DEFAULT_ADMIN_CONFIG, globalContext: 'ctx' }));
    const cfg = await getAdminConfig();
    expect(apiFetch.mock.calls[0][0]).toBe('/api/admin/config');
    expect(cfg.globalContext).toBe('ctx');
  });

  it('saveAdminConfig PUTs the config', async () => {
    apiFetch.mockResolvedValue(json(DEFAULT_ADMIN_CONFIG));
    await saveAdminConfig({ ...DEFAULT_ADMIN_CONFIG, promptOverrides: { ...DEFAULT_ADMIN_CONFIG.promptOverrides, draft: 'x' } });
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/admin/config');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body).promptOverrides.draft).toBe('x');
  });

  it('refreshKnowledgeBase POSTs the refresh', async () => {
    apiFetch.mockResolvedValue(json({ status: 'queued', message: 'ok' }));
    const r = await refreshKnowledgeBase();
    expect(apiFetch.mock.calls[0][0]).toBe('/api/admin/kb/refresh');
    expect(r.status).toBe('queued');
  });

  it('falls back to defaults on backend error (panel still renders)', async () => {
    apiFetch.mockResolvedValue(json('nope', 500));
    expect(await getAdminConfig()).toEqual(DEFAULT_ADMIN_CONFIG);
  });
});
