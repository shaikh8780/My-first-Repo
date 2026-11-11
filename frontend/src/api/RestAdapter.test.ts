import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Cognito-authed fetch so we can assert URLs/verbs and simulate
// responses without a network. apiFetch is the single seam RestAdapter uses.
const apiFetch = vi.fn();
vi.mock('../services/apiClient', () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));

import { restAdapter } from './RestAdapter';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => body,
  } as unknown as Response;
}
function htmlResponse(status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html' : null) },
    text: async () => '<!doctype html><html></html>',
    json: async () => { throw new Error('not json'); },
  } as unknown as Response;
}

beforeEach(() => apiFetch.mockReset());

describe('RestAdapter route mapping', () => {
  it('GET report resource hits /api/reports/rnfm/<resource>', async () => {
    apiFetch.mockResolvedValue(jsonResponse([{ id: 's' }]));
    await restAdapter.report.sections.get();
    expect(apiFetch).toHaveBeenCalledWith('/api/reports/rnfm/sections');
  });

  it('PUT report resource uses PUT + JSON body', async () => {
    apiFetch.mockResolvedValue(jsonResponse([{ id: 's' }]));
    await restAdapter.report.changes.set([{ id: 'c' }] as never);
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/reports/rnfm/changes');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual([{ id: 'c' }]);
  });

  it('clear() DELETEs the resource', async () => {
    apiFetch.mockResolvedValue(jsonResponse(null, 204));
    await restAdapter.report.locks.clear();
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/reports/rnfm/locks');
    expect(init.method).toBe('DELETE');
  });

  it('tracked-drafts route is keyed by section id', async () => {
    apiFetch.mockResolvedValue(jsonResponse('<p>x</p>'));
    await restAdapter.report.trackedDrafts.get('sub-8-1-1');
    expect(apiFetch).toHaveBeenCalledWith('/api/reports/rnfm/tracked-drafts/sub-8-1-1');
  });

  it('reset() POSTs the report reset', async () => {
    apiFetch.mockResolvedValue(jsonResponse(null, 204));
    await restAdapter.report.reset();
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe('/api/reports/rnfm/reset');
    expect(init.method).toBe('POST');
  });

  it('structure + uploads map to their routes', async () => {
    apiFetch.mockResolvedValue(jsonResponse([]));
    await restAdapter.structure.published.get();
    expect(apiFetch).toHaveBeenCalledWith('/api/structure/published');
    apiFetch.mockResolvedValue(jsonResponse([]));
    await restAdapter.uploads.get();
    expect(apiFetch).toHaveBeenCalledWith('/api/uploads');
  });
});

describe('RestAdapter getJSON fallback semantics (the bug-prone path)', () => {
  it('404 → returns the fallback (seed), not an error', async () => {
    apiFetch.mockResolvedValue(jsonResponse('Not found', 404));
    const out = await restAdapter.report.sections.get();
    // sections fallback is the code seed (non-empty array).
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  it('200 + HTML (CloudFront SPA fallback) → treated as missing → fallback', async () => {
    apiFetch.mockResolvedValue(htmlResponse(200));
    const out = await restAdapter.report.sections.get();
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0); // seed, not the HTML
  });

  it('200 + JSON that fails to parse → fallback', async () => {
    const bad = {
      ok: true, status: 200,
      headers: { get: () => 'application/json' },
      json: async () => { throw new Error('boom'); },
    } as unknown as Response;
    apiFetch.mockResolvedValue(bad);
    const out = await restAdapter.report.comments.get();
    expect(Array.isArray(out)).toBe(true); // seeded comments, not a throw
  });

  it('valid JSON → returned as-is (non-transformed channel)', async () => {
    apiFetch.mockResolvedValue(jsonResponse([{ id: 'only-me' }]));
    const out = await restAdapter.report.changes.get();
    expect(out).toEqual([{ id: 'only-me' }]);
  });

  it('sections are role-normalized on read (old-shape backend data cannot crash the UI)', async () => {
    apiFetch.mockResolvedValue(jsonResponse([
      { id: 's1', roles: { inputProvider: 'Sam', owners: ['Robin', 'Taylor'] } }, // old shape
    ]));
    const out = await restAdapter.report.sections.get();
    expect(out[0].roles.inputProviders).toEqual(['Sam']);
    expect(out[0].roles.owners).toEqual(['Robin', 'Taylor']);
    expect(out[0].roles.legalOwners).toEqual([]);
  });
});
