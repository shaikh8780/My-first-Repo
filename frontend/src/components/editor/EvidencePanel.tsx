import { useState } from 'react';
import { EVIDENCE_KIND_LABEL, type EvidenceDoc, type EvidenceKind } from '../../data/sectionEvidence';

// #5 (Adrian 2026-07-15): human-supplied AUDIT EVIDENCE for a section's claims.
// An Input Provider attaches a document (screenshot, SOP excerpt, email, external
// report page) that shows WHERE a claim comes from, optionally anchored to the
// specific text it supports. Distinct from AI citations (which are automatic) —
// this is manual provenance that lives in the audit trail. Read-only seats can
// view but not add/remove.

interface Props {
  evidence: EvidenceDoc[];
  canEdit: boolean;
  onAdd: (e: { name: string; kind: EvidenceKind; paragraphRef: string; note: string }) => void;
  onRemove: (id: string) => void;
}

const KIND_ICON: Record<EvidenceKind, string> = {
  screenshot: '🖼', sop: '📄', email: '✉️', external_report: '🌐', other: '📎',
};

export default function EvidencePanel({ evidence, canEdit, onAdd, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<EvidenceKind>('screenshot');
  const [paragraphRef, setParagraphRef] = useState('');
  const [note, setNote] = useState('');

  // Audit evidence = the items carrying a kind/paragraph anchor (human-supplied),
  // shown here; the plain per-section grounding docs still feed the AI panel.
  const auditEvidence = evidence.filter(e => e.evidenceKind || e.paragraphRef);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), kind, paragraphRef: paragraphRef.trim(), note: note.trim() });
    setName(''); setParagraphRef(''); setNote(''); setKind('screenshot'); setOpen(false);
  };

  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.6 }}>
        Attach source evidence for the claims in this section — a screenshot, SOP excerpt, email or report
        page showing where a figure comes from. This is recorded in the audit trail (separate from the AI’s
        automatic citations).
      </div>

      {auditEvidence.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
          No source evidence attached yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {auditEvidence.map(e => (
            <div key={e.id} className="evidence-item">
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{KIND_ICON[e.evidenceKind ?? 'other']}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, wordBreak: 'break-all' }}>{e.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {EVIDENCE_KIND_LABEL[e.evidenceKind ?? 'other']} · added by {e.addedBy}
                </div>
                {e.paragraphRef && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    Evidences: <span style={{ fontStyle: 'italic' }}>“{e.paragraphRef}”</span>
                  </div>
                )}
                {e.note && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{e.note}</div>}
              </div>
              {canEdit && (
                <button className="btn-ghost" style={{ fontSize: '11px', flexShrink: 0 }} onClick={() => onRemove(e.id)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        !open ? (
          <button className="btn-secondary" style={{ fontSize: '12px', marginTop: '10px' }} onClick={() => setOpen(true)}>
            + Attach source evidence
          </button>
        ) : (
          <div className="evidence-add">
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Attach source evidence</div>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="File name (e.g. EHS-dashboard-2026-01-08.png)"
              style={inp}
            />
            <select value={kind} onChange={e => setKind(e.target.value as EvidenceKind)} style={{ ...inp, cursor: 'pointer' }}>
              {(Object.keys(EVIDENCE_KIND_LABEL) as EvidenceKind[]).map(k => (
                <option key={k} value={k}>{EVIDENCE_KIND_LABEL[k]}</option>
              ))}
            </select>
            <input
              value={paragraphRef} onChange={e => setParagraphRef(e.target.value)}
              placeholder="Claim it supports (short quote, optional)"
              style={inp}
            />
            <input
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Note (optional)"
              style={inp}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button className="btn-primary" style={{ fontSize: '12px' }} disabled={!name.trim()} onClick={submit}>Attach</button>
              <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', fontSize: '12px', padding: '6px 8px', borderRadius: '6px',
  border: '1px solid var(--border-primary)', background: 'var(--bg-primary)',
  color: 'var(--text-primary)', marginBottom: '8px',
};
