import ComplianceView from './ComplianceView';
import ConsistencyCheckView from './ConsistencyCheckView';
import BenchmarkingView from './BenchmarkingView';
import { ScopedCompliance, ScopedConsistency } from './scoped/ScopedViews';
import { getReport, type ReportId } from '../data/reports';

// "Analysis" merges three previously-separate nav items into one, with tabs
// (Adrian 2026-07-14: fewer links; group Compliance + Consistency + Peer
// benchmarking under one "Analysis" entry). Compliance & consistency are
// report-scoped; peer benchmarking is shared across reports.
export type AnalysisTab = 'compliance' | 'consistency' | 'benchmarking';

const TABS: { id: AnalysisTab; label: string; hint: string }[] = [
  { id: 'compliance', label: 'Compliance', hint: '2027 ESRS readiness & gap analysis' },
  { id: 'consistency', label: 'Consistency Check', hint: 'Cross-document validation' },
  { id: 'benchmarking', label: 'Peer Benchmarking', hint: 'Cited Q&A vs. peer reports' },
];

interface Props {
  reportId: ReportId;
  tab: AnalysisTab;
  onTab: (t: AnalysisTab) => void;
}

export default function AnalysisView({ reportId, tab, onTab }: Props) {
  const isRnfm = reportId === 'rnfm';
  const report = getReport(reportId);
  const activeLabel = TABS.find(t => t.id === tab)?.label ?? 'Analysis';
  return (
    <>
      <div className="view-header">
        {/* Include the report + active tab so scoped reports stay identifiable
            (the child scoped title is hidden inside the tab body). */}
        <h1 className="view-title">{report.shortName} · Analysis · {activeLabel}</h1>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {TABS.find(t => t.id === tab)?.hint}
        </span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-primary)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={tab === t.id ? 'active' : ''}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px', fontFamily: 'var(--font-sans)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* The child views render their own content (headings, cards). We hide
          their duplicate view-header title via a wrapper class so the Analysis
          header is the single H1 on the page. */}
      <div className="analysis-tab-body">
        {tab === 'compliance' && (isRnfm ? <ComplianceView /> : <ScopedCompliance reportId={reportId} />)}
        {tab === 'consistency' && (isRnfm ? <ConsistencyCheckView /> : <ScopedConsistency reportId={reportId} />)}
        {tab === 'benchmarking' && <BenchmarkingView />}
      </div>
    </>
  );
}
