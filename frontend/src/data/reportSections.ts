// ---------------------------------------------------------------------------
// RNFM report structure — granular 93-subsection breakdown
// (Post-demo tuning A/B/C/L: RNFM Section Breakdown_Assignee Structure.xlsx)
// Refs and L1/L2/L3 labels mirror that blueprint 1:1. The blueprint's single
// Human Rights row (14.0) is expanded to 14.1–14.7 so each jurisdictional
// statement keeps its own Modern Slavery / Transparency Act datapoint coverage.
//
// Each subsection is INDEPENDENTLY ADDRESSABLE: it carries its own workflow
// stage, its own 4-role assignment (Input Provider / Informed / Owner sign-off
// / Legal sign-off) and its own year-on-year roll-forward status. The report is
// a flat list of subsections ordered by their 3-level reference number; L1/L2/L3
// give the hierarchy and `contentFormat` tags how the subsection is rendered.
// ---------------------------------------------------------------------------

import { priorYearContent } from './priorYearContent';
import type { AiProvenanceEntry } from './aiProvenance';

export type WorkflowStage = 'draft' | 'sme_review' | 'legal_review' | 'approved' | 'exported';

// A — content format tag for each subsection
export type ContentFormat = 'Text' | 'Table' | 'Infographic' | 'Image' | 'Mixed' | 'None';

// C/L — year-on-year roll-forward state per subsection
export type RollForwardStatus = 'updated' | 'needs_update' | 'confirmed_unchanged' | 'new';

export interface Citation {
  id: string;
  documentName: string;
  excerpt: string;
  pageRef: string;
  documentType: string;
}

// Role model (Adrian 2026-08-31 feedback):
//   - Each subsection can have MULTIPLE Input Providers. They draft/edit in
//     track changes and comment. They NO LONGER sign off at L3 — an IP edit
//     simply marks the subsection "edited"; the Editor moves it to "updated"
//     once all comments are addressed.
//   - One or more Owners are accountable for content and sign off at L2. A
//     section is fully approved once every NON-legal owner has signed. Legal/
//     Compliance owners are flagged in `legalOwners`; among the legal owners a
//     SINGLE sign-off is sufficient (they are interchangeable for assurance).
export interface SubsectionRoles {
  inputProviders: string[]; // responsible for drafting; edit + comment (>= 1)
  owners: string[];         // accountable for content + sign off at L2 (>= 1)
  legalOwners: string[];    // subset of `owners` that are Legal/Compliance (one sign-off suffices)
}

// Back-compat accessor: much of the UI shows a single "Input Provider" name.
// The first assigned input provider is the primary/display one.
export function primaryInputProvider(roles: SubsectionRoles): string {
  return roles.inputProviders[0] ?? 'Unassigned';
}

// Coerce ANY persisted roles object (old or new shape) to the current
// SubsectionRoles. Defensive against data written before 2026-08-31 — e.g. the
// REST backend or an older cache may still carry `inputProvider: string` and no
// `legalOwners`. Without this, the UI's `.inputProviders.join()` /
// `.legalOwners.includes()` calls crash the whole view on first render. New-shape
// data passes through unchanged. Also tolerates a completely missing `roles`.
export function normalizeSectionRoles(roles: unknown): SubsectionRoles {
  const r = (roles ?? {}) as Record<string, unknown>;
  const inputProviders = Array.isArray(r.inputProviders)
    ? (r.inputProviders as string[])
    : typeof r.inputProvider === 'string'
      ? [r.inputProvider as string]
      : [];
  const owners = Array.isArray(r.owners) ? (r.owners as string[]) : [];
  const legalOwners = Array.isArray(r.legalOwners)
    ? (r.legalOwners as string[]).filter(o => owners.includes(o))
    : [];
  return { inputProviders, owners, legalOwners };
}

// Normalize a whole section's roles in place-safe (returns a shallow copy). Used
// by the data adapters so every ReportSection reaching React has the new shape.
export function normalizeSection<T extends { roles?: unknown }>(section: T): T {
  return { ...section, roles: normalizeSectionRoles((section as { roles?: unknown }).roles) };
}

export function normalizeSections(sections: ReportSection[]): ReportSection[] {
  return sections.map(s => normalizeSection(s));
}

// Whether a given owner is a Legal/Compliance owner (single-sign-off group).
export function isLegalOwner(roles: SubsectionRoles, ownerName: string): boolean {
  return roles.legalOwners.includes(ownerName);
}

// The owners whose sign-off is REQUIRED for full approval (Adrian 2026-08-31):
// every non-legal owner individually. Legal owners are handled separately (one
// legal sign-off among them suffices), so they are excluded here.
export function requiredOwners(roles: SubsectionRoles): string[] {
  return roles.owners.filter(o => !roles.legalOwners.includes(o));
}

// Whether L2 sign-off is complete, given a predicate telling us if an owner has
// signed. Rule: every non-legal owner must sign, AND — if any legal owner is
// assigned — at least one legal owner must sign (a single legal sign-off is
// sufficient across all legal owners). A section with no owners is never approved.
export function allRequiredOwnersSigned(
  roles: SubsectionRoles,
  hasSigned: (ownerName: string) => boolean,
): boolean {
  if (roles.owners.length === 0) return false;
  const nonLegal = requiredOwners(roles);
  const everyNonLegalSigned = nonLegal.every(hasSigned);
  const legalSatisfied = roles.legalOwners.length === 0 || roles.legalOwners.some(hasSigned);
  return everyNonLegalSigned && legalSatisfied;
}

export interface ReportSection {
  id: string;
  number: string;          // = ref, e.g. "8.1.1" (kept for backward-compat)
  ref: string;             // 3-level reference number
  title: string;           // most specific of L3 / L2 / L1
  topicL1: string;
  topicL2?: string;
  topicL3?: string;
  contentFormat: ContentFormat;
  parentId?: string;
  stage: WorkflowStage;
  assignee: string;        // = primary input provider (kept for backward-compat)
  roles: SubsectionRoles;
  wordCount: number;
  citations: Citation[];
  content: string;
  lastModified: string;
  drsCovered: string[];
  // C/L — roll-forward
  rollForwardStatus: RollForwardStatus;
  priorYearContent?: string; // prior-year approved baseline text
  rollForwardNote?: string;  // what the AI flagged for this subsection YoY
}

// --- People pools (reuse the existing demo personas) ----------------------
const P = {
  eva: 'Jordan Avery',            // ESG Reporting Lead
  lukas: 'Sam Delgado',      // Environmental Manager
  sophie: 'Robin Faust',     // EHS Specialist
  anika: 'Casey Lindqvist',      // HR Analytics Lead
  marco: 'Alex Moreau',        // Procurement Lead
  priya: 'Riley Okafor',       // Global Health Lead
  thomas: 'Morgan Reyes',      // Finance / GHG accounting
  nadia: 'Devin Marsh',        // Corporate Communications
  felix: 'Dr. Taylor Brenner', // Legal / Compliance Reviewer
  sabine: 'Jamie Kessler',      // Compliance Counsel
} as const;

// Owner sign-off per L1 topic (accountable senior). Front-matter items are
// standalone L1s; they roll up to the ESG Reporting Lead.
const OWNER_BY_L1: Record<string, string> = {
  'Front Cover': P.eva,
  "Chair and CEO's Letter": P.eva,
  'Table of Contents': P.eva,
  'Introduction and use of certain terms': P.eva,
  'Forward-looking statements': P.eva,
  'Basis of preparation': P.eva,
  'Business model': P.eva,
  'Environmental matters': P.lukas,
  'Social matters': P.priya,
  'Governance matters': P.eva,
  'Appendix': P.eva,
  'Human Rights Statement 2025': P.marco,
};

// Legal sign-off — Modern Slavery / Transparency-heavy topics route to Sabine
function legalFor(l1: string, l2?: string): string {
  if (l1 === 'Human Rights Statement 2025') return P.sabine;
  if (l2 === 'Working conditions value chain' || l2 === 'Business conduct') return P.sabine;
  return P.felix;
}

// ---------------------------------------------------------------------------
// Structure definition. Tuple: [ref, L1, L2, L3, format, inputProvider]
// Ranges from the breakdown (e.g. 7.2.1–7.2.9) are expanded to concrete rows.
// ---------------------------------------------------------------------------
type Row = [string, string, string, string, ContentFormat, string];

const STRUCTURE: Row[] = [
  // Front matter (1.0–5.0) — each is a standalone L1 with no sub-sections,
  // per the blueprint (Topic-L1 = the item name; no L2/L3).
  ['1.0', 'Front Cover', '', '', 'Image', P.nadia],
  ['2.0', "Chair and CEO's Letter", '', '', 'Text', P.eva],
  ['3.0', 'Table of Contents', '', '', 'Table', P.eva],
  ['4.0', 'Introduction and use of certain terms', '', '', 'Text', P.eva],
  ['5.0', 'Forward-looking statements', '', '', 'Text', P.felix],

  // 6 Basis of preparation
  ['6.1', 'Basis of preparation', 'Introduction & Basis for selecting Content', '', 'Text', P.eva],
  ['6.2', 'Basis of preparation', 'All other sub-sections (Scope and reporting boundaries, Data collection and reporting, External Assurance)', '', 'Text', P.eva],

  // 7.1 Business model — Corporate governance
  ['7.1.1', 'Business model', 'Corporate governance', 'Oversight of nonfinancial matters- Board of Directors', 'Text', P.eva],
  ['7.1.2', 'Business model', 'Corporate governance', 'Oversight of nonfinancial matters- Management', 'Text', P.eva],
  ['7.1.3', 'Business model', 'Corporate governance', 'Infographics (1) - governance and information flow', 'Infographic', P.eva],
  ['7.1.4', 'Business model', 'Corporate governance', 'Infographics (2) - management responsibilities', 'Infographic', P.eva],
  ['7.1.5', 'Business model', 'Corporate governance', 'Integration of nonfinancial matters into executive compensation', 'Text', P.eva],

  // 7.2 Business model — Value chain (7.2.1–7.2.9)
  ['7.2.1', 'Business model', 'Value chain', 'Supply chain', 'Text', P.marco],
  ['7.2.2', 'Business model', 'Value chain', 'Research and development', 'Text', P.priya],
  ['7.2.3', 'Business model', 'Value chain', 'Regulatory submission and approval', 'Text', P.felix],
  ['7.2.4', 'Business model', 'Value chain', 'Production', 'Text', P.sophie],
  ['7.2.5', 'Business model', 'Value chain', 'Marketing and sales', 'Text', P.priya],
  ['7.2.6', 'Business model', 'Value chain', 'Our workforce', 'Text', P.anika],
  ['7.2.7', 'Business model', 'Value chain', 'Table (1): Overview of our workforce characteristics and operating sites', 'Table', P.eva],
  ['7.2.8', 'Business model', 'Value chain', 'Table (2): Major HQs and production sites', 'Table', P.eva],
  ['7.2.9', 'Business model', 'Value chain', 'Reporting criteria', 'Text', P.eva],

  // 7.3 Business model — Strategy (7.3.1–7.3.4)
  ['7.3.1', 'Business model', 'Strategy', 'Business environment', 'Text', P.eva],
  ['7.3.2', 'Business model', 'Strategy', 'Strategic focus areas', 'Text', P.eva],
  ['7.3.3', 'Business model', 'Strategy', 'Strategic priorities', 'Text', P.eva],
  ['7.3.4', 'Business model', 'Strategy', 'Social impact and sustainability strategy', 'Text', P.eva],

  // 7.4 Business model — Stakeholder engagement
  ['7.4', 'Business model', 'Stakeholder engagement', '', 'Text', P.nadia],

  // 7.5 Business model — Materiality assessment (7.5.1–7.5.5)
  ['7.5.1', 'Business model', 'Materiality assessment', 'Intro Paragraph', 'Text', P.eva],
  ['7.5.2', 'Business model', 'Materiality assessment', 'Enterprise risk management', 'Text', P.thomas],
  ['7.5.3', 'Business model', 'Materiality assessment', 'Climate-related scenario analysis', 'Text', P.lukas],
  ['7.5.4', 'Business model', 'Materiality assessment', 'Nature-related impact analysis', 'Text', P.lukas],
  ['7.5.5', 'Business model', 'Materiality assessment', 'Human rights saliency', 'Text', P.marco],

  // 7.6 Business model — Due diligence (7.6.1–7.6.6)
  ['7.6.1', 'Business model', 'Due diligence', 'Intro Paragraph', 'Text', P.marco],
  ['7.6.2', 'Business model', 'Due diligence', 'Human rights due diligence', 'Text', P.marco],
  ['7.6.3', 'Business model', 'Due diligence', 'Environmental due diligence', 'Text', P.sophie],
  ['7.6.4', 'Business model', 'Due diligence', 'Grievance mechanism', 'Text', P.sabine],
  ['7.6.5', 'Business model', 'Due diligence', 'Table: Grievance Metrics', 'Table', P.marco],
  ['7.6.6', 'Business model', 'Due diligence', 'Reporting criteria', 'Text', P.eva],

  // 8.1 Environmental — Climate change (8.1.1–8.1.13)
  ['8.1.1', 'Environmental matters', 'Climate change', 'Impacts, risks and opportunities', 'Text', P.lukas],
  ['8.1.2', 'Environmental matters', 'Climate change', 'Policies', 'Text', P.lukas],
  ['8.1.3', 'Environmental matters', 'Climate change', 'Climate strategy and roadmap', 'Text', P.lukas],
  ['8.1.4', 'Environmental matters', 'Climate change', 'Actions', 'Text', P.lukas],
  ['8.1.5', 'Environmental matters', 'Climate change', 'Table: Climate target performance', 'Table', P.thomas],
  ['8.1.6', 'Environmental matters', 'Climate change', 'Reporting criteria', 'Text', P.lukas],
  ['8.1.7', 'Environmental matters', 'Climate change', 'Climate risk and resilience - Intro paragraph', 'Text', P.lukas],
  ['8.1.8', 'Environmental matters', 'Climate change', 'Climate risk and resilience - Financial planning and effects', 'Text', P.lukas],
  ['8.1.9', 'Environmental matters', 'Climate change', 'Climate risk and resilience - Climate scenario analysis', 'Text', P.lukas],
  ['8.1.10', 'Environmental matters', 'Climate change', 'Climate risk and resilience - Management of climate-related risks and opportunities', 'Text', P.lukas],
  ['8.1.11', 'Environmental matters', 'Climate change', 'Table: Financial impacts (Physical Risks, Transition risks)', 'Table', P.thomas],
  ['8.1.12', 'Environmental matters', 'Climate change', 'Reporting criteria', 'Text', P.lukas],
  ['8.1.13', 'Environmental matters', 'Climate change', 'Table: Climate Metrics', 'Table', P.thomas],

  // 8.2 Environmental — Pollution of water (8.2.1–8.2.5)
  ['8.2.1', 'Environmental matters', 'Pollution of water', 'Impacts, risks and opportunities', 'Text', P.sophie],
  ['8.2.2', 'Environmental matters', 'Pollution of water', 'Policies', 'Text', P.sophie],
  ['8.2.3', 'Environmental matters', 'Pollution of water', 'Actions', 'Text', P.sophie],
  ['8.2.4', 'Environmental matters', 'Pollution of water', 'Table: Water quality- target performance', 'Table', P.sophie],
  ['8.2.5', 'Environmental matters', 'Pollution of water', 'Reporting criteria', 'Text', P.sophie],

  // 9.1 Social — Health and safety in our workforce (9.1.1–9.1.5)
  ['9.1.1', 'Social matters', 'Health and safety in our workforce', 'Impacts, risks and opportunities', 'Text', P.anika],
  ['9.1.2', 'Social matters', 'Health and safety in our workforce', 'Policies', 'Text', P.anika],
  ['9.1.3', 'Social matters', 'Health and safety in our workforce', 'Actions', 'Text', P.anika],
  ['9.1.4', 'Social matters', 'Health and safety in our workforce', 'Table: Workforce health and safety metrics', 'Table', P.anika],
  ['9.1.5', 'Social matters', 'Health and safety in our workforce', 'Reporting criteria', 'Text', P.anika],

  // 9.2 Social — Working conditions in our value chain (9.2.1–9.2.5)
  ['9.2.1', 'Social matters', 'Working conditions in our value chain', 'Impacts, risks and opportunities', 'Text', P.marco],
  ['9.2.2', 'Social matters', 'Working conditions in our value chain', 'Policies', 'Text', P.marco],
  ['9.2.3', 'Social matters', 'Working conditions in our value chain', 'Actions', 'Text', P.marco],
  ['9.2.4', 'Social matters', 'Working conditions in our value chain', 'Table: Working conditions in our value chain metrics', 'Table', P.marco],
  ['9.2.5', 'Social matters', 'Working conditions in our value chain', 'Reporting criteria', 'Text', P.marco],

  // 9.3 Social — Patient health and safety (9.3.1–9.3.5)
  ['9.3.1', 'Social matters', 'Patient health and safety', 'Impacts, risks and opportunities', 'Text', P.priya],
  ['9.3.2', 'Social matters', 'Patient health and safety', 'Policies', 'Text', P.priya],
  ['9.3.3', 'Social matters', 'Patient health and safety', 'Actions', 'Text', P.priya],
  ['9.3.4', 'Social matters', 'Patient health and safety', 'Table: Patient health and safety metrics', 'Table', P.priya],
  ['9.3.5', 'Social matters', 'Patient health and safety', 'Reporting criteria', 'Text', P.priya],

  // 9.4 Social — Access to medicines (9.4.1–9.4.5)
  ['9.4.1', 'Social matters', 'Access to medicines', 'Impacts, risks and opportunities', 'Text', P.priya],
  ['9.4.2', 'Social matters', 'Access to medicines', 'Policies', 'Text', P.priya],
  ['9.4.3', 'Social matters', 'Access to medicines', 'Actions', 'Text', P.priya],
  ['9.4.4', 'Social matters', 'Access to medicines', 'Table: Access to medicines metrics', 'Table', P.priya],
  ['9.4.5', 'Social matters', 'Access to medicines', 'Reporting criteria', 'Text', P.priya],

  // 9.5 Social — Responsible marketing (9.5.1–9.5.3)
  ['9.5.1', 'Social matters', 'Responsible marketing', 'Impacts, risks and opportunities', 'Text', P.priya],
  ['9.5.2', 'Social matters', 'Responsible marketing', 'Policies', 'Text', P.priya],
  ['9.5.3', 'Social matters', 'Responsible marketing', 'Actions', 'Text', P.priya],

  // 10 Governance — Business conduct (10.1–10.5, flat numbering per blueprint)
  ['10.1', 'Governance matters', 'Business conduct', 'Impacts, risks and opportunities', 'Text', P.eva],
  ['10.2', 'Governance matters', 'Business conduct', 'Policies', 'Text', P.eva],
  ['10.3', 'Governance matters', 'Business conduct', 'Actions', 'Text', P.eva],
  ['10.4', 'Governance matters', 'Business conduct', 'Table: Business Conduct metrics', 'Table', P.eva],
  ['10.5', 'Governance matters', 'Business conduct', 'Reporting criteria', 'Text', P.eva],

  // 11–13 Appendix (top-level numbering per blueprint)
  ['11.0', 'Appendix', 'Task Force on Climate-related Financial Disclosures (TCFD) index', '', 'Mixed', P.lukas],
  ['12.0', 'Appendix', 'Global Reporting Initiative (GRI) index', '', 'Mixed', P.eva],
  ['13.0', 'Appendix', 'Independent practitioner’s limited assurance report on selected sustainability information of Novartis AG', '', 'Text', P.eva],

  // 14 Human Rights Statement 2025 — blueprint lists 14.0 (Business structure /
  // Our operations); the seven jurisdictional subsections below are retained
  // (renumbered 14.1–14.7) because each carries independent Modern Slavery Act /
  // Norwegian Transparency Act datapoint coverage that a single row cannot hold.
  ['14.1', 'Human Rights Statement 2025', 'Our commitment', '', 'Text', P.marco],
  ['14.2', 'Human Rights Statement 2025', 'Governance of human rights', '', 'Text', P.marco],
  ['14.3', 'Human Rights Statement 2025', 'Salient human rights issues', '', 'Text', P.marco],
  ['14.4', 'Human Rights Statement 2025', 'Human rights due diligence', '', 'Text', P.marco],
  ['14.5', 'Human Rights Statement 2025', 'Child labour', '', 'Text', P.sabine],
  ['14.6', 'Human Rights Statement 2025', 'Forced labour and modern slavery', '', 'Text', P.sabine],
  ['14.7', 'Human Rights Statement 2025', 'Reporting under jurisdictional acts', '', 'Text', P.sabine],
];

const L1_PARENT: Record<string, string | undefined> = {
  'Basis of preparation': undefined,
  'Business model': 'sec-business-model',
  'Environmental matters': 'sec-environmental',
  'Social matters': 'sec-social',
  'Governance matters': 'sec-governance-matters',
  'Appendix': 'sec-appendix',
  'Human Rights Statement 2025': 'sec-human-rights-statement',
};

// --- Per-subsection overrides: preserved rich content + real DR coverage ---
interface Override {
  content?: string;
  citations?: Citation[];
  drsCovered?: string[];
  stage?: WorkflowStage;
  rollForwardStatus?: RollForwardStatus;
  priorYearContent?: string;
  rollForwardNote?: string;
  wordCount?: number;
}

const OVERRIDES: Record<string, Override> = {
  '4.0': {
    stage: 'approved',
    rollForwardStatus: 'confirmed_unchanged',
    rollForwardNote: 'Boilerplate terms unchanged vs FY2025; confirmed valid by ESG Lead.',
    citations: [
      { id: 'c1', documentName: 'Swiss Code of Obligations Art. 964a', excerpt: 'Public companies must report annually on environmental, social, employee, human rights, and anti-corruption matters with due-diligence descriptions...', pageRef: 'Art. 964a-c', documentType: 'Reporting Standard' },
    ],
    content: `Novartis AG publishes consolidated information on nonfinancial matters as required under Art. 964a of the Swiss Code of Obligations[1].\n\nUnless the context requires otherwise, the words "we," "our," "us," "Novartis," "Group," "Company," and similar words or phrases in this report refer to Novartis AG and its consolidated affiliates. However, each Novartis affiliate is legally separate from all other Novartis affiliate companies and manages its business independently through its respective board of directors or similar supervisory body.`,
  },
  '5.0': {
    stage: 'approved',
    rollForwardStatus: 'confirmed_unchanged',
    rollForwardNote: 'Standard safe-harbour language; legal confirmed no change required.',
    content: `This Report on Nonfinancial Matters contains certain forward-looking statements within the meaning of the United States Private Securities Litigation Reform Act of 1995 that can generally be identified by words or phrases such as "potential," "expect," "will," "plan," "pipeline," "may," "could," "going forward," "target," "believe," "goal," "estimate," "intend," or similar expressions.`,
  },
  '6.1': {
    stage: 'approved',
    rollForwardStatus: 'updated',
    rollForwardNote: 'AGM advisory-vote date updated to March 5, 2027.',
    content: `The Report on Nonfinancial Matters is prepared in accordance with Art. 964a et seq. of the Swiss Code of Obligations (SCO). The report is prepared with reference to the Global Reporting Initiative (GRI) standards. The sections referenced in the Task Force on Climate-related Financial Disclosures (TCFD) index constitute our report on climate-related financial risks and opportunities, as defined by the Swiss Ordinance on Climate Disclosures.\n\nThe content in this report was reviewed by senior management and the Executive Committee of Novartis (ECN) prior to approval by the Board of Directors. The Report on Nonfinancial Matters will be submitted to shareholders for an advisory vote at the AGM on March 5, 2027.`,
  },
  '7.1.1': {
    stage: 'approved',
    rollForwardStatus: 'updated',
    rollForwardNote: 'Risk Committee dissolution at 2026 AGM flagged — confirm committee list still current.',
    drsCovered: ['ESRS2-GOV1', 'ESRS2-GOV2', 'TCFD-GOV-a', 'ISSB-S1-26', 'ISSB-S2-5'],
    citations: [
      { id: 'c2', documentName: 'Novartis Organizational Regulations', excerpt: 'The GSNC has responsibility for reviewing and proposing to the Board ESG strategy, sustainability targets, stakeholder engagement policies, and human-capital topics...', pageRef: 'p.8', documentType: 'Internal Policy' },
    ],
    content: `Novartis is committed to effective corporate governance, and our corporate governance framework is intended to support sustainable financial performance and long-term value creation for our shareholders, patients, employees and wider society.\n\nThe Board of Directors has ultimate responsibility for nonfinancial matters. It oversees strategy, governance and performance through its committees:\n\n- GSNC (Governance, Sustainability and Nomination Committee): Oversees strategy and governance of nonfinancial matters[1]\n- ACC (Audit and Compliance Committee): Oversees internal controls and compliance processes\n- Risk Committee: Oversees enterprise risk management including sustainability risks (until dissolution at 2026 AGM)\n- Compensation Committee: Determines how nonfinancial matters are integrated into the compensation framework`,
  },
  '7.1.2': {
    stage: 'approved',
    rollForwardStatus: 'confirmed_unchanged',
    rollForwardNote: 'ESG Committee mandate unchanged YoY.',
    drsCovered: ['ESRS2-GOV2', 'TCFD-GOV-b', 'ISSB-S1-27', 'ISSB-S2-6'],
    citations: [
      { id: 'c3', documentName: 'Novartis Committee Charters 2025', excerpt: 'ACC oversees nonfinancial data and controls. ESG Committee is a subcommittee of ECN, chaired by CEO...', pageRef: 'p.12', documentType: 'Internal Policy' },
    ],
    content: `At management level, the ESG Committee — a subcommittee of the Executive Committee of Novartis (ECN), chaired by the CEO — reviews social impact and sustainability strategy and performance[1]. The committee meets every two months.\n\nManagement responsibility for nonfinancial data and controls sits with the ERC (Ethics, Risk and Compliance) function, working with Finance and the functional data owners.`,
  },
  '7.1.5': {
    stage: 'legal_review',
    rollForwardStatus: 'needs_update',
    rollForwardNote: 'CEO incentive weighting for FY2026 (10%) must be confirmed against final Compensation Report.',
    drsCovered: ['ESRS2-GOV3', 'ISSB-S2-36'],
    content: `CEO annual incentive includes 10% weighting on "Strengthen foundations (ESG, Human Capital)" including GHG targets. The long-term incentive has four equally weighted performance measures, three on financial performance and one on innovation.`,
  },
  '7.2.1': {
    stage: 'approved',
    rollForwardStatus: 'updated',
    rollForwardNote: 'FTE (75,267) and supplier count updated with FY2026 actuals.',
    drsCovered: ['ESRS2-SBM1', 'ESRS2-SBM2', 'ISSB-S1-29'],
    citations: [
      { id: 'c4', documentName: 'Novartis Annual Report 2025', excerpt: 'Novartis is an innovative medicines company engaged in the research, development, manufacturing, distribution, marketing, and sale of a broad range of pharmaceutical products...', pageRef: 'p.4', documentType: 'External Disclosure' },
    ],
    content: `Novartis is an innovative medicines company engaged in the research, development, manufacturing, distribution, marketing, and sale of a broad range of pharmaceutical products. Our purpose is to reimagine medicine to improve and extend people's lives[1].\n\nAs of December 31, 2026, Novartis employed 75 267 FTEs across approximately 140 countries. Our upstream value chain comprises approximately 60 000 direct suppliers across 120+ countries, managed under the External Partner Risk Management (EPRM) framework.`,
  },
  '7.3.1': {
    stage: 'legal_review',
    rollForwardStatus: 'updated',
    rollForwardNote: 'Business-environment trends refreshed to reflect FY2026 tariff and pricing pressures.',
    drsCovered: ['ESRS2-SBM3', 'ISSB-S1-28'],
    citations: [
      { id: 'c5', documentName: 'Novartis Social Impact and Sustainability Strategy', excerpt: 'Social impact and sustainability drive long-term value by extending access to our medicines to underserved patients...', pageRef: 'p.2', documentType: 'Internal Policy' },
    ],
    content: `Advances in both medical science and digital technologies are opening opportunities for new treatments and more efficient drug discovery. At the same time, pressure on pricing is increasing due to regulatory changes, government funding constraints and tariffs on international trade. The major trends shaping our business environment include scientific and technological innovation, policy and geopolitical pressures, and rising societal expectations around access and responsible conduct.`,
  },
  '7.3.4': {
    stage: 'legal_review',
    rollForwardStatus: 'confirmed_unchanged',
    rollForwardNote: 'Three strategic pillars unchanged vs FY2025.',
    drsCovered: ['ESRS2-SBM3'],
    content: `Social impact and sustainability drive long-term value for our business by extending access to our medicines to underserved patients. Our strategy defines how we aim to create value for patients and society:\n\n- Protecting the planet while advancing human health\n- Advancing our people and culture to achieve shared success\n- Embedding ethics across the business`,
  },
  '7.5.1': {
    stage: 'legal_review',
    rollForwardStatus: 'updated',
    rollForwardNote: 'Double materiality assessment concluded in 2026 — refresh material-topic list.',
    drsCovered: ['ESRS2-IRO1', 'ESRS2-IRO2', 'ISSB-S1-5'],
    citations: [
      { id: 'c6', documentName: 'Novartis Double Materiality Assessment 2025', excerpt: 'Applied the double materiality principle covering financial materiality and impact materiality...', pageRef: 'p.3', documentType: 'Internal Policy' },
    ],
    content: `Our materiality assessment, conducted with a double materiality perspective and concluded in 2026, covered risks and opportunities arising from our value chain (financial materiality) as well as the impact of Novartis on people and the environment (impact materiality)[1].\n\nThe following nonfinancial matters were deemed material: climate change; pollution of water; health and safety in our workforce; working conditions in our value chain; patient health and safety; access to medicines; responsible marketing; and business conduct.`,
  },
  '7.6.1': {
    stage: 'sme_review',
    rollForwardStatus: 'confirmed_unchanged',
    rollForwardNote: 'Three-lines-of-assurance model unchanged.',
    drsCovered: ['ESRS2-GOV4'],
    citations: [
      { id: 'c7', documentName: 'Novartis HSE Policy', excerpt: 'Requires employees to take action to minimize the environmental impact of all business activities...', pageRef: 'p.4', documentType: 'Internal Policy' },
    ],
    content: `Novartis has put in place due diligence processes aimed at identifying, assessing, remediating and monitoring negative impacts on people and the environment across its value chain[1]. We operate an integrated assurance model overseen by our global Ethics, Risk and Compliance (ERC) function with three lines of assurance.`,
  },
  '7.6.3': {
    stage: 'sme_review',
    rollForwardStatus: 'confirmed_unchanged',
    drsCovered: ['ESRS2-GOV4'],
    citations: [
      { id: 'c8', documentName: 'Novartis Third Party Code v3', excerpt: 'All suppliers must comply with the Novartis Third Party Code covering labor rights, environmental standards, anti-corruption, and health and safety...', pageRef: 'p.1', documentType: 'Internal Policy' },
    ],
    content: `Our global HSE Policy mandates environmental protection, requiring strict adherence to legal obligations and continuous improvement in resource efficiency. External partners are contractually required to meet our environmental standards through the Third Party Code (TPC)[1].`,
  },
  '8.1.1': {
    stage: 'legal_review',
    rollForwardStatus: 'updated',
    rollForwardNote: 'Scope 3 share (95%) and purchased-goods figure (77%) updated from FY2026 CDP.',
    drsCovered: ['ESRS-E1-1', 'ESRS-E1-9', 'TCFD-STR-a', 'ISSB-S2-8'],
    citations: [
      { id: 'c11', documentName: 'CDP Climate Response 2025', excerpt: 'Scope 3 Category 1 (Purchased Goods and Services) represents 77% of total Scope 3 emissions...', pageRef: 'p.34', documentType: 'External Disclosure' },
    ],
    content: `The research, development, production and commercialization of medicines generate GHG emissions that contribute to the effects of climate change, which can influence public health and the resilience of healthcare systems. Direct emissions arise from fossil fuel combustion at our operating sites and from Company-owned vehicles (Scope 1), while indirect emissions come from consumption of energy from nonrenewable sources (Scope 2). Most of our total emissions (95%) in 2026 originated outside our direct operations (Scope 3); 77% of these were linked to the purchase of goods and services[1].\n\nPhysical risks from climate-related natural hazards can create financial impacts due to damage to our assets or to our dependence on raw materials, energy and water in manufacturing.`,
  },
  '8.1.3': {
    stage: 'legal_review',
    rollForwardStatus: 'updated',
    rollForwardNote: 'Carbon-neutral-in-own-operations milestone achieved in 2026 — narrative updated.',
    drsCovered: ['ESRS-E1-1', 'ESRS-E1-4', 'ESRS-E1-8', 'TCFD-STR-c', 'ISSB-S2-10', 'ISSB-S2-14', 'ISSB-S2-33'],
    citations: [
      { id: 'c9', documentName: 'SBTi Target Validation Letter 2024', excerpt: 'Novartis near- and long-term ambitions validated: reduce absolute Scope 1 and 2 GHG emissions 90% by 2030, Scope 3 emissions 42% by 2030, from a 2022 base year...', pageRef: 'p.1', documentType: 'External Certification' },
      { id: 'c12', documentName: 'Internal Carbon Pricing Framework', excerpt: 'Shadow carbon price of USD 100/tCO2e applied in decisions on capital expenditure over USD 20 million...', pageRef: 'p.1', documentType: 'Internal Policy' },
    ],
    content: `We have established a transition plan to achieve our near- and long-term targets that were validated by the Science Based Targets initiative (SBTi) in 2024[1]. We apply a shadow carbon price of USD 100/tCO2e[^ The shadow carbon price is an internal planning value used to steer capital allocation; it is not a cost recognised in the financial statements. ] in decisions on capital expenditure over USD 20 million[2].\n\nIn 2026, we achieved carbon neutrality in our own operations (Scope 1 and 2 from energy), neutralizing residual emissions with carbon removal credits, biomethane certificates and SAF certificates. To reduce absolute Scope 3 GHG emissions 42% by 2030, we focus on purchased goods and services, upstream transportation and distribution, business travel and employee commuting.`,
  },
  '8.1.13': {
    stage: 'legal_review',
    rollForwardStatus: 'needs_update',
    rollForwardNote: 'FY2026 Scope 1/2/3 values pending final assurance — table sourced from MDD.',
    drsCovered: ['ESRS-E1-6', 'GRI-305-1', 'GRI-305-2', 'GRI-305-3', 'ISSB-S2-29'],
    content: `Greenhouse gas emissions are reported gross across Scopes 1, 2 (location- and market-based) and 3, with prior-year comparatives. The underlying values are maintained in MDD and shown here for drafting reference only.\n\n[Table Reference: DP_Environment]`,
  },
  '8.1.5': {
    stage: 'legal_review',
    rollForwardStatus: 'needs_update',
    rollForwardNote: 'Progress-against-target column requires FY2026 actuals from MDD.',
    drsCovered: ['ESRS-E1-4', 'ISSB-S2-33'],
    content: `Progress against our validated near- and long-term climate targets, by base year and target year. Source of truth is MDD; the table is shown for drafting reference only.\n\n[Table Reference: DP_Climate_Target_Performance]`,
  },
  '8.1.11': {
    stage: 'legal_review',
    rollForwardStatus: 'updated',
    drsCovered: ['ESRS-E1-9', 'TCFD-RISK-c', 'ISSB-S2-40'],
    content: `Physical risks (acute, 2050): Property/equipment decrease USD 91.6–92.1 million; inventory decrease USD 25.3–25.6 million; revenue loss from business interruptions USD 375.5–385.7 million. Transition risks (2040): operating expense increase USD 46.0–162.6 million; revenue decrease USD 65.8–221.6 million.\n\n[Table Reference: DP_TransitionRisks_Opportunities]`,
  },
  '8.2.1': {
    stage: 'sme_review',
    rollForwardStatus: 'confirmed_unchanged',
    drsCovered: ['ESRS-E2-1'],
    citations: [
      { id: 'c14', documentName: 'Novartis HSE Environmental Compliance Handbook', excerpt: 'Defines the minimum mandatory requirements for environmental compliance at own operations...', pageRef: 'p.3', documentType: 'Internal Policy' },
    ],
    content: `Pharmaceutical manufacturing poses environmental risks and is therefore highly regulated. Residual risks remain from the handling and disposal of chemicals and wastewater generated during production and cleaning, as well as from suppliers manufacturing APIs on our behalf. In most regions, regulatory permits do not specifically address the release of pharmaceutical residues to the environment, and we have therefore established internal policies to address this topic[1].`,
  },
  '8.2.3': {
    stage: 'sme_review',
    rollForwardStatus: 'updated',
    rollForwardNote: 'Water-quality target achievement (97% of sites) updated for 2026.',
    drsCovered: ['ESRS-E2-2', 'ESRS-E2-4'],
    citations: [
      { id: 'c15', documentName: 'Novartis Water Quality Maturity Ladder', excerpt: 'Three-tier PSCI-based maturity framework: Level 1 (compliance), Level 2 (risk-managed), Level 3 (leading practice)...', pageRef: 'p.2', documentType: 'Internal Policy' },
    ],
    content: `In 2026, 97% of Novartis manufacturing sites and all high-risk suppliers demonstrated that they meet water quality standards across all three levels of our water quality maturity ladder[1]. We consider our water quality targets for 2025 to be met.`,
  },
  '9.1.1': {
    stage: 'legal_review',
    rollForwardStatus: 'confirmed_unchanged',
    drsCovered: ['ESRS-S1-1', 'ESRS-S1-14'],
    citations: [
      { id: 'c16', documentName: 'Novartis HSE Policy', excerpt: 'Establishes HSE management system requirements, incident reporting, and occupational health and safety targets including LTIR and TRCR monitoring...', pageRef: 'p.6', documentType: 'Internal Policy' },
    ],
    content: `Our employees may be exposed to health and safety hazards across the organization stemming from chemicals, hazardous materials, moving equipment, and driver safety. To minimize risks of injuries, illnesses or fatalities, we have established an internally validated HSE management system that applies to all employees, third-party personnel and contractors working at our sites and travelling for work[1].`,
  },
  '9.1.4': {
    stage: 'legal_review',
    rollForwardStatus: 'needs_update',
    rollForwardNote: 'LTIR/TRCR and fatality figures require FY2026 actuals from MDD.',
    drsCovered: ['ESRS-S1-14', 'GRI-403-9'],
    content: `Occupational health and safety metrics including LTIR, TRCR and fatalities, with prior-year comparatives. Source of truth is MDD; shown for drafting reference only.\n\n[Table Reference: DP_Workforce_HSE]`,
  },
  '9.2.1': {
    stage: 'sme_review',
    rollForwardStatus: 'confirmed_unchanged',
    drsCovered: ['ESRS-S2-1', 'ESRS-S2-2', 'ESRS-S2-3', 'ESRS-S2-4'],
    citations: [
      { id: 'c18', documentName: 'Novartis EPRM Framework', excerpt: 'The External Partner Risk Management framework governs all third-party relationships through risk tiering, due diligence, and ongoing monitoring for ~60 000 direct suppliers...', pageRef: 'p.4', documentType: 'Internal Policy' },
    ],
    content: `Working conditions in our value chain may pose risks to the health, safety and rights of workers. These risks are highest in lower-income countries where regulatory environments are less mature. Our value chain comprises approximately 60 000 direct suppliers across 120+ countries, managed through the EPRM framework[1].`,
  },
  '9.2.3': {
    stage: 'sme_review',
    rollForwardStatus: 'updated',
    rollForwardNote: 'FY2026 supplier-audit counts to be confirmed.',
    drsCovered: ['ESRS-S2-4'],
    citations: [
      { id: 'c20', documentName: 'Novartis Labor Rights Third-Party Questionnaire', excerpt: 'Detailed risk assessment questionnaire applied to high-risk suppliers covering forced labor, child labor, working hours, wages, freedom of association...', pageRef: 'p.1', documentType: 'Internal Policy' },
    ],
    content: `High-risk suppliers identified through risk-tiering undergo enhanced due diligence including the Labor Rights Third-Party Questionnaire[1] and on-site audits. In 2025: 1 847 supplier audits conducted (92% of critical tier-1 suppliers); 23 suppliers with significant non-conformities; 18 remediation plans completed; 2 supplier relationships terminated after failed remediation.`,
  },
  '9.3.1': {
    stage: 'sme_review',
    rollForwardStatus: 'confirmed_unchanged',
    drsCovered: ['ESRS-S4-1'],
    citations: [
      { id: 'c21', documentName: 'Novartis Pharmacovigilance Policy', excerpt: 'Global pharmacovigilance system processes over 1.1 million adverse event case reports annually...', pageRef: 'p.3', documentType: 'Internal Policy' },
    ],
    content: `The development and manufacturing of our products is complex, and deviations, manufacturing process failures, or undetected quality defects could compromise patient health and safety. Our medicines may also have adverse effects on patients, both during clinical trials and after registration[1].`,
  },
  '9.4.1': {
    stage: 'sme_review',
    rollForwardStatus: 'updated',
    rollForwardNote: 'Patient-reach figure (304 million) updated for 2026.',
    drsCovered: ['ESRS-S3-1', 'ESRS-S3-4'],
    citations: [
      { id: 'c23', documentName: 'Novartis Access to Medicine Strategy 2025', excerpt: 'In 2026, Novartis reached approximately 304 million patients through strategic access approaches...', pageRef: 'p.4', documentType: 'Internal Policy' },
    ],
    content: `We aim to register our innovative treatments across different geographies to improve access to medicines and health outcomes for patients. Our approach is built on availability, affordability and intellectual property. In 2026, we reached 304 million patients with medicines registered and commercialized by Novartis globally[1].`,
  },
  '9.5.1': {
    stage: 'sme_review',
    rollForwardStatus: 'confirmed_unchanged',
    drsCovered: ['ESRS-S4-4'],
    citations: [
      { id: 'c25', documentName: 'Novartis Medical Interaction Guidelines', excerpt: 'All medical interactions must be scientifically balanced, transparent, and compliant with local regulations. Off-label promotion is strictly prohibited...', pageRef: 'p.2', documentType: 'Internal Policy' },
    ],
    content: `Our sales representatives present the therapeutic benefits and risks of our products to healthcare professionals. There is a risk that governance of such interactions may be inadequate. Irresponsible marketing practices may compromise public trust, harm patients, damage our reputation and result in fines or penalties[1].`,
  },
  '10.1': {
    stage: 'approved',
    rollForwardStatus: 'confirmed_unchanged',
    drsCovered: ['ESRS-G1-1'],
    citations: [
      { id: 'c26', documentName: 'Novartis Code of Ethics', excerpt: 'The Code applies to all employees, contingent workers, and Board members. 98% completion rate for mandatory annual training...', pageRef: 'p.3', documentType: 'Internal Policy' },
    ],
    content: `We interact with a range of stakeholders while negotiating contracts, seeking regulatory approval, and presenting the benefits and risks of our products. These interactions may be vulnerable to undue influence, including bribery, corruption and anti-competitive practices. Failure to comply with anti-corruption, anti-bribery and antitrust regulations may result in reputational damage, legal proceedings, fines and exclusion from markets[1].`,
  },
  '10.3': {
    stage: 'approved',
    rollForwardStatus: 'updated',
    rollForwardNote: 'Code of Ethics training completion (98%) and SpeakUp volumes updated for 2026.',
    drsCovered: ['ESRS-G1-1', 'ESRS-G1-3', 'ESRS-G1-4'],
    citations: [
      { id: 'c27', documentName: 'Novartis SpeakUp Policy', excerpt: 'SpeakUp is our confidential reporting channel available in 65+ languages. Reports can be made anonymously...', pageRef: 'p.1', documentType: 'Internal Policy' },
    ],
    content: `In 2026, the annual Code of Ethics training achieved a completion rate of 98%, in line with the previous year. Among the allegations made through our grievance mechanism, none of those considered higher risk related to bribery and kickbacks were substantiated in 2026. The SpeakUp reporting line is available in 65+ languages[1].`,
  },
  '11.0': {
    stage: 'legal_review',
    rollForwardStatus: 'needs_update',
    rollForwardNote: 'Page cross-references must be re-pointed once pagination is final.',
    drsCovered: ['TCFD-GOV-a', 'TCFD-GOV-b', 'TCFD-STR-a', 'TCFD-STR-b', 'TCFD-STR-c', 'TCFD-RISK-a', 'TCFD-RISK-b', 'TCFD-RISK-c', 'TCFD-MET-a', 'TCFD-MET-b', 'TCFD-MET-c'],
    content: `The following index comprises our disclosure in accordance with the Swiss Ordinance on Climate Disclosures, based on the TCFD recommendations (Governance, Strategy, Risk Management, Metrics and Targets). Page references are maintained in MDD.\n\n[Table Reference: DP_TCFD_Index]`,
  },
  '12.0': {
    stage: 'sme_review',
    rollForwardStatus: 'needs_update',
    drsCovered: ['GRI-302-1', 'GRI-302-3', 'GRI-303-3', 'GRI-305-1', 'GRI-305-2', 'GRI-305-3', 'GRI-403-9'],
    content: `Novartis has reported with reference to the GRI Standards for the reporting period January 1 to December 31, 2026. The content index maps each GRI disclosure to report content and is maintained in MDD.\n\n[Table Reference: DP_GRI_Index]`,
  },
  '13.0': {
    stage: 'sme_review',
    rollForwardStatus: 'confirmed_unchanged',
    drsCovered: [],
    content: `Assurance provider: KPMG AG, Zurich. Standards: ISAE 3000 (Revised) and ISAE 3410. Limited assurance on selected sustainability disclosures including GHG emissions, energy, water withdrawal, LTIR/TRCR, waste, access-to-medicines patient reach, and Code of Ethics training completion.\n\nBased on the procedures performed, nothing has come to our attention that causes us to believe that the selected disclosures are not prepared, in all material respects, in accordance with the applicable criteria.`,
  },
  '14.1': {
    stage: 'draft',
    rollForwardStatus: 'new',
    rollForwardNote: 'New in FY2026 — Human Rights Statement added at end of report; maps to Modern Slavery / Transparency acts.',
    drsCovered: ['ESRS-S1-3', 'ESRS-S2-5', 'MSA-UK-2', 'MSA-CA-2', 'MSA-AU-1', 'NTA-1'],
    citations: [
      { id: 'c31', documentName: 'Novartis Human Rights Commitment Statement', excerpt: 'Novartis recognizes the right to health including access to essential medicines. We commit to respecting human rights in line with the UN Guiding Principles on Business and Human Rights...', pageRef: 'p.1', documentType: 'Internal Policy' },
    ],
    content: `Novartis is committed to respecting human rights in line with the UN Guiding Principles on Business and Human Rights. Our Human Rights Commitment Statement publicly discloses our approach to salient human rights issues[1]. This statement addresses our due diligence and reporting obligations in relation to human rights, child labour, forced labour and modern slavery under the Swiss Code of Obligations and applicable jurisdictional requirements.`,
  },
  '14.5': {
    stage: 'draft',
    rollForwardStatus: 'new',
    rollForwardNote: 'New subsection — child labour disclosure required under SCO and jurisdictional acts.',
    drsCovered: ['ESRS-S2-5', 'MSA-CA-3', 'MSA-AU-3'],
    content: `We have processes in place to comply with our obligations under the Swiss Code of Obligations regarding child labour. Our Third Party Code prohibits child labour in all forms. Risk assessments targeting child labour are conducted for high-risk supplier categories and geographies.`,
  },
  '14.6': {
    stage: 'draft',
    rollForwardStatus: 'new',
    rollForwardNote: 'New subsection — maps to UK/Canadian/Australian Modern Slavery Acts and Norwegian Transparency Act.',
    drsCovered: ['ESRS-S2-5', 'MSA-UK-3', 'MSA-UK-4', 'MSA-CA-3', 'MSA-AU-4', 'NTA-2', 'NTA-3'],
    content: `Our approach to preventing forced labour and modern slavery is integrated into the EPRM framework and Third Party Code. High-risk suppliers undergo enhanced due diligence and, where required, on-site audits. This subsection is intended to satisfy modern-slavery statement obligations across the jurisdictions in which Novartis operates.`,
  },
  '14.2': {
    stage: 'draft',
    rollForwardStatus: 'new',
    rollForwardNote: 'New subsection — governance of human rights; maps to modern-slavery reporting-entity/structure criteria.',
    drsCovered: ['MSA-UK-1', 'MSA-CA-1', 'MSA-AU-2', 'NTA-1'],
    content: `Governance of human rights sits with the Ethics, Risk and Compliance (ERC) function, overseen by the Board's GSNC. Our human rights approach applies across the Novartis Group structure, its operations and its supply chains, consistent with the reporting-entity and structure requirements of applicable modern-slavery and transparency laws.`,
  },
  '14.3': {
    stage: 'draft',
    rollForwardStatus: 'new',
    rollForwardNote: 'New subsection — salient human rights issues; maps to risk-identification criteria.',
    drsCovered: ['ESRS-S1-3', 'MSA-UK-4', 'MSA-AU-3', 'NTA-2'],
    content: `Our salient human rights issues include labour rights risks in the value chain (forced labour, child labour, excessive working hours), health risks related to access to medicines and patient safety, and living-wage gaps among lower-income-country suppliers. These are the parts of our operations and supply chains where the risk of adverse impacts is highest.`,
  },
  '14.4': {
    stage: 'draft',
    rollForwardStatus: 'new',
    rollForwardNote: 'New subsection — human rights due diligence; maps to due-diligence and effectiveness criteria.',
    drsCovered: ['ESRS-S2-4', 'MSA-UK-3', 'MSA-UK-5', 'MSA-CA-2', 'MSA-AU-4', 'MSA-AU-5', 'NTA-3'],
    content: `Our human rights due diligence is integrated into the EPRM framework and covers identification, assessment, remediation and monitoring of adverse impacts, aligned with the OECD Due Diligence Guidance. Effectiveness is assessed through supplier-audit coverage, remediation completion rates and grievance-mechanism outcomes.`,
  },
  '14.7': {
    stage: 'draft',
    rollForwardStatus: 'new',
    rollForwardNote: 'New subsection — jurisdictional statements; maps to consultation, training and effectiveness criteria.',
    drsCovered: ['MSA-UK-5', 'MSA-UK-6', 'MSA-CA-4', 'MSA-AU-5', 'MSA-AU-6', 'MSA-AU-7'],
    content: `This statement is made to satisfy reporting obligations under the UK Modern Slavery Act 2015 (s.54), the Canadian Fighting Against Forced Labour and Child Labour in Supply Chains Act, the Australian Modern Slavery Act 2018, and the Norwegian Transparency Act. It reflects consultation with entities Novartis owns or controls, training provided to relevant staff, and our assessment of the effectiveness of the actions taken.`,
  },
};

// --- Content-format-aware stub generator for subsections without overrides -
function stubContent(l1: string, l2: string, l3: string, format: ContentFormat): string {
  const topic = l3 || l2 || l1;
  const dpKey = (l2 || l1).replace(/[^A-Za-z0-9]+/g, '_');
  switch (format) {
    case 'Image':
      return `[Image placeholder: ${topic}] — cover artwork is supplied by Corporate Communications and inserted at publication. Reference only in the authoring studio.`;
    case 'Infographic':
      return `[Infographic placeholder: ${topic}] — this visual is produced from the approved narrative and data. It renders as reference-only here and is replaced with the final artwork at export.`;
    case 'Table':
      return `Data for "${topic}" is maintained in MDD and shown here for drafting reference only.\n\n[Table Reference: DP_${dpKey}]`;
    case 'Mixed':
      return `## ${topic}\n\nNarrative for "${topic}" combines drafted text with data sourced from MDD. The table below is reference-only and is replaced with MDD code on export.\n\n[Table Reference: DP_${dpKey}]`;
    default:
      return `Draft narrative for "${topic}" under ${l2 || l1}. This subsection is independently assignable and carries its own workflow, roles and roll-forward status. Content will be generated from the knowledge base and refined by the assigned Input Provider.`;
  }
}

// Deterministic helpers so the demo is stable (no Math.random / Date.now)
function defaultStage(idx: number): WorkflowStage {
  const cycle: WorkflowStage[] = ['approved', 'legal_review', 'sme_review', 'sme_review', 'draft'];
  return cycle[idx % cycle.length];
}
function defaultRollForward(idx: number): RollForwardStatus {
  const cycle: RollForwardStatus[] = ['confirmed_unchanged', 'updated', 'needs_update', 'confirmed_unchanged', 'updated'];
  return cycle[idx % cycle.length];
}
function estimateWordCount(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(words, 40);
}

function slugFor(ref: string): string {
  return 'sub-' + ref.replace(/\./g, '-');
}

// --- Grounded roll-forward (what the RNFM Draft Generation Agent does) -------
// For a Text subsection that has a real FY2025 approved baseline but no
// hand-authored FY2026 override, the AI first-draft is produced by rolling the
// prior-year narrative forward: the reporting year advances (2025→2026,
// 2024→2025) and the assessment years follow. This is deliberately conservative
// — it NEVER invents figures. Any metric that genuinely needs a new-year actual
// is flagged for the Input Provider rather than fabricated. The result is a
// realistic first draft whose redline vs. FY2025 shows exactly what the AI
// touched.
function rollForwardText(prior: string): string {
  return prior
    // Reporting-year references move forward one year. Order matters: shift the
    // older comparative first so we don't double-shift.
    .replace(/\b2024\b/g, '2025')
    .replace(/\b2025\b/g, '2026')
    // "concluded in 2026" / "assessment concluded in 2026" reads oddly for a
    // materiality assessment that is periodic; leave prose otherwise intact.
    ;
}

// Reasons the AI attaches to a rolled-forward subsection, so the redline shows
// WHY each change was made (compliance requirement — Zuzana/DDIT). Keyed by the
// paragraph indices the roll-forward is expected to touch (0 and 1 cover the
// opening narrative in every rolled section; extra keys are harmless).
const ROLL_FORWARD_MODEL = 'claude-sonnet-4-6 (Bedrock AgentCore)';
function rollForwardProvenance(): Record<number, AiProvenanceEntry> {
  const reason = 'Rolled forward from the FY2025 approved narrative: reporting period advanced to FY2026 and comparatives shifted to FY2025. Figures carried over from FY2025 must be confirmed against FY2026 actuals before sign-off.';
  return {
    0: { kind: 'modified', model: ROLL_FORWARD_MODEL, at: '2026-03-15T09:40:00Z', reason },
    1: { kind: 'modified', model: ROLL_FORWARD_MODEL, at: '2026-03-15T09:40:00Z', reason },
    2: { kind: 'modified', model: ROLL_FORWARD_MODEL, at: '2026-03-15T09:40:00Z', reason },
  };
}

// Provenance for AI-rolled subsections, exported so the editor seeds it
// alongside the hand-authored provenance in aiProvenance.ts.
export const rolledForwardProvenance: Record<string, Record<number, AiProvenanceEntry>> = {};

// Build all sections from the STRUCTURE, then partition into the main RNFM and
// the Human Rights Statement (kept as a SEPARATE report for 2026; #15 per the
// 2026-07-09 call — from 2027 it integrates into the ESRS-compliant RNFM).
const ALL_SECTIONS: ReportSection[] = STRUCTURE.map(([ref, l1, l2, l3, format], idx) => {
  const ov = OVERRIDES[ref] || {};
  const title = l3 || l2 || l1;
  const prior = priorYearContent[ref];
  // Text subsections with a real FY2025 baseline but no hand-authored override
  // get an AI roll-forward first draft (grounded, no invented figures).
  const isRolledForward = !ov.content && format === 'Text' && !!prior;
  const content = ov.content ?? (isRolledForward ? rollForwardText(prior!) : stubContent(l1, l2, l3, format));
  if (isRolledForward) {
    rolledForwardProvenance[slugFor(ref)] = rollForwardProvenance();
  }
  const stage = ov.stage ?? defaultStage(idx);
  const inputProvider = STRUCTURE[idx][5];
  // Owners = the content owner for this L1 topic plus the assigned legal/
  // compliance reviewer (modelled as an Owner flagged in `legalOwners`).
  // De-duplicated so a topic where the same person holds both appears once.
  const contentOwner = OWNER_BY_L1[l1] ?? P.eva;
  const legalOwner = legalFor(l1, l2);
  const owners = Array.from(new Set([contentOwner, legalOwner]));
  // The legal/compliance reviewer is a Legal owner (single sign-off suffices),
  // unless they are also the content owner (then the section has no distinct
  // legal seat and every owner must sign normally).
  const legalOwners = legalOwner !== contentOwner ? [legalOwner] : [];
  const roles: SubsectionRoles = {
    inputProviders: [inputProvider],
    owners,
    legalOwners,
  };
  return {
    id: slugFor(ref),
    number: ref,
    ref,
    title,
    topicL1: l1,
    topicL2: l2 || undefined,
    topicL3: l3 || undefined,
    contentFormat: format,
    parentId: L1_PARENT[l1],
    stage,
    assignee: inputProvider,
    roles,
    wordCount: ov.wordCount ?? estimateWordCount(content),
    citations: ov.citations ?? [],
    content,
    lastModified: '2026-06-12T16:45:00Z',
    drsCovered: ov.drsCovered ?? [],
    rollForwardStatus: ov.rollForwardStatus ?? (isRolledForward ? 'updated' : defaultRollForward(idx)),
    priorYearContent: ov.priorYearContent ?? prior,
    rollForwardNote: ov.rollForwardNote ?? (isRolledForward
      ? 'AI first draft rolled forward from the FY2025 approved report; reporting period advanced to FY2026. Confirm carried-over figures against FY2026 actuals.'
      : undefined),
  };
});

// The main RNFM report: everything EXCEPT the Human Rights Statement (now a separate report).
export const reportSections: ReportSection[] = ALL_SECTIONS.filter(s => s.topicL1 !== 'Human Rights Statement 2025');

// Human Rights Statement sections (separate report for 2026; #15).
export const hrsSections: ReportSection[] = ALL_SECTIONS.filter(s => s.topicL1 === 'Human Rights Statement 2025');

// Progress of a subsection through the pre-sign-off editing phase (Adrian
// 2026-08-31). Input Providers no longer sign off; instead an edit marks the
// subsection 'edited', and the Editor advances it to 'updated' once all
// comments are addressed. 'updated' is the prerequisite for L2 owner sign-off.
export type SectionProgress = 'edited' | 'updated';
export type SectionProgressMap = Record<string, SectionProgress>;

// Demo seed: one L2 group where EVERY subsection is already marked 'updated',
// so the consolidated (L2) view opens showing content ready N/N and the only
// remaining step is the L2 Owner → Legal sign-off. Lets the demo jump straight
// to "waiting for L2 approval" without hand-advancing each subsection first.
// "Pollution of water" (8.2.1–8.2.5) is a compact, self-contained L2 group.
export const DEMO_L2_READY = { topicL1: 'Environmental matters', topicL2: 'Pollution of water' };
export const demoSectionProgressSeed: SectionProgressMap = Object.fromEntries(
  reportSections
    .filter(s => s.topicL1 === DEMO_L2_READY.topicL1 && s.topicL2 === DEMO_L2_READY.topicL2)
    .map(s => [s.id, 'updated' as SectionProgress]),
);

export const rollForwardLabels: Record<RollForwardStatus, string> = {
  updated: 'Updated',
  needs_update: 'Needs Update',
  confirmed_unchanged: 'Confirmed Unchanged',
  new: 'New',
};

export const rollForwardColors: Record<RollForwardStatus, string> = {
  updated: '#3b82f6',
  needs_update: '#f59e0b',
  confirmed_unchanged: '#16a34a',
  new: '#8b5cf6',
};

export const contentFormatIcons: Record<ContentFormat, string> = {
  Text: '¶',
  Table: '▦',
  Infographic: '◫',
  Image: '🖼',
  Mixed: '⧉',
  None: '·',
};

export const reportMetadata = {
  title: 'Report on Nonfinancial Matters (RNFM) — FY2026',
  company: 'Novartis AG',
  reportingPeriod: 'January 1, 2026 – December 31, 2026',
  priorReportingPeriod: 'January 1, 2025 – December 31, 2025',
  baselineReport: 'Novartis RNFM FY2025 (final, approved)',
  reportingStandards: ['Swiss CO Art. 964a et seq.', 'GRI (with reference)', 'TCFD / Swiss Climate Ordinance'],
  legalBasis: 'Art. 964a et seq. Swiss Code of Obligations',
  currentStage: 'legal_review' as WorkflowStage,
  totalSubsections: reportSections.length,
  totalWordCount: reportSections.reduce((sum, s) => sum + s.wordCount, 0),
  totalCitations: reportSections.reduce((sum, s) => sum + s.citations.length, 0),
  createdDate: '2026-01-15T08:00:00Z',
  lastModified: '2026-06-18T16:45:00Z',
};
