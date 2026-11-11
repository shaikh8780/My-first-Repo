// Local climate reports — built once, used twice (Adrian, ESG email).
//
// Both the Australian ISSB report (AASB S1/S2) and the UK TCFD report follow the
// SAME logical structure: Novartis's 2023 TCFD disclosure template —
//   A. Introduction
//   B. Governance (B.1 Board oversight, B.2 Management oversight,
//      B.3 Integration into executive compensation)
//   C. Strategy (C.1 Climate strategy & roadmap, C.2 Climate-related targets,
//      C.3 Financial planning & effects, C.4 Climate resilience,
//      C.5 Assessment of climate-related risks & opportunities)
//   D. Risk management
//   E. Metrics and targets
//
// "ISSB follows the same logical structure as TCFD, but has more requirements."
// The extra ISSB/AASB requirements over TCFD are flagged `issbOnly: true` — they
// appear in the Australian ISSB report and are hidden from the UK TCFD report.
//
// Global climate content is authored once in the RNFM (Climate change section)
// and mapped into each local report; `rnfmSource` records where it comes from.

export interface LocalSubsection {
  ref: string;          // e.g. 'B.1'
  title: string;
  narrative: string;
  rnfmSource?: string;  // RNFM section the content is mapped from
  issbOnly?: boolean;   // extra ISSB/AASB requirement — not in the UK TCFD report
}

export interface LocalSection {
  ref: string;          // 'A'..'E'
  title: string;
  subsections: LocalSubsection[];
}

// The shared TCFD/ISSB structure. Narratives are grounded in the Novartis
// climate disclosure (net-zero by 2040, SBTi-validated, GHG Protocol).
export const localReportStructure: LocalSection[] = [
  {
    ref: 'A',
    title: 'Introduction',
    subsections: [
      {
        ref: 'A',
        title: 'Introduction',
        narrative:
          'Sets out the reporting entity and scope, the reporting period, and the framework basis for this climate disclosure. Novartis authors its climate content once in the Report on Nonfinancial Matters (RNFM) and maps it into each local report; only jurisdiction-specific requirements are authored separately.',
        rnfmSource: '8.1 Climate change (intro)',
      },
    ],
  },
  {
    ref: 'B',
    title: 'Governance',
    subsections: [
      {
        ref: 'B.1',
        title: 'Board oversight',
        narrative:
          'The Board oversees climate-related risks and opportunities through its Governance, Sustainability and Nomination Committee and Risk Committee, which review climate strategy, targets and the transition plan and escalate material matters to the full Board.',
        rnfmSource: '7.1 Corporate governance',
      },
      {
        ref: 'B.2',
        title: 'Management oversight',
        narrative:
          'Management responsibility for climate sits with the Executive Committee of Novartis (ECN); ECN members are appointed as risk owners for relevant strategic risks, supported by the environmental sustainability function which tracks progress against the net-zero-by-2040 roadmap.',
        rnfmSource: '7.1 Corporate governance',
      },
      {
        ref: 'B.3',
        title: 'Integration of environmental matters into executive compensation',
        narrative:
          'Environmental sustainability performance is embedded in executive compensation through ESG-linked components of the incentive framework, aligning management reward with delivery of the climate targets.',
        rnfmSource: 'Compensation report / 7.1',
      },
      {
        ref: 'B.4',
        title: 'Governance body skills and competencies',
        narrative:
          'AASB S2/ISSB requires disclosure of how the Board determines whether appropriate skills and competencies to oversee climate-related risks and opportunities are available or will be developed. Not required under the UK TCFD template.',
        rnfmSource: '7.1 Corporate governance',
        issbOnly: true,
      },
    ],
  },
  {
    ref: 'C',
    title: 'Strategy',
    subsections: [
      {
        ref: 'C.1',
        title: 'Climate strategy and roadmap',
        narrative:
          'Novartis is committed to net-zero carbon emissions by 2040, with near- and long-term science-based targets validated by the SBTi in July 2024. The strategy is consistent with limiting global warming to 1.5°C in line with the Paris Agreement, and covers own operations and the supply chain.',
        rnfmSource: '8.1 Climate change',
      },
      {
        ref: 'C.2',
        title: 'Climate-related targets',
        narrative:
          'Gross and net emissions-reduction targets, interim milestones and the reliance on carbon credits are disclosed with progress against baseline, drawn from the RNFM target performance table.',
        rnfmSource: '8.1.5 Table: Climate target performance',
      },
      {
        ref: 'C.3',
        title: 'Financial planning and effects',
        narrative:
          'Describes how climate-related risks and opportunities are factored into financial planning — capital allocation to energy-efficiency and renewable projects, and the anticipated effects of transition initiatives on operating costs.',
        rnfmSource: '8.1 Climate change',
      },
      {
        ref: 'C.4',
        title: 'Climate resilience',
        narrative:
          'Presents climate scenario analysis (including a 1.5°C-aligned scenario) used to test the resilience of the strategy to physical and transition risks over short, medium and long-term horizons.',
        rnfmSource: '8.1.7–8.1.12 Climate risk and resilience',
      },
      {
        ref: 'C.5',
        title: 'Assessment of climate-related risks and opportunities',
        narrative:
          'Identifies the material physical and transition risks and the opportunities (efficiency, renewable energy, sustainable product design) assessed as relevant to Novartis, and how they are prioritised.',
        rnfmSource: '8.1 Climate change',
      },
      {
        ref: 'C.6',
        title: 'Connectivity with the financial statements',
        narrative:
          'AASB S1/S2 and ISSB require the current and anticipated financial effects of climate risks and opportunities to be connected to the related financial statement line items. Not required under the UK TCFD template.',
        rnfmSource: 'Annual Report / 8.1',
        issbOnly: true,
      },
    ],
  },
  {
    ref: 'D',
    title: 'Risk management',
    subsections: [
      {
        ref: 'D',
        title: 'Risk management',
        narrative:
          'Climate-related risks are identified, assessed and managed within the Novartis Enterprise Risk Management (ERM) framework — the same processes used for other strategic risks — with the Board’s Risk Committee providing oversight and the ECN validating the annual risk portfolio.',
        rnfmSource: '8.1.7–8.1.12 Climate risk and resilience',
      },
    ],
  },
  {
    ref: 'E',
    title: 'Metrics and targets',
    subsections: [
      {
        ref: 'E.1',
        title: 'Cross-industry metrics — Scope 1 & 2 GHG',
        narrative:
          'Discloses Scope 1 and Scope 2 greenhouse gas emissions and the cross-industry metrics (energy, GHG intensity), measured under the GHG Protocol.',
        rnfmSource: '8.1.13 Table: Climate Metrics',
      },
      {
        ref: 'E.2',
        title: 'Climate-related targets and performance',
        narrative:
          'Presents the net-zero-2040 target and interim targets with performance against baseline, consistent with the targets described under Strategy.',
        rnfmSource: '8.1.5 Table: Climate target performance',
      },
      {
        ref: 'E.3',
        title: 'Scope 3 GHG emissions by category',
        narrative:
          'AASB S2/ISSB require disclosure of Scope 3 GHG emissions with the relevant Scope 3 categories (first-year relief available). Novartis discloses Scope 3 from global data. The UK TCFD report discloses Scope 3 at a summary level only.',
        rnfmSource: '8.1.13 Table: Climate Metrics',
        issbOnly: true,
      },
      {
        ref: 'E.4',
        title: 'Industry-based metrics',
        narrative:
          'AASB S2/ISSB require industry-based metrics (SASB-based) relevant to the pharmaceutical sector. Not required under the UK TCFD template.',
        rnfmSource: '8.1 Climate change',
        issbOnly: true,
      },
      {
        ref: 'E.5',
        title: 'Carbon credits',
        narrative:
          'AASB S2/ISSB require disclosure of the extent to which, and how, carbon credits are used to meet targets. Not required under the UK TCFD template.',
        rnfmSource: '8.1.5 Table: Climate target performance',
        issbOnly: true,
      },
    ],
  },
];

// Flat structure for the report registry (ParallelSection[]): ref = subsection
// ref, detail = RNFM source (+ "ISSB only" marker). Pass includeIssb=false for
// the UK TCFD report to drop the extra ISSB/AASB requirements.
export function localStructureFlat(includeIssb: boolean) {
  const out: { ref: string; title: string; detail?: string }[] = [];
  for (const sec of localReportStructure) {
    for (const sub of sec.subsections) {
      if (sub.issbOnly && !includeIssb) continue;
      const detail = [sub.rnfmSource ? `RNFM ${sub.rnfmSource}` : null, sub.issbOnly ? 'ISSB only' : null]
        .filter(Boolean)
        .join(' · ');
      out.push({ ref: sub.ref, title: sub.title, detail: detail || undefined });
    }
  }
  return out;
}

export const tcfdUkSubsectionCount = localStructureFlat(false).length;
export const issbAuSubsectionCount = localStructureFlat(true).length;
