import { useState, useCallback, useEffect } from 'react';
import { reportSections, reportMetadata, rollForwardLabels, rollForwardColors, demoSectionProgressSeed, primaryInputProvider, allRequiredOwnersSigned, type ReportSection, type WorkflowStage, type SectionProgressMap, type SectionProgress } from '../data/reportSections';
import { deriveStatus } from '../data/workflowStatus';
import { initialApprovalRecords, type ApprovalRecord } from '../data/editorApprovals';
import { initialTrackedChanges, revertPendingChanges, type TrackedChange } from '../data/editorChanges';
import { coverageForDr } from '../data/complianceMappings';
import { useSearchParams } from 'react-router-dom';
import { initialSectionLocks, findLock, type SectionLock } from '../data/sectionLocks';
import { useAuth } from '../auth/useAuth';
import { generateAndDownloadDocx } from '../utils/exportDocx';
import { generateAndDownloadPdf } from '../utils/exportPdf';
import SectionSidebar from './editor/SectionSidebar';
import ContentViewer from './editor/ContentViewer';
import StandardTextPopup from './editor/StandardTextPopup';
import ContentEditor from './editor/ContentEditor';
import RichContentEditor from './editor/RichContentEditor';
import SuggestingEditor from './editor/SuggestingEditor';
import { isEnabled } from '../config/featureFlags';
import ApprovalPanel from './editor/ApprovalPanel';
import ChangeTracker from './editor/ChangeTracker';
import AiAssistantPanel from './editor/AiAssistantPanel';
import CommentsPanel from './editor/CommentsPanel';
import { initialCommentThreads, isUnresolved, type CommentThread } from '../data/comments';
import { initialAuditReleases, type AuditReleaseMap } from '../data/auditRelease';
import ConsolidatedSectionView, { type L2SignOffState } from './editor/ConsolidatedSectionView';
import CollapsibleCard from './editor/CollapsibleCard';
import VersionHistoryModal from './editor/VersionHistoryModal';
import RollForwardChecklist from './editor/RollForwardChecklist';
import { RollForwardRedline, RollForwardChangeList, WorkingRedline, PriorYearSection, DraftViewToggle, type DraftView } from './editor/RollForwardCompare';
import { rollForwardItemsFor, type RollForwardResolution } from '../data/rollForwardItems';
import {
  diffStructures, applyStructureToSections,
  baselineRows, type StructRow, PUBLISHED_KEY,
} from '../data/structureStore';
import {
  isEditor, isOwner, EDITOR_TEAM, canEditSubsection, type ActingRole,
} from '../data/workflowRoles';
import {
  snapshotVersion, makeVersion,
  type SectionVersion, type VersionTrigger,
} from '../data/sectionVersions';
import {
  evidenceForSection, EVIDENCE_KIND_LABEL,
  type EvidenceDoc, type EvidenceKind,
} from '../data/sectionEvidence';
import EvidencePanel from './editor/EvidencePanel';
import type { EditorFlag } from '../data/aiEditor';
import { api } from '../api';
import { aiDraft } from '../api/aiClient';
import type { PublishedStructure } from '../data/structureStore';

const stageOrder: WorkflowStage[] = ['draft', 'sme_review', 'legal_review', 'approved', 'exported'];

// Bump when the persisted shape changes so stale caches from an older build are
// abandoned rather than rehydrated into code that expects new fields. The P0-P3
// tuning reshaped ReportSection (added roles, rollForwardStatus, contentFormat,
// ref, topicL1...), so pre-tuning caches under the old keys would crash the view.
// v3: structure reconciled to the blueprint (86 subsections (Human Rights now a separate report), new refs) and
// front-matter items promoted to standalone L1s — the persisted section shape
// changed, so abandon v2 caches rather than rehydrate the old structure.
// v4: Wave 2 reshaped SubsectionRoles ({inputProvider, informed, ownerSignoff,
// legalSignoff} → {inputProvider, owners: string[]}). A v3 cache from before
// Coverage-status colour + glyph for the datapoint chips (matches ComplianceView).
const COVERAGE_STATUS: Record<string, { color: string; glyph: string; label: string }> = {
  covered: { color: '#16a34a', glyph: '✓', label: 'Covered' },
  partial: { color: '#f59e0b', glyph: '◐', label: 'Partially covered' },
  missing: { color: '#ef4444', glyph: '✗', label: 'Missing' },
};

// Best-effort cleanup of caches written by older builds (unversioned + prior
// versioned keys) so returning users don't render a stale structure. The current
// live keys (`<name>:v4`) are owned by the data-access layer (api.report.*) and
// its LocalAdapter; only the legacy unversioned/v2/v3 blobs are purged here.
// 'editor-section-evidence' is intentionally excluded — its live key is ':v3'.
for (const name of [
  'editor-sections', 'editor-approvals', 'editor-changes', 'editor-locks',
  'editor-ip-signoff', 'editor-section-progress', 'editor-comments', 'editor-l2-signoff',
  'editor-ai-baseline-accepted', 'editor-rollforward',
]) {
  localStorage.removeItem(name);
  localStorage.removeItem(`${name}:v2`);
  localStorage.removeItem(`${name}:v3`);
  // v4 SubsectionRoles shape / IP-signoff list are stale under v5 (2026-08-31).
  localStorage.removeItem(`${name}:v4`);
}

export default function EditorView() {
  // All authoring state now flows through the data-access layer (api.report.*).
  // useState seeds with the code defaults for the first paint; a single hydration
  // effect (below) loads the persisted/backend state and reconciles it. `hydrated`
  // gates the main render so we never flash seed content over persisted content
  // (and so a real backend's latency is handled cleanly under RestAdapter).
  const [hydrated, setHydrated] = useState(false);
  const [sections, setSections] = useState<ReportSection[]>(reportSections);
  const [selectedSection, setSelectedSection] = useState<ReportSection>(reportSections[0]);
  const [editMode, setEditMode] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  // Wave 3 — per-section evidence documents (grounding context for the AI).
  const [evidence, setEvidence] = useState<EvidenceDoc[]>([]);
  const [showCitation, setShowCitation] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(initialApprovalRecords);
  const [trackedChanges, setTrackedChanges] = useState<TrackedChange[]>(initialTrackedChanges);
  const [toast, setToast] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  // Export scope (Adrian 2026-08-31): whole document, or a chosen subset of
  // sections. `exportSel` holds the selected subsection ids when scope = 'choose'.
  const [exportScope, setExportScope] = useState<'all' | 'choose'>('all');
  const [exportSel, setExportSel] = useState<Set<string>>(new Set());
  // Draft area tabs (13 Jul 2026 feedback): 'editor' = tracked changes (Editor
  // only), 'clean' = final accepted text (all roles). Defaults to clean.
  const [draftView, setDraftView] = useState<DraftView>('clean');
  // Datapoint whose details (coverage + rationale + requirement text) are shown
  // in a popup. Single "View details" surface — no page navigation (2026-07-15).
  const [standardTextDr, setStandardTextDr] = useState<string | null>(null);
  const { alias } = useAuth();
  const loginUser = alias ? alias.charAt(0).toUpperCase() + alias.slice(1) : 'You (ESG Lead)';

  // Deep-link: /editor?section=<id> (from the Dashboard "My Open Tasks" card,
  // 2026-07-15). Select that subsection on arrival so a task click lands on the
  // right section, then clear the param so a later manual selection sticks.
  const [searchParams, setSearchParams] = useSearchParams();
  const focusSection = searchParams.get('section');
  useEffect(() => {
    if (!focusSection) return;
    const target = sections.find(s => s.id === focusSection);
    if (target) { setSelectedSection(target); setSelectedL2(null); setEditMode(false); }
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSection]);

  const [locks, setLocks] = useState<SectionLock[]>(initialSectionLocks);

  // Section progress (Adrian 2026-08-31): Input Providers no longer sign off.
  // Instead an IP edit marks a subsection 'edited'; the Editor advances it to
  // 'updated' once all comments are addressed. 'updated' is the prerequisite for
  // L2 owner sign-off. Stored as a map of subsection id → 'edited' | 'updated'.
  // Distinct from the concurrent-edit `locks` above (who is actively typing).
  const [sectionProgress, setSectionProgress] = useState<SectionProgressMap>(demoSectionProgressSeed);
  const persistSectionProgress = (next: SectionProgressMap) => { setSectionProgress(next); void api.report.sectionProgress.set(next); };
  // Set (or clear) a subsection's progress marker and persist.
  const setProgressFor = (sectionId: string, value: SectionProgress | null) => {
    const next = { ...sectionProgress };
    if (value === null) delete next[sectionId]; else next[sectionId] = value;
    persistSectionProgress(next);
  };

  // Comments & change-requests raised on subsections (Owner/Legal → Editors).
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>(initialCommentThreads);
  const persistComments = (next: CommentThread[]) => { setCommentThreads(next); void api.report.comments.set(next); };
  const addComment = (t: CommentThread) => { persistComments([...commentThreads, t]); showToast(t.kind === 'request' ? 'Request raised — routed to Editors/Admins' : 'Comment added'); };
  const updateComment = (t: CommentThread) => { persistComments(commentThreads.map(c => c.id === t.id ? t : c)); };

  // L2 consolidated view selection (topicL1 + topicL2). When set, the content area
  // shows the whole section as one document instead of a single subsection.
  const [selectedL2, setSelectedL2] = useState<{ topicL1: string; topicL2: string } | null>(null);
  // Per-L2 Owner/Legal sign-off records, keyed "topicL1||topicL2".
  const [l2SignOffs, setL2SignOffs] = useState<Record<string, L2SignOffState>>({});
  const persistL2SignOffs = (next: Record<string, L2SignOffState>) => { setL2SignOffs(next); void api.report.l2Signoff.set(next); };
  const l2Key = (l1: string, l2: string) => `${l1}||${l2}`;

  // Sections an Owner has released to the external Auditor view (Adrian 2026-08-31).
  const [auditReleases, setAuditReleases] = useState<AuditReleaseMap>(initialAuditReleases);
  const persistAuditReleases = (next: AuditReleaseMap) => { setAuditReleases(next); void api.report.auditReleases.set(next); };

  // AI governance — simplified (13 Jul 2026 feedback, Zuzana/Adrian): no per-line
  // highlighting or reasons. The AI roll-forward is shown as ordinary tracked
  // changes vs FY2025 in the Editor view; a human confirms it once via a single
  // "Accept AI draft as working base" acceptance point. After acceptance the
  // FY2025 comparison is no longer shown and the draft is treated as clean text.
  const [aiBaselineAccepted, setAiBaselineAccepted] = useState<string[]>([]);
  const persistAiBaselineAccepted = (next: string[]) => { setAiBaselineAccepted(next); void api.report.aiBaselineAccepted.set(next); };
  // Roll-forward click-through (#13): per-item confirm/update/flag resolutions,
  // keyed by roll-forward item id and persisted across sessions.
  const [rollForwardResolutions, setRollForwardResolutions] = useState<Record<string, RollForwardResolution>>({});
  const resolveRollForward = (itemId: string, resolution: RollForwardResolution) => {
    // Only seats with edit rights may resolve roll-forward items (2026-07-15 fix):
    // a read-only / comment-only seat must not mutate the review. Guarded here in
    // addition to hiding the buttons, so the state can never be changed by a
    // seat that lacks edit rights.
    if (!canEditThis) { showToast('Only seats with edit rights can confirm or update roll-forward items'); return; }
    setRollForwardResolutions(prev => {
      const next = { ...prev, [itemId]: resolution };
      void api.report.rollForward.set(next);
      return next;
    });
  };
  const rollForwardItems = rollForwardItemsFor(selectedSection);
  // Snippets of roll-forward items the user FLAGGED — highlighted pink in the
  // editor content so "data not yet available" items are easy to spot (#4,
  // Adrian 2026-07-15).
  const flaggedSnippets = rollForwardItems
    .filter(it => rollForwardResolutions[it.id] === 'flagged')
    .map(it => it.snippet);

  // Whether the AI roll-forward baseline for this subsection has been accepted as
  // the working base. Only meaningful for AI-rolled-forward sections that have a
  // prior-year baseline to compare against (see needsAiAcceptance below, which
  // also depends on hasPriorYear defined further down).
  const aiBaselineIsAccepted = aiBaselineAccepted.includes(selectedSection.id);

  // FY2025 approved baseline for the roll-forward compare. Falls back to the
  // year-swapped current text only when no real prior-year text exists (e.g. a
  // subsection that is genuinely new in FY2026 has no baseline to compare).
  const priorYearText = selectedSection.priorYearContent
    ?? (selectedSection.rollForwardStatus === 'new' ? '' : selectedSection.content.replace(/2026/g, '2025'));
  const hasPriorYear = priorYearText.trim().length > 0;

  // A section shows the FY2025→2026 track-changes acceptance step only while it
  // has a prior-year baseline AND that baseline has not yet been accepted as the
  // working base. Once accepted (or if there is no baseline), the draft is clean
  // and only new edits are tracked going forward (13 Jul 2026 feedback #4/#6).
  const needsAiAcceptance = hasPriorYear && !aiBaselineIsAccepted;

  // Resizable subsections panel — drag the handle to widen/narrow it for
  // readability. The chosen width persists across sessions. Clamped so the panel
  // can't be dragged away entirely or crowd out the content area.
  const SIDEBAR_MIN = 200;
  const SIDEBAR_MAX = 560;
  const SIDEBAR_WIDTH_KEY = 'editor-sidebar-width';
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return stored >= SIDEBAR_MIN && stored <= SIDEBAR_MAX ? stored : 240;
  });
  const startSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + (ev.clientX - startX)));
      setSidebarWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setSidebarWidth(w => { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w)); return w; });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  // Per-subsection version history — a snapshot is frozen at every meaningful
  // transition: each saved edit and each sign-off (IP → Owner → Legal), plus
  // when an approved section is re-opened. This makes the history a full audit
  // timeline that a reviewer can diff between.
  const [sectionVersions, setSectionVersions] = useState<SectionVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  // Confirm dialog shown before re-editing an already-Approved section.
  const [reEditConfirm, setReEditConfirm] = useState<string | null>(null);

  // Demo "view as role" — the approval flow is role-gated, but a single demo
  // user needs to walk every seat. The acting identity is the assigned person
  // for the chosen role on the selected section, so gating passes for that role
  // without a silent bypass. Lands on Admin (the ESG Reporting Lead — the primary
  // persona and full-access seat); switch to any other role to see its exact
  // permissions. 'owner2' is the SAME role as 'owner', bound to the second
  // assigned owner (multi-owner sections) so the "all owners must sign" L2 rule
  // is demonstrable. There is deliberately no separate "Me" seat: it used to
  // auto-elevate to Editor and masked true per-role behaviour.
  const [viewAsRole, setViewAsRole] = useState<ActingRole | 'owner2'>('admin');

  // Structure-sync: a pending publish from the Section Structure admin page that
  // the editor user should review before applying. Computed against what the
  // editor last applied (or the code baseline on first load).
  const [pendingPublish, setPendingPublish] = useState<PublishedStructure | null>(null);
  const [showStructReview, setShowStructReview] = useState(false);
  const [appliedStructure, setAppliedStructure] = useState<StructRow[]>(() => baselineRows());
  const structDiff = pendingPublish ? diffStructures(appliedStructure, pendingPublish.rows) : null;
  const hasPendingStructure = !!structDiff && structDiff.total > 0;

  // Pick up a publish made after this view mounted. The initial hydration reads
  // the published channel once, so an editor left open (e.g. structure edited in
  // another tab, or on a prior tab visit) would never see a new publish. Re-read
  // when the published channel changes (cross-tab `storage` event) and when the
  // window regains focus (same-tab publish after navigating back).
  useEffect(() => {
    const refresh = () => { void api.structure.published.get().then(setPendingPublish); };
    refresh(); // also read on mount — in-SPA navigation fires no storage/focus event
    const onStorage = (e: StorageEvent) => { if (e.key === PUBLISHED_KEY) refresh(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // One-shot hydration: load every authoring channel from the data-access layer,
  // reconcile the selected section against the persisted sections, then reveal the
  // editor. Under the LocalAdapter this resolves synchronously-fast (localStorage
  // wrapped in a promise); under the RestAdapter it awaits the backend. Runs once.
  useEffect(() => {
    let alive = true;
    void Promise.all([
      api.report.sections.get(),
      api.report.approvals.get(),
      api.report.changes.get(),
      api.report.locks.get(),
      api.report.sectionProgress.get(),
      api.report.comments.get(),
      api.report.l2Signoff.get(),
      api.report.auditReleases.get(),
      api.report.aiBaselineAccepted.get(),
      api.report.rollForward.get(),
      api.report.versions.get(),
      api.report.evidence.get(),
      api.structure.applied.get(),
    ]).then(([secs, apprs, chgs, lks, prog, cmts, l2, rel, aiba, rf, vers, ev, applied]) => {
      if (!alive) return;
      setSections(secs);
      setSelectedSection(prev => secs.find(s => s.id === prev.id) ?? secs[0]);
      setApprovals(apprs);
      setTrackedChanges(chgs);
      setLocks(lks);
      setSectionProgress(prog);
      setCommentThreads(cmts);
      setL2SignOffs(l2);
      setAuditReleases(rel);
      setAiBaselineAccepted(aiba);
      setRollForwardResolutions(rf);
      setSectionVersions(vers);
      setEvidence(ev);
      setAppliedStructure(applied ?? baselineRows());
      setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  // The effective acting identity. Picking a role impersonates the person
  // assigned to that role on the selected section so role-gated actions resolve
  // for that seat. 'owner2' IS the owner role, bound to the second assigned
  // owner. Used for approval gating and edit-lock ownership/authoring.
  const effectiveRole: ActingRole = viewAsRole === 'owner2' ? 'owner' : viewAsRole;
  const roleActorName = (role: ActingRole | 'owner2'): string => {
    if (role === 'input_provider') return primaryInputProvider(selectedSection.roles);
    if (role === 'editor') return EDITOR_TEAM[0]; // Editors are a global team, not per-section
    if (role === 'admin') return loginUser;       // the logged-in ESG Lead is the admin
    if (role === 'guest') return 'Guest Reviewer'; // read-only + comment demo seat
    if (role === 'owner2') return selectedSection.roles.owners[1] ?? selectedSection.roles.owners[0];
    return selectedSection.roles.owners[0];        // 'owner' → first assigned owner
  };
  const currentActor = roleActorName(viewAsRole);
  const currentUser = currentActor; // locks + tracked-change authoring act as the current seat
  const isGuestView = effectiveRole === 'guest';

  // Editability per the role matrix: Editors edit anything (incl. post-approval);
  // any Input Provider edits their subsection (no L3 lock anymore); Owners edit in
  // track changes. Drives the "Edit Section" button + edit banner.
  const progressOfSelected = sectionProgress[selectedSection.id];
  // Editor-class authority derives from the ACTING ROLE, not the person's name:
  // only the Admin and Editor seats accept/reject changes, curate requests and
  // edit anything. (Previously this also keyed off isEditor(name), so an Owner
  // who happened to be in the editor allowlist — e.g. the ESG Lead as a section
  // owner — silently gained Editor powers. Role-based is the correct, teachable
  // model and lands consistently across every section.)
  const actingIsEditor = effectiveRole === 'admin' || effectiveRole === 'editor';
  // Guests are read-only (+ comment): never editors, never editable, regardless
  // of name matching. All other seats derive editability from the role matrix.
  const canEditThis = !isGuestView && (actingIsEditor || canEditSubsection(selectedSection.roles, currentActor));
  // Input-Provider seat sees a SIMPLIFIED L3 view (13 Jul 2026 feedback #12): no
  // Owner/Legal (L2) sign-off boxes — those live in the consolidated section view.
  const isInputProviderView = viewAsRole === 'input_provider';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Freeze a version for one or more subsections and persist. Called at every
  // meaningful transition (save, each sign-off) so history is a full timeline.
  const appendVersions = useCallback((
    targets: { section: ReportSection; contentOverride?: string }[],
    trigger: VersionTrigger,
    note?: string,
  ) => {
    const now = new Date().toISOString();
    setSectionVersions(prev => {
      let acc = prev;
      for (const t of targets) {
        acc = [...acc, makeVersion(t.section, { approvals, existing: acc, snapshotBy: currentActor, nowIso: now, trigger, note, contentOverride: t.contentOverride })];
      }
      void api.report.versions.set(acc);
      return acc;
    });
  }, [approvals, currentActor]);

  const applyPublishedStructure = useCallback(() => {
    if (!pendingPublish) return;
    const merged = applyStructureToSections(pendingPublish.rows, sections, new Date().toISOString());
    setSections(merged);
    setSelectedSection(prev => merged.find(s => s.id === prev.id) ?? merged[0]);
    void api.report.sections.set(merged);
    void api.structure.applied.set(pendingPublish.rows);
    setAppliedStructure(pendingPublish.rows);
    setShowStructReview(false);
    setPendingPublish(null);
    const n = structDiff?.total ?? 0;
    showToast(`Structure applied — ${n} change(s) reflected in the report`);
  }, [pendingPublish, sections, structDiff]);

  const dismissPublishedStructure = useCallback(() => {
    if (pendingPublish) { void api.structure.applied.set(pendingPublish.rows); setAppliedStructure(pendingPublish.rows); } // treat as acknowledged
    setShowStructReview(false);
    setPendingPublish(null);
    showToast('Structure update dismissed');
  }, [pendingPublish]);

  const resetDemo = () => {
    // Reset the whole report authoring state via the data-access layer (clears
    // the nine editor channels + versions + evidence + tracked-draft side-channel),
    // then clear the structure-sync channel so a reset returns to the code baseline.
    void api.report.reset().then(async () => {
      await Promise.all([api.structure.published.clear(), api.structure.applied.clear()]);
      // Re-read the evidence seed the adapter falls back to after a clear.
      const seedEv = await api.report.evidence.get();
      setEvidence(seedEv);
    });
    setSections(reportSections);
    setSelectedSection(reportSections[0]);
    setApprovals(initialApprovalRecords);
    setTrackedChanges(initialTrackedChanges);
    setLocks(initialSectionLocks);
    setSectionProgress(demoSectionProgressSeed);
    setCommentThreads(initialCommentThreads);
    setL2SignOffs({});
    setAuditReleases(initialAuditReleases);
    setSelectedL2(null);
    setAiBaselineAccepted([]);
    setRollForwardResolutions({});
    setSectionVersions([]);
    setAppliedStructure(baselineRows());
    setViewAsRole('admin');
    setPendingPublish(null);
    setEditMode(false);
    showToast('Demo state reset to defaults');
  };

  // (Workflow model, Adrian 2026-08-31: Input Providers edit → section "edited";
  // the Editor marks it "updated" (markSectionUpdated); Owners sign off at L2 in
  // the consolidated section view (ownerSignOffL2), with one legal sign-off
  // sufficing. `approvals` is retained only for version-history sign-off records.)

  // (Owner/Legal sign-off moved to the L2 consolidated view — see ownerSignOffL2 /
  // legalSignOffL2. The old per-subsection completeLegalSignOff and the L3
  // "Request Changes" flow were removed: Owner/Legal now route feedback to Editors
  // via comments/requests rather than bouncing an L3 subsection back to Draft.)

  const handleSaveEdit = useCallback((sectionId: string, newContent: string, reason: string) => {
    const oldSection = sections.find(s => s.id === sectionId);
    if (!oldSection) return;

    const oldParas = oldSection.content.split('\n\n');
    const newParas = newContent.split('\n\n');
    const newChanges: TrackedChange[] = [];

    const maxLen = Math.max(oldParas.length, newParas.length);
    for (let i = 0; i < maxLen; i++) {
      const old = oldParas[i] || '';
      const nw = newParas[i] || '';
      if (old !== nw) {
        newChanges.push({
          id: `tc-${Date.now()}-${i}`,
          sectionId,
          author: currentActor,
          timestamp: new Date().toISOString(),
          type: !old ? 'insertion' : !nw ? 'deletion' : 'modification',
          originalText: old,
          newText: nw,
          paragraphIndex: i,
          reason,
          status: 'pending',
        });
      }
    }

    const updatedSections = sections.map(s => s.id === sectionId ? { ...s, content: newContent, lastModified: new Date().toISOString() } : s);
    const updatedChanges = [...trackedChanges, ...newChanges];

    setSections(updatedSections);
    setSelectedSection(prev => prev.id === sectionId ? { ...prev, content: newContent, lastModified: new Date().toISOString() } : prev);
    setTrackedChanges(updatedChanges);
    setEditMode(false);
    // With the track-changes engine on, land on the review (Editor) view after
    // saving so the newly-tracked insertions/deletions are shown with their
    // Accept/Reject controls — not the Clean view, where an edit looks already
    // applied and can't be reviewed (2026-07-15: deletions "not reflected").
    if (isEnabled('trackChangesEngine') && newChanges.some(c => c.status === 'pending')) {
      setDraftView('editor');
    }
    setLocks(prev => { const next = prev.filter(l => l.sectionId !== sectionId); void api.report.locks.set(next); return next; });
    void api.report.sections.set(updatedSections);
    void api.report.changes.set(updatedChanges);
    // Freeze a version capturing the newly-saved content so the edit is diffable
    // against prior versions (reason carried as the version note).
    if (newChanges.length > 0) {
      appendVersions([{ section: oldSection, contentOverride: newContent }], 'edit', reason);
    }
    // An Input Provider (or owner) editing marks the subsection "edited" — the
    // Editor later confirms it as "updated" once comments are addressed (Adrian
    // 2026-08-31). Editor/Admin edits don't reset an already-updated section.
    if (newChanges.length > 0 && !actingIsEditor) {
      setProgressFor(sectionId, 'edited');
    }
    // Post-approval / already-updated edits by an Editor are governance-significant —
    // surface that they were logged and that re-approval is a manual decision.
    const wasLocked = sectionProgress[sectionId] === 'updated' || oldSection.stage === 'approved' || oldSection.stage === 'exported';
    if (wasLocked && isEditor(currentActor)) {
      showToast(`Post-approval Editor edit saved — ${newChanges.length} change(s) tracked · logged in audit trail · re-approval not auto-triggered`);
    } else {
      showToast(`Changes saved — ${newChanges.length} change(s) tracked · lock released`);
    }
  }, [sections, trackedChanges, currentActor, sectionProgress, actingIsEditor, appendVersions]);

  // Accept/reject of tracked changes is Editors/Admins only (2026-07-09 call).
  // actingIsEditor is now role-based (Admin/Editor seats), so the default Admin
  // landing seat qualifies and Owner/IP/Guest seats do not.
  const canReviewSectionChanges = (_sectionId: string): boolean => actingIsEditor;

  const handleAcceptChange = useCallback((changeId: string) => {
    const change = trackedChanges.find(c => c.id === changeId);
    if (change && !canReviewSectionChanges(change.sectionId)) { showToast('Only Editors/Admins can accept track changes'); return; }
    const updated = trackedChanges.map(c => c.id === changeId ? { ...c, status: 'accepted' as const } : c);
    setTrackedChanges(updated);
    void api.report.changes.set(updated);
    showToast('Change accepted');
  }, [trackedChanges, sections, currentActor]);

  const handleRejectChange = useCallback((changeId: string) => {
    const change = trackedChanges.find(c => c.id === changeId);
    if (change && !canReviewSectionChanges(change.sectionId)) { showToast('Only Editors/Admins can reject track changes'); return; }
    if (change && change.originalText) {
      const updatedSections = sections.map(s => {
        if (s.id === change.sectionId) {
          const paras = s.content.split('\n\n');
          if (change.type === 'modification' || change.type === 'insertion') {
            paras[change.paragraphIndex] = change.originalText;
          }
          return { ...s, content: paras.join('\n\n') };
        }
        return s;
      });
      setSections(updatedSections);
      void api.report.sections.set(updatedSections);
    }
    const updated = trackedChanges.map(c => c.id === changeId ? { ...c, status: 'rejected' as const } : c);
    setTrackedChanges(updated);
    void api.report.changes.set(updated);
    showToast('Change rejected — reverted');
  }, [trackedChanges, sections]);

  // Editor modifies a tracked change's text, THEN accepts it (Adrian 2026-08-31:
  // "modify content in track changes before accepting"). Updates both the change
  // record (so history shows the Editor's wording) and the working content, then
  // marks it accepted. Only Editors/Admins.
  const handleAcceptEditedChange = useCallback((changeId: string, editedText: string) => {
    const change = trackedChanges.find(c => c.id === changeId);
    if (!change) return;
    if (!canReviewSectionChanges(change.sectionId)) { showToast('Only Editors/Admins can accept track changes'); return; }
    // Apply the edited text at the change's paragraph in the working content.
    const updatedSections = sections.map(s => {
      if (s.id !== change.sectionId) return s;
      const paras = s.content.split('\n\n');
      if (change.type === 'deletion') {
        // A deletion the Editor chose to replace with text becomes that text.
        paras[change.paragraphIndex] = editedText;
      } else {
        paras[change.paragraphIndex] = editedText;
      }
      return { ...s, content: paras.join('\n\n'), lastModified: new Date().toISOString() };
    });
    setSections(updatedSections);
    setSelectedSection(prev => updatedSections.find(s => s.id === prev.id) ?? prev);
    void api.report.sections.set(updatedSections);
    const updated = trackedChanges.map(c => c.id === changeId
      ? { ...c, status: 'accepted' as const, newText: editedText, type: (c.type === 'deletion' ? 'modification' : c.type) as TrackedChange['type'], reason: `${c.reason} (edited by ${currentActor} before accepting)` }
      : c);
    setTrackedChanges(updated);
    void api.report.changes.set(updated);
    showToast('Change edited and accepted');
  }, [trackedChanges, sections, currentActor, actingIsEditor]);

  // Wave 3 — the AI Assistant no longer overwrites content directly. Proposed
  // text is inserted as an AI-origin tracked change (appended paragraph) that an
  // Editor accepts or rejects, keeping AI output on the same governed path as
  // everything else.
  const insertAiTrackedChange = useCallback((newText: string, reason: string) => {
    const paras = selectedSection.content.split('\n\n');
    const change: TrackedChange = {
      id: `tc-ai-chat-${Date.now()}`,
      sectionId: selectedSection.id,
      author: 'AI Draft Assistant',
      timestamp: new Date().toISOString(),
      type: 'insertion',
      originalText: '',
      newText,
      paragraphIndex: paras.length,
      reason,
      status: 'pending',
      origin: 'ai',
    };
    const updated = [...trackedChanges, change];
    setTrackedChanges(updated);
    void api.report.changes.set(updated);
    showToast('AI text inserted as a pending tracked change for the Editor to accept');
  }, [selectedSection, trackedChanges]);

  // Apply a typo/style/consistency flag as an AI-origin tracked MODIFICATION on
  // the flagged paragraph (again, Editor-accepted, never silent).
  const applyEditorFlag = useCallback((_flag: EditorFlag, paragraphIndex: number, newParagraph: string, reason: string) => {
    const paras = selectedSection.content.split('\n\n');
    const original = paras[paragraphIndex] ?? '';
    const change: TrackedChange = {
      id: `tc-ai-flag-${Date.now()}`,
      sectionId: selectedSection.id,
      author: 'AI Style Reviewer',
      timestamp: new Date().toISOString(),
      type: 'modification',
      originalText: original,
      newText: newParagraph,
      paragraphIndex,
      reason,
      status: 'pending',
      origin: 'ai',
    };
    const updated = [...trackedChanges, change];
    setTrackedChanges(updated);
    void api.report.changes.set(updated);
    showToast('AI fix inserted as a pending tracked change for the Editor to accept');
  }, [selectedSection, trackedChanges]);

  const addEvidence = useCallback((name: string, note: string) => {
    const doc: EvidenceDoc = {
      id: `ev-${Date.now()}`,
      sectionId: selectedSection.id,
      name,
      source: 'upload',
      docType: 'Uploaded document',
      addedBy: currentActor,
      addedAt: new Date().toISOString(),
      note: note || undefined,
    };
    const updated = [...evidence, doc];
    setEvidence(updated);
    void api.report.evidence.set(updated);
    showToast(`Evidence "${name}" attached to this section`);
  }, [selectedSection, evidence, currentActor]);

  const removeEvidence = useCallback((id: string) => {
    const updated = evidence.filter(e => e.id !== id);
    setEvidence(updated);
    void api.report.evidence.set(updated);
  }, [evidence]);

  // #5 — attach human-supplied AUDIT EVIDENCE for a claim (screenshot / SOP /
  // email / report page), optionally anchored to the text it supports. Recorded
  // in the audit trail; distinct from the AI's automatic citations.
  const addAuditEvidence = useCallback((e: { name: string; kind: EvidenceKind; paragraphRef: string; note: string }) => {
    const doc: EvidenceDoc = {
      id: `ev-${Date.now()}`,
      sectionId: selectedSection.id,
      name: e.name,
      source: 'upload',
      docType: EVIDENCE_KIND_LABEL[e.kind],
      addedBy: currentActor,
      addedAt: new Date().toISOString(),
      note: e.note || undefined,
      evidenceKind: e.kind,
      paragraphRef: e.paragraphRef || undefined,
    };
    const updated = [...evidence, doc];
    setEvidence(updated);
    void api.report.evidence.set(updated);
    showToast(`Source evidence "${e.name}" attached to this section`);
  }, [selectedSection, evidence, currentActor]);

  // D — assign a new datapoint to this subsection: the AI drafts proposed text
  // as a tracked insertion tagged with the DR ref, for the Owner to accept/reject.
  const handleAiDraftDatapoint = useCallback(() => {
    const drRef = window.prompt('Assign a new datapoint/requirement to this subsection (e.g. E1-4, ESRS-S1-15, ISSB-S2-34). The AI will draft proposed text as a tracked insertion.');
    if (!drRef || !drRef.trim()) return;
    const ref = drRef.trim();
    // Placeholder used offline / if the model call fails — keeps the tracked-
    // change flow working exactly as before real AI was wired in.
    const placeholder = `[AI proposed] Draft narrative addressing ${ref}, grounded in the knowledge base and following the Novartis style guide. Review the retrieved evidence in the AI Assistant panel before accepting.`;
    const priorYearText = selectedSection.priorYearContent ?? '';
    const topic = [selectedSection.topicL1, selectedSection.topicL2, selectedSection.topicL3].filter(Boolean).join(' › ');
    showToast(`AI drafting text for ${ref}…`);
    // Real Bedrock draft when the backend is live; falls back to the placeholder
    // (aiDraft returns null offline or on error).
    void aiDraft({ sectionTitle: selectedSection.title, drRef: ref, topic, priorYearText })
      .then(text => {
        const newChange: TrackedChange = {
          id: `tc-ai-${trackedChanges.length + 1}-${ref.replace(/[^a-z0-9]/gi, '')}`,
          sectionId: selectedSection.id,
          author: 'AI Draft Assistant',
          timestamp: new Date().toISOString(),
          type: 'insertion',
          originalText: '',
          newText: text ?? placeholder,
          paragraphIndex: selectedSection.content.split('\n\n').length,
          reason: `AI proposed text to address newly assigned datapoint ${ref}`,
          status: 'pending',
          origin: 'ai',
          drRef: ref,
        };
        const updated = [...trackedChanges, newChange];
        setTrackedChanges(updated);
        void api.report.changes.set(updated);
        showToast(`AI drafted proposed text for ${ref} — pending accept/reject`);
      });
  }, [selectedSection, trackedChanges]);

  // J — locking helpers. No silent overwrites: a subsection held by someone
  // else must be explicitly taken over (which queues the current holder).
  const persistLocks = (next: SectionLock[]) => { setLocks(next); void api.report.locks.set(next); };
  const currentLock = findLock(locks, selectedSection.id);
  const lockedByOther = !!currentLock && currentLock.heldBy !== currentUser;

  const acquireLock = useCallback(() => {
    const existing = findLock(locks, selectedSection.id);
    if (existing && existing.heldBy !== currentUser) return; // guarded by UI
    const next = existing
      ? locks.map(l => l.sectionId === selectedSection.id ? { ...l, heldBy: currentUser, since: new Date().toISOString() } : l)
      : [...locks, { sectionId: selectedSection.id, heldBy: currentUser, since: new Date().toISOString(), queue: [] }];
    persistLocks(next);
    setEditMode(true);
  }, [locks, selectedSection, currentUser]);

  const takeOverLock = useCallback(() => {
    const existing = findLock(locks, selectedSection.id);
    if (!existing) { acquireLock(); return; }
    // Queue the displaced holder; transfer the lock — never a silent overwrite.
    const queue = existing.queue.includes(existing.heldBy) ? existing.queue : [...existing.queue, existing.heldBy];
    const next = locks.map(l => l.sectionId === selectedSection.id ? { ...l, heldBy: currentUser, since: new Date().toISOString(), queue: queue.filter(u => u !== currentUser) } : l);
    persistLocks(next);
    setEditMode(true);
    showToast(`Lock taken over from ${existing.heldBy} — they have been notified and queued`);
  }, [locks, selectedSection, currentUser, acquireLock]);

  const releaseLock = useCallback(() => {
    const next = locks.filter(l => l.sectionId !== selectedSection.id);
    persistLocks(next);
  }, [locks, selectedSection]);

  // Apply an (Editor-approved) request resolution as a pending tracked change,
  // appended as a new paragraph on the subsection and attributed to the Editor.
  const applyRequestAsTrackedChange = useCallback((sectionId: string, suggestedText: string, source: CommentThread) => {
    const sec = sections.find(s => s.id === sectionId);
    const paras = (sec?.content ?? '').split('\n\n');
    const change: TrackedChange = {
      id: `tc-req-${Date.now()}`,
      sectionId,
      author: currentActor,
      timestamp: new Date().toISOString(),
      type: 'insertion',
      originalText: '',
      newText: suggestedText,
      paragraphIndex: paras.length,
      reason: `Resolves ${source.authorRole} request from ${source.author}: "${source.body.slice(0, 80)}${source.body.length > 80 ? '…' : ''}"`,
      status: 'pending',
      origin: 'ai',
    };
    const updated = [...trackedChanges, change];
    setTrackedChanges(updated);
    void api.report.changes.set(updated);
    showToast('Request approved — applied as a pending tracked change for sign-off');
  }, [sections, trackedChanges, currentActor]);

  // Subsections belonging to the selected L2 group, in document order.
  const l2Subsections = selectedL2
    ? sections.filter(s => s.topicL1 === selectedL2.topicL1 && s.topicL2 === selectedL2.topicL2)
    : [];
  const currentL2SignOff: L2SignOffState = selectedL2 ? (l2SignOffs[l2Key(selectedL2.topicL1, selectedL2.topicL2)] ?? {}) : {};
  // The owners of an L2 group are taken from its subsections (consistent across
  // the group by construction of the blueprint); use the first leaf as source.
  const l2Owners = l2Subsections[0]?.roles.owners ?? [];
  // Whether the selected L2 section is fully approved and whether it has been
  // released to the external Auditor view (Owner action, Adrian 2026-08-31).
  const selectedL2Approved = l2Subsections.length > 0 && l2Subsections.every(s => deriveStatus(s, sectionProgress, l2SignOffs).isApproved);
  const selectedL2Released = selectedL2 ? !!auditReleases[l2Key(selectedL2.topicL1, selectedL2.topicL2)] : false;

  // Record the CURRENT actor's owner sign-off on the selected L2 section. When
  // every assigned owner has signed, the section's subsections become Approved
  // (Adrian 2026-07-15: all owners must sign; a legal reviewer is an owner).
  const ownerSignOffL2 = useCallback((note: string) => {
    if (!selectedL2) return;
    const k = l2Key(selectedL2.topicL1, selectedL2.topicL2);
    const now = new Date().toISOString();
    const merged: L2SignOffState = { ...(l2SignOffs[k] ?? {}), [currentActor]: { by: currentActor, at: now, note: note || undefined } };
    persistL2SignOffs({ ...l2SignOffs, [k]: merged });

    const roles0 = l2Subsections[0]?.roles;
    const owners = roles0?.owners ?? [];
    // Approval rule (Adrian 2026-08-31): every non-legal owner + one legal owner.
    const allSigned = roles0 ? allRequiredOwnersSigned(roles0, o => !!merged[o]) : false;
    if (allSigned) {
      // Fully approved at L2 → mark its subsections Approved.
      const ids = new Set(l2Subsections.map(s => s.id));
      const newSections = sections.map(s => ids.has(s.id) ? { ...s, stage: 'approved' as WorkflowStage, lastModified: now } : s);
      setSections(newSections);
      void api.report.sections.set(newSections);
      appendVersions(l2Subsections.map(section => ({ section })), 'owner_signoff', note || undefined);
      showToast(`All owners signed — “${selectedL2.topicL2}” fully approved at section level`);
    } else {
      appendVersions(l2Subsections.map(section => ({ section })), 'owner_signoff', note || undefined);
      // Remaining = unsigned non-legal owners, plus 1 if no legal owner has signed yet.
      const legalOwners = roles0?.legalOwners ?? [];
      const nonLegalRemaining = owners.filter(o => !legalOwners.includes(o) && !merged[o]).length;
      const legalRemaining = legalOwners.length > 0 && !legalOwners.some(o => merged[o]) ? 1 : 0;
      const remaining = nonLegalRemaining + legalRemaining;
      showToast(`Owner sign-off recorded — ${remaining} sign-off(s) remaining for “${selectedL2.topicL2}”`);
    }
  }, [selectedL2, l2SignOffs, currentActor, l2Subsections, sections, appendVersions]);

  // Owner releases a fully-approved L2 section to the external Auditor view
  // (Adrian 2026-08-31). Only owners/admins, only when fully approved. Toggling
  // again withdraws it (e.g. if a re-edit is needed).
  const toggleReleaseToAudit = useCallback(() => {
    if (!selectedL2) return;
    const k = l2Key(selectedL2.topicL1, selectedL2.topicL2);
    if (auditReleases[k]) {
      const { [k]: _removed, ...rest } = auditReleases;
      persistAuditReleases(rest);
      showToast(`“${selectedL2.topicL2}” withdrawn from the Audit view`);
    } else {
      persistAuditReleases({ ...auditReleases, [k]: { by: currentActor, at: new Date().toISOString() } });
      showToast(`“${selectedL2.topicL2}” released to the Audit view`);
    }
  }, [selectedL2, auditReleases, currentActor]);

  // Accept the AI roll-forward as the working base (13 Jul 2026 feedback #4).
  // Single confirmation by the Editor or Input Provider: after this the FY2025
  // comparison is no longer shown; the draft is treated as clean text and only
  // new edits are tracked going forward. A version is frozen as the audit record.
  const acceptAiBaseline = useCallback(() => {
    if (aiBaselineAccepted.includes(selectedSection.id)) return;
    persistAiBaselineAccepted([...aiBaselineAccepted, selectedSection.id]);
    appendVersions([{ section: selectedSection }], 'edit', 'Accepted AI roll-forward from FY2025 as the working base');
    setDraftView('clean');
    showToast(`${selectedSection.ref} — AI draft accepted as the working base; now tracking only new changes`);
  }, [aiBaselineAccepted, selectedSection, appendVersions]);

  // #1 change-by-change roll-forward: revert a single FY2026 paragraph back to
  // its FY2025 wording (or remove an AI-added paragraph). Edits the working
  // content in place; the change list recomputes against the new content.
  const revertRollForwardParagraph = useCallback((fy2026Text: string, fy2025Text: string) => {
    const paras = selectedSection.content.split('\n\n');
    const idx = paras.findIndex(p => p.trim() === fy2026Text.trim());
    if (idx === -1) return;
    if (fy2025Text.trim()) paras[idx] = fy2025Text;   // restore FY2025 wording
    else paras.splice(idx, 1);                         // AI-added paragraph → remove
    const newContent = paras.join('\n\n');
    const updatedSections = sections.map(s => s.id === selectedSection.id ? { ...s, content: newContent, lastModified: new Date().toISOString() } : s);
    setSections(updatedSections);
    setSelectedSection(prev => ({ ...prev, content: newContent }));
    void api.report.sections.set(updatedSections);
    showToast('Reverted to the FY2025 wording for that paragraph');
  }, [selectedSection, sections]);

  // Editor "mark as updated" (Adrian 2026-08-31): once all comments on a
  // subsection are addressed, the Editor advances it from "edited" to "updated".
  // "updated" is the prerequisite for L2 owner sign-off. Editors/Admins only.
  const markSectionUpdated = useCallback(() => {
    if (sectionProgress[selectedSection.id] === 'updated') return;
    // AI-governance gate (13 Jul 2026 feedback): the AI roll-forward must be
    // accepted as the working base before the section can be marked updated.
    if (needsAiAcceptance) {
      showToast('Accept the AI draft as the working base first');
      return;
    }
    // Cannot finalise while comments/requests are still open on this subsection.
    const stillOpen = commentThreads.filter(t => t.sectionId === selectedSection.id && isUnresolved(t.status)).length;
    if (stillOpen > 0) {
      showToast(`Resolve or dismiss the ${stillOpen} open comment(s) before marking updated`);
      return;
    }
    setProgressFor(selectedSection.id, 'updated');
    // Freeze the "updated" version of this subsection (reuses the ip_signoff trigger).
    appendVersions([{ section: selectedSection }], 'ip_signoff');
    setEditMode(false);
    showToast(`${selectedSection.ref} marked updated — ready for owner sign-off`);
  }, [sectionProgress, selectedSection, needsAiAcceptance, commentThreads, appendVersions]);

  const reopenSubsection = useCallback(() => {
    // Editors can send an "updated" subsection back to "edited", e.g. after owner
    // feedback, to re-invite the Input Provider (a manual Editor decision).
    setProgressFor(selectedSection.id, 'edited');
    showToast(`${selectedSection.ref} re-opened for the Input Provider by Editor`);
  }, [sectionProgress, selectedSection]);

  // Entry point for the "Edit Section" button.
  //  - Editors/Admins can edit an Approved/Exported subsection WITHOUT triggering
  //    re-approval (2026-07-09: post-approval edits are Editor-only and do not
  //    auto re-approve; the Editor decides manually). The edit is audit-logged.
  //  - A non-editor (Input Provider) editing an Approved section still goes through
  //    the snapshot-and-reset-to-Draft path so re-approval is enforced for them.
  const requestEdit = useCallback(() => {
    const approved = deriveStatus(selectedSection, sectionProgress, l2SignOffs).isApproved;
    if (approved && !actingIsEditor) {
      setReEditConfirm(selectedSection.id);
      return;
    }
    if (approved && actingIsEditor) {
      showToast('Post-approval edit as Editor — logged; re-approval is your call (not automatic)');
    }
    acquireLock();
  }, [selectedSection, acquireLock, actingIsEditor, sectionProgress, l2SignOffs]);

  // Confirmed re-edit of an Approved section: freeze an immutable version (content
  // + sign-offs), reset the section to Draft with fresh pending approvals, then
  // open the editor. This forces full re-approval (SME → Legal) of the new text.
  const confirmReEdit = useCallback(() => {
    const sec = sections.find(s => s.id === selectedSection.id);
    if (!sec) return;
    const now = new Date().toISOString();

    const version = snapshotVersion(sec, approvals, sectionVersions, currentActor, now);
    const nextVersions = [...sectionVersions, version];
    setSectionVersions(nextVersions);
    void api.report.versions.set(nextVersions);

    // Reset this section to Draft and clear its approval records back to pending.
    const newSections = sections.map(s => s.id === sec.id ? { ...s, stage: 'draft' as WorkflowStage, lastModified: now } : s);
    const newApprovals = approvals.map(a =>
      a.sectionId === sec.id ? { ...a, action: 'pending' as const, timestamp: undefined, comment: undefined, consentNote: undefined, signedBy: undefined } : a
    );
    setSections(newSections);
    setApprovals(newApprovals);
    setSelectedSection(prev => prev.id === sec.id ? { ...prev, stage: 'draft', lastModified: now } : prev);
    void api.report.sections.set(newSections);
    void api.report.approvals.set(newApprovals);

    // Re-editing invalidates the sign-off chain: clear this subsection's progress
    // (back to un-edited) and, because the section content changed, the Owner
    // sign-off for its L2 group so the whole section must be re-approved.
    setProgressFor(sec.id, null);
    if (sec.topicL2) {
      const k = l2Key(sec.topicL1, sec.topicL2);
      if (l2SignOffs[k]) {
        const { [k]: _removed, ...rest } = l2SignOffs;
        persistL2SignOffs(rest);
      }
    }

    setReEditConfirm(null);
    acquireLock();
    showToast(`Snapshotted ${version.label} — section reset to Draft for re-approval`);
  }, [sections, approvals, sectionVersions, selectedSection, currentActor, acquireLock, sectionProgress, l2SignOffs]);

  const sectionChanges = trackedChanges.filter(c => c.sectionId === selectedSection.id);
  const pendingSectionChanges = sectionChanges.filter(c => c.status === 'pending');
  const pendingChangeCount = pendingSectionChanges.length;

  // Clean / approved baseline of the selected subsection: the working content
  // with all PENDING changes reverted. The Clean view renders this (so an
  // unapproved edit is NOT visible there), and the Editor view redlines the
  // working content against it (so the whole section is shown with the pending
  // changes marked inline). Accepting a change moves it out of "pending" so it
  // folds into this baseline.
  const cleanContent = revertPendingChanges(selectedSection.content, pendingSectionChanges);
  const cleanSection = pendingChangeCount > 0
    ? { ...selectedSection, content: cleanContent }
    : selectedSection;
  const sectionComments = commentThreads.filter(t => t.sectionId === selectedSection.id);
  const openCommentCount = sectionComments.filter(t => isUnresolved(t.status)).length;

  // Derived status is the single source of truth for what a subsection's state
  // is — reconciled from edited/updated progress and Owner (L2) sign-offs. Used
  // for the header badge and the export gate so an Owner sign-off propagates instantly.
  const selectedStatus = deriveStatus(selectedSection, sectionProgress, l2SignOffs);

  // Export gate: every subsection must be fully Approved before the report can be
  // exported. Surfaces the blocking sections.
  const unapprovedSections = sections.filter(s => !deriveStatus(s, sectionProgress, l2SignOffs).isApproved);
  const allApproved = unapprovedSections.length === 0;
  // Export policy: the Word/MDD document can be generated AT ANY TIME (approval is
  // not a hard gate), but access is RESTRICTED to Editors and Admins (Adrian
  // 2026-08-31). We still SURFACE how many subsections are not yet Approved so the
  // user knows the document is a draft, but it does not block the download.
  const canExportReport = actingIsEditor;

  // The sections that will actually be exported, honouring the chosen scope.
  // 'choose' preserves document order (filter the full list by the selection).
  const exportSections = exportScope === 'choose'
    ? sections.filter(s => exportSel.has(s.id))
    : sections;

  // Run an export. DOCX has two variants (Adrian 21-Aug): 'mdd' (placeholders,
  // authoritative) and 'readable' (visible tables for offline reviewers).
  const runExport = async (kind: 'pdf' | 'docx-mdd' | 'docx-readable') => {
    if (exportSections.length === 0) { showToast('Select at least one section to export'); return; }
    setExporting(true);
    setExportProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12 + 5;
      if (p >= 95) { p = 95; clearInterval(interval); }
      setExportProgress(Math.min(p, 95));
    }, 300);
    try {
      if (kind === 'pdf') await generateAndDownloadPdf(exportSections);
      else if (kind === 'docx-readable') await generateAndDownloadDocx(exportSections, 'readable');
      else await generateAndDownloadDocx(exportSections, 'mdd');
      clearInterval(interval);
      setExportProgress(100);
      const partial = exportScope === 'choose';
      const done: Record<typeof kind, string> = {
        'pdf': 'PDF downloaded — Novartis_RNFM_FY2026.pdf',
        'docx-mdd': 'Word (MDD) downloaded — Novartis_RNFM_FY2026_MDD.docx',
        'docx-readable': 'Word (readable) downloaded — Novartis_RNFM_FY2026_Readable.docx',
      };
      setTimeout(() => {
        setShowExportModal(false);
        setExporting(false);
        setExportProgress(0);
        const scopeNote = partial ? ` (${exportSections.length} selected section${exportSections.length !== 1 ? 's' : ''})` : '';
        showToast(done[kind] + scopeNote);
      }, 600);
    } catch (err) {
      clearInterval(interval);
      setExporting(false);
      setExportProgress(0);
      showToast('Export failed — ' + (err instanceof Error ? err.message : 'unknown error'));
    }
  };

  // Hold the first paint until the authoring state has hydrated from the
  // data-access layer, so persisted content is never briefly overwritten by the
  // seed defaults (and so backend latency under the RestAdapter is handled).
  if (!hydrated) {
    return (
      <div className="view-header"><h1 className="view-title">Report Editor</h1>
        <div style={{ padding: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>Loading report…</div>
      </div>
    );
  }

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Report Editor</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Demo "view as role" — walk the role-gated flow from any seat. */}
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View as</label>
          <select
            value={viewAsRole}
            onChange={e => setViewAsRole(e.target.value as ActingRole | 'owner2')}
            title="View the studio as each role to see its exact permissions. Admin (ESG Reporting Lead) is the default full-access seat."
            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid var(--border-primary)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600 }}
          >
            <option value="admin">Admin — ESG Reporting Lead ({loginUser})</option>
            <option value="editor">Editor ({EDITOR_TEAM[0]})</option>
            <option value="owner">Owner ({selectedSection.roles.owners[0]})</option>
            {selectedSection.roles.owners.length > 1 && (
              <option value="owner2">Owner — 2nd of this section ({selectedSection.roles.owners[1]})</option>
            )}
            <option value="input_provider">Input Provider ({primaryInputProvider(selectedSection.roles)})</option>
            <option value="guest">Guest — read-only + comment</option>
          </select>
          <button className="btn-ghost" onClick={resetDemo}>Reset Demo</button>
          {canExportReport && (
            <>
              <button className="btn-secondary" onClick={() => { setExportScope('all'); setShowExportModal(true); }}>Export</button>
              {!selectedL2 && (
                <button
                  className="btn-ghost"
                  title="Export just this subsection"
                  onClick={() => { setExportScope('choose'); setExportSel(new Set([selectedSection.id])); setShowExportModal(true); }}
                  style={{ fontSize: '12px' }}
                >
                  Export section
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Structure-sync review banner — a pending publish from the admin page */}
      {hasPendingStructure && pendingPublish && structDiff && (
        <div className="struct-sync-banner">
          <span className="ssb-icon">⚙</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>Structure updated by {pendingPublish.publishedBy}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {[
                structDiff.added.length ? `+${structDiff.added.length} new` : null,
                structDiff.moved.length ? `${structDiff.moved.length} moved` : null,
                structDiff.renamed.length ? `${structDiff.renamed.length} renamed` : null,
                structDiff.removed.length ? `${structDiff.removed.length} removed` : null,
              ].filter(Boolean).join(' · ')} — review before applying to the report.
            </div>
          </div>
          <button className="btn-secondary" onClick={() => setShowStructReview(true)}>Review changes</button>
          <button className="btn-primary" onClick={applyPublishedStructure}>Apply</button>
          <button className="btn-ghost" onClick={dismissPublishedStructure}>Dismiss</button>
        </div>
      )}

      {/* Report Metadata */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>{reportMetadata.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{reportMetadata.reportingPeriod} · {reportMetadata.totalWordCount.toLocaleString()} words · {reportMetadata.totalCitations} citations</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {reportMetadata.reportingStandards.map(s => (
              <span key={s} className="framework-badge">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Sidebar — width is user-adjustable via the drag handle on its right edge */}
        <div style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}>
          <SectionSidebar
            sections={sections}
            selectedId={selectedSection.id}
            onSelect={sec => { setSelectedSection(sec); setEditMode(false); setShowCitation(null); setSelectedL2(null); }}
            onSelectL2={(topicL1, topicL2) => { setSelectedL2({ topicL1, topicL2 }); setEditMode(false); }}
            selectedL2={selectedL2}
            progress={sectionProgress}
            l2SignOffs={l2SignOffs}
          />
        </div>

        {/* Drag handle to resize the subsections panel */}
        <div
          onMouseDown={startSidebarResize}
          title="Drag to resize the subsections panel"
          style={{ flexShrink: 0, width: '8px', alignSelf: 'stretch', cursor: 'col-resize', display: 'flex', justifyContent: 'center', marginLeft: '-8px' }}
        >
          <div style={{ width: '2px', background: 'var(--border-primary)', borderRadius: '2px' }} />
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedL2 ? (
            <ConsolidatedSectionView
              topicL1={selectedL2.topicL1}
              topicL2={selectedL2.topicL2}
              subsections={l2Subsections}
              progress={sectionProgress}
              canEditSubsections={actingIsEditor || l2Owners.includes(currentActor)}
              currentActor={currentActor}
              owners={l2Owners}
              legalOwners={l2Subsections[0]?.roles.legalOwners ?? []}
              canSignOff={l2Owners.includes(currentActor) || actingIsEditor}
              signOff={currentL2SignOff}
              onEditSubsection={(id) => { const sec = sections.find(s => s.id === id); if (sec) { setSelectedSection(sec); setSelectedL2(null); requestEdit(); } }}
              onComment={(id) => { const sec = sections.find(s => s.id === id); if (sec) { setSelectedSection(sec); setSelectedL2(null); } }}
              onOwnerSignoff={ownerSignOffL2}
              isApproved={selectedL2Approved}
              isReleasedToAudit={selectedL2Released}
              canReleaseToAudit={l2Owners.includes(currentActor) || actingIsEditor}
              onToggleReleaseToAudit={toggleReleaseToAudit}
            />
          ) : (
          <div className="card" style={{ padding: '24px' }}>
            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-primary)' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  {selectedSection.topicL1}{selectedSection.topicL2 ? ` › ${selectedSection.topicL2}` : ''}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>{selectedSection.ref} {selectedSection.title}</h2>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>Input Provider{selectedSection.roles.inputProviders.length > 1 ? 's' : ''}: <strong style={{ color: 'var(--text-primary)' }}>{selectedSection.roles.inputProviders.join(', ')}</strong></span>
                  <span>·</span>
                  <span>Format: {selectedSection.contentFormat}</span>
                  <span>·</span>
                  <span>{selectedSection.wordCount.toLocaleString()} words</span>
                  <span>·</span>
                  <span>{selectedSection.citations.length} citations</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!editMode && !lockedByOther && canEditThis && (
                  <button className="btn-secondary" onClick={requestEdit} style={{ fontSize: '12px', padding: '6px 12px' }}>
                    Edit Section{actingIsEditor && selectedStatus.isApproved ? ' (post-approval)' : ''}
                  </button>
                )}
                {!editMode && !lockedByOther && !canEditThis && (
                  <span title="Review by comment only; editing is done by Input Providers, Owners or Editors/Admins." style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                    💬 Comment-only role
                  </span>
                )}
                {/* Editor "Mark as updated" — advances an edited subsection to
                    updated once comments are addressed (prerequisite for owner sign-off). */}
                {!editMode && actingIsEditor && progressOfSelected !== 'updated' && !selectedStatus.isApproved && (
                  <button
                    className="btn-success btn-sm"
                    onClick={markSectionUpdated}
                    disabled={needsAiAcceptance}
                    title={needsAiAcceptance ? 'Accept the AI draft as the working base first' : 'Mark this subsection updated — confirms comments are addressed and readies it for owner sign-off'}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    ✓ Mark as updated
                  </button>
                )}
                {/* Editors can send an updated subsection back to the Input Provider. */}
                {!editMode && actingIsEditor && progressOfSelected === 'updated' && !selectedStatus.isApproved && (
                  <button className="btn-ghost" onClick={reopenSubsection} title="Re-open this updated subsection for the Input Provider to edit" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    ↩ Re-open for Input Provider
                  </button>
                )}
                {!editMode && lockedByOther && (
                  <span title={`Locked by ${currentLock!.heldBy}`} style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#fef3c7', color: '#b45309' }}>
                    🔒 In use by {currentLock!.heldBy}
                  </span>
                )}
                {/* AI actions produce tracked-change edits, so they require edit
                    rights (Editor/Admin, assigned IP or Owner). Hidden for the
                    read-only Guest and any non-editing seat — the accept step was
                    already Editor-only, this also removes the editing entry point. */}
                {canEditThis && (
                  <button
                    className="btn-secondary"
                    onClick={handleAiDraftDatapoint}
                    title="Assign a new ESRS/ISSB datapoint — the AI drafts proposed text as a tracked insertion"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    ✦ AI: Draft datapoint
                  </button>
                )}
                {canEditThis && (
                  <button
                    className={`btn-secondary ${showAiPanel ? 'active' : ''}`}
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    ✦ AI Assistant
                  </button>
                )}
                <button className="btn-ghost" onClick={() => setShowVersions(true)} style={{ fontSize: '12px', padding: '6px 12px' }} title="Version history & compare — a version is frozen on every saved edit and every sign-off">
                  🕑 Versions ({sectionVersions.filter(v => v.sectionId === selectedSection.id).length})
                </button>
                <span title={`Roll-forward: ${rollForwardLabels[selectedSection.rollForwardStatus]}`} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', color: '#fff', background: rollForwardColors[selectedSection.rollForwardStatus] }}>
                  {rollForwardLabels[selectedSection.rollForwardStatus]}
                </span>
                <span className="status-badge" title={`Workflow status: ${selectedStatus.label}`} style={{ color: '#fff', background: selectedStatus.color }}>
                  {selectedStatus.label}
                </span>
              </div>
            </div>

            {/* J — concurrent-edit lock banner */}
            {lockedByOther && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#b45309' }}>
                  🔒 This subsection is being edited by <strong>{currentLock!.heldBy}</strong> since {new Date(currentLock!.since).toLocaleTimeString()}. To avoid conflicts, editing is sequential.
                  {currentLock!.queue.length > 0 && <> Queue: {currentLock!.queue.join(', ')}.</>}
                </span>
                <button className="btn-secondary" onClick={takeOverLock} style={{ marginLeft: 'auto', fontSize: '11px', padding: '4px 10px' }}>
                  Request / take over
                </button>
              </div>
            )}
            {editMode && currentLock?.heldBy === currentUser && (
              <div style={{ marginBottom: '16px', padding: '8px 14px', background: 'var(--accent-light)', borderRadius: '6px', fontSize: '12px', color: 'var(--accent)' }}>
                ✎ You hold the edit lock on this subsection. Others see it as “in use by {currentUser}”.
              </div>
            )}

            {/* Guest seat — read-only + comment (Adrian 2026-07-15 role model). */}
            {isGuestView && (
              <div style={{ marginBottom: '16px', padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                👁 Viewing as <strong>Guest</strong> — read-only access. You can add comments but cannot edit or sign off.
              </div>
            )}

            {/* ===== CONTENT card (primary — content gets priority) ===== */}
            <CollapsibleCard icon="📄" title="Content" accent="#3b82f6" defaultOpen>
              {/* FY2025 approved — full prior-year section, read-only (expandable reference) */}
              {!editMode && hasPriorYear && (
                <PriorYearSection section={selectedSection} priorYearText={priorYearText} />
              )}

              {/* Datapoints assigned — ALWAYS shown (Adrian 2026-07-15): if none
                  are assigned yet, say so (the AI compliance mapping assigns
                  these). Click a datapoint chip to open its details popup
                  (coverage + rationale + requirement text) — no page navigation. */}
              <div style={{ marginBottom: '18px', padding: '14px 16px', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '15px' }}>📌</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>Datapoints assigned to this section</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', background: 'var(--bg-primary)', padding: '1px 8px', borderRadius: '10px' }}>{selectedSection.drsCovered.length}</span>
                  {selectedSection.drsCovered.length > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>click a datapoint to view its details</span>
                  )}
                </div>
                {selectedSection.drsCovered.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    No datapoints assigned to this subsection yet. The AI compliance mapping assigns ESRS/ISSB/GRI
                    datapoints during the compliance scan; you can also assign one now with
                    <strong> ✦ AI: Draft datapoint</strong> above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedSection.drsCovered.map(dr => {
                      const cov = coverageForDr(dr);
                      const meta = cov ? COVERAGE_STATUS[cov.status] : undefined;
                      // The whole chip (id + status dot) opens the details popup.
                      return (
                        <button
                          key={dr}
                          onClick={() => setStandardTextDr(dr)}
                          title={meta ? `${meta.label} — view details` : 'View details'}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 10px', background: 'var(--bg-primary)', color: 'var(--accent)', borderRadius: '5px', fontFamily: 'monospace', fontWeight: 600, border: '1px solid var(--accent)', cursor: 'pointer' }}
                        >
                          {dr}
                          {meta && <span style={{ color: meta.color, fontWeight: 700 }}>{meta.glyph}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Content Area */}
              {editMode ? (
                isEnabled('trackChangesEngine') ? (
                  // Preview slice of the production track-changes engine — single
                  // Word-like view with inline suggestions (behind an off-by-
                  // default flag; localStorage ff:trackChangesEngine to try it).
                  <SuggestingEditor
                    section={selectedSection}
                    onSave={handleSaveEdit}
                    onCancel={() => { setEditMode(false); releaseLock(); }}
                    currentUser={currentUser}
                  />
                ) : isEnabled('richTextEditor') ? (
                  <RichContentEditor
                    section={selectedSection}
                    onSave={handleSaveEdit}
                    onCancel={() => { setEditMode(false); releaseLock(); }}
                    allSections={sections}
                  />
                ) : (
                  <ContentEditor
                    section={selectedSection}
                    onSave={handleSaveEdit}
                    onCancel={() => { setEditMode(false); releaseLock(); }}
                  />
                )
              ) : (
                <>
                  {/* AI roll-forward acceptance banner (13 Jul 2026 feedback #4).
                      Shown above the tabs only until the AI draft is accepted as the
                      working base; then it disappears and only new edits are tracked. */}
                  {/* Accepting the AI roll-forward as the working base is a drafting
                      action, so it is gated on edit rights (Editor/Admin, the
                      Input Provider, or an assigned Owner) — consistent with the
                      roll-forward review and content editing (2026-07-15). */}
                  {needsAiAcceptance && canEditThis && (
                    <div style={{ marginBottom: '14px', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, minWidth: '260px' }}>
                        ✦ The AI produced this draft by rolling the <strong>FY2025 approved</strong> text forward. Review it in the <strong>Editor view</strong> (tracked changes) and confirm you accept it as the working base.
                      </span>
                      <button className="btn-primary btn-sm" onClick={acceptAiBaseline} title="Accept the AI roll-forward as the working base — the FY2025 comparison then disappears and only new edits are tracked">
                        ✓ Accept AI draft as working base
                      </button>
                    </div>
                  )}

                  {/* Two tabs: Editor view (tracked changes, Editor only) + Clean view */}
                  <DraftViewToggle
                    value={draftView}
                    onChange={setDraftView}
                    canSeeEditorView={actingIsEditor}
                    pendingCount={needsAiAcceptance ? undefined : pendingChangeCount}
                  />
                  {actingIsEditor && draftView === 'editor' ? (
                    needsAiAcceptance ? (
                      /* Pre-acceptance: the FY2025→2026 roll-forward. With the
                         track-changes engine on, review it change-by-change (#1);
                         otherwise the single inline redline + one Accept button. */
                      isEnabled('trackChangesEngine') ? (
                        <RollForwardChangeList
                          section={selectedSection}
                          priorYearText={priorYearText}
                          onRevertParagraph={revertRollForwardParagraph}
                          onAcceptAll={acceptAiBaseline}
                        />
                      ) : (
                        <RollForwardRedline section={selectedSection} priorYearText={priorYearText} />
                      )
                    ) : (
                      /* Post-acceptance: the WHOLE section with pending edits marked
                         inline (redline against the clean baseline), followed by the
                         accept/reject list for those changes. */
                      <>
                        <WorkingRedline baseline={cleanContent} working={selectedSection.content} />
                        {sectionChanges.length > 0 && (
                          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-primary)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                              Tracked changes — accept or reject
                            </div>
                            <ChangeTracker
                              changes={sectionChanges}
                              canReview={actingIsEditor}
                              reviewerHint={`Only Editors/Admins (e.g. ${EDITOR_TEAM[0]}) can accept/reject track changes`}
                              onAccept={handleAcceptChange}
                              onReject={handleRejectChange}
                              onAcceptEdited={handleAcceptEditedChange}
                              embedded
                            />
                          </div>
                        )}
                      </>
                    )
                  ) : (
                    /* Clean view: the approved text only — pending edits are reverted
                       so an unapproved change is not visible here (13 Jul 2026 fix). */
                    <ContentViewer
                      section={cleanSection}
                      onCitationClick={(id) => setShowCitation(showCitation === id ? null : id)}
                      showCitation={showCitation}
                      allSections={sections}
                      flaggedSnippets={flaggedSnippets}
                    />
                  )}
                </>
              )}
            </CollapsibleCard>

            {/* ===== ROLL-FORWARD SUMMARY card (collapsed, below content per
                 Adrian 2026-07-14 — it's context, not the primary work) ===== */}
            <CollapsibleCard icon="↻" title="Roll-forward summary" accent={rollForwardColors[selectedSection.rollForwardStatus]} chip={rollForwardLabels[selectedSection.rollForwardStatus]} defaultOpen={false}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {selectedSection.rollForwardNote || 'Carried forward from the prior-year approved report.'}
              </div>
              <RollForwardChecklist
                items={rollForwardItems}
                resolutions={rollForwardResolutions}
                onResolve={resolveRollForward}
                onUpdate={() => { if (canEditThis && !editMode) requestEdit(); }}
                canResolve={canEditThis}
              />
            </CollapsibleCard>

            {/* ===== EVIDENCE & SOURCES card (#5) — human-supplied audit evidence ===== */}
            <CollapsibleCard
              icon="📎"
              title="Evidence & sources"
              accent="#0ea5e9"
              chip={evidenceForSection(evidence, selectedSection.id).filter(e => e.evidenceKind || e.paragraphRef).length || 0}
              defaultOpen={false}
            >
              <EvidencePanel
                evidence={evidenceForSection(evidence, selectedSection.id)}
                canEdit={canEditThis}
                onAdd={addAuditEvidence}
                onRemove={removeEvidence}
              />
            </CollapsibleCard>

            {/* ===== COMMENTS & NOTES card ===== */}
            <CollapsibleCard
              icon="💬"
              title="Comments & notes"
              accent="#8b5cf6"
              chip={sectionComments.length > 0 ? (openCommentCount > 0 ? `${openCommentCount} open` : sectionComments.length) : 0}
              chipAttention={openCommentCount > 0}
              defaultOpen={false}
            >
              <CommentsPanel
                sectionId={selectedSection.id}
                sectionRef={selectedSection.ref}
                currentActor={currentActor}
                actingIsEditor={actingIsEditor}
                canEditHere={canEditThis}
                threads={commentThreads}
                onAdd={addComment}
                onUpdate={updateComment}
                onApplyAsTrackedChange={applyRequestAsTrackedChange}
                embedded
              />
            </CollapsibleCard>

            {/* ===== APPROVAL WORKFLOW card (bottom — treated like an audit trail;
                 content gets priority, per 13 Jul 2026 feedback #1). Collapsed. ===== */}
            <CollapsibleCard
              icon="✓"
              title="Approval workflow"
              accent={selectedStatus.color}
              chip={selectedStatus.short}
              defaultOpen={false}
            >
              <ApprovalPanel
                section={selectedSection}
                currentActor={currentActor}
                contentUpdated={progressOfSelected === 'updated'}
                l2SignOff={selectedSection.topicL2 ? l2SignOffs[l2Key(selectedSection.topicL1, selectedSection.topicL2)] : undefined}
                l2Label={selectedSection.topicL2}
                showL2={!isInputProviderView}
                onOpenSectionView={(sec) => { if (sec.topicL2) { setSelectedL2({ topicL1: sec.topicL1, topicL2: sec.topicL2 }); setEditMode(false); } }}
              />
            </CollapsibleCard>
          </div>
          )}
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div style={{ width: '320px', flexShrink: 0 }}>
            <div className="card" style={{ padding: '0', height: '700px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <AiAssistantPanel
                sectionId={selectedSection.id}
                sectionTitle={selectedSection.title}
                sectionContent={selectedSection.content}
                evidence={evidenceForSection(evidence, selectedSection.id)}
                onInsertTrackedChange={insertAiTrackedChange}
                onApplyFlag={applyEditorFlag}
                onAddEvidence={addEvidence}
                onRemoveEvidence={removeEvidence}
                onClose={() => setShowAiPanel(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* MDD Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => !exporting && setShowExportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Export report</h3>
              {!exporting && <button className="btn-ghost" onClick={() => setShowExportModal(false)} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>}
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              {!exporting ? (
                <>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Export the report as an <strong>MDD-compatible Word document</strong> or a <strong>readable PDF</strong> at any time. The Word/MDD file is the authoritative artefact; both can be generated whether or not every subsection is fully Approved.
                  </div>

                  {/* Export scope (Adrian 2026-08-31): whole document or a chosen subset. */}
                  <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>What to export</div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: exportScope === 'choose' ? '10px' : 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="exportScope" checked={exportScope === 'all'} onChange={() => setExportScope('all')} />
                        Whole document ({sections.length} subsections)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="exportScope" checked={exportScope === 'choose'} onChange={() => setExportScope('choose')} />
                        Choose sections
                      </label>
                    </div>
                    {exportScope === 'choose' && (
                      <>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                          <button className="btn-ghost btn-sm" onClick={() => setExportSel(new Set(sections.map(s => s.id)))} style={{ fontSize: '11px' }}>Select all</button>
                          <button className="btn-ghost btn-sm" onClick={() => setExportSel(new Set())} style={{ fontSize: '11px' }}>Clear</button>
                          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>{exportSel.size} selected</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '6px', padding: '6px' }}>
                          {sections.map(s => (
                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '3px 4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={exportSel.has(s.id)}
                                onChange={() => setExportSel(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                              />
                              <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '42px' }}>{s.ref}</span>
                              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.topicL3 || s.topicL2 || s.title}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Export status — informational only (2026-08-21): export is no
                      longer gated on approval. When sections remain unapproved we
                      flag the document as a DRAFT export, but still allow it. */}
                  {allApproved ? (
                    <div style={{ padding: '10px 12px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
                      ✓ All {sections.length} subsections are Approved — this is a final export.
                    </div>
                  ) : (
                    <div style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginBottom: '6px' }}>
                        ⚠ Draft export — {unapprovedSections.length} of {sections.length} subsection(s) not yet Approved
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        You can still generate the Word/MDD document now. Sections not yet approved (Updated → Owner sign-off at L2) are included as their current draft — the export is watermarked as a draft until all are Approved.
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                        {unapprovedSections.slice(0, 12).map(s => (
                          <button key={s.id} onClick={() => { setSelectedSection(s); setShowExportModal(false); setEditMode(false); }} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                            {s.ref} {s.title} — <strong>{deriveStatus(s, sectionProgress, l2SignOffs).label}</strong>
                          </button>
                        ))}
                        {unapprovedSections.length > 12 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>…and {unapprovedSections.length - 12} more</span>}
                      </div>
                    </div>
                  )}

                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>MDD Paragraph Styles Applied</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontFamily: 'monospace' }}>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_title_main_level_section</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_title_main_level_section_2</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_title_body_level_1</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_title_body_level_2</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_text_body</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_text_body_indent</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_text_body_enumeration</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_text_body_enumeration_last</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>nov_text_table_intro_SingleCol</div>
                      <div style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>Section_MetaInfo</div>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>Table handling — MDD is the source of truth</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Tables are shown as rendered data while drafting, and replaced with the MDD code on export:
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                      <div><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>[Table Reference: DP_Environment]</code> — Energy & GHG metrics</div>
                      <div><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>[Table Reference: DP_Climate_Target_Performance]</code> — Targets vs. progress</div>
                      <div><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>[Table Reference: DP_Workforce_HSE]</code> — H&S metrics</div>
                      <div><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>[Table Reference: DP_Governance]</code> — Ethics & compliance KPIs</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    <span>Sections: {sections.length}</span>
                    <span>Total words: {sections.reduce((sum, s) => sum + s.wordCount, 0).toLocaleString()}</span>
                    <span>Font: Volta Modern</span>
                  </div>
                  {/* Two Word variants (Adrian 21-Aug): readable (visible tables,
                      for offline reviewers) + MDD (placeholders, authoritative for
                      the corporate platform). PDF is the quick review copy. All
                      available any time; a not-all-approved export is a draft. */}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <strong>Word (readable)</strong> renders tables inline for people who review offline. <strong>Word (MDD)</strong> keeps table placeholders for the Novartis MDD platform. <strong>PDF</strong> is a quick read-only copy.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-ghost" onClick={() => setShowExportModal(false)}>Cancel</button>
                    <button className="btn-secondary" title="Export a readable PDF for review/sharing" onClick={() => runExport('pdf')}>Generate PDF</button>
                    <button className="btn-secondary" title="Word with visible, formatted tables for offline reviewers" onClick={() => runExport('docx-readable')}>Word (readable)</button>
                    <button className="btn-primary" title={allApproved ? 'MDD-compatible Word (table placeholders)' : 'MDD-compatible Word (draft — not all subsections Approved yet)'} onClick={() => runExport('docx-mdd')}>{allApproved ? 'Word (MDD)' : 'Word (MDD) — draft'}</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                    {exportProgress < 100 ? 'Generating MDD-Compatible DOCX...' : 'Export Complete!'}
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${exportProgress}%`, height: '100%', background: exportProgress < 100 ? 'var(--accent)' : '#16a34a', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {exportProgress < 20 && 'Serializing document model...'}
                    {exportProgress >= 20 && exportProgress < 40 && 'Mapping content to nov_* paragraph styles...'}
                    {exportProgress >= 40 && exportProgress < 60 && 'Inserting table placeholders [Table Reference: DP_*]...'}
                    {exportProgress >= 60 && exportProgress < 80 && 'Embedding citation footnotes...'}
                    {exportProgress >= 80 && exportProgress < 95 && 'Validating MDD style checklist compliance...'}
                    {exportProgress >= 95 && 'Generating pre-signed download URL...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {/* Structure review modal — per-item diff before applying */}
      {showStructReview && structDiff && pendingPublish && (
        <div className="modal-overlay" onClick={() => setShowStructReview(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Review structure changes</h3>
              <button className="btn-ghost" onClick={() => setShowStructReview(false)} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>
            </div>
            <div style={{ padding: '0 24px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Published by <strong>{pendingPublish.publishedBy}</strong>. Existing section content, roles and workflow state are preserved; new subsections come in as <em>draft</em> and flagged <em>new</em> for year-on-year review.
              </div>
              {structDiff.added.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '4px' }}>Added ({structDiff.added.length})</div>
                  {structDiff.added.map(r => <div key={r.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>+ {[r.topicL1, r.topicL2, r.topicL3].filter(Boolean).join(' › ')}</div>)}
                </div>
              )}
              {structDiff.renamed.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>Renamed ({structDiff.renamed.length})</div>
                  {structDiff.renamed.map((r, i) => <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>“{r.from}” → “{r.to}”</div>)}
                </div>
              )}
              {structDiff.moved.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>Moved ({structDiff.moved.length})</div>
                  {structDiff.moved.map(r => <div key={r.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>↕ {[r.topicL1, r.topicL2, r.topicL3].filter(Boolean).join(' › ')}</div>)}
                </div>
              )}
              {structDiff.removed.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>Removed ({structDiff.removed.length})</div>
                  {structDiff.removed.map(r => <div key={r.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>− {[r.topicL1, r.topicL2, r.topicL3].filter(Boolean).join(' › ')}</div>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn-ghost" onClick={dismissPublishedStructure}>Dismiss</button>
                <button className="btn-primary" onClick={applyPublishedStructure}>Apply to report</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Re-edit confirm — editing an Approved section snapshots a version + resets to Draft */}
      {reEditConfirm && (() => {
        const sec = sections.find(s => s.id === reEditConfirm);
        if (!sec) return null;
        const nextV = sectionVersions.filter(v => v.sectionId === sec.id).length + 1;
        return (
          <div className="modal-overlay" onClick={() => setReEditConfirm(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Edit an approved subsection?</h3>
                <button className="btn-ghost" onClick={() => setReEditConfirm(null)} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>
              </div>
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ padding: '10px 12px', background: '#fef3c7', color: '#b45309', borderRadius: '6px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                  ⚠ <strong>{sec.ref}</strong> is {sec.stage === 'exported' ? 'Exported' : 'Approved'}. Editing will:
                </div>
                <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '18px', marginBottom: '16px' }}>
                  <li>Freeze the current approved content and its sign-offs as an immutable <strong>version {`v${nextV}`}</strong> (viewable in Versions).</li>
                  <li>Reset the subsection to <strong>Draft</strong>, requiring fresh SME and Legal sign-off before it is Approved again.</li>
                  <li>Preserve the full audit trail — nothing is overwritten silently.</li>
                </ul>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="btn-ghost" onClick={() => setReEditConfirm(null)}>Cancel</button>
                  <button className="btn-primary" onClick={confirmReEdit}>Snapshot &amp; edit</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Version history + diff viewer for the selected subsection */}
      {showVersions && (
        <VersionHistoryModal
          section={selectedSection}
          versions={sectionVersions}
          onClose={() => setShowVersions(false)}
        />
      )}

      {standardTextDr && (
        <StandardTextPopup
          drId={standardTextDr}
          onClose={() => setStandardTextDr(null)}
          onOpenSection={(id) => { const t = sections.find(x => x.id === id); if (t) { setSelectedSection(t); setEditMode(false); setSelectedL2(null); } }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
