import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportMetadata, reportSections, rollForwardLabels, rollForwardColors, type RollForwardStatus } from '../data/reportSections';
import { complianceStats } from '../data/complianceMappings';
import { workflowStats, sectionAssignments, rollForwardStats } from '../data/workflowState';
import { loadLiveWorkflowRollup, STATUS_ORDER, type LiveWorkflowRollup, type DerivedStatusKey } from '../data/workflowStatus';
import { kbStats } from '../data/knowledgeBaseDocuments';
import { auditEvents } from '../data/auditEvents';
import { useAuth } from '../auth/useAuth';
import { ROLE_PERMISSIONS, ACTING_ROLE_LABEL, type ActingRole } from '../data/workflowRoles';
import { canManageReportCycle } from '../data/permissions';

const stageLabels: Record<string, string> = { draft: 'Draft', sme_review: 'SME Review', legal_review: 'Legal Review', approved: 'Approved', exported: 'Exported' };

// A single actionable item for the personalized "Open tasks" card (Adrian
// 2026-07-14: replace the generic workflow timeline with the current user's own
// assigned work). Priority: overdue first, then earliest due date.
interface OpenTask {
  sectionId: string;
  ref: string;
  title: string;
  action: string;     // what the user needs to do
  roleLabel: string;  // the seat they hold on this section
  seatHolder: string; // the person assigned to that seat on this section
  dueDate: string;
  overdue: boolean;
  accent: string;
}

interface Props {
  onNavigate: (view: 'dashboard' | 'editor' | 'compliance' | 'knowledgebase' | 'benchmarking' | 'audit' | 'upload' | 'guide' | 'architecture' | 'suggestions' | 'reports' | 'consistency' | 'policies' | 'demo') => void;
}

export default function DashboardView({ onNavigate }: Props) {
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [cycleStep, setCycleStep] = useState(0);
  const [cycleConfig, setCycleConfig] = useState({ year: '2026', title: 'Novartis Report on Nonfinancial Matters FY2026', template: '2025_structure', generateDraft: true });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const recentEvents = auditEvents.slice(-8).reverse();

  const navigate = useNavigate();
  const { alias } = useAuth();
  const me = alias ? alias.charAt(0).toUpperCase() + alias.slice(1) : 'You (ESG Lead)';
  // Starting a new reporting cycle is an ESG Reporting Lead (Editor/Admin)
  // capability — a Cognito group in production.
  const canManageCycle = canManageReportCycle(alias);

  // "View tasks as" role switch: preview the open-task queue for each role.
  // Lands on Admin (the ESG Reporting Lead — the primary full-access seat); no
  // separate "Me" option (it duplicated Admin and masked true per-role behaviour,
  // matching the editor's "View as" simplification).
  // Roles with outstanding *actions*: input_provider (draft/edit) and owner
  // (review + L2 sign-off); editor/admin see everything in flight; guest and
  // auditor are read-only (no tasks). IPs no longer sign off (Adrian 2026-08-31).
  type TaskRole = ActingRole;
  const [taskRole, setTaskRole] = useState<TaskRole>('admin');
  const effectiveRole: ActingRole = taskRole;
  const perms = ROLE_PERMISSIONS[effectiveRole];

  // Open tasks for the SELECTED role, derived from the assignment + stage data
  // AND validated against the role's permission matrix so the dashboard can
  // never surface an action the role isn't allowed to perform (single source of
  // truth = ROLE_PERMISSIONS, same as the editor). Rules:
  //  - a DRAFT needs its Input Provider (or an all-scope editor/admin) to draft;
  //    only surfaced to a role that canEdit.
  //  - an in-review section needs an Owner sign-off; only surfaced to a role
  //    that canSignOff at L2 (owner/admin) or an all-scope editor reviewing.
  const openTasks = useMemo<OpenTask[]>(() => {
    // A role that can neither edit, sign off, nor review changes (guest) has no
    // actionable tasks — the queue is empty by permission, not by chance.
    if (!perms.canEdit && !perms.canSignOff && !perms.canReviewChanges) return [];

    const seesAll = perms.editScope === 'all'; // editor/admin see the whole cycle
    const isL2Signer = perms.canSignOff && perms.signOffLevel === 'L2';
    const tasks: OpenTask[] = [];
    for (const s of sectionAssignments) {
      if (s.stage === 'approved' || s.stage === 'exported') continue;
      let action: string | null = null;
      let roleLabel = '';
      let accent = 'var(--accent)';

      if (s.stage === 'draft') {
        // Drafting is an Input Provider action (requires canEdit). All-scope
        // seats (editor/admin, incl. the "me" seat) see every draft in flight;
        // the Input Provider role sees the drafts where it holds that seat.
        const holdsIpSeat = seesAll || (effectiveRole === 'input_provider' && perms.canEdit);
        if (holdsIpSeat) { action = 'Draft & submit for review'; roleLabel = 'Input Provider'; accent = '#6366f1'; }
      } else if (s.stage === 'sme_review' || s.stage === 'legal_review') {
        // Owner sign-off at L2. All-scope seats see every in-review section; the
        // Owner role sees the sections it owns. A role that can't sign off at L2
        // (input_provider) never gets an owner task — matches the editor gate.
        const holdsOwnerSeat = seesAll || (effectiveRole === 'owner' && isL2Signer);
        if (holdsOwnerSeat) { action = 'Review & Owner sign-off'; roleLabel = 'Owner'; accent = '#8b5cf6'; }
      }
      if (!action) continue;
      // The assignee shown is the person who holds this seat on this section, so
      // the preview names a real seat-holder rather than the logged-in user.
      const seatHolder = roleLabel === 'Input Provider' ? s.inputProvider : (s.owners[0] ?? 'Unassigned');
      tasks.push({ sectionId: s.sectionId, ref: s.ref, title: s.sectionTitle, action, roleLabel, dueDate: s.dueDate, overdue: s.overdue, accent, seatHolder });
    }
    // Overdue first, then by due date ascending.
    tasks.sort((a, b) => (a.overdue === b.overdue ? a.dueDate.localeCompare(b.dueDate) : a.overdue ? -1 : 1));
    return tasks;
  }, [taskRole, effectiveRole, perms]);
  const overdueTaskCount = openTasks.filter(t => t.overdue).length;

  // Live workflow rollup derived from the editor's actual sign-off state (IP L3
  // → Owner/Legal L2), so an Owner sign-off in the editor is reflected here —
  // not the static seed. Read once on mount; re-read on focus/visibility so a
  // sign-off made while this tab was backgrounded shows on return.
  const [liveRollup, setLiveRollup] = useState<LiveWorkflowRollup>(() => ({
    statuses: [],
    byKey: STATUS_ORDER.reduce((acc, k) => { acc[k] = 0; return acc; }, {} as Record<DerivedStatusKey, number>),
    total: 0,
    completionPercent: 0,
  }));
  useEffect(() => {
    let alive = true;
    const refresh = () => { void loadLiveWorkflowRollup().then(r => { if (alive) setLiveRollup(r); }); };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      alive = false;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Top-level topic counts for the "prior year as base" cycle modal.
  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of reportSections) map.set(s.topicL1, (map.get(s.topicL1) ?? 0) + 1);
    return Array.from(map.entries());
  }, []);

  const startNewCycle = () => {
    if (!canManageCycle) return; // gate: ESG Reporting Lead (Editor/Admin) only
    setShowNewCycleModal(true);
    setCycleStep(0);
    setCycleConfig({ year: '2026', title: 'Novartis Report on Nonfinancial Matters FY2026', template: '2025_structure', generateDraft: true });
    setIsGenerating(false);
    setGenerationProgress(0);
  };

  const handleNextStep = () => {
    if (cycleStep === 2) {
      setIsGenerating(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            setShowNewCycleModal(false);
            setIsGenerating(false);
            onNavigate('editor');
          }, 800);
        }
        setGenerationProgress(Math.min(progress, 100));
      }, 600);
    } else {
      setCycleStep(s => s + 1);
    }
  };

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Dashboard</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* "View tasks as" — placed in the page header to match the editor's
              "View as" switch (2026-07-15). Drives the "My Open Tasks" queue,
              validated against ROLE_PERMISSIONS. */}
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View tasks as</label>
          <select
            value={taskRole}
            onChange={e => setTaskRole(e.target.value as TaskRole)}
            title="Preview the open-task queue for a role. Tasks are validated against each role's permissions."
            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid var(--border-primary)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600 }}
          >
            <option value="admin">Admin — ESG Reporting Lead ({me})</option>
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
            <option value="input_provider">Input Provider</option>
            <option value="guest">Guest</option>
          </select>
          {canManageCycle && (
            <button className="btn-primary" onClick={startNewCycle}>New Report Cycle</button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">1</div>
          <div className="stat-label">Active Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{complianceStats.coveragePercent}%</div>
          <div className="stat-label">2027 ESRS Readiness</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{workflowStats.overdue}</div>
          <div className="stat-label">Overdue Sections</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{kbStats.indexed}</div>
          <div className="stat-label">KB Documents</div>
        </div>
      </div>

      {/* Report Progress */}
      <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
        <h2 className="card-title">
          Report Progress — {reportMetadata.title}
          <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{liveRollup.completionPercent}% approved</span>
        </h2>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', height: '28px', borderRadius: '6px', overflow: 'hidden' }}>
          {STATUS_ORDER.map(k => {
            const count = liveRollup.byKey[k];
            if (!count) return null;
            const meta = liveRollup.statuses.find(s => s.key === k)!;
            return (
              <div key={k} title={`${meta.label}: ${count}`} style={{ flex: count, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 600, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {meta.short} ({count})
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {STATUS_ORDER.map(k => {
            const count = liveRollup.byKey[k];
            if (!count) return null;
            const meta = liveRollup.statuses.find(s => s.key === k)!;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: meta.color }}></div>
                <span style={{ color: 'var(--text-muted)' }}>{meta.short}: {count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Tasks (assigned) — personalized, with a role switch (2026-07-15).
          The queue is derived per role and validated against ROLE_PERMISSIONS so
          it never surfaces an action the role can't perform. */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Open Tasks · {ACTING_ROLE_LABEL[effectiveRole]}</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {openTasks.length} open{overdueTaskCount > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}> · {overdueTaskCount} overdue</span>}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 14px' }}>
          {`Outstanding actions a ${ACTING_ROLE_LABEL[effectiveRole]} can act on — ${perms.editScope === 'all' ? 'all sections in flight' : perms.canSignOff || perms.canEdit ? 'the sections where they hold that seat' : 'read-only, no actionable tasks'}. Validated against ${ACTING_ROLE_LABEL[effectiveRole]} permissions.`}
        </div>
        {openTasks.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            {effectiveRole === 'guest'
              ? '👁 Guest is read-only (view + comment) — no actionable tasks.'
              : `✓ No open tasks for a ${ACTING_ROLE_LABEL[effectiveRole]} right now.`}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {openTasks.slice(0, 12).map(t => (
              <button
                key={t.sectionId}
                onClick={() => navigate(`/editor?section=${encodeURIComponent(t.sectionId)}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-primary)', borderLeft: `3px solid ${t.accent}`, background: 'var(--bg-primary)', cursor: 'pointer' }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)', minWidth: '44px' }}>{t.ref}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.action} · <span style={{ color: t.accent, fontWeight: 600 }}>{t.roleLabel}</span><span style={{ color: 'var(--text-muted)' }}> · {t.seatHolder}</span></span>
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', color: t.overdue ? '#ef4444' : 'var(--text-muted)' }}>
                  {t.overdue ? '⚠ ' : ''}{t.dueDate}{t.overdue ? ' (overdue)' : ''}
                </span>
              </button>
            ))}
            {openTasks.length > 12 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4px' }}>…and {openTasks.length - 12} more</div>
            )}
          </div>
        )}
      </div>

      {/* Compliance Summary */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">Compliance Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a' }}>{complianceStats.covered}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>COVERED</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#f59e0b' }}>{complianceStats.partial}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PARTIAL</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444' }}>{complianceStats.missing}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MISSING</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>{complianceStats.total}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL DRs</div>
          </div>
        </div>
      </div>

      {/* Year-on-year Roll-forward (C/L) */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">Year-on-Year Roll-forward</h2>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Baseline: <strong>{reportMetadata.baselineReport}</strong>. All {rollForwardStats.total} subsections carried forward; the AI flags what needs updating.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {(['updated', 'needs_update', 'confirmed_unchanged', 'new'] as RollForwardStatus[]).map(st => (
            <div key={st} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderTop: `3px solid ${rollForwardColors[st]}` }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: rollForwardColors[st] }}>{rollForwardStats[st]}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{rollForwardLabels[st]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Assignments — Input Provider + owners per subsection */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">Subsection Assignments</h2>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Each subsection has its own workflow: one Input Provider and one or more Owners (a legal reviewer is assigned as an owner). Showing 10 of {sectionAssignments.length}.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '820px' }}>
            <thead>
              <tr>
                <th style={{ width: '48px' }}>Ref</th>
                <th>Subsection</th>
                <th>Input Provider</th>
                <th>Owners (sign-off)</th>
                <th>Stage</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {sectionAssignments.filter(s => s.overdue || s.stage !== 'approved').slice(0, 10).map(s => (
                <tr key={s.sectionId}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{s.ref}</td>
                  <td style={{ fontWeight: 500 }}>{s.sectionTitle}</td>
                  <td style={{ fontSize: '12px' }}>{s.inputProvider}</td>
                  <td style={{ fontSize: '12px' }}>{s.owners.join(', ')}</td>
                  <td><span className={`status-badge status-${s.stage === 'approved' ? 'covered' : s.stage === 'legal_review' ? 'partial' : s.stage === 'draft' ? 'missing' : 'partial'}`}>{stageLabels[s.stage]}</span></td>
                  <td style={{ color: s.overdue ? '#ef4444' : 'var(--text-secondary)' }}>{s.dueDate}{s.overdue ? ' (overdue)' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">Recent Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentEvents.map(evt => (
            <div key={evt.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '80px', paddingTop: '2px' }}>{new Date(evt.timestamp).toLocaleDateString()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{evt.user} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {evt.action}</span></div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{evt.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Frameworks */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">Supported Frameworks</h2>
        <div className="frameworks-grid">
          <div className="framework-badge">Swiss CO Art. 964a</div>
          <div className="framework-badge">GRI (with reference)</div>
          <div className="framework-badge">TCFD / Swiss Climate Ordinance</div>
          <div className="framework-badge">ESRS (2027 readiness)</div>
        </div>
      </div>

      {/* New Report Cycle Modal */}
      {showNewCycleModal && (
        <div className="modal-overlay" onClick={() => !isGenerating && setShowNewCycleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>New Report Cycle</h3>
              {!isGenerating && (
                <button className="btn-ghost" onClick={() => setShowNewCycleModal(false)} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>
              )}
            </div>

            {/* Step Indicators */}
            <div style={{ display: 'flex', gap: '4px', padding: '0 24px', marginBottom: '20px' }}>
              {['Configure', 'Sections', 'Generate'].map((label, i) => (
                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: '4px', borderRadius: '2px', background: i <= cycleStep ? 'var(--accent)' : 'var(--bg-secondary)', marginBottom: '6px', transition: 'background 0.3s' }}></div>
                  <div style={{ fontSize: '11px', color: i <= cycleStep ? 'var(--accent)' : 'var(--text-muted)', fontWeight: i === cycleStep ? 600 : 400 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              {cycleStep === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Report Title</label>
                    <input
                      type="text"
                      value={cycleConfig.title}
                      onChange={e => setCycleConfig(c => ({ ...c, title: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Reporting Year</label>
                    <select
                      value={cycleConfig.year}
                      onChange={e => setCycleConfig(c => ({ ...c, year: e.target.value, title: `Novartis Report on Nonfinancial Matters FY${e.target.value}` }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="2027">FY2027</option>
                      <option value="2026">FY2026</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Section Template</label>
                    <select
                      value={cycleConfig.template}
                      onChange={e => setCycleConfig(c => ({ ...c, template: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '13px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="prior_year_base">Prior year as base — FY2025 final ({reportMetadata.totalSubsections} subsections)</option>
                      <option value="esrs_full">2027 ESRS-aligned structure (edit structure first)</option>
                    </select>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      The prior year's final approved report is imported as the baseline. All subsections carry forward; you then add, edit or archive as needed.
                    </div>
                  </div>
                </div>
              )}

              {cycleStep === 1 && (
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    The prior year's structure ({reportMetadata.totalSubsections} subsections across {topicCounts.length} top-level topics) is carried forward. Each subsection keeps its own workflow, roles and roll-forward status:
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '6px', padding: '12px' }}>
                    {topicCounts.map(([topic, count], i) => (
                      <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 6px', borderBottom: i < topicCounts.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '24px' }}>{i + 1}.</span>
                        <span style={{ fontSize: '13px' }}>{topic}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({count})</span>
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: '4px' }}>Roll-forward</span>
                      </div>
                    ))}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={cycleConfig.generateDraft}
                      onChange={e => setCycleConfig(c => ({ ...c, generateDraft: e.target.checked }))}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Roll forward prior-year text and flag data needing YoY update
                  </label>
                </div>
              )}

              {cycleStep === 2 && !isGenerating && (
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Review and confirm your report cycle configuration:</div>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Title:</span>
                      <span style={{ fontWeight: 600 }}>{cycleConfig.title}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Reporting Year:</span>
                      <span style={{ fontWeight: 600 }}>FY{cycleConfig.year}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subsections:</span>
                      <span style={{ fontWeight: 600 }}>{reportMetadata.totalSubsections} subsections</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>AI Draft Generation:</span>
                      <span style={{ fontWeight: 600, color: cycleConfig.generateDraft ? '#16a34a' : 'var(--text-secondary)' }}>{cycleConfig.generateDraft ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Knowledge Base:</span>
                      <span style={{ fontWeight: 600 }}>{kbStats.indexed} documents indexed</span>
                    </div>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                    {generationProgress < 100 ? 'Generating AI Draft...' : 'Complete!'}
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${generationProgress}%`, height: '100%', background: generationProgress < 100 ? 'var(--accent)' : '#16a34a', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {generationProgress < 30 && 'Retrieving source documents from knowledge base...'}
                    {generationProgress >= 30 && generationProgress < 60 && 'Generating section drafts with AI...'}
                    {generationProgress >= 60 && generationProgress < 90 && 'Running compliance mapping...'}
                    {generationProgress >= 90 && generationProgress < 100 && 'Finalizing report structure...'}
                    {generationProgress >= 100 && 'Redirecting to Report Editor...'}
                  </div>
                </div>
              )}

              {!isGenerating && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button
                    className="btn-ghost"
                    onClick={() => cycleStep === 0 ? setShowNewCycleModal(false) : setCycleStep(s => s - 1)}
                  >
                    {cycleStep === 0 ? 'Cancel' : 'Back'}
                  </button>
                  <button className="btn-primary" onClick={handleNextStep}>
                    {cycleStep === 2 ? (cycleConfig.generateDraft ? 'Generate & Open Editor' : 'Create Report') : 'Next'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
