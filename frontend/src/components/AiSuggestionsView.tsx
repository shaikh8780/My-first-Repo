export default function AiSuggestionsView() {
  return (
    <>
      <div className="view-header">
        <h1 className="view-title">AI-Augmented Enhancement Roadmap</h1>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '16px', borderLeft: '3px solid var(--accent)' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
          AI-augmented enhancements mapped to functional requirements and the three-pillar architecture: Core Reporting, Review Management, and Add-On Features. Each proposal includes effort/impact assessment and implementation priority.
        </p>
      </div>

      {/* Pillar 1 Enhancements */}
      <div className="card" style={{ padding: '32px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 className="card-title" style={{ margin: 0, fontSize: '18px' }}>Pillar 1: Core Sustainability Reporting</h2>
          <span className="complexity-badge complexity-high-value">Core Deliverable</span>
        </div>

        <div className="suggestions-grid">
          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Automated Style Guide Enforcement with Inline Suggestions</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-08</span>
                <span className="suggestion-tag">NFR-10</span>
                <span className="suggestion-tag">US-10</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Deploy a real-time style checking agent that monitors editor content against the Novartis Communications Style Guide (March 2024). Flags greenwashing language, incorrect terminology ("associate" instead of "employee"), number formatting violations (%, currency codes), and banned phrases.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> NFR-10 requires 95% style guide conformance. Manual post-hoc review is error-prone when ~150,000 words span 86 subsections written by different contributors. Real-time enforcement prevents violations rather than catching them later.
              </div>
              <div className="suggestion-metric">Target: 95% conformance rate at first draft → reduces 2-3 editorial review cycles</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Multi-Year Trend Narrative Generation</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-03</span>
                <span className="suggestion-tag">US-03</span>
                <span className="suggestion-tag">AI Agent</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Extend the RNFM Draft Generation Agent to automatically generate year-over-year trend narratives by comparing current metrics with prior-year sections (2023, 2024, 2025) indexed in the Knowledge Base. Produces statements like "Scope 1 emissions decreased by 12% compared to the prior year, continuing the trajectory toward our 2030 target."</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> IFRS S1.B45 mandates comparative information. Currently, SMEs manually draft trend narratives by referencing prior reports. Automation ensures consistent framing and catches directional errors (e.g., claiming a decrease when data shows an increase).
              </div>
              <div className="suggestion-metric">Eliminates ~4 hours per section of manual comparison work</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Automated Data Table Extraction from Source PDFs</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-01</span>
                <span className="suggestion-tag">Textract</span>
                <span className="suggestion-tag">Pipeline</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Enhance the Document Ingestion Pipeline to extract structured data tables from source PDFs (CDP responses, prior reports, internal metrics dashboards) using Amazon Textract. Extracted values populate the DP_* table placeholders in the MDD output, reducing manual data entry.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> The Q6 MDD format uses table placeholders (e.g., [Table Reference: DP_Environment] with 47 rows). Currently, ESG FRA manually populates these from Enablon/Workday. Automated extraction pre-fills values from indexed documents, flagging discrepancies for human review.
              </div>
              <div className="suggestion-metric">Reduces DP_Environment table population from ~2 days to ~2 hours</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Hedging-to-Commitment Ratio Analysis</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-18</span>
                <span className="suggestion-tag">US-12</span>
                <span className="suggestion-tag">Tone</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Implement per-section tone analysis that measures the ratio of hedging language ("may," "could," "potential," "estimated") to commitment language ("will," "require," "mandate"). The 2025 RNFM maintains a 3:1 hedge:commit ratio. Flag sections that deviate significantly.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> Regulatory sustainability disclosures must be appropriately cautious (avoiding unverifiable forward-looking statements) while still demonstrating commitment to targets. Incorrect tone creates legal liability.
              </div>
              <div className="suggestion-metric">Maintains 3:1 ratio per established Novartis precedent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar 2 Enhancements */}
      <div className="card" style={{ padding: '32px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 className="card-title" style={{ margin: 0, fontSize: '18px' }}>Pillar 2: Review Management & Governance</h2>
          <span className="complexity-badge complexity-low">Medium Effort</span>
        </div>

        <div className="suggestions-grid">
          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Smart Notifications with Escalation</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-13</span>
                <span className="suggestion-tag">US-13</span>
                <span className="suggestion-tag">SNS/SES</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Implement workflow-triggered notifications via Amazon SNS/SES: email alerts when sections are ready for review, overdue reminders, escalation to reporting lead when deadlines approach. Integrates with existing Novartis email infrastructure.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> The reporting team currently chases contributors via email. Automated notifications with escalation paths reduce coordination overhead and prevent deadline slippage during the 2-4 week review windows.
              </div>
              <div className="suggestion-metric">Reduces coordination overhead from ~5 hours/week to near-zero</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Section-Level Commenting Threads</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-10</span>
                <span className="suggestion-tag">US-14</span>
                <span className="suggestion-tag">Collaboration</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Add threaded comments attached to specific text ranges within sections. Comments persist across edit cycles, support @mentions for routing to specific reviewers, and are archived in the audit trail. Legal Reviewer comments are visually distinct from SME comments.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> The RNFM Scope 3 gap resolution scenario (US-07) requires Legal Reviewer to leave actionable comments that SMEs resolve. Without threaded comments, feedback flows through email — losing context and auditability.
              </div>
              <div className="suggestion-metric">All review feedback captured in-system; audit-ready</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Conflict Detection and Auto-Save</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">NFR-08</span>
                <span className="suggestion-tag">US-18</span>
                <span className="suggestion-tag">DynamoDB Streams</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Implement optimistic concurrency control using DynamoDB conditional writes and version vectors. Auto-saves every 30 seconds. If two users edit the same section concurrently, the system detects the conflict and presents a merge UI (similar to Git conflict resolution).</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> NFR-08 targets 5-10 concurrent users. Without conflict detection, later saves silently overwrite earlier ones. Section locking is too coarse when SMEs and the Reporting Lead need simultaneous access.
              </div>
              <div className="suggestion-metric">Zero data loss from concurrent edits</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Legal Sign-Off Blocker Enforcement</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">Workflow</span>
                <span className="suggestion-tag">Compliance</span>
                <span className="suggestion-tag">US-07</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Enforce the rule that Legal sign-off is blocked if any mandatory ESRS DR has status "missing" without a documented justification override. The system prevents the workflow transition until all mandatory DRs are either "covered" or have an explicit exemption reason recorded.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> This is a hard success criterion: "100% of applicable mandatory ESRS DRs have status 'covered' before Legal sign-off is permitted." Without enforcement, the constraint relies on human vigilance.
              </div>
              <div className="suggestion-metric">Regulatory compliance guaranteed at sign-off gate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar 3 Enhancements */}
      <div className="card" style={{ padding: '32px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 className="card-title" style={{ margin: 0, fontSize: '18px' }}>Pillar 3: Add-On Features & Strategic Extensions</h2>
          <span className="complexity-badge complexity-low">Higher Effort</span>
          <span className="complexity-badge complexity-high-value">Strategic Value</span>
        </div>

        <div className="suggestions-grid">
          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Local Country Report Adaptation</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-16</span>
                <span className="suggestion-tag">Future</span>
                <span className="suggestion-tag">Multi-Template</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Adapt the global RNFM for local subsidiary reporting requirements. Same Knowledge Base, different templates and disclosure requirements per jurisdiction (e.g., Swiss CO vs. German CSR-RUG vs. CSRD for EU entities). AI agent selects relevant content from the global report and restructures for local format.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> Local country adaptation was explicitly stated as a future need: "adapt global report for local country reports (same tool, different output)." Architecture should support multi-template output from day one even if not implemented initially.
              </div>
              <div className="suggestion-metric">One knowledge base, N country outputs</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Regulatory Change Monitoring</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">Risk #6</span>
                <span className="suggestion-tag">ESRS Amended</span>
                <span className="suggestion-tag">EventBridge</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Monitor EFRAG, ISSB, and EU Official Journal for standard updates. When the EC Draft Delegated Act (6 May 2026) is finalized, automatically flag affected datapoints in the compliance register. Alert the Reporting Lead about new requirements, phase-in changes, or UCE relief modifications.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> The ESRS Datapoint Register currently reflects the EC Draft (consultation closed 3 June 2026). Final version may differ. Without monitoring, the compliance checklist silently becomes stale.
              </div>
              <div className="suggestion-metric">Zero-day awareness of regulatory changes affecting the report</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Materiality Assessment Automation (DMA)</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">ESRS2-IRO1</span>
                <span className="suggestion-tag">FR-05</span>
                <span className="suggestion-tag">AI Agent</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Implement an AI-assisted Double Materiality Assessment (DMA) that analyzes Novartis's industry context, value chain, and stakeholder inputs to recommend which ESRS topics are material. Uses SASB materiality map for pharmaceuticals as a baseline, enhanced with Novartis-specific data from the ERM framework and stakeholder engagement outputs.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> ESRS2-IRO1 requires disclosure of the DMA methodology. The "DMA Assessment Y/N" column in the Proposed Template drives which datapoints are reported. Currently this assessment happens outside the system — integrating it creates a single source of truth.
              </div>
              <div className="suggestion-metric">DMA directly populates the checklist filter; no manual column entry</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Unify+ Data Lake Integration</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">Future</span>
                <span className="suggestion-tag">ESG FRA</span>
                <span className="suggestion-tag">Quantitative</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Connect to Novartis Unify+ data lake for automated quantitative metric ingestion. Instead of manually populating DP_* table placeholders, pull verified figures from Enablon (environmental metrics), Workday (workforce), and SAP (supply chain) via secure API integration.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> ESG FRA currently collects quantitative data separately. Power BI visualizes only ~10% of the data lake. Direct integration eliminates the hand-off gap between "numbers" (FRA) and "narrative" (SI&S), ensuring tables always reflect source-of-truth values.
              </div>
              <div className="suggestion-metric">Eliminates manual data transcription errors; real-time metric updates</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Compliance Index Auto-Generation (TCFD/GRI/ESRS/ISSB)</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-12</span>
                <span className="suggestion-tag">US-17</span>
                <span className="suggestion-tag">Appendix</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Auto-generate the TCFD Index (p.40 of 2025 RNFM) and GRI Index (pp.41-42) by mapping each report section's content to framework requirements and computing page references from the generated DOCX structure. Produces a formatted appendix table ready for MDD export.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> The 2025 report includes both a TCFD Index and GRI Content Index as appendices. These are currently built manually by cross-referencing section content with framework requirements. The compliance mapping data already exists in the system — it just needs formatting as an index table.
              </div>
              <div className="suggestion-metric">Appendix tables generated in seconds rather than days</div>
            </div>
          </div>

          <div className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-title">Audit-Ready Evidence Chain Visualization</div>
              <div className="suggestion-tags">
                <span className="suggestion-tag">FR-11</span>
                <span className="suggestion-tag">US-05</span>
                <span className="suggestion-tag">KPMG</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>Provide a visual traceability graph showing the full evidence chain from each AI-generated claim back through the RAG retrieval, source document, and original data. Supports KPMG ISAE 3000/3410 limited assurance process by making evidence inspection self-service for auditors.</p>
              <div className="suggestion-impact">
                <strong>Why it matters:</strong> Success metric requires "0% hallucination for factual claims" and "100% of AI-generated claims have at least one source citation." The current citation panel shows the link; the evidence chain visualization shows the path (query → retrieval → chunk → source → claim), making auditor verification systematic rather than ad-hoc.
              </div>
              <div className="suggestion-metric">Audit evidence inspection time reduced by 60%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Value Ranking */}
      <div className="card" style={{ padding: '32px' }}>
        <h2 className="card-title" style={{ marginBottom: '6px', fontSize: '18px' }}>Enhancements Ranked by Business Value</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          Ordered by business value added — the combination of a hard success criterion or regulatory obligation it unlocks and the manual effort it removes — weighed against implementation effort. Each row ties to a stated requirement or success metric from the intake; value ties break in favour of lower effort and dependencies already in place.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Enhancement</th>
                <th style={{ width: '150px' }}>Business value added</th>
                <th style={{ width: '80px' }}>Effort</th>
                <th style={{ width: '110px' }}>Dependency</th>
                <th style={{ width: '70px' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>1</td>
                <td style={{ fontWeight: 500 }}>Legal Sign-Off Blocker</td>
                <td style={{ fontSize: '11px' }}>Guarantees the 100%-mandatory-ESRS-covered sign-off gate — a hard success criterion</td>
                <td><span className="complexity-badge complexity-low">Low</span></td>
                <td style={{ fontSize: '11px' }}>Compliance scan</td>
                <td style={{ fontWeight: 700, color: '#16a34a' }}>P1</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>2</td>
                <td style={{ fontWeight: 500 }}>Style Guide Enforcement</td>
                <td style={{ fontSize: '11px' }}>Hits the 95% style-conformance NFR at first draft; removes 2-3 editorial cycles</td>
                <td><span className="complexity-badge complexity-low">Low</span></td>
                <td style={{ fontSize: '11px' }}>KB indexed (done)</td>
                <td style={{ fontWeight: 700, color: '#16a34a' }}>P1</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>3</td>
                <td style={{ fontWeight: 500 }}>Compliance Index Auto-Gen</td>
                <td style={{ fontSize: '11px' }}>Auto-builds the TCFD/GRI appendix indices; days → seconds, mapping data already exists</td>
                <td><span className="complexity-badge complexity-low">Med</span></td>
                <td style={{ fontSize: '11px' }}>Compliance mapping</td>
                <td style={{ fontWeight: 700, color: '#16a34a' }}>P1</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>4</td>
                <td style={{ fontWeight: 500 }}>Trend Narrative Generation</td>
                <td style={{ fontSize: '11px' }}>Meets IFRS S1 comparative-info duty; ~4h/section saved, catches directional errors</td>
                <td><span className="complexity-badge complexity-low">Med</span></td>
                <td style={{ fontSize: '11px' }}>Prior reports indexed</td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>P2</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>5</td>
                <td style={{ fontWeight: 500 }}>Smart Notifications</td>
                <td style={{ fontSize: '11px' }}>Removes ~5h/week of chasing contributors; prevents review-window slippage</td>
                <td><span className="complexity-badge complexity-low">Low</span></td>
                <td style={{ fontSize: '11px' }}>SNS/SES config</td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>P2</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>6</td>
                <td style={{ fontWeight: 500 }}>Section-Level Comments</td>
                <td style={{ fontSize: '11px' }}>Keeps review feedback in-system and audit-ready (US-07 gap-resolution flow)</td>
                <td><span className="complexity-badge complexity-low">Med</span></td>
                <td style={{ fontSize: '11px' }}>Editor infra</td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>P2</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>7</td>
                <td style={{ fontWeight: 500 }}>Data Table Extraction</td>
                <td style={{ fontSize: '11px' }}>Pre-fills DP_* tables from source PDFs; DP_Environment ~2 days → ~2 hours</td>
                <td><span className="complexity-badge complexity-high-value">High</span></td>
                <td style={{ fontSize: '11px' }}>Textract pipeline</td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>P2</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>8</td>
                <td style={{ fontWeight: 500 }}>Audit-Ready Evidence Chain</td>
                <td style={{ fontSize: '11px' }}>Backs the 100%-citation / 0%-hallucination metric; ~60% faster auditor review</td>
                <td><span className="complexity-badge complexity-low">Med</span></td>
                <td style={{ fontSize: '11px' }}>Citation model</td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>P2</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>9</td>
                <td style={{ fontWeight: 500 }}>Conflict Detection &amp; Auto-Save</td>
                <td style={{ fontSize: '11px' }}>Zero data loss at the 5-10 concurrent-user NFR; finer-grained than section locks</td>
                <td><span className="complexity-badge complexity-low">Med</span></td>
                <td style={{ fontSize: '11px' }}>DynamoDB Streams</td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>P2</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>10</td>
                <td style={{ fontWeight: 500 }}>Hedging Ratio Analysis</td>
                <td style={{ fontSize: '11px' }}>Manages legal liability from over/under-committed tone; low-cost guardrail</td>
                <td><span className="complexity-badge complexity-low">Low</span></td>
                <td style={{ fontSize: '11px' }}>None</td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>P2</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>11</td>
                <td style={{ fontWeight: 500 }}>Unify+ Data Lake Integration</td>
                <td style={{ fontSize: '11px' }}>Single source of truth for figures; removes hand-off gap and transcription error</td>
                <td><span className="complexity-badge complexity-high-value">High</span></td>
                <td style={{ fontSize: '11px' }}>Novartis API access</td>
                <td style={{ fontWeight: 700, color: '#6366f1' }}>P3</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>12</td>
                <td style={{ fontWeight: 500 }}>DMA Automation</td>
                <td style={{ fontSize: '11px' }}>Makes the DMA (ESRS2-IRO1) the single source driving the checklist filter</td>
                <td><span className="complexity-badge complexity-high-value">High</span></td>
                <td style={{ fontSize: '11px' }}>Stakeholder data</td>
                <td style={{ fontWeight: 700, color: '#6366f1' }}>P3</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>13</td>
                <td style={{ fontWeight: 500 }}>Regulatory Change Monitor</td>
                <td style={{ fontSize: '11px' }}>Keeps the DR register from silently going stale as ESRS is finalised</td>
                <td><span className="complexity-badge complexity-low">Med</span></td>
                <td style={{ fontSize: '11px' }}>EventBridge</td>
                <td style={{ fontWeight: 700, color: '#6366f1' }}>P3</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>14</td>
                <td style={{ fontWeight: 500 }}>Local Country Adaptation</td>
                <td style={{ fontSize: '11px' }}>Strategic: one knowledge base → N jurisdictional outputs (explicit future need)</td>
                <td><span className="complexity-badge complexity-high-value">High</span></td>
                <td style={{ fontSize: '11px' }}>Multi-template arch</td>
                <td style={{ fontWeight: 700, color: '#6366f1' }}>P3</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
