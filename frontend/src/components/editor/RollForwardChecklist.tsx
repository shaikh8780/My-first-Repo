import { KIND_LABEL, type RollForwardItem, type RollForwardResolution } from '../../data/rollForwardItems';

interface Props {
  items: RollForwardItem[];
  // Resolution per item id (persisted by EditorView).
  resolutions: Record<string, RollForwardResolution>;
  onResolve: (itemId: string, resolution: RollForwardResolution) => void;
  // "Update" jumps the user into editing the subsection.
  onUpdate: (item: RollForwardItem) => void;
  // Only seats with edit rights may confirm/update/flag/reopen. Read-only and
  // comment-only seats (guest) see the review as read-only (2026-07-15 fix).
  canResolve: boolean;
}

// Flagged = PINK (Adrian 2026-07-15): a flag means "data not available yet, keep
// tracked"; it is highlighted pink here and in the editor content so it stands out.
const resColor: Record<RollForwardResolution, string> = {
  pending: '#9ca3af', confirmed: '#16a34a', updated: '#3b82f6', flagged: '#ec4899',
};
const resLabel: Record<RollForwardResolution, string> = {
  pending: 'To review', confirmed: 'Confirmed', updated: 'Updated', flagged: 'Flagged',
};

// #13 — year-on-year roll-forward as a click-through LIST. Each item (year data,
// target, metric, date, achievement carried from the prior year) is individually
// addressable: confirm (unchanged), update (edit the subsection), or flag for later.
export default function RollForwardChecklist({ items, resolutions, onResolve, onUpdate, canResolve }: Props) {
  if (items.length === 0) return null;

  const res = (id: string): RollForwardResolution => resolutions[id] ?? 'pending';
  const done = items.filter(i => res(i.id) !== 'pending').length;
  const allDone = done === items.length;

  return (
    <div className="rollforward-checklist" style={{ marginBottom: '16px', border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-secondary)' }}>
        <span style={{ fontSize: '12px', fontWeight: 700 }}>Year-on-year roll-forward review</span>
        <span style={{ fontSize: '11px', color: allDone ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
          {done}/{items.length} addressed{allDone ? ' ✓' : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
          {canResolve
            ? 'Confirm each item is still correct for FY2026, update it, or flag it for later.'
            : 'Read-only — you can view the roll-forward review but not confirm or update items.'}
        </span>
      </div>

      <div>
        {items.map((item, idx) => {
          const r = res(item.id);
          return (
            <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderTop: idx > 0 ? '1px solid var(--border-primary)' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', marginTop: '2px' }}>
                {KIND_LABEL[item.kind]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '2px 0' }}>"{item.snippet}"</div>
                {item.hint && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.hint}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: resColor[r], padding: '2px 8px', borderRadius: '4px' }}>{resLabel[r]}</span>
                {canResolve && (r === 'pending' ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-success btn-sm" onClick={() => onResolve(item.id, 'confirmed')} style={{ fontSize: '11px', padding: '3px 8px' }} title="Confirm this is still correct for FY2026">Confirm</button>
                    <button className="btn-secondary" onClick={() => { onResolve(item.id, 'updated'); onUpdate(item); }} style={{ fontSize: '11px', padding: '3px 8px' }} title="Edit the subsection to update this">Update</button>
                    <button className="btn-ghost" onClick={() => onResolve(item.id, 'flagged')} style={{ fontSize: '11px', padding: '3px 8px' }} title="Flag for later">Flag</button>
                  </div>
                ) : (
                  <button className="btn-ghost" onClick={() => onResolve(item.id, 'pending')} style={{ fontSize: '10px', padding: '2px 8px' }} title="Reset this item">Reopen</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
