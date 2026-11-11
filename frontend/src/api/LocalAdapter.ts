// ---------------------------------------------------------------------------
// LocalAdapter — implements the data-access ports over browser localStorage,
// reproducing the EXACT semantics the app used before the api/ seam existed:
//   - the same versioned keys (`<name>:v4`, `structure-*:v3`, evidence `:v3`),
//   - the same seeds / fallbacks / shape-validation,
//   - the same best-effort try/catch tolerance for corrupt or absent blobs.
//
// This is the default adapter: with it selected the demo behaves byte-for-byte
// as it did with direct localStorage access (99 E2E stay green). It also doubles
// as a dev/offline fallback once the RestAdapter is the production default.
// ---------------------------------------------------------------------------

import type {
  Api,
  Doc,
  ReportApi,
  StructureApi,
  TrackedDraftsApi,
  UploadedFileRecord,
} from './ports';

import { reportSections, demoSectionProgressSeed, normalizeSections } from '../data/reportSections';
import type { SectionProgressMap } from '../data/reportSections';
import type { ReportSection } from '../data/reportSections';
import { initialTrackedChanges } from '../data/editorChanges';
import { initialApprovalRecords } from '../data/editorApprovals';
import { initialSectionLocks } from '../data/sectionLocks';
import { initialCommentThreads } from '../data/comments';
import { seedEvidence, SECTION_EVIDENCE_KEY } from '../data/sectionEvidence';
import type { EvidenceDoc } from '../data/sectionEvidence';
import { SECTION_VERSIONS_KEY } from '../data/sectionVersions';
import type { SectionVersion } from '../data/sectionVersions';
import type { RollForwardResolution } from '../data/rollForwardItems';
import type { L2SignOffState } from '../components/editor/ConsolidatedSectionView';
import { initialAuditReleases, type AuditReleaseMap } from '../data/auditRelease';
import { EMPTY_CHECKLIST_STORE, type DatapointChecklistStore } from '../data/datapointChecklist';
import {
  baselineRows, DRAFT_KEY, VERSIONS_KEY, PUBLISHED_KEY,
  PUBLISHED_VERSIONS_KEY, APPLIED_KEY,
} from '../data/structureStore';

// --- Editor channel key scheme (mirrors EditorView / workflowStatus) ----------
// v5 (Adrian 2026-08-31): SubsectionRoles changed shape (inputProviders[] +
// legalOwners[]) and IP L3 sign-off became a section-progress map, so stale v4
// caches must be invalidated and reseeded rather than mis-loaded.
const SCHEMA_VERSION = 'v5';
const key = (name: string) => `${name}:${SCHEMA_VERSION}`;

function readJSON<T>(k: string, fallback: T, isValid?: (v: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(k: string, value: T): void {
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch {
    /* storage unavailable / quota — best effort, same as before */
  }
}

// A versioned editor channel (`editor-*:v4`) as an async Doc.
function channelDoc<T>(name: string, seed: T, isValid?: (v: unknown) => boolean): Doc<T> {
  const k = key(name);
  return {
    get: async () => readJSON<T>(k, seed, isValid),
    set: async (value: T) => writeJSON(k, value),
    clear: async () => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    },
  };
}

// A store with a hard-coded (non-SCHEMA_VERSION) key, e.g. evidence `:v3`.
function fixedDoc<T>(k: string, seed: T, isValid?: (v: unknown) => boolean): Doc<T> {
  return {
    get: async () => readJSON<T>(k, seed, isValid),
    set: async (value: T) => writeJSON(k, value),
    clear: async () => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    },
  };
}

// Sections blob is only usable if every entry has the fields the view reads
// (identical check to EditorView.sectionsValid — a pre-Wave-2 cache lacks
// roles.owners[] and would crash the editor).
const sectionsValid = (v: unknown): boolean =>
  Array.isArray(v) && v.length > 0 && v.every(s =>
    s && typeof s === 'object' &&
    typeof (s as ReportSection).content === 'string' &&
    (s as ReportSection).roles != null &&
    Array.isArray((s as ReportSection).roles?.owners) &&
    (s as ReportSection).rollForwardStatus != null);

// --- Editor channels ----------------------------------------------------------
// Normalize role shape on read as defence-in-depth: even though the v5 schema key
// abandons pre-2026-08-31 caches, any surviving old-shape blob is coerced to the
// current SubsectionRoles so the editor never crashes on inputProviders/legalOwners.
const sectionsRaw = channelDoc<ReportSection[]>('editor-sections', reportSections, sectionsValid);
const sections: Doc<ReportSection[]> = {
  get: async () => normalizeSections(await sectionsRaw.get()),
  set: sectionsRaw.set,
  clear: sectionsRaw.clear,
};
const changes = channelDoc('editor-changes', initialTrackedChanges);
const approvals = channelDoc('editor-approvals', initialApprovalRecords);
const locks = channelDoc('editor-locks', initialSectionLocks);
const sectionProgress = channelDoc<SectionProgressMap>('editor-section-progress', demoSectionProgressSeed);
const comments = channelDoc('editor-comments', initialCommentThreads);
const l2Signoff = channelDoc<Record<string, L2SignOffState>>('editor-l2-signoff', {});
const auditReleases = channelDoc<AuditReleaseMap>('editor-audit-releases', initialAuditReleases);
const datapointChecklist = channelDoc<DatapointChecklistStore>('editor-datapoint-checklist', EMPTY_CHECKLIST_STORE);
const aiBaselineAccepted = channelDoc<string[]>('editor-ai-baseline-accepted', []);
const rollForward = channelDoc<Record<string, RollForwardResolution>>('editor-rollforward', {});

// --- Standalone report stores -------------------------------------------------
// Keys imported from their owning data modules so there is ONE source of truth.
const versions = fixedDoc<SectionVersion[]>(SECTION_VERSIONS_KEY, []);

// Evidence: seed a fresh copy on empty; validate it is an array (the semantics
// the old loadEvidence() had — an absent or non-array blob falls back to seed).
const evidence: Doc<EvidenceDoc[]> = {
  get: async () => {
    const v = readJSON<unknown>(SECTION_EVIDENCE_KEY, null);
    if (!Array.isArray(v)) return [...seedEvidence];
    return v as EvidenceDoc[];
  },
  set: async (value) => writeJSON(SECTION_EVIDENCE_KEY, value),
  clear: async () => { try { localStorage.removeItem(SECTION_EVIDENCE_KEY); } catch { /* ignore */ } },
};

// --- In-editor open track-changes drafts (side-channel, keyed by section) -----
const TC_DRAFTS_KEY = 'editor-tc-drafts:v4';
type DraftMap = Record<string, string>;
function loadDraftMap(): DraftMap {
  try {
    const raw = localStorage.getItem(TC_DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed as DraftMap : {};
  } catch { return {}; }
}
const trackedDrafts: TrackedDraftsApi = {
  get: async (sectionId) => {
    const html = loadDraftMap()[sectionId];
    return typeof html === 'string' && html.length > 0 ? html : null;
  },
  set: async (sectionId, html) => {
    const map = loadDraftMap();
    map[sectionId] = html;
    writeJSON(TC_DRAFTS_KEY, map);
  },
  remove: async (sectionId) => {
    const map = loadDraftMap();
    if (sectionId in map) { delete map[sectionId]; writeJSON(TC_DRAFTS_KEY, map); }
  },
  clearAll: async () => { try { localStorage.removeItem(TC_DRAFTS_KEY); } catch { /* ignore */ } },
};

// Reset the whole report authoring state to seeds (Reset Demo). Clears the nine
// editor channels + versions + tc-drafts, exactly as EditorView.resetDemo did.
// Evidence uses resetEvidence() semantics (remove -> falls back to seed).
async function reset(): Promise<void> {
  await Promise.all([
    sections.clear(), changes.clear(), approvals.clear(), locks.clear(),
    sectionProgress.clear(), comments.clear(), l2Signoff.clear(),
    auditReleases.clear(), datapointChecklist.clear(), aiBaselineAccepted.clear(), rollForward.clear(),
    versions.clear(), evidence.clear(), trackedDrafts.clearAll(),
  ]);
}

const report: ReportApi = {
  sections, changes, approvals, locks, sectionProgress, comments, l2Signoff,
  auditReleases, datapointChecklist, aiBaselineAccepted, rollForward, versions, evidence, trackedDrafts, reset,
};

// --- Structure admin channel (structure-*:v3) ---------------------------------
// Keys imported from structureStore (single source of truth). The draft defaults
// to the code baseline (matching the old loadDraft()); the rest to empty/null.
const structure: StructureApi = {
  draft: {
    get: async () => readJSON(DRAFT_KEY, baselineRows()),
    set: async (v) => writeJSON(DRAFT_KEY, v),
    clear: async () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } },
  },
  versions: fixedDoc(VERSIONS_KEY, []),
  published: fixedDoc(PUBLISHED_KEY, null),
  publishedVersions: fixedDoc(PUBLISHED_VERSIONS_KEY, []),
  applied: fixedDoc(APPLIED_KEY, null),
};

// --- Uploaded source files (unversioned key, historical) ----------------------
const uploads: Doc<UploadedFileRecord[]> = {
  get: async () => readJSON<UploadedFileRecord[]>('uploaded-rnfm-files', []),
  set: async (v) => writeJSON('uploaded-rnfm-files', v),
  clear: async () => { try { localStorage.removeItem('uploaded-rnfm-files'); } catch { /* ignore */ } },
};

export const localAdapter: Api = { report, structure, uploads };
