import { allRequirements } from './esrsRequirements';
import { reportSections } from './reportSections';

export type CoverageStatus = 'covered' | 'partial' | 'missing';

// E — a single DR can be addressed across MULTIPLE report sections.
export interface SectionRef {
  sectionId: string;
  ref: string;
  sectionTitle: string;
  topicL1: string;
  topicL2?: string;
}

export interface ComplianceMapping {
  drId: string;
  framework: string;
  standard: string; // e.g. "E1", "S1", "IFRS S2" — used to group BY STANDARD
  title: string;
  // Bi-directional: the sections that address this DR (may be many)
  sections: SectionRef[];
  // Backward-compat single-section fields (primary section)
  sectionId: string;
  sectionTitle: string;
  status: CoverageStatus;
  confidence: number;
  evidenceExcerpt: string;
  // Why is this DR partial / missing, and what the scan found or didn't. Only
  // populated for partial + missing DRs (covered DRs need no gap rationale).
  rationale?: string;
  // For missing DRs: whether adding this disclosure is beneficial/expected, and
  // why (materiality, mandatory status, phase-in). Drives the "should we add
  // this?" guidance the user asked for on missing rows.
  additionBenefit?: string;
  suggestedFill?: string;
  lastScanned: string;
}

// --- Coverage truth (unchanged classification from prior analysis) ---------
const coveredDRs = new Set([
  'ESRS2-GOV1', 'ESRS2-GOV2', 'ESRS2-GOV3', 'ESRS2-GOV5', 'ESRS2-SBM1', 'ESRS2-SBM2', 'ESRS2-IRO1', 'ESRS2-IRO2',
  'ESRS-E1-1', 'ESRS-E1-2', 'ESRS-E1-3', 'ESRS-E1-4', 'ESRS-E1-5', 'ESRS-E1-6', 'ESRS-E1-7', 'ESRS-E1-8', 'ESRS-E1-9',
  'ESRS-E2-1',
  'ESRS-S1-1', 'ESRS-S1-14',
  'ESRS-S2-1', 'ESRS-S2-2', 'ESRS-S2-3', 'ESRS-S2-4',
  'ESRS-S4-1',
  'ESRS-G1-1', 'ESRS-G1-3', 'ESRS-G1-4', 'ESRS-G1-5',
  'TCFD-GOV-a', 'TCFD-GOV-b', 'TCFD-STR-a', 'TCFD-STR-b', 'TCFD-STR-c', 'TCFD-RISK-a', 'TCFD-RISK-b', 'TCFD-RISK-c', 'TCFD-MET-a', 'TCFD-MET-b', 'TCFD-MET-c',
  'GRI-302-1', 'GRI-302-3', 'GRI-303-3', 'GRI-305-1', 'GRI-305-2', 'GRI-305-3', 'GRI-403-9',
  'ISSB-S1-1', 'ISSB-S1-3', 'ISSB-S1-4', 'ISSB-S1-5', 'ISSB-S1-6', 'ISSB-S1-7',
  'ISSB-S1-26', 'ISSB-S1-27', 'ISSB-S1-28', 'ISSB-S1-30', 'ISSB-S1-12',
  'ISSB-S1-25', 'ISSB-S1-36', 'ISSB-S1-37', 'ISSB-S1-38',
  'ISSB-S1-B45', 'ISSB-S1-B50', 'ISSB-S1-B52', 'ISSB-S1-B58',
  'ISSB-S2-5', 'ISSB-S2-6', 'ISSB-S2-8', 'ISSB-S2-9', 'ISSB-S2-10',
  'ISSB-S2-14', 'ISSB-S2-22', 'ISSB-S2-23', 'ISSB-S2-24',
  'ISSB-S2-29', 'ISSB-S2-30', 'ISSB-S2-31', 'ISSB-S2-32',
  'ISSB-S2-33', 'ISSB-S2-34', 'ISSB-S2-35', 'ISSB-S2-36', 'ISSB-S2-40',
  'ISSB-S2-B61', 'ISSB-S2-B62', 'ISSB-S2-B63',
  'ISSB-S2-C2', 'ISSB-S2-C4',
  // F — Human rights statement (§12) covers the core structure/policy/DD criteria
  'MSA-UK-1', 'MSA-UK-2', 'MSA-UK-3', 'MSA-CA-1', 'MSA-CA-2', 'MSA-AU-1', 'MSA-AU-2', 'MSA-AU-4', 'NTA-1',
]);

const partialDRs = new Set([
  'ESRS2-GOV4', 'ESRS2-SBM3',
  'ESRS-E2-2', 'ESRS-E2-4',
  'ESRS-E3-1', 'ESRS-E3-4',
  'ESRS-S1-3', 'ESRS-S1-6', 'ESRS-S1-9', 'ESRS-S1-13',
  'ESRS-S2-5',
  'ESRS-S3-1', 'ESRS-S3-4', 'ESRS-S3-5',
  'ESRS-S4-2', 'ESRS-S4-3', 'ESRS-S4-4',
  'ESRS-G1-2',
  'GRI-306-3', 'GRI-404-1', 'GRI-405-1', 'GRI-405-2',
  'ISSB-S1-2', 'ISSB-S1-29', 'ISSB-S1-32', 'ISSB-S1-34',
  'ISSB-S1-40', 'ISSB-S1-41', 'ISSB-S1-77', 'ISSB-S1-82',
  'ISSB-S2-15', 'ISSB-S2-16', 'ISSB-S2-25', 'ISSB-S2-37',
  'ISSB-S2-C3',
  // F — Human rights statement is still in draft: risk/effectiveness/remediation
  // criteria partially addressed pending final content.
  'MSA-UK-4', 'MSA-CA-3', 'MSA-AU-3', 'MSA-AU-5', 'NTA-2', 'NTA-3',
]);

function getRealisticStatus(drId: string): CoverageStatus {
  if (coveredDRs.has(drId)) return 'covered';
  if (partialDRs.has(drId)) return 'partial';
  return 'missing';
}

function confidence(status: CoverageStatus, seed: number): number {
  const base = status === 'covered' ? 0.85 : status === 'partial' ? 0.55 : 0.15;
  const jitter = ((seed * 7919) % 100) / 1000;
  return Math.round((base + jitter) * 100) / 100;
}

// --- Bi-directional index -------------------------------------------------
// Primary source of truth: invert each subsection's drsCovered so a DR points
// at EVERY section that addresses it (E: one datapoint, many sections).
const drToSections = new Map<string, SectionRef[]>();
for (const sec of reportSections) {
  for (const drId of sec.drsCovered) {
    const list = drToSections.get(drId) ?? [];
    list.push({ sectionId: sec.id, ref: sec.ref, sectionTitle: sec.title, topicL1: sec.topicL1, topicL2: sec.topicL2 });
    drToSections.set(drId, list);
  }
}

// Fallback topic → L2 keyword so DRs with no explicit coverage still tag a
// plausible home section (keeps the "missing/partial" rows navigable).
const topicToL2Keyword: Record<string, string> = {
  'Climate Change': 'Climate change', 'E1': 'Climate change',
  'Pollution': 'Pollution of water', 'E2': 'Pollution of water',
  'Water & Marine Resources': 'Pollution of water', 'E3': 'Pollution of water',
  'Biodiversity & Ecosystems': 'Materiality assessment', 'E4': 'Materiality assessment',
  'Circular Economy': 'Materiality assessment', 'E5': 'Materiality assessment',
  'Own Workforce': 'Health & safety workforce', 'S1': 'Health & safety workforce',
  'Workers in Value Chain': 'Working conditions value chain', 'S2': 'Working conditions value chain',
  'Affected Communities': 'Access to medicines', 'S3': 'Access to medicines',
  'Consumers & End-Users': 'Patient health & safety', 'S4': 'Patient health & safety',
  'Business Conduct': 'Business conduct', 'G1': 'Business conduct',
  'Governance': 'Corporate governance', 'Strategy': 'Strategy', 'Materiality': 'Materiality assessment',
  'ESRS 2': 'Corporate governance',
  'Energy': 'Climate change', 'Emissions': 'Climate change', 'Water': 'Pollution of water', 'Waste': 'Pollution of water',
  'OHS': 'Health & safety workforce', 'Training': 'Health & safety workforce', 'Diversity': 'Health & safety workforce',
  'GRI': 'GRI Index', 'TCFD': 'TCFD Index', 'ISSB': 'Climate change', 'General': 'Basis of preparation',
  'Climate Governance': 'Corporate governance', 'Climate Risk': 'Climate change', 'Metrics & Targets': 'Climate change',
  'Climate Strategy': 'Climate change', 'Climate Scenario': 'Climate change', 'Climate Metrics': 'Climate change',
  'Climate Targets': 'Climate change', 'Climate Financial': 'Climate change', 'Risk Management': 'TCFD Index',
};

function fallbackSection(topic: string, framework: string): SectionRef | null {
  const keyword = topicToL2Keyword[topic] || topicToL2Keyword[framework];
  if (!keyword) return null;
  const sec = reportSections.find(s => (s.topicL2 || s.topicL1) === keyword) || reportSections.find(s => s.title === keyword);
  if (!sec) return null;
  return { sectionId: sec.id, ref: sec.ref, sectionTitle: sec.title, topicL1: sec.topicL1, topicL2: sec.topicL2 };
}

const evidenceExcerpts: Record<CoverageStatus, string[]> = {
  covered: [
    'Novartis reports total Scope 1, 2, and 3 GHG emissions with year-over-year comparison and methodology notes.',
    'The section addresses all required data points including quantitative targets, baseline year, and progress metrics.',
    'Full disclosure provided with supporting evidence from internal audit and third-party verification.',
    'Comprehensive narrative covers policy commitments, implementation actions, and measurable outcomes.',
    'All mandatory data points addressed with cross-references to supporting documentation.',
  ],
  partial: [
    'Total emissions figure disclosed but breakdown by category (Scope 3 categories 1-15) not fully itemized.',
    'Policy commitment described but quantitative targets and timelines not yet specified.',
    'High-level description provided but specific metrics and KPIs are missing for some sub-requirements.',
    'Governance structure described but frequency of board oversight and specific agenda items not detailed.',
    'Risk identification process mentioned but financial quantification of climate-related risks absent.',
  ],
  missing: [
    'No disclosure found for this requirement in the current draft. Section does not address this topic.',
    'This disclosure requirement has not been addressed in any section of the current report draft.',
    'No relevant content identified. Recommend adding dedicated subsection with required data points.',
    'Requirement not yet covered. Knowledge base contains relevant source material for draft generation.',
    'No matching content. This is a new ESRS requirement not covered in prior year reports.',
  ],
};

const suggestedFills: string[] = [
  'Based on the 2024 Environmental Policy (p.12-14), Novartis has established a biodiversity action plan covering all manufacturing sites within 10km of protected areas. Consider adding: "In 2025, Novartis identified [X] priority sites..."',
  'The prior year RNFM (2024, Section 4.2) disclosed Scope 3 Category 11 emissions. Update with current year figures: "Total Scope 3 emissions for FY2025 were [X] tCO2e, with Category 11 (Use of Sold Products) representing [Y]%..."',
  'Per the Human Rights Due Diligence Report (2025, p.8), Novartis conducted salient issue assessments across [X] high-risk supplier locations. Draft: "Our human rights due diligence process identified..."',
  'Water stress assessment data available from CDP Water Security Response (2025). Suggest: "Novartis operations in water-stressed regions account for [X]% of total water withdrawal..."',
  'Anti-corruption training records (Compliance Dashboard Q4 2025) show [X]% completion rate. Draft: "During the reporting period, [X]% of employees completed mandatory anti-corruption training..."',
  'The Circular Economy Strategy (2024) sets a 50% packaging recyclability target by 2030. Draft: "Novartis has committed to ensuring [X]% of product packaging is recyclable by [year]..."',
  'Supply chain audit results (Responsible Sourcing Report 2025, p.22) document working conditions assessments. Draft: "In 2025, [X] supplier audits were conducted covering [Y]% of tier-1 suppliers..."',
];

// --- Gap rationale ----------------------------------------------------------
// The classifier records WHY a DR is partial or missing, not just the status.
// These read like the Compliance Gap Analysis agent's classification note: for
// PARTIAL, which data points are present vs. still needed; for MISSING, why no
// content was found and whether adding it is expected (materiality / mandatory /
// phase-in). Deterministic per DR so the demo is stable.

// Data points that are typically still outstanding, keyed by standard family.
const partialGapByStandard: Record<string, string> = {
  E2: 'the pollutant-by-pollutant emission quantities and the split between air, water and soil releases',
  E3: 'the water-consumption intensity ratio and the withdrawal/discharge breakdown for water-stressed sites',
  S1: 'the full diversity and pay-gap breakdown by gender and the coverage of collective-bargaining agreements',
  S2: 'the quantitative value-chain worker metrics and the outcome data for remediation channels',
  S3: 'the affected-community impact metrics and the effectiveness review of the engagement process',
  S4: 'the consumer/end-user incident metrics and the severity/remediation outcomes',
  G1: 'the payment-practices metrics and the average actual payment period to suppliers',
};

function partialRationale(m: { standard: string; framework: string; title: string }): string {
  const family = m.standard.replace(/^(ESRS|IFRS)\s*/i, '').toUpperCase();
  const outstanding = partialGapByStandard[family]
    ?? 'some quantitative data points and the year-on-year methodology note';
  return `The narrative addresses this requirement qualitatively, but the scan did not find ${outstanding}. It is classified partial because the required data points are only partly present — the policy/approach is disclosed but the full quantitative set is not yet complete.`;
}

function missingRationale(m: { standard: string; framework: string; title: string }): string {
  return `The scan found no content addressing this requirement in the current draft — no section narrative maps to "${m.title}". This is a genuine gap rather than a mapping miss: none of the ${m.framework} sections reference the required data points.`;
}

// Whether a missing DR is expected/beneficial to add. Mandatory requirements are
// flagged as high-priority additions; the rest as materiality-dependent.
function missingBenefit(m: { standard: string; framework: string; mandatory?: boolean }): string {
  if (m.mandatory) {
    return `Beneficial and expected: this is a mandatory ${m.framework} ${m.standard} disclosure. Leaving it unaddressed risks blocking sign-off — recommend drafting it from the knowledge base and confirming the figures with the section owner.`;
  }
  return `Conditionally beneficial: whether this must be disclosed depends on the double-materiality assessment for ${m.framework} ${m.standard}. If the topic is material, add it; if assessed non-material, record a documented "not material" justification instead of leaving it blank.`;
}

const noSection: SectionRef = { sectionId: 'sub-6-1', ref: '6.1', sectionTitle: 'Introduction & Basis for selecting content', topicL1: 'Basis of preparation' };

export const complianceMappings: ComplianceMapping[] = allRequirements.map((req, idx) => {
  const status = getRealisticStatus(req.id);
  const conf = confidence(status, idx);
  const excerptIdx = idx % evidenceExcerpts[status].length;

  // Bi-directional: real sections that cover this DR, else a fallback home.
  let sections = drToSections.get(req.id) ?? [];
  if (sections.length === 0) {
    const fb = fallbackSection(req.topic || req.framework, req.framework);
    sections = fb ? [fb] : [noSection];
  }

  return {
    drId: req.id,
    framework: req.framework,
    standard: req.standard,
    title: req.title,
    sections,
    sectionId: sections[0].sectionId,
    sectionTitle: sections[0].sectionTitle,
    status,
    confidence: conf,
    evidenceExcerpt: evidenceExcerpts[status][excerptIdx],
    rationale: status === 'partial' ? partialRationale(req)
      : status === 'missing' ? missingRationale(req)
      : undefined,
    additionBenefit: status === 'missing' ? missingBenefit(req) : undefined,
    suggestedFill: status !== 'covered' ? suggestedFills[idx % suggestedFills.length] : undefined,
    lastScanned: '2026-06-15T14:32:00Z',
  };
});

// E — forward index: for a given report section, which DRs does it satisfy?
export function drsForSection(sectionId: string): ComplianceMapping[] {
  return complianceMappings.filter(m => m.sections.some(s => s.sectionId === sectionId));
}

// E — reverse index: for a given DR, which sections address it?
export function sectionsForDr(drId: string): SectionRef[] {
  return complianceMappings.find(m => m.drId === drId)?.sections ?? [];
}

// Coverage status for a DR id (used by the editor's datapoint chips).
const byId = new Map(complianceMappings.map(m => [m.drId, m]));
export function coverageForDr(drId: string): ComplianceMapping | undefined {
  return byId.get(drId);
}

// Group compliance mappings BY STANDARD for the standard-first compliance view.
export interface StandardGroup {
  framework: string;
  standard: string;
  label: string;
  mappings: ComplianceMapping[];
  covered: number;
  partial: number;
  missing: number;
}

export const standardGroups: StandardGroup[] = (() => {
  const byKey = new Map<string, ComplianceMapping[]>();
  for (const m of complianceMappings) {
    const key = `${m.framework}||${m.standard}`;
    const list = byKey.get(key) ?? [];
    list.push(m);
    byKey.set(key, list);
  }
  return Array.from(byKey.entries()).map(([key, mappings]) => {
    const [framework, standard] = key.split('||');
    return {
      framework,
      standard,
      label: framework === standard ? framework : `${framework} · ${standard}`,
      mappings,
      covered: mappings.filter(m => m.status === 'covered').length,
      partial: mappings.filter(m => m.status === 'partial').length,
      missing: mappings.filter(m => m.status === 'missing').length,
    };
  });
})();

export const complianceStats = {
  covered: complianceMappings.filter(m => m.status === 'covered').length,
  partial: complianceMappings.filter(m => m.status === 'partial').length,
  missing: complianceMappings.filter(m => m.status === 'missing').length,
  total: complianceMappings.length,
  coveragePercent: Math.round(complianceMappings.filter(m => m.status === 'covered').length / complianceMappings.length * 100),
  lastScanDate: '2026-06-15T14:32:00Z',
};
