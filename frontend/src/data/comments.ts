// Comments & change-requests raised on a subsection.
//
// Any role can leave a comment. Roles that cannot edit (Owner, Legal — and the
// Input Provider once their subsection is locked) instead raise a REQUEST: a
// comment that asks for a change they cannot make themselves. Requests are routed
// to / assignable to the Editor/Admin team, who get an AI recommendation on how
// to handle each one and then approve as-is or edit-and-approve (applying it as a
// tracked change). Comments and requests are demo state (localStorage-backed via
// the editor), seeded here so the flow is visible out of the box.

export type ThreadKind = 'comment' | 'request';
// Adrian 2026-08-31: the Editor resolves, dismisses, or sends a request back
// (with comments) to the requester. 'sent_back' is an open-ish state — it counts
// as unresolved and is surfaced to the original author to action.
export type RequestStatus = 'open' | 'assigned' | 'resolved' | 'dismissed' | 'sent_back';

export interface CommentThread {
  id: string;
  sectionId: string;
  kind: ThreadKind;
  author: string;
  authorRole: 'input_provider' | 'owner' | 'legal' | 'editor';
  createdAt: string;
  // The passage the comment/request refers to (free text quote for the demo).
  quote?: string;
  body: string;
  // Requests carry a lifecycle; plain comments stay 'open' and can be resolved.
  status: RequestStatus;
  assignedTo?: string;      // Editor/Admin the request is assigned to
  // AI recommendation for how an Editor should handle the request.
  aiRecommendation?: string;
  // Suggested replacement text the Editor can accept or tweak before applying.
  aiSuggestedText?: string;
  // Resolution audit.
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  // When the Editor sends a request back, the comment they attach for the
  // requester (Adrian 2026-08-31).
  sentBackNote?: string;
}

// A thread is "unresolved" (still needs attention, blocks marking a section
// updated) when it is open, assigned, or has been sent back to the requester.
export function isUnresolved(status: RequestStatus): boolean {
  return status === 'open' || status === 'assigned' || status === 'sent_back';
}

// AI recommendation for how an Editor should handle a request. In production this
// is the RNFM Draft Generation Agent (Bedrock AgentCore) prompted with the
// request + the passage + knowledge-base context; for the demo it is a
// deterministic, request-aware generator so the recommendation reflects what was
// actually asked rather than a fixed string.
export interface AiHandling {
  recommendation: string;
  suggestedText: string;
}

export function recommendHandling(thread: CommentThread): AiHandling {
  const b = thread.body.toLowerCase();
  const quote = thread.quote?.trim();
  const base = quote ? quote.replace(/\.$/, '') : 'the referenced passage';

  // Greenwashing / unqualified-claim softening.
  if (b.includes('carbon neutral') || b.includes('greenwash') || b.includes('unqualified') || b.includes('soften')) {
    return {
      recommendation: 'Legal is flagging an unqualified environmental claim. Recommend qualifying the statement with its scope and the use of carbon-removal credits, consistent with the FY2025 approved wording and greenwashing guidance. Low risk; apply as a tracked change for Legal to re-review.',
      suggestedText: `${base} — specifically carbon neutrality for Scope 1 and 2 emissions from energy, achieved by reducing emissions and neutralising residual emissions with certified carbon-removal credits, biomethane and SAF certificates (see Climate change methodology).`,
    };
  }
  // Add prior-year comparison / assurance scope.
  if (b.includes('prior-year') || b.includes('prior year') || b.includes('comparison') || b.includes('assurance') || b.includes('∆')) {
    return {
      recommendation: 'Owner is asking for a year-on-year comparison and clear assurance scope. Recommend adding the prior-year figure and the ∆ limited-assurance marker, sourced from the approved FY2025 metrics. Factual/low risk; apply as a tracked change.',
      suggestedText: `${base} (prior year: comparative figure), in scope for external limited assurance (∆) under ISAE 3000.`,
    };
  }
  // Methodology / definition detail.
  if (b.includes('methodology') || b.includes('define') || b.includes('definition') || b.includes('how')) {
    return {
      recommendation: 'The request asks for methodology detail. Recommend a brief methodology note referencing the basis of preparation, without changing the reported figure. Apply as a tracked change and cross-reference the RNFM methodology section.',
      suggestedText: `${base}. Methodology: figures are prepared in accordance with the stated reporting criteria (see Basis of preparation); no change to the reported value.`,
    };
  }
  // Fallback: acknowledge + draft a neutral edit for the Editor to refine.
  return {
    recommendation: 'Recommend addressing the comment with a targeted wording change that preserves the reported facts. Review the drafted text below, adjust if needed, then approve to apply it as a tracked change for sign-off.',
    suggestedText: `${base} — revised to address the reviewer's comment: "${thread.body}"`,
  };
}

// Seed a couple of Owner/Legal requests so the routing + AI-recommend flow is
// demonstrable immediately (section ids match reportSections slugs).
export const initialCommentThreads: CommentThread[] = [
  {
    id: 'cr-seed-1',
    sectionId: 'sub-8-1-3',
    kind: 'request',
    author: 'Dr. Taylor Brenner',
    authorRole: 'legal',
    createdAt: '2026-06-17T11:00:00Z',
    quote: 'we achieved carbon neutrality in our own operations',
    body: 'Please soften this to avoid an unqualified "carbon neutral" claim — add the scope (Scope 1 & 2 from energy) and note reliance on carbon-removal credits, per greenwashing guidance.',
    status: 'open',
  },
  {
    id: 'cr-seed-2',
    sectionId: 'sub-9-1-1',
    kind: 'request',
    author: 'Riley Okafor',
    authorRole: 'owner',
    createdAt: '2026-06-17T14:30:00Z',
    quote: 'lost-time injury and illness rate for employees was 0.12',
    body: 'Add the prior-year comparison and confirm the assurance scope (∆) so the metric reads consistently with the rest of the section.',
    status: 'open',
  },
];
