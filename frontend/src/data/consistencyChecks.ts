export type CheckSeverity = 'error' | 'warning' | 'info';
export type CheckStatus = 'pass' | 'fail' | 'review';

export interface ConsistencyCheck {
  id: string;
  category: string;
  description: string;
  rnfmValue: string;
  annualReportValue: string;
  status: CheckStatus;
  severity: CheckSeverity;
  section: string;
  recommendation: string;
}

export const consistencyChecks: ConsistencyCheck[] = [
  // Numerical consistency — GHG emissions
  { id: 'cc-001', category: 'GHG Emissions', description: 'Scope 1 emissions figure', rnfmValue: '197 ktCO2e', annualReportValue: '197 ktCO2e', status: 'pass', severity: 'error', section: 'Climate change', recommendation: 'Values are consistent.' },
  { id: 'cc-002', category: 'GHG Emissions', description: 'Scope 2 (market-based) emissions', rnfmValue: '58 ktCO2e', annualReportValue: '58 ktCO2e', status: 'pass', severity: 'error', section: 'Climate change', recommendation: 'Values are consistent.' },
  { id: 'cc-003', category: 'GHG Emissions', description: 'Scope 3 total emissions', rnfmValue: '4 047 ktCO2e', annualReportValue: '4 077 ktCO2e', status: 'fail', severity: 'error', section: 'Climate change', recommendation: 'Discrepancy of 30 ktCO2e between reports. Verify whether RNFM uses the updated downstream transport correction (92→62 ktCO2e per IFRS S1.B58 error restatement). Annual Report may use the pre-correction figure.' },
  { id: 'cc-004', category: 'GHG Emissions', description: 'GHG intensity ratio denominator', rnfmValue: 'Net sales (USD)', annualReportValue: 'Net sales (USD)', status: 'pass', severity: 'warning', section: 'Climate change', recommendation: 'Consistent methodology.' },

  // Energy
  { id: 'cc-005', category: 'Energy', description: 'Total energy consumption', rnfmValue: '4 218 GWh', annualReportValue: '4 218 GWh', status: 'pass', severity: 'error', section: 'Climate change', recommendation: 'Values are consistent.' },
  { id: 'cc-006', category: 'Energy', description: 'Renewable electricity percentage', rnfmValue: '100%', annualReportValue: '100%', status: 'pass', severity: 'warning', section: 'Climate change', recommendation: 'Consistent claim.' },
  { id: 'cc-007', category: 'Energy', description: 'Energy unit of measurement', rnfmValue: 'MWh (changed from GJ per IFRS S1.B52)', annualReportValue: 'GJ', status: 'fail', severity: 'warning', section: 'Climate change', recommendation: 'Unit discrepancy: RNFM now uses MWh per ISSB methodology change disclosure. Ensure Annual Report footnote cross-references the unit change, or update Annual Report to match.' },

  // Workforce
  { id: 'cc-008', category: 'Workforce', description: 'Total headcount (FTEs)', rnfmValue: '75 267', annualReportValue: '75 267', status: 'pass', severity: 'error', section: 'Health and safety in our workforce', recommendation: 'Values are consistent.' },
  { id: 'cc-009', category: 'Workforce', description: 'LTIR (Lost Time Injury Rate)', rnfmValue: '0.12', annualReportValue: '0.12', status: 'pass', severity: 'error', section: 'Health and safety in our workforce', recommendation: 'Values are consistent.' },
  { id: 'cc-010', category: 'Workforce', description: 'TRCR (Total Recordable Case Rate)', rnfmValue: '0.26', annualReportValue: '0.26', status: 'pass', severity: 'error', section: 'Health and safety in our workforce', recommendation: 'Values are consistent.' },
  { id: 'cc-011', category: 'Workforce', description: 'Third-party LTIR', rnfmValue: '0.30 (restated from 0.16 per IFRS S1.B58)', annualReportValue: '0.16', status: 'fail', severity: 'error', section: 'Health and safety in our workforce', recommendation: 'Critical discrepancy: RNFM reflects the error correction (0.16→0.30) disclosed under IFRS S1.B58. Annual Report still shows pre-correction value. Must update Annual Report or add restatement footnote.' },
  { id: 'cc-012', category: 'Workforce', description: 'Third-party TRCR', rnfmValue: '0.39 (restated from 0.21 per IFRS S1.B58)', annualReportValue: '0.21', status: 'fail', severity: 'error', section: 'Health and safety in our workforce', recommendation: 'Critical discrepancy: same error correction as LTIR. RNFM reflects corrected figure. Annual Report needs updating.' },

  // Governance
  { id: 'cc-013', category: 'Governance', description: 'Board oversight body for sustainability', rnfmValue: 'GSNC (Governance, Sustainability and Nomination Committee)', annualReportValue: 'GSNC', status: 'pass', severity: 'info', section: 'Business conduct', recommendation: 'Terminology is consistent.' },
  { id: 'cc-014', category: 'Governance', description: 'Ethics allegations received', rnfmValue: '1 116', annualReportValue: '1 116', status: 'pass', severity: 'error', section: 'Business conduct', recommendation: 'Values are consistent.' },
  { id: 'cc-015', category: 'Governance', description: 'Anti-corruption training completion', rnfmValue: '98%', annualReportValue: '98%', status: 'pass', severity: 'warning', section: 'Business conduct', recommendation: 'Values are consistent.' },

  // Access & Patient
  { id: 'cc-016', category: 'Access to Medicines', description: 'Patients reached', rnfmValue: '304 million', annualReportValue: '~300 million', status: 'review', severity: 'warning', section: 'Access to medicines', recommendation: 'Minor difference in precision: RNFM states 304M (exact), Annual Report rounds to ~300M. Consider aligning to exact figure in both, or noting the rounding convention.' },
  { id: 'cc-017', category: 'Patient Safety', description: 'Adverse events processed', rnfmValue: '1.1 million', annualReportValue: '1.1 million', status: 'pass', severity: 'error', section: 'Patient health and safety', recommendation: 'Values are consistent.' },

  // Targets
  { id: 'cc-018', category: 'Climate Targets', description: 'SBTi validation status', rnfmValue: 'Validated 2024 (Corporate Net-Zero Standard)', annualReportValue: 'SBTi validated', status: 'pass', severity: 'info', section: 'Climate change', recommendation: 'Consistent. RNFM provides more detail on validation year and standard.' },
  { id: 'cc-019', category: 'Climate Targets', description: 'Scope 1+2 reduction target', rnfmValue: '42% by 2030 vs. 2019 baseline', annualReportValue: '42% reduction by 2030', status: 'pass', severity: 'warning', section: 'Climate change', recommendation: 'Consistent. RNFM includes baseline year detail.' },
  { id: 'cc-020', category: 'Climate Targets', description: 'Net-zero target year', rnfmValue: '2040 (full value chain)', annualReportValue: '2040', status: 'pass', severity: 'info', section: 'Climate change', recommendation: 'Consistent.' },

  // Terminology
  { id: 'cc-021', category: 'Terminology', description: 'Company descriptor used', rnfmValue: 'an integrated, innovative medicines company', annualReportValue: 'a global healthcare company', status: 'review', severity: 'warning', section: 'Introduction and use of certain terms', recommendation: 'Style Guide violation in Annual Report: Novartis should not be described as a "healthcare company" or a "global" company in this context. Per Communications Style Guide, preferred descriptor is "an integrated, innovative medicines company."' },
  { id: 'cc-022', category: 'Terminology', description: 'Workforce term used', rnfmValue: 'employees', annualReportValue: 'associates (in 2 instances)', status: 'review', severity: 'info', section: 'Health and safety in our workforce', recommendation: 'Style Guide rule: use "employee" not "associate" in annual reports. Two instances in Annual Report use "associates" — flag for editorial correction.' },

  // Reporting basis
  { id: 'cc-023', category: 'Reporting Basis', description: 'Legal reporting basis cited', rnfmValue: 'Art. 964a-c Swiss Code of Obligations', annualReportValue: 'Art. 964a-c CO', status: 'pass', severity: 'info', section: 'Introduction and use of certain terms', recommendation: 'Consistent reference. RNFM uses full form; Annual Report uses abbreviation.' },
  { id: 'cc-024', category: 'Reporting Basis', description: 'Assurance provider', rnfmValue: 'KPMG AG (ISAE 3000/3410 limited assurance)', annualReportValue: 'KPMG AG', status: 'pass', severity: 'info', section: 'Introduction and use of certain terms', recommendation: 'Consistent. RNFM provides assurance standard detail.' },

  // Water
  { id: 'cc-025', category: 'Water', description: 'Sites in water-stressed areas assessed', rnfmValue: '100% (PSCI Water Quality Maturity Ladder)', annualReportValue: 'All high-risk sites assessed', status: 'review', severity: 'warning', section: 'Pollution of water', recommendation: 'Different framing: RNFM gives specific percentage and methodology; Annual Report uses qualitative statement. Consider aligning for precision per ESG anti-greenwashing rules.' },
];

export const consistencyStats = {
  total: consistencyChecks.length,
  pass: consistencyChecks.filter(c => c.status === 'pass').length,
  fail: consistencyChecks.filter(c => c.status === 'fail').length,
  review: consistencyChecks.filter(c => c.status === 'review').length,
  errorCount: consistencyChecks.filter(c => c.status === 'fail' && c.severity === 'error').length,
};

// --- Contradiction classification (Adrian, 21 Aug 2026) ---------------------
// Adrian asked the consistency check to flag whether the two reports actually
// CONTRADICT each other, not just whether keywords match. This inspects the two
// values and classifies the nature of the divergence, computing the numeric
// delta where both sides are numbers — so the UI can say "values disagree by
// 30 ktCO2e" or "unit mismatch" rather than a generic pass/fail.

export type ContradictionKind =
  | 'consistent'          // values agree
  | 'numeric_conflict'    // both numeric, but different -> a real contradiction
  | 'unit_mismatch'       // same quantity expressed in different units
  | 'precision_diff'      // same value at different rounding/precision
  | 'terminology_diff'    // wording/term divergence (style, not data)
  | 'restatement';        // one side reflects a disclosed restatement/correction

export interface ContradictionAnalysis {
  kind: ContradictionKind;
  contradicts: boolean;   // true = a genuine contradiction a reviewer must resolve
  detail: string;
}

const NUM_RE = /-?\d[\d\s.,]*\d|-?\d/;
function toNumber(v: string): number | null {
  const m = v.match(NUM_RE);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/\s/g, '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
function unitOf(v: string): string | null {
  const m = v.match(/(ktco2e|tco2e|gwh|mwh|gj|%|million|billion|usd|fte)/i);
  return m ? m[1].toLowerCase() : null;
}

export function classifyContradiction(c: { rnfmValue: string; annualReportValue: string; category: string }): ContradictionAnalysis {
  const a = c.rnfmValue.trim();
  const b = c.annualReportValue.trim();
  if (a === b) return { kind: 'consistent', contradicts: false, detail: 'Identical values.' };

  const restated = /restated|correction|per ifrs|b58|error/i.test(a + b);
  const na = toNumber(a), nb = toNumber(b);
  const ua = unitOf(a), ub = unitOf(b);

  if (ua && ub && ua !== ub) {
    return { kind: 'unit_mismatch', contradicts: true, detail: `Unit mismatch: "${ua}" vs "${ub}" — reconcile the unit of measure before both figures can be compared.` };
  }
  if (na != null && nb != null && na !== nb) {
    const delta = Math.abs(na - nb);
    const pct = na !== 0 ? (delta / Math.abs(na)) * 100 : 100;
    // A tiny relative difference reads as a rounding/precision divergence.
    if (pct < 2 && !restated) {
      return { kind: 'precision_diff', contradicts: false, detail: `Values differ by ~${pct.toFixed(1)}% (${delta}) — likely a rounding/precision difference, not a contradiction.` };
    }
    return {
      kind: restated ? 'restatement' : 'numeric_conflict',
      contradicts: !restated,
      detail: restated
        ? `One report reflects a disclosed restatement; the other still shows the pre-correction figure (Δ ${delta}). Align the un-restated side.`
        : `The two reports disagree numerically by ${delta} (${pct.toFixed(1)}%). This is a genuine contradiction to resolve.`,
    };
  }
  if (restated) {
    return { kind: 'restatement', contradicts: true, detail: 'One side reflects a disclosed restatement/correction; the other does not. Align or add a restatement footnote.' };
  }
  return { kind: 'terminology_diff', contradicts: false, detail: 'Wording/terminology divergence (style, not data) — align per the Style Guide.' };
}
