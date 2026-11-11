import { useState, type ReactNode } from 'react';

// A titled, collapsible section card used to visually separate the distinct
// concerns of the subsection detail view (Content, Approval workflow, Tracked
// changes, Comments & notes). Each card has an icon, a title, an optional count
// chip, and an optional accent color stripe. Collapsed state is local to the
// card instance; `defaultOpen` sets the initial state.
interface Props {
  icon: string;
  title: string;
  /** Small count/status chip shown in the header (e.g. "3" or "2 pending"). */
  chip?: string | number;
  /** Highlight the chip (e.g. there are pending items needing attention). */
  chipAttention?: boolean;
  /** Left accent stripe color; defaults to the neutral border color. */
  accent?: string;
  defaultOpen?: boolean;
  /** Extra element rendered on the right of the header (e.g. a toggle). */
  headerRight?: ReactNode;
  children: ReactNode;
}

export default function CollapsibleCard({
  icon, title, chip, chipAttention, accent, defaultOpen = true, headerRight, children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChip = chip !== undefined && chip !== null && `${chip}` !== '';

  return (
    <div className="collapsible-card" style={{ borderLeft: `3px solid ${accent ?? 'var(--border-primary)'}` }}>
      <div
        className="collapsible-card-header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        <span className="collapsible-card-caret" style={{ transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        <span className="collapsible-card-icon">{icon}</span>
        <span className="collapsible-card-title">{title}</span>
        {hasChip && (
          <span className="collapsible-card-chip" style={chipAttention ? { background: 'var(--accent)', color: '#fff' } : undefined}>
            {chip}
          </span>
        )}
        {headerRight && <span style={{ marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>{headerRight}</span>}
      </div>
      {open && <div className="collapsible-card-body">{children}</div>}
    </div>
  );
}
