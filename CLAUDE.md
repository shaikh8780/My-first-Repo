# Novartis ESG AI-Enabled Sustainability Report Generation — Development Reference

Notes for engineers and coding agents working in this repository.

**Scope:** the agreed requirements document (V1 items) is the binding scope for the build. Where this file describes a broader target design, the requirements document wins. Decisions agreed with Novartis after sign-off (`handover/DECISIONS.md`) refine it and take precedence where the two differ.

## Project Overview
- **Application:** Novartis ESG AI-Enabled Sustainability Report Generation (ESG Authoring Studio)
- **Customer:** Novartis
- **Auth:** Amazon Cognito user pool (see DEPLOYMENT.md)
- **Deployment:** see DEPLOYMENT.md

## Architecture

> **Current MVP vs Target architecture (honesty note).** The architecture below
> describes the **target production** design. The **current build** is leaner:
> - Frontend SPA is real (CloudFront + S3, Cognito auth) and data persists via
>   the FastAPI backend's DynamoDB-backed resource store.
> - AI calls are **direct Amazon Bedrock model calls** (Claude Haiku via the
>   Converse API in `backend/ai.py`), NOT the AWS Strands / Bedrock AgentCore
>   agent framework described below.
> - Retrieval is a **local keyword/TF-IDF retriever** (`backend/retrieval.py`),
>   NOT a Bedrock Knowledge Base on OpenSearch Serverless.
> - Document **upload is simulated** in the UI (metadata only; no Textract /
>   Titan embedding / vector indexing pipeline).
> - Compliance mappings, peer-benchmarking corpus, and all parallel-report
>   content (ESG Index, UPC, ISSB/TCFD local reports, HRS) are **seeded static
>   data**, not live-generated.
> The Strands agents, Knowledge Base, SQS workers, Step Functions ingestion and
> DOCX export pipeline are the Phase-2 production target, not deployed today.

### Components
- **Frontend SPA** (ui): React single-page application providing the full authoring studio UI. Includes: (1) ProseMirror-based document editor with track changes, inline comments, citation markers, and section locking; (2) Compliance Gap Analysis dashboard with traffic-light DR coverage view; (3) Knowledge Base admin UI for document upload and ingestion status; (4) Review/approval workflow UI with role-based action buttons; (5) Peer benchmarking Q&A chat interface; (6) Audit trail viewer (read-only). Served via CloudFront + S3 static hosting. Authenticated via Amazon Cognito User Pool federated to Novartis corporate IdP (SAML/OIDC). No VPC attachment required — pure static hosting pattern.
- **API Service** (service): FastAPI backend running on ECS Fargate behind an Application Load Balancer. Handles all synchronous API requests from the Frontend SPA: document CRUD, section state management, workflow actions (submit for review, approve, reject, lock section), user/role management, audit log queries, and compliance index export. Long-running operations (AI draft generation, compliance scan, DOCX export) are dispatched asynchronously to SQS queues and return a job ID for polling. JWT tokens from Cognito are validated on every request. Deploys into the existing VPC's private subnets. Missing detail: No mention of VPC placement for ECS tasks, security group rules, or WAF on the ALB. Rate limiting and throttling policies are absent. Secrets Manager integration for any downstream credentials (e.g., OpenSearch, third-party APIs) is not described. Dead-letter handling for failed synchronous calls is not addressed.
- **Job Queue** (infrastructure): Amazon SQS standard queues for dispatching async long-running jobs from the API Service to worker services. Three logical queues: (1) draft-generation-queue — triggers RNFM Draft Generation Worker; (2) compliance-scan-queue — triggers Compliance Gap Analysis Worker; (3) export-queue — triggers DOCX Export Worker. Each queue has a corresponding Dead Letter Queue (DLQ) for failed message handling. Visibility timeout set to 15 minutes to accommodate long-running AI generation tasks. Uses shared VPC endpoint for SQS.
- **Document Store** (infrastructure): Persistent storage layer for all structured application data. DynamoDB tables: (1) documents — report metadata, section tree, paragraph content (JSON document model), citation links, section lock state, version history; (2) compliance-mappings — per-section DR coverage status, confidence scores, suggested fill text; (3) workflow-state — report lifecycle state, reviewer assignments, approval records; (4) kb-document-registry — knowledge base document metadata (source type, framework, year, ingestion status). S3 buckets: (1) raw-documents — source PDFs/DOCX uploaded to knowledge base (versioning enabled, KMS encrypted); (2) report-exports — generated DOCX files (versioning enabled, KMS encrypted). All DynamoDB tables use AWS KMS customer-managed keys. Uses existing VPC's DynamoDB endpoint. Missing detail: DynamoDB capacity mode (on-demand vs. provisioned with auto-scaling) is not specified. Point-in-time recovery (PITR) and backup retention policy are not mentioned. DynamoDB Streams should be called out as the mechanism for triggering downstream audit events or change-data-capture to the Workflow & Audit Service.
- **Workflow & Audit Service** (service): ECS Fargate microservice responsible for: (1) enforcing the structured review/approval workflow state machine (Draft → SME Review → Legal Review → Approved → Exported); (2) writing immutable audit log entries to DynamoDB audit-log table (append-only via condition expressions) and archiving to S3 (Glacier after 90 days, retained 7 years); (3) enforcing sign-off blocking rules (Legal sign-off blocked if any mandatory ESRS DR is 'missing' without documented justification override); (4) sending workflow notification events via Amazon SNS (email to assigned reviewers). Audit log entries capture: user identity, timestamp UTC, action type, affected section/content ID, before/after content snapshot. Uses existing VPC's private subnets. Missing detail: The immutable audit log destination is not specified — should call out Amazon S3 (with Object Lock / WORM) or CloudTrail Lake for tamper-evident storage. Notification mechanism for workflow state transitions (e.g., Amazon SNS/SES email to reviewers) is not described. Role-based access enforcement (who can approve vs. review) is not tied to a specific IAM or Cognito Groups mechanism.
- **Knowledge Base** (infrastructure): Amazon Bedrock Knowledge Base providing semantic retrieval for all source documents. Configuration: embedding model amazon.titan-embed-text-v2:0; vector store Amazon OpenSearch Serverless (collection type: VectorSearch); S3 raw-documents bucket as data source. Supports metadata filtering by document_type, framework (ESRS/GRI/TCFD/ISSB), year, and source_org. Chunking: 512 tokens with 10% overlap. Used by both the RNFM Draft Generation Agent (RAG retrieval) and the Peer Benchmarking Agent (Q&A). OpenSearch Serverless collection uses the existing VPC's private subnets. Missing detail: No mention of chunking strategy (chunk size, overlap) for the Titan embedding model, which directly impacts retrieval quality for long ESG documents. Metadata filtering (e.g., by document type: ESRS, GRI, peer report, prior RNFM) is not described. Access control on the OpenSearch Serverless collection (data access policies, VPC endpoint) is absent.
- **RNFM Draft Generation Agent** (ml_model): AWS Strands agent hosted on Amazon Bedrock AgentCore. Responsible for generating structured first-draft RNFM sections grounded in retrieved source documents. 

**Agent Prompt**: System prompt defines the agent as a senior ESG sustainability report author for Novartis. It instructs the agent to: (1) retrieve relevant source chunks for the target section using the knowledge base retrieval tool; (2) retrieve the prior-year section for continuity context; (3) retrieve applicable ESRS/GRI/TCFD/ISSB disclosure requirements for the section; (4) generate a structured narrative draft that covers all required data points, grounded exclusively in retrieved evidence; (5) output structured JSON with section_text (markdown), citations array (chunk_id, document_name, excerpt, page_ref), style_flags, and framework_coverage. The prompt embeds 2-3 few-shot examples from prior approved RNFM sections. Model: global.anthropic.claude-sonnet-4-6.

**Agent Tools**: (1) retrieve_knowledge_base_chunks(query, section_id, metadata_filters) — calls Bedrock Knowledge Base RetrieveAndGenerate API, returns top-K chunks with source metadata; (2) get_prior_year_section(section_id, year) — fetches prior RNFM section text from DynamoDB document store; (3) get_section_disclosure_requirements(section_id, frameworks) — fetches applicable DR definitions from the compliance requirements DynamoDB table; (4) get_style_guide_rules(section_type) — retrieves applicable Novartis Style Guide rules for the section type; (5) validate_citation_coverage(section_text, citations) — checks that every factual claim in generated text has a corresponding citation entry.

**Agent Data Sources**: Bedrock Knowledge Base (policies, standards, prior reports, peer reports, style guide); DynamoDB compliance-requirements table; DynamoDB document store (prior year sections).

ECS Fargate worker polls SQS draft-generation-queue and invokes the AgentCore endpoint. Uses existing VPC's private subnets.
- **Compliance Gap Analysis Agent** (ml_model): AWS Strands agent hosted on Amazon Bedrock AgentCore. Responsible for mapping RNFM draft sections to ESRS/GRI/TCFD/ISSB disclosure requirements and identifying gaps.

**Agent Prompt**: System prompt defines the agent as an ESG compliance analyst specializing in CSRD/ESRS, GRI, TCFD, and ISSB frameworks. It instructs the agent to: (1) load the full list of applicable disclosure requirements for the target framework(s); (2) for each DR, retrieve the section text being assessed; (3) perform semantic coverage classification (covered / partially_covered / missing) with confidence score; (4) extract evidence excerpts from the section text that support the classification; (5) for missing/partial DRs, generate suggested fill text grounded in knowledge base retrieval; (6) output a structured compliance mapping array. Uses few-shot examples (5-10 labeled DR-section pairs per framework). Model: global.anthropic.claude-sonnet-4-6 for standard scans; global.anthropic.claude-opus-4-6 for full-document deep compliance review.

**Agent Tools**: (1) get_disclosure_requirements(framework, dr_ids) — fetches DR definitions, data points, and applicability conditions from DynamoDB compliance-requirements table; (2) get_section_text(report_id, section_id) — retrieves current draft section text from DynamoDB document store; (3) retrieve_fill_suggestion_chunks(dr_id, dr_definition) — calls Bedrock Knowledge Base to retrieve source chunks relevant to a missing DR for generating suggested fill text; (4) classify_dr_coverage(section_text, dr_definition, dr_data_points, framework) — LLM sub-call returning {status, confidence, evidence_excerpts}; (5) write_compliance_mapping(report_id, section_id, dr_id, mapping_result) — persists classification result to DynamoDB compliance-mappings table; (6) check_mandatory_dr_blockers(report_id) — returns list of mandatory ESRS DRs still in 'missing' status that would block Legal sign-off.

**Agent Data Sources**: DynamoDB compliance-requirements table (all ESRS 1, ESRS 2, E1-E5, S1-S4, G1 DRs; GRI disclosures; TCFD recommendations; ISSB IFRS S1/S2); DynamoDB document store; Bedrock Knowledge Base (for fill suggestion retrieval).

ECS Fargate worker polls SQS compliance-scan-queue and invokes the AgentCore endpoint. Uses existing VPC's private subnets.
- **Peer Benchmarking Agent** (ml_model): AWS Strands agent hosted on Amazon Bedrock AgentCore. Provides interactive Q&A against indexed peer company sustainability reports and Novartis's own prior RNFMs. Enables ESG Reporting Leads to ask questions like "How do FTSE 100 pharma peers disclose ESRS E4 biodiversity metrics?" and receive grounded, cited answers.

**Agent Prompt**: System prompt defines the agent as an ESG research analyst with access to a library of peer sustainability reports. It instructs the agent to: (1) parse the user's question to identify the topic, framework, and peer scope; (2) retrieve relevant chunks from peer report documents in the knowledge base (filtered by document_type=peer_report); (3) synthesize a comparative answer with explicit citations to source documents; (4) highlight disclosure approaches, metrics used, and any notable practices; (5) optionally compare to Novartis's current draft section if provided. Model: global.anthropic.claude-sonnet-4-6.

**Agent Tools**: (1) retrieve_peer_report_chunks(query, peer_filters, framework_filter) — calls Bedrock Knowledge Base with metadata filter document_type=peer_report; returns top-K chunks with company name, report year, section; (2) retrieve_novartis_section(section_id, report_year) — fetches Novartis's own section for comparison; (3) list_indexed_peer_reports() — returns metadata of all peer reports in the knowledge base; (4) format_benchmarking_response(answer, citations) — structures the response with inline citations for display in the chat UI.

**Agent Data Sources**: Bedrock Knowledge Base (peer company sustainability reports, filtered by metadata); DynamoDB document store (Novartis prior RNFM sections).

Invoked synchronously via API Service (REST call to AgentCore endpoint). Uses existing VPC's private subnets.
- **Document Ingestion Pipeline** (data_pipeline): AWS Step Functions state machine orchestrating the multi-step document ingestion workflow. Triggered by S3 ObjectCreated events on the raw-documents bucket via EventBridge. Steps: (1) Detect document type (PDF/DOCX/PPT); (2) Extract text — Lambda using Amazon Textract for PDFs with complex layouts, python-docx for DOCX; (3) Tag metadata (document_type, framework, year, source_org) — extracted from filename conventions and user-supplied metadata at upload; (4) Chunk text with configurable size (512 tokens) and overlap (10%); (5) Generate embeddings via Amazon Bedrock (amazon.titan-embed-text-v2:0); (6) Upsert vectors to OpenSearch Serverless via Bedrock Knowledge Base sync API; (7) Write metadata record to DynamoDB kb-document-registry; (8) Update ingestion status to 'complete' or 'failed'. Failed steps trigger SNS admin alert and set document status to 'failed' for retry. Malformed/unreadable documents are quarantined in a separate S3 prefix. Lambda functions use existing VPC's private subnets for OpenSearch access.
- **DOCX Export Pipeline** (data_pipeline): Lambda function (triggered from SQS export-queue) that generates a fully formatted MDD-compliant DOCX file from the structured document model stored in DynamoDB. Steps: (1) Deserialize the structured document model (sections, paragraphs, tables, citations) from DynamoDB; (2) Map each content element to the corresponding nov_* Word paragraph style from the MDD base template (stored in S3); (3) Apply header/footer, page numbering, and section break rules per MDD specification; (4) Embed citation footnotes/endnotes with source document references; (5) Inject table placeholders per MDD specification; (6) Generate DOCX using python-docx against the MDD base template; (7) Validate output against MDD style checklist (paragraph style coverage, required sections present); (8) Upload generated DOCX to S3 report-exports bucket with versioning; (9) Return pre-signed S3 URL to API Service for user download. Lambda configured with 3GB memory and 15-minute timeout to handle full RNFM (~150,000 words). Uses existing VPC's private subnets for DynamoDB access. Missing detail: Style Guide enforcement at export time is mentioned but the specific MDD rule set and validation logic are not described. There is no mention of a DLQ for the export-queue Lambda, retry policy, or output S3 bucket lifecycle policy for generated DOCX files. Accessibility compliance (e.g., tagged PDF/DOCX) is not addressed.
- **Observability Stack** (infrastructure): CloudWatch dashboards, alarms, and X-Ray distributed tracing for all system components. Monitors: (1) API Service — ALB request latency (p50/p99), error rate (4xx/5xx), ECS task CPU/memory; (2) AI Agent jobs — SQS queue depth, job completion time, DLQ message count; (3) Compliance scan accuracy — CloudWatch custom metrics for DR coverage counts per report; (4) Document ingestion — Step Functions execution success/failure rate; (5) Audit trail — DynamoDB write throughput, S3 archive delivery success. Alarms: DLQ message count > 0 (PagerDuty/SNS); API p99 latency > 5s; ECS task OOM; Step Functions execution failure. X-Ray tracing enabled on Lambda, ECS, and API Gateway. Operational runbook stored in S3 and linked from CloudWatch dashboard.

### AWS Services: Amazon CloudFront, Amazon S3, Amazon Cognito, AWS Amplify Hosting, Amazon ECS (Fargate), AWS Application Load Balancer, Amazon SQS, Amazon DynamoDB, Amazon Bedrock (Knowledge Bases), Amazon Bedrock (AgentCore), Amazon Bedrock (claude-sonnet-4-6), Amazon Bedrock (claude-opus-4-6), Amazon Bedrock (claude-haiku-4-5), Amazon Bedrock (amazon.titan-embed-text-v2:0), Amazon OpenSearch Serverless, AWS Step Functions, AWS Lambda, Amazon Textract, Amazon EventBridge, Amazon SNS, AWS KMS, AWS Secrets Manager, Amazon CloudWatch, AWS X-Ray, AWS IAM

## Knowledge Base

### Problem & Vision
**problemStatement:** Novartis produces a mandatory regulatory annual sustainability report ('Report on Nonfinancial Matters' / RNFM) through a highly manual, cross-functional process. The process involves repeated drafting and rework cycles across many contributors, significant inconsistency risk between sections author
**currentPainPoints:** 1. Manual drafting: Contributors across ESG, Legal, Finance, HR, and Operations each draft sections independently with no shared tooling, leading to style and terminology inconsistencies.
2. Rework cycles: Multiple rounds of review and revision consume significant time from senior subject-matter exp
**desiredOutcome:** An AI-enabled, human-governed authoring studio that: (1) auto-generates a structured first-draft RNFM from an indexed knowledge base of source documents; (2) enforces style guide and MDD formatting rules; (3) maps every section to ESRS/ISSB/GRI/TCFD disclosure requirements and surfaces gaps with AI 
**successVision:** The Novartis sustainability reporting team can produce a fully compliant, audit-ready RNFM draft in a fraction of the current time, with every claim traceable to a source document, all reviewer comments and approvals captured in a single system, and the final output exportable as a properly formatte
**scopeBoundaries:** In scope: RNFM annual report generation, ESRS/GRI/TCFD/ISSB compliance mapping, Novartis Style Guide enforcement, MDD-compatible Word export, review/approval workflow, audit trail, compliance index generation, peer benchmarking Q&A, AWS-hosted standalone web application. Out of scope (likely): Real-

### Current Process
**actors:** SI&S Corporate Reporting Team (primary), ESG FRA (Financial Reporting & Analysis), and functional teams contributing to the Sustainability statement across the organization
**name:** Current Workflow (from intake)
**description:** Novartis currently produces the annual sustainability report entirely manually: cross-functional teams coordinate via email and shared files, content is drafted and reworked through multiple cycles, disclosure mapping to ESRS/ISSB/GRI/TCFD does not formally exist, peer benchmarking is done manually 
**stepNumber:** 1

### Capabilities
**name:** Knowledge Base Ingestion & Indexing
**expectedBehavior:** Users can upload documents via a management UI or S3 drop zone. The system automatically parses PDFs and DOCX files, chunks them with configurable overlap, generates embeddings via Amazon Titan Embeddings or Cohere Embed on Bedrock, and stores them in the vector index. Documents are tagged with meta
**description:** Ingest, parse, chunk, and vector-embed all source documents (policies, standards, prior reports, peer reports, style guide) into a searchable knowledge base on AWS. Supports semantic retrieval for AI draft generation and Q&A. Powered by Amazon Bedrock Knowledge Bases with S3 as the document store an
**currentlyManual:** True
**priority:** must_have

**name:** ESRS/GRI/TCFD/ISSB Compliance Mapping & Gap Analysis
**expectedBehavior:** The system maintains a structured database of all ESRS disclosure requirements (DRs), GRI disclosures, TCFD recommendations, and ISSB requirements. After draft generation or editing, the system runs a mapping pass that tags each section with the frameworks it addresses. A gap analysis view shows whi
**description:** Automatically maps each RNFM report section and paragraph to the corresponding disclosure requirements across ESRS, GRI, TCFD, and ISSB frameworks. Performs gap analysis to identify mandatory disclosures that are missing or insufficiently addressed, and generates AI-suggested text to fill gaps. Prod
**currentlyManual:** True
**priority:** must_have

**expectedBehavior:** In the document editor, claims generated by AI display a citation marker (e.g., a superscript number or highlighted text). Clicking the marker opens a side panel showing: source document name, document type, relevant excerpt, page/section reference, and the date the document was ingested. If a claim
**name:** Claim Traceability & Source Evidence Panel
**description:** Every AI-generated claim, statistic, or narrative assertion in the report draft is linked to the specific source document chunk(s) from which it was derived. An evidence panel in the editor allows users to inspect the source excerpt, document name, page number, and ingestion date for any claim.
**priority:** must_have

**expectedBehavior:** Reviewers open a report draft in the editor and see the full document with section structure. They can edit text directly, with changes tracked and attributed to their user identity. Inline comments can be added to specific text ranges. Section owners can lock their sections once approved to prevent
**name:** Word-Like Document Editor with Track Changes
**description:** A browser-based document editor providing a Word-like authoring experience for reviewing and editing AI-generated RNFM drafts. Supports track changes (accept/reject), inline comments, section-level locking to prevent concurrent edits during review, and real-time or near-real-time collaboration.
**priority:** must_have

**expectedBehavior:** Users navigate to a 'Peer Benchmarking' module and type a natural language question (e.g., 'How do pharma peers disclose their Scope 3 Category 11 emissions?'). The system retrieves relevant passages from peer reports using RAG, synthesizes a comparative answer, and displays source citations from ea
**name:** Peer Benchmarking Interactive Q&A
**description:** An interactive Q&A interface that allows users to ask natural language questions against the indexed corpus of peer company sustainability reports. Enables benchmarking of Novartis disclosures against industry peers on specific topics (e.g., Scope 3 methodology, biodiversity disclosures, social KPIs
**currentlyManual:** True
**priority:** nice_to_have

### People & Roles
**painPoints:** Reviewing a large document with no visibility into which claims are AI-generated vs. human-written; no easy way to verify that all mandatory ESRS requirements are covered; difficulty tracking changes between draft versions; no formal sign-off mechanism in the current process
**primaryGoal:** Confirm that the report meets all mandatory ESRS disclosure requirements and contains no legally risky unsubstantiated claims, and formally record that sign-off
**responsibilities:** Review compliance gap analysis output; verify ESRS mandatory disclosure coverage; flag legally risky or unsubstantiated claims; review audit trail for completeness; provide formal legal sign-off
**interactionFrequency:** Intensive for 2-4 weeks during the legal review stage; minimal outside the cycle
**permissions:** Read and comment access to all sections; can add legal review comments; formal approval/rejection action for the legal review workflow stage; access to audit trail and compliance gap analysis
**roleName:** Legal / Compliance Reviewer
**description:** A Legal or Compliance professional who reviews the near-final RNFM draft to assess regulatory compliance, identify legal risk in narrative claims, verify that mandatory ESRS disclosures are adequately addressed, and provide formal sign-off before executive approval.
**dataTheyOwn:** Legal review comments and sign-off records; compliance risk flags

**painPoints:** Receiving a blank template with no starting content; manually formatting text to match style guide; not knowing which ESRS requirements apply to their section; difficulty tracking which comments have been addressed; losing context when switching between email threads and the document
**primaryGoal:** Review and approve their assigned sections quickly, confident that the AI draft is accurate and all required disclosures are addressed
**responsibilities:** Review AI-generated draft for factual accuracy; edit narrative to reflect current-year data and developments; verify source citations; respond to reviewer comments; approve section for next workflow stage
**interactionFrequency:** Frequent during their review window (daily for 2-4 weeks per reporting cycle); minimal outside the cycle
**permissions:** Edit access to assigned sections only; can add comments, accept/reject track changes, upload supporting documents, approve their section; read-only access to other sections
**roleName:** Section Content Owner (SME)
**description:** A subject matter expert from a functional team (e.g., Environmental team for climate/energy sections, HR for social/people sections, Legal/Compliance for governance sections, Finance for GHG accounting) who is responsible for reviewing, editing, and approving the AI-generated draft for their assigne
**dataTheyOwn:** Draft content for their assigned RNFM sections; supporting data and evidence documents for their topic area

**painPoints:** Chasing contributors for section drafts; manually reconciling inconsistent styles and terminology across sections; tracking which ESRS requirements are covered; managing review deadlines across email and shared drives; no single view of overall report completion status
**primaryGoal:** Get a complete, compliant, audit-ready RNFM draft to the Legal review stage as quickly as possible, with confidence that all mandatory ESRS disclosures are covered
**responsibilities:** Configure report structure and section assignments; initiate AI draft generation; review compliance gap analysis; coordinate section reviews; manage approval workflow; export final MDD-compliant Word document; maintain knowledge base (upload new source documents)
**interactionFrequency:** Daily during the reporting cycle (typically 3-6 months per year); weekly or less outside the cycle
**permissions:** Full access: initiate draft generation, configure workflow, assign sections to contributors, view all sections, approve/reject at any stage, export final report and audit trail, manage knowledge base documents
**roleName:** ESG Reporting Lead
**description:** The senior ESG or Sustainability professional who owns the RNFM production process end-to-end. Responsible for coordinating all contributors, ensuring compliance with reporting standards, managing the review timeline, and delivering the final report.
**dataTheyOwn:** Report project configuration (section assignments, workflow stages, deadlines); final approved report versions; compliance index outputs; audit trail exports

**roleName:** Target Persona
**description:** SI&S Corporate Reporting Team (primary), ESG FRA (Financial Reporting & Analysis), and functional teams contributing to the Sustainability statement across the organization

### Examples & Scenarios
**edgeCases:** 1. Peer reports indexed are from 2024 (pre-ESRS mandatory period) and may not yet use ESRS E4 terminology — the system should note this limitation in the response. 2. One peer's biodiversity disclosure is in a separate standalone report not yet indexed — the system should indicate when its knowledge
**expectedOutcome:** The ESG Lead has a synthesized view of how 3-5 pharma peers are approaching ESRS E4 biodiversity disclosures, with source citations, enabling them to make an informed decision about Novartis's disclosure approach before the AI draft is generated.
**name:** Peer Benchmarking: ESRS E4 Biodiversity Disclosure Approaches
**description:** An ESG Reporting Lead uses the Peer Benchmarking Q&A module to research how pharmaceutical peers are disclosing their biodiversity strategies under ESRS E4 (Biodiversity and Ecosystems), a new and complex disclosure area, before drafting Novartis's own section.
**syntheticDataSet:** [{'report_year': Decimal('2024'), 'peer_company': 'Roche', 'excerpt': 'Roche has identified 12 priority sites with high biodiversity sensitivity and aligned its disclosure with the TNFD LEAP approach...', 'page_ref': 'p.47', 'relevance_score': Decimal('0.91'), 'query': 'How are pharma peers disclosi
**steps:** 1. ESG Lead navigates to the 'Peer Benchmarking' module.
2. Lead types: 'How are pharma peers disclosing their biodiversity strategy and targets under ESRS E4?'
3. System retrieves relevant passages from indexed peer reports (e.g., Roche 2024 ESG Report, AstraZeneca 2024 Sustainability Report, Pfize

**edgeCases:** 1. The AI suggestion for fill text references a source document that is outdated (prior year data) — the SME must update with current figures. 2. The ESRS requirement is marked as 'subject to phase-in' for the first reporting year — the system should flag this and allow the reviewer to mark it as 'p
**expectedOutcome:** The ESRS E1-6 Scope 3 category breakdown is added to the Climate section, the compliance status updates to 'covered,' and the change is recorded in the audit trail with the Legal Reviewer's comment and the SME's response.
**name:** ESRS E1-6 Scope 3 Gap Identified and Resolved
**description:** A Legal Reviewer uses the Compliance Gap Analysis screen to identify that the Climate section covers total Scope 3 emissions but does not break them down by category as required by ESRS E1-6 (Gross Scopes 1, 2, 3 and total GHG emissions). The reviewer navigates to the section, reviews the AI-suggest
**syntheticDataSet:** [{'status_after': 'covered', 'framework': 'ESRS', 'audit_timestamp': '2026-02-14T09:32:00Z', 'confidence_after': Decimal('0.94'), 'reviewer_comment': 'ESRS E1-6 requires Scope 3 breakdown by category. Please add the category table.', 'dr_id': 'ESRS-E1-6', 'section': 'Climate Change — GHG Emissions',
**steps:** 1. Legal Reviewer opens the Compliance Gap Analysis screen and filters to 'ESRS' framework, status 'missing' and 'partially covered'.
2. Reviewer sees ESRS E1-6 (Gross Scopes 1, 2, 3 and total GHG emissions) flagged as 'partially covered' with confidence 0.72.
3. Reviewer clicks the row to see the e

### Success Verification
**name:** ESRS Mandatory Disclosure Coverage at Sign-Off
**description:** Measures whether all mandatory ESRS disclosure requirements applicable to Novartis are addressed in the final RNFM before the Legal sign-off stage. This is the primary regulatory compliance success criterion.
**verificationMethod:** System-generated compliance index at the point of Legal sign-off, showing all DRs with final coverage status. External auditor review of the compliance index as part of RNFM assurance process.
**demoValidationCriteria:** Demo must show the Compliance Gap Analysis screen with a visible count of 'missing' ESRS DRs, and demonstrate that clicking an AI suggestion and inserting it into the draft updates the status from 'missing' to 'covered.'
**metric:** Percentage of mandatory ESRS disclosure requirements (applicable to Novartis based on materiality assessment) with status 'covered' at the point of Legal sign-off
**target:** 100% of applicable mandatory ESRS DRs have status 'covered' before Legal sign-off is permitted. The system should block the Legal sign-off action if any mandatory DR is 'missing' (with an override option requiring a documented justification).

**name:** Time-to-First-Complete-Draft Reduction
**description:** Measures the reduction in elapsed calendar time from 'reporting cycle start' to 'first complete draft ready for SME review,' comparing the AI-assisted process to the current manual baseline.
**verificationMethod:** Measure elapsed time in the first live reporting cycle using the system. Compare to the customer-provided baseline from the prior year's manual process.
**demoValidationCriteria:** Demo must show: (1) a 'Generate Draft' button that triggers section generation with a visible progress indicator; (2) a populated draft section with at least 3 citation markers; (3) a compliance gap analysis panel showing at least one 'covered,' one 'partially covered,' and one 'missing' item — all 
**metric:** Calendar days from cycle start to first complete draft ready for SME review
**target:** Target to be confirmed with customer based on current baseline. Typical manual sustainability report drafting cycles run 8-16 weeks; a reasonable target for AI-assisted first draft generation is <2 weeks. Customer must provide current baseline.

**name:** Claim Traceability Coverage
**description:** Measures the completeness of source citation coverage for AI-generated claims in the final RNFM. This is the primary metric for audit readiness and the core differentiator from the current manual process.
**verificationMethod:** Automated: system counts citation markers vs. total AI-generated text segments at export time and reports coverage percentage. Manual spot-check: Legal Reviewer verifies a random sample of 20 citations per reporting cycle.
**demoValidationCriteria:** Demo must show: (1) a citation marker on at least one AI-generated sentence; (2) clicking the marker opens a side panel with source document name, excerpt, and page reference; (3) the traceability matrix export contains at least 5 rows mapping claims to sources.
**metric:** Percentage of AI-generated claims in the final report that have at least one traceable source citation
**target:** 100% of AI-generated claims have at least one source citation at the time of export. Human-edited claims that replace AI text are flagged as 'human-authored' and exempt from this metric.

**name:** Success Criteria (from intake)
**description:** Compliance cost avoidance of USD 200,000–400,000 over 2 years; annual operational savings of ~USD 100,000 post full implementation; enhanced reporting quality (consistency, scalability, assurance readiness); reduced rework cycles; automated approval workflow; gap analysis readiness for ESRS 2027 com
**metric:** ≥80% usable first-draft quality (≥80% of required disclosure datapoints accurately addressed, minimal rework needed); gap analysis precision ≥85% (low false-positive rate); style guide compliance ≥95%; full document generation in <30 minutes; 0% hallucination for factual claims; MDD upload succeeds 

### Information Landscape
**accessMethod:** Internal document repository; likely maintained by Corporate Communications or Publications team
**name:** Novartis Style Guide & MDD (Master Document Design)
**format:** PDF, DOCX (Word template with embedded styles)
**qualityNotes:** Must be treated as a hard constraint for the Word export pipeline. The nov_* paragraph style names must be mapped to report section types (heading levels, body text, callout boxes, table captions, footnotes). Customer must provide the current MDD template file for ingestion.
**description:** Novartis corporate writing style guide and the Master Document Design specification that defines Word paragraph styles (nov_* style names), heading hierarchies, table formats, caption conventions, and other formatting rules. The MDD is the authoritative template for all formal Novartis publications 
**type:** document
**updateFrequency:** Periodic updates; typically versioned annually or with major brand refreshes

**accessMethod:** Publicly available PDF downloads from EFRAG website (efrag.org) and EU Official Journal; machine-readable XBRL taxonomy also published by EFRAG
**name:** ESRS (European Sustainability Reporting Standards) — EFRAG Published Standards
**format:** PDF (human-readable standards), XBRL taxonomy (machine-readable data points)
**qualityNotes:** Authoritative source — must be treated as ground truth for compliance mapping. The XBRL taxonomy provides a structured list of ~1,100+ data points that can be used to build a compliance checklist. Implementation guidance documents clarify ambiguous requirements and should also be indexed.
**description:** The full set of European Sustainability Reporting Standards published by EFRAG under the EU Corporate Sustainability Reporting Directive (CSRD). Includes 12 topical standards (ESRS E1–E5 for environment, ESRS S1–S4 for social, ESRS G1 for governance) plus 2 cross-cutting standards (ESRS 1 General Re
**type:** document
**updateFrequency:** Standards are periodically updated; sector-specific ESRS expected 2026–2027; EFRAG issues implementation guidance and Q&A documents on a rolling basis

**accessMethod:** Internal document repository or SharePoint/file share; publicly available versions on novartis.com/investors
**name:** Prior RNFM Reports (Novartis Annual Sustainability Reports)
**format:** PDF, Word (DOCX)
**qualityNotes:** High quality as authoritative published output, but may contain outdated compliance mappings as standards evolve. The most recent 2-3 years should be prioritized for style and structure; older reports useful for trend data. Customer must confirm which internal versions (pre-publication drafts) are a
**description:** Previous years' published 'Report on Nonfinancial Matters' documents. These serve as the primary style and structure reference for AI-generated first drafts, providing section templates, approved narrative patterns, and historical data points. Indexing multiple years enables trend language generatio
**type:** document
**updateFrequency:** Annual

**accessMethod:** TCFD: fsb-tcfd.org (archived); ISSB/IFRS S1/S2: ifrs.org/issued-standards/ifrs-sustainability-disclosure-standards/
**name:** TCFD Recommendations & ISSB Standards (IFRS S1/S2)
**format:** PDF
**qualityNotes:** IFRS S1/S2 are now the authoritative successor to TCFD. The ISSB–ESRS interoperability mapping published by EFRAG and IFRS Foundation is essential for building the compliance index without double-counting.
**description:** The Task Force on Climate-related Financial Disclosures (TCFD) framework (now superseded by ISSB for many jurisdictions) and the ISSB's IFRS S1 (General Requirements for Disclosure of Sustainability-related Financial Information) and IFRS S2 (Climate-related Disclosures) standards. These are require
**type:** document
**updateFrequency:** ISSB standards finalized June 2023; TCFD framework archived as ISSB assumed monitoring role; updates expected as ISSB issues additional standards

**accessMethod:** Internal SharePoint, document management system, or file share — access method to be confirmed with customer
**name:** Internal ESG Policies and Standards Documents
**format:** PDF, DOCX, PPT
**qualityNotes:** Critical for claim traceability. Quality and completeness will vary; some policies may be outdated or in draft. Customer must define which document corpus is authoritative and confirm access method for ingestion pipeline.
**description:** Novartis internal policy documents, environmental standards, social responsibility policies, governance frameworks, and operational procedures that provide the factual and policy basis for RNFM narrative claims. Examples include: Environmental Management Policy, Human Rights Policy, Code of Ethics, 
**type:** document
**updateFrequency:** Varies by policy; typically annual review cycles with ad-hoc updates

### User Journeys
**journeyName:** SME Section Review, Edit & Approval
**isCriticalPath:** True
**role:** Section Content Owner (SME)
**successOutcome:** The SME's assigned sections are reviewed, edited for accuracy, and submitted to the next workflow stage, with all edits tracked, citations verified, and ESRS gaps addressed.
**frequencyOfUse:** Multiple times per week during the SME review window (2-4 weeks per reporting cycle)
**triggerEvent:** SME receives notification that their RNFM sections have an AI-generated draft ready for review
**steps:** 1. SME receives an email/in-app notification that their assigned RNFM sections are ready for review.
2. SME logs in and navigates to their assigned sections via the 'My Tasks' queue.
3. SME opens a section in the document editor and reads the AI-generated draft.
4. SME clicks a citation marker to ve

**journeyName:** Legal Review and Formal Sign-Off
**isCriticalPath:** True
**role:** Legal / Compliance Reviewer
**successOutcome:** Legal Reviewer has formally signed off on the RNFM draft, with all mandatory ESRS disclosures confirmed as covered, legal risk comments addressed, and the approval recorded in the immutable audit trail.
**frequencyOfUse:** Daily during the 2-4 week legal review window, once per annual cycle
**triggerEvent:** RNFM draft reaches the Legal Review workflow stage after all SME sections are approved
**steps:** 1. Legal Reviewer receives notification that the RNFM draft has reached the Legal Review workflow stage.
2. Reviewer opens the Compliance Dashboard, which shows the full ESRS gap analysis: a table of all mandatory ESRS disclosure requirements with coverage status (covered / partially covered / missi

**journeyName:** Initiate AI Draft Generation for New RNFM Cycle
**isCriticalPath:** True
**role:** ESG Reporting Lead
**successOutcome:** A complete AI-generated first draft of the RNFM is available in the editor, with all sections populated, source citations visible, and the compliance gap analysis showing which ESRS disclosures need attention. All SMEs have been notified to begin their reviews.
**frequencyOfUse:** Once per annual reporting cycle (typically Q4 of the reporting year or Q1 of the following year)
**triggerEvent:** The annual RNFM reporting cycle begins (typically triggered by the close of the fiscal year or a regulatory calendar deadline)
**steps:** 1. ESG Lead logs into the RNFM Studio web application and creates a new Report Project for the current reporting year (e.g., '2025 RNFM').
2. Lead configures the report structure by selecting the 2025 RNFM section template, which pre-populates the section hierarchy.
3. Lead reviews the knowledge bas

## Deployment

- **Guide:** DEPLOYMENT.md
- **Infrastructure:** Terraform (`infrastructure/`); environment values in `terraform.tfvars` (see `terraform.tfvars.example`)
- **Security scan record:** docs/SECURITY-SCAN.md

## Conventions

- API routes: `/api/{resource}` (FastAPI router prefix)
- Auth: `Depends(get_current_user)` on all protected routes
- CSS: v2 design tokens (Inter font, CSS variables) — brand colours are the single
  source of truth in `frontend/src/data/brand.ts` (2026 Novartis orange), mirrored
  by the `--accent*` CSS vars and read by the PDF/DOCX exporters.
- Config: `.env.production` with `VITE_*` prefix for frontend env vars

## Datapoint source of truth (21 Aug 2026 requirement)

- Novartis maintains the disclosure-checklist Excel (DMA-filtered for relevance).
  It is uploaded (CSV) on the Upload page, parsed client-side, and persisted +
  **versioned** through the backend resource `datapoint-checklist`. The system
  ingests it as the authoritative datapoint list and cross-references the
  published standards for interpretation — it does NOT decide relevance itself.
- Ingestion is a deliberate **manual versioned upload**; a live SharePoint/URL
  sync is a documented **roadmap** seam, deferred to avoid propagating spreadsheet
  errors straight into the tool.
- Backend resource allowlist (`backend/store.py` `REPORT_RESOURCES`) also carries
  `section-progress` and `audit-releases` (role/workflow overhaul).