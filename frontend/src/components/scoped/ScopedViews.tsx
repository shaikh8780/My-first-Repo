// Per-report scoped views.
//
// Each report-scoped tab (Dashboard, Editor, Section Structure, Compliance,
// Consistency, Audit, Upload) renders the ACTIVE report's data. For the RNFM the
// scoped wrappers delegate to the existing rich views (EditorView, ComplianceView,
// etc.) unchanged. For the parallel reports (ESG Index, UPC, ASRS) they render
// real per-report content sourced from getReportDataset — no RNFM fallback.

import type { ReportId } from '../../data/reports';
import { getReport } from '../../data/reports';
import { getReportDataset, type ScopedSection } from '../../data/reportData';
import type { WorkflowStage } from '../../data/reportSections';
import ParallelReportView from '../ParallelReportView';

const stageLabels: Record<WorkflowStage, string> = {
  draft: 'Draft', sme_review: 'SME Review', legal_review: 'Legal Review', approved: 'Approved', exported: 'Exported',
};
const stageBadgeClass = (s: WorkflowStage) =>
  s === 'approved' || s === 'exported' ? 'status-covered' : s === 'legal_review' ? 'status-partial' : 'status-missing';

function ScopedHeader({ reportId, tab }: { reportId: ReportId; tab: string }) {
  const def = getReport(reportId);
  return (
    <div className="view-header">
      <h1 className="view-title">{def.shortName} · {tab}</h1>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{def.name}</span>
    </div>
  );
}

// A shared banner making clear a parallel report reuses the RNFM knowledge base.
function ParallelNote({ reportId }: { reportId: ReportId }) {
  const def = getReport(reportId);
  return (
    <div style={{ padding: '10px 14px', background: 'var(--accent-light)', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--accent)', fontSize: '12px', color: 'var(--accent)' }}>
      <strong>Parallel output ({def.statusLabel}).</strong> Shares the RNFM knowledge base; has its own structure, workflow and compliance mapping. {def.description}
    </div>
  );
}

function StageDistribution({ sections }: { sections: ScopedSection[] }) {
  const order: WorkflowStage[] = ['draft', 'sme_review', 'legal_review', 'approved', 'exported'];
  const counts = order.map(st => ({ st, n: sections.filter(s => s.stage === st).length }));
  const total = sections.length || 1;
  return (
    <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
      {counts.map(({ st, n }) => (
        n > 0 ? <div key={st} title={`${stageLabels[st]}: ${n}`} style={{ width: `${(n / total) * 100}%`, background: st === 'approved' || st === 'exported' ? '#16a34a' : st === 'legal_review' ? '#3b82f6' : st === 'sme_review' ? '#f59e0b' : '#8b5cf6' }} /> : null
      ))}
    </div>
  );
}

// ---- Dashboard -------------------------------------------------------------
export function ScopedDashboard({ reportId }: { reportId: ReportId }) {
  const ds = getReportDataset(reportId);
  const def = getReport(reportId);
  return (
    <>
      <ScopedHeader reportId={reportId} tab="Dashboard" />
      {!ds.isPrimary && <ParallelNote reportId={reportId} />}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{ds.workflow.total}</div><div className="stat-label">Sections</div></div>
        <div className="stat-card"><div className="stat-value">{ds.compliance.coveragePercent}%</div><div className="stat-label">Coverage</div></div>
        <div className="stat-card"><div className="stat-value">{ds.workflow.byStage.approved}</div><div className="stat-label">Approved</div></div>
        <div className="stat-card"><div className="stat-value">{ds.workflow.overdue}</div><div className="stat-label">In draft</div></div>
      </div>
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 className="card-title">Workflow progress</h2>
        <StageDistribution sections={ds.sections} />
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {(['draft', 'sme_review', 'legal_review', 'approved', 'exported'] as WorkflowStage[]).map(st => (
            <span key={st}>{stageLabels[st]}: <strong style={{ color: 'var(--text-primary)' }}>{ds.workflow.byStage[st]}</strong></span>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 className="card-title">Sections</h2>
        <table className="data-table">
          <thead><tr><th>Ref</th><th>Section</th><th>Owner</th><th>Stage</th></tr></thead>
          <tbody>
            {ds.sections.map(s => (
              <tr key={s.ref}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.ref}</td>
                <td style={{ fontWeight: 500 }}>{s.title}</td>
                <td style={{ fontSize: '12px' }}>{s.owner}</td>
                <td><span className={`status-badge ${stageBadgeClass(s.stage)}`}>{stageLabels[s.stage]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {def.crossReferences.length > 0 && (
        <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
          <h2 className="card-title">Cross-referenced from the RNFM</h2>
          <table className="data-table">
            <thead><tr><th>This report</th><th>Sourced from RNFM</th></tr></thead>
            <tbody>
              {def.crossReferences.map((x, i) => (
                <tr key={i}><td style={{ fontWeight: 500 }}>{x.from}</td><td style={{ fontSize: '12px', color: 'var(--accent)' }}>→ {x.toReportSection}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ---- Section Structure -----------------------------------------------------
export function ScopedStructure({ reportId }: { reportId: ReportId }) {
  const ds = getReportDataset(reportId);
  return (
    <>
      <ScopedHeader reportId={reportId} tab="Section Structure" />
      {!ds.isPrimary && <ParallelNote reportId={reportId} />}
      <div className="card" style={{ padding: '20px' }}>
        <h2 className="card-title">Structure ({ds.sections.length} sections)</h2>
        <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
          {ds.sections.map((s, i) => (
            <div key={s.ref} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: i < ds.sections.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '32px' }}>{s.ref}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.title}</div>
                {s.topicL2 && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.topicL2}</div>}
              </div>
              <span className={`status-badge ${stageBadgeClass(s.stage)}`} style={{ fontSize: '10px' }}>{stageLabels[s.stage]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---- Compliance ------------------------------------------------------------
export function ScopedCompliance({ reportId }: { reportId: ReportId }) {
  const ds = getReportDataset(reportId);
  const c = ds.compliance;
  return (
    <>
      <ScopedHeader reportId={reportId} tab="Compliance" />
      {!ds.isPrimary && <ParallelNote reportId={reportId} />}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value" style={{ color: '#16a34a' }}>{c.covered}</div><div className="stat-label">Covered</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#f59e0b' }}>{c.partial}</div><div className="stat-label">Partial</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#ef4444' }}>{c.missing}</div><div className="stat-label">Missing</div></div>
        <div className="stat-card"><div className="stat-value">{c.coveragePercent}%</div><div className="stat-label">Coverage</div></div>
      </div>
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 className="card-title">Frameworks mapped</h2>
        <div className="frameworks-grid">
          {c.frameworks.map(f => <div key={f} className="framework-badge">{f}</div>)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
          {ds.isPrimary
            ? 'Full disclosure-requirement mapping is available in the RNFM compliance dashboard.'
            : 'Coverage reflects how many of this report’s sections are mapped to their target framework requirements; mandatory data points draw from the shared knowledge base.'}
        </div>
      </div>
    </>
  );
}

// ---- Consistency Check -----------------------------------------------------
export function ScopedConsistency({ reportId }: { reportId: ReportId }) {
  const ds = getReportDataset(reportId);
  const badge = (st: string) => st === 'pass' ? 'status-covered' : st === 'fail' ? 'status-missing' : 'status-partial';
  return (
    <>
      <ScopedHeader reportId={reportId} tab="Consistency Check" />
      {!ds.isPrimary && <ParallelNote reportId={reportId} />}
      <div className="card" style={{ padding: '20px' }}>
        <h2 className="card-title">Cross-document checks ({ds.consistency.length})</h2>
        <table className="data-table">
          <thead><tr><th>Check</th><th>This report</th><th>Reference</th><th>Status</th></tr></thead>
          <tbody>
            {ds.consistency.map(c => (
              <tr key={c.id}>
                <td><div style={{ fontWeight: 500, fontSize: '13px' }}>{c.description}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.section} · {c.category}</div></td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.rnfmValue}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.annualReportValue}</td>
                <td><span className={`status-badge ${badge(c.status)}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---- Audit Trail -----------------------------------------------------------
export function ScopedAudit({ reportId }: { reportId: ReportId }) {
  const ds = getReportDataset(reportId);
  return (
    <>
      <ScopedHeader reportId={reportId} tab="Audit Trail" />
      {!ds.isPrimary && <ParallelNote reportId={reportId} />}
      <div className="card" style={{ padding: '20px' }}>
        <h2 className="card-title">Audit events ({ds.audit.length})</h2>
        <table className="data-table">
          <thead><tr><th>Time (UTC)</th><th>User</th><th>Action</th><th>Detail</th></tr></thead>
          <tbody>
            {ds.audit.map(e => (
              <tr key={e.id}>
                <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(e.timestamp).toLocaleString()}</td>
                <td style={{ fontSize: '12px' }}>{e.user}<div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{e.role}</div></td>
                <td><span className="status-badge status-partial" style={{ fontSize: '10px' }}>{e.action}</span></td>
                <td style={{ fontSize: '12px' }}>{e.section ? <span style={{ color: 'var(--accent)' }}>[{e.section}] </span> : null}{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---- Editor (parallel reports) --------------------------------------------
// The RNFM editor is the full authoring studio (routed separately in App). For
// parallel reports the "editor" tab surfaces the ParallelReportView, which is the
// report's authored content (UPC template tables, ASRS mapping, etc.).
export function ScopedParallelEditor({ reportId }: { reportId: ReportId }) {
  return <ParallelReportView reportId={reportId} />;
}
