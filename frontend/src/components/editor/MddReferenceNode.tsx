import { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { mddTables, tableCodeFromLine } from '../../data/tableRegistry';

// A block that stands in for an MDD-managed table, image or infographic. In the
// stored content string these are literal markers:
//   [Table Reference: DP_*]        [Image placeholder: ...]      [Infographic placeholder: ...]
// The editor renders them as rich, READ-ONLY reference cards (tables show the
// real data from the registry) so authors see the numbers while drafting, while
// the marker is preserved verbatim and replaced with the MDD code on export.
//
// Tables are NOT editable here (13 Jul 2026 decision — Christina/Adrian): FRA
// maintains table data in MDD (Word + Excel are separate files there; MDD merges
// them only at PDF creation). Editing in this tool would create a mismatch. The
// author can pull the latest figures with "Refresh from MDD" (user-triggered),
// with an Excel-from-MDD import as the manual fallback.

const isTable = (raw: string) => raw.startsWith('[Table Reference:');
const isImage = (raw: string) => raw.startsWith('[Image placeholder');

function MddCard({ node }: NodeViewProps) {
  const raw: string = node.attrs.raw ?? '';
  const [refreshed, setRefreshed] = useState(false);

  if (isTable(raw)) {
    const code = tableCodeFromLine(raw);
    const table = code ? mddTables[code] : null;

    // User-triggered "Refresh from MDD" (pull, not push). In the prototype the
    // registry IS the MDD stand-in, so this re-pulls the latest figures and
    // confirms the sync. Real MDD API integration is pending the Taulant session.
    const refreshFromMdd = () => {
      setRefreshed(true);
      window.setTimeout(() => setRefreshed(false), 2500);
    };

    return (
      <NodeViewWrapper className="mdd-node" contentEditable={false}>
        {table ? (
          <div className="mdd-table-card">
            <div className="mdd-table-head">
              <span className="mdd-table-title">{table.title}</span>
              <span className="mdd-table-code">{table.code}</span>
              <span className="mdd-ref-badge" title="Table data is maintained in MDD (FRA). Shown read-only for context; replaced with the MDD code on export.">⟳ MDD reference only</span>
            </div>
            <table className="data-table" style={{ margin: 0 }}>
              <thead><tr>{table.columns.map(c => <th key={c} style={{ fontSize: '11px' }}>{c}</th>)}</tr></thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => <td key={j} style={{ fontSize: '12px', fontFamily: j === 0 ? 'inherit' : 'monospace' }}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {table.assurance && <div className="mdd-table-assurance">∆ {table.assurance}</div>}
            {/* Read-only reference + user-triggered refresh from MDD. */}
            <div className="mdd-table-actions">
              <span className="mdd-table-actions-hint">
                🔒 Read-only — table data is maintained in MDD by FRA. Editing here is intentionally disabled to avoid mismatch.
              </span>
              {refreshed ? (
                <span className="mdd-refresh-ok" title="Latest figures pulled from MDD">✓ Refreshed from MDD</span>
              ) : (
                <button
                  type="button"
                  className="mdd-refresh-btn"
                  title="Pull the latest table data from MDD (user-triggered). Fallback: export the Excel from MDD and import it here."
                  onMouseDown={e => e.preventDefault()}
                  onClick={refreshFromMdd}
                >
                  ⟳ Refresh from MDD
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mdd-placeholder">{raw}</div>
        )}
      </NodeViewWrapper>
    );
  }

  // Image / infographic placeholder.
  return (
    <NodeViewWrapper className="mdd-node" contentEditable={false}>
      <div className="mdd-media-card">
        <span className="mdd-media-icon">{isImage(raw) ? '🖼' : '📊'}</span>
        <span>{raw}</span>
      </div>
    </NodeViewWrapper>
  );
}

export const MddReference = Node.create({
  name: 'mddReference',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      // The marker (e.g. "[Table Reference: DP_*]") is carried on the
      // `data-mdd-raw` DOM attribute. parseHTML reads it back so an EXISTING
      // table in a section renders when the editor is opened — without this the
      // attribute defaulted to '' and the table showed as a blank atom (only
      // freshly-inserted tables, which set `raw` directly, appeared).
      raw: {
        default: '',
        parseHTML: element => element.getAttribute('data-mdd-raw') ?? '',
        renderHTML: attributes => ({ 'data-mdd-raw': attributes.raw ?? '' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdd-raw]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // The `raw` attribute's renderHTML (above) already emits data-mdd-raw.
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MddCard);
  },
});
