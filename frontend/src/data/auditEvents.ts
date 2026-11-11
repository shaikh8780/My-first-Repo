export type AuditAction = 'create' | 'edit' | 'comment' | 'submit' | 'approve' | 'reject' | 'generate' | 'scan' | 'export' | 'upload' | 'lock' | 'unlock';

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  section?: string;
  details: string;
}

export const auditEvents: AuditEvent[] = [
  { id: 'ae-001', timestamp: '2026-03-15T08:12:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'create', details: 'Created new report cycle: RNFM FY2026' },
  { id: 'ae-002', timestamp: '2026-03-15T08:30:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'upload', details: 'Uploaded 12 source documents to Knowledge Base' },
  { id: 'ae-003', timestamp: '2026-03-15T09:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'generate', details: 'Initiated AI draft generation for all 86 subsections' },
  { id: 'ae-004', timestamp: '2026-03-15T09:45:00Z', user: 'System', role: 'AI Agent', action: 'generate', section: 'Introduction and use of certain terms', details: 'AI draft generated: 4 200 words, 2 citations' },
  { id: 'ae-005', timestamp: '2026-03-15T10:02:00Z', user: 'System', role: 'AI Agent', action: 'generate', section: 'Climate change', details: 'AI draft generated: 6 800 words, 5 citations' },
  { id: 'ae-006', timestamp: '2026-03-15T10:15:00Z', user: 'System', role: 'AI Agent', action: 'generate', section: 'Health and safety in our workforce', details: 'AI draft generated: 7 200 words, 3 citations' },
  { id: 'ae-007', timestamp: '2026-03-15T10:30:00Z', user: 'System', role: 'AI Agent', action: 'scan', details: '2027 ESRS readiness scan completed: 55% covered, 25% partial, 20% missing' },
  { id: 'ae-008', timestamp: '2026-03-18T09:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'submit', section: 'Introduction and use of certain terms', details: 'Submitted section for SME review' },
  { id: 'ae-009', timestamp: '2026-03-18T09:05:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'submit', section: 'Business conduct', details: 'Submitted section for SME review' },
  { id: 'ae-010', timestamp: '2026-03-20T14:22:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'edit', section: 'Climate change', details: 'Updated Scope 3 Category 11 figures with 2025 data' },
  { id: 'ae-011', timestamp: '2026-03-20T14:30:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'comment', section: 'Climate change', details: 'Comment: "Need to verify Scope 3 Cat 4 transport figures with logistics team"' },
  { id: 'ae-012', timestamp: '2026-03-21T10:15:00Z', user: 'Robin Faust', role: 'Section SME', action: 'edit', section: 'Pollution of water', details: 'Revised VOC emission figures; added Stein facility upgrade data' },
  { id: 'ae-013', timestamp: '2026-03-22T11:00:00Z', user: 'Casey Lindqvist', role: 'Section SME', action: 'edit', section: 'Health and safety in our workforce', details: 'Updated headcount and H&S metrics with Dec 2025 actuals' },
  { id: 'ae-014', timestamp: '2026-03-22T11:30:00Z', user: 'Casey Lindqvist', role: 'Section SME', action: 'comment', section: 'Health and safety in our workforce', details: 'Comment: "TRIR figure confirmed by EHS team — 0.18 is correct"' },
  { id: 'ae-015', timestamp: '2026-03-25T09:00:00Z', user: 'Alex Moreau', role: 'Section SME', action: 'edit', section: 'Working conditions in our value chain', details: 'Added 2025 supplier audit results and remediation outcomes' },
  { id: 'ae-016', timestamp: '2026-03-25T14:00:00Z', user: 'Alex Moreau', role: 'Section SME', action: 'edit', section: 'Due diligence', details: 'Updated due diligence process with 2025 risk assessment results' },
  { id: 'ae-017', timestamp: '2026-03-26T10:30:00Z', user: 'Riley Okafor', role: 'Section SME', action: 'edit', section: 'Access to medicines', details: 'Updated patient access figures to 304M (verified with Global Health team)' },
  { id: 'ae-018', timestamp: '2026-03-27T09:15:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'approve', section: 'Climate change', details: 'SME approved section — ready for legal review' },
  { id: 'ae-019', timestamp: '2026-03-27T09:20:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'lock', section: 'Climate change', details: 'Section locked for legal review stage' },
  { id: 'ae-020', timestamp: '2026-03-28T11:00:00Z', user: 'Casey Lindqvist', role: 'Section SME', action: 'approve', section: 'Health and safety in our workforce', details: 'SME approved section — ready for legal review' },
  { id: 'ae-021', timestamp: '2026-03-28T11:05:00Z', user: 'Casey Lindqvist', role: 'Section SME', action: 'lock', section: 'Health and safety in our workforce', details: 'Section locked for legal review stage' },
  { id: 'ae-022', timestamp: '2026-03-29T14:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'approve', section: 'Introduction and use of certain terms', details: 'Lead approved introduction — final' },
  { id: 'ae-023', timestamp: '2026-03-29T14:05:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'approve', section: 'Business conduct', details: 'Lead approved business conduct section — final' },
  { id: 'ae-024', timestamp: '2026-04-01T09:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'scan', details: 'Re-ran 2027 ESRS readiness scan after SME edits' },
  { id: 'ae-025', timestamp: '2026-04-01T09:15:00Z', user: 'System', role: 'AI Agent', action: 'scan', details: 'Updated readiness scan: 58% covered (+3%), 24% partial, 18% missing' },
  { id: 'ae-026', timestamp: '2026-04-02T10:00:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'submit', section: 'TCFD index', details: 'Submitted TCFD section for legal review' },
  { id: 'ae-027', timestamp: '2026-04-02T10:05:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'lock', section: 'TCFD index', details: 'Section locked for legal review stage' },
  { id: 'ae-028', timestamp: '2026-04-03T11:30:00Z', user: 'Dr. Taylor Brenner', role: 'Legal Reviewer', action: 'comment', section: 'Climate change', details: 'Comment: "Please add Scope 3 category breakdown table per ESRS E1-6 requirement"' },
  { id: 'ae-029', timestamp: '2026-04-03T11:45:00Z', user: 'Dr. Taylor Brenner', role: 'Legal Reviewer', action: 'comment', section: 'Health and safety in our workforce', details: 'Comment: "Verify pay equity claim — need third-party assurance reference"' },
  { id: 'ae-030', timestamp: '2026-04-04T09:00:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'unlock', section: 'Climate change', details: 'Section temporarily unlocked for revisions per legal feedback' },
  { id: 'ae-031', timestamp: '2026-04-04T10:30:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'edit', section: 'Climate change', details: 'Added Scope 3 category breakdown table (categories 1-15)' },
  { id: 'ae-032', timestamp: '2026-04-04T10:45:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'lock', section: 'Climate change', details: 'Re-locked section after addressing legal comment' },
  { id: 'ae-033', timestamp: '2026-04-05T14:00:00Z', user: 'Casey Lindqvist', role: 'Section SME', action: 'edit', section: 'Health and safety in our workforce', details: 'Added PwC assurance reference for pay equity analysis' },
  { id: 'ae-034', timestamp: '2026-04-08T09:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'upload', details: 'Uploaded 3 additional peer reports to Knowledge Base (GSK, Sanofi, Pfizer 2024)' },
  { id: 'ae-035', timestamp: '2026-04-08T10:00:00Z', user: 'System', role: 'AI Agent', action: 'generate', details: 'Knowledge Base re-indexed: 25 documents, 4 200 chunks' },
  { id: 'ae-036', timestamp: '2026-04-09T11:00:00Z', user: 'Dr. Taylor Brenner', role: 'Legal Reviewer', action: 'approve', section: 'Introduction and use of certain terms', details: 'Legal sign-off: introduction approved' },
  { id: 'ae-037', timestamp: '2026-04-09T11:15:00Z', user: 'Dr. Taylor Brenner', role: 'Legal Reviewer', action: 'approve', section: 'Business conduct', details: 'Legal sign-off: business conduct section approved' },
  { id: 'ae-038', timestamp: '2026-04-10T09:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'scan', details: 'Final 2027 ESRS readiness scan before export' },
  { id: 'ae-039', timestamp: '2026-04-10T09:10:00Z', user: 'System', role: 'AI Agent', action: 'scan', details: 'Final scan: 62% covered, 22% partial, 16% missing (improved from initial)' },
  { id: 'ae-040', timestamp: '2026-04-10T14:00:00Z', user: 'Dr. Taylor Brenner', role: 'Legal Reviewer', action: 'comment', section: 'TCFD index', details: 'Comment: "TCFD section looks comprehensive — minor formatting suggestion on scenario table"' },
  { id: 'ae-041', timestamp: '2026-04-11T10:00:00Z', user: 'Sam Delgado', role: 'Section SME', action: 'edit', section: 'TCFD index', details: 'Reformatted scenario analysis table per legal feedback' },
  { id: 'ae-042', timestamp: '2026-04-11T13:00:00Z', user: 'Casey Lindqvist', role: 'Section SME', action: 'submit', section: 'Health and safety in our workforce', details: 'Re-submitted workforce section with PwC assurance reference' },
  { id: 'ae-043', timestamp: '2026-04-12T09:00:00Z', user: 'Dr. Taylor Brenner', role: 'Legal Reviewer', action: 'approve', section: 'Climate change', details: 'Legal sign-off: climate section approved (with Scope 3 breakdown)' },
  { id: 'ae-044', timestamp: '2026-04-12T09:30:00Z', user: 'Dr. Taylor Brenner', role: 'Legal Reviewer', action: 'approve', section: 'Health and safety in our workforce', details: 'Legal sign-off: workforce section approved' },
  { id: 'ae-045', timestamp: '2026-04-12T10:00:00Z', user: 'Dr. Taylor Brenner', role: 'Legal Reviewer', action: 'approve', section: 'TCFD index', details: 'Legal sign-off: TCFD section approved' },
  { id: 'ae-046', timestamp: '2026-04-12T14:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'export', details: 'Initiated MDD-compliant DOCX export for approved sections' },
  { id: 'ae-047', timestamp: '2026-04-12T14:15:00Z', user: 'System', role: 'Export Pipeline', action: 'export', details: 'DOCX export completed: Novartis_RNFM_FY2026_MDD.docx (2.4 MB)' },
  { id: 'ae-048', timestamp: '2026-04-13T09:00:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'comment', details: 'Comment on report: "Due diligence, pollution, access, responsible marketing still in SME review — need attention before year-end deadline"' },
  { id: 'ae-049', timestamp: '2026-04-14T11:00:00Z', user: 'Robin Faust', role: 'Section SME', action: 'submit', section: 'Pollution of water', details: 'Submitted pollution section for review (late submission)' },
  { id: 'ae-050', timestamp: '2026-04-15T14:32:00Z', user: 'Jordan Avery', role: 'ESG Reporting Lead', action: 'scan', details: '2027 ESRS readiness re-scan after latest submissions: tracking toward year-end target' },
];

export const actionColors: Record<AuditAction, string> = {
  create: '#6366f1',
  edit: '#3b82f6',
  comment: '#8b5cf6',
  submit: '#f59e0b',
  approve: '#16a34a',
  reject: '#ef4444',
  generate: '#06b6d4',
  scan: '#0891b2',
  export: '#059669',
  upload: '#7c3aed',
  lock: '#dc2626',
  unlock: '#ea580c',
};
