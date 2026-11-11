import { useState } from 'react';

// Small "NEW" badge used to highlight the 31 Aug 2026 role/workflow updates so
// they stand out on the Demo page.
function NewBadge({ label = 'NEW · 31 Aug' }: { label?: string }) {
  return (
    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.4px', color: '#fff', background: '#dc2626', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

type View = 'dashboard' | 'editor' | 'compliance' | 'knowledgebase' | 'benchmarking' | 'audit' | 'auditview' | 'upload' | 'guide' | 'architecture' | 'suggestions' | 'reports' | 'consistency' | 'policies' | 'demo' | 'analysis' | 'structure' | 'admin';

interface DemoStep {
  id: number;
  title: string;
  duration: string;
  targetView: View | null;
  secondaryView?: View;
  talkingPoints: string[];
  demoActions: string[];
  keyMessage: string;
}

interface Props {
  onNavigate: (view: View) => void;
}

// "Why & How" reference — the questions the customer asks most, with concise,
// grounded answers. Kept on the demo page so a presenter can pull it up mid-demo.
interface QA { q: string; a: string }
interface QAGroup { category: string; icon: string; items: QA[] }

const whyHow: QAGroup[] = [
  {
    category: 'Why we built this',
    icon: '🎯',
    items: [
      { q: 'Why does Novartis need this?', a: 'The RNFM is mandatory under Swiss CO Art. 964a, and CSRD/ESRS becomes mandatory from FY2027 (300+ disclosure datapoints across 11 standards). Today the report takes 8–16 weeks of manual drafting coordinated over email and shared drives, with high inconsistency risk between sections. This platform cuts first-draft time from weeks to minutes while keeping every claim traceable.' },
      { q: 'Why AI rather than a template or document tool?', a: 'Formatting is the easy part — the effort is drafting grounded narrative that covers each disclosure requirement and citing its source. Retrieval-augmented generation drafts from your own indexed documents, so the section starts ~80% complete instead of blank.' },
      { q: 'Why keep humans in the loop at all?', a: 'This is a regulated, externally-assured disclosure. The AI drafts; people verify, edit, and formally sign off. Nothing is published without role-based human approval — the AI never has the final say.' },
    ],
  },
  {
    category: 'How the AI works & why to trust it',
    icon: '✦',
    items: [
      { q: 'How do we know the AI is not hallucinating?', a: 'Every AI-generated claim carries a citation marker linked to the exact source chunk — document name, page reference, and excerpt shown in the evidence panel. Human-edited claims are flagged as human-authored. The target is 0% hallucination on factual claims, verified by citation-coverage checks at export.' },
      { q: 'How does it draft a section?', a: 'The RNFM Draft Generation Agent (Claude on Amazon Bedrock AgentCore) retrieves the relevant source chunks, the prior-year version of that section, and the applicable ESRS/GRI/TCFD/ISSB requirements, then writes a structured narrative with inline citations grounded only in that retrieved evidence.' },
      { q: 'What is the "roll-forward" the editor shows?', a: 'The AI carries the FY2025 approved section forward to FY2026, then shows an inline redline of exactly what changed year-on-year — so reviewers focus only on the deltas rather than re-reading the whole section.' },
      { q: 'Where does the source content come from?', a: 'An indexed Knowledge Base (Amazon Bedrock Knowledge Bases + OpenSearch Serverless vectors) built from your own policies, prior RNFMs, reporting standards, peer reports, and the style guide. If it is not in your documents, the AI does not assert it.' },
    ],
  },
  {
    category: 'Governance, roles & audit',
    icon: '☑',
    items: [
      { q: 'Who is allowed to change what?', a: 'Role-based, enforced via Cognito groups: one or more Input Providers draft each subsection (edit + comment, no sign-off); Editors/Admins are the only role that accepts/rejects (or edits) tracked changes and marks a subsection "updated"; Owners provide formal sign-off at section level. Guests are read-only + comment; an external Auditor gets a dedicated read-only Audit view. Export and the audit trail are Editor/Admin-only.' },
      { q: 'How is sign-off controlled?', a: 'An Input Provider edit marks the subsection "edited"; the Editor confirms it "updated" once comments are addressed; then the section Owners sign off at L2. Every non-legal owner must sign, and among Legal/Compliance owners a single sign-off is sufficient. An Owner then releases the approved section to the Auditor view.' },
      { q: 'Is there a full audit trail?', a: 'Yes — an append-only record of every edit (with before/after snapshots), approval, upload, compliance scan, and export, attributed to a user with a UTC timestamp. Retained and archived for 7 years to meet assurance requirements.' },
      { q: 'What happens if approved content is edited again?', a: 'Editing an approved section freezes the current text and its sign-offs as an immutable version, then resets the section to Draft for re-approval. Nothing is ever overwritten silently.' },
    ],
  },
  {
    category: 'Compliance & standards',
    icon: '📑',
    items: [
      { q: 'Is the report ESRS-compliant today?', a: 'The FY2026 report is filed under Swiss CO Art. 964a. ESRS (CSRD) is mandatory only from FY2027 — so the Compliance module is a forward-looking readiness overlay showing how well today\'s report already covers future ESRS requirements, not a claim of current ESRS compliance.' },
      { q: 'Which frameworks are covered?', a: 'ESRS (E1–E5, S1–S4, G1 + cross-cutting), GRI, TCFD, and ISSB (IFRS S1/S2), plus Modern Slavery Act and Norwegian Transparency Act mapping for human-rights disclosures.' },
      { q: 'How is a compliance "gap" decided?', a: 'The Compliance Gap Analysis Agent maps each section to each disclosure requirement and classifies coverage as covered / partial / missing with a confidence score, extracting the supporting evidence. For gaps it drafts suggested fill text grounded in the Knowledge Base.' },
    ],
  },
  {
    category: 'Architecture, security & data',
    icon: '🏗',
    items: [
      { q: 'What is it built on?', a: 'A React single-page app served via CloudFront/S3 → FastAPI on ECS Fargate → Amazon Bedrock AgentCore (Claude Sonnet) → OpenSearch Serverless vectors, with DynamoDB persistence, S3 document store, SQS async jobs, and Step Functions ingestion. Fully AWS-native.' },
      { q: 'How do users log in?', a: 'Amazon Cognito federated to the Novartis corporate identity provider (SAML/OIDC) — users sign in with their standard corporate credentials; no separate accounts.' },
      { q: 'Where does our data live?', a: 'Inside your own AWS account. Source documents sit in S3 (KMS-encrypted, versioned) and structured data in DynamoDB (customer-managed KMS keys). Models are invoked through Amazon Bedrock within your tenancy — your content is not used to train foundation models.' },
      { q: 'Is this the real production system?', a: 'This is a functional prototype demonstrating the full authoring experience and workflow end-to-end. The AI outputs shown are representative; the production build wires this same UI to the live Bedrock agents and pipelines, targeting a production MVP in Q3 2026.' },
    ],
  },
];

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: 'Opening & Context',
    duration: '1 min',
    targetView: null,
    talkingPoints: [
      'Novartis produces a mandatory annual Report on Nonfinancial Matters (RNFM) under Swiss Code of Obligations Art. 964a-c.',
      'Current process is fully manual: 8-16 weeks, cross-functional teams coordinating via email and shared drives, significant inconsistency risk between sections.',
      'CSRD/ESRS becomes mandatory from FY2027 — the compliance burden is about to increase dramatically (305+ disclosure datapoints across 11 standards).',
      'This prototype demonstrates an AI-enabled authoring studio that cuts first-draft generation from weeks to minutes while maintaining full traceability and compliance coverage.',
    ],
    demoActions: [
      'Stay on this page — no navigation needed for the opening.',
      'Set the scene: "Let me show you what we\'ve built."',
    ],
    keyMessage: 'We are solving a real compliance pain point with AI — grounded, traceable, governed.',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    duration: '1.5 min',
    targetView: 'dashboard',
    talkingPoints: [
      'Single command center for the entire reporting cycle.',
      'Report progress bar shows all 93 independently-tracked subsections distributed across workflow stages (Draft → SME Review → Legal Review → Approved → Exported).',
      '2027 ESRS Readiness percentage — shows how well the current Swiss CO report already covers future ESRS requirements.',
      'Workflow timeline shows the structured approval process — no section can skip a stage.',
      'Section assignments table: who owns what, what\'s overdue, current stage per section.',
      '"New Report Cycle" button demonstrates how a new FY report is initiated with AI draft generation.',
    ],
    demoActions: [
      'Click "Navigate to Dashboard" button below.',
      'Point to the progress bar — highlight the color-coded stages.',
      'Show the section assignments table — note overdue items in red.',
      'Optionally click "New Report Cycle" to show the 3-step wizard (Configure → Sections → Generate).',
    ],
    keyMessage: 'Full visibility into report status — no more chasing contributors via email.',
  },
  {
    id: 3,
    title: 'Knowledge Base',
    duration: '1.5 min',
    targetView: 'knowledgebase',
    talkingPoints: [
      '60+ documents indexed via Amazon Bedrock Knowledge Bases with Titan Embeddings v2 (see the live count on the Knowledge Base tab).',
      'Document types: internal policies, ESRS standards, prior RNFMs, peer sustainability reports, style guide, IFRS S1/S2 checklist.',
      'Automatic ingestion pipeline: upload PDF/DOCX → Textract extraction → chunking (512 tokens, 10% overlap) → embedding → OpenSearch Serverless vector index.',
      'Metadata tagging: framework (ESRS/GRI/TCFD/ISSB), year, document type, source organization.',
      'This is the foundation for RAG — every AI-generated claim traces back to a specific chunk from this knowledge base.',
    ],
    demoActions: [
      'Click "Navigate to Knowledge Base" below.',
      'Point to the document count and categories.',
      'Show ingestion status indicators (indexed / processing / failed).',
      'Highlight the search functionality — semantic search across all indexed content.',
    ],
    keyMessage: 'Every AI output is grounded in your actual source documents — no hallucination.',
  },
  {
    id: 4,
    title: 'Report Editor + AI Draft',
    duration: '2.5 min',
    targetView: 'editor',
    talkingPoints: [
      'Word-like rich-text editor (ProseMirror/TipTap) with full track changes, MDD table/image insertion, and per-subsection concurrent-edit locking.',
      'AI-generated first draft for each section — grounded in retrieved Knowledge Base chunks.',
      'Citation markers (superscript numbers) — click any one to see the source document, excerpt, and page reference in the evidence panel.',
      'Roll-forward compare: an expandable "FY2025 approved — full prior-year section" panel shows the whole prior-year section — narrative AND tables — rendered like a published page, and switching the draft to "Editor view" shows an inline redline that highlights every AI change vs FY2025 (reviewers focus only on what the AI touched).',
      'Track Changes: every edit is attributed to a user and can be accepted or rejected; AI-drafted datapoints appear as clearly-tagged pending insertions; uploaded images show as a readable "Image inserted: <file>" thumbnail rather than raw data.',
      'The subsections panel is drag-resizable for readability on dense chapter trees.',
      '"AI: Draft datapoint" assigns a new ESRS/ISSB requirement to a subsection and drafts proposed text as a governed, DR-tagged tracked insertion for the owner to accept.',
      'MDD Export: generates a real Word document using Novartis paragraph styles (nov_*) with table placeholders — gated until every subsection is Approved.',
      'Disclosure Requirements badges show which ESRS DRs each section covers (click to trace where else a datapoint is addressed).',
    ],
    demoActions: [
      'Click "Navigate to Editor" below.',
      'Select the "Climate change → Climate strategy and roadmap" subsection in the sidebar (drag the panel edge wider if helpful).',
      'Click a citation marker to show the evidence panel (source doc, excerpt, page ref).',
      'Switch the draft toggle to "Editor view" to reveal the AI redline vs FY2025, and expand "FY2025 approved — full prior-year section" to show the whole approved prior-year section (with its tables).',
      'Click "✦ AI: Draft datapoint", enter e.g. "ESRS-E1-6", and show the tagged pending insertion in Tracked Changes.',
      'Click "Edit Section", insert an image to show the readable image change, then Save with a reason.',
      'Click "Export DOCX" → "Generate DOCX" to download a real Word file.',
    ],
    keyMessage: 'AI generates the first draft in minutes — humans verify and approve with full source traceability and year-on-year context.',
  },
  {
    id: 5,
    title: '2027 ESRS Readiness Assessment',
    duration: '2 min',
    targetView: 'compliance',
    talkingPoints: [
      'Key framing: the 2026 report is filed under Swiss CO Art. 964a. ESRS becomes mandatory from FY2027 only — this is a readiness overlay, not current compliance.',
      'Automated mapping of every report section to ESRS/GRI/TCFD/ISSB disclosure requirements.',
      'Traffic-light view: Covered (green) / Partial (amber) / Missing (red) for each DR.',
      'Two tabs: "Gap Analysis" shows the traditional matrix; "Disclosure Checklist" shows the proposed template format (DMA, DR ID, Requirement, Section, Fulfilled?, AI Suggestions, Evidence).',
      'AI-generated fill suggestions for missing DRs — grounded in Knowledge Base retrieval.',
      'Filterable by framework (ESRS, GRI, TCFD, ISSB) and by materiality (DMA Y/N).',
    ],
    demoActions: [
      'Click "Navigate to Compliance" below.',
      'Highlight the banner: "Current report filed under Swiss CO — ESRS readiness is a forward-looking overlay."',
      'Show the summary stats (covered / partial / missing / total).',
      'Switch to "Disclosure Checklist" tab — this is the proposed template format.',
      'Filter by DMA = Material to show only applicable items.',
      'Click a "missing" row to show the AI fill suggestion.',
    ],
    keyMessage: 'Know your 2027 ESRS gaps today — while you still have time to close them.',
  },
  {
    id: 6,
    title: 'Consistency Check & Policy Inventory',
    duration: '1.5 min',
    targetView: 'consistency',
    secondaryView: 'policies',
    talkingPoints: [
      'Consistency Check: 25 automated cross-document validations between RNFM and Annual Report.',
      'Catches real discrepancies: Scope 3 totals (5,892 vs 5,900 ktCO2e), unit mismatches (MWh vs GJ), terminology inconsistencies.',
      'Flags IFRS S1.B58 error corrections that need alignment across documents.',
      'Policy Inventory: 42 internal policies across 9 categories with ESRS relevance mapping.',
      'Each policy shows which ESRS DRs it supports — traces evidence back to the governance framework.',
      'Filterable by category, status (active/under review/draft), and search.',
    ],
    demoActions: [
      'Click "Navigate to Consistency Check" below.',
      'Show a failing check (red) — e.g., the Scope 3 total discrepancy.',
      'Show the recommendation for resolution.',
      'Then click "Navigate to Policy Inventory" (second button).',
      'Show ESRS relevance badges on a policy (e.g., Environmental Policy → E1, E2, E3).',
    ],
    keyMessage: 'Automated quality assurance — catches inconsistencies that manual review misses.',
  },
  {
    id: 7,
    title: 'Peer Benchmarking',
    duration: '1 min',
    targetView: 'benchmarking',
    talkingPoints: [
      'Interactive Q&A interface against indexed peer company sustainability reports.',
      'RAG-powered: retrieves relevant passages from Roche, AstraZeneca, Pfizer, GSK and Sanofi reports.',
      'Example questions: "How do pharma peers disclose ESRS E4 biodiversity?", "What Scope 3 methodology do peers use?"',
      'Every answer includes citations to specific peer report pages, with a link to the source report.',
      'Enables evidence-based disclosure decisions before drafting.',
    ],
    demoActions: [
      'Click "Navigate to Benchmarking" below.',
      'Show the chat interface with an example question already answered.',
      'Highlight the citations in the response (peer report name, page reference).',
    ],
    keyMessage: 'Know how your peers are disclosing before you write — informed decisions, not guesswork.',
  },
  {
    id: 8,
    title: 'Wrap-Up & Next Steps',
    duration: '1 min',
    targetView: 'dashboard',
    talkingPoints: [
      'Value delivered: 80%+ faster first draft generation, 100% citation traceability, automated ESRS gap detection.',
      'Architecture: React SPA → FastAPI on ECS Fargate → Bedrock AgentCore (Claude Sonnet) → OpenSearch Serverless vectors.',
      'Fully AWS-native: Cognito auth, DynamoDB persistence, S3 document store, SQS async jobs, Step Functions pipelines.',
      'Production path: Bedrock AgentCore agent deployment, Cognito SAML federation with Novartis IdP, WAF/security hardening.',
      'Timeline: prototype complete, production MVP targeting Q3 2026 pending customer approval.',
      'Questions?',
    ],
    demoActions: [
      'Navigate back to Dashboard for the closing view.',
      'Summarize the three pillars: AI Draft Generation, Compliance Mapping, Governed Workflow.',
      'Open for Q&A.',
    ],
    keyMessage: 'AI-assisted, human-governed, audit-ready — from 16 weeks to days.',
  },
];

export default function DemoScriptView({ onNavigate }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [mode, setMode] = useState<'exec' | 'script' | 'whyhow' | 'updates' | 'try'>('try');
  const step = demoSteps[activeStep];

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Demo</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Toggle between the step-by-step script and the "Why & How" Q&A. */}
          <div className="rf-seg">
            <button className={mode === 'try' ? 'active' : ''} onClick={() => setMode('try')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Try new features <NewBadge label="NEW" /></button>
            <button className={mode === 'exec' ? 'active' : ''} onClick={() => setMode('exec')}>C-Level (~5 min)</button>
            <button className={mode === 'script' ? 'active' : ''} onClick={() => setMode('script')}>Demo Script</button>
            <button className={mode === 'whyhow' ? 'active' : ''} onClick={() => setMode('whyhow')}>Why &amp; How</button>
            <button className={mode === 'updates' ? 'active' : ''} onClick={() => setMode('updates')}>Roles &amp; Updates</button>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {mode === 'try' ? 'Step-by-step tests for the latest capabilities' : mode === 'exec' ? '~5 min · executive walkthrough · 5 stops · how it works + why it helps' : mode === 'script' ? '~12 min · 8 steps · Teleprompter mode' : mode === 'whyhow' ? 'Answers to the questions customers ask most' : 'Role model + what changed since the last call'}
          </span>
          {/* Downloadable walkthrough deck (screenshots + narration) to share with the customer. */}
          <a
            className="btn-primary"
            href="/Novartis-ESG-Studio-Walkthrough.pptx"
            download
            style={{ fontSize: '12px', padding: '8px 14px', textDecoration: 'none' }}
            title="Download a PowerPoint walkthrough with screenshots explaining each capability and the workflow"
          >
            ⬇ Download walkthrough deck (PPTX)
          </a>
        </div>
      </div>

      {/* Shareable-materials banner — visible in both modes. */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid var(--accent)' }}>
        <span style={{ fontSize: '20px' }}>📊</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>Customer walkthrough deck</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            A ready-to-share PowerPoint with annotated screenshots of every capability and the five-stage workflow — how the studio works today.
          </div>
        </div>
        <a
          className="btn-secondary"
          href="/Novartis-ESG-Studio-Walkthrough.pptx"
          download
          style={{ fontSize: '12px', padding: '8px 14px', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          ⬇ Download PPTX
        </a>
      </div>

      {/* Comprehensive overview deck — capabilities, editor, roles, versioning,
          datapoints/confidence, roadmap + what Novartis needs to provide. */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #7c3aed' }}>
        <span style={{ fontSize: '20px' }}>📘</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>Capabilities &amp; requirements overview (detailed)</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            A detailed deck: step-by-step editor, roles &amp; approval, versioning &amp; comparison, datapoints &amp; confidence scoring, the roadmap, what Novartis needs to provide — plus a full visual tour of every screen for look &amp; feel.
          </div>
        </div>
        <a
          className="btn-secondary"
          href="/Novartis-ESG-Studio-Overview.pptx"
          download
          style={{ fontSize: '12px', padding: '8px 14px', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          ⬇ Download PPTX
        </a>
      </div>

      {mode === 'try' && <TryNewFeaturesPanel onNavigate={onNavigate} />}

      {mode === 'exec' && <ExecDemoPanel onNavigate={onNavigate} />}

      {mode === 'whyhow' && <WhyHowPanel />}

      {mode === 'updates' && <RolesAndUpdatesPanel />}

      {mode === 'script' && (
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Sidebar Timeline */}
        <div style={{ width: '260px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Demo Steps</div>
            {demoSteps.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setActiveStep(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  background: i === activeStep ? 'var(--accent-light)' : 'transparent',
                  border: i === activeStep ? '1px solid var(--accent)' : '1px solid transparent',
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: i === activeStep ? 'var(--accent)' : i < activeStep ? '#16a34a' : 'var(--bg-secondary)',
                  color: i === activeStep ? 'white' : i < activeStep ? 'white' : 'var(--text-muted)',
                }}>
                  {i < activeStep ? '✓' : s.id}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: i === activeStep ? 700 : 500, color: i === activeStep ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ padding: '32px' }}>
            {/* Step Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginBottom: '4px' }}>STEP {step.id} OF 8 · {step.duration}</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{step.title}</h2>
              </div>
              {step.targetView && (
                <button className="btn-primary" onClick={() => onNavigate(step.targetView!)}>
                  Navigate to {step.targetView === 'knowledgebase' ? 'Knowledge Base' : step.targetView === 'benchmarking' ? 'Peer Benchmarking' : step.targetView.charAt(0).toUpperCase() + step.targetView.slice(1)}
                </button>
              )}
            </div>

            {/* Key Message */}
            <div style={{ padding: '14px 18px', background: 'var(--accent-light)', borderRadius: '8px', border: '1px solid var(--accent)', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>KEY MESSAGE</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>{step.keyMessage}</div>
            </div>

            {/* Talking Points */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Talking Points</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {step.talkingPoints.map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', marginTop: '7px', flexShrink: 0 }}></div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{point}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Actions */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Demo Actions</h3>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '16px' }}>
                {step.demoActions.map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: i < step.demoActions.length - 1 ? '8px' : 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '20px' }}>{i + 1}.</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Navigation */}
            {step.secondaryView && (
              <div style={{ marginBottom: '24px' }}>
                <button className="btn-secondary" onClick={() => onNavigate(step.secondaryView!)}>
                  Then navigate to {step.secondaryView === 'policies' ? 'Policy Inventory' : step.secondaryView.charAt(0).toUpperCase() + step.secondaryView.slice(1)}
                </button>
              </div>
            )}

            {/* Prev / Next */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
              <button
                className="btn-ghost"
                disabled={activeStep === 0}
                onClick={() => setActiveStep(s => s - 1)}
                style={{ opacity: activeStep === 0 ? 0.4 : 1 }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                Step {step.id} / {demoSteps.length}
              </span>
              <button
                className="btn-primary"
                disabled={activeStep === demoSteps.length - 1}
                onClick={() => setActiveStep(s => s + 1)}
                style={{ opacity: activeStep === demoSteps.length - 1 ? 0.4 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}

// The "Why & How" reference: categorized Q&A a presenter can open mid-demo when
// the customer asks how or why something works. Grounded in the actual solution.
function WhyHowPanel() {
  const [openCat, setOpenCat] = useState<string>(whyHow[0].category);

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {/* Category rail */}
      <div style={{ width: '240px', flexShrink: 0 }}>
        <div className="card" style={{ padding: '12px', position: 'sticky', top: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 10px', marginBottom: '4px' }}>Topics</div>
          {whyHow.map(g => (
            <button
              key={g.category}
              onClick={() => setOpenCat(g.category)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 10px', border: 'none',
                background: openCat === g.category ? 'var(--accent-light)' : 'transparent',
                borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginBottom: '2px',
                color: openCat === g.category ? 'var(--accent)' : 'var(--text-primary)',
                fontWeight: openCat === g.category ? 700 : 500, fontFamily: 'var(--font-sans)',
                display: 'flex', gap: '8px', alignItems: 'center',
              }}
            >
              <span>{g.icon}</span> {g.category}
            </button>
          ))}
        </div>
      </div>

      {/* Answers for the selected category */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {whyHow.filter(g => g.category === openCat).map(g => (
          <div key={g.category} className="card" style={{ padding: '28px 32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>{g.icon}</span> {g.category}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {g.items.map((item, i) => (
                <div key={i} style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{item.q}</div>
                  <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Roles & approval reference + the running change log (Adrian's 2026-07-14 call
// feedback and 2026-07-15 email). Kept on the Demo page so it is on hand for a
// review conversation.
const ROLE_ROWS: { role: string; edits: string; approves: string; when: string; color: string; isNew?: boolean }[] = [
  { role: 'Input Provider (one or more per section)', color: '#6366f1', isNew: true,
    edits: 'Edits their subsection in track changes; can comment. A section can now have MULTIPLE Input Providers. Cannot accept/reject changes.',
    approves: 'No longer signs off. An edit marks the subsection "edited"; the Editor then marks it "updated" once comments are addressed.',
    when: 'During drafting — after the AI draft is accepted and their content is ready.' },
  { role: 'Owner (incl. Legal/Compliance)', color: '#8b5cf6', isNew: true,
    edits: 'Edits in track changes + can comment. A legal/compliance reviewer is an Owner flagged as "Legal".',
    approves: 'Signs off at L2 (section level). Every NON-legal owner must sign; among Legal/Compliance owners a SINGLE sign-off suffices.',
    when: 'Once all subsections in the section are marked "updated" by the Editor.' },
  { role: 'Editor', color: '#0ea5e9', isNew: true,
    edits: 'Edits ANY section. Accepts/rejects tracked changes — and can now MODIFY a change before accepting it.',
    approves: 'Marks sections "updated"; handles change requests with Resolved / Dismiss / Send back (with comments). Does not sign off.',
    when: 'Any time — the only role that can accept/reject changes and edit locked/approved sections.' },
  { role: 'Admin', color: '#16a34a',
    edits: 'Full access — everything an Editor can do.',
    approves: 'Can also sign off at L2 where needed.',
    when: 'Any time (ESG Reporting Lead seat).' },
  { role: 'Guest', color: '#64748b',
    edits: 'Read-only. Can add comments. No editing, no sign-off, no export, no audit trail.',
    approves: 'Never.',
    when: 'For reviewers who should see + comment but not change anything. Auto-assigned to a novartis.com person you "Send to" who has no role yet.' },
  { role: 'Auditor', color: '#b45309', isNew: true,
    edits: 'Nothing — a dedicated, read-only Audit view only. No drafting environment, no AI chat, no internal audit trail.',
    approves: 'Never.',
    when: 'External assurance. Sees the sections an Owner has RELEASED to audit, with their data points and supporting evidence, plus the released report PDF.' },
];

const CHANGE_LOG: { date: string; source: string; items: string[]; isNew?: boolean }[] = [
  {
    date: '31 Aug 2026 (b)', source: 'Adrian call — 21 Aug requirements (excl. roles)', isNew: true,
    items: [
      'Novartis 2026 brand refresh: the app UI and both exports (PDF + Word) now use the new orange identity, via a single brand-token file.',
      'Two Word export variants: "Word (readable)" renders visible tables for offline reviewers; "Word (MDD)" keeps table placeholders for the MDD platform. Word can be exported at any time.',
      'Export scope: choose the whole document or a selection of sections (plus one-click "Export section").',
      'Compliance exports are real now: Gap Analysis and Disclosure Checklist export to Excel/CSV honouring the active filters.',
      'Peer-informed gap suggestions: gap analysis now shows how indexed peers disclose the same requirement ("your peers disclose X").',
      'Section Structure is Admin/Editor-only in the nav; removing a section that still has content now asks for confirmation.',
      'Datapoint source of truth: upload the customer-maintained disclosure-checklist (CSV of the DMA-filtered master Excel); it is versioned and ingested as the authoritative datapoint list (Upload page). SharePoint sync is on the roadmap (deferred to avoid propagating spreadsheet errors).',
      'Admin AI Tuning: per-capability instructions + app-wide context that ground the AI (appended to the built-in guardrails).',
      'Verification & Validation framework: a tracked UAT / prompt-tuning / audit methodology in Admin, with an environment flag (synthetic vs Novartis UAT/prod) — content is only truly validated on real Novartis data.',
      'Consistency checks now classify whether the two reports genuinely contradict (numeric conflict / unit mismatch / restatement) rather than just matching keywords.',
    ],
  },
  {
    date: '31 Aug 2026 (a)', source: 'Adrian — roles & requirements feedback', isNew: true,
    items: [
      'Input Provider: a section can now have MULTIPLE input providers, and they no longer sign off at L3. Instead an edit marks a subsection "edited"; the Editor marks it "updated" once all comments are addressed.',
      'Owner / Legal: legal/compliance owners are flagged. Every non-legal owner must sign off, but among the legal owners a SINGLE sign-off is sufficient.',
      'Editor: can now MODIFY a tracked change before accepting it ("Edit & accept"). Change-request actions are now Resolved / Dismiss / Send back (with comments) instead of "Approve as tracked change".',
      'NEW Auditor role: a dedicated read-only Audit view (no drafting, no AI chat, no internal audit trail). An Owner "Releases to Audit" a signed-off section; the auditor then sees it with its data points, supporting evidence and the released report PDF.',
      '"Send to" on every page: assign an action/request to anyone. A novartis.com recipient with no role yet is auto-added as a Guest; external addresses are rejected.',
      'Export & audit trail are now restricted to Editors and Admins.',
      'Export lets you choose the WHOLE document or a selection of sections (plus a one-click "Export section").',
    ],
  },
  {
    date: '15 Jul 2026', source: "Adrian — email + follow-ups",
    items: [
      'Compliance: partial datapoints now explain WHY they are partially covered; missing datapoints explain why + whether adding them is beneficial ("should this be added?").',
      'GRI, TCFD, Modern Slavery (UK/CA/AU) and Norwegian Transparency Act datapoints are now clickable with their requirement text (authored from the public standards, source-labelled) — same detail level as ESRS/ISSB.',
      'Datapoint chips in the editor show coverage status (covered / partial / missing) and deep-link to that datapoint on the Analysis page.',
      'Roll-forward review is now permission-gated: only seats with edit rights can Confirm / Update / Flag items (a read-only Guest could previously change them). AI roll-forward acceptance aligned to edit rights (now includes Owners).',
      'Dashboard "My Open Tasks": added a "View tasks as" role switch (in the page header, like the editor) so you can preview each role\'s queue — validated against role permissions so it never shows an action a role cannot perform.',
      'Clicking an open task now opens that exact subsection in the editor.',
      'Fixed a blank-screen for returning users and a deployment cache issue so new releases show immediately.',
    ],
  },
  {
    date: '14 Jul 2026', source: "Adrian — post-demo call",
    items: [
      'Wave 1 (UI): Dashboard shows personalised "My Open Tasks"; the "Datapoints assigned" box is prominent at the top of a section; Compliance, Consistency and Peer benchmarking are merged into one "Analysis" area.',
      'Wave 2 (roles): simplified the role model to Input Provider / Owner / Editor / Admin / Guest. Owner absorbs the old Legal role and there can be MULTIPLE owners per section; a section is approved only when every owner has signed off.',
      'Wave 3 (AI in the editor): the AI Assistant is now a Chat / Review / Evidence studio — ask for requirements or peer practice, attach an evidence document and have it update the text, and get automatic typo/style/consistency suggestions. Every AI output arrives as a tracked change the Editor accepts (nothing is applied silently).',
      'Editor view shows the whole section with inline changes; the Clean view hides pending edits until they are accepted.',
      'Added a downloadable customer walkthrough deck (PPTX) and this "Why & How" reference.',
    ],
  },
];

// C-Level ~5 minute walkthrough. A value-first script for an executive audience:
// the 20-second frame, five deliberate "stops", and a close. Each stop carries a
// spoken line, an on-screen action list, a plain-English "how it works" note for
// answering questions live, and a "why this helps Novartis" impact line. Designed
// to be read straight off the screen while presenting.
interface ExecStop {
  n: number;
  view: View | null;
  navLabel?: string;
  dur: string;        // rough time to spend on this stop
  title: string;
  value: string;      // the one value word / why it lands for a C-level
  say: string;        // the line to say out loud
  do: string[];       // the deliberate on-screen moves
  how: string;        // plain-English "how it works" — for answering questions
  helps: string;      // why we're doing it / how it helps Novartis
}

const EXEC_FRAME =
  "The objective of this use case is to build an AI-enabled \"Disclosure Studio\" — a human-governed platform that produces first-best drafts of Novartis's sustainability reports, ensuring they are accurate, compliant with evolving standards (ESRS, ISSB, GRI), consistent, and fully auditable. Here's why it matters: Novartis's Report on Nonfinancial Matters is mandatory — Swiss CO Art. 964a today, and CSRD/ESRS becomes mandatory from FY2027 with 300+ disclosure datapoints across 11 standards. Today it takes 8–16 weeks of manual drafting across ESG, Legal, Finance and HR, coordinated over email and shared drives. What you're about to see cuts that first draft from weeks to minutes — while keeping every sentence traceable to a source and every approval on record. AI drafts; humans stay in control.";

// Step-by-step, click-by-click walkthrough of the Report Editor — the stop
// presenters get lost on. Each step has the exact on-screen control to click,
// what happens as a result, and (where relevant) the role rule it demonstrates.
// Uses the REAL UI labels: the draft toggle is "Editor view / Clean view"
// (there is no "Changes from 2025" button); the year-on-year redline appears
// when you switch to "Editor view". Roles are woven in here rather than in a
// separate card, since the sign-off flow is where they actually matter.
interface EditorStep {
  n: number;
  action: string;      // exactly what to click / do on screen
  result: string;      // what happens as a result — what to point at
  role?: string;       // the role rule this step demonstrates, if any
}
const EDITOR_WALKTHROUGH: EditorStep[] = [
  {
    n: 1,
    action: 'Before you start, click "Reset Demo" (top-right, next to Export). Then, in the left sidebar, expand Environmental matters › Climate change and click subsection 8.1.3 "Climate strategy and roadmap".',
    result: 'Reset clears any leftover test edits so the section is pristine. The editor opens 8.1.3 — a cited, ready-to-review AI draft. This is our hero section: it has a real prior-year version to compare against and a clean set of year-on-year items to review.',
  },
  {
    n: 2,
    action: 'At the top of the draft, switch the view toggle from "Clean view" to "Editor view".',
    result: 'The draft flips to a word-level redline showing exactly what the AI changed versus the FY2025 approved text — green = added, red struck-through = removed. A banner reads "✦ AI rolled this section forward from FY2025…". THIS is the year-on-year comparison. (Clean view shows the finished text; Editor view shows the tracked changes.)',
  },
  {
    n: 3,
    action: 'Click "FY2025 approved — full prior-year section (read-only reference)" to expand it.',
    result: 'The entire prior-year section unfolds, rendered like the published report — narrative and tables. This is the baseline the AI rolled forward, so reviewers can see the before and after side by side.',
  },
  {
    n: 4,
    action: 'In the draft, click a citation marker such as [1].',
    result: 'The evidence panel opens showing the exact source — document name, excerpt and page reference (e.g. the SBTi Target Validation Letter 2024). Every AI claim is traceable; this is the answer to "is the AI making things up?".',
  },
  {
    n: 5,
    action: 'Open the "Roll-forward summary" panel and walk the "Year-on-year roll-forward review" items. On the carbon-neutrality item, click "Confirm"; on the Scope 3 target, click "Update".',
    result: 'Each item is a specific thing that may have changed year-on-year (carbon-neutrality claim, Scope 3 −42% by 2030 target, SBTi validation year). "Confirm" marks it still-correct (badge → green "Confirmed"); "Update" flags it as edited (badge → blue "Updated"); "Flag" defers it. The reviewer only has to check the deltas, not re-read everything.',
    role: 'Only seats with edit rights can Confirm/Update/Flag. Switch "View as" to Guest and the buttons disappear — a read-only reviewer can look but not change.',
  },
  {
    n: 6,
    action: 'Use the "View as" switcher (top-right) to select the Input Provider seat, then click "✓ Accept AI draft as working base", then click "✓ Sign off subsection".',
    result: 'Accepting the AI draft makes it the working text (the redline collapses into Clean view). "Sign off subsection" records the Input Provider\'s L3 sign-off and LOCKS the subsection to them — a toast confirms it. In the Approval workflow panel the "Input Provider (L3)" node turns green.',
    role: 'Input Provider: drafts/edits and signs off their OWN subsection only (level L3). Signing off locks it — Editors/Admins can still edit, but other contributors cannot.',
  },
  {
    n: 7,
    action: 'Switch "View as" to the Editor seat. In the "Tracked changes — accept or reject" list, click "Accept" on one change and note the "Reject" option.',
    result: 'AI-drafted changes carry a purple "✦ AI DRAFT" badge and the datapoint they address (e.g. ISSB-S2-34); human edits show the author and reason. Accept finalises the change into the text; Reject discards it. Nothing the AI writes is applied silently.',
    role: 'Editor: the ONLY role that can accept/reject tracked changes and edit any section. Editors curate content but do not sign off.',
  },
  {
    n: 8,
    action: 'In the sidebar, click the "⧉ Climate change" sub-topic (the consolidated section view). Switch "View as" to an Owner seat.',
    result: 'The whole "Climate change" section opens as one document with a sign-off box: "Input Provider sign-off: n/total" and "Owner sign-off (L2): 0/2". Owner sign-off only unlocks once every subsection has its Input Provider (L3) sign-off.',
    role: 'Owner (Level L2): reviews and signs off the entire SECTION, not individual subsections. A legal/compliance reviewer sits here as an Owner — there is no separate Legal role. Multiple owners are allowed.',
  },
  {
    n: 9,
    action: 'With all subsections signed off, click "Sign off as [Owner name]" in the L2 box (add an optional note first).',
    result: 'The owner\'s pill turns green ("✓ Owner … signed"). When EVERY assigned owner has signed, the header shows "✓ Section fully approved at L2". Only now is the section considered approved — and if any mandatory disclosure were still missing, Legal/Owner sign-off would be blocked.',
    role: 'Admin (ESG Reporting Lead): full access, can also sign off at L2 where needed. Guest: read-only + comment, never signs off. A section is approved only when ALL its owners have signed.',
  },
  {
    n: 10,
    action: 'To show the immutability point: on an already-approved subsection, make an edit.',
    result: 'Editing an approved section freezes the current text and its sign-offs as an immutable version and resets the section to Draft for re-approval. Nothing is ever overwritten silently — the audit trail keeps every before/after snapshot.',
  },
];

// Plain-English glossary of the reporting standards named in the frame — so a
// presenter can answer "what is ESRS / ISSB / GRI?" without leaving the page.
interface StandardDef { abbr: string; name: string; what: string }
const STANDARDS_GLOSSARY: StandardDef[] = [
  {
    abbr: 'Swiss CO Art. 964a–c', name: 'Swiss Code of Obligations',
    what: 'The Swiss law that makes Novartis\'s Report on Nonfinancial Matters (RNFM) mandatory today — requiring disclosure on environmental, social, employee, human-rights and anti-corruption matters. This is what the current report is filed under.',
  },
  {
    abbr: 'CSRD', name: 'Corporate Sustainability Reporting Directive',
    what: 'The EU law that dramatically expands mandatory sustainability reporting. It is the regime that mandates the ESRS standards, and it becomes mandatory for Novartis from FY2027 — the big compliance step-change on the horizon.',
  },
  {
    abbr: 'ESRS', name: 'European Sustainability Reporting Standards',
    what: 'The detailed standards under CSRD: 12 topical standards (E1–E5 environment, S1–S4 social, G1 governance) plus 2 cross-cutting, totalling 300+ disclosure datapoints. This is what the Compliance module maps the report against.',
  },
  {
    abbr: 'ISSB (IFRS S1/S2)', name: 'International Sustainability Standards Board',
    what: 'The global baseline for investor-focused sustainability disclosure. IFRS S1 covers general sustainability-related disclosures; IFRS S2 covers climate. It is the successor to TCFD and is being adopted by regulators worldwide.',
  },
  {
    abbr: 'GRI', name: 'Global Reporting Initiative',
    what: 'The most widely-used voluntary global standards for sustainability reporting, focused on an organisation\'s impact on the economy, environment and people. Long-established and often reported alongside ESRS/ISSB.',
  },
  {
    abbr: 'TCFD', name: 'Task Force on Climate-related Financial Disclosures',
    what: 'The climate-risk disclosure framework (governance, strategy, risk management, metrics & targets). Now largely folded into ISSB\'s IFRS S2, but still referenced and mapped for continuity.',
  },
];

// What the customer actually asked for — Adrian Kyburz's SI&S team requirements.
// Kept on the exec page so the presenter can tie each capability back to a stated need.
const REQ_INTRO =
  "Adrian Kyburz (Head, Disclosure Strategy & Corporate Reporting) and his SI&S team want to:";
const EXEC_REQUIREMENTS: { title: string; detail: string }[] = [
  { title: 'Automate the report drafting cycle', detail: 'Eliminate repeated manual drafting, rework, and cross-functional coordination overhead.' },
  { title: 'Ensure compliance', detail: 'Map report content against ESRS/ISSB disclosure checklists, identify gaps, and flag what\'s outstanding.' },
  { title: 'Support year-on-year roll-forward', detail: 'Automatically carry prior-year content forward, highlight what needs updating, and flag missing data.' },
  { title: 'Provide a Word-like editing experience', detail: 'A document-editor UI (NOT forms/dashboards), with track changes visible while editing.' },
  { title: 'Enable AI-assisted drafting', detail: 'Conversational AI within the editor to refine drafts, answer questions ("What are the minimum requirements for this section?", "What do our peers report?"), and incorporate uploaded evidence.' },
  { title: 'Structured review & approval workflow', detail: 'Multi-role sign-off (Input Provider → Owner → Legal → Editor → Admin), with version control and content locking.' },
  { title: 'Support multiple parallel reports', detail: 'Run several reports from the same platform on one shared knowledge base.' },
  { title: 'Evidence / source attachment', detail: 'Link documents, screenshots and SOPs to specific sections for the audit trail.' },
  { title: 'PDF and MDD-compatible Word export', detail: 'Filing-ready outputs in both PDF and the Novartis MDD Word template.' },
];

const EXEC_STOPS: ExecStop[] = [
  {
    n: 1, view: 'dashboard', navLabel: 'Dashboard', dur: '~45s', title: 'Dashboard — the control tower',
    value: 'CONTROL — one source of truth replaces email/shared-drive chaos.',
    say: "This is the live state of the report, not a mock — the progress bar and task list update as sign-offs happen. A reporting lead opens this and sees exactly what's drafted, what's in review, what's approved, and who owns each open item — instead of reconstructing it from email threads and shared drives. And the switcher at the top shows this one platform runs the whole reporting suite.",
    do: [
      'Point to the live progress bar and "My Open Tasks".',
      'One gesture at the report switcher (RNFM + ESG Index, UPC, ASRS, Human Rights).',
    ],
    how: "The dashboard reads the real workflow records — every subsection's draft/review/approved state and its assigned people — and rolls them up live. There's no separate status spreadsheet to maintain; the status IS the system. Each open task links straight to the exact subsection in the editor.",
    helps: "Today the reporting lead spends the cycle chasing 30+ contributors for status. This gives them (and leadership) a single real-time view of where the report stands and what's blocking it — so the 8–16 week cycle can be actively managed instead of discovered late.",
  },
  {
    n: 2, view: 'knowledgebase', navLabel: 'Knowledge Base', dur: '~45s', title: 'Knowledge Base — the grounded foundation',
    value: 'GROUNDING — the AI only speaks from Novartis\'s own documents.',
    say: "Before any drafting, we index Novartis's own material — prior reports, internal policies, the reporting standards, peer reports and the style guide. This is what the AI draws from. It doesn't write from general knowledge off the internet; it writes from these documents. That's the single most important thing to understand about why the output can be trusted in a regulated filing.",
    do: [
      'Point to the indexed document set and their categories/frameworks.',
      'Note the ingestion status (indexed / processing).',
    ],
    how: "Each document is split into passages, converted to numeric 'embeddings' and stored in a searchable index (Amazon Bedrock Knowledge Bases + a vector store). When the AI drafts a section it retrieves the most relevant passages first and writes only from those — this is 'retrieval-augmented generation'. If a fact isn't in the documents, the AI doesn't assert it.",
    helps: "This is what makes the AI safe for a regulated disclosure: every statement is anchored to a Novartis source, so the report is audit-ready and defensible to an external assurer — not a black box. It also means the tool improves simply by adding better source documents.",
  },
  {
    n: 3, view: 'editor', navLabel: 'Report Editor', dur: '~90s', title: 'Report Editor — AI draft, traceability, governance',
    value: 'TRUST — AI you can put in a regulated filing. The most important stop.',
    say: "This is the heart of it. The AI rolls last year's approved section forward and drafts this year's version from those source documents — the SME starts from an ~80%-complete, cited draft instead of a blank page. Every AI claim carries a citation back to its source document and page. And the AI never writes silently: every AI edit appears as a tracked change a person accepts or rejects, and then Input Providers and Owners — including Legal — formally sign off. AI drafts; humans decide.",
    do: [
      'In the left sidebar open Environmental matters › Climate change › 8.1.3 "Climate strategy and roadmap".',
      'Switch the draft toggle to "Editor view" to reveal the year-on-year AI redline (green = added, red struck-through = removed vs FY2025).',
      'Expand "FY2025 approved — full prior-year section" to show the baseline the AI rolled forward.',
      'Click a citation marker (e.g. [1]) to open the evidence panel — source doc + page.',
      'Scroll to the "Approval workflow" panel to show the Input Provider (L3) → Owner (L2) stepper.',
      '(Optional) See the detailed click-by-click walkthrough card below for the full sign-off + accept/reject sequence.',
    ],
    how: "The draft agent (Claude on Amazon Bedrock) retrieves the source passages, the prior-year section and the applicable ESRS/GRI/TCFD/ISSB requirements, then writes a structured narrative with inline citations. The \"Editor view\" toggle shows the roll-forward as a word-level redline against last year's approved text, so reviewers see only the deltas. Track-changes and role-based sign-off are enforced by the workflow engine — an edit to an approved section re-opens it for approval; nothing is overwritten silently, and everything is recorded in an append-only audit trail.",
    helps: "This attacks the single biggest cost — the repeated draft/review/rework cycle across ESG, Legal, Finance and HR. A cited first draft in minutes, reviewers focusing only on what changed year-on-year, and formal sign-off captured in-system means far less rework, consistent narrative across sections, and a report that's assurance-ready by construction.",
  },
  {
    n: 4, view: 'compliance', navLabel: 'Analysis', dur: '~75s', title: 'Analysis → Compliance — the regulator-proof story',
    value: 'COMPLIANCE — de-risks the FY2027 CSRD mandate.',
    say: "This report is filed today under Swiss law, but ESRS under CSRD becomes mandatory from FY2027 — hundreds of new datapoints. This screen maps every section to the disclosure requirements and shows, at a glance, what's covered, partial or missing across ESRS, GRI, TCFD and ISSB. Critically, Legal sign-off is blocked if a mandatory requirement is still missing — so the platform enforces compliance rather than just reporting on it. And the exact regulatory text sits right next to the draft.",
    do: [
      'Open the Compliance tab, "By Standard" view.',
      'Show the traffic-light coverage (covered / partial / missing).',
      'Click a requirement to reveal the verbatim standard text + AI fill suggestion.',
    ],
    how: "A compliance agent classifies each disclosure requirement against the section text as covered / partial / missing with a confidence score, and pulls the supporting evidence. For gaps it drafts suggested fill text grounded in the knowledge base. The mandatory-requirement check is wired into the sign-off gate, so a non-compliant report literally cannot be approved without a documented justification override.",
    helps: "CSRD/ESRS is the board-level risk on the horizon. This shows Novartis its FY2027 gaps today — while there's still time to close them — and turns compliance from a manual, error-prone checklist into an enforced, always-current readiness view. That's cost avoidance and audit confidence at the same time.",
  },
  {
    n: 5, view: 'editor', navLabel: 'Report Editor', dur: '~45s', title: 'Export to Word — the tangible deliverable',
    value: 'DELIVERABLE — filing-ready artifact, not a rough draft.',
    say: "Finally, the output. One click produces a proper Novartis-styled Word document — real table of contents, native tables, footnotes and citations, in the corporate template. And export is gated: it's blocked until every section is approved. So what comes out the other end is the filing-ready artifact, not a draft someone still has to reformat.",
    do: [
      'From the editor, trigger Export → Generate DOCX.',
      'Note the approval gate blocking export until everything is Approved.',
    ],
    how: "The export pipeline takes the structured, approved content and renders it into the Novartis MDD Word template — mapping each element to the correct corporate paragraph style, building a live table of contents, and embedding citations as footnotes. Because it reads only approved content, the document is always consistent with what was signed off.",
    helps: "It removes the final manual step — reformatting content into the brand template — and eliminates the drift and version-control errors that creep in when the 'final' document is assembled by hand. The report leaves the system publication-ready and on-brand.",
  },
];

const EXEC_CLOSE =
  "So: an AI-drafted, human-governed, audit-ready report — from 16 weeks to days, with full traceability and enforced compliance. The estimated impact is USD 200–400K in compliance cost avoidance over two years plus ~100K annual operational savings, and it positions Novartis ahead of the FY2027 CSRD mandate. What we'd need from your team next is confirmation of the approver structure and the MDD template so the export is pixel-perfect.";

// Roadmap: the other reports the platform is being extended to cover, and the
// value of running them on one shared knowledge base. Grounded in data/reports.ts.
interface ExecReport { name: string; when: string; what: string; color: string }
const EXEC_ROADMAP: ExecReport[] = [
  {
    name: 'Update on Public Commitments (UPC)', when: 'Next', color: '#8b5cf6',
    what: 'SI&S public-commitment progress report — targets, performance tables and narrative. Reuses the RNFM methodology and numbers rather than re-collecting them.',
  },
  {
    name: 'Novartis ESG Index', when: 'Next', color: '#0ea5e9',
    what: 'A consolidated index of every ESG metric and disclosure with pointers to its authoritative source — with ESRS / GRI / ISSB / SASB cross-referencing generated automatically.',
  },
  {
    name: 'Human Rights Statement', when: '2026 (folds into RNFM from 2027)', color: '#f59e0b',
    what: 'Modern-slavery / transparency disclosures across UK, Australian, Canadian, Norwegian and Swiss acts. Standalone for 2026, then integrated into the ESRS-compliant RNFM.',
  },
  {
    name: 'Australian ASRS Report', when: 'From FY2027', color: '#16a34a',
    what: 'AASB S1/S2 report for the Australian legal entity — global ISSB-compliant content is mapped automatically into the local ASRS requirements, drafted once and reused.',
  },
];

const EXEC_ROADMAP_INTRO =
  "Everything you've seen is the RNFM. The same platform is being extended to Novartis's other sustainability disclosures — all on one shared knowledge base:";

const EXEC_ROADMAP_VALUE =
  "The value compounds: today these reports are produced separately, by different teams, repeating the same data collection and risking numbers that don't reconcile across documents. On one platform they share a single indexed source of truth, so a figure is drafted, cited and approved once, then reused everywhere — with cross-references keeping every report consistent. That means less duplicated effort, no reconciliation gaps between documents, and one governance and audit trail spanning the whole disclosure suite. It also turns multi-jurisdiction reporting (Swiss, EU/CSRD, Australian ASRS) from four parallel projects into one — de-risking each new regulatory mandate as it lands.";

// Moving to Novartis: what changes when the solution is deployed into Novartis's
// own environment. The core idea (grounded in the actual architecture): the app is
// built ports-and-adapters, so each external integration is an interface with a
// "demo" implementation today and a "real Novartis" implementation later — the move
// is swapping adapters + providing credentials, not re-building.
interface ExecIntegration { area: string; today: string; atNovartis: string }
const EXEC_MOVE: ExecIntegration[] = [
  {
    area: 'Sign-in & roles',
    today: 'Amazon Cognito with demo users and a "view as" role switch.',
    atNovartis: 'Federated to the Novartis corporate identity provider (SAML/OIDC) — staff sign in with their normal Novartis credentials and their real role/permissions are enforced.',
  },
  {
    area: 'Source documents (Knowledge Base)',
    today: 'Seeded from the documents Novartis has already shared, plus representative synthetic content.',
    atNovartis: 'Connected to the Novartis document systems (policies, prior reports, SharePoint/DMS) so the knowledge base stays current automatically as source documents change.',
  },
  {
    area: 'Data tables (MDD)',
    today: 'Reference tables loaded from the provided files; "Refresh from MDD" is a manual pull.',
    atNovartis: 'Connected to the live MDD / master-data source so figures flow in directly and stay in sync — no manual copy.',
  },
  {
    area: 'AI generation',
    today: 'A mix of live Amazon Bedrock calls and deterministic prototype logic, tuned for a predictable demo.',
    atNovartis: 'The full Bedrock agents (draft generation, compliance analysis, peer benchmarking) run against the live knowledge base within Novartis\'s own AWS tenancy.',
  },
  {
    area: 'Notifications',
    today: 'Shown in-app.',
    atNovartis: 'Wired to Novartis email / Teams so reviewers are notified when a section needs them.',
  },
  {
    area: 'Where data lives',
    today: 'AWS demo account managed by us.',
    atNovartis: 'Inside Novartis\'s own AWS account — encrypted with Novartis-managed keys; content is never used to train foundation models.',
  },
];

const EXEC_MOVE_INTRO =
  "A fair question is: this is a demo — what changes when it runs for real inside Novartis? The important point is that it was deliberately built so the move is a swap of connections, not a rebuild. The workflow, governance, editor and compliance engine you've seen are the real thing; what changes is where they get their data and identity from:";

const EXEC_MOVE_BOTTOM =
  "Under the hood, every external system sits behind a clean interface with two implementations — a demo one today and a real Novartis one later. So going live means pointing those interfaces at Novartis's real systems and providing credentials, not re-engineering the application. That's what keeps the path from prototype to production short and low-risk — the target is a production MVP in Novartis's environment, subject to your go-ahead.";

// Likely C-level questions and crisp, board-room-ready answers. These are the
// ones an executive audience tends to raise in the room — kept tight so the
// presenter can answer confidently without diving into the detailed Why & How.
interface ExecQA { q: string; a: string }
const EXEC_QA: ExecQA[] = [
  {
    q: 'How do we know the AI isn\'t making things up?',
    a: 'Every AI-drafted claim carries a citation back to a specific source document and page, shown in the evidence panel — and the AI writes only from Novartis\'s own indexed documents, not the open internet. If a fact isn\'t in your documents, it doesn\'t assert it. Nothing is published without a human accepting it as a tracked change and formally signing off.',
  },
  {
    q: 'Is this replacing our people?',
    a: 'No — it removes the blank-page grind, not the judgement. The AI produces a cited first draft in minutes; your SMEs, Legal and Owners review, edit and approve. Their time shifts from drafting and reformatting to verifying and deciding — which is where their expertise actually adds value.',
  },
  {
    q: 'Is our data safe? Does it train the AI?',
    a: 'Everything runs inside Novartis\'s own AWS account, encrypted with Novartis-managed keys. The models are called through Amazon Bedrock within your tenancy — your content is never used to train the foundation models and never leaves your environment.',
  },
  {
    q: 'What\'s the real cost and the payback?',
    a: 'The estimated impact is USD 200–400K in compliance cost avoidance over two years plus roughly USD 100K in annual operational savings, mainly from collapsing the 8–16 week drafting cycle and cutting rework. The larger return is risk reduction — being demonstrably ready for the FY2027 CSRD mandate rather than scrambling for it.',
  },
  {
    q: 'Is this production-ready, or just a demo?',
    a: 'The workflow, governance, editor and compliance engine you\'re seeing are the real, fully-built application. What\'s left for production is connecting it to Novartis\'s live systems — corporate sign-in, your document repositories and the MDD data source. It was deliberately built so that\'s a swap of connections, not a rebuild. We\'re targeting a production MVP in Q3 2026, subject to your go-ahead.',
  },
  {
    q: 'Does it guarantee we\'re compliant?',
    a: 'It enforces compliance rather than just reporting on it: every section is mapped to each disclosure requirement, and Legal sign-off is blocked if a mandatory requirement is still missing without a documented justification. It surfaces your FY2027 ESRS gaps today. Final regulatory judgement still rests with Legal — the platform makes sure nothing slips through unseen.',
  },
  {
    q: 'How long to get this live for us?',
    a: 'Because the application itself is built, the path to a production MVP is measured in weeks, not months, once we have access to your identity provider, source documents and the MDD template. That\'s the main input we\'d need from your team to start.',
  },
];

const EXEC_NOTES = [
  'Five stops, five value words: control (Dashboard) → grounding (Knowledge Base) → trust (Editor) → compliance (Analysis) → deliverable (Export). Editor is the anchor — spend the most time there.',
  'Pace for ~5 min: keep stops 1, 2 and 5 tight (~45s each); let stops 3 (Editor) and 4 (Compliance) breathe. The blue "How it works" and green "how it helps" blocks are your backup for questions — read them only if asked, don\'t narrate all of it.',
  'Do NOT demo: Section Structure editor, Audit deep-dive, Peer Benchmarking chat, Admin panel — mention them in one breath only if asked.',
  'If interrupted with "is the AI making things up?" — that\'s your best moment: jump to the citation/evidence panel. Traceability answers every AI-risk question.',
  'Honesty guardrail: this is a working prototype. If pushed on production-readiness, say the workflow and governance model is fully built; wiring to live Novartis data sources and the MDD API is the next phase. Don\'t overclaim full production status.',
];

function ExecDemoPanel({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
      {/* The 20-second frame */}
      <div className="card" style={{ padding: '28px 32px', borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>The 20-second frame — say this before you touch anything</div>
        <div style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-primary)', fontStyle: 'italic' }}>“{EXEC_FRAME}”</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.6 }}>
          That single sentence is your whole value proposition: <strong>faster, compliant, auditable, human-governed.</strong>
        </div>
      </div>

      {/* What the customer asked for — Adrian's SI&S requirements. */}
      <div className="card" style={{ padding: '28px 32px', borderLeft: '3px solid #8b5cf6' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>📋</span> What Novartis asked for — the requirements
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>{REQ_INTRO}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {EXEC_REQUIREMENTS.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.title}</span>
                <span style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}> — {r.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Editor — the detailed click-by-click walkthrough, with roles woven in. */}
      <div className="card" style={{ padding: '28px 32px', borderLeft: '3px solid var(--accent)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>🖊️</span> Report Editor — click-by-click walkthrough (the key stop)
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
          The exact sequence for the Editor demo, on subsection <strong>8.1.3 "Climate strategy and roadmap"</strong>. Each step is what to click, what happens, and the role rule it shows. You don't have to do all ten live — steps 1–4 tell the AI + traceability story; 5–9 tell the governance + roles story. Roles are explained inline as they come up.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {EDITOR_WALKTHROUGH.map(s => (
            <div key={s.n} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{s.n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}><strong>Click:</strong> {s.action}</div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: '3px' }}><strong>What happens:</strong> {s.result}</div>
                {s.role && (
                  <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#8b5cf6', marginTop: '5px', background: 'rgba(139,92,246,0.08)', borderRadius: '6px', padding: '7px 10px' }}>
                    <strong>👥 Role:</strong> {s.role}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* One-glance roles recap under the walkthrough. */}
        <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Roles at a glance — who edits, who approves</div>
          <div style={{ fontSize: '12px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <div><strong style={{ color: '#6366f1' }}>Input Provider</strong> — drafts/edits their OWN subsection; signs it off at <strong>L3</strong> (locks it to them).</div>
            <div><strong style={{ color: '#8b5cf6' }}>Owner</strong> — reviews the whole section; signs off at <strong>L2</strong>. Legal sits here as an Owner; every owner must sign for approval.</div>
            <div><strong style={{ color: '#0ea5e9' }}>Editor</strong> — edits any section; the ONLY role that accepts/rejects tracked changes. Does not sign off.</div>
            <div><strong style={{ color: '#16a34a' }}>Admin</strong> — full access (ESG Reporting Lead seat); can also sign off at L2.</div>
            <div><strong style={{ color: '#64748b' }}>Guest</strong> — read-only + comments; never edits or signs off.</div>
          </div>
        </div>
      </div>

      {/* Standards glossary — plain-English reference for the frameworks named above. */}
      <div className="card" style={{ padding: '28px 32px', borderLeft: '3px solid #0ea5e9' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>📚</span> The standards, in plain English — if they ask
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
          The reporting frameworks referenced in the frame and on the Compliance screen. You don't need to narrate these — they're here so you can answer "what is ESRS / ISSB / GRI?" with confidence.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {STANDARDS_GLOSSARY.map(s => (
            <div key={s.abbr} style={{ borderLeft: '3px solid #0ea5e9', paddingLeft: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.abbr}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.name}</span>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{s.what}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Prep note */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 4px', lineHeight: 1.6 }}>
        Prep: hard-refresh once, then <strong>Report Editor → Reset Demo</strong>. Keep hands off the keyboard except for the deliberate moves below.
      </div>

      {/* The four stops */}
      {EXEC_STOPS.map(s => (
        <div key={s.n} className="card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stop {s.n} · {s.dur}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '2px 0 0' }}>{s.title}</h3>
              </div>
            </div>
            {s.view && (
              <button className="btn-primary" style={{ flexShrink: 0 }} onClick={() => onNavigate(s.view!)}>
                Go to {s.navLabel}
              </button>
            )}
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--accent-light)', borderRadius: '8px', border: '1px solid var(--accent)', marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '2px' }}>Why it lands</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{s.value}</div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Say</div>
            <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)', fontStyle: 'italic' }}>“{s.say}”</div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Do</div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px 16px' }}>
              {s.do.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: i < s.do.length - 1 ? '8px' : 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '18px' }}>{i + 1}.</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works — plain-English backup for answering questions live. */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>⚙</span> How it works <span style={{ fontWeight: 500, textTransform: 'none', color: 'var(--text-muted)' }}>— if they ask</span>
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)', borderLeft: '3px solid #0ea5e9', paddingLeft: '14px' }}>{s.how}</div>
          </div>

          {/* Why it helps Novartis — the value / rationale for this step. */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>◎</span> Why we do it / how it helps Novartis
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-primary)', borderLeft: '3px solid #16a34a', paddingLeft: '14px' }}>{s.helps}</div>
          </div>
        </div>
      ))}

      {/* Close */}
      <div className="card" style={{ padding: '28px 32px', borderLeft: '3px solid #16a34a' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Close — 15 seconds</div>
        <div style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-primary)', fontStyle: 'italic' }}>“{EXEC_CLOSE}”</div>
      </div>

      {/* Roadmap — the other reports & the value of one shared platform */}
      <div className="card" style={{ padding: '28px 32px', borderLeft: '3px solid #7c3aed' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>🧭</span> What's next — extending to the full reporting suite
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>{EXEC_ROADMAP_INTRO}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {EXEC_ROADMAP.map(r => (
            <div key={r.name} style={{ borderLeft: `4px solid ${r.color}`, paddingLeft: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: r.color, padding: '2px 9px', borderRadius: '12px' }}>{r.when}</span>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{r.what}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 18px', background: 'var(--accent-light)', borderRadius: '8px', border: '1px solid var(--accent)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Value of one shared platform</div>
          <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-primary)' }}>{EXEC_ROADMAP_VALUE}</div>
        </div>
      </div>

      {/* Moving to Novartis — what changes in the live environment */}
      <div className="card" style={{ padding: '28px 32px', borderLeft: '3px solid #0ea5e9' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>🔌</span> Moving to Novartis — what changes in the live environment
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '18px' }}>{EXEC_MOVE_INTRO}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
          {EXEC_MOVE.map(m => (
            <div key={m.area} style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{m.area}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '54px', paddingTop: '2px' }}>Demo</span>
                  <span style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{m.today}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', minWidth: '54px', paddingTop: '2px' }}>Live ↗</span>
                  <span style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{m.atNovartis}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 18px', background: 'var(--accent-light)', borderRadius: '8px', border: '1px solid var(--accent)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Why the move is low-risk</div>
          <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-primary)' }}>{EXEC_MOVE_BOTTOM}</div>
        </div>
      </div>

      {/* Presenter notes */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>🎤</span> Presenter notes
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {EXEC_NOTES.map((n, i) => (
            <li key={i} style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{n}</li>
          ))}
        </ul>
      </div>

      {/* Likely questions & answers — the ones a C-level audience tends to raise
          in the room, with crisp answers to keep the presenter on the front foot. */}
      <div className="card" style={{ padding: '28px 32px', borderLeft: '3px solid #f59e0b' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>❓</span> Questions you may get — and how to answer
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
          The questions a C-level audience most often raises. Keep answers short and confident; the “How it works” blocks above are your backup if they want detail.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {EXEC_QA.map((qa, i) => (
            <div key={i} style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Q: {qa.q}</div>
              <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{qa.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RolesAndUpdatesPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Roles & approval reference */}
      <div className="card" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>👥</span> Roles &amp; approval — who can do what, and when
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          Input Providers draft &amp; edit (an edit marks a subsection <strong>“edited”</strong>; the Editor marks it <strong>“updated”</strong>).
          Owners then sign off at <strong>L2</strong> (section level): every non-legal owner must sign, and a single Legal/Compliance sign-off suffices.
          Editors/Admins curate content and change review; Guests are read-only; Auditors get a dedicated read-only Audit view.
          Rows marked <NewBadge /> changed with Adrian&rsquo;s 31 Aug feedback.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {ROLE_ROWS.map(r => (
            <div key={r.role} style={{ borderLeft: `4px solid ${r.color}`, paddingLeft: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: r.color, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>{r.role}{r.isNew && <NewBadge />}</div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <div><strong>Can edit:</strong> {r.edits}</div>
                <div><strong>Approves:</strong> {r.approves}</div>
                <div><strong>When:</strong> {r.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change log */}
      <div className="card" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>✅</span> What changed — feedback from the last call &amp; email
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Implemented and deployed to the demo. Most recent first.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {CHANGE_LOG.map(g => (
            <div key={g.date}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', background: 'var(--accent)', padding: '2px 10px', borderRadius: '12px' }}>{g.date}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{g.source}</span>
                {g.isNew && <NewBadge />}
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {g.items.map((it, i) => (
                  <li key={i} style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// "Try new features" — a hands-on test guide for the capabilities delivered from
// Adrian's 21 Aug 2026 call (plus the 31 Aug role/workflow set). Each card has a
// "Go" button that jumps to the exact view, then numbered steps to exercise it.
interface TryFeature {
  title: string;
  badge: string;         // NEW · date
  view: View | null;
  viewLabel?: string;
  why: string;           // one-line "what to look for"
  steps: string[];
}

const TRY_FEATURES: { group: string; items: TryFeature[] }[] = [
  {
    group: 'Exports',
    items: [
      {
        title: 'Two Word variants + choose what to export', badge: 'NEW · 21 Aug', view: 'editor', viewLabel: 'Open Report Editor',
        why: 'Word (readable) has visible tables; Word (MDD) keeps placeholders. Export whole doc or selected sections.',
        steps: [
          'As Admin/Editor, click “Export” (top-right of the editor).',
          'Under “What to export”, choose “Whole document” or “Choose sections” and tick a few.',
          'Click “Word (readable)” — open the .docx: tables are rendered inline.',
          'Export again with “Word (MDD)” — tables appear as [Table Reference: DP_*] placeholders.',
          'Back in the editor header, use “Export section” to export just the current subsection.',
        ],
      },
      {
        title: 'Novartis orange rebrand', badge: 'NEW · 21 Aug', view: null,
        why: 'The whole app + both exports now use the new orange identity.',
        steps: [
          'Notice the accent colour across buttons, tabs and highlights is now orange.',
          'Generate a PDF or Word export — the title and headings use the new brand orange.',
        ],
      },
    ],
  },
  {
    group: 'Compliance & analysis',
    items: [
      {
        title: 'Gap analysis → Excel + peer-informed suggestions', badge: 'NEW · 21 Aug', view: 'analysis', viewLabel: 'Open Analysis',
        why: 'Real Excel export, and gaps now show how peers disclose the same requirement.',
        steps: [
          'Open the “Gap Analysis” tab; filter to a framework/status if you like.',
          'Click “⬇ Export gap analysis (Excel)” — a CSV downloads and opens in Excel.',
          'Expand a partial/missing row → see the “✦ How peers disclose this” block with peer companies.',
          'Click “Open peer benchmarking ↗” to jump to the peer Q&A.',
          'Switch to “Disclosure Checklist” → “⬇ Export checklist (Excel)”.',
        ],
      },
      {
        title: 'Contradiction-aware consistency check', badge: 'NEW · 21 Aug', view: 'consistency', viewLabel: 'Open Consistency',
        why: 'Flags whether the RNFM and Annual Report genuinely contradict, and of what kind.',
        steps: [
          'Run the consistency check.',
          'In “Recommendations”, look for the red “⚠ Contradiction” vs grey “Divergence” chips.',
          'Note the kind: numeric conflict / unit mismatch / restatement / precision / terminology.',
        ],
      },
    ],
  },
  {
    group: 'Governance & data',
    items: [
      {
        title: 'Datapoint checklist — source of truth', badge: 'NEW · 21 Aug', view: 'upload', viewLabel: 'Open Upload',
        why: 'Upload the customer-maintained checklist (CSV of the DMA-filtered master Excel); versioned + persisted.',
        steps: [
          'On the Upload page, find “Disclosure checklist — datapoint source of truth”.',
          'As Admin/Editor, click “⬆ Upload checklist (CSV)” and pick a CSV (columns: DR ID, Framework, Standard, Requirement, Materiality, Mandatory, Note).',
          'See the parsed summary (version, datapoints, material/mandatory counts) + a preview table.',
          'Re-upload to bump the version — prior versions are retained.',
        ],
      },
      {
        title: 'Section Structure — admin-only + safe removal', badge: 'NEW · 21 Aug', view: 'structure', viewLabel: 'Open Section Structure',
        why: 'Only Admins/Editors see this page; removing a section with content asks for confirmation.',
        steps: [
          'As an Admin/Editor you can see “Section Structure” in the sidebar (other roles cannot).',
          'Add, rename or reorder a subsection — changes are versioned and publish to the editor.',
          'Try to remove a subsection that has content → a confirmation modal warns about the content/DR coverage lost.',
        ],
      },
      {
        title: 'Admin: AI instructions + V&V framework', badge: 'NEW · 21 Aug', view: 'admin', viewLabel: 'Open Admin',
        why: 'Ground the AI with per-capability instructions; track the validation methodology.',
        steps: [
          'Open Admin → “AI Tuning”: set app-wide context and per-capability instructions, then Save.',
          'Open Admin → “Verification & Validation”: set the environment and mark activities (UAT / tuning / audit) as in progress / passed.',
          'These persist through the backend and apply to new AI requests.',
        ],
      },
    ],
  },
  {
    group: 'Roles & workflow (31 Aug)',
    items: [
      {
        title: '“Send to” + Auditor view + edited→updated', badge: 'NEW · 31 Aug', view: 'editor', viewLabel: 'Open Report Editor',
        why: 'The 31-Aug role model: multiple input providers, legal single-sign-off, dedicated Auditor view, global Send to.',
        steps: [
          'Use the top-bar “➤ Send to…” — try a name, an unknown @novartis.com email (auto-Guest), and an external email (rejected).',
          'In the editor, edit as an Input Provider → status “Edited”; as Editor click “Mark as updated”.',
          'Open a consolidated (L2) section, sign off owners (one Legal sign-off suffices), then “Release to Audit”.',
          'Open the “Audit View” (sidebar) to see released sections with data points + evidence.',
        ],
      },
    ],
  },
];

function TryNewFeaturesPanel({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div className="card" style={{ padding: '28px 32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span>🧪</span> Try the new capabilities <NewBadge label="Latest" />
      </h2>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
        Hands-on tests for everything delivered from the 21 August call (plus the 31 August role/workflow updates).
        Each card jumps you straight to the right screen. Tip: most editor/admin actions need the <strong>Admin</strong> or <strong>Editor</strong> seat (use “View as” in the editor).
      </div>

      {TRY_FEATURES.map(group => (
        <div key={group.group} style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '10px' }}>{group.group}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {group.items.map(f => (
              <div key={f.title} style={{ border: '1px solid var(--border-primary)', borderRadius: '10px', padding: '16px', borderLeft: '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{f.title}</span>
                  <NewBadge label={f.badge} />
                  {f.view && (
                    <button className="btn-primary" onClick={() => onNavigate(f.view!)} style={{ marginLeft: 'auto', fontSize: '12px', padding: '6px 14px' }}>
                      {f.viewLabel ?? 'Go'} →
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '8px' }}>{f.why}</div>
                <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {f.steps.map((s, i) => (
                    <li key={i} style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-primary)' }}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
