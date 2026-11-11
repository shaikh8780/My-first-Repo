import { buildTocModel } from '../../data/tableOfContents';
import type { ReportSection } from '../../data/reportSections';

// Word-like table of contents shown in the editor / read view. It is generated
// from the live chapter structure (so it adapts as sections are added, removed
// or reordered) and is non-editable. Page numbers show a placeholder here — real
// numbers are filled by Word from the native TOC field on export.
//
// `sections` is the editor's live, published section list. When omitted, the
// model falls back to the code baseline (used only where no live state exists).
export default function TableOfContentsView({ sections }: { sections?: ReportSection[] }) {
  const toc = buildTocModel(sections);
  return (
    <div className="toc-view" contentEditable={false}>
      <div className="toc-head">
        <span className="toc-title">Table of contents</span>
        <span className="mdd-ref-badge" title="Auto-generated from the report chapters. Real page numbers are inserted by Word on export.">
          ⟳ auto-generated · page numbers on export
        </span>
      </div>
      <div className="toc-list">
        {toc.map((e, i) => (
          <div key={i} className={`toc-row toc-l${e.level}`}>
            <span className="toc-entry-title">{e.title}</span>
            <span className="toc-dots" aria-hidden="true" />
            <span className="toc-page">p. —</span>
          </div>
        ))}
      </div>
    </div>
  );
}
