import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { complianceMappings, complianceStats, standardGroups, type CoverageStatus } from '../data/complianceMappings';
import StandardTextPopup from './editor/StandardTextPopup';
import { standardTextFor } from '../data/standardText';
import { aiCompliance, type AiComplianceResult } from '../api/aiClient';
import { useAuth } from '../auth/useAuth';
import { canRunAnalysis } from '../data/permissions';
import { downloadCsv } from '../utils/exportCsv';
import { peerInsightForDr } from '../data/peerBenchmarking';

type FrameworkFilter = 'all' | 'ESRS' | 'GRI' | 'TCFD' | 'ISSB' | 'MSA' | 'NTA';
type StatusFilter = 'all' | CoverageStatus;
type ViewMode = 'by-standard' | 'gap-analysis' | 'checklist';

export default function ComplianceView() {
  const navigate = useNavigate();
  // Open a report section in the editor (smoother editor↔analysis nav, #10):
  // the section pills deep-link to /editor?section=<id> so a reviewer can jump
  // straight from a datapoint's coverage to the section that addresses it.
  const openInEditor = (sectionId: string) => navigate(`/editor?section=${encodeURIComponent(sectionId)}`);
  const [framework, setFramework] = useState<FrameworkFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [expandedDr, setExpandedDr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState('');
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('by-standard');
  const [dmaFilter, setDmaFilter] = useState<'all' | 'material' | 'not-material'>('all');
  const [expandedStd, setExpandedStd] = useState<string | null>(null);
  // Datapoint whose verbatim standard text is shown (13-Jul feedback #11).
  const [standardTextDr, setStandardTextDr] = useState<string | null>(null);
  // Fresh AI explanations keyed by DR id (overrides the seeded rationale for
  // that row once fetched); plus which DR is currently generating.
  const [aiExplain, setAiExplain] = useState<Record<string, AiComplianceResult>>({});
  const [aiBusyDr, setAiBusyDr] = useState<string | null>(null);
  const { alias } = useAuth();
  // Running the compliance scan and the "Explain with AI" action invoke backend
  // AI — an Editor/Admin (ESG Lead) capability. Other roles read the results.
  const canRun = canRunAnalysis(alias);

  const explainWithAi = (m: typeof complianceMappings[number]) => {
    if (!canRun) return; // gate: Editors/Admins only
    if (aiBusyDr) return;
    setAiBusyDr(m.drId);
    const extract = standardTextFor(m.drId);
    const requirementText = extract ? extract.paragraphs.map(p => p.text).join('\n\n') : '';
    void aiCompliance({
      drId: m.drId, title: m.title, status: m.status,
      sectionTitle: m.sectionTitle, requirementText,
    })
      .then(res => {
        if (res) setAiExplain(prev => ({ ...prev, [m.drId]: res }));
        else setToast('AI explanation unavailable — showing the standard assessment.');
      })
      .finally(() => setAiBusyDr(null));
  };

  // Deep-link: ?dr=<id> (from the editor's datapoint chips, 2026-07-15). Focus
  // that DR in the gap-analysis view — filter to it, expand its detail row, and
  // open its requirement text. Runs once per dr value.
  const [searchParams, setSearchParams] = useSearchParams();
  const focusDr = searchParams.get('dr');
  useEffect(() => {
    if (!focusDr) return;
    const m = complianceMappings.find(x => x.drId === focusDr);
    if (!m) return;
    setViewMode('gap-analysis');
    setFramework('all');
    setStatus('all');
    setDmaFilter('all');
    setExpandedDr(focusDr);
    setStandardTextDr(focusDr);
    // Clear the param so re-navigating to the same DR re-triggers, and a manual
    // refresh doesn't keep re-opening the popup after the user closes it.
    setSearchParams({}, { replace: true });
  }, [focusDr, setSearchParams]);

  const filtered = useMemo(() => {
    return complianceMappings.filter(m => {
      if (framework !== 'all' && m.framework !== framework) return false;
      if (status !== 'all' && m.status !== status) return false;
      if (dmaFilter === 'material' && m.status === 'missing' && m.confidence < 0.2) return false;
      if (dmaFilter === 'not-material' && (m.status !== 'missing' || m.confidence >= 0.2)) return false;
      return true;
    });
  }, [framework, status, dmaFilter]);

  const statusColor = (s: CoverageStatus) => s === 'covered' ? '#16a34a' : s === 'partial' ? '#f59e0b' : '#ef4444';

  const runScan = () => {
    if (!canRun) return; // gate: Editors/Admins only
    if (scanning) return;
    setScanning(true);
    setScanProgress(0);

    const phases = [
      'Loading disclosure requirements...',
      'Analyzing section content against ESRS DRs...',
      'Evaluating GRI disclosure coverage...',
      'Mapping TCFD recommendations...',
      'Assessing ISSB IFRS S1/S2 alignment...',
      'Computing confidence scores...',
      'Generating gap suggestions...',
      'Finalizing compliance index...',
    ];

    let progress = 0;
    let phaseIdx = 0;
    setScanPhase(phases[0]);

    const interval = setInterval(() => {
      progress += Math.random() * 8 + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setScanning(false);
          setScanProgress(0);
          setLastScanTime(new Date().toISOString());
          setToast(`Scan complete — ${complianceStats.total} DRs analyzed, ${complianceStats.covered} covered, ${complianceStats.missing} gaps identified`);
          setTimeout(() => setToast(null), 4000);
        }, 500);
      }
      const newPhaseIdx = Math.min(Math.floor((progress / 100) * phases.length), phases.length - 1);
      if (newPhaseIdx !== phaseIdx) {
        phaseIdx = newPhaseIdx;
        setScanPhase(phases[phaseIdx]);
      }
      setScanProgress(Math.min(progress, 100));
    }, 500);
  };

  // Real CSV exports (Adrian/Thevi 21-Aug). Both honour the current framework /
  // status / DMA filters via the shared `filtered` set, so "export" matches what
  // is on screen. CSV opens directly in Excel.
  const exportChecklist = () => {
    const rows = filtered.map(m => [
      m.framework, m.standard, m.drId, m.title, m.status,
      m.sections.map(s => s.ref).join('; '),
      m.sectionTitle, `${Math.round(m.confidence * 100)}%`, m.lastScanned,
    ]);
    downloadCsv(
      `Novartis_Disclosure_Checklist_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Framework', 'Standard', 'DR ID', 'Requirement', 'Status', 'Section refs', 'Primary section', 'Confidence', 'Last scanned'],
      rows,
    );
    setToast(`Disclosure checklist exported — ${rows.length} rows (CSV / Excel)`);
    setTimeout(() => setToast(null), 3000);
  };

  // Gap analysis export: focuses on partial + missing DRs with the rationale,
  // whether adding is beneficial, and the AI-suggested fill — the "quick check"
  // summary Thevi asked for.
  const exportGapAnalysis = () => {
    const gaps = filtered.filter(m => m.status !== 'covered');
    const rows = gaps.map(m => [
      m.framework, m.standard, m.drId, m.title, m.status,
      `${Math.round(m.confidence * 100)}%`,
      m.rationale ?? '', m.additionBenefit ?? '', m.suggestedFill ?? '',
      m.sections.map(s => s.ref).join('; '),
    ]);
    downloadCsv(
      `Novartis_Gap_Analysis_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Framework', 'Standard', 'DR ID', 'Requirement', 'Status', 'Confidence', 'Why partial/missing', 'Should we add it?', 'AI-suggested fill', 'Section refs'],
      rows,
    );
    setToast(`Gap analysis exported — ${rows.length} gap${rows.length !== 1 ? 's' : ''} (CSV / Excel)`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">2027 ESRS Readiness Assessment</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {lastScanTime && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last scan: {new Date(lastScanTime).toLocaleTimeString()}</span>
          )}
          {canRun ? (
            <button className="btn-primary" onClick={runScan} disabled={scanning}>
              {scanning ? 'Scanning...' : 'Run Scan'}
            </button>
          ) : (
            <span title="Running the compliance scan is restricted to Editors/Admins (ESG Reporting Lead)" style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>👁 View-only</span>
          )}
        </div>
      </div>

      {/* Readiness context banner */}
      <div style={{ padding: '12px 16px', background: 'var(--accent-light)', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--accent)', fontSize: '12px', color: 'var(--accent)' }}>
        <strong>Note:</strong> The 2026 report is prepared under Swiss CO Art. 964a (GRI with reference, TCFD). ESRS becomes mandatory from FY2027 under EU CSRD. This analysis maps current report content against ESRS/ISSB requirements to identify gaps for next year.
      </div>

      {/* Honesty: the mapping shown is pre-computed seed data; in production the
          Compliance Gap Analysis Agent (Bedrock) produces it. "Run Scan" here
          replays the analysis view rather than invoking a live model. */}
      <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
        ⓘ Demo: the coverage mapping below is pre-computed. In the production Novartis environment the Compliance Gap Analysis agent generates it live; here “Run Scan” re-presents the existing results.
      </div>

      {/* View Mode Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '4px' }}>
        {([['by-standard', 'By Standard'], ['gap-analysis', 'Gap Analysis'], ['checklist', 'Disclosure Checklist']] as [ViewMode, string][]).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: viewMode === mode ? 'var(--bg-primary)' : 'transparent', color: viewMode === mode ? 'var(--accent)' : 'var(--text-muted)', boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scan Progress */}
      {scanning && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Compliance Scan in Progress</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{Math.round(scanProgress)}%</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ width: `${scanProgress}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{scanPhase}</div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#16a34a' }}>{complianceStats.covered}</div>
          <div className="stat-label">Covered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{complianceStats.partial}</div>
          <div className="stat-label">Partially Covered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{complianceStats.missing}</div>
          <div className="stat-label">Missing</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{complianceStats.total}</div>
          <div className="stat-label">Total DRs</div>
        </div>
      </div>

      {/* Coverage Bar */}
      <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Overall Coverage</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{complianceStats.coveragePercent}%</span>
        </div>
        <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          <div style={{ width: `${complianceStats.covered / complianceStats.total * 100}%`, background: '#16a34a' }}></div>
          <div style={{ width: `${complianceStats.partial / complianceStats.total * 100}%`, background: '#f59e0b' }}></div>
          <div style={{ width: `${complianceStats.missing / complianceStats.total * 100}%`, background: '#ef4444' }}></div>
        </div>
      </div>

      {/* By-Standard View (E: organized by standard, not by section) */}
      {viewMode === 'by-standard' && (
        <>
          <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', margin: '16px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Requirements are organized <strong>by standard</strong>. A single datapoint may be addressed across multiple report sections — expand a standard, then a datapoint, to see every section that satisfies it (bi-directional tagging).
          </div>

          {/* Framework filter reused */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Framework</div>
            <div className="filter-tabs">
              {(['all', 'ESRS', 'GRI', 'TCFD', 'ISSB', 'MSA', 'NTA'] as FrameworkFilter[]).map(f => (
                <button key={f} className={`filter-tab ${framework === f ? 'active' : ''}`} onClick={() => setFramework(f)}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {standardGroups
              .filter(g => framework === 'all' || g.framework === framework)
              .map(g => {
                const key = `${g.framework}-${g.standard}`;
                const isOpen = expandedStd === key;
                const total = g.mappings.length;
                return (
                  <div key={key} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedStd(isOpen ? null : key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
                    >
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '14px' }}>{isOpen ? '▾' : '▸'}</span>
                      <span className="framework-badge" style={{ fontSize: '10px' }}>{g.framework}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{g.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{total} datapoints</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>{g.covered} ✓</span>
                        <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>{g.partial} ◐</span>
                        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>{g.missing} ✗</span>
                        <div style={{ display: 'flex', height: '8px', width: '120px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)', marginLeft: '8px' }}>
                          <div style={{ width: `${g.covered / total * 100}%`, background: '#16a34a' }}></div>
                          <div style={{ width: `${g.partial / total * 100}%`, background: '#f59e0b' }}></div>
                          <div style={{ width: `${g.missing / total * 100}%`, background: '#ef4444' }}></div>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <table className="data-table" style={{ borderTop: '1px solid var(--border-primary)' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '110px' }}>DR ID</th>
                            <th>Datapoint</th>
                            <th style={{ width: '90px' }}>Status</th>
                            <th>Report section(s) that address it</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.mappings.map(m => (
                            <tr key={m.drId}>
                              <td style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600 }}>
                                {standardTextFor(m.drId) ? (
                                  <button onClick={() => setStandardTextDr(m.drId)} title="View the actual requirement text from the standard" style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>{m.drId}</button>
                                ) : m.drId}
                              </td>
                              <td style={{ fontSize: '12px' }}>{m.title}</td>
                              <td><span className={`status-badge status-${m.status}`}>{m.status}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {m.status === 'missing' ? (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not yet addressed</span>
                                  ) : (
                                    m.sections.map(s => (
                                      <button key={s.sectionId} onClick={() => openInEditor(s.sectionId)} title={`Open in editor · ${s.topicL1}${s.topicL2 ? ' › ' + s.topicL2 : ''}`} style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                                        {s.ref} {s.sectionTitle} ↗
                                      </button>
                                    ))
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* Gap Analysis View */}
      {viewMode === 'gap-analysis' && (
        <>
          {/* Filters */}
          <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Framework</div>
                <div className="filter-tabs">
                  {(['all', 'ESRS', 'GRI', 'TCFD', 'ISSB', 'MSA', 'NTA'] as FrameworkFilter[]).map(f => (
                    <button key={f} className={`filter-tab ${framework === f ? 'active' : ''}`} onClick={() => setFramework(f)}>
                      {f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                <div className="filter-tabs">
                  {(['all', 'covered', 'partial', 'missing'] as StatusFilter[]).map(s => (
                    <button key={s} className={`filter-tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Showing {filtered.length} of {complianceStats.total} requirements
                </span>
                <button className="btn-primary" onClick={exportGapAnalysis} style={{ fontSize: '12px' }} title="Export the gaps (partial + missing) with rationale and AI suggestions to Excel/CSV">
                  ⬇ Export gap analysis (Excel)
                </button>
              </div>
            </div>
          </div>

          {/* Disclosure Requirements Table */}
          <div className="card" style={{ padding: '0', marginTop: '16px', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Framework</th>
                  <th style={{ width: '120px' }}>DR ID</th>
                  <th>Title</th>
                  <th style={{ width: '100px' }}>Section</th>
                  <th style={{ width: '90px' }}>Status</th>
                  <th style={{ width: '80px' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <>
                    <tr key={m.drId} onClick={() => setExpandedDr(expandedDr === m.drId ? null : m.drId)} style={{ cursor: 'pointer' }}>
                      <td><span className="framework-badge" style={{ fontSize: '10px', padding: '3px 8px' }}>{m.framework}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{m.drId}</td>
                      <td style={{ fontWeight: 500 }}>{m.title}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.sectionTitle.split('(')[0].trim()}</td>
                      <td><span className={`status-badge status-${m.status}`}>{m.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ width: `${m.confidence * 100}%`, height: '100%', background: statusColor(m.status), borderRadius: '2px' }}></div>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(m.confidence * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                    {expandedDr === m.drId && (
                      <tr key={`${m.drId}-detail`} className="row-details">
                        <td colSpan={6}>
                          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '6px', margin: '4px 0' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Addressed in section(s)</div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                              {m.status === 'missing' ? (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not yet addressed in any section</span>
                              ) : (
                                m.sections.map(s => (
                                  <button key={s.sectionId} onClick={() => openInEditor(s.sectionId)} title="Open in editor" style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>{s.ref} {s.sectionTitle} ↗</button>
                                ))
                              )}
                            </div>
                            {(aiExplain[m.drId]?.rationale || m.rationale) && (
                              <>
                                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: statusColor(m.status) }}>
                                  {m.status === 'partial' ? 'Why partially covered' : 'Why missing'}
                                  {aiExplain[m.drId] && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--accent)' }}>✦ AI</span>}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '6px', borderLeft: `3px solid ${statusColor(m.status)}`, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{aiExplain[m.drId]?.rationale || m.rationale}</div>
                              </>
                            )}
                            {m.additionBenefit && (
                              <>
                                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Should this be added?</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>{m.additionBenefit}</div>
                              </>
                            )}
                            {/* Peer-informed suggestion (Adrian 21-Aug): benchmark the gap
                                against what indexed peers actually disclose. */}
                            {(() => {
                              const peer = peerInsightForDr(m);
                              if (!peer) return null;
                              return (
                                <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'var(--accent-light)', borderRadius: '6px', borderLeft: '3px solid var(--accent)' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>✦ How peers disclose this ({peer.companies.join(', ')})</div>
                                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{peer.detail}</div>
                                  <button onClick={() => navigate('/benchmarking')} style={{ marginTop: '8px', fontSize: '11px', padding: '3px 10px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Open peer benchmarking ↗</button>
                                </div>
                              );
                            })()}
                            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Evidence</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>{m.evidenceExcerpt}</div>
                            {(aiExplain[m.drId]?.suggestedFill || m.suggestedFill) && (
                              <>
                                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent)' }}>
                                  {aiExplain[m.drId]?.suggestedFill ? '✦ AI Suggested Fill' : 'AI Suggested Fill'}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', padding: '10px 14px', background: 'var(--accent-light)', borderRadius: '6px', borderLeft: '3px solid var(--accent)', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>{aiExplain[m.drId]?.suggestedFill || m.suggestedFill}</div>
                              </>
                            )}
                            {aiExplain[m.drId]?.sources && aiExplain[m.drId]!.sources!.length > 0 && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                ✦ Grounded in: {aiExplain[m.drId]!.sources!.map(s => `${s.source}${s.pageRef ? ' ' + s.pageRef : ''}`).join(' · ')}
                              </div>
                            )}
                            {m.status !== 'covered' && !aiExplain[m.drId] && canRun && (
                              <button
                                onClick={() => explainWithAi(m)}
                                disabled={aiBusyDr === m.drId}
                                style={{ fontSize: '12px', padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: aiBusyDr === m.drId ? 'default' : 'pointer', opacity: aiBusyDr === m.drId ? 0.6 : 1 }}
                                title="Generate a fresh AI explanation + suggested fill for this datapoint"
                              >
                                {aiBusyDr === m.drId ? '✦ Analysing…' : '✦ Explain with AI'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Disclosure Checklist View (Proposed Template Format) */}
      {viewMode === 'checklist' && (
        <>
          <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Disclosure Checklist — Proposed Template Format</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Mirrors the combined IFRS+ESRS working template with DMA assessment, section mapping, fulfilment status, AI suggestions, and evidence.</p>
              </div>
              <button className="btn-primary" onClick={exportChecklist} style={{ fontSize: '12px' }} title="Export the disclosure checklist to Excel/CSV (honours the current filters)">
                ⬇ Export checklist (Excel)
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Framework</div>
                <div className="filter-tabs">
                  {(['all', 'ESRS', 'ISSB'] as ('all' | 'ESRS' | 'ISSB')[]).map(f => (
                    <button key={f} className={`filter-tab ${framework === f ? 'active' : ''}`} onClick={() => setFramework(f as FrameworkFilter)}>
                      {f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DMA Assessment</div>
                <div className="filter-tabs">
                  {(['all', 'material', 'not-material'] as const).map(d => (
                    <button key={d} className={`filter-tab ${dmaFilter === d ? 'active' : ''}`} onClick={() => setDmaFilter(d)}>
                      {d === 'all' ? 'All' : d === 'material' ? 'Material' : 'Not Material'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                {filtered.filter(m => m.framework === 'ESRS' || m.framework === 'ISSB' || framework === 'all').length} requirements
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '0', marginTop: '16px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>DMA</th>
                    <th style={{ width: '100px' }}>DR ID</th>
                    <th style={{ width: '200px' }}>Requirement</th>
                    <th style={{ width: '140px' }}>RNFM Section</th>
                    <th style={{ width: '80px' }}>Fulfilled?</th>
                    <th style={{ width: '280px' }}>Suggestions (AI)</th>
                    <th style={{ width: '180px' }}>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .filter(m => framework === 'all' || m.framework === framework)
                    .map(m => {
                      const isMaterial = m.status !== 'missing' || m.confidence >= 0.2;
                      const fulfilled = m.status === 'covered' ? 'Y' : m.status === 'partial' ? 'Partial' : 'N';
                      return (
                        <tr key={m.drId} style={{ borderLeft: `3px solid ${statusColor(m.status)}` }}>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', width: '20px', height: '20px', lineHeight: '20px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: isMaterial ? '#dcfce7' : '#f3f4f6', color: isMaterial ? '#16a34a' : '#9ca3af', textAlign: 'center' }}>
                              {isMaterial ? 'Y' : 'N'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600 }}>
                            {standardTextFor(m.drId) ? (
                              <button onClick={() => setStandardTextDr(m.drId)} title="View the actual requirement text from the standard" style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>{m.drId}</button>
                            ) : m.drId}
                          </td>
                          <td style={{ fontSize: '12px', lineHeight: '1.4' }}>{m.title}</td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.sectionTitle.split('(')[0].trim()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: fulfilled === 'Y' ? '#dcfce7' : fulfilled === 'Partial' ? '#fef3c7' : '#fee2e2', color: fulfilled === 'Y' ? '#16a34a' : fulfilled === 'Partial' ? '#d97706' : '#dc2626' }}>
                              {fulfilled}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {m.suggestedFill ? (
                              <div style={{ maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.suggestedFill}</div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                            )}
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.evidenceExcerpt.substring(0, 80)}...</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Checklist Legend */}
          <div className="card" style={{ padding: '16px', marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>Legend</div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '3px', background: '#dcfce7', border: '1px solid #16a34a' }}></span>
                <span>DMA Y = Material topic (assessed via Double Materiality Assessment)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '3px', background: '#f3f4f6', border: '1px solid #9ca3af' }}></span>
                <span>DMA N = Not material / not applicable</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '3px', height: '14px', borderRadius: '2px', background: '#f59e0b' }}></span>
                <span>Partial = Addressed but incomplete for full ESRS/ISSB compliance</span>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-primary)' }}>
              Based on: ESRS Datapoint Register (EC Draft Delegated Act, 6 May 2026) + IFRS S1/S2 Disclosure Checklist v1. Note: Wave 1 companies (FY2024-2026) continue under original ESRS 2023/2772 unless opting for early application of amended standards.
            </div>
          </div>
        </>
      )}

      {standardTextDr && (
        <StandardTextPopup drId={standardTextDr} onClose={() => setStandardTextDr(null)} />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
