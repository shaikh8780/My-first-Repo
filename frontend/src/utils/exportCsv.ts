import { saveAs } from 'file-saver';

// Real CSV export for the compliance views (Adrian/Thevi, 21 Aug 2026 — gap
// analysis + disclosure checklist need an Excel export, not a placeholder toast).
//
// CSV opens directly in Excel and needs no extra dependency (keeps the backend
// deployable from this environment). We emit a UTF-8 BOM so Excel renders
// accented characters correctly, and RFC-4180-quote every field.

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  // Quote if the value contains a comma, quote, or newline; double embedded quotes.
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: (unknown[])[]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  return lines.join('\r\n');
}

// Trigger a browser download of the given rows as a .csv file. `﻿` = BOM.
export function downloadCsv(filename: string, headers: string[], rows: (unknown[])[]): void {
  const csv = '﻿' + toCsv(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}
