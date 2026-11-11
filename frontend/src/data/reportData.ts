// Report-scoped data seam.
//
// Every report-scoped view (dashboard, editor, structure, compliance, consistency,
// audit, upload) resolves its data THROUGH this module keyed by ReportId, instead
// of importing the RNFM singletons directly. This is the seam that makes the app
// genuinely multi-report: RNFM reuses the existing rich datasets; the parallel
// reports (ESG Index, UPC, ASRS) carry their own compact-but-real datasets here.
//
// Adding a new report = add its ReportId to reports.ts and a branch here; no view
// needs to change.

import type { ReportId } from './reports';
import { getReport } from './reports';
import { reportSections, hrsSections, type ReportSection, type WorkflowStage } from './reportSections';
import { sectionAssignments, workflowStats, type SectionAssignment } from './workflowState';
import { consistencyChecks, type ConsistencyCheck } from './consistencyChecks';
import { auditEvents, type AuditEvent } from './auditEvents';
import { complianceStats } from './complianceMappings';
import { upcSections } from './upc';
import { asrsMappings } from './asrs';

export interface WorkflowStageCounts {
  draft: number;
  sme_review: number;
  legal_review: number;
  approved: number;
  exported: number;
}

// A lightweight, uniform per-report section row usable by the scoped Dashboard,
// Structure and (parallel) Editor views without dragging in the full RNFM shape.
export interface ScopedSection {
  ref: string;
  title: string;
  topicL1: string;
  topicL2?: string;
  stage: WorkflowStage;
  owner: string;
}

export interface ReportComplianceSummary {
  covered: number;
  partial: number;
  missing: number;
  total: number;
  coveragePercent: number;
  frameworks: string[];
}

export interface ReportDataset {
  reportId: ReportId;
  sections: ScopedSection[];
  workflow: { total: number; byStage: WorkflowStageCounts; overdue: number };
  compliance: ReportComplianceSummary;
  consistency: ConsistencyCheck[];
  audit: AuditEvent[];
  // Whether this report is fully authored (RNFM) or a parallel output that reuses
  // the shared knowledge base and cross-references the RNFM for methodology.
  isPrimary: boolean;
}

// --- RNFM: reuse the rich existing singletons -------------------------------
function rnfmSections(): ScopedSection[] {
  return reportSections.map((s: ReportSection) => ({
    ref: s.ref,
    title: s.title,
    topicL1: s.topicL1,
    topicL2: s.topicL2,
    stage: s.stage,
    owner: s.roles.owners[0],
  }));
}

// --- Parallel reports: derive scoped sections from their structure ----------
// Each parallel report cycles through a deterministic stage pattern so the
// dashboard/workflow views show a realistic (non-uniform) distribution without
// inventing per-subsection workflow records.
const PARALLEL_STAGE_CYCLE: WorkflowStage[] = ['approved', 'legal_review', 'sme_review', 'draft', 'sme_review'];

// Illustrative (seeded) owner pools per parallel report. These are DEMO
// assignments — they mirror the synthetic directory people by functional area so
// the cross-report "My tasks" landing view returns meaningful, varied results
// per signed-in user. In the Novartis environment owners come from the real
// per-subsection role model (as RNFM/HRS already do). Owners are assigned
// deterministically by section index so the data is stable across renders.
const PARALLEL_OWNER_POOL: Record<Exclude<ReportId, 'rnfm' | 'hrs'>, string[]> = {
  // ESG Index topics roughly follow Environment → People → Innovation → Quality → Governance.
  'esg-index': ['Sam Delgado', 'Casey Lindqvist', 'Riley Okafor', 'Alex Moreau', 'Jamie Kessler', 'Jordan Avery'],
  // UPC commitment areas: access/global-health, foundations, environment, people, ethics.
  upc: ['Riley Okafor', 'Jordan Avery', 'Sam Delgado', 'Casey Lindqvist', 'Jamie Kessler'],
  // Climate reports: environmental lead, finance/GHG, legal for governance rows.
  asrs: ['Sam Delgado', 'Morgan Reyes', 'Dr. Taylor Brenner'],
  'tcfd-uk': ['Sam Delgado', 'Morgan Reyes', 'Dr. Taylor Brenner'],
};

function ownerFor(reportId: Exclude<ReportId, 'rnfm' | 'hrs'>, index: number, category?: string): string {
  const pool = PARALLEL_OWNER_POOL[reportId];
  // ESG Index: assign by category so a whole category shares one accountable owner.
  if (reportId === 'esg-index' && category) {
    const byCat: Record<string, string> = {
      Environment: 'Sam Delgado', People: 'Casey Lindqvist', 'Innovation and access': 'Riley Okafor',
      'Quality and supply': 'Alex Moreau', Governance: 'Jamie Kessler',
    };
    return byCat[category] ?? pool[index % pool.length];
  }
  return pool[index % pool.length];
}

function parallelSections(reportId: ReportId): ScopedSection[] {
  const def = getReport(reportId);
  if (reportId === 'upc') {
    return upcSections.map((s, i) => ({
      ref: s.ref,
      title: s.title,
      topicL1: 'Update on Public Commitments',
      stage: PARALLEL_STAGE_CYCLE[i % PARALLEL_STAGE_CYCLE.length],
      owner: ownerFor('upc', i),
    }));
  }
  // Human Rights Statement (#15): uses its real sections from the RNFM data
  // (same content, just split into a separate report).
  if (reportId === 'hrs') {
    return hrsSections.map(s => ({
      ref: s.ref,
      title: s.title,
      topicL1: 'Human Rights Statement 2025',
      topicL2: s.topicL2,
      stage: s.stage,
      owner: s.roles.owners[0],
    }));
  }
  const rid = reportId as Exclude<ReportId, 'rnfm' | 'hrs'>;
  return def.structure.map((s, i) => ({
    ref: s.ref,
    title: s.title,
    topicL1: def.shortName,
    topicL2: s.detail,
    stage: PARALLEL_STAGE_CYCLE[i % PARALLEL_STAGE_CYCLE.length],
    // s.detail on esg-index carries the category (parent). Use it for owner mapping.
    owner: ownerFor(rid, i, reportId === 'esg-index' ? s.detail : undefined),
  }));
}

function stageCounts(sections: ScopedSection[]): WorkflowStageCounts {
  const c: WorkflowStageCounts = { draft: 0, sme_review: 0, legal_review: 0, approved: 0, exported: 0 };
  for (const s of sections) c[s.stage]++;
  return c;
}

// --- Per-report consistency checks (parallel reports) -----------------------
// Small, realistic cross-document checks scoped to each parallel report. Values
// are grounded in the same FY2025/FY2026 figures used elsewhere.
const parallelConsistency: Record<Exclude<ReportId, 'rnfm'>, ConsistencyCheck[]> = {
  'esg-index': [
    { id: 'ci-esg-1', category: 'Cross-report', description: 'Climate narrative vs RNFM Climate change', rnfmValue: 'net-zero by 2040 (SBTi)', annualReportValue: 'net-zero by 2040 (SBTi)', status: 'pass', severity: 'error', section: 'Climate', recommendation: 'ESG Index Climate content is consistent with the authoritative RNFM Climate change section.' },
    { id: 'ci-esg-2', category: 'Cross-report', description: 'Access Principles patients reached vs RNFM', rnfmValue: '304 million', annualReportValue: '304 million', status: 'pass', severity: 'error', section: 'Access Principles', recommendation: 'Consistent with RNFM Access to medicines.' },
    { id: 'ci-esg-3', category: 'Link integrity', description: 'ESG Data Summary 2025 pointer resolves', rnfmValue: 'present', annualReportValue: 'present', status: 'pass', severity: 'warning', section: 'Health and safety', recommendation: 'Metric-pointer link resolves to the published ESG Data Summary 2025.' },
    { id: 'ci-esg-4', category: 'Link integrity', description: '"Giving, Matching & Volunteering" link target missing', rnfmValue: 'url expected', annualReportValue: '—', status: 'review', severity: 'warning', section: 'Philanthropy and community investment', recommendation: 'This Relevant link has no URL yet — confirm the target page before publication.' },
  ],
  upc: [
    { id: 'ci-upc-1', category: 'Cross-report', description: 'Scope 1+2 GHG vs RNFM', rnfmValue: '202.1 ktCO2e', annualReportValue: '207.2 ktCO2e', status: 'fail', severity: 'error', section: 'Environmental sustainability', recommendation: 'UPC performance table shows 207.2 vs RNFM 202.1 ktCO2e — reconcile the rounding/scope before publication.' },
    { id: 'ci-upc-2', category: 'Cross-report', description: 'Code of Ethics training vs RNFM', rnfmValue: '98%', annualReportValue: '98%', status: 'pass', severity: 'error', section: 'Ethical business practices', recommendation: 'Consistent with RNFM Business conduct.' },
    { id: 'ci-upc-3', category: 'Data readiness', description: 'Global health patients (xx placeholder)', rnfmValue: 'pending', annualReportValue: 'xx', status: 'review', severity: 'warning', section: 'Global health', recommendation: 'Placeholder "xx" — final figure to be confirmed after assurance.' },
    { id: 'ci-upc-4', category: 'Cross-report', description: 'Patients reached vs RNFM', rnfmValue: '304 million', annualReportValue: '304 million', status: 'pass', severity: 'error', section: 'Innovation and access', recommendation: 'Consistent with RNFM Access to medicines.' },
  ],
  asrs: [
    { id: 'ci-asrs-1', category: 'ISSB map', description: 'B.1 Board oversight ← RNFM 7.1', rnfmValue: 'RNFM 7.1', annualReportValue: 'AASB S2 §5–6', status: 'pass', severity: 'error', section: 'B.1 Board oversight', recommendation: 'Governance content resolves to RNFM Corporate governance.' },
    { id: 'ci-asrs-2', category: 'ISSB map', description: 'E.1 Scope 1&2 GHG ← RNFM 8.1.13', rnfmValue: 'RNFM 8.1.13', annualReportValue: 'AASB S2 §29', status: 'pass', severity: 'error', section: 'E.1 Cross-industry metrics — Scope 1 & 2 GHG', recommendation: 'GHG table maps cleanly from the RNFM under the GHG Protocol.' },
    { id: 'ci-asrs-3', category: 'ISSB requirement', description: 'E.3 Scope 3 by category (ISSB only)', rnfmValue: 'RNFM 8.1.13', annualReportValue: 'pending categories', status: 'review', severity: 'warning', section: 'E.3 Scope 3 GHG emissions by category', recommendation: 'ISSB requires Scope 3 by category; first-year relief available. Confirm category breakdown before publication.' },
    { id: 'ci-asrs-4', category: 'ISSB requirement', description: 'C.6 Financial-statement connectivity (ISSB only)', rnfmValue: 'Annual Report', annualReportValue: 'pending', status: 'review', severity: 'warning', section: 'C.6 Connectivity with the financial statements', recommendation: 'ISSB/AASB require connectivity to financial statement line items — authored separately, not in the UK TCFD report.' },
  ],
  'tcfd-uk': [
    { id: 'ci-tcfd-1', category: 'Cross-report', description: 'C.1 Climate roadmap vs RNFM (net-zero 2040)', rnfmValue: 'net-zero by 2040 (SBTi)', annualReportValue: 'net-zero by 2040 (SBTi)', status: 'pass', severity: 'error', section: 'C.1 Climate strategy and roadmap', recommendation: 'Strategy content is consistent with RNFM Climate change and the Australian ISSB report (shared source).' },
    { id: 'ci-tcfd-2', category: 'Cross-report', description: 'E.1 Scope 1&2 GHG vs ISSB (AU) report', rnfmValue: 'RNFM 8.1.13', annualReportValue: 'matches ISSB (AU)', status: 'pass', severity: 'error', section: 'E.1 Cross-industry metrics — Scope 1 & 2 GHG', recommendation: 'Same climate content authored once and used in both local reports.' },
    { id: 'ci-tcfd-3', category: 'Scope', description: 'ISSB-only requirements correctly omitted', rnfmValue: '5 ISSB-only rows', annualReportValue: 'omitted', status: 'pass', severity: 'warning', section: 'E. Metrics and targets', recommendation: 'ISSB extras (skills, connectivity, Scope 3 by category, industry metrics, carbon credits) are correctly excluded from the UK TCFD structure.' },
  ],
  hrs: [
    { id: 'ci-hrs-1', category: 'Cross-report', description: 'Supplier audit count vs RNFM', rnfmValue: '191 remediation actions', annualReportValue: '191', status: 'pass', severity: 'error', section: 'Human rights due diligence', recommendation: 'Consistent with RNFM Working conditions 9.2.3.' },
    { id: 'ci-hrs-2', category: 'Jurisdictional', description: 'All 5 jurisdictions named in the reporting section', rnfmValue: '5', annualReportValue: '5', status: 'pass', severity: 'warning', section: 'Reporting under jurisdictional acts', recommendation: 'UK, Australia, Canada, Norway, Switzerland all present.' },
  ],
};

// --- Per-report audit trails (parallel reports) -----------------------------
const parallelAudit: Record<Exclude<ReportId, 'rnfm'>, AuditEvent[]> = {
  'esg-index': [
    { id: 'ae-esg-1', timestamp: '2026-06-02T09:10:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'create', details: 'Created ESG Index (5 categories, 37 topics) from the ESG website content + shared knowledge base' },
    { id: 'ae-esg-2', timestamp: '2026-06-02T09:40:00Z', user: 'System', role: 'AI Agent', action: 'generate', section: 'Environment', details: 'Topic narratives drafted with ESG Data Summary metric pointers and Relevant links' },
    { id: 'ae-esg-3', timestamp: '2026-06-05T14:20:00Z', user: 'Morgan Reyes', role: 'Finance / GHG', action: 'edit', section: 'Climate', details: 'Verified Climate narrative and net-zero-2040 target against RNFM Climate change' },
  ],
  upc: [
    { id: 'ae-upc-1', timestamp: '2026-06-10T08:30:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'create', details: 'Created UPC 2026 from SI&S public-commitment template' },
    { id: 'ae-upc-2', timestamp: '2026-06-10T09:05:00Z', user: 'System', role: 'AI Agent', action: 'generate', section: 'Environmental sustainability', details: 'Targets box + performance table + narrative drafted from RNFM methodology' },
    { id: 'ae-upc-3', timestamp: '2026-06-12T11:15:00Z', user: 'Riley Okafor', role: 'Global Health Lead', action: 'comment', section: 'Global health', details: 'Flagged xx placeholders pending assurance' },
  ],
  asrs: [
    { id: 'ae-asrs-1', timestamp: '2026-06-20T10:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'create', details: 'Created Australian ISSB report (AASB S1/S2, from FY2027) on the shared A–E TCFD structure' },
    { id: 'ae-asrs-2', timestamp: '2026-06-20T10:25:00Z', user: 'System', role: 'AI Agent', action: 'generate', section: 'E.1 Cross-industry metrics — Scope 1 & 2 GHG', details: 'Auto-mapped GHG metrics from RNFM 8.1.13; flagged ISSB-only requirements (Scope 3 by category, industry metrics, carbon credits)' },
  ],
  'tcfd-uk': [
    { id: 'ae-tcfd-1', timestamp: '2026-06-22T09:15:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'create', details: 'Created UK TCFD report from the same shared A–E climate content as the Australian ISSB report; ISSB-only requirements omitted' },
    { id: 'ae-tcfd-2', timestamp: '2026-06-22T09:35:00Z', user: 'System', role: 'AI Agent', action: 'generate', section: 'C.1 Climate strategy and roadmap', details: 'Strategy narrative mapped from RNFM 8.1 Climate change (shared with ISSB (AU))' },
  ],
  hrs: [
    { id: 'ae-hrs-1', timestamp: '2026-06-01T09:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'create', details: 'Created Human Rights Statement 2025 as a separate report (2026-only; will integrate into RNFM from FY2027)' },
    { id: 'ae-hrs-2', timestamp: '2026-06-01T09:20:00Z', user: 'System', role: 'AI Agent', action: 'generate', details: 'Generated 7 subsections from prior-year Human Rights Statement via roll-forward' },
    { id: 'ae-hrs-3', timestamp: '2026-06-05T14:40:00Z', user: 'Alex Moreau', role: 'Procurement Lead', action: 'edit', section: 'Human rights due diligence', details: 'Updated supplier audit figures with FY2025 actuals' },
  ],
};

function complianceSummary(reportId: ReportId): ReportComplianceSummary {
  const def = getReport(reportId);
  if (reportId === 'rnfm') {
    return { ...complianceStats, frameworks: def.frameworks };
  }
  // Parallel reports: derive a small realistic split from their mapping arrays.
  if (reportId === 'asrs') {
    // Mapped = covered; transition-relief = partial (voluntary/limited); local
    // modification = still to author = missing.
    const total = asrsMappings.length;
    const covered = asrsMappings.filter(m => m.status === 'mapped').length;
    const partial = asrsMappings.filter(m => m.status === 'relief_applied').length;
    const missing = asrsMappings.filter(m => m.status === 'local_modification').length;
    return { covered, partial, missing, total, coveragePercent: total ? Math.round((covered / total) * 100) : 0, frameworks: def.frameworks };
  }
  // ESG Index / UPC: base the split on their scoped section count.
  const total = def.subsectionCount;
  const covered = Math.round(total * 0.6);
  const partial = Math.round(total * 0.25);
  const missing = Math.max(0, total - covered - partial);
  return { covered, partial, missing, total, coveragePercent: total ? Math.round((covered / total) * 100) : 0, frameworks: def.frameworks };
}

export function getReportDataset(reportId: ReportId): ReportDataset {
  if (reportId === 'rnfm') {
    const sections = rnfmSections();
    return {
      reportId,
      sections,
      workflow: { total: workflowStats.totalSections, byStage: workflowStats.byStage as WorkflowStageCounts, overdue: workflowStats.overdue },
      compliance: complianceSummary('rnfm'),
      consistency: consistencyChecks,
      audit: auditEvents,
      isPrimary: true,
    };
  }
  const sections = parallelSections(reportId);
  return {
    reportId,
    sections,
    workflow: { total: sections.length, byStage: stageCounts(sections), overdue: sections.filter(s => s.stage === 'draft').length },
    compliance: complianceSummary(reportId),
    consistency: parallelConsistency[reportId],
    audit: parallelAudit[reportId],
    isPrimary: false,
  };
}

// Re-export for views that only need the RNFM assignment rows (unchanged behavior).
export type { SectionAssignment };
export { sectionAssignments };
