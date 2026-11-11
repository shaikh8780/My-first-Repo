import { useState, useMemo, useEffect } from 'react';
import { api } from '../api';
import type { ReportSection } from '../data/reportSections';
import { primaryInputProvider } from '../data/reportSections';
import { deriveStatus, l2StatusKey } from '../data/workflowStatus';
import type { L2SignOffState } from './editor/ConsolidatedSectionView';
import type { SectionProgressMap } from '../data/reportSections';
import type { AuditReleaseMap } from '../data/auditRelease';
import { evidenceForSection, EVIDENCE_KIND_LABEL, type EvidenceDoc } from '../data/sectionEvidence';
import { contentToHtml } from './editor/richTextSerializer';
import { generateAndDownloadPdf } from '../utils/exportPdf';

// Dedicated, read-only AUDITOR view (Adrian 2026-08-31).
//
// An external Auditor sees ONLY this view — no drafting environment, no AI chat,
// no internal audit trail. The Owner RELEASES an approved section to audit; once
// released it appears here with:
//   - the signed-off section content,
//   - the data points (disclosure requirements + citations) for each subsection,
//   - the supporting evidence attached to those subsections,
// plus a button to download the released report as a PDF (the same export the
// editor produces, scoped to the released sections).
//
// Nothing that is not both APPROVED and RELEASED is ever shown here.

interface L2Group {
  key: string;
  topicL1: string;
  topicL2: string;
  released: { by: string; at: string };
  subsections: ReportSection[];
}

export default function AuditorView() {
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [progress, setProgress] = useState<SectionProgressMap>({});
  const [l2SignOffs, setL2SignOffs] = useState<Record<string, L2SignOffState>>({});
  const [releases, setReleases] = useState<AuditReleaseMap>({});
  const [evidence, setEvidence] = useState<EvidenceDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      api.report.sections.get(),
      api.report.sectionProgress.get(),
      api.report.l2Signoff.get(),
      api.report.auditReleases.get(),
      api.report.evidence.get(),
    ]).then(([secs, prog, l2, rel, ev]) => {
      if (!alive) return;
      setSections(secs);
      setProgress(prog);
      setL2SignOffs(l2);
      setReleases(rel);
      setEvidence(ev);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  // Build the released groups: an L2 group is shown only if it has been released
  // AND every subsection is fully approved (defence in depth — an Owner can only
  // release an approved section, but we re-check here so a later re-edit that
  // reset approval hides it again).
  const releasedGroups = useMemo<L2Group[]>(() => {
    const byKey = new Map<string, L2Group>();
    for (const s of sections) {
      if (!s.topicL2) continue;
      const key = l2StatusKey(s.topicL1, s.topicL2);
      const rel = releases[key];
      if (!rel) continue;
      if (!deriveStatus(s, progress, l2SignOffs).isApproved) continue;
      let g = byKey.get(key);
      if (!g) { g = { key, topicL1: s.topicL1, topicL2: s.topicL2, released: rel, subsections: [] }; byKey.set(key, g); }
      g.subsections.push(s);
    }
    return [...byKey.values()];
  }, [sections, progress, l2SignOffs, releases]);

  const releasedSections = useMemo(() => releasedGroups.flatMap(g => g.subsections), [releasedGroups]);

  const toggle = (key: string) =>
    setExpanded(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  const downloadReleasedPdf = async () => {
    if (releasedSections.length === 0) return;
    setExporting(true);
    try { await generateAndDownloadPdf(releasedSections); }
    finally { setExporting(false); }
  };

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

  return (
    <>
      <div className="view-header">
        <div>
          <h1 className="view-title">Audit View</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Read-only assurance view — signed-off sections released for audit, with their data points and supporting evidence.
          </div>
        </div>
        <button
          className="btn-primary"
          disabled={releasedSections.length === 0 || exporting}
          onClick={downloadReleasedPdf}
          title={releasedSections.length === 0 ? 'No released sections to export yet' : 'Download the released report as a PDF'}
        >
          {exporting ? 'Preparing…' : '⬇ Download released report (PDF)'}
        </button>
      </div>

      {/* Scope banner — make the segregation explicit for the assurance team. */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', background: 'var(--bg-secondary)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '16px' }}>🔒</span>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This view shows <strong>only</strong> the sections a section Owner has released for audit after they were fully signed off.
          It has no access to the drafting environment, the AI assistant, or the internal change/audit log.
          {' '}Data points and supporting evidence are shown per subsection so each disclosure is traceable to its source.
        </div>
      </div>

      {!loaded ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading released sections…</div>
      ) : releasedGroups.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>No sections have been released for audit yet</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
            When a section Owner releases a signed-off section to audit, it will appear here with its data points and supporting evidence.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {releasedGroups.length} section{releasedGroups.length !== 1 ? 's' : ''} released · {releasedSections.length} subsections
          </div>
          {releasedGroups.map(g => {
            const isOpen = expanded.has(g.key);
            return (
              <div key={g.key} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div
                  onClick={() => toggle(g.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', cursor: 'pointer', background: 'var(--bg-secondary)' }}
                >
                  <span style={{ fontSize: '11px', width: '10px', color: 'var(--text-muted)' }}>{isOpen ? '▼' : '▶'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{g.topicL1}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{g.topicL2}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.12)', padding: '3px 8px', borderRadius: '4px' }}>✓ APPROVED</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} title={`Released by ${g.released.by}`}>
                    Released {fmtDate(g.released.at)} by {g.released.by}
                  </span>
                </div>

                {isOpen && (
                  <div style={{ padding: '8px 18px 18px' }}>
                    {g.subsections.map(sec => {
                      const evid = evidenceForSection(evidence, sec.id);
                      return (
                        <div key={sec.id} style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '14px', marginTop: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{sec.ref}</span>
                            <span style={{ fontSize: '14px', fontWeight: 700 }}>{sec.topicL3 || sec.title}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>Input Provider{sec.roles.inputProviders.length > 1 ? 's' : ''}: {sec.roles.inputProviders.join(', ') || '—'}</span>
                          </div>

                          {/* Signed-off content */}
                          <div
                            className="consolidated-body"
                            style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '12px' }}
                            dangerouslySetInnerHTML={{ __html: contentToHtml(sec.content) }}
                          />

                          {/* Data points: disclosure requirements + citations */}
                          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Data points</div>
                            {sec.drsCovered.length === 0 && sec.citations.length === 0 ? (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No data points recorded for this subsection.</div>
                            ) : (
                              <>
                                {sec.drsCovered.length > 0 && (
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: sec.citations.length ? '8px' : 0 }}>
                                    {sec.drsCovered.map(dr => (
                                      <span key={dr} style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 7px', borderRadius: '4px' }}>{dr}</span>
                                    ))}
                                  </div>
                                )}
                                {sec.citations.map((c, i) => (
                                  <div key={c.id} style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>[{i + 1}]</span> {c.documentName}{c.pageRef ? `, ${c.pageRef}` : ''} <span style={{ color: 'var(--text-muted)' }}>({c.documentType})</span>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>

                          {/* Supporting evidence */}
                          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Supporting evidence</div>
                            {evid.length === 0 ? (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No supporting evidence attached.</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {evid.map(e => (
                                  <div key={e.id} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    📎 <strong>{e.name}</strong>
                                    <span style={{ color: 'var(--text-muted)' }}> · {e.evidenceKind ? EVIDENCE_KIND_LABEL[e.evidenceKind] : e.docType} · added by {e.addedBy}</span>
                                    {e.paragraphRef && <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginLeft: '18px' }}>supports: “{e.paragraphRef}”</div>}
                                    {e.note && <div style={{ marginLeft: '18px', color: 'var(--text-muted)' }}>{e.note}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
