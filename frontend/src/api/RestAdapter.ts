// ---------------------------------------------------------------------------
// RestAdapter — implements the data-access ports against the FastAPI backend
// (ECS Fargate + DynamoDB), over the Cognito-authed `apiFetch`. Selected when
// VITE_API_MODE=rest (the deployed production config). Every port method maps
// 1:1 to a `/api/*` route.
//
// FALLBACKS = CODE SEEDS (not empty). When the backend has no document for a
// channel yet (a fresh/empty DynamoDB, or right after `reset()` deletes the
// report scope), the API returns 404 and this adapter returns the SAME code
// seed the LocalAdapter uses — so the app always has a coherent starting state
// and the editor renders. The first save then persists to the backend, which
// becomes the source of truth from then on. Without this, an empty backend hands
// the editor `sections = []` -> no section to show -> blank editor.
//
// Route surface (per CLAUDE.md "API routes: /api/{resource}"), all report-scoped
// under the active report id:
//   GET/PUT /api/reports/{reportId}/sections            (and /changes, /approvals,
//                     /locks, /ip-signoff, /comments, /l2-signoff,
//                     /ai-baseline, /rollforward, /versions, /evidence)
//   GET/PUT/DELETE /api/reports/{reportId}/tracked-drafts/{sectionId}
//   POST /api/reports/{reportId}/reset
//   GET/PUT /api/structure/{draft|published|applied|versions|published-versions}
//   GET/PUT /api/uploads
// ---------------------------------------------------------------------------

import type { Api, Doc, ReportApi, StructureApi, TrackedDraftsApi, UploadedFileRecord } from './ports';
import { reportSections, demoSectionProgressSeed, normalizeSections, type ReportSection, type SectionProgressMap } from '../data/reportSections';
import { initialTrackedChanges, type TrackedChange } from '../data/editorChanges';
import { initialApprovalRecords, type ApprovalRecord } from '../data/editorApprovals';
import { initialSectionLocks, type SectionLock } from '../data/sectionLocks';
import { initialCommentThreads, type CommentThread } from '../data/comments';
import type { SectionVersion } from '../data/sectionVersions';
import { seedEvidence, type EvidenceDoc } from '../data/sectionEvidence';
import type { RollForwardResolution } from '../data/rollForwardItems';
import { baselineRows, type StructRow, type StructVersion, type PublishedStructure, type PublishedVersion } from '../data/structureStore';
import type { L2SignOffState } from '../components/editor/ConsolidatedSectionView';
import { initialAuditReleases, type AuditReleaseMap } from '../data/auditRelease';
import { EMPTY_CHECKLIST_STORE, type DatapointChecklistStore } from '../data/datapointChecklist';
import { apiFetch } from '../services/apiClient';

// The active report scope. Today the app is single-report (rnfm); the backend
// keys report state by id, so we pass it through. Wired to the real active-report
// selection when the RestAdapter becomes the default.
const REPORT_ID = 'rnfm';
const base = `/api/reports/${REPORT_ID}`;

async function getJSON<T>(url: string, fallback: T): Promise<T> {
  const res = await apiFetch(url);
  if (res.status === 404) return fallback; // not yet created server-side -> seed/default
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);

  // Workaround for the CloudFront SPA fallback: the distribution rewrites any
  // origin 403/404 to `200 + /index.html` so client-side routes work on refresh.
  // That rule is distribution-wide, so a backend "document not found" (404) also
  // comes back as 200 with an HTML body instead of a real 404. Detect that here
  // (non-JSON content-type, or a body that fails to parse as JSON) and treat it
  // as "missing" -> return the fallback, exactly as a true 404 would. This keeps
  // the adapter correct regardless of the CloudFront config; the proper infra
  // fix (scoping the SPA fallback off /api/*) is tracked separately.
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return fallback;
  }
  try {
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function putJSON<T>(url: string, value: T): Promise<void> {
  const res = await apiFetch(url, { method: 'PUT', body: JSON.stringify(value) });
  if (!res.ok) throw new Error(`PUT ${url} -> ${res.status}`);
}

async function del(url: string): Promise<void> {
  const res = await apiFetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`DELETE ${url} -> ${res.status}`);
}

// A REST-backed document at `<base>/<path>`. `clear` deletes it so the next GET
// falls back to the server-side seed (parallel to localStorage.removeItem).
function restDoc<T>(url: string, fallback: T): Doc<T> {
  return {
    get: () => getJSON<T>(url, fallback),
    set: (value) => putJSON(url, value),
    clear: () => del(url),
  };
}

const trackedDrafts: TrackedDraftsApi = {
  get: (sectionId) => getJSON<string | null>(`${base}/tracked-drafts/${sectionId}`, null),
  set: (sectionId, html) => putJSON(`${base}/tracked-drafts/${sectionId}`, html),
  remove: (sectionId) => del(`${base}/tracked-drafts/${sectionId}`),
  clearAll: () => del(`${base}/tracked-drafts`),
};

// Sections need role-shape normalization on read: the backend may return the
// pre-2026-08-31 roles shape (inputProvider:string, no legalOwners), which would
// crash the UI's inputProviders/legalOwners access. Wrap the doc so every read
// is coerced to the current SubsectionRoles.
const sectionsDoc = restDoc<ReportSection[]>(`${base}/sections`, reportSections);

const report: ReportApi = {
  // Channels WITH code seeds fall back to those seeds (parity with LocalAdapter)
  // so an empty backend still yields a coherent, renderable report.
  sections: {
    get: async () => normalizeSections(await sectionsDoc.get()),
    set: sectionsDoc.set,
    clear: sectionsDoc.clear,
  },
  changes: restDoc<TrackedChange[]>(`${base}/changes`, initialTrackedChanges),
  approvals: restDoc<ApprovalRecord[]>(`${base}/approvals`, initialApprovalRecords),
  locks: restDoc<SectionLock[]>(`${base}/locks`, initialSectionLocks),
  sectionProgress: restDoc<SectionProgressMap>(`${base}/section-progress`, demoSectionProgressSeed),
  comments: restDoc<CommentThread[]>(`${base}/comments`, initialCommentThreads),
  evidence: restDoc<EvidenceDoc[]>(`${base}/evidence`, seedEvidence),
  // Channels with no seed (genuinely empty until the user acts) stay empty.
  l2Signoff: restDoc<Record<string, L2SignOffState>>(`${base}/l2-signoff`, {}),
  auditReleases: restDoc<AuditReleaseMap>(`${base}/audit-releases`, initialAuditReleases),
  datapointChecklist: restDoc<DatapointChecklistStore>(`${base}/datapoint-checklist`, EMPTY_CHECKLIST_STORE),
  aiBaselineAccepted: restDoc<string[]>(`${base}/ai-baseline`, []),
  rollForward: restDoc<Record<string, RollForwardResolution>>(`${base}/rollforward`, {}),
  versions: restDoc<SectionVersion[]>(`${base}/versions`, []),
  trackedDrafts,
  reset: async () => {
    const res = await apiFetch(`${base}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`POST ${base}/reset -> ${res.status}`);
  },
};

const structure: StructureApi = {
  // Draft structure falls back to the code baseline (parity with LocalAdapter).
  draft: restDoc<StructRow[]>(`/api/structure/draft`, baselineRows()),
  versions: restDoc<StructVersion[]>(`/api/structure/versions`, []),
  published: restDoc<PublishedStructure | null>(`/api/structure/published`, null),
  publishedVersions: restDoc<PublishedVersion[]>(`/api/structure/published-versions`, []),
  applied: restDoc<StructRow[] | null>(`/api/structure/applied`, null),
};

const uploads: Doc<UploadedFileRecord[]> = restDoc<UploadedFileRecord[]>(`/api/uploads`, []);

export const restAdapter: Api = { report, structure, uploads };
