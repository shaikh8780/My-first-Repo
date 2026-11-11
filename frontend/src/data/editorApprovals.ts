import type { WorkflowStage, ReportSection } from './reportSections';
import { reportSections } from './reportSections';
import type { ActingRole } from './workflowRoles';

// Role model (Adrian 2026-08-31): each subsection is drafted by its Input
// Provider(s) — who edit + comment but no longer sign off — and signed off by
// one or more Owners at L2 (a legal reviewer is an Owner flagged legal; one
// legal sign-off suffices). These ApprovalRecords are retained only as sign-off
// records folded into the version history — the live workflow state lives in the
// editor's sectionProgress (edited/updated) / l2SignOff stores.
export type ReviewerRole = ActingRole;

export interface Reviewer {
  id: string;
  name: string;
  role: ReviewerRole;
  avatarInitials: string;
}

export interface ApprovalRecord {
  sectionId: string;
  stage: WorkflowStage;   // the stage the action was taken FROM
  reviewer: Reviewer;
  action: 'approved' | 'changes_requested' | 'pending';
  comment?: string;
  timestamp?: string;
  // Legal sign-off captures a consent attestation and who actually signed
  // (may differ from the assigned reviewer when another Legal-team member acts).
  consentNote?: string;
  signedBy?: string;
}

function initials(name: string): string {
  const parts = name.replace(/^Dr\.\s*/, '').split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

// The advancing transitions, in order. Draft→sme_review is the Input Provider
// (L3); the remaining owner sign-offs happen at the section (L2) level.
const ACTION_STAGES: WorkflowStage[] = ['draft', 'sme_review', 'legal_review'];

function reviewer(name: string, role: ReviewerRole): Reviewer {
  return { id: name.toLowerCase().replace(/[^a-z]+/g, '-'), name, role, avatarInitials: initials(name) };
}

export interface ApprovalChain {
  sectionId: string;
  steps: { stage: WorkflowStage; reviewer: Reviewer }[];
}

// Build the approval chain for a subsection: Input Provider(s) submit, then one
// owner sign-off step per assigned owner (a legal reviewer is just an owner).
// The stage each owner step maps to is capped at the last action stage.
function chainFor(sec: ReportSection): { stage: WorkflowStage; reviewer: Reviewer }[] {
  const steps: { stage: WorkflowStage; reviewer: Reviewer }[] =
    sec.roles.inputProviders.map(ip => ({ stage: 'draft' as WorkflowStage, reviewer: reviewer(ip, 'input_provider') }));
  sec.roles.owners.forEach((owner, i) => {
    const stage = ACTION_STAGES[Math.min(i + 1, ACTION_STAGES.length - 1)];
    steps.push({ stage, reviewer: reviewer(owner, 'owner') });
  });
  return steps;
}

// Build the chain (Input Provider submit → owner sign-offs) for every subsection.
export const approvalChains: ApprovalChain[] = reportSections.map(sec => ({
  sectionId: sec.id,
  steps: chainFor(sec),
}));

const stageOrder: WorkflowStage[] = ['draft', 'sme_review', 'legal_review', 'approved', 'exported'];

export function getApprovalStatus(sectionId: string, currentStage: WorkflowStage, records: ApprovalRecord[]): { stage: WorkflowStage; reviewer: Reviewer; status: 'completed' | 'active' | 'waiting'; record?: ApprovalRecord }[] {
  const chain = approvalChains.find(c => c.sectionId === sectionId);
  if (!chain) return [];
  const currentIdx = stageOrder.indexOf(currentStage);

  return chain.steps.map(step => {
    const stepIdx = stageOrder.indexOf(step.stage);
    const record = records.find(r => r.sectionId === sectionId && r.stage === step.stage);

    if (record?.action === 'approved') return { ...step, status: 'completed' as const, record };
    if (stepIdx === currentIdx) return { ...step, status: 'active' as const, record };
    if (stepIdx < currentIdx) return { ...step, status: 'completed' as const, record };
    return { ...step, status: 'waiting' as const };
  });
}

// Derive initial approval records from each subsection's current stage: every
// action stage strictly before the current stage is marked approved; the
// current stage is pending. Timestamps are deterministic for demo stability.
export const initialApprovalRecords: ApprovalRecord[] = reportSections.flatMap(sec => {
  const chain = approvalChains.find(c => c.sectionId === sec.id);
  if (!chain) return [];
  const currentIdx = stageOrder.indexOf(sec.stage);
  return chain.steps.map((step, i) => {
    const stepIdx = stageOrder.indexOf(step.stage);
    if (stepIdx < currentIdx) {
      return { sectionId: sec.id, stage: step.stage, reviewer: step.reviewer, action: 'approved' as const, timestamp: `2026-04-0${(i % 8) + 1}T10:00:00Z` };
    }
    return { sectionId: sec.id, stage: step.stage, reviewer: step.reviewer, action: 'pending' as const };
  }).filter(r => stageOrder.indexOf(r.stage) <= currentIdx);
});
