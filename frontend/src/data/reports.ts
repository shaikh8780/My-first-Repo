// G — Parallel report outputs.
// The platform supports developing multiple reports in parallel. They share the
// same knowledge base (policies, standards, data) and can cross-reference each
// other, but each has its own section structure, workflow and compliance mapping.
import { reportSections, reportMetadata } from './reportSections';
import { esgIndexTopicsFlat, esgIndexTopicCount } from './esgIndex';
import { localStructureFlat, tcfdUkSubsectionCount, issbAuSubsectionCount } from './localReports';

export type ReportId = 'rnfm' | 'esg-index' | 'upc' | 'asrs' | 'tcfd-uk' | 'hrs';
export type ReportStatus = 'active' | 'new' | 'future' | 'legacy';

export interface ParallelSection {
  ref: string;
  title: string;
  detail?: string;
}

export interface ReportDefinition {
  id: ReportId;
  name: string;
  shortName: string;
  status: ReportStatus;
  statusLabel: string;
  description: string;
  characteristics: string;
  frameworks: string[];
  // High-level structure. RNFM is the live 93-subsection report; the others
  // are parallel outputs scaffolded here (full UPC template is deferred item H).
  structure: ParallelSection[];
  // Cross-references: sections in THIS report sourced from the RNFM.
  crossReferences: { from: string; toReportSection: string }[];
  subsectionCount: number;
}

const rnfmStructure: ParallelSection[] = (() => {
  // Collapse the RNFM subsections to their L1/L2 topics for the switcher summary.
  const seen = new Set<string>();
  const out: ParallelSection[] = [];
  for (const s of reportSections) {
    const key = `${s.topicL1}|${s.topicL2 ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ref: s.ref, title: s.topicL2 ? `${s.topicL1} › ${s.topicL2}` : s.topicL1 });
  }
  return out;
})();

export const reports: ReportDefinition[] = [
  {
    id: 'rnfm',
    name: 'Report on Nonfinancial Matters (RNFM)',
    shortName: 'RNFM',
    status: 'active',
    statusLabel: 'Active — current primary',
    description: 'Regulatory report under Swiss CO Art. 964a, GRI-referenced and TCFD-aligned; ESRS-compliant from FY2027.',
    characteristics: `${reportMetadata.totalSubsections} subsections · 51+ pages · ESRS-ready`,
    frameworks: ['Swiss CO Art. 964a', 'GRI', 'TCFD', 'ESRS (2027)', 'ISSB'],
    structure: rnfmStructure,
    crossReferences: [],
    subsectionCount: reportMetadata.totalSubsections,
  },
  {
    id: 'esg-index',
    name: 'Novartis ESG Index',
    shortName: 'ESG Index',
    status: 'new',
    statusLabel: 'New requirement',
    description: 'The Novartis ESG Index — the collection of ESG website content maintained going forward in the Disclosure Studio. Shows where disclosures on key topics can be found across our publications and website; each topic carries a narrative, a pointer to the ESG Data Summary for the underlying metrics, and relevant links.',
    characteristics: `5 categories · ${esgIndexTopicCount} topics · content + links · metrics via ESG Data Summary`,
    frameworks: ['ESRS', 'GRI', 'ISSB', 'SASB'],
    structure: esgIndexTopicsFlat,
    crossReferences: [
      { from: 'Climate', toReportSection: '8.1 Climate change' },
      { from: 'Health and safety', toReportSection: '9.1 Health & safety workforce' },
      { from: 'Business ethics', toReportSection: '10.1 Business conduct' },
    ],
    subsectionCount: esgIndexTopicCount,
  },
  {
    id: 'upc',
    name: 'Update on Public Commitments (UPC) 2026',
    shortName: 'UPC',
    status: 'new',
    statusLabel: 'New requirement',
    description: 'Progress report on Social Impact & Sustainability (SI&S) public commitments. Each section has a Targets box, a performance metrics table and a ~150–200 word narrative. References the RNFM for methodology (not standalone).',
    characteristics: 'Targets + performance tables + narrative · references RNFM for methodology',
    frameworks: ['SI&S commitments', 'ISSB (limited assurance ∆)'],
    structure: [
      { ref: '0', title: 'About this document', detail: 'Intro, scope, assurance reference' },
      { ref: '1', title: 'Innovation and access', detail: 'Targets box · performance table · narrative' },
      { ref: '2', title: 'Global health', detail: 'Targets box · performance table · narrative' },
      { ref: '3', title: 'Foundations and giving', detail: 'Targets box · performance table · narrative' },
      { ref: '4', title: 'Environmental sustainability', detail: 'GHG S1/2/3, waste, water quality' },
      { ref: '5', title: 'People', detail: 'Female leadership, living wage, employee health' },
      { ref: '6', title: 'Ethical business practices', detail: 'Anti-bribery, speak up' },
    ],
    crossReferences: [
      { from: 'Environmental sustainability', toReportSection: '8.1 Climate change (methodology)' },
      { from: 'People', toReportSection: '9.1 Health & safety workforce' },
      { from: 'Ethical business practices', toReportSection: '10.1 Business conduct' },
    ],
    subsectionCount: 7,
  },
  {
    id: 'asrs',
    name: 'Australian ISSB Report (ASRS / AASB S1–S2)',
    shortName: 'ISSB (AU)',
    status: 'future',
    statusLabel: 'Future — new requirement from 2027',
    description: 'Australian Sustainability Reporting Standards report (AASB S1/S2), based on ISSB. Follows the same A–E TCFD logical structure as the UK TCFD report but with the additional ISSB/AASB requirements (governance skills, financial-statement connectivity, Scope 3 by category, industry metrics, carbon credits). Global climate content is authored once in the RNFM and mapped into the local requirements.',
    characteristics: 'A–E TCFD structure + ISSB extras · maps global content → AASB · from FY2027',
    frameworks: ['AASB S1', 'AASB S2', 'ISSB IFRS S1/S2', 'TCFD (basis)'],
    structure: localStructureFlat(true),
    crossReferences: [
      { from: 'C. Strategy', toReportSection: '8.1 Climate change' },
      { from: 'E. Metrics and targets', toReportSection: '8.1.13 Table: Climate Metrics' },
    ],
    subsectionCount: issbAuSubsectionCount,
  },
  {
    id: 'tcfd-uk',
    name: 'UK TCFD Report',
    shortName: 'TCFD (UK)',
    status: 'future',
    statusLabel: 'Future — UK climate disclosure',
    description: 'UK climate-related financial disclosure following the Novartis 2023 TCFD structure (A. Introduction, B. Governance, C. Strategy, D. Risk management, E. Metrics and targets). Built from the same shared climate content as the Australian ISSB report; ISSB-only requirements are omitted.',
    characteristics: 'A–E TCFD structure · same climate content as ISSB (AU), ISSB extras omitted',
    frameworks: ['TCFD', 'UK climate disclosure'],
    structure: localStructureFlat(false),
    crossReferences: [
      { from: 'C. Strategy', toReportSection: '8.1 Climate change' },
      { from: 'E. Metrics and targets', toReportSection: '8.1.13 Table: Climate Metrics' },
    ],
    subsectionCount: tcfdUkSubsectionCount,
  },
  {
    id: 'hrs',
    name: 'Human Rights Statement 2025',
    shortName: 'HR Statement',
    status: 'legacy',
    statusLabel: '2026 only — not required from FY2027',
    description: 'Separate Human Rights Statement covering modern slavery, decent work, forced labor and child labor under the UK Modern Slavery Act, Australian Modern Slavery Act, Canadian Supply Chain Act, Norwegian Transparency Act and Swiss Due Diligence Ordinance. Kept as a standalone report for 2026; from 2027 these disclosures integrate into the ESRS-compliant RNFM.',
    characteristics: '7 subsections · jurisdictional Modern Slavery / Transparency Acts',
    frameworks: ['UK MSA 2015', 'Australian MSA 2018', 'Canadian Act 2023', 'Norwegian Transparency Act', 'Swiss Due Diligence Ordinance'],
    structure: [
      { ref: '14.1', title: 'Our commitment', detail: 'Human Rights Commitment Statement, Third Party Code, UNGC' },
      { ref: '14.2', title: 'Governance of human rights', detail: 'Executive accountability, CLCO oversight, ESG Committee' },
      { ref: '14.3', title: 'Salient human rights issues', detail: 'Annual risk-saliency assessment, priority areas' },
      { ref: '14.4', title: 'Human rights due diligence', detail: 'EPRM, labour-rights questionnaire, risk ratings' },
      { ref: '14.5', title: 'Child labour', detail: 'Third Party Code prohibition, risk assessments, findings' },
      { ref: '14.6', title: 'Forced labour and modern slavery', detail: 'TPC, enhanced due diligence, attestation' },
      { ref: '14.7', title: 'Reporting under jurisdictional acts', detail: 'UK, Australia, Canada, Norway, Switzerland' },
    ],
    crossReferences: [
      { from: 'Human rights due diligence', toReportSection: '7.6.2 Due diligence — Human rights' },
      { from: 'Salient human rights issues', toReportSection: '7.5.5 Materiality — Human rights saliency' },
    ],
    subsectionCount: 7,
  },
];

export function getReport(id: ReportId): ReportDefinition {
  return reports.find(r => r.id === id) ?? reports[0];
}
