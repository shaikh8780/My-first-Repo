// Year-on-year roll-forward items (#13, 2026-07-09 call — refined UX).
//
// Instead of a single roll-forward banner per subsection, the reviewer sees a
// LIST of individual items that likely changed year-on-year (year-specific data,
// targets, achievements, dates). Each item is addressable: confirm / update /
// flag-for-later. This module produces those items from a subsection: rich
// seeded items for the demo subsections, plus an auto-detector that surfaces
// obvious YoY candidates (prior-year mentions, target years, figures) for the
// rest, so every rolled-forward subsection has something actionable.

import type { ReportSection } from './reportSections';

export type RollForwardItemKind = 'year' | 'target' | 'metric' | 'date' | 'achievement';
export type RollForwardResolution = 'pending' | 'confirmed' | 'updated' | 'flagged';

export interface RollForwardItem {
  id: string;
  kind: RollForwardItemKind;
  // What to check, and the snippet from the draft it refers to.
  label: string;
  snippet: string;
  // Optional hint about what changed / what to verify.
  hint?: string;
}

const KIND_LABEL: Record<RollForwardItemKind, string> = {
  year: 'Reporting year',
  target: 'Target',
  metric: 'Metric / figure',
  date: 'Date',
  achievement: 'Achievement / status',
};

export { KIND_LABEL };

// Rich, hand-authored items for key demo subsections (grounded in the FY2026 content).
const SEEDED: Record<string, RollForwardItem[]> = {
  'sub-8-1-3': [
    { id: 'rf-813-1', kind: 'achievement', label: 'Carbon-neutrality claim', snippet: 'In 2026, we achieved carbon neutrality in our own operations (Scope 1 and 2 from energy)', hint: 'Confirm the FY2026 status still holds and matches the approved figures / Legal wording.' },
    { id: 'rf-813-2', kind: 'target', label: 'Scope 3 −42% by 2030 target', snippet: 'reduce absolute Scope 3 GHG emissions 42% by 2030', hint: 'Verify the target and base year are unchanged vs the SBTi-validated commitment.' },
    { id: 'rf-813-3', kind: 'date', label: 'SBTi validation year', snippet: 'validated by the Science Based Targets initiative (SBTi) in 2024', hint: 'Carried forward from prior year — confirm still current.' },
  ],
  'sub-9-1-1': [
    { id: 'rf-911-1', kind: 'metric', label: 'Lost-time injury & illness rate', snippet: 'lost-time injury and illness rate for employees was 0.12 per 200 000 work hours', hint: 'Update with the final FY2026 figure and prior-year comparison.' },
    { id: 'rf-911-2', kind: 'achievement', label: 'HSE system coverage', snippet: 'more than 99% of employees', hint: 'Confirm the FY2026 coverage percentage.' },
  ],
  'sub-7-2-1': [
    { id: 'rf-721-1', kind: 'metric', label: 'FTE headcount', snippet: 'employed 75 267 FTEs', hint: 'Update with the December 31, 2026 headcount.' },
    { id: 'rf-721-2', kind: 'date', label: 'As-of date', snippet: 'As of December 31, 2026', hint: 'Confirm the reporting-period end date.' },
    { id: 'rf-721-3', kind: 'metric', label: 'Supplier count', snippet: 'approximately 60 000 direct suppliers', hint: 'Verify the FY2026 supplier base figure.' },
  ],
};

// Auto-detect obvious YoY candidates from the content for subsections without
// seeded items. Deterministic (no randomness) so the demo is stable.
function autoDetect(section: ReportSection): RollForwardItem[] {
  const items: RollForwardItem[] = [];
  const content = section.content;
  const seen = new Set<string>();
  const push = (kind: RollForwardItemKind, label: string, snippet: string, hint?: string) => {
    const key = `${kind}:${snippet}`;
    if (seen.has(key) || items.length >= 4) return;
    seen.add(key);
    items.push({ id: `rf-${section.id}-${items.length + 1}`, kind, label, snippet, hint });
  };

  // Sentences mentioning the reporting year or "prior year".
  const sentences = content.split(/(?<=[.;])\s+/);
  for (const s of sentences) {
    if (/\bin 2026\b|\bfor 2026\b|\bDecember 31, 2026\b/.test(s)) {
      push('year', 'Reporting-year statement', s.trim().slice(0, 160), 'Confirm the 2026 figure/date or update from FY2026 actuals.');
    }
    // Target with a future year.
    if (/\bby (20\d\d)\b/.test(s) && /(reduce|target|achieve|net-?zero|100%|neutral)/i.test(s)) {
      push('target', 'Target with a horizon year', s.trim().slice(0, 160), 'Verify the target and base year are unchanged.');
    }
    // A percentage or large number likely to be a metric.
    if (/\b\d[\d\s.,]*\s?(%|tCO2e|ktCO2e|million|billion|FTEs?)\b/.test(s)) {
      push('metric', 'Quantitative figure', s.trim().slice(0, 160), 'Update with the final FY2026 value.');
    }
  }
  return items;
}

// The roll-forward items to review for a subsection. Only meaningful for
// subsections that carry forward from a prior year (not brand-'new' ones).
export function rollForwardItemsFor(section: ReportSection): RollForwardItem[] {
  if (section.rollForwardStatus === 'new') return [];
  if (SEEDED[section.id]) return SEEDED[section.id];
  return autoDetect(section);
}
