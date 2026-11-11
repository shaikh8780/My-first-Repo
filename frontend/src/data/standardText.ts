// Verbatim disclosure-requirement text from the standards, surfaced when a user
// clicks a mapped ESRS / ISSB datapoint in the editor or compliance view
// (13 Jul 2026 feedback #11 — Thevi/Adrian: "you should see the actual
// requirements", not the AI interpretation).
//
// Source of truth:
//   ESRS  → EC Draft Delegated Act, 6 May 2026 (amended ESRS) / EFRAG Technical
//           Advice 3 Dec 2025 — the "IG3" datapoint register (customer file Q2).
//           PRE-ADOPTION: mandatory FY2027; Wave-1 undertakings continue under
//           the original ESRS unless opting for early application. Every ESRS
//           extract therefore carries preAdoption:true so the UI can badge it.
//   IFRS  → IFRS S1 (General Requirements) + IFRS S2 (Climate) — final/effective,
//           no pre-adoption caveat (customer file Q2b).
//
// The text is transcribed VERBATIM and must not be paraphrased. Keyed by the
// DisclosureRequirement.id used in esrsRequirements.ts so a click resolves via
// standardTextFor(drId). A DR groups one or more numbered paragraphs.

export type StandardObligation = 'M' | 'CM' | 'IA';

export interface StandardParagraph {
  paraRef: string;          // e.g. "¶24(a)" (ESRS) or "IFRS S2.29(a)(i)"
  text: string;             // verbatim requirement text
  dataType?: string;        // Narrative / Quantitative / Binary / Table ...
  obligation?: StandardObligation;
  obligationNote?: string;  // applicability note
  phaseIn?: string;         // phase-in / transition relief (ESRS draft, May 2026)
}

export interface StandardExtract {
  drId: string;             // matches DisclosureRequirement.id
  framework: 'ESRS' | 'ISSB' | 'GRI' | 'TCFD' | 'MSA' | 'NTA';
  standardLabel: string;    // e.g. "ESRS E1 — Climate change" / "IFRS S2 — Climate"
  drTitle: string;
  preAdoption?: boolean;    // ESRS amended draft (mandatory FY2027) → show caveat
  // Provenance for extracts authored from the public standard (GRI/TCFD/MSA/NTA)
  // rather than transcribed from a customer-supplied file. Rendered as a caveat
  // so the source is always explicit and never mistaken for the customer's own.
  sourceNote?: string;
  paragraphs: StandardParagraph[];
}

const OBLIGATION_LABEL: Record<StandardObligation, string> = {
  M: 'Mandatory (subject to information materiality)',
  CM: 'Conditional on materiality',
  IA: 'If applicable',
};
export function obligationLabel(o?: StandardObligation): string | undefined {
  return o ? OBLIGATION_LABEL[o] : undefined;
}

// ---------------------------------------------------------------------------
// ESRS — EC Draft Delegated Act (6 May 2026), amended ESRS. preAdoption = true.
// ---------------------------------------------------------------------------

const ESRS2: StandardExtract[] = [
  {
    drId: 'ESRS2-GOV1', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'GOV-1 Role of the administrative, management and supervisory bodies', preAdoption: true,
    paragraphs: [
      { paraRef: '¶12(a)', dataType: 'Narrative / Quantitative', obligation: 'M', text: 'The composition of governance bodies, including percentage of independent board members, representation of employees and other workers and percentage by gender and other diversity aspect taken into account.' },
      { paraRef: '¶12(b)', dataType: 'Narrative', obligation: 'M', text: 'Expertise and skills of governance bodies and how they determine whether appropriate skills and expertise are available.' },
      { paraRef: '¶12(c)', dataType: 'Narrative', obligation: 'M', text: 'Identity and responsibilities of individuals, board committee or similar body within the governance bodies responsible for the management of material impacts, risks and opportunities.' },
      { paraRef: '¶12(d)', dataType: 'Narrative', obligation: 'M', text: 'How governance bodies manage or oversee the setting of targets and how they monitor progress towards them.' },
      { paraRef: '¶12(e)', dataType: 'Narrative', obligation: 'M', text: 'How governance bodies take into account material impacts, risks and opportunities when managing the strategy, decisions on major transactions and risk management process and related policies.' },
    ],
  },
  {
    drId: 'ESRS2-GOV2', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'GOV-2 Information provided to and sustainability matters addressed by the undertaking’s administrative, management and supervisory bodies', preAdoption: true,
    paragraphs: [
      { paraRef: '¶14', dataType: 'Narrative', obligation: 'IA', obligationNote: 'Only if incentive schemes exist', text: 'Where incentive schemes for governance body members are linked to sustainability: how members’ remuneration is linked to sustainability and which sustainability matters are considered.' },
    ],
  },
  {
    drId: 'ESRS2-GOV3', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'GOV-3 Statement on due diligence', preAdoption: true,
    paragraphs: [
      { paraRef: '¶16', dataType: 'Narrative', obligation: 'M', obligationNote: 'Applies where CSDDD in scope or voluntary DD', text: 'Where the main aspects and steps of due diligence are disclosed in the sustainability statement.' },
    ],
  },
  {
    drId: 'ESRS2-GOV4', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'GOV-4 Risk management and internal controls over sustainability reporting', preAdoption: true,
    paragraphs: [
      { paraRef: '¶18', dataType: 'Narrative', obligation: 'M', text: 'Scope, main features and components of risk management and internal control processes relating to sustainability reporting.' },
    ],
  },
  {
    drId: 'ESRS2-SBM1', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'SBM-1 Strategy, business model and value chain', preAdoption: true,
    paragraphs: [
      { paraRef: '¶20(a)', dataType: 'Narrative', obligation: 'M', phaseIn: 'UCE applies to value-chain detail', text: 'Description of business model, upstream and downstream value chain and position in it.' },
      { paraRef: '¶20(b)', dataType: 'Narrative', obligation: 'M', phaseIn: 'UCE applies; Tier 1 sufficient where further data involves UCE', text: 'Significant groups of products and services, significant markets or customer groups, and if applicable, products and services banned in certain markets.' },
      { paraRef: '¶20(c)', dataType: 'Narrative', obligation: 'M', text: 'Significant sectors where the undertaking operates.' },
      { paraRef: '¶20(d)', dataType: 'Narrative', obligation: 'IA', obligationNote: 'Only if the undertaking is active in the sectors', text: 'Statement indicating, together with related revenues, whether the undertaking is active in the fossil fuel sector, chemicals production, the prohibited weapons industry or cultivation and production of tobacco.' },
    ],
  },
  {
    drId: 'ESRS2-SBM2', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'SBM-2 Interests and views of stakeholders', preAdoption: true,
    paragraphs: [
      { paraRef: '¶22(a)', dataType: 'Narrative', obligation: 'M', text: 'Description of stakeholder engagement, including information on key stakeholders.' },
      { paraRef: '¶22(b)', dataType: 'Narrative', obligation: 'M', text: 'Understanding of the interests and views of key stakeholders as they relate to the strategy and business model.' },
      { paraRef: '¶22(c)', dataType: 'Narrative', obligation: 'M', text: 'How the governance bodies are informed about the views and interests of key affected stakeholders with regard to material impacts, risks and opportunities.' },
    ],
  },
  {
    drId: 'ESRS2-SBM3', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'SBM-3 Material impacts, risks and opportunities and their interaction with strategy and business model', preAdoption: true,
    paragraphs: [
      { paraRef: '¶24', dataType: 'Narrative', obligation: 'M', text: 'High-level description of how material impacts originate from strategy and business model and how material risks and opportunities affect strategy and business model.' },
      { paraRef: '¶25', dataType: 'Narrative / Quantitative', obligation: 'M', text: 'Qualitative and quantitative information on how material risks and opportunities have affected financial position, performance and cash flows during the reporting period.' },
      { paraRef: '¶26', dataType: 'Narrative', obligation: 'M', text: 'Qualitative information on material risks and opportunities with significant risk of material adjustment to carrying amounts within next annual period.' },
      { paraRef: '¶27', dataType: 'Narrative / Quantitative', obligation: 'M', phaseIn: 'Wave 1: may omit until FY2027, quantitative until FY2030; other undertakings: may omit for first year of reporting', text: 'Qualitative and quantitative information on how financial position, performance and cash flows are expected to change over short, medium and long term (anticipated financial effects).' },
      { paraRef: '¶33', dataType: 'Narrative', obligation: 'M', text: 'Qualitative information on resilience of strategy and business model to manage material risks.' },
    ],
  },
  {
    drId: 'ESRS2-IRO1', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'IRO-1 Description of the processes to identify and assess material impacts, risks and opportunities', preAdoption: true,
    paragraphs: [
      { paraRef: '¶35(a)', dataType: 'Narrative', obligation: 'M', text: 'Concise description of process to identify impacts, risks and opportunities and to assess their materiality.' },
      { paraRef: '¶35(b)', dataType: 'Narrative', obligation: 'M', text: 'How impacts were assessed and prioritised based on severity and likelihood, how prevention, mitigation and remediation of negative impacts was considered and how areas of heightened risks of negative impacts were considered.' },
      { paraRef: '¶35(c)', dataType: 'Binary / Narrative', obligation: 'M', text: 'Whether the assessment is informed by sustainability due diligence and if affected stakeholders and external experts were consulted.' },
      { paraRef: '¶35(d)', dataType: 'Narrative', obligation: 'M', text: 'Significant changes to the process compared to the prior reporting period.' },
      { paraRef: '¶35(e)', dataType: 'Date', obligation: 'M', text: 'When the materiality assessment was last updated.' },
    ],
  },
  {
    drId: 'ESRS2-IRO2', framework: 'ESRS', standardLabel: 'ESRS 2 — General disclosures', drTitle: 'IRO-2 Disclosure requirements in ESRS covered by the undertaking’s sustainability statement', preAdoption: true,
    paragraphs: [
      { paraRef: '¶37(a)', dataType: 'Narrative', obligation: 'M', text: 'Concise description of material impacts and how they affect or likely affect people or the environment, and material risks and opportunities, related topics and connection to own operation, upstream and downstream value chain.' },
      { paraRef: '¶37(d)', dataType: 'Table', obligation: 'M', text: 'Cross-reference table: all ESRS DRs covered in sustainability statement with page/section references.' },
      { paraRef: '¶37(g)', dataType: 'Table', obligation: 'M', text: 'A table of datapoints derived from other EU legislation with page/section references.' },
    ],
  },
];

const ESRS_TOPICAL: StandardExtract[] = [
  {
    drId: 'ESRS-E1-1', framework: 'ESRS', standardLabel: 'ESRS E1 — Climate change', drTitle: 'E1-1 Transition plan for climate change mitigation', preAdoption: true,
    paragraphs: [
      { paraRef: '¶12(a)', dataType: 'Narrative', obligation: 'CM', phaseIn: 'If no plan: state this fact and indicate whether / when a plan will be adopted', text: 'Key features of the transition plan: GHG emission reduction targets, decarbonisation levers, key actions, and the investments and funding needed to support implementation. How the plan is embedded in and aligned with the overall business strategy, and how strategy and business model are or will be compatible with limiting warming to 1.5°C.' },
      { paraRef: '¶12(b)', dataType: 'Quantitative', obligation: 'IA', obligationNote: 'Only if the undertaking has such activities', text: 'Significant CapEx amounts invested in coal, oil and gas activities (NACE codes B.05, B.06, C.19, D.35.1).' },
      { paraRef: '¶12(c)', dataType: 'Narrative', obligation: 'CM', text: 'Information about key assumptions and dependencies on which the plan relies.' },
      { paraRef: '¶12(d)', dataType: 'Narrative', obligation: 'CM', text: 'A qualitative assessment and explanation of how potential locked-in GHG emissions from key physical assets and products may jeopardise the achievement of the plan and drive transition risk.' },
      { paraRef: '¶12(e)', dataType: 'Narrative', obligation: 'CM', text: 'An explanation of the progress in implementing the transition plan.' },
    ],
  },
  {
    drId: 'ESRS-E1-4', framework: 'ESRS', standardLabel: 'ESRS E1 — Climate change', drTitle: 'E1-6 Targets related to climate change', preAdoption: true,
    paragraphs: [
      { paraRef: '¶23', dataType: 'Quantitative / Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-T', text: 'Climate change targets set by the undertaking including scope, baseline and time horizons.' },
      { paraRef: '¶24(a)', dataType: 'Quantitative', obligation: 'CM', text: 'GHG emission reduction targets: whether absolute or intensity, base year, Scope 1/2/3 coverage.' },
      { paraRef: '¶24(b)', dataType: 'Quantitative / Narrative', obligation: 'CM', text: 'If the scope of GHG targets diverges from the scope of the GHG inventory, the percentages of Scope 1, 2 and 3 covered by the target and GHGs covered.' },
      { paraRef: '¶24(c)', dataType: 'Binary / Narrative', obligation: 'CM', text: 'Whether GHG targets are science-based and compatible with a 1.5°C pathway or, if not, an explanation of the inconsistency, and an explanation of future developments considered.' },
    ],
  },
  {
    drId: 'ESRS-E1-6', framework: 'ESRS', standardLabel: 'ESRS E1 — Climate change', drTitle: 'E1-8 Gross Scopes 1, 2, 3 and total GHG emissions', preAdoption: true,
    paragraphs: [
      { paraRef: '¶30(a)(i)', dataType: 'Quantitative', obligation: 'CM', text: 'Gross Scope 1 GHG emissions (tCO₂e), including percentage from EU ETS.' },
      { paraRef: '¶30(a)(ii)', dataType: 'Quantitative', obligation: 'CM', text: 'Gross Scope 2 GHG emissions — location-based and market-based (tCO₂e).' },
      { paraRef: '¶30(a)(iii)', dataType: 'Quantitative', obligation: 'CM', phaseIn: 'FY2026–2028 phase-in; estimates / sectoral data permitted', text: 'Gross Scope 3 GHG emissions from each significant category (tCO₂e), per the 15 GHG Protocol categories.' },
      { paraRef: '¶30(b)', dataType: 'Narrative', obligation: 'CM', text: 'Approach used to measure GHG emissions (GHG Protocol, ISO 14064-1, etc.).' },
      { paraRef: '¶31', dataType: 'Quantitative', obligation: 'CM', obligationNote: 'Must be shown separately from fossil Scope 1', text: 'Direct biogenic CO₂ emissions from combustion or biodegradation of biomass — disclosed separately from Scope 1.' },
    ],
  },
  {
    drId: 'ESRS-E1-8', framework: 'ESRS', standardLabel: 'ESRS E1 — Climate change', drTitle: 'E1-10 Internal carbon pricing', preAdoption: true,
    paragraphs: [
      { paraRef: '¶37(a)', dataType: 'Narrative', obligation: 'IA', text: 'An explanation of whether and how carbon pricing is applied in decision-making and the consistency of the prices used versus the prices used in the financial statements for impairment tests.' },
      { paraRef: '¶37(b)', dataType: 'Quantitative', obligation: 'IA', text: 'Carbon price per tCO₂e applied for each internal pricing scheme.' },
    ],
  },
  {
    drId: 'ESRS-E1-9', framework: 'ESRS', standardLabel: 'ESRS E1 — Climate change', drTitle: 'E1-11 Anticipated financial effects from material physical and transition risks and potential climate-related opportunities', preAdoption: true,
    paragraphs: [
      { paraRef: '¶39(a)', dataType: 'Quantitative', obligation: 'CM', phaseIn: 'Wave 1: may omit until FY2027, quantitative until FY2030; others: may omit for first year', text: 'Anticipated financial effects from material physical risks: carrying amounts of assets/revenue at risk before considering climate change adaptation actions and relevant time horizons.' },
      { paraRef: '¶40(a)', dataType: 'Quantitative', obligation: 'CM', phaseIn: 'Wave 1: may omit quantitative prior to FY2030; others: first three years', text: 'Anticipated financial effects from material transition risks: carrying amounts of assets at risk, relevant time horizons and range of potential stranded assets.' },
      { paraRef: '¶42', dataType: 'Quantitative', obligation: 'CM', phaseIn: 'Wave 1: may omit quantitative prior to FY2030; others: first three years', text: 'Amount and percentage of assets or revenue from climate-related opportunities, including time horizons.' },
    ],
  },
  {
    drId: 'ESRS-E2-1', framework: 'ESRS', standardLabel: 'ESRS E2 — Pollution', drTitle: 'E2-1 Policies related to pollution', preAdoption: true,
    paragraphs: [
      { paraRef: '¶11', dataType: 'Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-P', text: 'Pollution-related policies covering prevention and control across air, water and soil, including policy commitments.' },
    ],
  },
  {
    drId: 'ESRS-E2-2', framework: 'ESRS', standardLabel: 'ESRS E2 — Pollution', drTitle: 'E2-2 Actions and resources related to pollution', preAdoption: true,
    paragraphs: [
      { paraRef: '¶12', dataType: 'Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-A', text: 'Key pollution-related actions and resources: pollution prevention, control and remediation measures.' },
    ],
  },
  {
    drId: 'ESRS-E2-4', framework: 'ESRS', standardLabel: 'ESRS E2 — Pollution', drTitle: 'E2-4 Pollution of air, water and soil', preAdoption: true,
    paragraphs: [
      { paraRef: '¶15', dataType: 'Quantitative', obligation: 'CM', obligationNote: 'Pollutants include NOx, SOx, PM, VOCs, HAPs, heavy metals etc. where material', text: 'Amounts of material emissions of pollutants to air, water and soil from own operations (including environmental accidents).' },
    ],
  },
  {
    drId: 'ESRS-G1-1', framework: 'ESRS', standardLabel: 'ESRS G1 — Business conduct', drTitle: 'G1-1 Policies related to business conduct', preAdoption: true,
    paragraphs: [
      { paraRef: '¶7(a)', dataType: 'Narrative', obligation: 'CM', text: 'Statement on whether or not anti-corruption and anti-bribery policies are in place, consistent with the United Nations Convention against Corruption.' },
      { paraRef: '¶7(b)', dataType: 'Narrative', obligation: 'CM', text: 'Statement on whether or not policies on the protection of whistle-blowers are in place.' },
      { paraRef: '¶7(c)', dataType: 'Narrative', obligation: 'CM', text: 'Functions or roles within the undertaking that are most at risk in respect of corruption or bribery.' },
    ],
  },
  {
    drId: 'ESRS-G1-3', framework: 'ESRS', standardLabel: 'ESRS G1 — Business conduct', drTitle: 'G1-3 Prevention and detection of corruption or bribery', preAdoption: true,
    paragraphs: [
      { paraRef: '¶10', dataType: 'Quantitative / Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-T', text: 'Business conduct targets in accordance with ESRS 2 GDR-T.' },
    ],
  },
  {
    drId: 'ESRS-G1-4', framework: 'ESRS', standardLabel: 'ESRS G1 — Business conduct', drTitle: 'G1-4 Confirmed incidents of corruption or bribery', preAdoption: true,
    paragraphs: [
      { paraRef: '¶12', dataType: 'Quantitative', obligation: 'CM', obligationNote: "EC May 2026: 'substantiated' instances only", text: 'Number of convictions and amount of fines for violation of anti-corruption and anti-bribery laws.' },
    ],
  },
  {
    drId: 'ESRS-S1-1', framework: 'ESRS', standardLabel: 'ESRS S1 — Own workforce', drTitle: 'S1-1 Policies related to own workforce', preAdoption: true,
    paragraphs: [
      { paraRef: '¶10', dataType: 'Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-P', text: 'Policies for managing material own-workforce impacts, risks and opportunities, stating whether they cover specific groups within the own workforce or all of the own workforce.' },
      { paraRef: '¶11', dataType: 'Binary', obligation: 'CM', text: 'Whether policies address trafficking in persons, forced labour and child labour.' },
    ],
  },
  {
    drId: 'ESRS-S1-3', framework: 'ESRS', standardLabel: 'ESRS S1 — Own workforce', drTitle: 'S1-13 Health and safety metrics', preAdoption: true,
    paragraphs: [
      { paraRef: '¶37(a)', dataType: 'Quantitative', obligation: 'CM', text: 'Percentage of people in own workforce covered by the occupational safety and health management system based on legal requirements and/or recognised standards or guidelines.' },
      { paraRef: '¶37(b)', dataType: 'Quantitative', obligation: 'CM', obligationNote: 'Subject to legal restrictions', text: 'Number of fatalities from work-related accidents and work-related ill-health.' },
      { paraRef: '¶37(c)', dataType: 'Quantitative', obligation: 'CM', text: 'Number and rate of recordable work-related accidents.' },
    ],
  },
  {
    drId: 'ESRS-S1-14', framework: 'ESRS', standardLabel: 'ESRS S1 — Own workforce', drTitle: 'S1-14 Work-life balance metrics', preAdoption: true,
    paragraphs: [
      { paraRef: '¶39', dataType: 'Quantitative', obligation: 'CM', phaseIn: 'Wave 1: may omit prior to FY2027; others: first financial year', text: 'Percentage of employees entitled to take family-related leave during the reporting period (maternity, paternity, parental, carer’s leave).' },
    ],
  },
  {
    drId: 'ESRS-S2-1', framework: 'ESRS', standardLabel: 'ESRS S2 — Workers in the value chain', drTitle: 'S2-1 Policies related to value chain workers', preAdoption: true,
    paragraphs: [
      { paraRef: '¶10', dataType: 'Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-P', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'Policies for managing material value-chain-worker impacts, risks and opportunities, stating whether they address specific workers or all workers in the value chain.' },
      { paraRef: '¶12', dataType: 'Binary', obligation: 'CM', text: 'Whether the undertaking has a supplier code of conduct.' },
    ],
  },
  {
    drId: 'ESRS-S2-2', framework: 'ESRS', standardLabel: 'ESRS S2 — Workers in the value chain', drTitle: 'S2-2 Processes for engaging with value chain workers', preAdoption: true,
    paragraphs: [
      { paraRef: '¶14', dataType: 'Narrative', obligation: 'CM', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'How the undertaking engages with value chain workers and how their perspectives inform decisions.' },
    ],
  },
  {
    drId: 'ESRS-S2-3', framework: 'ESRS', standardLabel: 'ESRS S2 — Workers in the value chain', drTitle: 'S2-3 Processes to remediate negative impacts and channels for value chain workers to raise concerns', preAdoption: true,
    paragraphs: [
      { paraRef: '¶15', dataType: 'Narrative', obligation: 'CM', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'Grievance / concern-raising channels available to value chain workers and how effectiveness is assessed.' },
    ],
  },
  {
    drId: 'ESRS-S2-4', framework: 'ESRS', standardLabel: 'ESRS S2 — Workers in the value chain', drTitle: 'S2-4 Taking action on material impacts and approaches to managing material risks and pursuing material opportunities', preAdoption: true,
    paragraphs: [
      { paraRef: '¶18(a)', dataType: 'Narrative', obligation: 'CM', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'Key actions to prevent, mitigate, bring to an end, minimise and provide or enable remedy for material negative impacts.' },
    ],
  },
  {
    drId: 'ESRS-S2-5', framework: 'ESRS', standardLabel: 'ESRS S2 — Workers in the value chain', drTitle: 'S2-5 Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities', preAdoption: true,
    paragraphs: [
      { paraRef: '¶20', dataType: 'Quantitative / Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-T', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'Targets relating to material value-chain-worker impacts, risks and opportunities.' },
    ],
  },
  {
    drId: 'ESRS-S3-1', framework: 'ESRS', standardLabel: 'ESRS S3 — Affected communities', drTitle: 'S3-1 Policies related to affected communities', preAdoption: true,
    paragraphs: [
      { paraRef: '¶8', dataType: 'Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-P', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'Policies for managing material affected-community impacts, risks and opportunities, including indigenous-peoples rights provisions.' },
    ],
  },
  {
    drId: 'ESRS-S3-4', framework: 'ESRS', standardLabel: 'ESRS S3 — Affected communities', drTitle: 'S3-4 Taking action on material impacts, and approaches to managing material risks and pursuing material opportunities', preAdoption: true,
    paragraphs: [
      { paraRef: '¶18', dataType: 'Quantitative / Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-T', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'Targets relating to material affected-community impacts, risks and opportunities.' },
    ],
  },
  {
    drId: 'ESRS-S4-1', framework: 'ESRS', standardLabel: 'ESRS S4 — Consumers and end-users', drTitle: 'S4-1 Policies related to consumers and end-users', preAdoption: true,
    paragraphs: [
      { paraRef: '¶9', dataType: 'Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-P', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'Policies for managing material consumer and end-user impacts, risks and opportunities.' },
    ],
  },
  {
    drId: 'ESRS-S4-4', framework: 'ESRS', standardLabel: 'ESRS S4 — Consumers and end-users', drTitle: 'S4-4 Taking action on material impacts, and approaches to managing material risks and pursuing material opportunities', preAdoption: true,
    paragraphs: [
      { paraRef: '¶17', dataType: 'Quantitative / Narrative', obligation: 'CM', obligationNote: 'Via ESRS 2 GDR-T', phaseIn: 'Wave 1: may omit prior to FY2027; others: first two financial years', text: 'Targets relating to material consumer and end-user impacts, risks and opportunities.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// IFRS S1 (General Requirements) + IFRS S2 (Climate) — final / effective.
// No pre-adoption caveat. Verbatim from the IFRS S1/S2 checklist (Q2b).
// ---------------------------------------------------------------------------

const IFRS: StandardExtract[] = [
  {
    drId: 'ISSB-S1-5', framework: 'ISSB', standardLabel: 'IFRS S1 — General requirements', drTitle: 'IFRS S1 Location of disclosures & sources of guidance',
    paragraphs: [
      { paraRef: 'IFRS S1.59', dataType: 'Narrative', obligation: 'M', text: 'Identify the specific standards, pronouncements, industry practice and other sources of guidance that the entity has applied in preparing its sustainability-related financial disclosures, including, if applicable, identifying the disclosure topics in the SASB Standards; and the industry(s) specified in the IFRS Sustainability Disclosure Standards, the SASB Standards or other sources of guidance relating to a particular industry(s) that the entity has applied, including in identifying applicable metrics.' },
      { paraRef: 'IFRS S1.60', dataType: 'Narrative', obligation: 'M', text: 'Provide disclosures required by IFRS Sustainability Disclosure Standards as part of the entity’s general purpose financial reports.' },
    ],
  },
  {
    drId: 'ISSB-S1-26', framework: 'ISSB', standardLabel: 'IFRS S1 — General requirements', drTitle: 'IFRS S1 Governance',
    paragraphs: [
      { paraRef: 'IFRS S1.27(a)', dataType: 'Narrative', obligation: 'M', text: 'Identify the governance body(ies) or individual(s) responsible for oversight of sustainability-related risks and opportunities, and disclose how it reflects responsibilities in terms of reference/mandates/role descriptions; determines whether appropriate skills and competencies are available or will be developed; is informed about sustainability-related risks and opportunities (including how often); takes them into account when overseeing strategy, major transactions and risk management; and oversees the setting of, and monitors progress towards, related targets, including whether and how related performance metrics are included in remuneration policies.' },
      { paraRef: 'IFRS S1.27(b)', dataType: 'Narrative', obligation: 'M', text: 'Disclose management’s role in the governance processes, controls and procedures used to monitor, manage and oversee sustainability-related risks and opportunities, including whether the role is delegated to a specific management-level position or committee and how oversight is exercised, and whether management uses controls and procedures to support the oversight and how these are integrated with other internal functions.' },
    ],
  },
  {
    drId: 'ISSB-S1-27', framework: 'ISSB', standardLabel: 'IFRS S1 — General requirements', drTitle: 'IFRS S1 Strategy',
    paragraphs: [
      { paraRef: 'IFRS S1.29(a), 30', dataType: 'Narrative', obligation: 'M', text: 'Disclose the sustainability-related risks and opportunities that could reasonably be expected to affect the entity’s prospects; the time horizons (short, medium, long term) over which the effects could reasonably be expected to occur; and how the entity defines "short term", "medium term" and "long term" and how these definitions link to the planning horizons used for strategic decision-making.' },
    ],
  },
  {
    drId: 'ISSB-S1-28', framework: 'ISSB', standardLabel: 'IFRS S1 — General requirements', drTitle: 'IFRS S1 Business model and value chain',
    paragraphs: [
      { paraRef: 'IFRS S1.29(b), 32', dataType: 'Narrative', obligation: 'M', text: 'Disclose the current and anticipated effects of sustainability-related risks and opportunities on the entity’s business model and value chain, and where in the business model and value chain they are concentrated (e.g. geographical areas, facilities and types of assets).' },
    ],
  },
  {
    drId: 'ISSB-S1-29', framework: 'ISSB', standardLabel: 'IFRS S1 — General requirements', drTitle: 'IFRS S1 Strategy and decision-making',
    paragraphs: [
      { paraRef: 'IFRS S1.29(c), 33', dataType: 'Narrative', obligation: 'M', text: 'Disclose how the entity has responded to, and plans to respond to, sustainability-related risks and opportunities in its strategy and decision-making; the progress against plans disclosed in previous reporting periods (quantitative and qualitative); and trade-offs between sustainability-related risks and opportunities that the entity considered.' },
    ],
  },
  {
    drId: 'ISSB-S2-5', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Governance — objective',
    paragraphs: [
      { paraRef: 'IFRS S2.5', dataType: 'Narrative', obligation: 'M', text: 'The objective of climate-related financial disclosures on governance is to enable users of general purpose financial reports to understand the governance processes, controls and procedures an entity uses to monitor, manage and oversee climate-related risks and opportunities.' },
    ],
  },
  {
    drId: 'ISSB-S2-6', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Governance body & management role',
    paragraphs: [
      { paraRef: 'IFRS S2.6(a)', dataType: 'Narrative', obligation: 'M', text: 'Identify the governance body(ies) or individual(s) responsible for oversight of climate-related risks and opportunities, and disclose how it reflects responsibilities in terms of reference/mandates; determines whether appropriate skills and competencies are available or will be developed; is informed about climate-related risks and opportunities (and how often); takes them into account when overseeing strategy, major transactions and risk management; and oversees the setting of, and monitors progress towards, climate-related targets, including whether and how related performance metrics are included in remuneration policies.' },
      { paraRef: 'IFRS S2.6(b)', dataType: 'Narrative', obligation: 'M', text: 'Disclose management’s role in the governance processes, controls and procedures used to monitor, manage and oversee climate-related risks and opportunities, including whether the role is delegated to a specific management-level position or committee and how oversight is exercised over that position or committee, and whether management uses controls and procedures to support the oversight and how these are integrated with other internal functions.' },
    ],
  },
  {
    drId: 'ISSB-S2-8', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Strategy — climate-related risks and opportunities',
    paragraphs: [
      { paraRef: 'IFRS S2.9(a), 10', dataType: 'Narrative', obligation: 'M', text: 'Disclose a description of the climate-related risks and opportunities that could reasonably be expected to affect the entity’s prospects; for each risk, whether it is a physical or a transition risk; over which time horizons (short, medium, long term) the effects could reasonably be expected to occur; and how the entity defines "short term", "medium term" and "long term" and how these definitions link to its strategic-decision planning horizons.' },
    ],
  },
  {
    drId: 'ISSB-S2-10', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Business model and value chain',
    paragraphs: [
      { paraRef: 'IFRS S2.9(b), 13', dataType: 'Narrative', obligation: 'M', text: 'Disclose the current and anticipated effects of climate-related risks and opportunities on the entity’s business model and value chain, and where in the business model and value chain they are concentrated (e.g. geographical areas, facilities and types of assets).' },
    ],
  },
  {
    drId: 'ISSB-S2-14', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Strategy and decision-making / transition plan',
    paragraphs: [
      { paraRef: 'IFRS S2.9(c), 14(a)', dataType: 'Narrative', obligation: 'M', text: 'Disclose how the entity has responded to, and plans to respond to, climate-related risks and opportunities in its strategy and decision-making, including current and anticipated changes to the business model and resource allocation; direct and indirect mitigation and adaptation efforts; any climate-related transition plan (including key assumptions and dependencies); and how the entity plans to achieve any climate-related targets, including greenhouse gas emissions targets.' },
    ],
  },
  {
    drId: 'ISSB-S2-29', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Greenhouse gas emissions',
    paragraphs: [
      { paraRef: 'IFRS S2.29(a)(i)', dataType: 'Quantitative', obligation: 'M', text: 'Disclose absolute gross greenhouse gas emissions generated during the reporting period, expressed as metric tonnes of CO₂ equivalent, classified as Scope 1, Scope 2 and Scope 3 greenhouse gas emissions.' },
      { paraRef: 'IFRS S2.29(a)(v)', dataType: 'Quantitative', obligation: 'M', text: 'For Scope 2 greenhouse gas emissions, disclose location-based Scope 2 greenhouse gas emissions, and provide information about any contractual instruments necessary to inform users’ understanding of the entity’s Scope 2 greenhouse gas emissions.' },
      { paraRef: 'IFRS S2.29(a)(vi)(1)', dataType: 'Narrative', obligation: 'M', text: 'For Scope 3 greenhouse gas emissions, disclose the categories included within the entity’s measure of Scope 3 greenhouse gas emissions, in accordance with the Scope 3 categories described in the Greenhouse Gas Protocol Corporate Value Chain (Scope 3) Accounting and Reporting Standard (2011).' },
    ],
  },
  {
    drId: 'ISSB-S2-33', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Climate-related targets',
    paragraphs: [
      { paraRef: 'IFRS S2.33', dataType: 'Quantitative / Narrative', obligation: 'M', text: 'Disclose the quantitative and qualitative climate-related targets set to monitor progress towards strategic goals, and any targets required by law or regulation, including GHG emissions targets. For each target disclose: the metric used; the objective (e.g. mitigation, adaptation, conformance with science-based initiatives); the part of the entity to which it applies; the period over which it applies; the base period; milestones and interim targets; whether it is absolute or intensity; and how the latest international agreement on climate change has informed the target.' },
      { paraRef: 'IFRS S2.36', dataType: 'Narrative / Quantitative', obligation: 'M', text: 'For each GHG emissions target, disclose which gases are covered; whether Scope 1, 2 or 3 are covered; whether it is gross or net (disclosing the associated gross target if net); whether it was derived using a sectoral decarbonisation approach; and the planned use of carbon credits to offset emissions, including the extent of reliance, verification schemes, credit type and factors relevant to credibility and integrity.' },
    ],
  },
  {
    drId: 'ISSB-S2-36', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Cross-industry metric — remuneration',
    paragraphs: [
      { paraRef: 'IFRS S2.29(g)', dataType: 'Narrative / Quantitative', obligation: 'M', text: 'Disclose a description of whether and how climate-related considerations are factored into executive remuneration, and the percentage of executive management remuneration recognised in the current period that is linked to climate-related considerations.' },
    ],
  },
  {
    drId: 'ISSB-S2-40', framework: 'ISSB', standardLabel: 'IFRS S2 — Climate', drTitle: 'IFRS S2 Financial position, performance and cash flows',
    paragraphs: [
      { paraRef: 'IFRS S2.16', dataType: 'Narrative / Quantitative', obligation: 'M', text: 'Disclose how climate-related risks and opportunities have affected the entity’s financial position, financial performance and cash flows for the reporting period; those for which there is a significant risk of a material adjustment within the next annual reporting period to the carrying amounts of assets and liabilities; how the entity expects its financial position to change over the short, medium and long term given its strategy; and how it expects its financial performance and cash flows to change over the short, medium and long term.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// GRI / TCFD / MSA / NTA — authored from the PUBLIC standards (2026-07-15).
// These frameworks' verbatim text was not in the customer files, so the text
// below is authored from the publicly available standards and each extract
// carries a `sourceNote` making the provenance explicit. To be reconciled
// against the customer's own copies when provided.
// ---------------------------------------------------------------------------

const GRI_SOURCE = 'Authored from the public GRI Standards (GRI 300/400 series, 2021 updates). Pending reconciliation against the customer’s controlled copy.';
const GRI: StandardExtract[] = [
  {
    drId: 'GRI-302-1', framework: 'GRI', standardLabel: 'GRI 302 — Energy (2016)', drTitle: '302-1 Energy consumption within the organization', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '302-1(a)', dataType: 'Quantitative', text: 'Total fuel consumption within the organization from non-renewable sources, in joules or multiples, including fuel types used.' },
      { paraRef: '302-1(b)', dataType: 'Quantitative', text: 'Total fuel consumption within the organization from renewable sources, in joules or multiples, including fuel types used.' },
      { paraRef: '302-1(c)', dataType: 'Quantitative', text: 'In joules, watt-hours or multiples, the total: electricity consumption, heating consumption, cooling consumption, and steam consumption.' },
      { paraRef: '302-1(e)', dataType: 'Quantitative', text: 'Total energy consumption within the organization, in joules or multiples.' },
      { paraRef: '302-1(g)', dataType: 'Narrative', text: 'Standards, methodologies, assumptions, and/or calculation tools used, and the source of the conversion factors used.' },
    ],
  },
  {
    drId: 'GRI-302-3', framework: 'GRI', standardLabel: 'GRI 302 — Energy (2016)', drTitle: '302-3 Energy intensity', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '302-3(a)', dataType: 'Quantitative', text: 'Energy intensity ratio for the organization.' },
      { paraRef: '302-3(b)', dataType: 'Narrative', text: 'Organization-specific metric (the denominator) chosen to calculate the ratio.' },
      { paraRef: '302-3(c)', dataType: 'Narrative', text: 'Types of energy included in the intensity ratio: fuel, electricity, heating, cooling, steam, or all.' },
      { paraRef: '302-3(d)', dataType: 'Narrative', text: 'Whether the ratio uses energy consumed within the organization, outside of it, or both.' },
    ],
  },
  {
    drId: 'GRI-303-3', framework: 'GRI', standardLabel: 'GRI 303 — Water and Effluents (2018)', drTitle: '303-3 Water withdrawal', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '303-3(a)', dataType: 'Quantitative', text: 'Total water withdrawal from all areas in megalitres, and a breakdown of this total by the following sources, if applicable: surface water; groundwater; seawater; produced water; third-party water.' },
      { paraRef: '303-3(b)', dataType: 'Quantitative', text: 'Total water withdrawal from all areas with water stress in megalitres, and a breakdown of this total by source.' },
      { paraRef: '303-3(c)', dataType: 'Quantitative', text: 'A breakdown of total water withdrawal from each of the sources by the following categories, in megalitres: freshwater (≤1,000 mg/L Total Dissolved Solids); other water (>1,000 mg/L Total Dissolved Solids).' },
    ],
  },
  {
    drId: 'GRI-305-1', framework: 'GRI', standardLabel: 'GRI 305 — Emissions (2016)', drTitle: '305-1 Direct (Scope 1) GHG emissions', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '305-1(a)', dataType: 'Quantitative', text: 'Gross direct (Scope 1) GHG emissions in metric tons of CO₂ equivalent.' },
      { paraRef: '305-1(b)', dataType: 'Narrative', text: 'Gases included in the calculation (whether CO₂, CH₄, N₂O, HFCs, PFCs, SF₆, NF₃, or all).' },
      { paraRef: '305-1(e)', dataType: 'Narrative', text: 'Consolidation approach for emissions: equity share, financial control, or operational control.' },
      { paraRef: '305-1(f)', dataType: 'Narrative', text: 'Standards, methodologies, assumptions, and/or calculation tools used.' },
    ],
  },
  {
    drId: 'GRI-305-2', framework: 'GRI', standardLabel: 'GRI 305 — Emissions (2016)', drTitle: '305-2 Energy indirect (Scope 2) GHG emissions', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '305-2(a)', dataType: 'Quantitative', text: 'Gross location-based energy indirect (Scope 2) GHG emissions in metric tons of CO₂ equivalent.' },
      { paraRef: '305-2(b)', dataType: 'Quantitative', text: 'If applicable, gross market-based energy indirect (Scope 2) GHG emissions in metric tons of CO₂ equivalent.' },
      { paraRef: '305-2(c)', dataType: 'Narrative', text: 'If available, the gases included in the calculation.' },
    ],
  },
  {
    drId: 'GRI-305-3', framework: 'GRI', standardLabel: 'GRI 305 — Emissions (2016)', drTitle: '305-3 Other indirect (Scope 3) GHG emissions', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '305-3(a)', dataType: 'Quantitative', text: 'Gross other indirect (Scope 3) GHG emissions in metric tons of CO₂ equivalent.' },
      { paraRef: '305-3(b)', dataType: 'Narrative', text: 'If available, the gases included in the calculation.' },
      { paraRef: '305-3(d)', dataType: 'Narrative', text: 'Other indirect (Scope 3) GHG emissions categories and activities included in the calculation.' },
    ],
  },
  {
    drId: 'GRI-306-3', framework: 'GRI', standardLabel: 'GRI 306 — Waste (2020)', drTitle: '306-3 Waste generated', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '306-3(a)', dataType: 'Quantitative', text: 'Total weight of waste generated in metric tons, and a breakdown of this total by composition of the waste.' },
      { paraRef: '306-3(b)', dataType: 'Narrative', text: 'Contextual information necessary to understand the data and how it has been compiled.' },
    ],
  },
  {
    drId: 'GRI-403-9', framework: 'GRI', standardLabel: 'GRI 403 — Occupational Health and Safety (2018)', drTitle: '403-9 Work-related injuries', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '403-9(a)', dataType: 'Quantitative', text: 'For all employees: the number and rate of fatalities as a result of work-related injury; the number and rate of high-consequence work-related injuries (excluding fatalities); the number and rate of recordable work-related injuries; the main types of work-related injury; and the number of hours worked.' },
      { paraRef: '403-9(b)', dataType: 'Quantitative', text: 'The same metrics for all workers who are not employees but whose work and/or workplace is controlled by the organization.' },
      { paraRef: '403-9(g)', dataType: 'Narrative', text: 'The rate calculation basis (200,000 or 1,000,000 hours worked).' },
    ],
  },
  {
    drId: 'GRI-404-1', framework: 'GRI', standardLabel: 'GRI 404 — Training and Education (2016)', drTitle: '404-1 Average hours of training per year per employee', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '404-1(a)', dataType: 'Quantitative', text: 'Average hours of training that the organization’s employees have undertaken during the reporting period, by gender and by employee category.' },
    ],
  },
  {
    drId: 'GRI-405-1', framework: 'GRI', standardLabel: 'GRI 405 — Diversity and Equal Opportunity (2016)', drTitle: '405-1 Diversity of governance bodies and employees', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '405-1(a)', dataType: 'Quantitative', text: 'Percentage of individuals within the organization’s governance bodies in each of the following diversity categories: gender; age group (under 30 / 30–50 / over 50); and other indicators of diversity where relevant.' },
      { paraRef: '405-1(b)', dataType: 'Quantitative', text: 'Percentage of employees per employee category in each of the same diversity categories.' },
    ],
  },
  {
    drId: 'GRI-405-2', framework: 'GRI', standardLabel: 'GRI 405 — Diversity and Equal Opportunity (2016)', drTitle: '405-2 Ratio of basic salary and remuneration of women to men', sourceNote: GRI_SOURCE,
    paragraphs: [
      { paraRef: '405-2(a)', dataType: 'Quantitative', text: 'Ratio of the basic salary and remuneration of women to men for each employee category, by significant locations of operation.' },
      { paraRef: '405-2(b)', dataType: 'Narrative', text: 'The definition used for "significant locations of operation".' },
    ],
  },
];

const TCFD_SOURCE = 'Authored from the public TCFD Recommendations (Final Report, June 2017; 2021 Annex). Note: TCFD is superseded by ISSB IFRS S2 for many jurisdictions — see the mapped ISSB datapoints.';
const TCFD: StandardExtract[] = [
  {
    drId: 'TCFD-GOV-a', framework: 'TCFD', standardLabel: 'TCFD — Governance', drTitle: 'Governance (a) Board oversight', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Gov a', dataType: 'Narrative', text: 'Describe the board’s oversight of climate-related risks and opportunities — including the processes and frequency by which the board is informed, whether it considers climate issues when reviewing strategy, major plans, budgets and performance, and how it monitors progress against targets.' },
    ],
  },
  {
    drId: 'TCFD-GOV-b', framework: 'TCFD', standardLabel: 'TCFD — Governance', drTitle: 'Governance (b) Management role', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Gov b', dataType: 'Narrative', text: 'Describe management’s role in assessing and managing climate-related risks and opportunities — including assigned responsibilities, organizational structures, processes by which management is informed, and how climate issues are monitored.' },
    ],
  },
  {
    drId: 'TCFD-STR-a', framework: 'TCFD', standardLabel: 'TCFD — Strategy', drTitle: 'Strategy (a) Risks and opportunities identified', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Str a', dataType: 'Narrative', text: 'Describe the climate-related risks and opportunities the organization has identified over the short, medium and long term, including a description of what the organization considers to be the relevant time horizons.' },
    ],
  },
  {
    drId: 'TCFD-STR-b', framework: 'TCFD', standardLabel: 'TCFD — Strategy', drTitle: 'Strategy (b) Impact on strategy and financial planning', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Str b', dataType: 'Narrative', text: 'Describe the impact of climate-related risks and opportunities on the organization’s businesses, strategy, and financial planning (products and services, supply chain, adaptation and mitigation activities, investment in R&D, and operations).' },
    ],
  },
  {
    drId: 'TCFD-STR-c', framework: 'TCFD', standardLabel: 'TCFD — Strategy', drTitle: 'Strategy (c) Resilience under scenarios', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Str c', dataType: 'Narrative', text: 'Describe the resilience of the organization’s strategy, taking into consideration different climate-related scenarios, including a 2°C or lower scenario.' },
    ],
  },
  {
    drId: 'TCFD-RISK-a', framework: 'TCFD', standardLabel: 'TCFD — Risk Management', drTitle: 'Risk Management (a) Identifying and assessing risks', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Risk a', dataType: 'Narrative', text: 'Describe the organization’s processes for identifying and assessing climate-related risks, including how significance is determined relative to other risks.' },
    ],
  },
  {
    drId: 'TCFD-RISK-b', framework: 'TCFD', standardLabel: 'TCFD — Risk Management', drTitle: 'Risk Management (b) Managing risks', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Risk b', dataType: 'Narrative', text: 'Describe the organization’s processes for managing climate-related risks, including how it makes decisions to mitigate, transfer, accept or control those risks.' },
    ],
  },
  {
    drId: 'TCFD-RISK-c', framework: 'TCFD', standardLabel: 'TCFD — Risk Management', drTitle: 'Risk Management (c) Integration into overall risk management', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Risk c', dataType: 'Narrative', text: 'Describe how processes for identifying, assessing and managing climate-related risks are integrated into the organization’s overall risk management.' },
    ],
  },
  {
    drId: 'TCFD-MET-a', framework: 'TCFD', standardLabel: 'TCFD — Metrics and Targets', drTitle: 'Metrics & Targets (a) Metrics used', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Met a', dataType: 'Quantitative / Narrative', text: 'Disclose the metrics used by the organization to assess climate-related risks and opportunities in line with its strategy and risk management process.' },
    ],
  },
  {
    drId: 'TCFD-MET-b', framework: 'TCFD', standardLabel: 'TCFD — Metrics and Targets', drTitle: 'Metrics & Targets (b) Scope 1, 2, 3 GHG emissions', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Met b', dataType: 'Quantitative', text: 'Disclose Scope 1, Scope 2, and, if appropriate, Scope 3 greenhouse gas (GHG) emissions and the related risks.' },
    ],
  },
  {
    drId: 'TCFD-MET-c', framework: 'TCFD', standardLabel: 'TCFD — Metrics and Targets', drTitle: 'Metrics & Targets (c) Targets and performance', sourceNote: TCFD_SOURCE,
    paragraphs: [
      { paraRef: 'Met c', dataType: 'Quantitative / Narrative', text: 'Describe the targets used by the organization to manage climate-related risks and opportunities and performance against targets.' },
    ],
  },
];

const MSA_SOURCE = 'Authored from the public statutory requirements — UK Modern Slavery Act 2015 s.54(5), Canada Fighting Against Forced Labour and Child Labour in Supply Chains Act 2024 s.11, and Australia Modern Slavery Act 2018 s.16. Pending reconciliation against the customer’s legal copy.';
const MSA: StandardExtract[] = [
  {
    drId: 'MSA-UK-1', framework: 'MSA', standardLabel: 'UK Modern Slavery Act 2015 — s.54', drTitle: 'Organisation structure, business and supply chains', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.54(5)(a)', dataType: 'Narrative', text: 'The organisation’s structure, its business and its supply chains.' },
    ],
  },
  {
    drId: 'MSA-UK-2', framework: 'MSA', standardLabel: 'UK Modern Slavery Act 2015 — s.54', drTitle: 'Policies in relation to slavery and human trafficking', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.54(5)(b)', dataType: 'Narrative', text: 'The organisation’s policies in relation to slavery and human trafficking.' },
    ],
  },
  {
    drId: 'MSA-UK-3', framework: 'MSA', standardLabel: 'UK Modern Slavery Act 2015 — s.54', drTitle: 'Due diligence processes', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.54(5)(c)', dataType: 'Narrative', text: 'The organisation’s due diligence processes in relation to slavery and human trafficking in its business and supply chains.' },
    ],
  },
  {
    drId: 'MSA-UK-4', framework: 'MSA', standardLabel: 'UK Modern Slavery Act 2015 — s.54', drTitle: 'Risk assessment and management', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.54(5)(d)', dataType: 'Narrative', text: 'The parts of its business and supply chains where there is a risk of slavery and human trafficking taking place, and the steps it has taken to assess and manage that risk.' },
    ],
  },
  {
    drId: 'MSA-UK-5', framework: 'MSA', standardLabel: 'UK Modern Slavery Act 2015 — s.54', drTitle: 'Effectiveness — performance indicators', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.54(5)(e)', dataType: 'Narrative / Quantitative', text: 'Its effectiveness in ensuring that slavery and human trafficking is not taking place in its business or supply chains, measured against such performance indicators as it considers appropriate.' },
    ],
  },
  {
    drId: 'MSA-UK-6', framework: 'MSA', standardLabel: 'UK Modern Slavery Act 2015 — s.54', drTitle: 'Training on modern slavery', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.54(5)(f)', dataType: 'Narrative', text: 'The training about slavery and human trafficking available to its staff.' },
    ],
  },
  {
    drId: 'MSA-CA-1', framework: 'MSA', standardLabel: 'Canada Forced/Child Labour Act 2024 — s.11(3)', drTitle: 'Structure, activities and supply chains', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.11(3)(a)', dataType: 'Narrative', text: 'The entity’s structure, activities and supply chains.' },
    ],
  },
  {
    drId: 'MSA-CA-2', framework: 'MSA', standardLabel: 'Canada Forced/Child Labour Act 2024 — s.11(3)', drTitle: 'Policies and due diligence — forced and child labour', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.11(3)(b)', dataType: 'Narrative', text: 'Its policies and due diligence processes in relation to forced labour and child labour.' },
    ],
  },
  {
    drId: 'MSA-CA-3', framework: 'MSA', standardLabel: 'Canada Forced/Child Labour Act 2024 — s.11(3)', drTitle: 'Risk of forced and child labour and remediation', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.11(3)(c)', dataType: 'Narrative', text: 'The parts of its activities and supply chains that carry a risk of forced labour or child labour being used, and the steps it has taken to assess and manage that risk.' },
      { paraRef: 's.11(3)(d)–(e)', dataType: 'Narrative', text: 'Any measures taken to remediate forced/child labour, and to remediate the loss of income to the most vulnerable families resulting from measures taken to eliminate the use of forced or child labour.' },
    ],
  },
  {
    drId: 'MSA-CA-4', framework: 'MSA', standardLabel: 'Canada Forced/Child Labour Act 2024 — s.11(3)', drTitle: 'Training and effectiveness assessment', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.11(3)(f)', dataType: 'Narrative', text: 'The training provided to employees on forced labour and child labour.' },
      { paraRef: 's.11(3)(g)', dataType: 'Narrative', text: 'How the entity assesses its effectiveness in ensuring that forced labour and child labour are not being used in its activities and supply chains.' },
    ],
  },
  {
    drId: 'MSA-AU-1', framework: 'MSA', standardLabel: 'Australia Modern Slavery Act 2018 — s.16', drTitle: 'Identify the reporting entity', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.16(1)(a)', dataType: 'Narrative', text: 'Identify the reporting entity.' },
    ],
  },
  {
    drId: 'MSA-AU-2', framework: 'MSA', standardLabel: 'Australia Modern Slavery Act 2018 — s.16', drTitle: 'Structure, operations and supply chains', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.16(1)(b)', dataType: 'Narrative', text: 'Describe the structure, operations and supply chains of the reporting entity.' },
    ],
  },
  {
    drId: 'MSA-AU-3', framework: 'MSA', standardLabel: 'Australia Modern Slavery Act 2018 — s.16', drTitle: 'Modern slavery risks in operations and supply chains', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.16(1)(c)', dataType: 'Narrative', text: 'Describe the risks of modern slavery practices in the operations and supply chains of the reporting entity and any entities it owns or controls.' },
    ],
  },
  {
    drId: 'MSA-AU-4', framework: 'MSA', standardLabel: 'Australia Modern Slavery Act 2018 — s.16', drTitle: 'Actions taken to assess and address risks', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.16(1)(d)', dataType: 'Narrative', text: 'Describe the actions taken by the reporting entity and any entities it owns or controls to assess and address those risks, including due diligence and remediation processes.' },
    ],
  },
  {
    drId: 'MSA-AU-5', framework: 'MSA', standardLabel: 'Australia Modern Slavery Act 2018 — s.16', drTitle: 'Assessing effectiveness of actions', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.16(1)(e)', dataType: 'Narrative', text: 'Describe how the reporting entity assesses the effectiveness of such actions.' },
    ],
  },
  {
    drId: 'MSA-AU-6', framework: 'MSA', standardLabel: 'Australia Modern Slavery Act 2018 — s.16', drTitle: 'Consultation with controlled entities', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.16(1)(f)', dataType: 'Narrative', text: 'Describe the process of consultation with any entities the reporting entity owns or controls (and, for a joint statement, the entity giving the statement).' },
    ],
  },
  {
    drId: 'MSA-AU-7', framework: 'MSA', standardLabel: 'Australia Modern Slavery Act 2018 — s.16', drTitle: 'Any other relevant information', sourceNote: MSA_SOURCE,
    paragraphs: [
      { paraRef: 's.16(1)(g)', dataType: 'Narrative', text: 'Provide any other information that the reporting entity, or the entity giving the statement, considers relevant.' },
    ],
  },
];

const NTA_SOURCE = 'Authored from the public Norwegian Transparency Act (åpenhetsloven) 2022 §5, unofficial English translation. Pending reconciliation against the customer’s legal copy.';
const NTA: StandardExtract[] = [
  {
    drId: 'NTA-1', framework: 'NTA', standardLabel: 'Norwegian Transparency Act 2022 — §5', drTitle: 'General description of due diligence organisation', sourceNote: NTA_SOURCE,
    paragraphs: [
      { paraRef: '§5(a)', dataType: 'Narrative', text: 'A general description of the enterprise’s organisation, area of operations, guidelines and procedures for handling actual and potential adverse impacts on fundamental human rights and decent working conditions.' },
    ],
  },
  {
    drId: 'NTA-2', framework: 'NTA', standardLabel: 'Norwegian Transparency Act 2022 — §5', drTitle: 'Actual and significant potential adverse impacts identified', sourceNote: NTA_SOURCE,
    paragraphs: [
      { paraRef: '§5(b)', dataType: 'Narrative', text: 'Information regarding actual adverse impacts and significant risks of adverse impacts that the enterprise has identified through its due diligence.' },
    ],
  },
  {
    drId: 'NTA-3', framework: 'NTA', standardLabel: 'Norwegian Transparency Act 2022 — §5', drTitle: 'Measures implemented and results', sourceNote: NTA_SOURCE,
    paragraphs: [
      { paraRef: '§5(c)', dataType: 'Narrative', text: 'Information regarding measures the enterprise has implemented or plans to implement to cease actual adverse impacts or mitigate significant risks of adverse impacts, and the results or expected results of those measures.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Registry + lookup.
// ---------------------------------------------------------------------------

export const standardExtracts: StandardExtract[] = [...ESRS2, ...ESRS_TOPICAL, ...IFRS, ...GRI, ...TCFD, ...MSA, ...NTA];

const BY_ID: Record<string, StandardExtract> = Object.fromEntries(
  standardExtracts.map(e => [e.drId, e]),
);

/** Verbatim standard text for a DR id, or null if not transcribed (e.g. GRI/TCFD/MSA/NTA). */
export function standardTextFor(drId: string): StandardExtract | null {
  return BY_ID[drId] ?? null;
}
