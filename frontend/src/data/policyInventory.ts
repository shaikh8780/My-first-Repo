export type PolicyStatus = 'indexed' | 'pending' | 'outdated';

export interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  owner: string;
  year: number;
  status: PolicyStatus;
  esrsRelevance: string[];
  lastReviewed: string;
}

export const policyCategories = [
  'Core Ethics & Governance',
  'Third-Party & Supply Chain',
  'Human Rights',
  'HSE (Health, Safety & Environment)',
  'Environmental & Climate',
  'Quality & Patient Safety',
  'Reporting, Risk & Control',
  'Marketing & Commercial',
  'Board Governance',
] as const;

export const policyDocuments: PolicyDocument[] = [
  // Core Ethics & Governance (10)
  { id: 'pol-001', title: 'Novartis Code of Ethics 2025', category: 'Core Ethics & Governance', owner: 'Ethics & Compliance', year: 2025, status: 'indexed', esrsRelevance: ['G1-1', 'G1-3'], lastReviewed: '2025-01-15' },
  { id: 'pol-002', title: 'Doing Business Ethically Policy', category: 'Core Ethics & Governance', owner: 'Ethics & Compliance', year: 2025, status: 'indexed', esrsRelevance: ['G1-1'], lastReviewed: '2025-02-01' },
  { id: 'pol-003', title: 'Conflicts of Interest Policy', category: 'Core Ethics & Governance', owner: 'Ethics & Compliance', year: 2025, status: 'indexed', esrsRelevance: ['G1-1'], lastReviewed: '2025-03-10' },
  { id: 'pol-004', title: 'Anti-Fraud Policy', category: 'Core Ethics & Governance', owner: 'Ethics & Compliance', year: 2025, status: 'indexed', esrsRelevance: ['G1-3', 'G1-4'], lastReviewed: '2025-01-20' },
  { id: 'pol-005', title: 'Antitrust and Fair Competition Policy', category: 'Core Ethics & Governance', owner: 'Legal', year: 2025, status: 'indexed', esrsRelevance: ['G1-1'], lastReviewed: '2025-04-01' },
  { id: 'pol-006', title: 'SpeakUp Policy', category: 'Core Ethics & Governance', owner: 'Ethics & Compliance', year: 2025, status: 'indexed', esrsRelevance: ['G1-1', 'S1-3'], lastReviewed: '2025-02-15' },
  { id: 'pol-007', title: 'Non-Retaliation Policy', category: 'Core Ethics & Governance', owner: 'Ethics & Compliance', year: 2025, status: 'indexed', esrsRelevance: ['G1-1', 'S1-3'], lastReviewed: '2025-03-01' },
  { id: 'pol-008', title: 'Ethical Use of Data and Technology Policy', category: 'Core Ethics & Governance', owner: 'DDIT / Ethics', year: 2025, status: 'indexed', esrsRelevance: ['G1-1', 'S4-1'], lastReviewed: '2025-05-20' },
  { id: 'pol-009', title: 'Trade Sanctions and Export Controls Guideline', category: 'Core Ethics & Governance', owner: 'Legal', year: 2025, status: 'indexed', esrsRelevance: ['G1-1'], lastReviewed: '2025-04-15' },
  { id: 'pol-010', title: 'Anti-Bribery External Partner Guideline', category: 'Core Ethics & Governance', owner: 'Ethics & Compliance', year: 2025, status: 'indexed', esrsRelevance: ['G1-3', 'G1-4', 'S2-1'], lastReviewed: '2025-01-30' },

  // Third-Party & Supply Chain (6)
  { id: 'pol-011', title: 'Third Party Code (TPC v3)', category: 'Third-Party & Supply Chain', owner: 'Procurement', year: 2024, status: 'indexed', esrsRelevance: ['S2-1', 'S2-4', 'G1-2'], lastReviewed: '2024-09-01' },
  { id: 'pol-012', title: 'External Partner Risk Management (EPRM) Framework', category: 'Third-Party & Supply Chain', owner: 'Procurement', year: 2025, status: 'indexed', esrsRelevance: ['S2-1', 'S2-2', 'S2-3', 'S2-4'], lastReviewed: '2025-03-15' },
  { id: 'pol-013', title: 'Labor Rights Third-Party Questionnaire', category: 'Third-Party & Supply Chain', owner: 'Human Rights', year: 2024, status: 'indexed', esrsRelevance: ['S2-1', 'S2-4'], lastReviewed: '2024-11-01' },
  { id: 'pol-014', title: 'Environmental Sustainability Criteria for Suppliers', category: 'Third-Party & Supply Chain', owner: 'Procurement', year: 2024, status: 'indexed', esrsRelevance: ['E1-2', 'E2-1', 'S2-1'], lastReviewed: '2024-10-15' },
  { id: 'pol-015', title: 'Responsible Sourcing Standard', category: 'Third-Party & Supply Chain', owner: 'Procurement', year: 2025, status: 'indexed', esrsRelevance: ['S2-1', 'S2-4', 'G1-2'], lastReviewed: '2025-02-28' },
  { id: 'pol-016', title: 'Supplier Diversity Program Guidelines', category: 'Third-Party & Supply Chain', owner: 'Procurement', year: 2024, status: 'pending', esrsRelevance: ['G1-2'], lastReviewed: '2024-06-01' },

  // Human Rights (4)
  { id: 'pol-017', title: 'Human Rights Commitment Statement', category: 'Human Rights', owner: 'Corporate Affairs', year: 2025, status: 'indexed', esrsRelevance: ['S1-1', 'S2-1', 'S3-1'], lastReviewed: '2025-06-01' },
  { id: 'pol-018', title: 'Human Rights Statement 2025', category: 'Human Rights', owner: 'Corporate Affairs', year: 2025, status: 'indexed', esrsRelevance: ['S1-1', 'S1-17', 'S2-1', 'S3-1'], lastReviewed: '2025-06-15' },
  { id: 'pol-019', title: 'Labor Rights Policy 2.0', category: 'Human Rights', owner: 'HR / Ethics', year: 2024, status: 'indexed', esrsRelevance: ['S1-1', 'S1-8', 'S2-1'], lastReviewed: '2024-12-01' },
  { id: 'pol-020', title: 'Human Rights Country Risk Matrix', category: 'Human Rights', owner: 'Ethics & Compliance', year: 2025, status: 'indexed', esrsRelevance: ['S1-17', 'S2-4'], lastReviewed: '2025-04-01' },

  // HSE (5)
  { id: 'pol-021', title: 'Global HSE Policy', category: 'HSE (Health, Safety & Environment)', owner: 'HSE', year: 2025, status: 'indexed', esrsRelevance: ['S1-14', 'E2-1'], lastReviewed: '2025-01-01' },
  { id: 'pol-022', title: 'Environmental Compliance Handbook', category: 'HSE (Health, Safety & Environment)', owner: 'HSE', year: 2024, status: 'indexed', esrsRelevance: ['E2-1', 'E2-2', 'E3-1'], lastReviewed: '2024-08-15' },
  { id: 'pol-023', title: 'HSE Management System Standard', category: 'HSE (Health, Safety & Environment)', owner: 'HSE', year: 2025, status: 'indexed', esrsRelevance: ['S1-14', 'E2-1'], lastReviewed: '2025-03-01' },
  { id: 'pol-024', title: 'Occupational Health Standard', category: 'HSE (Health, Safety & Environment)', owner: 'HSE', year: 2024, status: 'indexed', esrsRelevance: ['S1-14'], lastReviewed: '2024-09-15' },
  { id: 'pol-025', title: 'Process Safety Management Guideline', category: 'HSE (Health, Safety & Environment)', owner: 'HSE', year: 2024, status: 'pending', esrsRelevance: ['S1-14'], lastReviewed: '2024-07-01' },

  // Environmental & Climate (5)
  { id: 'pol-026', title: 'Environmental Sustainability Strategy 2030', category: 'Environmental & Climate', owner: 'Sustainability', year: 2024, status: 'indexed', esrsRelevance: ['E1-1', 'E1-2', 'E1-3', 'E1-4'], lastReviewed: '2024-12-01' },
  { id: 'pol-027', title: 'Climate Transition Plan (SBTi-validated)', category: 'Environmental & Climate', owner: 'Sustainability', year: 2024, status: 'indexed', esrsRelevance: ['E1-1', 'E1-4', 'E1-6'], lastReviewed: '2024-11-15' },
  { id: 'pol-028', title: 'Carbon Pricing Framework', category: 'Environmental & Climate', owner: 'Finance / Sustainability', year: 2024, status: 'indexed', esrsRelevance: ['E1-8'], lastReviewed: '2024-10-01' },
  { id: 'pol-029', title: 'Water Quality Maturity Ladder (PSCI-based)', category: 'Environmental & Climate', owner: 'HSE', year: 2024, status: 'indexed', esrsRelevance: ['E2-1', 'E2-2', 'E3-1'], lastReviewed: '2024-08-01' },
  { id: 'pol-030', title: 'ISO 14001 EMS Certification Scope', category: 'Environmental & Climate', owner: 'HSE', year: 2025, status: 'indexed', esrsRelevance: ['E2-1', 'E2-2'], lastReviewed: '2025-05-01' },

  // Quality & Patient Safety (4)
  { id: 'pol-031', title: 'Quality Management System (QMS) Policy', category: 'Quality & Patient Safety', owner: 'Quality', year: 2025, status: 'indexed', esrsRelevance: ['S4-1', 'S4-4'], lastReviewed: '2025-02-01' },
  { id: 'pol-032', title: 'Pharmacovigilance Policy', category: 'Quality & Patient Safety', owner: 'Drug Safety', year: 2025, status: 'indexed', esrsRelevance: ['S4-1', 'S4-3'], lastReviewed: '2025-01-15' },
  { id: 'pol-033', title: 'Internal Quality Audit Framework', category: 'Quality & Patient Safety', owner: 'Quality', year: 2024, status: 'indexed', esrsRelevance: ['S4-1'], lastReviewed: '2024-12-15' },
  { id: 'pol-034', title: 'Patient Safety Reporting Standard', category: 'Quality & Patient Safety', owner: 'Drug Safety', year: 2025, status: 'indexed', esrsRelevance: ['S4-1', 'S4-3', 'S4-4'], lastReviewed: '2025-04-01' },

  // Reporting, Risk & Control (4)
  { id: 'pol-035', title: 'Enterprise Risk Management (ERM) Framework', category: 'Reporting, Risk & Control', owner: 'Risk Management', year: 2025, status: 'indexed', esrsRelevance: ['ESRS2-IRO1', 'ESRS2-IRO2'], lastReviewed: '2025-03-01' },
  { id: 'pol-036', title: 'Integrated Assurance Model', category: 'Reporting, Risk & Control', owner: 'Internal Audit', year: 2024, status: 'indexed', esrsRelevance: ['ESRS2-GOV5'], lastReviewed: '2024-11-01' },
  { id: 'pol-037', title: 'Nonfinancial Reporting Risk Framework', category: 'Reporting, Risk & Control', owner: 'Corporate Reporting', year: 2025, status: 'indexed', esrsRelevance: ['ESRS2-GOV5', 'ESRS2-IRO1'], lastReviewed: '2025-05-15' },
  { id: 'pol-038', title: 'Internal Controls over Sustainability Reporting (ICSR)', category: 'Reporting, Risk & Control', owner: 'Finance / Sustainability', year: 2025, status: 'pending', esrsRelevance: ['ESRS2-GOV5'], lastReviewed: '2025-06-01' },

  // Marketing & Commercial (2)
  { id: 'pol-039', title: 'Medical Interaction Global Guidelines', category: 'Marketing & Commercial', owner: 'Medical Affairs', year: 2025, status: 'indexed', esrsRelevance: ['S4-1', 'S4-2'], lastReviewed: '2025-02-15' },
  { id: 'pol-040', title: 'Policy on Creation and Approval of Promotional Content', category: 'Marketing & Commercial', owner: 'Marketing', year: 2025, status: 'indexed', esrsRelevance: ['S4-1', 'G1-1'], lastReviewed: '2025-01-30' },

  // Board Governance (2)
  { id: 'pol-041', title: 'Organizational Regulations of Novartis AG', category: 'Board Governance', owner: 'General Counsel', year: 2025, status: 'indexed', esrsRelevance: ['ESRS2-GOV1', 'ESRS2-GOV2', 'ESRS2-GOV3'], lastReviewed: '2025-03-06' },
  { id: 'pol-042', title: 'Board Committee Charters (GSNC, ACC, Compensation)', category: 'Board Governance', owner: 'General Counsel', year: 2025, status: 'indexed', esrsRelevance: ['ESRS2-GOV1', 'ESRS2-GOV2'], lastReviewed: '2025-03-06' },
];

export const policyStats = {
  total: policyDocuments.length,
  indexed: policyDocuments.filter(p => p.status === 'indexed').length,
  pending: policyDocuments.filter(p => p.status === 'pending').length,
  outdated: policyDocuments.filter(p => p.status === 'outdated').length,
  byCategory: policyCategories.map(cat => ({
    category: cat,
    count: policyDocuments.filter(p => p.category === cat).length,
  })),
};
