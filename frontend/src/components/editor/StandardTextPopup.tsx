import { standardTextFor, obligationLabel } from '../../data/standardText';
import { complianceMappings, sectionsForDr } from '../../data/complianceMappings';

// Modal showing the VERBATIM disclosure-requirement text for a datapoint
// (13 Jul 2026 feedback #11). Opened by clicking a mapped ESRS/ISSB datapoint
// tag in the editor or compliance view. Shows the actual standard wording so a
// human can interpret the requirement — not the AI's interpretation.
//
// It also surfaces the coverage classification for this DR (why partial / why
// missing + whether it is beneficial to add), so a reviewer sees the standard
// text and the gap rationale together (2026-07-15 feedback).

interface Props {
  drId: string;
  onClose: () => void;
  // Optional: jump to a report section that addresses this DR (closes the popup).
  onOpenSection?: (sectionId: string) => void;
}

const STATUS_COLOR: Record<string, string> = { covered: '#16a34a', partial: '#f59e0b', missing: '#ef4444' };

export default function StandardTextPopup({ drId, onClose, onOpenSection }: Props) {
  const extract = standardTextFor(drId);
  const mapping = complianceMappings.find(m => m.drId === drId);
  const addressedIn = sectionsForDr(drId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{drId}</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
              {extract ? extract.drTitle : 'Standard requirement'}
            </h3>
            {extract && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{extract.standardLabel}</div>}
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {/* Coverage classification — shown for every DR that has a mapping. */}
          {mapping && (
            <div style={{ marginBottom: '16px', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px 14px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: mapping.rationale ? '8px' : 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Coverage</span>
                <span className={`status-badge status-${mapping.status}`} style={{ textTransform: 'capitalize' }}>{mapping.status}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(mapping.confidence * 100)}% confidence</span>
              </div>
              {mapping.rationale && (
                <div style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)', borderLeft: `3px solid ${STATUS_COLOR[mapping.status] ?? 'var(--accent)'}`, paddingLeft: '10px' }}>
                  <strong style={{ color: STATUS_COLOR[mapping.status] }}>{mapping.status === 'partial' ? 'Why partially covered: ' : 'Why missing: '}</strong>
                  {mapping.rationale}
                </div>
              )}
              {mapping.additionBenefit && (
                <div style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: '8px' }}>
                  <strong>Should this be added? </strong>{mapping.additionBenefit}
                </div>
              )}
              {/* Bi-directional: which report sections address this datapoint. */}
              {addressedIn.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Addressed in {addressedIn.length} section(s)</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {addressedIn.map(s => (
                      <button
                        key={s.sectionId}
                        onClick={() => { if (onOpenSection) { onOpenSection(s.sectionId); onClose(); } }}
                        disabled={!onOpenSection}
                        title={onOpenSection ? `Open ${s.ref} in the editor` : undefined}
                        style={{ fontSize: '10px', padding: '3px 8px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '4px', border: 'none', cursor: onOpenSection ? 'pointer' : 'default' }}
                      >
                        {s.ref} {s.sectionTitle}{onOpenSection ? ' ↗' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {extract ? (
            <>
              {extract.preAdoption && (
                <div style={{ fontSize: '11px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 10px', marginBottom: '14px' }}>
                  ⚠ Pre-adoption — text reflects the EC Draft Delegated Act (6 May 2026) amending ESRS. Mandatory from FY2027; Wave-1 undertakings continue under the original ESRS unless applying it early.
                </div>
              )}
              {extract.sourceNote && (
                <div style={{ fontSize: '11px', color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 10px', marginBottom: '14px' }}>
                  ℹ Source — {extract.sourceNote}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Verbatim requirement text from the standard — for interpretation by the reviewer.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {extract.paragraphs.map((p, i) => (
                  <div key={i} style={{ borderLeft: '3px solid var(--accent)', padding: '2px 0 2px 12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>{p.paraRef}</span>
                      {p.dataType && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.dataType}</span>}
                      {p.obligation && (
                        <span title={obligationLabel(p.obligation)} style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          {p.obligation}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{p.text}</div>
                    {p.obligationNote && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', fontStyle: 'italic' }}>Applicability: {p.obligationNote}</div>}
                    {p.phaseIn && <div style={{ fontSize: '11px', color: '#b45309', marginTop: '3px' }}>Phase-in: {p.phaseIn}</div>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p>The verbatim standard text for <strong style={{ fontFamily: 'monospace' }}>{drId}</strong> is not yet loaded in the tool.</p>
              <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                Verbatim extracts are currently available for <strong>ESRS</strong> and <strong>IFRS S1/S2</strong> requirements. GRI, TCFD and the Modern Slavery / Norwegian Transparency Act requirements will be added when their source text is provided.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
