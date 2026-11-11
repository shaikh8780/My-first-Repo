// Admin config client — app-wide AI tuning, global context, thresholds, and
// knowledge-base refresh. Talks to the admin-gated /api/admin/* routes when the
// backend is live (VITE_API_MODE=rest); returns local defaults offline so the
// admin panel still renders (edits just won't persist without the backend).

import { API_MODE } from './index';
import { apiFetch } from '../services/apiClient';

export type AiCapability = 'chat' | 'peer' | 'draft' | 'compliance' | 'analyze';

// Verification & Validation framework (Novartis review, 21 Aug 2026). AI output quality
// can only be truly validated on real data in Novartis's environment; this is the
// structured UAT / prompt-tuning / audit methodology the team works through, with
// a status per activity so progress is tracked and auditable.
export type VvStatus = 'not_started' | 'in_progress' | 'blocked' | 'passed';
export interface VvActivity {
  id: string;
  phase: 'uat' | 'tuning' | 'audit' | 'compliance';
  title: string;
  description: string;
  status: VvStatus;
  owner: string;
  note: string;
}

export interface AdminConfig {
  promptOverrides: Record<AiCapability, string>;
  globalContext: string;
  kb: { lastRefreshRequestedAt: string | null; lastRefreshBy: string | null; status: string };
  thresholds: { minConfidence: number | null; alertsEnabled: boolean; rules: unknown[] };
  vv: { activities: VvActivity[]; environment: 'prototype_synthetic' | 'novartis_uat' | 'novartis_prod'; lastUpdatedAt: string | null };
}

// The default V&V activity set — the methodology to work through once real data
// is connected in the Novartis environment. Editable + tracked in the Admin panel.
export const DEFAULT_VV_ACTIVITIES: VvActivity[] = [
  { id: 'vv-data',    phase: 'uat',        title: 'Connect Novartis data sources', description: 'Replace synthetic data with real prior-year reports, policies, DMA checklist and MDD template in the Novartis environment.', status: 'not_started', owner: 'Novartis', note: '' },
  { id: 'vv-ground',  phase: 'tuning',     title: 'Ground + tune AI context', description: 'Set the admin AI instructions/context per capability so drafts and gap suggestions reflect Novartis policy and tone; iterate.', status: 'not_started', owner: 'ESG Lead', note: '' },
  { id: 'vv-content', phase: 'uat',        title: 'Content UAT on real sections', description: 'SMEs review AI drafts for factual accuracy and completeness against source data (not just the process).', status: 'not_started', owner: 'SMEs', note: '' },
  { id: 'vv-gap',     phase: 'uat',        title: 'Gap-analysis accuracy check', description: 'Validate coverage classification (covered/partial/missing) and peer-informed suggestions against the DMA-filtered checklist.', status: 'not_started', owner: 'ESG + Compliance', note: '' },
  { id: 'vv-halluc',  phase: 'audit',      title: 'Hallucination / citation audit', description: 'Sample AI claims and confirm each traces to a real source; target 0% fabricated figures.', status: 'not_started', owner: 'Compliance', note: '' },
  { id: 'vv-thresh',  phase: 'tuning',     title: 'Set confidence thresholds & alerts', description: 'Define the minimum confidence to auto-surface a suggestion and the alerting on breaches.', status: 'not_started', owner: 'ESG Lead', note: '' },
  { id: 'vv-audit',   phase: 'compliance', title: 'Audit trail & assurance readiness', description: 'Confirm the audit trail, sign-off records and evidence satisfy external assurance and internal compliance policy.', status: 'not_started', owner: 'Legal / Compliance', note: '' },
];

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  promptOverrides: { chat: '', peer: '', draft: '', compliance: '', analyze: '' },
  globalContext: '',
  kb: { lastRefreshRequestedAt: null, lastRefreshBy: null, status: 'idle' },
  thresholds: { minConfidence: null, alertsEnabled: false, rules: [] },
  vv: { activities: DEFAULT_VV_ACTIVITIES, environment: 'prototype_synthetic', lastUpdatedAt: null },
};

async function json<T>(url: string, init: RequestInit | undefined, fallback: T): Promise<T> {
  if (API_MODE !== 'rest') return fallback;
  try {
    const res = await apiFetch(url, init);
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) throw new Error(`${url} ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export function getAdminConfig(): Promise<AdminConfig> {
  return json('/api/admin/config', undefined, DEFAULT_ADMIN_CONFIG);
}

export function saveAdminConfig(cfg: AdminConfig): Promise<AdminConfig> {
  return json('/api/admin/config', { method: 'PUT', body: JSON.stringify(cfg) }, cfg);
}

export interface KbRefreshResult {
  status: string; requestedAt?: string; requestedBy?: string; live?: boolean; message: string;
}

export function refreshKnowledgeBase(): Promise<KbRefreshResult> {
  return json('/api/admin/kb/refresh', { method: 'POST', body: '{}' }, {
    status: 'unavailable',
    message: 'Backend not reachable — knowledge-base refresh requires the live backend.',
  });
}
