import type React from 'react';
import type { ReportSection } from '../../data/reportSections';
import { mddTables, tableCodeFromLine } from '../../data/tableRegistry';
import TableOfContentsView from './TableOfContentsView';

interface Props {
  section: ReportSection;
  onCitationClick: (citId: string) => void;
  showCitation: string | null;
  allSections?: ReportSection[];
  // When true this is the read-only FY2025 prior-year rendering used by the
  // roll-forward compare: citations non-interactive.
  priorYear?: boolean;
  // Snippets belonging to roll-forward items the user FLAGGED (data not yet
  // available). Any occurrence is highlighted PINK in the rendered content so
  // it's easy to spot at a glance (Adrian 2026-07-15). Optional.
  flaggedSnippets?: string[];
}

// Wrap occurrences of a flagged snippet in a pink highlight. Case-insensitive,
// earliest-match-first, recursing over the remainder so multiple flags in one
// paragraph all highlight. Returns the raw text when nothing matches.
function highlightFlags(text: string, snippets: string[]): React.ReactNode {
  if (!snippets.length || !text) return text;
  let best: { start: number; end: number } | null = null;
  const lower = text.toLowerCase();
  for (const snip of snippets) {
    const s = snip.trim();
    if (s.length < 4) continue;
    const idx = lower.indexOf(s.toLowerCase());
    if (idx !== -1 && (!best || idx < best.start)) best = { start: idx, end: idx + s.length };
  }
  if (!best) return text;
  return (
    <>
      {text.slice(0, best.start)}
      <mark title="Flagged for roll-forward — data not yet available; keep tracked" style={{ background: '#fce7f3', color: '#9d174d', borderBottom: '2px solid #ec4899', borderRadius: '2px', padding: '0 2px' }}>
        {text.slice(best.start, best.end)}
      </mark>
      {highlightFlags(text.slice(best.end), snippets)}
    </>
  );
}

// I — render a "[Table Reference: DP_*]" line as a visible, reference-only table
// so authors can see the numbers while drafting. On export this is replaced with
// the MDD code (see exportDocx). Unknown codes fall back to a code chip.
function MddTableView({ line }: { line: string }) {
  const code = tableCodeFromLine(line);
  const table = code ? mddTables[code] : null;
  if (!table) {
    return (
      <div style={{ margin: '12px 0', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{line}</div>
    );
  }
  return (
    <div style={{ margin: '16px 0', border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
        <span style={{ fontSize: '12px', fontWeight: 700 }}>{table.title}</span>
        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{table.code}</span>
        <span title="Data source of truth is MDD; this table is reference-only and is replaced with the MDD code at export." style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'var(--accent-light)', color: 'var(--accent)' }}>
          ⟳ MDD reference only
        </span>
      </div>
      <table className="data-table" style={{ margin: 0 }}>
        <thead>
          <tr>{table.columns.map(c => <th key={c} style={{ fontSize: '11px' }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} style={{ fontSize: '12px', fontFamily: j === 0 ? 'inherit' : 'monospace' }}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {table.assurance && (
        <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)' }}>∆ {table.assurance}</div>
      )}
    </div>
  );
}

export default function ContentViewer({ section, onCitationClick, showCitation, allSections, priorYear = false, flaggedSnippets = [] }: Props) {
  // Footnotes (#11): authored inline as "[^ footnote text ]". Collect them across
  // the whole subsection so numbering is sequential and a footnotes list can be
  // rendered at the end; they are preserved through the serializer and DOCX export.
  const footnotes: string[] = [];
  const FOOTNOTE_RE = /\[\^\s*([^\]]+?)\s*\]/;
  // Split on citations "[n]" and footnotes "[^ … ]" while keeping the delimiters.
  const TOKEN_SPLIT = /(\[\^\s*[^\]]+?\s*\]|\[\d+\])/g;

  const renderContent = (content: string, citations: ReportSection['citations']) => {
    const parts = content.split(TOKEN_SPLIT);
    return parts.map((part, i) => {
      const fn = part.match(FOOTNOTE_RE);
      if (fn) {
        footnotes.push(fn[1]);
        const n = footnotes.length;
        return (
          <sup key={i} className="footnote-marker" title={fn[1]} style={{ color: 'var(--accent)', cursor: 'help', fontWeight: 700 }}>
            {n}
          </sup>
        );
      }
      const cm = part.match(/^\[(\d+)\]$/);
      if (cm) {
        const citIdx = parseInt(cm[1]) - 1;
        const cit = citations[citIdx];
        return (
          <sup
            key={i}
            className="citation-marker"
            onClick={(e) => { e.stopPropagation(); onCitationClick(cit?.id || ''); }}
          >
            [{cm[1]}]
          </sup>
        );
      }
      return <span key={i}>{highlightFlags(part, flaggedSnippets)}</span>;
    });
  };

  // The Table of Contents subsection renders a live, auto-generated ToC that
  // adapts to the chapter structure, rather than the generic MDD-table stub.
  if (section.topicL1 === 'Table of Contents') {
    return <TableOfContentsView sections={allSections} />;
  }

  return (
    <div className="content-viewer">
      <div style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        {section.content.split('\n\n').map((para, i) => {
          // Content renders plainly — no AI highlighting (13 Jul 2026 feedback #3).
          const wrap = (el: React.ReactNode) => el;
          if (para.trim().startsWith('[Table Reference:')) {
            return wrap(<MddTableView key={`c${i}`} line={para.trim()} />);
          }
          const imgMatch = para.trim().match(/^!\[([^\]]*)\]\((.+)\)$/s);
          if (imgMatch) {
            return wrap(
              <div key={`c${i}`} style={{ margin: '16px 0', textAlign: 'center' }}>
                {/* Reduced display size while authoring/reviewing; the full-size
                    image is embedded only in the DOCX export. */}
                <img src={imgMatch[2]} alt={imgMatch[1]} style={{ maxWidth: '340px', maxHeight: '220px', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-primary)' }} />
                {imgMatch[1] && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{imgMatch[1]}</div>}
              </div>
            );
          }
          if (para.startsWith('[Image placeholder') || para.startsWith('[Infographic placeholder')) {
            return wrap(
              <div key={`c${i}`} style={{ margin: '16px 0', padding: '24px', border: '1px dashed var(--border-primary)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-secondary)' }}>
                {para}
              </div>
            );
          }
          if (para.startsWith('## ')) {
            const lines = para.split('\n');
            const heading = lines[0].replace(/^##\s*/, '');
            const rest = lines.slice(1).join('\n').trim();
            return wrap(
              <div key={`c${i}`} style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{heading}</h3>
                {rest && <p>{renderContent(rest, section.citations)}</p>}
              </div>
            );
          }
          if (para.startsWith('**')) {
            const headingMatch = para.match(/^\*\*(.+?)\*\*/);
            const heading = headingMatch ? headingMatch[1] : '';
            const body = para.replace(/^\*\*.+?\*\*\s*/, '');
            return wrap(
              <div key={`c${i}`} style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{heading}</h3>
                {body && <p>{renderContent(body, section.citations)}</p>}
              </div>
            );
          }
          if (para.startsWith('- ')) {
            return wrap(
              <ul key={`c${i}`} style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                {para.split('\n').map((line, j) => (
                  <li key={j} style={{ marginBottom: '4px' }}>{renderContent(line.replace(/^- /, ''), section.citations)}</li>
                ))}
              </ul>
            );
          }
          return wrap(<p key={`c${i}`} style={{ marginBottom: '16px' }}>{renderContent(para, section.citations)}</p>);
        })}
      </div>

      {/* Footnotes (#11) — numbered list; preserved on export as Word footnotes. */}
      {footnotes.length > 0 && (
        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Footnotes</div>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            {footnotes.map((f, i) => (
              <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '4px' }}>{f}</li>
            ))}
          </ol>
        </div>
      )}

      {showCitation && (
        <div className="citation-panel">
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px' }}>Source Citation</div>
          {section.citations.filter(c => c.id === showCitation).map(cit => (
            <div key={cit.id}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{cit.documentName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{cit.documentType} · {cit.pageRef}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: 'italic', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>"{cit.excerpt}"</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
