import { useState, useMemo } from 'react';
import type { ReportSection } from '../../data/reportSections';
import { VERSION_TRIGGER_LABEL, type SectionVersion } from '../../data/sectionVersions';
import { diffWords, diffStats } from '../../utils/wordDiff';

// Version history + diff viewer for a single subsection.
//
// A version is frozen at every meaningful transition (each saved edit and each
// sign-off — IP → Owner → Legal — plus re-open). This modal lists them newest
// first and lets a reviewer pick any two (or "current live draft") to see a
// word-level redline of what changed between them.
interface Props {
  section: ReportSection;
  versions: SectionVersion[];   // all versions (component filters to this section)
  onClose: () => void;
}

// A synthetic entry representing the live (unsnapshotted) content.
const CURRENT = 'current';
type Selectable = number | typeof CURRENT;

export default function VersionHistoryModal({ section, versions, onClose }: Props) {
  const mine = useMemo(
    () => versions.filter(v => v.sectionId === section.id).slice().sort((a, b) => a.id - b.id),
    [versions, section.id],
  );

  // Options ordered oldest → newest, then the live draft on top.
  const options: { value: Selectable; label: string; content: string }[] = [
    ...mine.map(v => ({ value: v.id as Selectable, label: v.label, content: v.content })),
    { value: CURRENT, label: 'Current live draft', content: section.content },
  ];

  // Default comparison: latest snapshot (from) vs current live draft (to). If
  // there are no snapshots, both fall back to current.
  const latest = mine.length ? mine[mine.length - 1].id : CURRENT;
  const [fromSel, setFromSel] = useState<Selectable>(latest);
  const [toSel, setToSel] = useState<Selectable>(CURRENT);

  const contentOf = (sel: Selectable) => options.find(o => o.value === sel)?.content ?? '';
  const labelOf = (sel: Selectable) => options.find(o => o.value === sel)?.label ?? '';

  const tokens = useMemo(() => diffWords(contentOf(fromSel), contentOf(toSel)), [fromSel, toSel, section.id]);
  const stats = diffStats(tokens);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Version history &amp; compare · {section.ref}</h3>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>
        </div>

        <div style={{ padding: '0 24px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {mine.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No versions yet. A version is frozen automatically on every saved edit and every sign-off (Input Provider → Owner → Legal).
            </div>
          ) : (
            <>
              {/* Compare selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Compare</span>
                <select value={String(fromSel)} onChange={e => setFromSel(e.target.value === CURRENT ? CURRENT : Number(e.target.value))} style={selectStyle}>
                  {options.map(o => <option key={`f${o.value}`} value={String(o.value)}>{o.label}</option>)}
                </select>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>→</span>
                <select value={String(toSel)} onChange={e => setToSel(e.target.value === CURRENT ? CURRENT : Number(e.target.value))} style={selectStyle}>
                  {options.map(o => <option key={`t${o.value}`} value={String(o.value)}>{o.label}</option>)}
                </select>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span className="redline-add">+{stats.added} added</span> · <span className="redline-del">−{stats.removed} removed</span>
                </span>
              </div>

              {/* Redline between the two selected versions */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Redline: <strong>{labelOf(fromSel)}</strong> → <strong>{labelOf(toSel)}</strong>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px', marginBottom: '18px' }}>
                {fromSel === toSel ? (
                  <span style={{ color: 'var(--text-muted)' }}>Select two different versions to see the differences.</span>
                ) : !stats.changed ? (
                  <span style={{ color: 'var(--text-muted)' }}>No textual differences between these two versions.</span>
                ) : (
                  tokens.map((t, i) =>
                    t.op === 'add' ? <span key={i} className="redline-add">{t.text}</span>
                    : t.op === 'del' ? <span key={i} className="redline-del">{t.text}</span>
                    : <span key={i}>{t.text}</span>,
                  )
                )}
              </div>

              {/* Timeline of all versions, newest first */}
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Timeline ({mine.length})</div>
              {mine.slice().reverse().map(v => {
                const approvedSignoffs = v.approvals.filter(a => a.action === 'approved');
                return (
                  <div key={v.id} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '1px 8px', borderRadius: '10px' }}>{VERSION_TRIGGER_LABEL[v.trigger]}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{v.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {v.wordCount.toLocaleString()} words · by {v.snapshotBy} on {new Date(v.snapshotAt).toLocaleString()}</span>
                      <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px' }} onClick={() => { setFromSel(v.id); setToSel(CURRENT); }}>Compare to current</button>
                    </div>
                    {v.note && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>“{v.note}”</div>}
                    {approvedSignoffs.length > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Sign-offs: {approvedSignoffs.map(a => `${a.signedBy || a.reviewer.name} (${a.stage})`).join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  fontSize: '12px', padding: '5px 8px', borderRadius: '6px',
  border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)',
};
