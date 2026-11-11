// G.4 — Australian ASRS report.
// The ASRS (AASB S1/S2) report is based on ISSB with minor Australian
// modifications. Global ISSB-compliant content authored in the RNFM is mapped
// automatically into the local AASB requirements for the Australian legal
// entity; only Australian-specific modifications are authored separately.

export interface AsrsMapping {
  aasbRequirement: string;   // local AASB requirement
  issbSource: string;        // global ISSB basis
  rnfmSection: string;       // where the global content lives in the RNFM
  status: 'mapped' | 'local_modification' | 'relief_applied';
  note: string;
}

export const asrsMappings: AsrsMapping[] = [
  { aasbRequirement: 'AASB S2 §5–6 Governance', issbSource: 'IFRS S2 §5–6', rnfmSection: '7.1 Corporate governance', status: 'mapped', note: 'Board/management oversight of climate risks mapped directly from global content.' },
  { aasbRequirement: 'AASB S2 §8–22 Strategy', issbSource: 'IFRS S2 §8–22', rnfmSection: '8.1 Climate change', status: 'mapped', note: 'Climate risks/opportunities, transition plan and scenario analysis mapped from RNFM.' },
  { aasbRequirement: 'AASB S2 §23–24 Risk management', issbSource: 'IFRS S2 §23–24', rnfmSection: '8.1.7–8.1.12 Climate risk and resilience', status: 'mapped', note: 'Identification, assessment and integration processes mapped from global content.' },
  { aasbRequirement: 'AASB S2 §29 GHG emissions', issbSource: 'IFRS S2 §29', rnfmSection: '8.1.13 Table: Climate Metrics', status: 'mapped', note: 'Scope 1/2/3 mapped from MDD; measured under the GHG Protocol as required by AASB S2.' },
  { aasbRequirement: 'AASB S2 §33–34 Targets', issbSource: 'IFRS S2 §33–34', rnfmSection: '8.1.5 Table: Climate target performance', status: 'mapped', note: 'Gross vs net targets and carbon-credit reliance mapped from global content.' },
  { aasbRequirement: 'AASB S2 Aus paragraphs — legal entity scope', issbSource: '—', rnfmSection: '—', status: 'local_modification', note: 'Scoped to the Australian consolidated legal entity; group figures apportioned where required.' },
  { aasbRequirement: 'AASB S1 §E1 climate-first transition relief', issbSource: 'IFRS S1 §C3', rnfmSection: '—', status: 'relief_applied', note: 'First-year relief: climate-only disclosure under AASB S2; broader sustainability topics deferred.' },
  { aasbRequirement: 'AASB S2 §C4 Scope 3 relief', issbSource: 'IFRS S2 §C2', rnfmSection: '8.1.13', status: 'relief_applied', note: 'First-year Scope 3 relief available; Novartis discloses Scope 3 voluntarily from global data.' },
];

export const asrsStatusLabel: Record<AsrsMapping['status'], string> = {
  mapped: 'Mapped from RNFM',
  local_modification: 'Australian modification',
  relief_applied: 'Transition relief',
};

export const asrsStatusColor: Record<AsrsMapping['status'], string> = {
  mapped: '#16a34a',
  local_modification: '#8b5cf6',
  relief_applied: '#f59e0b',
};
