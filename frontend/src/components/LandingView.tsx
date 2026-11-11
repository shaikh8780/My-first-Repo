// Home — the cross-report landing page.
//
// Report-agnostic: sits ABOVE the report switcher and aggregates across every
// report via getPortfolioSummary() + getMyTasks() (data/portfolio.ts). Two
// blocks: (1) portfolio status board — a card per report; (2) role-filtered
// "My tasks across all reports" for the signed-in user.
//
// Role behaviour: ESG Lead / Admin (canManageReportCycle) see a "portfolio
// owner" framing; everyone else sees their own task queue. Task ownership for
// parallel reports is seeded demo data (see reportData.ts) — labelled as such.

import type { ReportId } from '../data/reports';
import type { WorkflowStage } from '../data/reportSections';
import { getPortfolioSummary, getMyTasks, type PortfolioReportRow } from '../data/portfolio';
import { canManageReportCycle } from '../data/permissions';

interface Props {
  alias: string | null;
  onOpenReport: (id: ReportId) => void;
}

const STAGE_META: Record<WorkflowStage, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#8b5cf6' },
  sme_review: { label: 'SME Review', color: '#f59e0b' },
  legal_review: { label: 'Legal Review', color: '#3b82f6' },
  approved: { label: 'Approved', color: '#16a34a' },
  exported: { label: 'Exported', color: '#15803d' },
};
const STAGE_ORDER: WorkflowStage[] = ['draft', 'sme_review', 'legal_review', 'approved', 'exported'];
const statusColor: Record<string, string> = { active: '#16a34a', new: '#8b5cf6', future: '#f59e0b', legacy: '#9ca3af' };

function StageBar({ byStage, total }: { byStage: Record<WorkflowStage, number>; total: number }) {
  const denom = total || 1;
  return (
    <div style={{ display: 'flex', height: '8px', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
      {STAGE_ORDER.map(st => {
        const n = byStage[st] ?? 0;
        return n > 0 ? <div key={st} title={`${STAGE_META[st].label}: ${n}`} style={{ width: `${(n / denom) * 100}%`, background: STAGE_META[st].color }} /> : null;
      })}
    </div>
  );
}

function ReportCard({ row, onOpen }: { row: PortfolioReportRow; onOpen: () => void }) {
  const { def } = row;
  return (
    <div className="card" style={{ padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>{def.shortName}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{def.name}</div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', color: '#fff', background: statusColor[def.status], whiteSpace: 'nowrap' }}>
          {def.statusLabel.split('—')[0].trim()}
        </span>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>{row.progressPercent}% signed off</span>
          <span>{row.total} sections</span>
        </div>
        <StageBar byStage={row.byStage} total={row.total} />
      </div>

      <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
        <span>Coverage <strong style={{ color: 'var(--text-primary)' }}>{row.coveragePercent}%</strong></span>
        <span>
          Checks{' '}
          {row.openFlags === 0
            ? <strong style={{ color: '#16a34a' }}>all pass</strong>
            : <strong style={{ color: row.failFlags > 0 ? '#ef4444' : '#f59e0b' }}>{row.openFlags} open{row.failFlags > 0 ? ` (${row.failFlags} fail)` : ''}</strong>}
        </span>
      </div>

      {row.lastActivity && (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)', paddingTop: '8px' }}>
          Last: {row.lastActivity.user} · {new Date(row.lastActivity.timestamp).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default function LandingView({ alias, onOpenReport }: Props) {
  const summary = getPortfolioSummary();
  const { tasks, unfiltered } = getMyTasks(alias);
  const isLead = canManageReportCycle(alias);
  const who = alias || 'guest';

  // Group tasks by report for a compact display.
  const tasksByReport = new Map<ReportId, typeof tasks>();
  for (const t of tasks) {
    const arr = tasksByReport.get(t.reportId) ?? [];
    arr.push(t);
    tasksByReport.set(t.reportId, arr);
  }

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Home</h1>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {isLead ? 'Portfolio overview across all reports' : `Your work across all reports · ${who}`}
        </span>
      </div>

      {/* Portfolio totals */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{summary.totals.reports}</div><div className="stat-label">Reports</div></div>
        <div className="stat-card"><div className="stat-value">{summary.totals.avgProgress}%</div><div className="stat-label">Avg. signed off</div></div>
        <div className="stat-card"><div className="stat-value">{summary.totals.avgCoverage}%</div><div className="stat-label">Avg. coverage</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: summary.totals.openFlags > 0 ? '#f59e0b' : '#16a34a' }}>{summary.totals.openFlags}</div><div className="stat-label">Open checks</div></div>
      </div>

      {/* Portfolio board */}
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 className="card-title">Reports</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {summary.rows.map(row => (
            <ReportCard key={row.def.id} row={row} onOpen={() => onOpenReport(row.def.id)} />
          ))}
        </div>
      </div>

      {/* My tasks across reports */}
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>
            {unfiltered ? 'Open tasks across all reports' : 'My tasks across all reports'}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tasks.length} open</span>
        </div>
        {unfiltered && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '6px', padding: '8px 12px', margin: '10px 0' }}>
            ⓘ No sections are assigned to “{who}”, so the full open queue is shown. Sign in as a section owner (e.g. sam.delgado, riley.okafor, morgan.reyes) to see a personalised list.
          </div>
        )}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: '4px' }}>
          Task ownership for parallel reports is illustrative demo data; RNFM & the Human Rights Statement use their real per-section roles.
        </div>

        {tasks.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>Nothing open — all your sections are signed off. 🎉</div>
        ) : (
          [...tasksByReport.entries()].map(([rid, list]) => (
            <div key={rid} style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{list[0].reportShort}</span>
                <button className="link-button" onClick={() => onOpenReport(rid)} style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  open →
                </button>
              </div>
              <table className="data-table">
                <thead><tr><th style={{ width: '70px' }}>Ref</th><th>Section</th><th style={{ width: '130px' }}>Stage</th><th style={{ width: '130px' }}>Action</th>{unfiltered && <th style={{ width: '140px' }}>Owner</th>}</tr></thead>
                <tbody>
                  {list.map((t, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{t.sectionRef}</td>
                      <td style={{ fontSize: '13px' }}>{t.sectionTitle}</td>
                      <td><span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color: '#fff', background: STAGE_META[t.stage].color }}>{STAGE_META[t.stage].label}</span></td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.action}</td>
                      {unfiltered && <td style={{ fontSize: '12px' }}>{t.owner}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </>
  );
}
