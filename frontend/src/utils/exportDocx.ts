import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  PageNumber,
  Header,
  convertMillimetersToTwip,
  LevelFormat,
  SectionType,
  TableOfContents,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ReportSection } from '../data/reportSections';
import { reportMetadata } from '../data/reportSections';
import { TOC_EXCLUDED_REFS, TOC_COLLAPSED_L1 } from '../data/tableOfContents';
import { BRAND, hexBare } from '../data/brand';
import { mddTables, tableCodeFromLine } from '../data/tableRegistry';

// Two Word export variants (Adrian, 21 Aug 2026):
//   'mdd'      — MDD-compatible: tables stay as [Table Reference: DP_*] placeholders
//                (the MDD corporate platform owns the table data). Authoritative.
//   'readable' — human-readable: table references are rendered as real, visible
//                Word tables for reviewers who work offline and don't use the system.
export type DocxVariant = 'mdd' | 'readable';

const FONT = 'Volta Modern';
const FONT_FALLBACK = 'Arial';
// Novartis 2026 brand orange (single source of truth in data/brand.ts). The
// constant name is kept for churn-free references; the value is now the brand accent.
const BRAND_ACCENT = hexBare(BRAND.primary);
const BODY_SIZE = 18;
const H1_SIZE = 24;
const H2_SIZE = 21;
const H3_SIZE = 18;

function resolveFont(): string {
  return FONT;
}

function formatNumber(num: string): string {
  return num.replace(/(\d),(\d)/g, '$1 $2');
}

function parseBold(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: BODY_SIZE, font: resolveFont() }));
    } else if (part) {
      runs.push(new TextRun({ text: part, size: BODY_SIZE, font: resolveFont() }));
    }
  }
  return runs;
}

// Decode a data: URL image and return a centered paragraph containing it, sized
// to fit the page width. Returns null for non-data URLs or unsupported types.
function imageParagraphFromDataUrl(src: string): Paragraph | null {
  const m = src.match(/^data:image\/(png|jpe?g|gif|bmp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const rawType = m[1].toLowerCase();
  const type = rawType === 'jpeg' ? 'jpg' : rawType; // docx expects 'jpg'
  const b64 = m[2];
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // Constrain to a sensible on-page size (max ~150mm wide) while keeping ratio.
  const MAX_W = 420; // px at 96dpi ≈ 111mm
  let width = MAX_W;
  let height = Math.round(MAX_W * 0.6);
  try {
    const dims = imageSizeFromBytes(bytes, type);
    if (dims) {
      const scale = Math.min(1, MAX_W / dims.w);
      width = Math.round(dims.w * scale);
      height = Math.round(dims.h * scale);
    }
  } catch {
    // fall back to defaults
  }

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 80 },
    children: [
      new ImageRun({
        type: type as 'png' | 'jpg' | 'gif' | 'bmp',
        data: bytes,
        transformation: { width, height },
      }),
    ],
  });
}

// Best-effort intrinsic-size read for PNG and JPEG so the embedded image keeps
// its aspect ratio. Returns null if the dimensions can't be determined.
function imageSizeFromBytes(bytes: Uint8Array, type: string): { w: number; h: number } | null {
  if (type === 'png' && bytes.length > 24) {
    // IHDR width/height are big-endian at bytes 16..24.
    const w = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const h = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    if (w > 0 && h > 0) return { w, h };
  }
  if (type === 'jpg') {
    let i = 2;
    while (i < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      // SOF0..SOF3 / SOF5..SOF7 / SOF9..SOF11 carry dimensions.
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb)) {
        const h = (bytes[i + 5] << 8) | bytes[i + 6];
        const w = (bytes[i + 7] << 8) | bytes[i + 8];
        if (w > 0 && h > 0) return { w, h };
        break;
      }
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      if (len <= 0) break;
      i += 2 + len;
    }
  }
  return null;
}

function buildCoverPage(): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 6000 }, children: [] }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Report on', size: 40, font: resolveFont(), color: BRAND_ACCENT })],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [new TextRun({ text: 'Nonfinancial Matters', bold: true, size: 56, font: resolveFont(), color: BRAND_ACCENT })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: '2026', size: 56, font: resolveFont(), color: BRAND_ACCENT })],
    }),
  ];
}

// Native Word table of contents. Rather than emitting a static list (whose page
// numbers we cannot know at generation time), we insert a real TOC field driven
// by the Heading 1/2 styles applied to the chapter and sub-topic titles in the
// body. Word fills in the actual page numbers when the document is opened
// (the document is created with updateFields: true so this happens on open).
function buildTableOfContents(): (Paragraph | TableOfContents)[] {
  return [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { before: 200, after: 300 },
      children: [new TextRun({ text: 'Table of contents', bold: true, size: H1_SIZE, font: resolveFont() })],
    }),
    new TableOfContents('Table of Contents', {
      // Include Heading 1 and Heading 2, with hyperlinks and right-aligned page
      // numbers connected by a dotted tab leader (the classic Word ToC look).
      hyperlink: true,
      headingStyleRange: '1-2',
    }),
  ];
}

// Footnotes (#11): authored inline as "[^ text ]". We strip the markers from the
// body, replace each with a superscript number, and emit a numbered footnotes
// block at the end of the section so they are PRESERVED in the export. A shared
// counter keeps numbering sequential across the section's paragraphs.
const FOOTNOTE_G = /\[\^\s*([^\]]+?)\s*\]/g;

function extractFootnotes(para: string, collected: string[]): { text: string; markers: number[] } {
  const markers: number[] = [];
  const text = para.replace(FOOTNOTE_G, (_m, body) => {
    collected.push(String(body).trim());
    markers.push(collected.length);
    return '';
  });
  return { text, markers };
}

// Render an MDD table reference line as a REAL Word table (readable variant).
// Falls back to null if the code isn't in the registry (caller keeps the text).
function renderMddTable(line: string): (Table | Paragraph)[] | null {
  const code = tableCodeFromLine(line);
  const table = code ? mddTables[code] : null;
  if (!table) return null;

  const headerRow = new TableRow({
    tableHeader: true,
    children: table.columns.map(col => new TableCell({
      shading: { fill: hexBare(BRAND.primaryLight) },
      children: [new Paragraph({ children: [new TextRun({ text: col, bold: true, size: 15, font: resolveFont(), color: BRAND_ACCENT })] })],
    })),
  });
  const bodyRows = table.rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 15, font: resolveFont() })] })],
    })),
  }));

  const out: (Table | Paragraph)[] = [
    new Paragraph({ spacing: { before: 160, after: 60 }, children: [new TextRun({ text: table.title, bold: true, size: 16, font: resolveFont(), color: BRAND_ACCENT })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...bodyRows],
    }),
  ];
  if (table.assurance) {
    out.push(new Paragraph({ spacing: { before: 40, after: 160 }, children: [new TextRun({ text: table.assurance, italics: true, size: 13, font: resolveFont(), color: '666666' })] }));
  }
  return out;
}

function buildSectionContent(section: ReportSection, variant: DocxVariant = 'mdd'): (Paragraph | Table)[] {
  const paragraphs: (Paragraph | Table)[] = [];
  const footnotes: string[] = [];

  // Chapter (L1) and sub-topic (L2) headings are emitted by the main loop with
  // Word Heading styles so the TOC field can anchor to them. Here we only emit
  // the most-specific (L3) subsection title, as plain bold text — it must NOT be
  // a Heading 1/2 or it would pollute the two-level table of contents. When the
  // section has no distinct L3 (its title is just the L1/L2 already shown as a
  // heading), we skip the title entirely to avoid duplication.
  if (section.topicL3) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 240, after: 100 },
        children: [new TextRun({ text: section.topicL3, bold: true, size: H3_SIZE, font: resolveFont() })],
      })
    );
  }

  const contentParagraphs = section.content.split('\n\n');
  for (const para of contentParagraphs) {
    if (!para.trim()) continue;

    const imgMatch = para.trim().match(/^!\[([^\]]*)\]\((.+)\)$/s);
    if (imgMatch) {
      // Uploaded image embedded as a data URL — decode and embed in the DOCX.
      const embedded = imageParagraphFromDataUrl(imgMatch[2]);
      if (embedded) {
        paragraphs.push(embedded);
        if (imgMatch[1]) {
          paragraphs.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: imgMatch[1], size: 16, font: resolveFont(), color: '666666', italics: true })],
          }));
        }
      }
    } else if (para.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 240, after: 80 },
          children: [new TextRun({ text: para.replace(/^#+\s*/, ''), bold: true, size: H3_SIZE, font: resolveFont() })],
        })
      );
    } else if (para.startsWith('[Table Reference:')) {
      // Readable variant renders the actual MDD table; MDD variant keeps the
      // placeholder reference (the MDD platform owns the table data).
      const rendered = variant === 'readable' ? renderMddTable(para) : null;
      if (rendered) {
        paragraphs.push(...rendered);
      } else {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({ text: para, size: BODY_SIZE, font: resolveFont(), color: '666666', italics: true }),
            ],
          })
        );
      }
    } else if (para.startsWith('- ') || para.startsWith('• ')) {
      const items = para.split('\n').filter(l => l.trim());
      for (const item of items) {
        const { text: deFn } = extractFootnotes(item, footnotes);
        const itemText = formatNumber(deFn.replace(/^[-•]\s*/, ''));
        const runs = parseBold(itemText);
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 40, after: 40 },
            indent: { left: 200, hanging: 120 },
            children: [
              new TextRun({ text: '• ', size: BODY_SIZE, font: resolveFont() }),
              ...runs,
            ],
          })
        );
      }
    } else {
      // Extract footnotes first (strip markers, remember their numbers).
      const { text: deFootnoted, markers } = extractFootnotes(para, footnotes);
      let text = deFootnoted;
      const citationRefs: string[] = [];
      const citationPattern = /\[(\d+)\]/g;
      let match;
      while ((match = citationPattern.exec(deFootnoted)) !== null) {
        citationRefs.push(match[1]);
      }
      text = text.replace(citationPattern, '');
      text = formatNumber(text.trim());

      const runs = parseBold(text);
      // Footnote markers render as superscript numbers right after the text.
      for (const n of markers) {
        runs.push(new TextRun({ text: `${n}`, size: 14, font: resolveFont(), superScript: true, color: BRAND_ACCENT }));
      }
      if (citationRefs.length > 0) {
        runs.push(new TextRun({ text: ` ${citationRefs.map(r => r).join(',')}`, size: 14, font: resolveFont(), superScript: true, color: BRAND_ACCENT }));
      }
      paragraphs.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 60, after: 60 }, children: runs }));
    }
  }

  // Section footnotes block (preserved), then source citations.
  paragraphs.push(...buildFootnotesBlock(footnotes));
  paragraphs.push(...buildCitationFootnotes(section));

  return paragraphs;
}

// Numbered footnotes block (#11) — the authored "[^ … ]" notes, preserved in the
// export as a footnotes list at the end of the section.
function buildFootnotesBlock(footnotes: string[]): Paragraph[] {
  if (footnotes.length === 0) return [];
  return [
    new Paragraph({
      spacing: { before: 160, after: 20 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
      children: [new TextRun({ text: 'Footnotes', bold: true, size: 14, font: resolveFont(), color: '666666' })],
    }),
    ...footnotes.map((f, i) =>
      new Paragraph({
        spacing: { before: 10, after: 10 },
        children: [
          new TextRun({ text: `${i + 1} `, size: 14, font: resolveFont(), superScript: true }),
          new TextRun({ text: f, size: 14, font: resolveFont(), color: '444444' }),
        ],
      })
    ),
  ];
}

function buildCitationFootnotes(section: ReportSection): Paragraph[] {
  if (!section.citations || section.citations.length === 0) return [];
  return [
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    ...section.citations.map((c, i) =>
      new Paragraph({
        spacing: { before: 20, after: 20 },
        children: [
          new TextRun({ text: `${i + 1} `, size: 14, font: resolveFont(), superScript: true }),
          new TextRun({ text: c.documentName, size: 14, font: resolveFont(), italics: true }),
          c.pageRef ? new TextRun({ text: `, ${c.pageRef}`, size: 14, font: resolveFont(), color: '666666' }) : new TextRun({ text: '', size: 14 }),
        ],
      })
    ),
  ];
}

export async function generateAndDownloadDocx(sections: ReportSection[], variant: DocxVariant = 'mdd'): Promise<void> {
  const bodyChildren: (Paragraph | TableOfContents | Table)[] = [];

  // Emit chapter (L1) and sub-topic (L2) titles as Word Heading 1/2 so the TOC
  // field anchors to exactly the entries shown in the table of contents. The
  // rules mirror buildTocModel: skip the cover/letter/ToC-page refs, and treat
  // collapsed L1s (Human Rights) as a single Heading 1 with no sub-headings.
  let lastL1: string | undefined;
  let lastL2: string | undefined;
  for (const section of sections) {
    if (TOC_EXCLUDED_REFS.has(section.ref)) continue;

    if (section.topicL1 !== lastL1) {
      lastL1 = section.topicL1;
      lastL2 = undefined;
      bodyChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 160 },
          children: [new TextRun({ text: section.topicL1, bold: true, size: H1_SIZE, font: resolveFont() })],
        })
      );
    }

    const showsL2 = !!section.parentId && !!section.topicL2 && !TOC_COLLAPSED_L1.has(section.topicL1);
    if (showsL2 && section.topicL2 !== lastL2) {
      lastL2 = section.topicL2;
      bodyChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 120 },
          children: [new TextRun({ text: section.topicL2!, bold: true, size: H2_SIZE, font: resolveFont() })],
        })
      );
    }

    bodyChildren.push(...buildSectionContent(section, variant));
  }

  const pageMargin = convertMillimetersToTwip(21);
  // Editing/export uses a normal single-column Word layout; the 2-column
  // publishing format is applied downstream by MDD itself, not here.

  const doc = new Document({
    // Prompt Word to refresh field results (the TOC + its page numbers) on open.
    features: { updateFields: true },
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE },
          paragraph: { spacing: { line: 276 }, alignment: AlignmentType.JUSTIFIED },
        },
      },
      paragraphStyles: [
        { id: 'nov_text_body', name: 'nov_text_body', basedOn: 'Normal', run: { size: BODY_SIZE, font: FONT }, paragraph: { alignment: AlignmentType.JUSTIFIED } },
        { id: 'nov_text_body_indent', name: 'nov_text_body_indent', basedOn: 'Normal', run: { size: BODY_SIZE, font: FONT }, paragraph: { indent: { left: 200 }, alignment: AlignmentType.JUSTIFIED } },
        { id: 'nov_text_body_enumeration', name: 'nov_text_body_enumeration', basedOn: 'Normal', run: { size: BODY_SIZE, font: FONT } },
        { id: 'nov_text_body_enumeration_last', name: 'nov_text_body_enumeration_last', basedOn: 'Normal', run: { size: BODY_SIZE, font: FONT } },
        { id: 'nov_title_main', name: 'nov_title_main_level_section', basedOn: 'Heading1', run: { size: H1_SIZE, font: FONT, bold: true } },
        { id: 'nov_title_main_2', name: 'nov_title_main_level_section_2', basedOn: 'Heading2', run: { size: H2_SIZE, font: FONT, bold: true } },
        { id: 'nov_title_body_1', name: 'nov_title_body_level_1', basedOn: 'Heading3', run: { size: H3_SIZE, font: FONT, bold: true } },
        { id: 'nov_title_body_2', name: 'nov_title_body_level_2', basedOn: 'Heading4', run: { size: BODY_SIZE, font: FONT, bold: true } },
        { id: 'nov_text_table_intro', name: 'nov_text_table_intro_SingleCol', basedOn: 'Normal', run: { size: 16, font: FONT, bold: true } },
        { id: 'section_metainfo', name: 'Section_MetaInfo', basedOn: 'Normal', run: { size: 14, font: FONT, italics: true, color: '666666' } },
        { id: 'table_referenz', name: 'TableReferenz', basedOn: 'Normal', run: { size: BODY_SIZE, font: FONT, italics: true, color: '666666' } },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
            margin: { top: pageMargin, bottom: pageMargin, left: pageMargin, right: pageMargin },
          },
        },
        children: buildCoverPage(),
      },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
            margin: { top: pageMargin, bottom: pageMargin, left: pageMargin, right: pageMargin },
            pageNumbers: { start: 2 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: '', size: 14, font: FONT_FALLBACK, color: '999999' })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 100 },
                children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT_FALLBACK, color: '666666' })],
              }),
            ],
          }),
        },
        children: buildTableOfContents(),
      },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
            margin: { top: pageMargin, bottom: pageMargin, left: pageMargin, right: pageMargin },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: '', size: 14, font: FONT_FALLBACK, color: '999999' })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 100 },
                children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT_FALLBACK, color: '666666' })],
              }),
            ],
          }),
        },
        children: bodyChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const year = reportMetadata.reportingPeriod.match(/\d{4}/)?.[0] || '2026';
  const filename = variant === 'readable'
    ? `Novartis_RNFM_FY${year}_Readable.docx`
    : `Novartis_RNFM_FY${year}_MDD.docx`;
  saveAs(blob, filename);
}
