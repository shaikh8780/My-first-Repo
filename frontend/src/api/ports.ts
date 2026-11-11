// ---------------------------------------------------------------------------
// Data-access ports (hexagonal / ports-and-adapters).
//
// Every piece of report state the studio persists is modelled here as an ASYNC,
// resource-oriented document. Components talk ONLY to these interfaces (via the
// `api` singleton in ./index) — never to localStorage directly. Two adapters
// implement them:
//   - LocalAdapter  — wraps today's versioned localStorage blobs (default).
//   - RestAdapter   — talks to the FastAPI backend over Cognito-authed fetch.
//
// Because a real HTTP/DynamoDB backend IS async and resource-shaped, swapping
// LocalAdapter -> RestAdapter later is a config change (VITE_API_MODE), not a
// rewrite of call sites. This is the seam the Novartis-environment move turns on.
// ---------------------------------------------------------------------------

import type { ReportSection, SectionProgressMap } from '../data/reportSections';
import type { TrackedChange } from '../data/editorChanges';
import type { ApprovalRecord } from '../data/editorApprovals';
import type { SectionLock } from '../data/sectionLocks';
import type { CommentThread } from '../data/comments';
import type { SectionVersion } from '../data/sectionVersions';
import type { EvidenceDoc } from '../data/sectionEvidence';
import type { RollForwardResolution } from '../data/rollForwardItems';
import type {
  StructRow,
  StructVersion,
  PublishedStructure,
  PublishedVersion,
} from '../data/structureStore';
import type { L2SignOffState } from '../components/editor/ConsolidatedSectionView';
import type { AuditReleaseMap } from '../data/auditRelease';
import type { DatapointChecklistStore } from '../data/datapointChecklist';

// A single persisted document. `get` always resolves (to the stored value or the
// resource's seed/default); `set` replaces it; `clear` resets it to the default.
export interface Doc<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
  clear(): Promise<void>;
}

// Uploaded source files shown on the Upload view (shape kept local to that view
// historically; mirrored here so the port is self-describing).
export interface UploadedFileRecord {
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
}

// Report-structure admin channel (draft / published / applied + version history).
export interface StructureApi {
  draft: Doc<StructRow[]>;
  versions: Doc<StructVersion[]>;
  published: Doc<PublishedStructure | null>;
  publishedVersions: Doc<PublishedVersion[]>;
  applied: Doc<StructRow[] | null>;
}

// In-editor open track-changes suggestions, keyed by section id (side-channel
// that lets unsaved suggestion marks survive a reload). Distinct per section, so
// it is a keyed collection rather than a single Doc.
export interface TrackedDraftsApi {
  get(sectionId: string): Promise<string | null>;
  set(sectionId: string, html: string): Promise<void>;
  remove(sectionId: string): Promise<void>;
  clearAll(): Promise<void>;
}

// Everything that belongs to a report's authoring state. These are the nine
// editor channels + the standalone version/evidence stores. Today they are
// report-agnostic (single active report); the adapter carries the report scope
// so the REST implementation can key by report without changing call sites.
export interface ReportApi {
  sections: Doc<ReportSection[]>;
  changes: Doc<TrackedChange[]>;
  approvals: Doc<ApprovalRecord[]>;
  locks: Doc<SectionLock[]>;
  // Pre-sign-off editing progress: section id → 'edited' | 'updated'
  // (Adrian 2026-08-31; replaced the IP L3 sign-off list).
  sectionProgress: Doc<SectionProgressMap>;
  comments: Doc<CommentThread[]>;
  l2Signoff: Doc<Record<string, L2SignOffState>>;
  // Sections an Owner has released to the external Auditor view (Adrian 2026-08-31).
  auditReleases: Doc<AuditReleaseMap>;
  // Customer-maintained disclosure-checklist Excel, ingested + versioned as the
  // authoritative datapoint source of truth (Thevi, 21 Aug 2026).
  datapointChecklist: Doc<DatapointChecklistStore>;
  aiBaselineAccepted: Doc<string[]>;
  rollForward: Doc<Record<string, RollForwardResolution>>;
  versions: Doc<SectionVersion[]>;
  evidence: Doc<EvidenceDoc[]>;
  trackedDrafts: TrackedDraftsApi;
  // Reset the whole report authoring state back to seeds (Reset Demo).
  reset(): Promise<void>;
}

// The full data-access surface exposed to the app.
export interface Api {
  report: ReportApi;
  structure: StructureApi;
  uploads: Doc<UploadedFileRecord[]>;
}
