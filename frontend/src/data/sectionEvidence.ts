// Wave 3 — per-section evidence documents. A section can have a list of evidence
// documents attached to it (uploaded files or knowledge-base picks). This list
// is the grounding context the in-editor AI uses when it drafts or revises text
// ("update the text to reflect this document"). In the real system these map to
// Bedrock Knowledge Base documents filtered to the section; in the prototype
// they are stored client-side per section, keyed by section id.

export type EvidenceSource = 'upload' | 'knowledge_base';

export interface EvidenceDoc {
  id: string;
  sectionId: string;
  name: string;
  source: EvidenceSource;
  docType: string;          // e.g. "Internal Policy", "Peer Report", "Prior RNFM"
  addedBy: string;
  addedAt: string;
  note?: string;            // short description / why it is relevant
  sizeLabel?: string;       // e.g. "1.2 MB" for uploaded files
  // #5 (Adrian 2026-07-15): an Input Provider can attach a document as AUDIT
  // EVIDENCE for a specific claim — "here's where this figure comes from". These
  // fields are optional so existing per-section evidence is unaffected.
  //   paragraphRef — a short quote/anchor of the claim the evidence supports.
  //   evidenceKind — what kind of proof it is (distinct from AI citations, which
  //                  are automatic; this is human-supplied provenance).
  paragraphRef?: string;
  evidenceKind?: EvidenceKind;
}

export type EvidenceKind = 'screenshot' | 'sop' | 'email' | 'external_report' | 'other';

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  screenshot: 'Screenshot of source system',
  sop: 'SOP / policy excerpt',
  email: 'Email confirmation',
  external_report: 'External report page',
  other: 'Other evidence',
};

// Live persistence key, owned by the data-access layer (api.report.evidence via
// LocalAdapter). Exported so the adapter and any migration code share it.
export const SECTION_EVIDENCE_KEY = 'editor-section-evidence:v3';

// A few seeded evidence documents so the demo shows the feature populated on the
// climate-strategy and workforce subsections that already carry AI content.
export const seedEvidence: EvidenceDoc[] = [
  {
    id: 'ev-seed-1', sectionId: 'sub-8-1-3', name: 'Novartis-Climate-Transition-Plan-2026.pdf',
    source: 'knowledge_base', docType: 'Internal Policy', addedBy: 'Sam Delgado',
    addedAt: '2026-06-10T09:00:00Z', note: 'Board-approved decarbonization roadmap and interim milestones', sizeLabel: '2.4 MB',
  },
  {
    id: 'ev-seed-2', sectionId: 'sub-8-1-3', name: 'CDP-Climate-Submission-2026.pdf',
    source: 'knowledge_base', docType: 'External Disclosure', addedBy: 'Sam Delgado',
    addedAt: '2026-06-10T09:05:00Z', note: 'Final FY2026 Scope 1/2/3 figures as submitted to CDP', sizeLabel: '5.1 MB',
  },
  {
    id: 'ev-seed-3', sectionId: 'sub-9-1-1', name: 'Global-People-Survey-Nov2025.xlsx',
    source: 'knowledge_base', docType: 'Internal Data', addedBy: 'Casey Lindqvist',
    addedAt: '2026-06-11T14:20:00Z', note: 'Engagement + HSE metrics feed for ESRS S1', sizeLabel: '860 KB',
  },
  // A paragraph-anchored AUDIT-EVIDENCE example (#5): a screenshot backing a
  // specific claim, distinct from the AI citations.
  {
    id: 'ev-seed-4', sectionId: 'sub-9-1-1', name: 'LTIR-EHS-dashboard-2026-01-08.png',
    source: 'upload', docType: 'Screenshot', addedBy: 'Casey Lindqvist',
    addedAt: '2026-06-12T08:30:00Z', sizeLabel: '420 KB',
    evidenceKind: 'screenshot',
    paragraphRef: 'lost-time injury and illness rate for employees was 0.12',
    note: 'EHS dashboard screenshot on 8 Jan 2026 showing the final FY2026 LTIR of 0.12.',
  },
];

// NOTE: persistence for evidence now lives in the data-access layer
// (api.report.evidence, backed by LocalAdapter/RestAdapter). This module keeps
// only the types, the seed, and pure helpers. The live localStorage key
// ('editor-section-evidence:v3') and its seed-fallback semantics are owned by
// the LocalAdapter.

export function evidenceForSection(docs: EvidenceDoc[], sectionId: string): EvidenceDoc[] {
  return docs.filter(d => d.sectionId === sectionId);
}
