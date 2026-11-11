// I — Table management.
// The "source of truth" for table data sits in MDD (Master Data Dictionary).
// During editing we render the data so authors can see the numbers while
// writing narrative; on export the rendered table is REPLACED with the MDD code
// [Table Reference: DP_*]. Everything here is reference-only in the studio.

export interface MddTable {
  code: string;        // DP_* code used in content and on export
  title: string;
  columns: string[];
  rows: string[][];
  assurance?: string;  // note shown with the reference-only indicator
}

// The "2025" and "2024" columns are the REAL published figures transcribed from
// the Novartis RNFM 2025 PDF (pages noted per table). The "2026 (draft)" column
// holds current-year values shown for drafting reference; where a FY2026 actual
// is not yet available it is marked "pending" rather than fabricated (the
// source of truth is MDD, populated at publication).
export const mddTables: Record<string, MddTable> = {
  DP_Environment: {
    code: 'DP_Environment',
    title: 'Energy & GHG emissions (Climate metrics, RNFM 2025 p.27)',
    columns: ['Metric', '2026 (draft)', '2025', '2024', 'Unit'],
    rows: [
      ['Total energy consumption', 'pending', '1 722.5', '1 833.2', '1 000 MWh'],
      ['From renewable sources', 'pending', '845.9 (49%)', '845.2 (46%)', '1 000 MWh'],
      ['Gross Scope 1', 'pending', '192.3', '210.6', '1 000 tCO2e'],
      ['Gross Scope 2 (market-based)', 'pending', '14.9', '29.8', '1 000 tCO2e'],
      ['Gross Scope 2 (location-based)', 'pending', '183.8', '198.5', '1 000 tCO2e'],
      ['Gross Scope 3', 'pending', '4 169.9', '4 282.2', '1 000 tCO2e'],
      ['Scope 3 from primary data', 'pending', '40%', '38%', '%'],
      ['Internal carbon price', '100', '100', '100', 'USD/tCO2e'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆). FY2026 actuals pending — sourced from MDD at publication.',
  },
  DP_Climate_Target_Performance: {
    code: 'DP_Climate_Target_Performance',
    title: 'Climate target performance (RNFM 2025 p.22)',
    columns: ['Target (1 000 tCO2e)', '2025', '2024', 'Base yr', 'Target yr', 'Target', 'Progress'],
    rows: [
      ['Scope 1 & 2 from energy', '200.0', '233.3', 'n/a', '2025', 'Carbon neutral', 'Carbon neutral'],
      ['Supplier emissions covered by ES criteria (%)', '97', '76', 'n/a', '2025', '100%', '97%'],
      ['Scope 1 and 2 GHG emissions', '202.1', '235.7', '365.3', '2030', '−90%', '−45%'],
      ['Scope 3 GHG emissions', '4 047.4', '4 207.5', '4 872.4', '2030', '−42%', '−17%'],
      ['Scope 1, 2 and 3 GHG emissions', '4 249.5', '4 443.2', '5 237.7', '2040', '−90%', '−19%'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆). Baseline, target year, target and progress were not assured.',
  },
  DP_TransitionRisks_Opportunities: {
    code: 'DP_TransitionRisks_Opportunities',
    title: 'Climate-related financial effects (RNFM 2025 p.25)',
    columns: ['Item (USD millions)', '2026', '2030', '2040', '2050'],
    rows: [
      ['Physical (acute): PP&E value decrease', '89.3–90.6', '89.0–90.8', '—', '91.6–92.1'],
      ['Physical (acute): inventory value decrease', '24.8–25.0', '24.9–25.0', '—', '25.3–25.6'],
      ['Physical (acute): revenue loss (business interruption)', '152.5–155.2', '189.5–191.7', '—', '375.5–385.7'],
      ['Transition: operating expense increase', '92.4–219.4', '72.5–183.2', '46.0–162.6', '49.7–142.6'],
      ['Transition: revenue decrease', 'n/a', '42.2–206.2', '65.8–221.6', '181.6–329.5'],
      ['Opportunity: cost savings (mitigation)', '49.8–66.1', '43.5–62.6', '27.7–53.6', '11.9–44.7'],
    ],
    assurance: 'Data in scope for external limited assurance (∆). Ranges reflect low-/medium-/high-emission scenarios.',
  },
  DP_Workforce_HSE: {
    code: 'DP_Workforce_HSE',
    title: 'Workforce health & safety metrics (RNFM 2025 p.32)',
    columns: ['Metric (per 200 000 work hours)', '2026 (draft)', '2025', '2024'],
    rows: [
      ['Employees covered by validated HSE system (%)', 'pending', '99', '99'],
      ['LTIR — employees', 'pending', '0.12', '0.13'],
      ['LTIR — third-party personnel', 'pending', '0.32', '0.30'],
      ['TRCR — employees', 'pending', '0.26', '0.31'],
      ['TRCR — third-party personnel', 'pending', '0.36', '0.39'],
      ['Fatalities — employees / third-party / contractors', 'pending', '0 / 0 / 0', '0 / 0 / 0'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆). FY2026 actuals pending from MDD.',
  },
  DP_WaterQuality_Target: {
    code: 'DP_WaterQuality_Target',
    title: 'Water-quality target performance (RNFM 2025 p.30)',
    columns: ['Metric', '2026 (draft)', '2025', '2024', 'Target'],
    rows: [
      ['Own manufacturing sites meeting water quality standards (%)', 'pending', '97', '97', '100%'],
      ['High-risk suppliers meeting water quality standards (%)', 'pending', '100', '100', '100%'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆). Target year, target and progress were not assured.',
  },
  DP_Grievance: {
    code: 'DP_Grievance',
    title: 'Grievance metrics (RNFM 2025 p.18)',
    columns: ['Metric', '2026 (draft)', '2025', '2024'],
    rows: [
      ['Total allegations', 'pending', '1 116', '1 834'],
      ['Higher-risk allegations substantiated', 'pending', '745', '921'],
      ['— Discrimination, harassment & employee relations', 'pending', '19', '16'],
      ['— Human and labor rights', 'pending', '0', '1'],
      ['— Professional practices', 'pending', '56', '41'],
      ['— Bribery and kickbacks', 'pending', '0', '0'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆).',
  },
  DP_WorkingConditions: {
    code: 'DP_WorkingConditions',
    title: 'Working conditions in our value chain (RNFM 2025 p.33)',
    columns: ['Metric', '2026 (draft)', '2025', '2024'],
    rows: [
      ['Human and labor rights remediation actions', 'pending', '191', '302'],
      ['— of which overdue (%)', 'pending', '10', '12'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆).',
  },
  DP_PatientSafety: {
    code: 'DP_PatientSafety',
    title: 'Patient health and safety metrics (RNFM 2025 p.35)',
    columns: ['Metric', '2026 (draft)', '2025', '2024'],
    rows: [
      ['Total inspections', 'pending', '140', '138'],
      ['— found to be acceptable (%)', 'pending', '100', '100'],
      ['Total recalls', 'pending', '7', '4'],
      ['— Class I / Class II', 'pending', '0 / 3', '0 / 2'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆).',
  },
  DP_AccessToMedicines: {
    code: 'DP_AccessToMedicines',
    title: 'Access to medicines metrics (RNFM 2025 p.36)',
    columns: ['Metric', '2026 (draft)', '2025', '2024'],
    rows: [
      ['Patients reached (millions)', 'pending', '304', '296'],
      ['Countries with products sold', 'pending', '118', '118'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆).',
  },
  DP_Governance: {
    code: 'DP_Governance',
    title: 'Business conduct metrics (RNFM 2025 p.39)',
    columns: ['Metric', '2026 (draft)', '2025', '2024'],
    rows: [
      ['Code of Ethics — employees trained & certified (%)', 'pending', '98', '98'],
      ['Higher-risk bribery allegations substantiated', 'pending', '0', '0'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆).',
  },
  DP_Governance_Responsibilities: {
    code: 'DP_Governance_Responsibilities',
    title: 'Nonfinancial matter responsibilities (RNFM 2025 p.10)',
    columns: ['Body', 'Responsibility'],
    rows: [
      ['GSNC', 'Strategy & governance of nonfinancial matters'],
      ['ACC', 'Internal controls & compliance'],
      ['ESG Committee (ECN)', 'Social impact & sustainability performance'],
      ['Compensation Committee', 'Integration of nonfinancial matters into compensation'],
    ],
  },
  DP_Workforce_Characteristics: {
    code: 'DP_Workforce_Characteristics',
    title: 'Workforce characteristics & operating sites (RNFM 2025 p.12)',
    columns: ['Metric', '2026 (draft)', '2025', '2024'],
    rows: [
      ['Headcount', 'pending', '77 052', '78 310'],
      ['Full-time equivalent positions', 'pending', '75 267', '75 883'],
      ['Turnover (%) / of which voluntary (%)', 'pending', '13 / 7', '12 / 6'],
      ['Gender representation — headcount (F/M)', 'pending', '52 / 48', '52 / 48'],
      ['Gender representation — Board (F/M)', 'pending', '42 / 58', '31 / 69'],
      ['Gender representation — Executive Committee (F/M)', 'pending', '20 / 80', '18 / 82'],
      ['Operating sites / of which manufacturing', 'pending', '184 / 31', '197 / 33'],
    ],
    assurance: '2025 data in scope for external limited assurance (∆).',
  },
};

// Extract DP_* code from a "[Table Reference: DP_X]" line.
export function tableCodeFromLine(line: string): string | null {
  const m = line.match(/\[Table Reference:\s*([A-Za-z0-9_]+)\]/);
  return m ? m[1] : null;
}
