// Peer benchmarking corpus.
//
// FIGURES ARE GROUNDED IN REAL, PUBLISHED PEER REPORTS (verified against the
// companies' official sustainability reports / ESG data pages / CDP disclosures
// and reputable secondary sources). Reporting YEARS DIFFER by company — each
// figure is labelled with its year and must not be read as a same-year
// comparison:
//   - Roche      — Annual Report 2025 (integrated, KPMG-assured); some items via official HTML pages
//   - AstraZeneca — Sustainability Data Annex / Annual Report 2024
//   - Pfizer     — 2023 Impact Report (Scope 3 from CDP 2023 = FY2022 data)
//   - GSK        — Responsible Business Report 2025 (Scope 3 = FY2024, complete)
//   - Sanofi     — 2024 Sustainability Statement (ESG Report)
//
// Where a figure could not be verified from a fetched primary source it is left
// out or explicitly marked "not separately disclosed / to confirm" rather than
// invented. Roche and AstraZeneca primary PDFs were not machine-fetchable, so
// their entries carry more of these honest gaps.

export interface PeerCompany {
  name: string;
  ticker: string;
  reportYear: number;
  reportTitle: string;
  pages: number;
  indexed: boolean;
  chunksIndexed: number;
  reportUrl: string;
}

export interface BenchmarkAnswer {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  citations: { company: string; excerpt: string; pageRef: string; section: string }[];
}

export const peerCompanies: PeerCompany[] = [
  { name: 'Roche', ticker: 'ROG.SW', reportYear: 2025, reportTitle: 'Roche Annual Report 2025 (incl. Sustainability Statement)', pages: 130, indexed: true, chunksIndexed: 530, reportUrl: 'https://www.roche.com/about/sustainability' },
  { name: 'AstraZeneca', ticker: 'AZN.L', reportYear: 2024, reportTitle: 'AstraZeneca Sustainability Data Annex 2024', pages: 96, indexed: true, chunksIndexed: 400, reportUrl: 'https://www.astrazeneca.com/sustainability.html' },
  { name: 'Pfizer', ticker: 'PFE', reportYear: 2023, reportTitle: 'Pfizer 2023 Impact Report', pages: 84, indexed: true, chunksIndexed: 340, reportUrl: 'https://www.pfizer.com/about/responsibility/responsible-business' },
  { name: 'GSK', ticker: 'GSK.L', reportYear: 2025, reportTitle: 'GSK Responsible Business Report 2025', pages: 37, indexed: true, chunksIndexed: 150, reportUrl: 'https://www.gsk.com/en-gb/responsibility/' },
  { name: 'Sanofi', ticker: 'SAN.PA', reportYear: 2024, reportTitle: 'Sanofi 2024 Sustainability Statement (ESG Report)', pages: 162, indexed: true, chunksIndexed: 650, reportUrl: 'https://www.sanofi.com/en/our-company/sustainability' },
];

export const benchmarkAnswers: BenchmarkAnswer[] = [
  {
    id: 'ba-1',
    keywords: ['scope 3', 'emissions', 'pharma', 'ftse'],
    question: 'How do pharma peers disclose Scope 3 emissions?',
    answer: `Peers disclose materially different Scope 3 totals and identify different dominant categories — note the reporting years differ, so these are not a like-for-like comparison:\n\n**GSK** (FY2024) reports total Scope 3 of 8,385 ktCO2e. Its largest category is use of sold products (~4,627 ktCO2e, ~52% of Scope 3), mostly propellant metered-dose inhalers, with purchased goods & services second (~38%).\n\n**Pfizer** (CDP 2023, FY2022 data) reports Scope 3 of ~9,670 ktCO2e across categories 1-8 and 15; purchased goods & services (Category 1) alone is ~85% of Scope 3 (~8,248 ktCO2e). Pfizer does not report a Category 11 (use of sold products) figure.\n\n**Sanofi** (2024) reports total Scope 3 of 3,822,627 tCO2e (-10.4% vs 2019); Category 1 dominates at 2,656,331 tCO2e, while use of sold products (Cat 11) is small at 77,660 tCO2e.\n\n**Roche** (2025) reports Scope 1+2+3 of 5,331 ktCO2e (down from 6,707 in 2022) and discloses Scope 3 sub-groups on its performance page (e.g. Cat 11+12 = 358 ktCO2e); the single dominant Scope 3 category is not broken out on the fetched source.\n\n**AstraZeneca** (2024) states Scope 3 is >95% of its corporate emissions but the absolute total and category split were not verifiable from a fetched primary source.\n\nAll five have SBTi-validated targets.`,
    citations: [
      { company: 'GSK', excerpt: 'Total Scope 3 emissions (thousands of tonnes CO2e) ... 8,385; people using our products (52%), mostly metered dose inhalers', pageRef: 'p.21', section: 'Responsible Business Report 2025 (FY2024 data)' },
      { company: 'Pfizer', excerpt: 'the total of Scope 3 emissions for categories 1-8 and 15 (9,670,200 mt CO2e); purchased goods and services ... 85% of our total Scope 3', pageRef: 'CDP 2023, C10.1/C12.1a', section: 'CDP Climate Change 2023 (FY2022)' },
      { company: 'Sanofi', excerpt: 'Total Gross indirect (Scope 3 GHG emissions - tCO2e) 3,822,627; Purchased goods and services 2,656,331', pageRef: 'p.34', section: '2024 Sustainability Statement, E1-6' },
    ],
  },
  {
    id: 'ba-2',
    keywords: ['biodiversity', 'e4', 'esrs', 'metrics'],
    question: 'What biodiversity approaches are peers reporting under ESRS E4 / TNFD?',
    answer: `Biodiversity disclosure in pharma is maturing rapidly around the TNFD and SBTN frameworks:\n\n**GSK** (FY2025) reports against TNFD and is among the first companies globally with independently SBTN-validated land and freshwater targets; it states 100% of sites have biodiversity net-gain plans and targets being net positive on nature by 2030.\n\n**Sanofi** (2024) reports in line with the TNFD framework (TNFD v1, 2023) alongside SBTN, and runs an insulin-pen take-back pilot in Denmark and Germany.\n\n**AstraZeneca** (2024) is an early TNFD adopter and published its first standalone TNFD report in 2024 using the LEAP approach.\n\n**Roche** (2025) states its nature work is guided by the SBTN and TNFD frameworks.\n\n**Pfizer** (2023) completed biodiversity risk assessments using the WWF Biodiversity Risk Filter; it does not report explicit TNFD adoption.\n\nCommon maturity gap: quantified supply-chain / raw-material biodiversity impacts remain limited across all peers.`,
    citations: [
      { company: 'GSK', excerpt: 'among the first companies globally with independently validated targets for land and freshwater ... reports against TNFD', pageRef: 'pp.17,19', section: 'Responsible Business Report 2025' },
      { company: 'Sanofi', excerpt: 'recommendations provided by the Taskforce on Nature-related Financial Disclosure (TNFD) framework', pageRef: 'p.45', section: '2024 Sustainability Statement' },
      { company: 'AstraZeneca', excerpt: 'we committed to early adoption of the Taskforce on Nature-related Financial Disclosures (TNFD) recommendations', pageRef: 'TNFD Report 2024', section: 'TNFD Report 2024 (LEAP)' },
    ],
  },
  {
    id: 'ba-3',
    keywords: ['workforce', 's1', 'esrs', 'structure', 'disclosures'],
    question: 'How do peers disclose their ESRS S1 workforce metrics?',
    answer: `Workforce disclosure depth varies, and pay-gap reporting reflects each company's home regime:\n\n**GSK** (end-2024) reports 68,629 permanent employees; women hold 48% of all roles, 51% of management and 48% of VP+ roles. Its UK statutory gender pay gap for 2025 is mean -2.66% / median -10.31% (negative favours women, vs a UK average of ~13.4%).\n\n**Sanofi** (2024) reports 82,878 employees; women are 48.1% of permanent full-time staff, 43% of executives and 46% of senior leadership. Its French gender-equality index is a headcount-weighted 93.6/100.\n\n**Pfizer** (2023) reports women at 44.8% of VP+ roles globally and pays women 99.5% of what men are paid globally; total headcount is not disclosed (treated as confidential).\n\n**Roche** (2025) reports 100,000+ employees; a % women / gender pay-gap figure was not verifiable from a fetched source (Roche is Swiss-HQ with no UK-style statutory gap).\n\n**AstraZeneca** (2024) reports women at 50.6% of senior/middle-management roles; overall % women and a UK pay gap were not verifiable from a fetched primary source.`,
    citations: [
      { company: 'GSK', excerpt: 'women held 48% of VP-and-above roles globally ... 51% of all management roles; UK gender pay gap was -2.66%', pageRef: 'AR2024 p.56; UK GPG 2025 pp.1-2', section: 'Annual Report 2024 / UK Gender Pay Gap 2025' },
      { company: 'Sanofi', excerpt: 'Women currently make up 43% of our executives and hold 46% of our senior leadership positions; index 93.6/100', pageRef: 'pp.61,85', section: '2024 Sustainability Statement' },
      { company: 'Pfizer', excerpt: '44.8% Representation for women at VP+ levels globally; pays female colleagues globally at greater than 99% (99.5%)', pageRef: 'pp.6,41', section: '2023 Impact Report' },
    ],
  },
  {
    id: 'ba-4',
    keywords: ['tcfd', 'governance', 'pharma', 'disclosures'],
    question: 'What TCFD / climate governance do pharma peers disclose?',
    answer: `All five peers publish TCFD-aligned climate governance and hold SBTi-validated net-zero targets, which anchor board and management oversight of climate:\n\n**Roche** (2025) — net zero by 2045, SBTi-approved in 2025; states it follows the TCFD framework.\n\n**AstraZeneca** (2024) — SBTi-validated net-zero (~90% reduction) by 2045; publishes a "Climate Change Exposure 2024" disclosure.\n\n**Pfizer** (2023) — net zero by 2040 under the SBTi Net-Zero Standard; TCFD section sets out board and management climate roles.\n\n**GSK** (FY2025) — SBTi Net-Zero Standard approved; net zero across operations by 2030 and full value chain by 2045.\n\n**Sanofi** (2024) — SBTi-validated net zero by 2045.\n\nNote on specifics: the exact board-committee meeting cadence and the executive-compensation weighting tied to climate differ by company and should be confirmed directly from each company's latest report before external use — those precise percentages were not verifiable from the fetched sources.`,
    citations: [
      { company: 'Pfizer', excerpt: 'aim to achieve the voluntary Net Zero standard by 2040, 10 years ahead ... TCFD', pageRef: 'ESG Performance p.34', section: '2023 Impact Report (TCFD)' },
      { company: 'GSK', excerpt: 'approved by the Science Based Targets initiative (SBTi) Net Zero Standard; net zero ... full value chain by 2045', pageRef: 'p.17', section: 'Responsible Business Report 2025' },
      { company: 'Roche', excerpt: 'achieving net zero carbon emissions by 2045 ... approved by SBTi in 2025; we follow the TCFD framework', pageRef: 'esg-index', section: 'Roche ESG index / sustainability (2025)' },
    ],
  },
  {
    id: 'ba-5',
    keywords: ['water', 'stress', 'e3', 'disclosure', 'management'],
    question: 'How do pharma peers disclose water management in stressed regions?',
    answer: `Water-stress disclosure varies with each company's manufacturing footprint and materiality view:\n\n**GSK** (FY2025) identifies 5 sites across 3 water-stressed basins (India, Pakistan and Algeria) and reports total water use of 6.8M m3.\n\n**Pfizer** (2023) reports water withdrawal of 31.9M m3 and notes that almost half of 40 assessed sites are at high water-scarcity risk by 2030 under a high-emissions scenario.\n\n**Roche** (2025) sets targets to cut risk-weighted water consumption 5% and phosphorus-to-wastewater 64% by 2029; absolute withdrawal and a water-stressed site count were not verifiable from a fetched source.\n\n**AstraZeneca** (2024) reports ~23% reduction in water use since 2015; a water-stressed site count was not verifiable.\n\n**Sanofi** (2024) flags ESRS E3 water metrics as "not material" for the group, so it does not disclose an absolute withdrawal or stressed-site count in this statement.`,
    citations: [
      { company: 'GSK', excerpt: 'five sites across three water-stressed basins - specifically in India, Pakistan and Algeria', pageRef: 'pp.19,21', section: 'Responsible Business Report 2025' },
      { company: 'Pfizer', excerpt: 'Water withdrawal (in million cubic meters) 31.9; almost half of the 40 ... sites ... at a high risk of water scarcity', pageRef: 'pp.4,37', section: '2023 Impact Report' },
      { company: 'Sanofi', excerpt: 'Total water consumption ... Not material for Sanofi', pageRef: 'p.142', section: '2024 Sustainability Statement (E3)' },
    ],
  },
  {
    id: 'ba-6',
    keywords: ['anti-corruption', 'ethics', 'g1', 'business conduct'],
    question: 'How do peers report on anti-corruption and business ethics under ESRS G1?',
    answer: `Code-of-conduct training completion is the most consistently disclosed G1 metric; ethics-report volumes are disclosed by some peers but not all:\n\n**GSK** (2025) reports 100% of employees and 99% of complementary workers completed mandatory Code of Conduct training, and 11,999 third-party risk assessments. A numeric Speak Up report count is not disclosed in the report.\n\n**Sanofi** (2024) reports 92.2% completion of Code of Conduct Part 2 training, and Speak-Up figures of 900 alerts received, 396 substantiated, and 141 dismissals/resignations.\n\n**Pfizer** (2023) publishes its "Blue Book" Code of Conduct in 30+ languages with risk-based training; the training-completion % and ethics-report volume are treated as confidential and not disclosed.\n\n**Roche** and **AstraZeneca** maintain Codes of Conduct, but training completion % and ethics-report volumes were not verifiable from a fetched primary source.`,
    citations: [
      { company: 'GSK', excerpt: 'In 2025, 100% of our employees and 99% of complementary workers completed this training; 11,999 third-party risk assessments', pageRef: 'pp.25-26', section: 'Responsible Business Report 2025' },
      { company: 'Sanofi', excerpt: 'received 900 alerts. A total of 396 cases were substantiated; Code of Conduct Part 2 completion 92.2%', pageRef: 'pp.116,120', section: '2024 Sustainability Statement' },
      { company: 'Pfizer', excerpt: 'Code of Conduct (available publicly in over 30 languages)', pageRef: 'p.15', section: '2023 Impact Report' },
    ],
  },
  {
    id: 'ba-7',
    keywords: ['circular', 'economy', 'waste', 'packaging', 'e5'],
    question: 'What circular economy metrics do pharma peers report?',
    answer: `Circular-economy disclosure is emerging, with waste-recycling rates the most quantified metric and packaging still qualitative for most peers:\n\n**GSK** (FY2025) reports a circular-waste rate of 58% (up from 43% in 2022) and 100% certified sustainable paper and palm oil.\n\n**Sanofi** (2024) runs an insulin-pen take-back pilot; a headline packaging-recyclability % was not found in the statement.\n\n**Roche** (2025) participates in the WBCSD Circular Plastics & Packaging initiative; a packaging-recyclability % was not verifiable from a fetched source.\n\n**Pfizer** (2023) and **AstraZeneca** (2024) report standard waste metrics but circular-economy-specific KPIs / packaging-recyclability figures were not verifiable from fetched primary sources.\n\nSector-wide gap: product-level lifecycle assessment and end-of-life pharmaceutical waste remain largely unquantified.`,
    citations: [
      { company: 'GSK', excerpt: '% circular waste 43% 53% 54% 58%; 100% certified sustainable paper and palm oil', pageRef: 'p.22', section: 'Responsible Business Report 2025' },
      { company: 'Sanofi', excerpt: 'insulin-pen take-back pilot (Denmark, Germany)', pageRef: 'p.45', section: '2024 Sustainability Statement' },
      { company: 'Roche', excerpt: 'WBCSD Circular Plastics & Packaging participant', pageRef: 'esg-index', section: 'Roche ESG index (2025)' },
    ],
  },
  {
    id: 'ba-8',
    keywords: ['access', 'medicine', 'patients', 'health', 'communities', 's3'],
    question: 'How do pharma peers disclose access to medicine and community impact?',
    answer: `Access disclosure is a signature pharma topic; note the reach metrics use different definitions and periods:\n\n**Roche** (2025) reports 39M+ patients treated with its medicines and 258M+ reached with diagnostics, 59,000+ patients reached in LMICs, and an Access to Medicine Index 2024 rank of 11 of 20.\n\n**Pfizer** (2023) reports "An Accord for a Healthier World" supplying on a not-for-profit basis to 1.2 billion people across 45 lower-income countries, and 619M patients treated in 2023 (334M excluding COVID-19 products).\n\n**AstraZeneca** (2024) reports Healthy Heart Africa delivered 67M+ blood-pressure screenings, trained 11,700+ health workers and reached 1,550+ facilities across 9 countries.\n\n**GSK** ranked 2nd in the Access to Medicine Index 2024, reached at least 2 billion people from 2021 to end-2024 (1.5bn in LMICs), and supplied ~99M Gavi vaccine doses in 2025.\n\n**Sanofi** (2024) reports its non-profit "Impact" brand (30 medicines) reached 1,554,152 beneficiaries cumulatively over 2022-2024, with a 2030 goal of 2M people in 40+ LMICs.`,
    citations: [
      { company: 'Pfizer', excerpt: 'on a not-for-profit basis to 1.2 billion people living in 45 lower-income countries', pageRef: 'p.34', section: '2023 Impact Report (An Accord for a Healthier World)' },
      { company: 'GSK', excerpt: 'rank second in the Access to Medicine Index; reached at least two billion people between 2021 and the end of 2024', pageRef: 'pp.9,11', section: 'Responsible Business Report 2025 / ATMI 2024' },
      { company: 'Roche', excerpt: '39 million + patients treated with medicines in 2025; ranked 11th out of 20 (ATMI 2024)', pageRef: 'targets-and-performance', section: 'Roche performance page (2025)' },
    ],
  },
  {
    id: 'ba-9',
    keywords: ['supply chain', 'due diligence', 'human rights', 's2', 'value chain'],
    question: 'How do pharma peers approach supply chain human rights due diligence?',
    answer: `Supply-chain due diligence is mature in pharma, built around PSCI membership, EcoVadis assessments and on-site audits:\n\n**Pfizer** (2023) is a PSCI founding member; it assessed EHS performance at 109 supplier facilities in 2023 (878 observations) and screens 100% of new suppliers.\n\n**GSK** (2025) conducted 38 labour-rights/EHS audits plus 41 PSCI-guideline EHS audits, and reports 92% of direct high-risk suppliers met GSK's minimum EcoVadis score.\n\n**Sanofi** (2024) uses EcoVadis assessments and the PSCI human-rights sub-group, and engaged 205 suppliers covering 75% of supplier-related emissions in its Supplier Engagement Program.\n\n**Roche** (2025) is a PSCI founding member (2006) and Scope 3 Group Lead, and holds an EcoVadis Silver rating (69/100); specific audit counts were not verifiable from a fetched source.\n\n**AstraZeneca** — supply-chain human-rights due-diligence specifics (audits / EcoVadis / worker voice) were not verifiable from a fetched primary source.`,
    citations: [
      { company: 'Pfizer', excerpt: 'we assessed EHS performance for 109 supplier facilities in 2023, resulting in 878 observations', pageRef: 'p.19', section: '2023 Impact Report' },
      { company: 'GSK', excerpt: "92% of direct high-risk suppliers achieved GSK's minimum Ecovadis score", pageRef: 'pp.25-26', section: 'Responsible Business Report 2025' },
      { company: 'Sanofi', excerpt: '205 suppliers engaged ... covering 75% of supplier-related emissions', pageRef: 'pp.6,28', section: '2024 Sustainability Statement' },
    ],
  },
  {
    id: 'ba-10',
    keywords: ['scenario', 'analysis', 'climate', 'risk', 'tcfd', 'transition'],
    question: 'What climate scenario analysis approaches do peers use?',
    answer: `Peers converge on IEA/IPCC/NGFS scenario families spanning a 1.5°C pathway to a high-emissions world:\n\n**Pfizer** (2023) uses IPCC SSP1-2.6 and SSP5-8.5 for physical risk, plus NGFS Current Policies and NGFS Net Zero 2050 for transition, across 2030 / 2040 / 2050 horizons.\n\n**GSK** (FY2024, in AR) uses four IEA-based scenarios mapped to SSP/RCP: Net Zero (SSP1-RCP1.9, 1.5°C), Low-carbon (SSP1-RCP2.6), Current (SSP2-RCP4.5 / IEA APS) and a Breach world (SSP5-RCP8.5).\n\n**Sanofi** (2024) uses IEA transition scenarios (NZE 2050 at 1.5°C and STEPS at ~2.8°C) plus IPCC physical scenario RCP 4.5.\n\n**Roche** (2025) reports under the TCFD framework; the specific named scenarios were not verifiable from a fetched source.\n\n**AstraZeneca** (2024) publishes a Climate Change Exposure disclosure; the specific scenarios were not verifiable from a fetched source.\n\nAcross peers, carbon pricing is the dominant transition risk and water stress / extreme heat the top physical risks for manufacturing.`,
    citations: [
      { company: 'Pfizer', excerpt: 'IPCC SSP1-2.6 ... SSP5-8.5 ... NGFS Current Policies ... NGFS Net Zero 2050', pageRef: 'ESG Performance pp.35-36', section: '2023 Impact Report' },
      { company: 'GSK', excerpt: 'Net zero scenario (SSP 1 - RCP 1.9) ... limiting the global temperature rise to 1.5°C', pageRef: 'AR2024 p.72', section: 'Annual Report 2024 (TCFD)' },
      { company: 'Sanofi', excerpt: 'IEA NZE 2050 scenario ... Physical climate scenarios RCP 4.5 Source: IPCC', pageRef: 'pp.22-23', section: '2024 Sustainability Statement' },
    ],
  },
];

// --- Peer-informed gap suggestions (Adrian, 21 Aug 2026) --------------------
// Adrian asked the gap analysis to benchmark against what peers actually
// disclose, not just measure against the standard abstractly: "you could
// strengthen it by addressing X because that's what all your peers are doing."
//
// This maps a disclosure requirement to the most relevant indexed peer
// benchmark answer (by keyword overlap on the DR's framework/standard/title)
// and returns a short, cited insight the UI shows on partial/missing rows. It is
// deterministic and grounded in the same peer corpus the benchmarking tab uses;
// in production the live Peer Benchmarking Agent produces this from retrieval.

export interface PeerInsight {
  answerId: string;
  companies: string[];   // peers cited in the matched benchmark
  headline: string;      // one-line "what peers do" summary for the gap row
  detail: string;        // the fuller benchmark answer for the expanded view
}

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
}

export function peerInsightForDr(dr: { drId: string; framework: string; standard: string; title: string }): PeerInsight | null {
  const drTokens = new Set([
    ...tokenize(dr.title),
    ...tokenize(dr.standard),
    dr.framework.toLowerCase(),
    // Common topic synonyms so e.g. "GHG" rows match "emissions" benchmarks.
    ...(/e1|climate|ghg|emission|scope/i.test(dr.standard + dr.title) ? ['scope', 'emissions', 'climate'] : []),
    ...(/s1|s2|workforce|worker|labour|human right/i.test(dr.standard + dr.title) ? ['workforce', 'human', 'rights'] : []),
    ...(/g1|govern|conduct|corruption|ethic/i.test(dr.standard + dr.title) ? ['anti', 'corruption', 'conduct'] : []),
    ...(/e4|biodiversity|nature|ecosystem/i.test(dr.standard + dr.title) ? ['biodiversity'] : []),
    ...(/e3|water/i.test(dr.standard + dr.title) ? ['water'] : []),
  ]);

  let best: { ans: BenchmarkAnswer; score: number } | null = null;
  for (const ans of benchmarkAnswers) {
    const score = ans.keywords.reduce((acc, kw) => acc + (drTokens.has(kw.toLowerCase()) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { ans, score };
  }
  if (!best) return null;

  const companies = [...new Set(best.ans.citations.map(c => c.company))];
  const headline = `Peers (${companies.join(', ')}) disclose this — see how they address "${best.ans.question.replace(/^How do |^What /i, '').replace(/\?$/, '')}".`;
  return { answerId: best.ans.id, companies, headline, detail: best.ans.answer };
}
