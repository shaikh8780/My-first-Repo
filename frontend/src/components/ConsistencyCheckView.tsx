import { useState, useMemo } from 'react';
import { consistencyChecks, consistencyStats, classifyContradiction, type CheckStatus } from '../data/consistencyChecks';
import { useAuth } from '../auth/useAuth';
import { canRunAnalysis } from '../data/permissions';

type StatusFilter = 'all' | CheckStatus;
type CategoryFilter = string;

export default function ConsistencyCheckView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const { alias } = useAuth();
  // Running the cross-document consistency check invokes backend analysis — an
  // Editor/Admin (ESG Lead) capability. Other roles read the results.
  const canRun = canRunAnalysis(alias);

  const categories = useMemo(() => {
    const cats = new Set(consistencyChecks.map(c => c.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filtered = useMemo(() => {
    return consistencyChecks.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      return true;
    });
  }, [statusFilter, categoryFilter]);

  const runCheck = () => {
    if (!canRun) return; // gate: Editors/Admins only
    if (running) return;
    setRunning(true);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 10 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setRunning(false);
          setProgress(0);
          setToast(`Consistency check complete — ${consistencyStats.fail} discrepancies found, ${consistencyStats.review} items need review`);
          setTimeout(() => setToast(null), 4000);
        }, 500);
      }
      setProgress(Math.min(p, 100));
    }, 300);
  };

  const statusIcon = (s: CheckStatus) => s === 'pass' ? '✓' : s === 'fail' ? '✗' : '?';
  const statusColor = (s: CheckStatus) => s === 'pass' ? '#16a34a' : s === 'fail' ? '#ef4444' : '#f59e0b';

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Consistency Check</h1>
        {canRun ? (
          <button className="btn-primary" onClick={runCheck} disabled={running}>
            {running ? 'Checking...' : 'Run Consistency Check'}
          </button>
        ) : (
          <span title="Running the consistency check is restricted to Editors/Admins (ESG Reporting Lead)" style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>👁 View-only</span>
        )}
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Cross-validates data points, metrics, and terminology between the <strong>RNFM (Sustainability Report)</strong> and the <strong>Annual Report / Form 20-F</strong>. Detects numerical discrepancies, terminology inconsistencies, and style guide violations across publications.
        </div>
      </div>

      {running && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Running Cross-Document Validation</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.2s ease' }}></div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#16a34a' }}>{consistencyStats.pass}</div>
          <div className="stat-label">Consistent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{consistencyStats.fail}</div>
          <div className="stat-label">Discrepancies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{consistencyStats.review}</div>
          <div className="stat-label">Needs Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{consistencyStats.total}</div>
          <div className="stat-label">Total Checks</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
            <div className="filter-tabs">
              {(['all', 'fail', 'review', 'pass'] as StatusFilter[]).map(s => (
                <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'All' : s === 'fail' ? 'Discrepancy' : s === 'review' ? 'Review' : 'Pass'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
            {filtered.length} of {consistencyStats.total} checks
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card" style={{ padding: '0', marginTop: '16px', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Status</th>
              <th style={{ width: '120px' }}>Category</th>
              <th style={{ width: '180px' }}>Data Point</th>
              <th>RNFM Value</th>
              <th>Annual Report Value</th>
              <th style={{ width: '70px' }}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(check => (
              <tr key={check.id}>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', fontSize: '12px', fontWeight: 700, background: `${statusColor(check.status)}15`, color: statusColor(check.status) }}>
                    {statusIcon(check.status)}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{check.category}</td>
                <td style={{ fontSize: '12px', fontWeight: 500 }}>{check.description}</td>
                <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{check.rnfmValue}</td>
                <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{check.annualReportValue}</td>
                <td>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase', background: check.severity === 'error' ? '#fee2e2' : check.severity === 'warning' ? '#fef3c7' : '#eff6ff', color: check.severity === 'error' ? '#dc2626' : check.severity === 'warning' ? '#d97706' : '#2563eb' }}>
                    {check.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discrepancy Details */}
      {filtered.filter(c => c.status !== 'pass').length > 0 && (
        <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Recommendations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.filter(c => c.status !== 'pass').map(check => {
              const analysis = classifyContradiction(check);
              return (
              <div key={check.id} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: `3px solid ${statusColor(check.status)}` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {check.description} — {check.section}
                  {/* Contradiction classification (Adrian 21-Aug): says WHETHER the
                      two reports genuinely contradict, and of what kind. */}
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', padding: '2px 8px', borderRadius: '10px', color: '#fff', background: analysis.contradicts ? '#dc2626' : '#6b7280' }}>
                    {analysis.contradicts ? '⚠ Contradiction' : 'Divergence'} · {analysis.kind.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '4px' }}>{analysis.detail}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{check.recommendation}</div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
