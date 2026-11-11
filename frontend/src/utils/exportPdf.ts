import { jsPDF } from 'jspdf';
import type { ReportSection } from '../data/reportSections';
import { mddTables, tableCodeFromLine } from '../data/tableRegistry';
import { BRAND, hexToRgb } from '../data/brand';

// Brand accents for the PDF (Novartis 2026 orange), from the single source of truth.
const BRAND_PRIMARY = hexToRgb(BRAND.primary);       // title
const BRAND_HEADING = hexToRgb(BRAND.primaryDark);   // L1 headings

// #6 (Adrian 2026-07-15): PDF export alongside the Word/MDD DOCX export. The MDD
// Word file remains the authoritative artefact; this produces a readable PDF of
// the report content for sharing/review (headings, narrative, table references
// rendered as compact tables, footnotes as endnotes per section). Client-side
// via jsPDF — no server round-trip, consistent with the rest of the prototype.

// Refs excluded from the body flow of the export (cover/letter/ToC page), mirror
// of exportDocx's TOC_EXCLUDED_REFS so the two exports cover the same sections.
const SKIP_REFS = new Set(['1.0', '2.0', '4.0']);

const FOOTNOTE_G = /\[\^\s*([^\]]+?)\s*\]/g;

// Strip inline markup for plain-text PDF rendering: **bold** markers, citation
// markers [1], and footnote markers (collected separately as endnotes).
function cleanInline(text: string, footnotes: string[]): string {
  return text
    .replace(FOOTNOTE_G, (_m, body: string) => { footnotes.push(body.trim()); return `[${footnotes.length}]`; })
    .replace(/\*\*([^*]+)\*\*/g, '$1');
}

export async function generateAndDownloadPdf(sections: ReportSection[]): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  };

  const writeLines = (text: string, opts: { size: number; bold?: boolean; color?: [number, number, number]; gapAfter?: number }) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size);
    doc.setTextColor(...(opts.color ?? [30, 30, 30]));
    const lines = doc.splitTextToSize(text, contentW) as string[];
    const lineH = opts.size * 1.35;
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, margin, y);
      y += lineH;
    }
    y += opts.gapAfter ?? 0;
  };

  // Title page.
  writeLines('Novartis', { size: 12, bold: true, color: BRAND_PRIMARY, gapAfter: 4 });
  writeLines('Report on Nonfinancial Matters — FY2026', { size: 22, bold: true, gapAfter: 8 });
  writeLines('Generated from the ESG Authoring Studio. The MDD-compliant Word document remains the authoritative export; this PDF is a readable copy for review and sharing.', { size: 10, color: [110, 110, 110], gapAfter: 16 });

  let lastL1: string | undefined;
  let lastL2: string | undefined;

  for (const section of sections) {
    if (SKIP_REFS.has(section.ref)) continue;

    if (section.topicL1 !== lastL1) {
      lastL1 = section.topicL1; lastL2 = undefined;
      y += 8;
      writeLines(section.topicL1, { size: 16, bold: true, color: BRAND_HEADING, gapAfter: 6 });
    }
    if (section.topicL2 && section.topicL2 !== lastL2 && section.parentId) {
      lastL2 = section.topicL2;
      writeLines(section.topicL2, { size: 13, bold: true, color: [40, 40, 40], gapAfter: 4 });
    }
    if (section.topicL3) {
      writeLines(section.topicL3, { size: 11, bold: true, gapAfter: 3 });
    }

    const footnotes: string[] = [];
    for (const para of section.content.split('\n\n')) {
      const p = para.trim();
      if (!p) continue;

      if (p.startsWith('[Table Reference:')) {
        // Render the referenced MDD table compactly; export replaces it with the
        // MDD code note (data source of truth is MDD).
        const code = tableCodeFromLine(p);
        const table = code ? mddTables[code] : null;
        if (table) {
          writeLines(`▦ ${table.title}  [${table.code}]`, { size: 9, bold: true, color: [90, 90, 90], gapAfter: 2 });
          writeLines(table.columns.join('  |  '), { size: 8, bold: true, color: [90, 90, 90], gapAfter: 1 });
          for (const row of table.rows) writeLines(row.join('  |  '), { size: 8, color: [110, 110, 110], gapAfter: 0 });
          writeLines('(Table maintained in MDD; shown for reference.)', { size: 8, color: [150, 150, 150], gapAfter: 8 });
        } else {
          writeLines(p, { size: 9, color: [120, 120, 120], gapAfter: 6 });
        }
      } else if (p.startsWith('![')) {
        writeLines('[Image — embedded in the Word/MDD export]', { size: 9, color: [150, 150, 150], gapAfter: 6 });
      } else if (p.startsWith('## ') || p.startsWith('**')) {
        const heading = p.replace(/^#+\s*/, '').replace(/^\*\*([^*]+)\*\*.*/, '$1');
        writeLines(cleanInline(heading, footnotes), { size: 11, bold: true, gapAfter: 3 });
      } else if (/^[-•]\s+/.test(p)) {
        for (const line of p.split('\n')) {
          const item = line.replace(/^[-•]\s*/, '').trim();
          if (item) writeLines(`•  ${cleanInline(item, footnotes)}`, { size: 10, gapAfter: 2 });
        }
        y += 3;
      } else {
        writeLines(cleanInline(p, footnotes), { size: 10, gapAfter: 8 });
      }
    }

    if (footnotes.length) {
      writeLines('Footnotes', { size: 8, bold: true, color: [120, 120, 120], gapAfter: 2 });
      footnotes.forEach((f, i) => writeLines(`${i + 1}. ${f}`, { size: 8, color: [120, 120, 120], gapAfter: 0 }));
      y += 8;
    }
  }

  // Page numbers.
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageW / 2, pageH - 24, { align: 'center' });
  }

  doc.save('Novartis_RNFM_FY2026.pdf');
}
