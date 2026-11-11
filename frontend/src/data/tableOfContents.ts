// Table-of-contents model, derived from the live report structure so it always
// adapts to the chapters (add/remove/reorder a section and the ToC follows).
//
// Mirrors the Novartis "Report on Nonfinancial Matters" ToC:
//   Introduction and use of certain terms
//   Forward-looking statements
//   Basis of preparation
//   Business model            (chapter, sub-topics listed)
//     Corporate governance / Value chain / Strategy / ...
//   Environmental matters     (chapter)
//     Climate change / Pollution of water
//   Social matters            (chapter)
//   Governance matters        (chapter)
//   Appendix                  (chapter)
//     TCFD index / GRI index / assurance report
//   Human Rights Statement 2025
//
// Page numbers are NOT stored here: in a paginated Word document only Word can
// compute them. The editor shows a "p. —" placeholder; the DOCX export emits a
// native Word TOC field that fills real page numbers when the document opens.

import { reportSections, type ReportSection } from './reportSections';

export interface TocEntry {
  level: 1 | 2;   // 1 = chapter / standalone entry, 2 = sub-topic
  title: string;
}

// Cover, Chair & CEO's letter and the ToC page itself are not listed in the ToC.
export const TOC_EXCLUDED_REFS = new Set(['1.0', '2.0', '3.0']);

// L1 topics that appear as a single line even though they have sub-sections in
// the structure (matches the printed report, where the Human Rights Statement is
// referenced as one entry rather than expanded).
export const TOC_COLLAPSED_L1 = new Set(['Human Rights Statement 2025']);

export function buildTocModel(sections: ReportSection[] = reportSections): TocEntry[] {
  const entries: TocEntry[] = [];
  const seenL1 = new Set<string>();
  const seenL2 = new Set<string>();

  for (const s of sections) {
    if (TOC_EXCLUDED_REFS.has(s.ref)) continue;

    // Chapter / top-level line, once per L1 topic.
    if (!seenL1.has(s.topicL1)) {
      seenL1.add(s.topicL1);
      entries.push({ level: 1, title: s.topicL1 });
    }

    // Sub-topics are listed only for real chapters (those with a parentId, i.e.
    // Business model / Environmental / Social / Governance / Appendix) and not
    // for collapsed L1s. "Basis of preparation" has no parentId, so it stays a
    // single line even though its rows carry an L2 label.
    if (s.parentId && s.topicL2 && !TOC_COLLAPSED_L1.has(s.topicL1)) {
      const key = `${s.topicL1}||${s.topicL2}`;
      if (!seenL2.has(key)) {
        seenL2.add(key);
        entries.push({ level: 2, title: s.topicL2 });
      }
    }
  }

  return entries;
}
