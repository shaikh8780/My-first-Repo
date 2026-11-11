// Cross-report portfolio aggregation — the data layer behind the Home landing.
//
// This sits alongside getReport (registry) and getReportDataset (per-report
// dataset seam). It aggregates ACROSS all reports for the report-agnostic Home
// view: a portfolio status board + a role-filtered "My tasks" list.
//
// Everything here is derived from the two existing seams — no new source of
// truth — so the landing page can never disagree with a report's own dashboard.

import { reports, getReport, type ReportDefinition, type ReportId } from './reports';
import { getReportDataset, type ScopedSection } from './reportData';
import type { WorkflowStage } from './reportSections';

export interface PortfolioReportRow {
  def: ReportDefinition;
  total: number;
  byStage: Record<WorkflowStage, number>;
  approved: number;
  inDraft: number;
  progressPercent: number;         // approved+exported / total
  coveragePercent: number;
  openFlags: number;               // consistency checks not passing (fail/review)
  failFlags: number;               // consistency checks failing outright
  lastActivity?: { timestamp: string; user: string; action: string; details: string };
}

export interface PortfolioSummary {
  rows: PortfolioReportRow[];
  totals: {
    reports: number;
    sections: number;
    approved: number;
    avgProgress: number;
    avgCoverage: number;
    openFlags: number;
  };
}

const DONE_STAGES: WorkflowStage[] = ['approved', 'exported'];

function latestAudit(reportId: ReportId) {
  const ds = getReportDataset(reportId);
  if (!ds.audit.length) return undefined;
  // audit arrays are small; pick the max timestamp without mutating.
  return ds.audit.reduce((a, b) => (a.timestamp >= b.timestamp ? a : b));
}

export function getPortfolioSummary(): PortfolioSummary {
  const rows: PortfolioReportRow[] = reports.map(def => {
    const ds = getReportDataset(def.id);
    const total = ds.workflow.total || ds.sections.length;
    const approved = (ds.workflow.byStage.approved ?? 0) + (ds.workflow.byStage.exported ?? 0);
    const openFlags = ds.consistency.filter(c => c.status !== 'pass').length;
    const failFlags = ds.consistency.filter(c => c.status === 'fail').length;
    const last = latestAudit(def.id);
    return {
      def,
      total,
      byStage: ds.workflow.byStage,
      approved,
      inDraft: ds.workflow.byStage.draft ?? 0,
      progressPercent: total ? Math.round((approved / total) * 100) : 0,
      coveragePercent: ds.compliance.coveragePercent,
      openFlags,
      failFlags,
      lastActivity: last ? { timestamp: last.timestamp, user: last.user, action: last.action, details: last.details } : undefined,
    };
  });

  const n = rows.length || 1;
  return {
    rows,
    totals: {
      reports: rows.length,
      sections: rows.reduce((s, r) => s + r.total, 0),
      approved: rows.reduce((s, r) => s + r.approved, 0),
      avgProgress: Math.round(rows.reduce((s, r) => s + r.progressPercent, 0) / n),
      avgCoverage: Math.round(rows.reduce((s, r) => s + r.coveragePercent, 0) / n),
      openFlags: rows.reduce((s, r) => s + r.openFlags, 0),
    },
  };
}

// --- My tasks across reports ------------------------------------------------
// A "task" is a section owned by the signed-in user that is in an ACTIONABLE
// stage (not yet approved/exported). Stages map to a suggested action.
export interface CrossReportTask {
  reportId: ReportId;
  reportName: string;
  reportShort: string;
  sectionRef: string;
  sectionTitle: string;
  stage: WorkflowStage;
  action: string;
  owner: string;
}

const STAGE_ACTION: Record<WorkflowStage, string> = {
  draft: 'Draft content',
  sme_review: 'Review & edit',
  legal_review: 'Legal review',
  approved: 'Signed off',
  exported: 'Exported',
};

// Match a signed-in alias (e.g. "sam.delgado") to a directory display name
// ("Sam Delgado") used as the section owner. Falls back to loose token match so
// "jordan.avery", "jordanavery" and "Jordan Avery" all resolve.
function aliasMatchesOwner(alias: string, owner: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const a = norm(alias);
  const o = norm(owner);
  if (!a) return false;
  if (a === o) return true;
  // token overlap: alias "sam.delgado" -> ["sam","delgado"] both in owner.
  const tokens = alias.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return tokens.length > 0 && tokens.every(t => o.includes(t));
}

export interface MyTasksResult {
  tasks: CrossReportTask[];
  // When the user matches no owner (e.g. Guest / unknown alias) we surface the
  // full actionable queue instead of an empty list, flagged as unfiltered.
  unfiltered: boolean;
}

export function getMyTasks(alias: string | null): MyTasksResult {
  const all: CrossReportTask[] = [];
  for (const def of reports) {
    const ds = getReportDataset(def.id);
    for (const s of ds.sections as ScopedSection[]) {
      if (DONE_STAGES.includes(s.stage)) continue; // only open work
      all.push({
        reportId: def.id,
        reportName: def.name,
        reportShort: def.shortName,
        sectionRef: s.ref,
        sectionTitle: s.title,
        stage: s.stage,
        action: STAGE_ACTION[s.stage],
        owner: s.owner,
      });
    }
  }
  const mine = alias ? all.filter(t => aliasMatchesOwner(alias, t.owner)) : [];
  if (mine.length > 0) return { tasks: mine, unfiltered: false };
  // No identity match → show everything actionable (demo convenience), flagged.
  return { tasks: all, unfiltered: true };
}

// Distinct owners in the portfolio (for a "who owns what" hint / demo persona list).
export function portfolioOwners(): string[] {
  const set = new Set<string>();
  for (const def of reports) {
    for (const s of getReportDataset(def.id).sections) set.add(s.owner);
  }
  return [...set].sort();
}

export { getReport };
