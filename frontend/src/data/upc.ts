// H — Update on Public Commitments (UPC) 2026 template.
// Each section has a Targets box (bulleted commitments), a performance table
// with the standard columns, and a ~150–200 word contextualising narrative.
// "xx" marks not-yet-available data. ∆ = in scope for external limited assurance.
// The UPC references the RNFM for methodology (it is not standalone).

export interface UpcPerformanceRow {
  performance: string;
  y2026: string;   // may be "xx" when not yet available
  y2025: string;
  baseYear: string;
  baseline: string;
  targetYear: string;
  target: string;
  progress: string;
  assurance: boolean; // ∆ — in scope for external limited assurance
}

export interface UpcSection {
  ref: string;
  title: string;
  targets: string[];
  columns: string[];
  rows: UpcPerformanceRow[];
  narrative: string;
  rnfmReference: string; // methodology sourced from this RNFM section
}

export const upcColumns = ['Performance', '2026', '2025', 'Base year', 'Baseline', 'Target year', 'Target', 'Progress', '∆'];

export const upcAbout = {
  title: 'About this document',
  body: 'This Update on Public Commitments (UPC) reports progress against Novartis Social Impact & Sustainability (SI&S) public commitments for 2026. It presents, for each commitment area, a summary of targets, a performance table and a short contextualising narrative. Data marked ∆ is in scope for external limited assurance. Methodology and definitions are set out in the Report on Nonfinancial Matters (RNFM); this document is not standalone. Placeholder "xx" indicates data not yet available at time of drafting.',
};

export const upcSections: UpcSection[] = [
  {
    ref: '1',
    title: 'Innovation and access',
    targets: [
      'Reach 200 million patients with our medicines by 2030',
      'Deliver 10 flagship programmes to expand access in low- and middle-income countries',
    ],
    columns: upcColumns,
    rows: [
      { performance: 'Patients reached (million)', y2026: '304', y2025: '295', baseYear: '2020', baseline: '257', targetYear: '2030', target: '200', progress: 'Achieved', assurance: true },
      { performance: 'Flagship access programmes', y2026: '8', y2025: '7', baseYear: '2021', baseline: '3', targetYear: '2030', target: '10', progress: 'On track', assurance: false },
    ],
    narrative: 'In 2026 our medicines reached 304 million patients globally, ahead of our 2030 commitment, driven by volume-based tiered pricing across 85 low- and middle-income countries and expansion of the Novartis Global Health portfolio. We advanced eight flagship access programmes, including voluntary licensing through the Medicines Patent Pool for five products and two new WHO prequalifications. Progress reflects deeper collaboration with governments and civil society to strengthen health systems. Methodology for patient-reach measurement is set out in the RNFM Access to medicines section.',
    rnfmReference: '9.4 Access to medicines',
  },
  {
    ref: '2',
    title: 'Global health',
    targets: [
      'Sustain leprosy and malaria elimination programmes',
      'Treat xx patients through global health flagship programmes by 2030',
    ],
    columns: upcColumns,
    rows: [
      { performance: 'Patients treated — global health flagships (million)', y2026: 'xx', y2025: '58', baseYear: '2020', baseline: '41', targetYear: '2030', target: 'xx', progress: 'In progress', assurance: false },
      { performance: 'Countries with active programmes', y2026: '46', y2025: '44', baseYear: '2020', baseline: '30', targetYear: '2030', target: '55', progress: 'On track', assurance: false },
    ],
    narrative: 'Our global health programmes continued to focus on diseases of poverty, including malaria and leprosy, operating in 46 countries in 2026. Final 2026 patient-treatment figures for the flagship programmes are being consolidated (shown as xx) and will be confirmed following assurance. We maintained zero-profit supply of key treatments and expanded partnerships with global health institutions. Detailed methodology and disease-area definitions are provided in the RNFM.',
    rnfmReference: '9.4 Access to medicines',
  },
  {
    ref: '3',
    title: 'Foundations and giving',
    targets: [
      'Maintain community investment through the Novartis Foundation',
      'Scale digital health interventions in underserved communities',
    ],
    columns: upcColumns,
    rows: [
      { performance: 'Community investment (USD million)', y2026: 'xx', y2025: '32.4', baseYear: '2021', baseline: '28.0', targetYear: '2030', target: '40.0', progress: 'On track', assurance: false },
      { performance: 'People reached via digital health', y2026: '2.1', y2025: '1.7', baseYear: '2021', baseline: '0.6', targetYear: '2030', target: '5.0', progress: 'On track', assurance: false },
    ],
    narrative: 'Through the Novartis Foundation and corporate giving, we continued to invest in community health, with a focus on cardiovascular health and digital interventions in urban underserved populations. Final 2026 community-investment spend is being consolidated (xx). Population health programmes reached 2.1 million people in 2026. Governance of giving and measurement approach are described in the RNFM.',
    rnfmReference: '7.4 Stakeholder engagement',
  },
  {
    ref: '4',
    title: 'Environmental sustainability',
    targets: [
      'Carbon neutral in own operations (Scope 1 & 2) — achieved 2025; maintain',
      'Reduce Scope 3 GHG emissions 42% by 2030 (from 2022)',
      'Achieve water quality Level 2 at all direct-discharge sites',
    ],
    columns: upcColumns,
    rows: [
      { performance: 'Scope 1+2 GHG (1 000 tCO2e)', y2026: '207.2', y2025: '240.4', baseYear: '2022', baseline: '376.5', targetYear: '2030', target: '37.7', progress: '−45%', assurance: true },
      { performance: 'Scope 3 GHG (1 000 tCO2e)', y2026: '4 169.9', y2025: '4 282.2', baseYear: '2022', baseline: '5 024.0', targetYear: '2030', target: '2 913.9', progress: '−17%', assurance: true },
      { performance: 'Water quality — sites at Level 2+', y2026: '97%', y2025: '94%', baseYear: '2021', baseline: '78%', targetYear: '2030', target: '100%', progress: 'On track', assurance: true },
    ],
    narrative: 'We maintained carbon neutrality in our own operations (Scope 1 and 2 from energy) achieved in 2025, and reduced combined Scope 1+2 emissions 45% against the 2022 baseline. Scope 3 emissions fell 17%, driven by supplier engagement on purchased goods and services. 97% of manufacturing sites met Level 2 or above on our water quality maturity ladder. Full methodology, emission factors and assurance scope (∆) are set out in the RNFM Climate change and Pollution of water sections.',
    rnfmReference: '8.1 Climate change (methodology)',
  },
  {
    ref: '5',
    title: 'People',
    targets: [
      'Reach gender balance in management (target 50% women) by 2030',
      'Pay all employees a living wage; close adjusted gender pay gap',
      'Advance employee health and wellbeing',
    ],
    columns: upcColumns,
    rows: [
      { performance: 'Women in management', y2026: '47%', y2025: '45%', baseYear: '2020', baseline: '40%', targetYear: '2030', target: '50%', progress: 'On track', assurance: true },
      { performance: 'Adjusted gender pay gap', y2026: '0.7%', y2025: '0.9%', baseYear: '2021', baseline: '1.4%', targetYear: '2027', target: '<1%', progress: 'Achieved', assurance: true },
      { performance: 'Living wage coverage', y2026: '100%', y2025: '100%', baseYear: '2021', baseline: '96%', targetYear: '2025', target: '100%', progress: 'Achieved', assurance: false },
    ],
    narrative: 'Women held 47% of management roles in 2026, progressing toward our 2030 gender-balance commitment. The adjusted gender pay gap narrowed to 0.7% globally, verified under limited assurance. We sustained 100% living-wage coverage for our workforce. Investment in employee health and safety continued, with lost-time injury rates remaining low. Definitions of "management" and pay-gap methodology are set out in the RNFM Own workforce disclosures.',
    rnfmReference: '9.1 Health & safety workforce',
  },
  {
    ref: '6',
    title: 'Ethical business practices',
    targets: [
      'Maintain zero tolerance for bribery and corruption',
      'Sustain high Code of Ethics training completion and effective Speak Up culture',
    ],
    columns: upcColumns,
    rows: [
      { performance: 'Code of Ethics training completion', y2026: '98%', y2025: '98%', baseYear: '2021', baseline: '95%', targetYear: 'ongoing', target: '≥98%', progress: 'Achieved', assurance: true },
      { performance: 'Substantiated higher-risk bribery allegations', y2026: '0', y2025: '0', baseYear: '2021', baseline: '2', targetYear: 'ongoing', target: '0', progress: 'Achieved', assurance: false },
      { performance: 'Speak Up reports received', y2026: '1 116', y2025: '1 043', baseYear: '2021', baseline: '892', targetYear: 'ongoing', target: 'n/a', progress: 'Monitored', assurance: false },
    ],
    narrative: 'We maintained a zero-tolerance approach to bribery and corruption. Code of Ethics training completion held at 98%, and no higher-risk bribery or kickback allegations were substantiated in 2026. Speak Up volumes rose modestly to 1,116 reports, consistent with a healthy reporting culture; the channel is available in 65+ languages with guaranteed non-retaliation. Governance, investigation and remediation processes are described in the RNFM Business conduct section.',
    rnfmReference: '10.1 Business conduct',
  },
];
