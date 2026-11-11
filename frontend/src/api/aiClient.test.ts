import { describe, it, expect, vi, beforeEach } from 'vitest';

// aiClient branches on API_MODE (from ./index) and calls apiFetch (from
// ../services/apiClient). We mock both so we can drive the rest/local paths and
// simulate failures. API_MODE is read at call time, so mocking the module value
// is sufficient.
vi.mock('../services/apiClient', () => ({ apiFetch: vi.fn() }));
vi.mock('./index', () => ({ API_MODE: 'rest' }));

import { aiChat, aiPeer, aiDraft, aiCompliance, aiAnalyze } from './aiClient';
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

// Simulate a failed backend call the way it reaches aiClient's catch, using an
// HTTP-error RESPONSE (not a rejected promise). This exercises the exact same
// `catch → fallback` branch as a network reject, but deterministically and
// without a transiently-unhandled rejection (which Vitest's watcher escalates).
function httpError(status = 500) {
  apiFetch.mockResolvedValue(json('error', status));
}

describe('aiClient in rest mode', () => {
  it('aiChat posts to /api/ai/chat and returns the model result', async () => {
    apiFetch.mockResolvedValue(json({ answer: 'real', proposedText: 'insert me' }));
    const out = await aiChat({ prompt: 'draft', sectionTitle: 'Climate' });
    expect(apiFetch.mock.calls[0][0]).toBe('/api/ai/chat');
    expect(out).toEqual({ answer: 'real', proposedText: 'insert me' });
  });

  it('aiChat falls back to the local sim on HTTP error', async () => {
    apiFetch.mockResolvedValue(json('nope', 500));
    const out = await aiChat({ prompt: 'What are the minimum requirements?', sectionTitle: 'Climate' });
    // Sim fallback still yields a usable answer string (not a throw).
    expect(typeof out.answer).toBe('string');
    expect(out.answer.length).toBeGreaterThan(0);
  });

  it('aiPeer posts to /api/ai/peer and returns answer+citations', async () => {
    apiFetch.mockResolvedValue(json({ answer: 'GSK leads', citations: [{ company: 'GSK', excerpt: 'x', pageRef: 'p', section: 's' }] }));
    const out = await aiPeer('q', 'corpus', () => ({ answer: 'LOCAL', citations: [] }));
    expect(apiFetch.mock.calls[0][0]).toBe('/api/ai/peer');
    expect(out.answer).toBe('GSK leads');
    expect(out.citations).toHaveLength(1);
  });

  it('aiPeer uses localFallback on backend error', async () => {
    httpError();
    const out = await aiPeer('q', 'corpus', () => ({ answer: 'LOCAL', citations: [] }));
    expect(out).toEqual({ answer: 'LOCAL', citations: [] });
  });

  it('aiDraft returns text on success', async () => {
    apiFetch.mockResolvedValue(json({ text: 'drafted' }));
    expect(await aiDraft({ sectionTitle: 'C', drRef: 'E1-4' })).toBe('drafted');
  });
  it('aiDraft returns null when backend gives null text', async () => {
    apiFetch.mockResolvedValue(json({ text: null }));
    expect(await aiDraft({ sectionTitle: 'C', drRef: 'E1-4' })).toBeNull();
  });
  it('aiDraft returns null on backend error', async () => {
    httpError();
    expect(await aiDraft({ sectionTitle: 'C', drRef: 'E1-4' })).toBeNull();
  });

  it('aiCompliance returns result on success (with grounding sources)', async () => {
    apiFetch.mockResolvedValue(json({ rationale: 'why missing', suggestedFill: 'add X', sources: [{ source: 'RNFM FY2025', pageRef: 'p.30' }] }));
    expect(await aiCompliance({ drId: 'E1-9', title: 't', status: 'missing' }))
      .toEqual({ rationale: 'why missing', suggestedFill: 'add X', sources: [{ source: 'RNFM FY2025', pageRef: 'p.30' }] });
  });
  it('aiCompliance defaults sources to [] when backend omits them', async () => {
    apiFetch.mockResolvedValue(json({ rationale: 'why missing', suggestedFill: 'add X' }));
    expect(await aiCompliance({ drId: 'E1-9', title: 't', status: 'missing' }))
      .toEqual({ rationale: 'why missing', suggestedFill: 'add X', sources: [] });
  });
  it('aiCompliance returns null when rationale is empty', async () => {
    apiFetch.mockResolvedValue(json({ rationale: '', suggestedFill: null }));
    expect(await aiCompliance({ drId: 'E1-9', title: 't', status: 'missing' })).toBeNull();
  });
  it('aiCompliance returns null on backend error', async () => {
    httpError();
    expect(await aiCompliance({ drId: 'E1-9', title: 't', status: 'missing' })).toBeNull();
  });

  it('aiAnalyze returns model flags on success', async () => {
    const flags = [{ id: 'ai-flag-style-0-0', kind: 'style', paragraphIndex: 0, original: 'CO2', suggestion: 'CO₂', message: 'subscript' }];
    apiFetch.mockResolvedValue(json({ flags }));
    expect(await aiAnalyze('Emissions of CO2.')).toEqual(flags);
  });
  it('aiAnalyze returns null when backend flags are null (→ caller uses regex analyzer)', async () => {
    apiFetch.mockResolvedValue(json({ flags: null }));
    expect(await aiAnalyze('text')).toBeNull();
  });
  it('aiAnalyze returns null on backend error', async () => {
    httpError();
    expect(await aiAnalyze('text')).toBeNull();
  });
});
