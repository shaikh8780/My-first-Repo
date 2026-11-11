export type DocStatus = 'indexed' | 'pending' | 'failed';
export type DocType = 'internal_policy' | 'reporting_standard' | 'prior_report' | 'peer_report' | 'external_disclosure';

export interface KBDocument {
  id: string;
  title: string;
  type: DocType;
  framework?: string;
  year: number;
  sourceOrg: string;
  pages: number;
  status: DocStatus;
  chunks: number;
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
}

export const kbDocuments: KBDocument[] = [
  // Core Ethics, Conduct & Governance Policies
  { id: 'kb-001', title: 'Novartis Code of Ethics 2025', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 42, status: 'indexed', chunks: 168, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:00:00Z', fileSize: '3.4 MB' },
  { id: 'kb-002', title: 'Doing Business Ethically Policy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 16, status: 'indexed', chunks: 64, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:05:00Z', fileSize: '1.1 MB' },
  { id: 'kb-003', title: 'Conflicts of Interest Policy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 12, status: 'indexed', chunks: 48, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:10:00Z', fileSize: '0.8 MB' },
  { id: 'kb-004', title: 'Anti-Fraud Policy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 10, status: 'indexed', chunks: 40, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:15:00Z', fileSize: '0.7 MB' },
  { id: 'kb-005', title: 'Antitrust and Fair Competition Policy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 14, status: 'indexed', chunks: 56, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:20:00Z', fileSize: '0.9 MB' },
  { id: 'kb-006', title: 'SpeakUp Policy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 8, status: 'indexed', chunks: 32, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:25:00Z', fileSize: '0.5 MB' },
  { id: 'kb-007', title: 'Non-Retaliation Policy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 6, status: 'indexed', chunks: 24, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:30:00Z', fileSize: '0.4 MB' },
  { id: 'kb-008', title: 'Ethical Use of Data and Technology Policy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 18, status: 'indexed', chunks: 72, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:35:00Z', fileSize: '1.3 MB' },
  { id: 'kb-009', title: 'Trade Sanctions and Export Controls Guideline', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 22, status: 'indexed', chunks: 88, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:40:00Z', fileSize: '1.6 MB' },
  { id: 'kb-010', title: 'Anti-Bribery External Partner Guideline', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 14, status: 'indexed', chunks: 56, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-15T09:45:00Z', fileSize: '1.0 MB' },
  // Third-Party & Supply Chain Governance
  { id: 'kb-011', title: 'Third Party Code (TPC) v3', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 28, status: 'indexed', chunks: 112, uploadedBy: 'Alex Moreau', uploadDate: '2025-10-16T09:00:00Z', fileSize: '2.0 MB' },
  { id: 'kb-012', title: 'External Partner Risk Management (EPRM) Framework', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 32, status: 'indexed', chunks: 128, uploadedBy: 'Alex Moreau', uploadDate: '2025-10-16T09:10:00Z', fileSize: '2.4 MB' },
  { id: 'kb-013', title: 'EPRM Guideline and Handbook', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 48, status: 'indexed', chunks: 192, uploadedBy: 'Alex Moreau', uploadDate: '2025-10-16T09:20:00Z', fileSize: '3.6 MB' },
  { id: 'kb-014', title: 'Labor Rights Third Party Questionnaire (TPQ)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 16, status: 'indexed', chunks: 64, uploadedBy: 'Alex Moreau', uploadDate: '2025-10-16T09:30:00Z', fileSize: '1.1 MB' },
  { id: 'kb-015', title: 'Raw Material Certification Questionnaire', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 10, status: 'indexed', chunks: 40, uploadedBy: 'Alex Moreau', uploadDate: '2025-10-16T09:40:00Z', fileSize: '0.7 MB' },
  { id: 'kb-016', title: 'Environmental Sustainability Criteria Annex (supplier contracts)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 8, status: 'indexed', chunks: 32, uploadedBy: 'Alex Moreau', uploadDate: '2025-10-16T09:50:00Z', fileSize: '0.6 MB' },
  // Human Rights
  { id: 'kb-017', title: 'Human Rights Commitment Statement', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 12, status: 'indexed', chunks: 48, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-16T10:00:00Z', fileSize: '0.9 MB' },
  { id: 'kb-018', title: 'Human Rights Statement 2025', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 18, status: 'indexed', chunks: 72, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-16T10:10:00Z', fileSize: '1.3 MB' },
  { id: 'kb-019', title: 'Human Rights Country Risk Assessment Matrix', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 24, status: 'indexed', chunks: 96, uploadedBy: 'Alex Moreau', uploadDate: '2025-10-16T10:20:00Z', fileSize: '1.8 MB' },
  // HSE
  { id: 'kb-020', title: 'Global Health, Safety and Environment (HSE) Policy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 14, status: 'indexed', chunks: 56, uploadedBy: 'Robin Faust', uploadDate: '2025-10-16T10:30:00Z', fileSize: '1.0 MB' },
  { id: 'kb-021', title: 'HSE Environmental Compliance Handbook', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 52, status: 'indexed', chunks: 208, uploadedBy: 'Robin Faust', uploadDate: '2025-10-16T10:40:00Z', fileSize: '4.2 MB' },
  { id: 'kb-022', title: 'HSE Management System (ISO 14001/45001 aligned)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 36, status: 'indexed', chunks: 144, uploadedBy: 'Robin Faust', uploadDate: '2025-10-16T10:50:00Z', fileSize: '2.8 MB' },
  { id: 'kb-023', title: 'Health and Safety Guidelines & Handbooks', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 68, status: 'indexed', chunks: 272, uploadedBy: 'Robin Faust', uploadDate: '2025-10-16T11:00:00Z', fileSize: '5.4 MB' },
  // Environmental & Climate
  { id: 'kb-024', title: 'Environmental Sustainability Strategy', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 24, status: 'indexed', chunks: 96, uploadedBy: 'Sam Delgado', uploadDate: '2025-10-17T09:00:00Z', fileSize: '1.8 MB' },
  { id: 'kb-025', title: 'Climate Transition Plan (Net-Zero Roadmap)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 32, status: 'indexed', chunks: 128, uploadedBy: 'Sam Delgado', uploadDate: '2025-10-17T09:10:00Z', fileSize: '2.5 MB' },
  { id: 'kb-026', title: 'Internal Carbon Pricing Framework', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 8, status: 'indexed', chunks: 32, uploadedBy: 'Sam Delgado', uploadDate: '2025-10-17T09:20:00Z', fileSize: '0.6 MB' },
  { id: 'kb-027', title: 'Water Quality Maturity Ladder (PSCI-based)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 12, status: 'indexed', chunks: 48, uploadedBy: 'Robin Faust', uploadDate: '2025-10-17T09:30:00Z', fileSize: '0.9 MB' },
  { id: 'kb-028', title: 'Environmental Management System (ISO 14001)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 28, status: 'indexed', chunks: 112, uploadedBy: 'Robin Faust', uploadDate: '2025-10-17T09:40:00Z', fileSize: '2.1 MB' },
  // Quality & Patient Safety
  { id: 'kb-029', title: 'Quality Management System (QMS)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 44, status: 'indexed', chunks: 176, uploadedBy: 'Riley Okafor', uploadDate: '2025-10-17T10:00:00Z', fileSize: '3.5 MB' },
  { id: 'kb-030', title: 'Pharmacovigilance System', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 36, status: 'indexed', chunks: 144, uploadedBy: 'Riley Okafor', uploadDate: '2025-10-17T10:10:00Z', fileSize: '2.8 MB' },
  { id: 'kb-031', title: 'Product and Patient Safety Training Framework', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 16, status: 'indexed', chunks: 64, uploadedBy: 'Riley Okafor', uploadDate: '2025-10-17T10:20:00Z', fileSize: '1.2 MB' },
  // Reporting & Risk Frameworks
  { id: 'kb-032', title: 'Enterprise Risk Management (ERM) Framework', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 38, status: 'indexed', chunks: 152, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-17T10:30:00Z', fileSize: '2.9 MB' },
  { id: 'kb-033', title: 'Integrated Assurance Model (Three Lines)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 14, status: 'indexed', chunks: 56, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-17T10:40:00Z', fileSize: '1.0 MB' },
  { id: 'kb-034', title: 'Nonfinancial Reporting Risk Framework', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 18, status: 'indexed', chunks: 72, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-17T10:50:00Z', fileSize: '1.4 MB' },
  // Marketing & Medical Governance
  { id: 'kb-035', title: 'Medical Interaction Global Guidelines', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 22, status: 'indexed', chunks: 88, uploadedBy: 'Riley Okafor', uploadDate: '2025-10-17T11:00:00Z', fileSize: '1.6 MB' },
  { id: 'kb-036', title: 'Policy on Creation and Approval of Promotional Content', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 16, status: 'indexed', chunks: 64, uploadedBy: 'Riley Okafor', uploadDate: '2025-10-17T11:10:00Z', fileSize: '1.2 MB' },
  // Board & Governance Documents
  { id: 'kb-037', title: 'Organizational Regulations of Novartis AG', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 32, status: 'indexed', chunks: 128, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-17T11:20:00Z', fileSize: '2.4 MB' },
  { id: 'kb-038', title: 'Board Committee Charters (GSNC, ACC, Compensation)', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 24, status: 'indexed', chunks: 96, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-17T11:30:00Z', fileSize: '1.8 MB' },
  // Communications & Style
  { id: 'kb-039', title: 'Novartis Corporate Affairs Communications Style Guide (March 2024)', type: 'internal_policy', year: 2024, sourceOrg: 'Novartis', pages: 24, status: 'indexed', chunks: 96, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-18T08:00:00Z', fileSize: '1.4 MB' },
  // Biodiversity & Circular Economy
  { id: 'kb-040', title: 'Novartis Biodiversity Position Statement', type: 'internal_policy', year: 2024, sourceOrg: 'Novartis', pages: 8, status: 'indexed', chunks: 32, uploadedBy: 'Nina Berger', uploadDate: '2025-10-18T09:00:00Z', fileSize: '0.6 MB' },
  { id: 'kb-041', title: 'Novartis Circular Economy Roadmap 2024-2030', type: 'internal_policy', year: 2024, sourceOrg: 'Novartis', pages: 22, status: 'indexed', chunks: 88, uploadedBy: 'Robin Faust', uploadDate: '2025-10-18T09:10:00Z', fileSize: '2.1 MB' },
  // Reporting Standards
  { id: 'kb-042', title: 'ESRS Standards — Full Set (EFRAG 2023)', type: 'reporting_standard', framework: 'ESRS', year: 2023, sourceOrg: 'EFRAG', pages: 284, status: 'indexed', chunks: 1140, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T08:00:00Z', fileSize: '12.4 MB' },
  { id: 'kb-043', title: 'ESRS Implementation Guidance (EFRAG IG-1)', type: 'reporting_standard', framework: 'ESRS', year: 2024, sourceOrg: 'EFRAG', pages: 96, status: 'indexed', chunks: 385, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T08:30:00Z', fileSize: '5.2 MB' },
  { id: 'kb-044', title: 'GRI Universal Standards 2021', type: 'reporting_standard', framework: 'GRI', year: 2021, sourceOrg: 'GRI', pages: 72, status: 'indexed', chunks: 290, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T09:00:00Z', fileSize: '4.1 MB' },
  { id: 'kb-045', title: 'GRI 102 Climate Change (2025) & GRI 103 Energy (2025)', type: 'reporting_standard', framework: 'GRI', year: 2025, sourceOrg: 'GRI', pages: 48, status: 'indexed', chunks: 192, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T09:15:00Z', fileSize: '3.4 MB' },
  { id: 'kb-046', title: 'IFRS S1 General Requirements', type: 'reporting_standard', framework: 'ISSB', year: 2023, sourceOrg: 'IFRS Foundation', pages: 54, status: 'indexed', chunks: 216, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T09:30:00Z', fileSize: '3.8 MB' },
  { id: 'kb-047', title: 'IFRS S2 Climate-related Disclosures', type: 'reporting_standard', framework: 'ISSB', year: 2023, sourceOrg: 'IFRS Foundation', pages: 48, status: 'indexed', chunks: 192, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T10:00:00Z', fileSize: '3.2 MB' },
  { id: 'kb-048', title: 'TCFD Final Recommendations (2017)', type: 'reporting_standard', framework: 'TCFD', year: 2017, sourceOrg: 'FSB TCFD', pages: 66, status: 'indexed', chunks: 265, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T10:30:00Z', fileSize: '4.5 MB' },
  { id: 'kb-049', title: 'Swiss Code of Obligations Art. 964a (Nonfinancial Matters)', type: 'reporting_standard', framework: 'GRI', year: 2024, sourceOrg: 'Swiss Federal Council', pages: 18, status: 'indexed', chunks: 72, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T11:00:00Z', fileSize: '1.2 MB' },
  { id: 'kb-050', title: 'Swiss Ordinance on Climate Disclosures', type: 'reporting_standard', framework: 'TCFD', year: 2024, sourceOrg: 'Swiss Federal Council', pages: 14, status: 'indexed', chunks: 56, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-12T11:10:00Z', fileSize: '0.9 MB' },
  // Prior Reports
  { id: 'kb-051', title: 'Novartis RNFM Report FY2025', type: 'prior_report', year: 2025, sourceOrg: 'Novartis', pages: 50, status: 'indexed', chunks: 420, uploadedBy: 'Jordan Avery', uploadDate: '2025-11-20T08:00:00Z', fileSize: '4.2 MB' },
  { id: 'kb-052', title: 'Novartis RNFM Report FY2024', type: 'prior_report', year: 2024, sourceOrg: 'Novartis', pages: 128, status: 'indexed', chunks: 512, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-14T08:00:00Z', fileSize: '8.9 MB' },
  { id: 'kb-053', title: 'Novartis RNFM Report FY2023', type: 'prior_report', year: 2023, sourceOrg: 'Novartis', pages: 116, status: 'indexed', chunks: 464, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-14T08:30:00Z', fileSize: '7.8 MB' },
  { id: 'kb-054', title: 'Novartis Annual Report 2025', type: 'prior_report', year: 2025, sourceOrg: 'Novartis', pages: 296, status: 'indexed', chunks: 1184, uploadedBy: 'Jordan Avery', uploadDate: '2025-11-20T09:00:00Z', fileSize: '18.4 MB' },
  { id: 'kb-055', title: 'Novartis Corporate Governance Report 2024', type: 'prior_report', year: 2024, sourceOrg: 'Novartis', pages: 48, status: 'indexed', chunks: 192, uploadedBy: 'Jordan Avery', uploadDate: '2025-10-14T09:30:00Z', fileSize: '3.6 MB' },
  { id: 'kb-056', title: 'Novartis CDP Climate Response 2025', type: 'external_disclosure', year: 2025, sourceOrg: 'Novartis', pages: 86, status: 'indexed', chunks: 345, uploadedBy: 'Sam Delgado', uploadDate: '2025-10-20T10:00:00Z', fileSize: '4.8 MB' },
  { id: 'kb-057', title: 'KPMG Limited Assurance Report (ISAE 3000/3410)', type: 'external_disclosure', year: 2025, sourceOrg: 'KPMG AG', pages: 4, status: 'indexed', chunks: 16, uploadedBy: 'Jordan Avery', uploadDate: '2025-11-25T09:00:00Z', fileSize: '0.3 MB' },
  // Peer Reports
  { id: 'kb-058', title: 'Roche Sustainability Report 2024', type: 'peer_report', year: 2024, sourceOrg: 'Roche', pages: 142, status: 'indexed', chunks: 580, uploadedBy: 'Jordan Avery', uploadDate: '2025-12-08T09:00:00Z', fileSize: '9.4 MB' },
  { id: 'kb-059', title: 'AstraZeneca Sustainability Data Summary 2024', type: 'peer_report', year: 2024, sourceOrg: 'AstraZeneca', pages: 98, status: 'indexed', chunks: 420, uploadedBy: 'Jordan Avery', uploadDate: '2025-12-08T09:15:00Z', fileSize: '6.8 MB' },
  { id: 'kb-060', title: 'Pfizer ESG Report 2024', type: 'peer_report', year: 2024, sourceOrg: 'Pfizer', pages: 124, status: 'indexed', chunks: 510, uploadedBy: 'Jordan Avery', uploadDate: '2025-12-08T09:30:00Z', fileSize: '8.2 MB' },
  { id: 'kb-061', title: 'GSK ESG Performance Report 2024', type: 'peer_report', year: 2024, sourceOrg: 'GSK', pages: 88, status: 'indexed', chunks: 370, uploadedBy: 'Jordan Avery', uploadDate: '2025-12-08T09:45:00Z', fileSize: '5.9 MB' },
  { id: 'kb-062', title: 'Sanofi Integrated Report & CSR 2024', type: 'peer_report', year: 2024, sourceOrg: 'Sanofi', pages: 156, status: 'indexed', chunks: 640, uploadedBy: 'Jordan Avery', uploadDate: '2025-12-08T10:00:00Z', fileSize: '10.8 MB' },
  // Disclosure Checklists & Datapoint Registers
  { id: 'kb-063', title: 'ESRS Datapoint Register — EC Draft Delegated Act (6 May 2026, Amended ESRS)', type: 'reporting_standard', framework: 'ESRS', year: 2026, sourceOrg: 'European Commission', pages: 42, status: 'indexed', chunks: 305, uploadedBy: 'Jordan Avery', uploadDate: '2025-12-16T08:00:00Z', fileSize: '2.8 MB' },
  { id: 'kb-064', title: 'Novartis IFRS S1/S2 Disclosure Checklist v1', type: 'reporting_standard', framework: 'ISSB', year: 2025, sourceOrg: 'Novartis', pages: 28, status: 'indexed', chunks: 110, uploadedBy: 'Quinn Harper', uploadDate: '2025-12-16T08:30:00Z', fileSize: '1.6 MB' },
  { id: 'kb-065', title: 'Sample Disclosure Checklist — Proposed Template (Combined IFRS+ESRS)', type: 'reporting_standard', framework: 'ESRS', year: 2026, sourceOrg: 'Novartis', pages: 18, status: 'indexed', chunks: 85, uploadedBy: 'Quinn Harper', uploadDate: '2025-12-16T09:00:00Z', fileSize: '1.2 MB' },
  // Pending/Failed
  { id: 'kb-066', title: 'Novartis People & Organization Report 2025', type: 'internal_policy', year: 2025, sourceOrg: 'Novartis', pages: 52, status: 'pending', chunks: 0, uploadedBy: 'Casey Lindqvist', uploadDate: '2025-12-14T14:00:00Z', fileSize: '4.1 MB' },
  { id: 'kb-067', title: 'Novartis Tax Transparency Report 2025', type: 'external_disclosure', year: 2025, sourceOrg: 'Novartis', pages: 34, status: 'failed', chunks: 0, uploadedBy: 'Jordan Avery', uploadDate: '2025-12-14T14:30:00Z', fileSize: '2.8 MB' },
];

export const kbStats = {
  totalDocuments: kbDocuments.length,
  indexed: kbDocuments.filter(d => d.status === 'indexed').length,
  pending: kbDocuments.filter(d => d.status === 'pending').length,
  failed: kbDocuments.filter(d => d.status === 'failed').length,
  totalChunks: kbDocuments.reduce((sum, d) => sum + d.chunks, 0),
  totalPages: kbDocuments.reduce((sum, d) => sum + d.pages, 0),
  lastSync: '2025-12-14T14:30:00Z',
  byType: {
    internal_policy: kbDocuments.filter(d => d.type === 'internal_policy').length,
    reporting_standard: kbDocuments.filter(d => d.type === 'reporting_standard').length,
    prior_report: kbDocuments.filter(d => d.type === 'prior_report').length,
    peer_report: kbDocuments.filter(d => d.type === 'peer_report').length,
    external_disclosure: kbDocuments.filter(d => d.type === 'external_disclosure').length,
  },
};

export const docTypeLabels: Record<DocType, string> = {
  internal_policy: 'Internal Policies',
  reporting_standard: 'Reporting Standards',
  prior_report: 'Prior Reports',
  peer_report: 'Peer Reports',
  external_disclosure: 'External Disclosures',
};
