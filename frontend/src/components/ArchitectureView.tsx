import { Fragment } from 'react';

export default function ArchitectureView() {
  return (
    <>
      <div className="view-header">
        <h1 className="view-title">System Architecture</h1>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AWS Cloud-Native · built to move into the Novartis environment</span>
      </div>

      {/* Deployment approach — how we get from the current build to a backed,
          Novartis-ready application without re-architecting later. */}
      <div className="card" style={{ padding: '28px 32px' }}>
        <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '8px' }}>Deployment approach</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px', maxWidth: '980px' }}>
          The studio is built as a cloud-native AWS application from day one, and packaged as a single, parameterised
          deployment. External Novartis systems (document / SOP repositories, MDD data, corporate identity, notifications)
          sit behind clean interfaces — <strong>ports</strong> — each with an interchangeable <strong>adapter</strong>.
          We run with self-contained adapters seeded from the documents Novartis has provided plus generated stand-in data,
          so the application is fully functional now. Moving into the Novartis environment is then a matter of selecting the
          real adapters and providing credentials — configuration, not re-engineering.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px', maxWidth: '980px', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '10px 14px' }}>
          ⓘ <strong>What runs live in this demo vs. the production target.</strong> Live now: the React SPA, Cognito auth,
          the FastAPI backend with its DynamoDB-backed store, and direct Amazon Bedrock model calls for the in-editor AI.
          Seeded / simulated in this prototype: document ingestion (parsing, embedding, vector indexing), the Bedrock
          Knowledge Base + agent pipeline, and the compliance / peer-benchmarking corpora — these are the target-adapter
          integrations shown in the right-hand column below.
        </p>
        <div className="arch-flow">
          {[
            ['1', 'Cloud-native build', 'React SPA + FastAPI + AWS services (Bedrock, DynamoDB, S3, OpenSearch) provisioned as one IaC stack.'],
            ['2', 'Self-contained adapters', 'Document, MDD, identity and notification ports run against seeded + generated data — no external dependency to demo end to end.'],
            ['3', 'Parameterised bundle', 'No hard-coded accounts or endpoints; environment-scoped config and a seed job make the stack portable.'],
            ['4', 'Novartis environment', 'Deploy the same stack; switch ports to Novartis adapters (DMS, MDD API, corporate IdP) and provide credentials.'],
          ].map(([n, t, d], i, arr) => (
            <Fragment key={n}>
              <div className="arch-flow-step">
                <div className="arch-flow-number">{n}</div>
                <div className="arch-flow-content">
                  <div className="arch-flow-title">{t}</div>
                  <div className="arch-flow-desc">{d}</div>
                </div>
              </div>
              {i < arr.length - 1 && <div className="arch-flow-arrow">→</div>}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Ports & adapters — the mechanism that keeps the move low-complexity. */}
      <div className="card" style={{ padding: '28px 32px', marginTop: '16px' }}>
        <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '8px' }}>Integration ports &amp; adapters</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px', maxWidth: '980px' }}>
          Each integration point is an interface with two implementations: a self-contained one used now, and a Novartis one
          used after the move. Core application logic depends only on the interface, so swapping is isolated and low-risk.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '820px' }}>
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Port (interface)</th>
                <th style={{ width: '40%' }}>Now — self-contained adapter</th>
                <th style={{ width: '40%' }}>Novartis environment — target adapter</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Document / SOP source', 'Knowledge base seeded from Novartis-provided documents + generated stand-in policies/SOPs.', 'Connector to the Novartis document / SOP management system (live ingestion).'],
                ['MDD table data', 'MDD tables served from the provided MDD template & reference data.', 'Live MDD API pull; round-trip on export with MDD codes.'],
                ['Identity & roles', 'Amazon Cognito user pool + groups mapped to application roles.', 'Novartis corporate IdP via SAML/OIDC federation; groups from AD.'],
                ['Notifications', 'In-app + SNS/email stub for review assignments.', 'Novartis email / Teams notification channel.'],
                ['Prior-year & peer data', 'Provided prior RNFM + curated peer report set, indexed for RAG.', 'Ongoing feed of approved reports and licensed peer sources.'],
              ].map(([port, now, target]) => (
                <tr key={port}>
                  <td style={{ fontWeight: 600 }}>{port}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{now}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid #16a34a', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong>Why this matters for the move:</strong> because the swap is confined to the adapter layer, integration and
          setup in the Novartis environment stay straightforward — the application, data model, workflow and AI logic are
          unchanged. What we need from Novartis to activate each target adapter is listed in the capabilities &amp; requirements deck.
        </div>
      </div>

      {/* High-Level Architecture */}
      <div className="card" style={{ padding: '32px', marginTop: '16px' }}>
        <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '20px' }}>System Overview</h2>
        <div className="arch-diagram">
          {/* Users Layer */}
          <div className="arch-layer">
            <div className="arch-layer-label">Users</div>
            <div className="arch-layer-content">
              <div className="arch-box arch-box-user">
                <div className="arch-box-title">ESG Reporting Lead</div>
                <div className="arch-box-desc">Full access</div>
              </div>
              <div className="arch-box arch-box-user">
                <div className="arch-box-title">Section Owner (SME)</div>
                <div className="arch-box-desc">Edit assigned sections</div>
              </div>
              <div className="arch-box arch-box-user">
                <div className="arch-box-title">Legal Reviewer</div>
                <div className="arch-box-desc">Compliance sign-off</div>
              </div>
            </div>
          </div>

          <div className="arch-connector">▼</div>

          {/* Presentation Layer */}
          <div className="arch-layer">
            <div className="arch-layer-label">Presentation</div>
            <div className="arch-layer-content">
              <div className="arch-box arch-box-frontend">
                <div className="arch-box-title">React SPA</div>
                <div className="arch-box-desc">TypeScript + Vite</div>
              </div>
              <div className="arch-box arch-box-frontend">
                <div className="arch-box-title">Amazon CloudFront</div>
                <div className="arch-box-desc">CDN + S3 static hosting</div>
              </div>
              <div className="arch-box arch-box-frontend">
                <div className="arch-box-title">Amazon Cognito</div>
                <div className="arch-box-desc">SAML federation + JWT</div>
              </div>
            </div>
          </div>

          <div className="arch-connector">▼</div>

          {/* API Layer */}
          <div className="arch-layer">
            <div className="arch-layer-label">API</div>
            <div className="arch-layer-content">
              <div className="arch-box arch-box-api">
                <div className="arch-box-title">FastAPI Service</div>
                <div className="arch-box-desc">ECS Fargate + ALB + WAF</div>
              </div>
              <div className="arch-box arch-box-api">
                <div className="arch-box-title">Workflow & Audit Service</div>
                <div className="arch-box-desc">ECS Fargate microservice</div>
              </div>
            </div>
          </div>

          <div className="arch-connector">▼</div>

          {/* AI Layer */}
          <div className="arch-layer">
            <div className="arch-layer-label">AI Agents</div>
            <div className="arch-layer-content">
              <div className="arch-box arch-box-ai">
                <div className="arch-box-title">Draft Generation Agent</div>
                <div className="arch-box-desc">Strands on Bedrock AgentCore</div>
              </div>
              <div className="arch-box arch-box-ai">
                <div className="arch-box-title">Compliance Gap Agent</div>
                <div className="arch-box-desc">ESRS/GRI/TCFD/ISSB mapping</div>
              </div>
              <div className="arch-box arch-box-ai">
                <div className="arch-box-title">Peer Benchmarking Agent</div>
                <div className="arch-box-desc">Comparative Q&A</div>
              </div>
            </div>
          </div>

          <div className="arch-connector">▼</div>

          {/* Async Layer */}
          <div className="arch-layer">
            <div className="arch-layer-label">Async Processing</div>
            <div className="arch-layer-content">
              <div className="arch-box arch-box-async">
                <div className="arch-box-title">Amazon SQS</div>
                <div className="arch-box-desc">3 queues + DLQs</div>
              </div>
              <div className="arch-box arch-box-async">
                <div className="arch-box-title">Step Functions</div>
                <div className="arch-box-desc">Document ingestion pipeline</div>
              </div>
              <div className="arch-box arch-box-async">
                <div className="arch-box-title">Lambda</div>
                <div className="arch-box-desc">DOCX export pipeline</div>
              </div>
            </div>
          </div>

          <div className="arch-connector">▼</div>

          {/* Integration / Adapter Layer — the swap point for the Novartis move */}
          <div className="arch-layer">
            <div className="arch-layer-label">Integration ports (adapter layer)</div>
            <div className="arch-layer-content">
              <div className="arch-box arch-box-async">
                <div className="arch-box-title">Document / SOP port</div>
                <div className="arch-box-desc">Seeded KB → Novartis DMS connector</div>
              </div>
              <div className="arch-box arch-box-async">
                <div className="arch-box-title">MDD data port</div>
                <div className="arch-box-desc">Provided MDD → live MDD API</div>
              </div>
              <div className="arch-box arch-box-async">
                <div className="arch-box-title">Identity port</div>
                <div className="arch-box-desc">Cognito → corporate IdP (SAML/OIDC)</div>
              </div>
              <div className="arch-box arch-box-async">
                <div className="arch-box-title">Notification port</div>
                <div className="arch-box-desc">SNS/email stub → Novartis channel</div>
              </div>
            </div>
          </div>

          <div className="arch-connector">▼</div>

          {/* Data Layer */}
          <div className="arch-layer">
            <div className="arch-layer-label">Data</div>
            <div className="arch-layer-content">
              <div className="arch-box arch-box-data">
                <div className="arch-box-title">DynamoDB</div>
                <div className="arch-box-desc">Documents, compliance, audit</div>
              </div>
              <div className="arch-box arch-box-data">
                <div className="arch-box-title">S3</div>
                <div className="arch-box-desc">Raw docs + exports (KMS)</div>
              </div>
              <div className="arch-box arch-box-data">
                <div className="arch-box-title">OpenSearch Serverless</div>
                <div className="arch-box-desc">Vector store (1024-dim)</div>
              </div>
              <div className="arch-box arch-box-data">
                <div className="arch-box-title">Bedrock KB</div>
                <div className="arch-box-desc">Titan Embed v2 + RAG</div>
              </div>
            </div>
          </div>

          <div className="arch-connector">▼</div>

          {/* Observability */}
          <div className="arch-layer">
            <div className="arch-layer-label">Observability</div>
            <div className="arch-layer-content">
              <div className="arch-box arch-box-ops">
                <div className="arch-box-title">CloudWatch</div>
                <div className="arch-box-desc">Metrics, alarms, dashboards</div>
              </div>
              <div className="arch-box arch-box-ops">
                <div className="arch-box-title">X-Ray</div>
                <div className="arch-box-desc">Distributed tracing</div>
              </div>
              <div className="arch-box arch-box-ops">
                <div className="arch-box-title">SNS</div>
                <div className="arch-box-desc">Alerts + notifications</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Flow */}
      <div className="card" style={{ padding: '32px', marginTop: '16px' }}>
        <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '20px' }}>Data Flow: Document to Draft</h2>
        <div className="arch-flow">
          <div className="arch-flow-step">
            <div className="arch-flow-number">1</div>
            <div className="arch-flow-content">
              <div className="arch-flow-title">Upload</div>
              <div className="arch-flow-desc">Source document (PDF/DOCX) uploaded to S3 raw-documents bucket via UI or drop zone</div>
            </div>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <div className="arch-flow-number">2</div>
            <div className="arch-flow-content">
              <div className="arch-flow-title">Extract & Chunk</div>
              <div className="arch-flow-desc">Step Functions pipeline: Textract for PDFs, python-docx for Word. Split into 512-token chunks with 10% overlap</div>
            </div>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <div className="arch-flow-number">3</div>
            <div className="arch-flow-content">
              <div className="arch-flow-title">Embed</div>
              <div className="arch-flow-desc">Amazon Titan Embed v2 generates 1024-dim vectors for each chunk. Metadata tagged (type, framework, year)</div>
            </div>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <div className="arch-flow-number">4</div>
            <div className="arch-flow-content">
              <div className="arch-flow-title">Index</div>
              <div className="arch-flow-desc">Vectors upserted to OpenSearch Serverless (VectorSearch collection) via Bedrock KB sync API</div>
            </div>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <div className="arch-flow-number">5</div>
            <div className="arch-flow-content">
              <div className="arch-flow-title">Retrieve (RAG)</div>
              <div className="arch-flow-desc">Draft Generation Agent queries KB with section context. Top-K chunks retrieved with metadata filtering</div>
            </div>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <div className="arch-flow-number">6</div>
            <div className="arch-flow-content">
              <div className="arch-flow-title">Generate</div>
              <div className="arch-flow-desc">Claude Sonnet synthesizes section draft from retrieved chunks + prior year + DR requirements. Outputs structured JSON with citations</div>
            </div>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <div className="arch-flow-number">7</div>
            <div className="arch-flow-content">
              <div className="arch-flow-title">Review & Export</div>
              <div className="arch-flow-desc">Human review (SME → Legal → Approval), then DOCX export via Lambda using MDD template</div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="card" style={{ padding: '32px', marginTop: '16px' }}>
        <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '20px' }}>Technology Stack</h2>
        <div className="tech-grid">
          <div className="tech-card">
            <div className="tech-card-category">Compute</div>
            <div className="tech-card-items">
              <div className="tech-item"><strong>ECS Fargate</strong> — API + Workflow services (serverless containers)</div>
              <div className="tech-item"><strong>Lambda</strong> — DOCX export, ingestion workers (event-driven)</div>
              <div className="tech-item"><strong>Step Functions</strong> — Document ingestion orchestration</div>
            </div>
          </div>
          <div className="tech-card">
            <div className="tech-card-category">AI / ML</div>
            <div className="tech-card-items">
              <div className="tech-item"><strong>Bedrock AgentCore</strong> — Hosted Strands agents (3 agents)</div>
              <div className="tech-item"><strong>Claude Sonnet 4.6</strong> — Draft generation, compliance analysis</div>
              <div className="tech-item"><strong>Claude Opus 4.6</strong> — Deep compliance review</div>
              <div className="tech-item"><strong>Titan Embed v2</strong> — Document embeddings (1024-dim)</div>
              <div className="tech-item"><strong>Bedrock KB</strong> — Managed RAG with metadata filtering</div>
            </div>
          </div>
          <div className="tech-card">
            <div className="tech-card-category">Storage</div>
            <div className="tech-card-items">
              <div className="tech-item"><strong>DynamoDB</strong> — Documents, compliance mappings, workflow, audit (KMS encrypted)</div>
              <div className="tech-item"><strong>S3</strong> — Raw documents, exports (versioned, KMS, lifecycle policies)</div>
              <div className="tech-item"><strong>OpenSearch Serverless</strong> — Vector store (VectorSearch collection)</div>
            </div>
          </div>
          <div className="tech-card">
            <div className="tech-card-category">Networking & Security</div>
            <div className="tech-card-items">
              <div className="tech-item"><strong>CloudFront</strong> — CDN for SPA (S3 origin, HTTPS only)</div>
              <div className="tech-item"><strong>ALB + WAF</strong> — API load balancing with web application firewall</div>
              <div className="tech-item"><strong>Cognito</strong> — User pool with SAML/OIDC corporate IdP federation</div>
              <div className="tech-item"><strong>KMS</strong> — Customer-managed keys for all data at rest</div>
              <div className="tech-item"><strong>VPC</strong> — Private subnets for all backend services</div>
            </div>
          </div>
          <div className="tech-card">
            <div className="tech-card-category">Messaging & Events</div>
            <div className="tech-card-items">
              <div className="tech-item"><strong>SQS</strong> — Draft generation, compliance scan, export queues + DLQs</div>
              <div className="tech-item"><strong>EventBridge</strong> — S3 upload triggers ingestion pipeline</div>
              <div className="tech-item"><strong>SNS</strong> — Workflow notifications, DLQ alerts</div>
            </div>
          </div>
          <div className="tech-card">
            <div className="tech-card-category">Frontend</div>
            <div className="tech-card-items">
              <div className="tech-item"><strong>React 18</strong> — TypeScript SPA with functional components</div>
              <div className="tech-item"><strong>Vite</strong> — Build tooling (ESBuild + Rollup)</div>
              <div className="tech-item"><strong>CSS Variables</strong> — Design token system (light/dark themes)</div>
              <div className="tech-item"><strong>Amplify Hosting</strong> — CI/CD and deployment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card" style={{ padding: '32px', marginTop: '16px' }}>
        <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '20px' }}>Security & Compliance</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Authentication & Authorization</div>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
              <li>Cognito User Pool with corporate SAML federation</li>
              <li>JWT token validation on every API request</li>
              <li>Cognito Groups map to application roles (Lead, SME, Legal)</li>
              <li>Section-level access control (edit only assigned sections)</li>
            </ul>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid #16a34a' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Encryption</div>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
              <li>All data at rest encrypted with AWS KMS (CMK)</li>
              <li>TLS 1.3 for all data in transit</li>
              <li>S3 bucket policies enforce encryption</li>
              <li>DynamoDB table-level encryption</li>
            </ul>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Audit & Governance</div>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
              <li>Immutable append-only audit log (DynamoDB + S3 archive)</li>
              <li>7-year retention for regulatory compliance</li>
              <li>All AI-generated content flagged and citation-tracked</li>
              <li>Workflow sign-off blocking for incomplete compliance</li>
            </ul>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Network Security</div>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
              <li>All backend services in private VPC subnets</li>
              <li>WAF on ALB (rate limiting, SQL injection, XSS protection)</li>
              <li>VPC endpoints for S3, DynamoDB, SQS (no internet egress)</li>
              <li>Security groups restrict inter-service communication</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
