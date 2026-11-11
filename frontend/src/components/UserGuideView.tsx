import { useState } from 'react';

// "NEW" badge to highlight the 31 Aug 2026 role/workflow updates.
function NewBadge({ label = 'NEW' }: { label?: string }) {
  return (
    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.4px', color: '#fff', background: '#dc2626', padding: '2px 7px', borderRadius: '10px', textTransform: 'uppercase', whiteSpace: 'nowrap', marginLeft: '8px' }}>
      {label}
    </span>
  );
}

const sections = [
  { id: 'whats-new', label: "What's New" },
  { id: 'overview', label: 'Overview' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'report-editor', label: 'Report Editor' },
  { id: 'compliance', label: 'Compliance Analysis' },
  { id: 'knowledge-base', label: 'Knowledge Base' },
  { id: 'benchmarking', label: 'Peer Benchmarking' },
  { id: 'workflow', label: 'Approval Workflow' },
  { id: 'audit', label: 'Audit Trail' },
  { id: 'export', label: 'Export & Delivery' },
  { id: 'roles', label: 'Roles & Permissions' },
];

export default function UserGuideView() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">User Guide</h1>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Novartis ESG Authoring Studio v1.0</span>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Table of Contents */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '12px', position: 'sticky', top: '20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 10px', marginBottom: '4px' }}>Contents</div>
            {sections.map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                  background: activeSection === sec.id ? 'var(--accent-light)' : 'transparent',
                  borderRadius: '5px', cursor: 'pointer', fontSize: '12px', marginBottom: '2px',
                  color: activeSection === sec.id ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: activeSection === sec.id ? 600 : 400, fontFamily: 'var(--font-sans)',
                }}
              >
                {sec.label}
                {sec.id === 'whats-new' && <NewBadge />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* What's New — the 31 Aug 2026 role/workflow updates. */}
          {activeSection === 'whats-new' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                What&rsquo;s New <NewBadge label="31 Aug 2026" />
              </h2>
              <p className="guide-text" style={{ marginBottom: '20px' }}>
                The latest updates to the roles and approval workflow, from Adrian&rsquo;s 31 August feedback. Each item below is also flagged where it appears in the rest of this guide.
              </p>
              {[
                { t: 'Multiple Input Providers, no L3 sign-off', d: 'A subsection can have more than one Input Provider. They edit and comment but no longer sign off — an edit marks the subsection “edited”, and the Editor marks it “updated” once all comments are addressed.' },
                { t: 'Legal/Compliance owner — single sign-off', d: 'Every non-legal owner must sign off, but among Legal/Compliance owners a single sign-off is sufficient to approve the section.' },
                { t: 'Editor: edit a change before accepting', d: 'Editors can modify a tracked change’s text and then accept it (“Edit & accept”), instead of only accept/reject.' },
                { t: 'Change requests: Resolved / Dismiss / Send back', d: 'Incoming change requests are handled with Resolved, Dismiss, or Send back (with comments) to the requester.' },
                { t: 'New Auditor role + Audit View', d: 'A dedicated, read-only Audit view for external assurance — released signed-off sections with their data points and supporting evidence, plus the released report PDF. No drafting environment, AI chat, or internal audit trail.' },
                { t: 'Release to Audit', d: 'A section Owner releases a fully-approved section to the Audit View; nothing is visible to an Auditor until it is released.' },
                { t: '“Send to” on every page', d: 'Assign an action or request to anyone from the top bar. A novartis.com recipient without a role yet is auto-added as a Guest; external email addresses are rejected.' },
                { t: 'Export & audit trail restricted to Editors/Admins', d: 'Only Editors and Admins can export the report or view/export the audit trail.' },
                { t: 'Choose what to export', d: 'The export dialog lets you export the whole document or a selection of sections, plus a one-click “Export section” for the current subsection.' },
                { t: 'Novartis 2026 brand refresh', d: 'The application and both exports (PDF and Word) now use the new Novartis orange identity.' },
                { t: 'Two Word export variants', d: '“Word (readable)” renders visible, formatted tables for reviewers who work offline; “Word (MDD)” keeps table placeholders for the Novartis MDD corporate platform. Both are available at any time.' },
                { t: 'Compliance exports to Excel', d: 'The Gap Analysis and Disclosure Checklist views export to Excel/CSV, honouring the filters you have applied.' },
                { t: 'Peer-informed gap suggestions', d: 'Gap analysis now benchmarks against indexed peer reports — it shows how peers disclose the same requirement so you can strengthen your own.' },
                { t: 'Section Structure is admin-only + safer removal', d: 'The Section Structure page is visible only to Admins/Editors; removing a section that still has content now asks for confirmation.' },
                { t: 'Datapoint source of truth (customer checklist)', d: 'Upload the Novartis-maintained disclosure checklist (CSV of the DMA-filtered master Excel) on the Upload page. It is versioned and ingested as the authoritative datapoint list; the system does not decide relevance itself.' },
                { t: 'Admin AI instructions + V&V framework', d: 'Admins can set per-capability AI instructions and app-wide context, and track the Verification & Validation methodology (UAT, tuning, audit) with an environment flag — content is only truly validated on real Novartis data.' },
                { t: 'Contradiction-aware consistency checks', d: 'Consistency checks now classify whether the RNFM and Annual Report genuinely contradict (numeric conflict, unit mismatch, restatement) rather than just matching keywords.' },
              ].map(item => (
                <div key={item.t} style={{ borderLeft: '4px solid #dc2626', paddingLeft: '14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>{item.t}</div>
                  <div className="guide-text" style={{ margin: 0 }}>{item.d}</div>
                </div>
              ))}
            </div>
          )}

          {/* Overview */}
          {activeSection === 'overview' && (
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                ⓘ <strong>Demo vs production.</strong> This guide describes the full product. In this prototype the AI draft generation, document ingestion (parsing/embedding/indexing), and compliance/benchmarking retrieval are illustrated with seeded content and simplified backend calls; the Bedrock Knowledge Base, agent pipeline and live document indexing described below run in the production Novartis environment.
              </div>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Platform Overview</h2>
              <p className="guide-text">
                The <strong>Novartis ESG Authoring Studio</strong> is an AI-enabled sustainability report generation platform designed to streamline the production of the annual Report on Nonfinancial Matters (RNFM). It replaces the traditional manual drafting process with an intelligent, collaborative authoring environment.
              </p>
              <p className="guide-text">
                The platform automates the most time-consuming aspects of sustainability reporting: first-draft generation grounded in source documents, compliance mapping against multiple frameworks (ESRS, GRI, TCFD, ISSB), and structured multi-stage review workflows — while maintaining full human governance over every published claim.
              </p>

              <h3 className="guide-subtitle">Key Capabilities</h3>
              <div className="guide-features">
                <div className="guide-feature">
                  <div className="guide-feature-icon">✦</div>
                  <div>
                    <div className="guide-feature-title">AI-Powered Draft Generation</div>
                    <div className="guide-feature-desc">Generate structured first drafts from indexed source documents using RAG (Retrieval-Augmented Generation). Every claim is traceable to its source.</div>
                  </div>
                </div>
                <div className="guide-feature">
                  <div className="guide-feature-icon">☑</div>
                  <div>
                    <div className="guide-feature-title">Multi-Framework Compliance Mapping</div>
                    <div className="guide-feature-desc">Automatically maps sections to ESRS, GRI, TCFD, and ISSB disclosure requirements with traffic-light coverage status and AI-suggested gap fills.</div>
                  </div>
                </div>
                <div className="guide-feature">
                  <div className="guide-feature-icon">✎</div>
                  <div>
                    <div className="guide-feature-title">Collaborative Review & Editing</div>
                    <div className="guide-feature-desc">Track changes, inline editing with audit attribution, and a structured approval workflow (Draft → SME → Legal → Approved → Exported).</div>
                  </div>
                </div>
                <div className="guide-feature">
                  <div className="guide-feature-icon">💬</div>
                  <div>
                    <div className="guide-feature-title">Peer Benchmarking Q&A</div>
                    <div className="guide-feature-desc">Ask natural language questions against indexed peer sustainability reports. Get cited, comparative insights to inform your disclosures.</div>
                  </div>
                </div>
                <div className="guide-feature">
                  <div className="guide-feature-icon">📄</div>
                  <div>
                    <div className="guide-feature-title">MDD-Compliant Export</div>
                    <div className="guide-feature-desc">Export the final report as a fully formatted Word document adhering to Novartis Master Document Design (MDD) specifications.</div>
                  </div>
                </div>
              </div>

              <h3 className="guide-subtitle">Target Users</h3>
              <p className="guide-text">
                The platform serves the SI&S Corporate Reporting Team, ESG Financial Reporting & Analysis (FRA), and functional teams contributing to the Sustainability statement — including Environmental, HR/Social, Legal/Compliance, Finance, and Governance functions.
              </p>
            </div>
          )}

          {/* Getting Started */}
          {activeSection === 'getting-started' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Getting Started</h2>

              <h3 className="guide-subtitle">1. Create a New Report Cycle</h3>
              <p className="guide-text">
                From the Dashboard, click <strong>"New Report Cycle"</strong> to launch the setup wizard. Configure the reporting year, report title, and section template. The 2026 RNFM structure is organized into 14 top-level chapters broken down into 86 independently-tracked subsections, matching the published 2025 RNFM layout under Swiss CO Art. 964a.
              </p>
              <p className="guide-text">
                Enable <strong>"Auto-generate AI first draft"</strong> to have the system produce an initial draft for all subsections using the Knowledge Base. This typically completes in under 30 minutes for the full report.
              </p>

              <h3 className="guide-subtitle">2. Prepare the Knowledge Base</h3>
              <p className="guide-text">
                Before generating drafts, ensure your Knowledge Base is populated with relevant source documents. Navigate to <strong>Knowledge Base → Upload Documents</strong> and add:
              </p>
              <ul className="guide-list">
                <li>Internal policies (Environmental, HR, Ethics, EHS standards)</li>
                <li>Prior year RNFM reports (for continuity and style reference)</li>
                <li>Reporting standards (ESRS full set, GRI, IFRS S1/S2, TCFD)</li>
                <li>Peer sustainability reports (for benchmarking)</li>
                <li>External disclosures (CDP responses, assurance statements)</li>
              </ul>
              <p className="guide-text">
                Documents are automatically parsed, chunked (512 tokens, 10% overlap), embedded using Amazon Titan, and indexed in the vector store. Ingestion typically completes in 5–10 minutes per document.
              </p>

              <h3 className="guide-subtitle">3. Review the AI Draft</h3>
              <p className="guide-text">
                Once generation completes, navigate to the <strong>Report Editor</strong>. Each section will contain an AI-generated draft with citation markers. Click any citation marker to view the source document, excerpt, and page reference in the evidence panel.
              </p>

              <h3 className="guide-subtitle">4. Run Compliance Scan</h3>
              <p className="guide-text">
                Navigate to <strong>Compliance Gap Analysis</strong> and click <strong>"Run Scan"</strong>. The system maps each section against all applicable disclosure requirements and identifies gaps. Use the AI-suggested fill text to address missing requirements.
              </p>
            </div>
          )}

          {/* Report Editor */}
          {activeSection === 'report-editor' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Report Editor</h2>
              <p className="guide-text">
                The Report Editor is the central authoring interface. It provides a document editor with section navigation, inline citation markers, AI assistance, track changes, and approval workflow controls.
              </p>

              <h3 className="guide-subtitle">Section Navigation</h3>
              <p className="guide-text">
                The left sidebar lists all 86 subsections as an L1/L2/L3 chapter tree, each with its current workflow stage (color-coded dot); drag the panel's right edge to widen it for readability. Click any subsection to view or edit its content. The stage indicator shows: Draft (purple), SME Review (amber), Legal Review (blue), Approved (green), Exported (teal).
              </p>

              <h3 className="guide-subtitle">Editing Content</h3>
              <p className="guide-text">
                Click <strong>"Edit Section"</strong> to enter editing mode. The content area becomes an editable textarea. When you save, you'll be prompted to provide a reason for the change. The system then:
              </p>
              <ul className="guide-list">
                <li>Computes paragraph-level diffs between old and new content</li>
                <li>Creates tracked change records (who changed what, when, and why)</li>
                <li>Persists all changes for audit trail purposes</li>
              </ul>

              <h3 className="guide-subtitle">Track Changes</h3>
              <p className="guide-text">
                Below the content area, the <strong>Change Tracker</strong> shows all modifications to the current section. Each change displays the original and new text with diff highlighting. Reviewers can Accept or Reject individual changes — rejected changes revert the affected paragraph.
              </p>

              <h3 className="guide-subtitle">Citation Markers</h3>
              <p className="guide-text">
                AI-generated content includes superscript citation markers (e.g., [1], [2]). Clicking a marker opens the evidence panel showing the source document name, excerpt, page reference, and ingestion date. This ensures every factual claim is traceable to its origin.
              </p>

              <h3 className="guide-subtitle">AI Assistant</h3>
              <p className="guide-text">
                Click <strong>"AI Assistant"</strong> to open the context-aware chat panel on the right. The assistant can help with:
              </p>
              <ul className="guide-list">
                <li>Explaining ESRS disclosure requirements relevant to the current section</li>
                <li>Suggesting improvements to strengthen specific paragraphs</li>
                <li>Providing peer benchmarking context</li>
                <li>Answering questions about report methodology and style</li>
              </ul>
              <p className="guide-text">
                When the assistant provides a suggested edit, click <strong>"Apply Suggestion"</strong> to auto-populate the editor with the modified content for review before saving.
              </p>
            </div>
          )}

          {/* Compliance */}
          {activeSection === 'compliance' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>2027 ESRS Readiness Assessment</h2>
              <p className="guide-text">
                The 2027 ESRS Readiness Assessment maps your report content against disclosure requirements from ESRS, GRI, TCFD, and ISSB frameworks. The current FY2026 report is filed under Swiss CO Art. 964a — ESRS (CSRD) becomes mandatory from FY2027 only. This module shows how well the current Swiss CO report already covers future ESRS requirements, giving you a head start on 2027 readiness.
              </p>

              <h3 className="guide-subtitle">How Scanning Works</h3>
              <p className="guide-text">
                When you click <strong>"Run Scan"</strong>, the Compliance Gap Analysis Agent performs the following steps:
              </p>
              <ol className="guide-list">
                <li>Loads all applicable disclosure requirements for each framework</li>
                <li>Retrieves current draft text for each section</li>
                <li>Performs semantic coverage classification using Claude AI</li>
                <li>Assigns confidence scores based on how thoroughly each requirement is addressed</li>
                <li>Generates suggested fill text for missing or partial requirements using RAG</li>
              </ol>

              <h3 className="guide-subtitle">Coverage Status</h3>
              <div style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-badge status-covered">covered</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Requirement fully addressed with supporting evidence</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-badge status-partial">partial</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Partially addressed — some data points missing</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-badge status-missing">missing</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Not addressed — requires content addition</span>
                </div>
              </div>

              <h3 className="guide-subtitle">Using AI Suggested Fill</h3>
              <p className="guide-text">
                Click any row in the compliance table to expand the detail view. For partially covered or missing requirements, the system provides an <strong>AI Suggested Fill</strong> — a draft paragraph grounded in Knowledge Base sources that addresses the specific data points required by the DR. Copy this into the Report Editor to fill the gap, then re-scan to verify coverage.
              </p>

              <h3 className="guide-subtitle">Legal Sign-off Blocking</h3>
              <p className="guide-text">
                The system enforces a blocking rule: Legal sign-off cannot be completed if any mandatory ESRS disclosure requirement has status "missing" without a documented justification override. This ensures regulatory compliance before export.
              </p>
            </div>
          )}

          {/* Knowledge Base */}
          {activeSection === 'knowledge-base' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Knowledge Base</h2>
              <p className="guide-text">
                The Knowledge Base is the source document repository that powers AI draft generation, compliance gap analysis, and peer benchmarking. It uses Amazon Bedrock Knowledge Bases with OpenSearch Serverless as the vector store.
              </p>

              <h3 className="guide-subtitle">Document Types</h3>
              <table className="data-table" style={{ marginBottom: '20px' }}>
                <thead>
                  <tr><th>Type</th><th>Purpose</th><th>Examples</th></tr>
                </thead>
                <tbody>
                  <tr><td style={{ fontWeight: 500 }}>Internal Policies</td><td>Factual basis for narrative claims</td><td>Environmental Policy, Human Rights Framework, Code of Ethics</td></tr>
                  <tr><td style={{ fontWeight: 500 }}>Reporting Standards</td><td>DR definitions and requirements</td><td>ESRS Full Set, GRI 2021, IFRS S1/S2</td></tr>
                  <tr><td style={{ fontWeight: 500 }}>Prior Reports</td><td>Style reference and continuity</td><td>RNFM FY2024, Environmental Report 2024</td></tr>
                  <tr><td style={{ fontWeight: 500 }}>Peer Reports</td><td>Benchmarking comparisons</td><td>Roche, AstraZeneca, Pfizer sustainability reports</td></tr>
                  <tr><td style={{ fontWeight: 500 }}>External Disclosures</td><td>Additional evidence sources</td><td>CDP Climate Response, Assurance Statements</td></tr>
                </tbody>
              </table>

              <h3 className="guide-subtitle">Ingestion Pipeline</h3>
              <p className="guide-text">
                When a document is uploaded, it passes through an automated ingestion pipeline:
              </p>
              <ol className="guide-list">
                <li><strong>Detection</strong> — Identifies file type (PDF, DOCX, PPTX)</li>
                <li><strong>Extraction</strong> — Extracts text using Amazon Textract (PDFs) or python-docx (Word files)</li>
                <li><strong>Metadata Tagging</strong> — Tags with document_type, framework, year, source_org</li>
                <li><strong>Chunking</strong> — Splits into 512-token chunks with 10% overlap for optimal retrieval</li>
                <li><strong>Embedding</strong> — Generates vector embeddings using Amazon Titan Embed v2 (1024 dimensions)</li>
                <li><strong>Indexing</strong> — Upserts vectors to OpenSearch Serverless collection</li>
              </ol>

              <h3 className="guide-subtitle">Uploading Documents</h3>
              <p className="guide-text">
                Use the <strong>"Upload Documents"</strong> button or drag-and-drop zone. Supported formats: PDF, DOCX, PPTX (max 50 MB). Documents enter a "pending" state during processing and transition to "indexed" once successfully ingested (typically 5–10 minutes).
              </p>
            </div>
          )}

          {/* Benchmarking */}
          {activeSection === 'benchmarking' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Peer Benchmarking</h2>
              <p className="guide-text">
                The Peer Benchmarking module provides an interactive Q&A interface powered by the Peer Benchmarking Agent. It retrieves information from indexed peer company sustainability reports and synthesizes comparative answers with source citations.
              </p>

              <h3 className="guide-subtitle">How It Works</h3>
              <ol className="guide-list">
                <li>Type a natural language question about peer disclosures (e.g., "How do pharma peers disclose Scope 3 emissions?")</li>
                <li>The agent parses your question to identify the topic, framework, and peer scope</li>
                <li>Relevant chunks are retrieved from peer reports using semantic search with metadata filtering</li>
                <li>Claude synthesizes a comparative answer with explicit citations to source documents</li>
                <li>Results include company name, report section, page reference, and excerpt</li>
              </ol>

              <h3 className="guide-subtitle">Indexed Peer Reports</h3>
              <p className="guide-text">
                The current index includes sustainability reports from 5 major pharmaceutical peers: Roche, AstraZeneca, Pfizer, GSK, and Sanofi. Click any peer report row to view indexed sections and access the full report. Use the <strong>"Ask about [Company]"</strong> button to quickly query a specific peer's disclosures.
              </p>

              <h3 className="guide-subtitle">Best Practices</h3>
              <ul className="guide-list">
                <li>Be specific about the framework or topic (e.g., "ESRS E4 biodiversity" rather than just "biodiversity")</li>
                <li>Reference specific disclosure requirements when possible</li>
                <li>Ask comparative questions to get cross-peer insights</li>
                <li>Use findings to inform your own disclosure approach before drafting</li>
              </ul>
            </div>
          )}

          {/* Workflow */}
          {activeSection === 'workflow' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>Approval Workflow <NewBadge label="Updated 31 Aug" /></h2>
              <p className="guide-text">
                Each report section moves through a structured workflow that ensures content accuracy, regulatory compliance, and proper governance sign-off before publication. Input Providers draft &amp; edit; the Editor confirms a section is "updated"; Owners then sign off at the section (L2) level.
              </p>

              <h3 className="guide-subtitle">Workflow Stages</h3>
              <div className="guide-workflow">
                <div className="guide-workflow-step">
                  <div className="guide-workflow-dot" style={{ background: '#6366f1' }}></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>1. Draft</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>AI-generated first draft is ready. The ESG Lead reviews and assigns Input Providers and Owners.</div>
                  </div>
                </div>
                <div className="guide-workflow-step">
                  <div className="guide-workflow-dot" style={{ background: '#3b82f6' }}></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>2. Edited</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>An Input Provider has edited the subsection (in track changes). Awaiting the Editor to finalise it.</div>
                  </div>
                </div>
                <div className="guide-workflow-step">
                  <div className="guide-workflow-dot" style={{ background: '#0ea5e9' }}></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>3. Updated</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>The Editor has confirmed all comments are addressed and marked the subsection "updated" — ready for owner sign-off.</div>
                  </div>
                </div>
                <div className="guide-workflow-step">
                  <div className="guide-workflow-dot" style={{ background: '#8b5cf6' }}></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>4. Owner sign-off (L2)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Owners sign off at the section level. Every non-legal owner must sign; a single Legal/Compliance sign-off suffices.</div>
                  </div>
                </div>
                <div className="guide-workflow-step">
                  <div className="guide-workflow-dot" style={{ background: '#16a34a' }}></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>5. Approved</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>All required owners have signed off. An Owner can now release the section to the Audit View.</div>
                  </div>
                </div>
                <div className="guide-workflow-step">
                  <div className="guide-workflow-dot" style={{ background: '#059669' }}></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>6. Exported</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Section has been included in a report export.</div>
                  </div>
                </div>
              </div>

              <h3 className="guide-subtitle" style={{ display: 'flex', alignItems: 'center' }}>Handling change requests <NewBadge /></h3>
              <p className="guide-text">
                Comment-only roles raise change requests. The Editor handles each one with:
              </p>
              <ul className="guide-list">
                <li><strong>Resolved</strong> — applies the (optionally edited) suggestion as a tracked change and closes the request</li>
                <li><strong>Dismiss</strong> — closes the request without a change</li>
                <li><strong>Send back (with comments)</strong> — returns it to the requester with a note for clarification</li>
              </ul>
            </div>
          )}

          {/* Audit */}
          {activeSection === 'audit' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Audit Trail</h2>
              <p className="guide-text">
                The Audit Trail provides an immutable, append-only record of every action taken within the platform. It serves as the primary evidence source for external assurance and internal governance reviews.
              </p>
              <div style={{ borderLeft: '4px solid #dc2626', paddingLeft: '14px', margin: '4px 0 16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>Access restricted <NewBadge /></div>
                <div className="guide-text" style={{ margin: '3px 0 0' }}>
                  Viewing and exporting this internal audit trail is now limited to <strong>Editors and Admins</strong>. External auditors do not use this log — they get the dedicated, read-only <strong>Audit View</strong> (released sections + evidence + report PDF).
                </div>
              </div>

              <h3 className="guide-subtitle">What Gets Recorded</h3>
              <ul className="guide-list">
                <li>Content edits (with before/after snapshots)</li>
                <li>Workflow state transitions (approvals, rejections, stage advances)</li>
                <li>Document uploads and ingestion events</li>
                <li>Compliance scan results and gap resolutions</li>
                <li>AI draft generation requests and completions</li>
                <li>Report exports and downloads</li>
                <li>User login/logout events</li>
              </ul>

              <h3 className="guide-subtitle">Audit Entry Fields</h3>
              <p className="guide-text">
                Each entry captures: user identity (Cognito), UTC timestamp, action type, affected section/content ID, before/after content snapshot, and session context. Entries are stored in DynamoDB with condition expressions ensuring append-only writes (no updates or deletes).
              </p>

              <h3 className="guide-subtitle">Retention & Archival</h3>
              <p className="guide-text">
                Active audit records are retained in DynamoDB for 90 days, then archived to S3 Glacier for long-term retention (7 years minimum). This meets regulatory requirements for sustainability report audit evidence under CSRD.
              </p>
            </div>
          )}

          {/* Export */}
          {activeSection === 'export' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Export & Delivery</h2>
              <p className="guide-text">
                The DOCX Export Pipeline generates a fully formatted, MDD-compliant Word document from the structured report data.
              </p>

              <h3 className="guide-subtitle">MDD Compliance</h3>
              <p className="guide-text">
                The export applies Novartis Master Document Design (MDD) specifications, mapping each content element to the corresponding <code>nov_*</code> Word paragraph style. This includes heading hierarchies, body text formatting, table captions, footnotes, and page layout rules.
              </p>

              <h3 className="guide-subtitle">Export Process</h3>
              <ol className="guide-list">
                <li>Deserializes the structured document model (sections, paragraphs, tables, citations)</li>
                <li>Maps content to MDD paragraph styles from the base template</li>
                <li>Applies headers, footers, page numbering, and section breaks</li>
                <li>Embeds citation footnotes with source document references</li>
                <li>Generates DOCX using python-docx against the MDD template</li>
                <li>Validates output against MDD style checklist</li>
                <li>Uploads to S3 and provides a pre-signed download URL</li>
              </ol>

              <h3 className="guide-subtitle" style={{ display: 'flex', alignItems: 'center' }}>What you can export <NewBadge /></h3>
              <p className="guide-text">
                The export dialog now lets you choose the scope: the <strong>whole document</strong> or a <strong>selection of sections</strong> (tick the ones you want). A one-click <strong>"Export section"</strong> button also exports just the subsection you are viewing. Both Word/MDD and PDF can be generated at any time — sections not yet Approved are included as their current draft and the file is watermarked as a draft.
              </p>

              <h3 className="guide-subtitle" style={{ display: 'flex', alignItems: 'center' }}>Who can export <NewBadge /></h3>
              <p className="guide-text">
                Exporting the report is restricted to <strong>Editors and Admins</strong>. Input Providers, Owners, Guests and Auditors do not see the Export action (Auditors download the released report PDF from the dedicated Audit View instead).
              </p>
            </div>
          )}

          {/* Roles */}
          {activeSection === 'roles' && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Roles & Permissions</h2>
              <p className="guide-text">
                The platform implements role-based access control via Amazon Cognito Groups. Each user is assigned one or more roles that determine their available actions.
              </p>

              <table className="data-table" style={{ marginTop: '16px' }}>
                <thead>
                  <tr><th>Role</th><th>Responsibilities</th><th>Permissions</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Admin (ESG Reporting Lead)</td>
                    <td style={{ fontSize: '12px' }}>End-to-end report production, coordination, KB management</td>
                    <td style={{ fontSize: '12px' }}>Full access: generate drafts, configure workflow, assign sections, edit/review, sign off, export, view the audit trail</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Editor</td>
                    <td style={{ fontSize: '12px' }}>Central editing team — curate content and change requests</td>
                    <td style={{ fontSize: '12px' }}>Edit anything (incl. directly), accept/reject/edit tracked changes, resolve requests, mark sections "updated", export, view the audit trail. Does not sign off.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Input Provider<NewBadge /></td>
                    <td style={{ fontSize: '12px' }}>Subject-matter experts who draft/edit their subsections</td>
                    <td style={{ fontSize: '12px' }}>Edit assigned subsections in track changes + comment. Multiple per section. No sign-off — an edit marks the section "edited".</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Owner (incl. Legal/Compliance)<NewBadge /></td>
                    <td style={{ fontSize: '12px' }}>Accountable for content; sign off at section (L2) level</td>
                    <td style={{ fontSize: '12px' }}>Edit in track changes + comment + sign off at L2. Every non-legal owner must sign; among Legal/Compliance owners a single sign-off suffices.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Guest</td>
                    <td style={{ fontSize: '12px' }}>Read-only reviewers (incl. auto-provisioned via "Send to")</td>
                    <td style={{ fontSize: '12px' }}>View + comment on content only. No edit, no sign-off, no audit trail, no export.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Auditor<NewBadge /></td>
                    <td style={{ fontSize: '12px' }}>External assurance / audit</td>
                    <td style={{ fontSize: '12px' }}>Dedicated read-only Audit view only — released signed-off sections with their data points and supporting evidence, plus the released report PDF. No drafting environment, no AI chat, no internal audit trail.</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="guide-subtitle" style={{ marginTop: '24px' }}>Authentication</h3>
              <p className="guide-text">
                Users authenticate via Amazon Cognito User Pool federated to the Novartis corporate identity provider (SAML/OIDC). No separate credentials are needed — use your standard corporate login.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
