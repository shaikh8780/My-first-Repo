// Customer-maintained disclosure-checklist as the authoritative datapoint source
// of truth (Thevi & Adrian, 21 Aug 2026).
//
// Model confirmed on the call: Novartis maintains a master Excel of disclosure
// datapoints, filtered by their Double Materiality Assessment (DMA) for
// relevance. The system INGESTS that checklist and treats it as the source of
// truth for which datapoints are in scope — it does NOT independently decide
// relevance. The published standards remain the interpretive context the AI
// uses to explain each datapoint.
//
// Ingestion here is a manual, VERSIONED upload (the safer option flagged on the
// call — a live SharePoint sync would propagate any spreadsheet error straight
// into the tool). The parsed checklist is persisted through the real backend
// (api.report.datapointChecklist) so it is durable and shared, not client-only.
// A SharePoint/URL connector is a documented roadmap seam (see Architecture).

export type MaterialityFlag = 'material' | 'not_material' | 'phase_in' | 'unspecified';

export interface ChecklistDatapoint {
  drId: string;            // e.g. "ESRS-E1-6"
  framework: string;       // ESRS / GRI / TCFD / ISSB / ...
  standard: string;        // E1 / S1 / IFRS S2 / ...
  title: string;           // requirement text / label
  materiality: MaterialityFlag;  // from the customer's DMA
  mandatory: boolean;
  note?: string;           // free-text note from the customer's Excel
}

export interface DatapointChecklist {
  version: number;                 // 1-based; bumped each upload
  uploadedBy: string;
  uploadedAt: string;              // ISO
  sourceFileName: string;
  rowCount: number;
  datapoints: ChecklistDatapoint[];
}

// Persisted shape: the current checklist plus prior versions (immutable history).
export interface DatapointChecklistStore {
  current: DatapointChecklist | null;
  history: DatapointChecklist[];   // previous versions, newest last
}

export const EMPTY_CHECKLIST_STORE: DatapointChecklistStore = { current: null, history: [] };

// --- CSV parsing ------------------------------------------------------------
// Accept a customer Excel exported as CSV (the universal interchange format —
// avoids a heavy xlsx parser and the risks that come with binary formats). We
// tolerate header-name variants and reorder columns by header, so the customer
// doesn't have to match an exact column order.

const HEADER_ALIASES: Record<keyof Omit<ChecklistDatapoint, never>, string[]> = {
  drId: ['dr id', 'drid', 'dr', 'id', 'datapoint', 'data point', 'code'],
  framework: ['framework', 'standardset', 'standard set'],
  standard: ['standard', 'topic', 'esrs', 'disclosure'],
  title: ['title', 'requirement', 'description', 'label', 'name'],
  materiality: ['materiality', 'dma', 'material', 'relevance'],
  mandatory: ['mandatory', 'required', 'obligation'],
  note: ['note', 'notes', 'comment', 'comments', 'remark'],
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function normMateriality(raw: string): MaterialityFlag {
  const v = raw.toLowerCase();
  if (/phase|later|deferred/.test(v)) return 'phase_in';
  if (/not|no|n\/a|excl|irrelevant/.test(v)) return 'not_material';
  if (/yes|material|relevant|y\b|true/.test(v)) return 'material';
  return 'unspecified';
}

function normMandatory(raw: string): boolean {
  return /yes|y\b|true|mandatory|required|1/.test(raw.toLowerCase());
}

export interface ParseResult {
  datapoints: ChecklistDatapoint[];
  errors: string[];   // human-readable problems (bad rows skipped)
}

// Parse raw CSV text into checklist datapoints. Returns parsed rows + any
// per-row errors so the uploader can surface data-quality issues rather than
// silently ingesting a malformed sheet.
export function parseChecklistCsv(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return { datapoints: [], errors: ['File has no data rows (need a header row + at least one datapoint).'] };

  const header = splitCsvLine(lines[0]).map(h => h.toLowerCase());
  const colIndex = (key: keyof typeof HEADER_ALIASES): number => {
    for (const alias of HEADER_ALIASES[key]) {
      const i = header.indexOf(alias);
      if (i >= 0) return i;
    }
    return -1;
  };
  const idx = {
    drId: colIndex('drId'), framework: colIndex('framework'), standard: colIndex('standard'),
    title: colIndex('title'), materiality: colIndex('materiality'), mandatory: colIndex('mandatory'), note: colIndex('note'),
  };
  if (idx.drId < 0 && idx.title < 0) {
    return { datapoints: [], errors: [`Could not find a "DR ID" or "Requirement" column. Found headers: ${header.join(', ')}`] };
  }

  const datapoints: ChecklistDatapoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const get = (j: number) => (j >= 0 && j < cells.length ? cells[j] : '');
    const drId = get(idx.drId) || `ROW-${i}`;
    const title = get(idx.title);
    if (!drId && !title) { errors.push(`Row ${i + 1}: empty — skipped.`); continue; }
    datapoints.push({
      drId,
      framework: get(idx.framework) || 'Unspecified',
      standard: get(idx.standard) || '',
      title: title || drId,
      materiality: normMateriality(get(idx.materiality)),
      mandatory: normMandatory(get(idx.mandatory)),
      note: get(idx.note) || undefined,
    });
  }
  return { datapoints, errors };
}

// Summary counts for the admin UI.
export function checklistSummary(dps: ChecklistDatapoint[]) {
  const byFramework: Record<string, number> = {};
  let material = 0, notMaterial = 0, mandatory = 0;
  for (const d of dps) {
    byFramework[d.framework] = (byFramework[d.framework] ?? 0) + 1;
    if (d.materiality === 'material') material++;
    if (d.materiality === 'not_material') notMaterial++;
    if (d.mandatory) mandatory++;
  }
  return { total: dps.length, byFramework, material, notMaterial, mandatory };
}
