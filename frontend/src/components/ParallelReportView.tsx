import { getReport, type ReportId } from '../data/reports';
import { upcSections, upcAbout } from '../data/upc';
import { asrsMappings, asrsStatusLabel, asrsStatusColor } from '../data/asrs';
import { esgIndexIntro, esgIndexCategories, esgDataSummaryUrl, type EsgLink } from '../data/esgIndex';
import { localReportStructure } from '../data/localReports';

interface Props {
  reportId: ReportId;
}

const statusColor: Record<string, string> = { active: '#16a34a', new: '#8b5cf6', future: '#f59e0b', legacy: '#9ca3af' };

// Renders a "Relevant links" list: clickable to the real novartis.com URL when
// present, otherwise a plain reference label.
function LinkList({ links }: { links: EsgLink[] }) {
  return (
    <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
      {links.map((l, i) => (
        <li key={i} style={{ fontSize: '12px', marginBottom: '3px' }}>
          {l.url
            ? <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{l.label}</a>
            : <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>}
        </li>
      ))}
    </ul>
  );
}

// G — landing view for a parallel (non-RNFM) report output. Shows its own
// structure, status, frameworks and cross-references into the RNFM. The RNFM
// itself is edited in the full authoring studio (Report Editor).
export default function ParallelReportView({ reportId }: Props) {
  const report = getReport(reportId);

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">{report.name}</h1>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '6px', color: '#fff', background: statusColor[report.status] }}>
          {report.statusLabel}
        </span>
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--accent-light)', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--accent)', fontSize: '12px', color: 'var(--accent)' }}>
        <strong>Parallel output:</strong> this report shares the same knowledge base (policies, standards, data) as the RNFM and can be developed in parallel. It has its own section structure, workflow and compliance mapping. {report.description}
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{report.subsectionCount}</div><div className="stat-label">Sections</div></div>
        <div className="stat-card"><div className="stat-value">{report.frameworks.length}</div><div className="stat-label">Frameworks</div></div>
        <div className="stat-card"><div className="stat-value">{report.crossReferences.length}</div><div className="stat-label">RNFM cross-refs</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: statusColor[report.status] }}>{report.status === 'active' ? '●' : report.status === 'new' ? '＋' : '◷'}</div><div className="stat-label">{report.statusLabel.split('—')[0].trim()}</div></div>
      </div>

      {/* Frameworks */}
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 className="card-title">Frameworks & standards</h2>
        <div className="frameworks-grid">
          {report.frameworks.map(f => <div key={f} className="framework-badge">{f}</div>)}
        </div>
      </div>

      {/* H — full UPC 2026 template: Targets box + performance table + narrative */}
      {report.id === 'upc' && (
        <>
          <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
            <h2 className="card-title">{upcAbout.title}</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{upcAbout.body}</div>
          </div>
          {upcSections.map(sec => (
            <div key={sec.ref} className="card" style={{ padding: '20px', marginTop: '16px' }}>
              <h2 className="card-title">{sec.ref}. {sec.title}</h2>

              {/* Targets box */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px 16px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Targets</div>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {sec.targets.map((t, i) => <li key={i} style={{ fontSize: '13px', marginBottom: '4px' }}>{t}</li>)}
                </ul>
              </div>

              {/* Performance table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '860px' }}>
                  <thead>
                    <tr>{sec.columns.map(c => <th key={c} style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '12px', fontWeight: 500 }}>{r.performance}</td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace', color: r.y2026 === 'xx' ? '#f59e0b' : 'inherit' }}>{r.y2026}</td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{r.y2025}</td>
                        <td style={{ fontSize: '12px' }}>{r.baseYear}</td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{r.baseline}</td>
                        <td style={{ fontSize: '12px' }}>{r.targetYear}</td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{r.target}</td>
                        <td style={{ fontSize: '12px', fontWeight: 600 }}>{r.progress}</td>
                        <td style={{ fontSize: '12px', textAlign: 'center' }}>{r.assurance ? '∆' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Narrative */}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '12px' }}>{sec.narrative}</div>
              <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '8px' }}>Methodology → RNFM {sec.rnfmReference}</div>
            </div>
          ))}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 4px' }}>
            ∆ = in scope for external limited assurance · "xx" = data not yet available at time of drafting
          </div>
        </>
      )}

      {/* Structure (topic list) — shown for non-UPC parallel reports */}
      {/* ESG Index — the website content maintained in the Studio: 5 categories,
          37 topics, each with narrative + ESG Data Summary metric pointer + links. */}
      {report.id === 'esg-index' && (
        <>
          <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
            <h2 className="card-title">About the ESG Index</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{esgIndexIntro.lead}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '10px' }}>{esgIndexIntro.body}</div>
            <div style={{ marginTop: '10px' }}><LinkList links={esgIndexIntro.publications} /></div>
          </div>
          {esgIndexCategories.map(cat => (
            <div key={cat.ref} className="card" style={{ padding: '20px', marginTop: '16px' }}>
              <h2 className="card-title">{cat.title}</h2>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '8px' }}>{cat.intro}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                In this section: {cat.topics.map(t => t.title).join(' · ')}
              </div>
              {cat.topics.map(t => (
                <div key={t.ref} style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px', marginTop: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{t.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{t.narrative}</div>
                  {t.dataSummaryMetrics && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      See <a href={esgDataSummaryUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>ESG Data Summary 2025</a> for metrics including: {t.dataSummaryMetrics}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginTop: '10px' }}>Relevant links</div>
                  <LinkList links={t.links} />
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* Local climate reports (Australian ISSB + UK TCFD) — same shared A–E
          structure, built once and used twice. The UK TCFD report hides the
          ISSB-only requirements; the Australian ISSB report shows them flagged. */}
      {(report.id === 'asrs' || report.id === 'tcfd-uk') && (() => {
        const includeIssb = report.id === 'asrs';
        return (
          <>
            <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Built once, used twice.</strong> The Australian ISSB report and the UK TCFD report share the Novartis 2023 TCFD structure (A–E). {includeIssb
                ? 'This ISSB report adds the extra AASB/ISSB requirements (marked ISSB only).'
                : 'This TCFD report omits the ISSB-only requirements shown in the Australian ISSB report.'}
            </div>
            {localReportStructure.map(sec => {
              const subs = sec.subsections.filter(s => includeIssb || !s.issbOnly);
              if (subs.length === 0) return null;
              return (
                <div key={sec.ref} className="card" style={{ padding: '20px', marginTop: '16px' }}>
                  <h2 className="card-title">{sec.ref}. {sec.title}</h2>
                  {subs.map(s => (
                    <div key={s.ref} style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px', marginTop: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{s.ref}</span>
                        {s.title}
                        {s.issbOnly && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color: '#fff', background: '#8b5cf6' }}>ISSB only</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.narrative}</div>
                      {s.rnfmSource && (
                        <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '6px' }}>Mapped from RNFM {s.rnfmSource}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        );
      })()}

      {/* Structure (topic list) — shown only for parallel reports that don't
          render their own rich content. */}
      {report.id !== 'upc' && report.id !== 'esg-index' && report.id !== 'asrs' && report.id !== 'tcfd-uk' && (
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 className="card-title">Section structure</h2>
        <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
          {report.structure.map((s, i) => (
            <div key={s.ref} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: i < report.structure.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '24px' }}>{s.ref}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.title}</div>
                {s.detail && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Cross-references to RNFM */}
      {report.crossReferences.length > 0 && (
        <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
          <h2 className="card-title">Cross-referenced from the RNFM</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            These sections reuse RNFM content as their basis — edited once, referenced across reports.
          </div>
          <table className="data-table">
            <thead><tr><th>This report</th><th>Sourced from RNFM</th></tr></thead>
            <tbody>
              {report.crossReferences.map((x, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{x.from}</td>
                  <td style={{ fontSize: '12px', color: 'var(--accent)' }}>→ {x.toReportSection}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report.id === 'asrs' && (
        <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
          <h2 className="card-title">Automatic ISSB → AASB (ASRS) mapping</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
            Global ISSB-compliant content authored in the RNFM is mapped automatically into the local AASB S1/S2 requirements for the Australian legal entity. Only Australian-specific modifications (local scope, transition reliefs) are authored separately.
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '820px' }}>
              <thead>
                <tr>
                  <th>AASB requirement</th>
                  <th>ISSB source</th>
                  <th>RNFM section</th>
                  <th style={{ width: '150px' }}>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {asrsMappings.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '12px', fontWeight: 500 }}>{m.aasbRequirement}</td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{m.issbSource}</td>
                    <td style={{ fontSize: '12px', color: m.rnfmSection === '—' ? 'var(--text-muted)' : 'var(--accent)' }}>{m.rnfmSection}</td>
                    <td>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color: '#fff', background: asrsStatusColor[m.status] }}>
                        {asrsStatusLabel[m.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
