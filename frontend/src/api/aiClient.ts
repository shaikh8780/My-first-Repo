// AI client for the in-editor assistant.
//
// When VITE_API_MODE=rest, calls the backend /api/ai/chat route (real Bedrock
// via the ECS service). Otherwise — or if the call fails — falls back to the
// deterministic local sim (data/aiEditor.respondToPrompt) so the demo still
// works offline / on the LocalAdapter and never hard-fails the chat.
//
// The return shape matches the local sim (DraftResult) so callers are unchanged:
// they take { answer, proposedText? } and route proposedText through the
// existing tracked-change accept path.

import { API_MODE } from './index';
import { apiFetch } from '../services/apiClient';
import { respondToPrompt, type DraftResult, type EditorFlag } from '../data/aiEditor';
import type { BenchmarkAnswer } from '../data/peerBenchmarking';

export interface AiChatInput {
  prompt: string;
  sectionTitle: string;
  sectionContent?: string;
  evidenceName?: string;
}

export async function aiChat(input: AiChatInput): Promise<DraftResult> {
  // Local mode (or no backend): use the deterministic sim.
  if (API_MODE !== 'rest') {
    return respondToPrompt(input.prompt, input.sectionTitle, input.evidenceName);
  }

  try {
    const res = await apiFetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        prompt: input.prompt,
        sectionTitle: input.sectionTitle,
        sectionContent: input.sectionContent ?? '',
        evidenceName: input.evidenceName ?? null,
      }),
    });
    // CloudFront may rewrite a backend error to a 200+HTML SPA fallback; treat a
    // non-JSON / non-ok response as a failure and fall back to the local sim.
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`ai/chat ${res.status}`);
    }
    const data = (await res.json()) as DraftResult;
    // Guard the shape; if the backend gave us nothing usable, fall back.
    if (!data || typeof data.answer !== 'string') throw new Error('bad ai/chat shape');
    return { answer: data.answer, proposedText: data.proposedText || undefined };
  } catch {
    // Network / model / shape failure — degrade to the local sim rather than
    // leaving the chat dead.
    return respondToPrompt(input.prompt, input.sectionTitle, input.evidenceName);
  }
}

// --- Peer benchmarking Q&A --------------------------------------------------
export type PeerCitation = BenchmarkAnswer['citations'][number];
export interface PeerResult {
  answer: string;
  citations: PeerCitation[];
}

// Called by BenchmarkingView. `corpus` is a plain-text rendering of the peer
// data (companies + benchmark answers + citations) built from peerBenchmarking.ts
// so the backend can ground strictly on it. `localFallback` is the sim result
// used offline or on error (the caller passes its keyword-match answer).
export async function aiPeer(
  question: string,
  corpus: string,
  localFallback: () => PeerResult,
): Promise<PeerResult> {
  if (API_MODE !== 'rest') return localFallback();
  try {
    const res = await apiFetch('/api/ai/peer', {
      method: 'POST',
      body: JSON.stringify({ question, corpus }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) throw new Error(`ai/peer ${res.status}`);
    const data = (await res.json()) as PeerResult;
    if (!data || typeof data.answer !== 'string') throw new Error('bad ai/peer shape');
    return { answer: data.answer, citations: Array.isArray(data.citations) ? data.citations : [] };
  } catch {
    return localFallback();
  }
}

// --- Draft generation -------------------------------------------------------
export interface AiDraftInput {
  sectionTitle: string;
  drRef: string;
  topic?: string;
  priorYearText?: string;
}

// Generate a first-draft paragraph for a subsection + disclosure requirement.
// Returns the model text when the backend is live and succeeds; otherwise null
// so the caller inserts its own placeholder (keeps the tracked-change flow alive
// offline / on error).
export async function aiDraft(input: AiDraftInput): Promise<string | null> {
  if (API_MODE !== 'rest') return null;
  try {
    const res = await apiFetch('/api/ai/draft', {
      method: 'POST',
      body: JSON.stringify({
        sectionTitle: input.sectionTitle,
        drRef: input.drRef,
        topic: input.topic ?? '',
        priorYearText: input.priorYearText ?? '',
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) throw new Error(`ai/draft ${res.status}`);
    const data = (await res.json()) as { text: string | null };
    return data && typeof data.text === 'string' && data.text.trim() ? data.text : null;
  } catch {
    return null;
  }
}

// --- Compliance gap rationale -----------------------------------------------
export interface AiComplianceInput {
  drId: string;
  title: string;
  status: string;
  sectionTitle?: string;
  requirementText?: string;
}
export interface GroundingSource { source: string; pageRef: string; }
export interface AiComplianceResult {
  rationale: string | null;
  suggestedFill: string | null;
  sources?: GroundingSource[];
}

// Explain why a DR is covered/partial/missing + suggest fill text. Returns the
// model result when the backend is live and succeeds; null offline or on error
// (caller keeps its seeded rationale).
export async function aiCompliance(input: AiComplianceInput): Promise<AiComplianceResult | null> {
  if (API_MODE !== 'rest') return null;
  try {
    const res = await apiFetch('/api/ai/compliance', {
      method: 'POST',
      body: JSON.stringify({
        drId: input.drId,
        title: input.title,
        status: input.status,
        sectionTitle: input.sectionTitle ?? '',
        requirementText: input.requirementText ?? '',
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) throw new Error(`ai/compliance ${res.status}`);
    const data = (await res.json()) as AiComplianceResult;
    if (!data || typeof data.rationale !== 'string' || !data.rationale.trim()) return null;
    return { rationale: data.rationale, suggestedFill: data.suggestedFill || null, sources: data.sources || [] };
  } catch {
    return null;
  }
}


// --- Section review (typo/style/consistency flags) --------------------------
// Returns model-found flags (same EditorFlag shape as the local regex analyzer)
// when the backend is live and succeeds; null offline or on error so the caller
// falls back to the local analyzeSection().
export async function aiAnalyze(content: string): Promise<EditorFlag[] | null> {
  if (API_MODE !== 'rest') return null;
  try {
    const res = await apiFetch('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) throw new Error(`ai/analyze ${res.status}`);
    const data = (await res.json()) as { flags: EditorFlag[] | null };
    return Array.isArray(data?.flags) ? data.flags : null;
  } catch {
    return null;
  }
}
