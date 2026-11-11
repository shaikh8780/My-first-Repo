import { useMemo, useState } from 'react';
import type { ReportSection } from '../../data/reportSections';
import { diffParagraphs, alignParagraphs, type ParaDiff, type DiffToken } from '../../utils/wordDiff';
import ContentViewer from './ContentViewer';

// Roll-forward comparison for a subsection.
//
// Two calm surfaces, never both noisy at once (customer feedback: side-by-side
// was too busy):
//   1. A "Draft view" toggle over the CURRENT reading column — Clean (default)
//      or "Changes from 2025" (inline word-level redline + the AI's reason for
//      each change). This is rendered by the parent around the ContentViewer.
//   2. An expandable "FY2025 approved" section that shows the WHOLE prior-year
//      section rendered exactly like a published page (narrative + tables +
//      footnotes), read-only. Collapsed by default.
//
// This component owns surface (2) and the redline body of surface (1). The
// parent decides when to show the clean ContentViewer vs. this redline.

// The draft area has two tabs (13 Jul 2026 feedback):
//   'editor' — Editor view: shows tracked changes (red/green). Editor role only.
//   'clean'  — Clean view: the final text with all changes accepted. All roles.
export type DraftView = 'editor' | 'clean';

interface Props {
  section: ReportSection;
  // The FY2025 approved text for this subsection (priorYearContent / override).
  priorYearText: string;
}

// Render one token as an inline redline span (add = green, del = struck, else plain).
function tokenSpan(t: DiffToken, key: number) {
  if (t.op === 'add') return <span key={key} className="redline-add">{t.text}</span>;
  if (t.op === 'del') return <span key={key} className="redline-del">{t.text}</span>;
  return <span key={key}>{t.text}</span>;
}

// Split a paragraph's diff tokens into visual lines on embedded newlines. The
// tokenizer keeps trailing whitespace (incl. "\n") on a token, so a bullet block
// like "- a\n- b" arrives as a single ParaDiff whose tokens contain the "\n".
// We split those out so each list line can render as its own <li>, preserving
// each token's op (add/del/equal) across the split.
function splitTokenLines(tokens: DiffToken[]): DiffToken[][] {
  const lines: DiffToken[][] = [[]];
  for (const t of tokens) {
    const parts = t.text.split('\n');
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push([]); // a newline started a new line
      if (part) lines[lines.length - 1].push({ op: t.op, text: part });
    });
  }
  return lines.filter(line => line.length > 0);
}

const BULLET_RE = /^\s*[-•]\s+/;
function lineText(line: DiffToken[]): string {
  return line.map(t => t.text).join('');
}

// Render a paragraph's word-level diff as inline redline. A bullet block is
// rendered as a real <ul>/<li> list (matching the Clean view / ContentViewer),
// not raw "- " text on one collapsed line.
function RedlineParagraph({ para }: { para: ParaDiff }) {
  const cls =
    para.kind === 'added' ? 'redline-para-added'
    : para.kind === 'removed' ? 'redline-para-removed'
    : para.kind === 'changed' ? 'redline-para-changed'
    : '';

  const lines = splitTokenLines(para.tokens);
  const isBulletBlock = lines.length > 0 && lines.every(l => BULLET_RE.test(lineText(l)));

  if (isBulletBlock) {
    return (
      <ul className={cls} style={{ marginBottom: '14px', lineHeight: 1.8, paddingLeft: '20px' }}>
        {lines.map((line, li) => {
          // Strip the leading "- " / "• " marker from the first non-empty token
          // so the bullet is drawn by the <li>, not shown as literal text.
          let stripped = false;
          return (
            <li key={li} style={{ marginBottom: '4px' }}>
              {line.map((t, i) => {
                let text = t.text;
                if (!stripped) { text = text.replace(BULLET_RE, ''); stripped = true; }
                return tokenSpan({ op: t.op, text }, i);
              })}
            </li>
          );
        })}
      </ul>
    );
  }

  // Non-bullet: single paragraph, but preserve any internal line breaks.
  return (
    <p className={cls} style={{ marginBottom: '14px', lineHeight: 1.8 }}>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {line.map((t, i) => tokenSpan(t, i))}
        </span>
      ))}
    </p>
  );
}

// The inline-redline body of the current draft, shown when Draft view = Changes.
export function RollForwardRedline({ section, priorYearText }: Props) {
  const paras = useMemo(
    () => diffParagraphs(priorYearText, section.content),
    [priorYearText, section.content],
  );

  // Total change summary for the one-line banner.
  const totals = paras.reduce(
    (acc, p) => {
      acc.added += p.stats.added;
      acc.removed += p.stats.removed;
      if (p.kind === 'added') acc.newParas++;
      if (p.kind === 'removed') acc.delParas++;
      if (p.kind === 'changed') acc.changedParas++;
      return acc;
    },
    { added: 0, removed: 0, newParas: 0, delParas: 0, changedParas: 0 },
  );

  const summaryBits: string[] = [];
  if (totals.changedParas) summaryBits.push(`${totals.changedParas} paragraph(s) edited`);
  if (totals.newParas) summaryBits.push(`${totals.newParas} added`);
  if (totals.delParas) summaryBits.push(`${totals.delParas} removed`);
  const summary = summaryBits.length
    ? `AI rolled this section forward from FY2025 — ${summaryBits.join(', ')}. Review the tracked changes below.`
    : 'AI carried this section forward from FY2025 with no wording changes — confirm it is still accurate.';

  return (
    <div>
      {/* One summary of the AI roll-forward (13 Jul 2026 feedback: no per-line
          reasons — a single explanation is sufficient). */}
      <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontWeight: 700 }}>✦</span>
        <span>{summary}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <span className="redline-add">added</span> · <span className="redline-del">removed</span>
        </span>
      </div>

      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        {paras.map((para, i) => (
          <RedlineParagraph key={i} para={para} />
        ))}
      </div>
    </div>
  );
}

// #1 (Adrian 2026-07-15): change-by-change acceptance of the AI roll-forward,
// like Word. Each changed/added/removed paragraph is listed with its inline
// redline and two actions: Keep (accept the FY2026 draft paragraph) or Revert
// (restore the FY2025 approved paragraph). "Accept all remaining" finalises the
// rest. Reverting edits the working content; accepting a paragraph just marks it
// resolved locally. When every change is resolved (kept or reverted), the caller
// accepts the AI baseline.
function TokenLine({ tokens }: { tokens: DiffToken[] }) {
  return (
    <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
      {tokens.map((t, i) =>
        t.op === 'add' ? <span key={i} className="redline-add">{t.text}</span>
        : t.op === 'del' ? <span key={i} className="redline-del">{t.text}</span>
        : <span key={i}>{t.text}</span>,
      )}
    </p>
  );
}

interface ChangeListProps {
  section: ReportSection;
  priorYearText: string;
  onRevertParagraph: (fy2026Text: string, fy2025Text: string) => void;
  onAcceptAll: () => void;
}

export function RollForwardChangeList({ section, priorYearText, onRevertParagraph, onAcceptAll }: ChangeListProps) {
  const aligned = useMemo(() => alignParagraphs(priorYearText, section.content), [priorYearText, section.content]);
  const changes = aligned.filter(p => p.kind !== 'equal');
  // Locally-kept paragraphs (accepted this session) — keyed by their new text.
  const [kept, setKept] = useState<Set<string>>(new Set());

  const outstanding = changes.filter(c => !(c.kind === 'changed' || c.kind === 'added') || !kept.has(c.newText));

  if (changes.length === 0) {
    return (
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          ✦ AI carried this section forward from FY2025 with no wording changes. Confirm it as the working base.
        </div>
        <button className="btn-primary btn-sm" onClick={onAcceptAll}>✓ Confirm & accept as working base</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          ✦ AI rolled this section forward from FY2025 — <strong>{changes.length}</strong> change(s). Keep or revert each, or accept all.
        </span>
        <button className="btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={onAcceptAll}>✓ Accept all remaining</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {changes.map((c, i) => {
          const isKept = (c.kind === 'changed' || c.kind === 'added') && kept.has(c.newText);
          const label = c.kind === 'added' ? 'New paragraph' : c.kind === 'removed' ? 'Removed vs FY2025' : 'Edited';
          return (
            <div key={i} className="rf-change-item" style={isKept ? { opacity: 0.55 } : undefined}>
              <div className="rf-change-head">
                <span className="rf-change-tag">{label}</span>
                {isKept && <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>✓ kept</span>}
              </div>
              <TokenLine tokens={c.tokens} />
              {!isKept && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {/* Keep = accept the FY2026 wording; for removed paragraphs there
                      is nothing to keep, so only Revert (restore) is offered. */}
                  {c.kind !== 'removed' && (
                    <button className="btn-success btn-sm" onClick={() => setKept(prev => new Set(prev).add(c.newText))}>Keep FY2026</button>
                  )}
                  <button className="btn-secondary btn-sm" onClick={() => onRevertParagraph(c.newText, c.oldText)}>
                    {c.kind === 'added' ? 'Remove (revert)' : 'Revert to FY2025'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {outstanding.length === 0 && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
          All changes reviewed — accepting the working base…
        </div>
      )}
    </div>
  );
}

// Full-text inline redline of the CURRENT working draft against a clean
// baseline (13 Jul 2026 feedback): the Editor view shows the WHOLE section text
// with the pending edits marked inline (green = added, red struck = removed),
// not just a list of the changed paragraphs. The clean baseline is the section
// content with all pending changes reverted (see revertPendingChanges).
export function WorkingRedline({ baseline, working }: { baseline: string; working: string }) {
  const paras = useMemo(() => diffParagraphs(baseline, working), [baseline, working]);
  const stats = paras.reduce(
    (acc, p) => { acc.added += p.stats.added; acc.removed += p.stats.removed; return acc; },
    { added: 0, removed: 0 },
  );
  const clean = stats.added === 0 && stats.removed === 0;

  return (
    <div>
      <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontWeight: 700 }}>✎</span>
        <span>
          {clean
            ? 'No pending changes — this matches the approved text. Edit the section to propose changes.'
            : 'Full section with pending changes marked inline. Accept them below to fold them into the approved text.'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <span className="redline-add">added</span> · <span className="redline-del">removed</span>
        </span>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        {paras.map((para, i) => (
          <RedlineParagraph key={i} para={para} />
        ))}
      </div>
    </div>
  );
}

// The expandable "FY2025 approved" full-section reference. Renders the whole
// prior-year section through ContentViewer, so tables/footnotes/citations look
// exactly like a published page. Read-only.
export function PriorYearSection({ section, priorYearText }: Props) {
  const [open, setOpen] = useState(false);

  // Build a read-only ReportSection clone carrying the FY2025 text. Table
  // references in the prior-year text resolve through the same MDD registry;
  // ContentViewer shows the prior-year column via the table's own data.
  const priorSection: ReportSection = useMemo(
    () => ({ ...section, content: priorYearText, id: `${section.id}__fy2025` }),
    [section, priorYearText],
  );

  return (
    <div style={{ marginBottom: '16px', border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▸</span>
        FY2025 approved — full prior-year section (read-only reference)
        <span style={{ marginLeft: 'auto', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
          the baseline the AI rolled forward
        </span>
      </button>
      {open && (
        <div style={{ padding: '16px', background: 'var(--surface-card)' }}>
          <ContentViewer
            section={priorSection}
            onCitationClick={() => {}}
            showCitation={null}
            priorYear
          />
        </div>
      )}
    </div>
  );
}

// Two-tab control over the draft area (13 Jul 2026 feedback).
//   "Editor view" — tracked changes (red/green); shown ONLY to the Editor role.
//   "Clean view"  — the final accepted text; shown to everyone.
// When the acting seat is not an Editor, only the Clean tab renders, so other
// roles never see the track-changes surface.
export function DraftViewToggle({ value, onChange, canSeeEditorView, pendingCount }: {
  value: DraftView;
  onChange: (v: DraftView) => void;
  canSeeEditorView: boolean;
  pendingCount?: number;
}) {
  if (!canSeeEditorView) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <div className="rf-seg">
        <button className={value === 'editor' ? 'active' : ''} onClick={() => onChange('editor')}>
          Editor view {pendingCount ? `(${pendingCount})` : ''}
        </button>
        <button className={value === 'clean' ? 'active' : ''} onClick={() => onChange('clean')}>Clean view</button>
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        {value === 'editor' ? 'Tracked changes (red/green) — accept to finalise' : 'Final text with all changes accepted'}
      </span>
    </div>
  );
}
