import type { WorkflowStage } from './reportSections';
import { reportSections, primaryInputProvider } from './reportSections';

export type { WorkflowStage } from './reportSections';

export interface WorkflowStep {
  stage: WorkflowStage;
  label: string;
  description: string;
  completedDate?: string;
  active: boolean;
}

// Report-level rollup of the per-subsection workflow. Because every one of the
// 86 subsections now advances independently, this timeline is a high-level view
// only; the true state lives per subsection (see reportSections + editorApprovals).
export const workflowSteps: WorkflowStep[] = [
  { stage: 'draft', label: 'AI Draft Generation', description: 'AI generates initial subsection drafts from the knowledge base and prior-year baseline', completedDate: '2025-11-15T10:30:00Z', active: false },
  { stage: 'sme_review', label: 'Input & SME Review', description: 'Input Providers draft and subject-matter experts review their subsections', completedDate: undefined, active: true },
  { stage: 'legal_review', label: 'Legal Sign-off', description: 'Legal / Compliance sign-off per subsection', active: false },
  { stage: 'approved', label: 'Owner Sign-off', description: 'Owner sign-off — accountable for content accuracy', active: false },
  { stage: 'exported', label: 'Exported', description: 'MDD-compliant DOCX generated and delivered', active: false },
];

// B — the four roles are surfaced on each assignment row.
export interface SectionAssignment {
  sectionId: string;
  ref: string;
  sectionTitle: string;
  topicL1: string;
  topicL2?: string;
  assignee: string; // Input Provider (kept for backward-compat)
  inputProvider: string;
  owners: string[]; // section owners (sign off at L2; a legal reviewer is an owner)
  role: string;
  stage: WorkflowStage;
  dueDate: string;
  overdue: boolean;
}

// Deterministic due-date/overdue assignment for demo stability.
function dueFor(idx: number, stage: WorkflowStage): { dueDate: string; overdue: boolean } {
  const day = 10 + (idx % 18);
  const month = stage === 'draft' || stage === 'sme_review' ? '05' : '06';
  const overdue = stage === 'draft' || (stage === 'sme_review' && idx % 3 === 0);
  return { dueDate: `2026-${month}-${String(day).padStart(2, '0')}`, overdue };
}

export const sectionAssignments: SectionAssignment[] = reportSections.map((s, idx) => {
  const { dueDate, overdue } = dueFor(idx, s.stage);
  return {
    sectionId: s.id,
    ref: s.ref,
    sectionTitle: s.title,
    topicL1: s.topicL1,
    topicL2: s.topicL2,
    assignee: primaryInputProvider(s.roles),
    inputProvider: primaryInputProvider(s.roles),
    owners: s.roles.owners,
    role: 'Input Provider',
    stage: s.stage,
    dueDate,
    overdue,
  };
});

export const workflowStats = {
  totalSections: sectionAssignments.length,
  byStage: {
    draft: sectionAssignments.filter(s => s.stage === 'draft').length,
    sme_review: sectionAssignments.filter(s => s.stage === 'sme_review').length,
    legal_review: sectionAssignments.filter(s => s.stage === 'legal_review').length,
    approved: sectionAssignments.filter(s => s.stage === 'approved').length,
    exported: sectionAssignments.filter(s => s.stage === 'exported').length,
  },
  overdue: sectionAssignments.filter(s => s.overdue).length,
  completionPercent: Math.round(sectionAssignments.filter(s => s.stage === 'approved' || s.stage === 'exported').length / sectionAssignments.length * 100),
};

// C/L — report-level roll-forward rollup for the dashboard.
export const rollForwardStats = {
  updated: reportSections.filter(s => s.rollForwardStatus === 'updated').length,
  needs_update: reportSections.filter(s => s.rollForwardStatus === 'needs_update').length,
  confirmed_unchanged: reportSections.filter(s => s.rollForwardStatus === 'confirmed_unchanged').length,
  new: reportSections.filter(s => s.rollForwardStatus === 'new').length,
  total: reportSections.length,
};
