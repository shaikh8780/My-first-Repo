# ESG Reporting: V1 Build Gap Analysis

**Basis:** `ECN ESG Reporting AI Requirements Finalized_27102026.docx`, signed off by Novartis on 29 Oct 2026, every requirement marked V1.  
**Code:** the prototype code in this repository (30 Oct 2026).  
**Method:** read-only code inspection on 27 Oct 2026, three parallel passes, with the largest claims re-checked by hand (FR-038, FR-047, FR-004). Nothing was run against a deployed stack. Entries were updated on 30 Oct for the security fixes and the handover changes, and on 3 Nov for the decisions agreed with Novartis (`DECISIONS.md`); both are listed below.

## Changes since the 27 Oct analysis

- **Requirements:** the signed-off document differs from the 26 Oct version in one requirement. FR-062 now says all roles can open evidence files wherever the evidence is shown, not only in the Auditor view. Section 3.16 was cleaned up to list only future items; this changes no scope. The V1 list is the same 52 requirements (51 M, 1 C).
- **Code:** the handover code includes the security fixes (dependency upgrades, narrowed IAM) and a deployment cleanup: account, domain, network, certificate and Cognito settings are now Terraform variables, the backend admin list is set at deployment (`admin_aliases`, empty by default), and `DEPLOYMENT.md` describes the steps. No application features changed, so no status or effort changed.
- **Counts:** status counts unchanged. FR-062 stays Partial / M, with a slightly wider gap (see its entry).
- **3 Nov, decisions agreed with Novartis** (`DECISIONS.md`): FR-019 places register datapoints by an agreed rule instead of a section column; FR-059 takes materiality from the register's Inclusion decision; FR-018 keeps the FY2025 structure until the FY27 blueprint arrives, so it waits; FR-066 gains one small task, the UPC 2026 template. The register uses the amended ESRS numbering, which differs from the library's (FR-019, FR-059).

## Summary

52 requirements are V1 (51 M, 1 C). **29 need no new work** and **23 need work**; FR-018 waits for the FY27 blueprint, so **22 can start now**.

| Status | Count | Meaning |
|---|---|---|
| Built | 24 | Acceptance criteria met by today's code |
| Stays future | 5 | The part still missing is written as a future enhancement in the AC; the rest is met |
| Partial | 22 | Some of it exists; V1 work needed |
| Not built | 1 | FR-019, the register driving the mapping |

Effort for the 23: **3 L** (more than 3 days; one is FR-018, which waits for the blueprint), **10 M** (1–3 days), **10 S** (under a day). Agreed after sign-off: the UPC 2026 template for the UPC report (FR-066, S).

## Fix first

These either break the core workflow or are a risk once Novartis users are in the app:

1. **FR-067 model.** The configured model (`anthropic.claude-3-haiku-20240307-v1:0`) is retired. Every AI feature depends on this.
2. **FR-038 accept does not apply AI text.** `handleAcceptChange` only flips the status; AI suggestions are never written into the section, so accepted AI text does not reach the clean view or the export. Verified in `EditorView.tsx`.
3. **FR-047 Reset Demo.** Shown to every role; `POST /api/reports/{id}/reset` has no admin check and deletes all report data including version history. Verified in `backend/routers/api.py`.
4. **FR-040 comments block sign-off.** Plain comments and sent-back requests cannot be closed, and any open one stops a subsection being marked updated, which blocks owner sign-off.
5. **FR-055 silent AI fallbacks.** On failure the app substitutes canned or placeholder text in five places instead of an error.
6. **FR-054 identity.** Terraform has only an app client in an AWS-owned pool; a user pool, certificate and domain are needed in the Novartis account.

## V1 work list

| Req | Effort | Work |
|---|---|---|
| FR-013 | L | Upload route plus PDF/Word text extraction with page refs, chunking, durable storage, retriever reads uploaded chunks |
| FR-018 | L | Waits for the FY27 blueprint; the FY2025 structure stays until then (agreed 3 Nov). Then make the blueprint the structure and re-key seed data tied to today's section ids |
| FR-019 | L | Build subsection mappings from the uploaded register with the agreed rule (`DECISIONS.md` D1); no section column |
| FR-006 | M | Send uploaded files to a backend route and index them; relabel both upload pages; Excel via FR-015 |
| FR-015 | M | Accept .xlsx and read the register as delivered (header on row 3, its own column names); fix multi-line CSV cells |
| FR-030 | M | One Admin and one Editor user list set at deployment, shared by frontend and backend |
| FR-038 | M | Accept must put AI text into the section; Reject must undo insertions and deletions; Edit & accept must not overwrite |
| FR-043 | M | Apply the MDD paragraph styles in the Word export (defined but not applied); confirm brand colours |
| FR-047 | M | Admin-gate or remove Reset Demo (wipes all data, open to all); move versions out of a single 400 KB DynamoDB item |
| FR-054 | M | Cognito user pool with named build users, certificate/domain in the Novartis account; build users on both admin lists |
| FR-055 | M | Replace all silent AI fallbacks with error states (frontend and backend) and update the tests that assert them |
| FR-059 | M | Gap analysis reads the latest uploaded checklist; the Inclusion decision sets Material / Not material (D2); no matching to coverage by DR code alone |
| FR-062 | M | Evidence file storage (S3, presigned URLs), file picker, Open action for all roles wherever evidence is shown (editor Evidence card, AI Assistant evidence list, Auditor view) |
| FR-023 | S | Send earlier chat turns to the model (Should item) |
| FR-031 | S | Fix the L2-view Edit button so approved text cannot be edited without reset |
| FR-032 | S | Show the sources the AI draft already retrieves (Should item) |
| FR-039 | S | Show pending AI suggestions inline with AI marker and author |
| FR-040 | S | Let plain comments and sent-back requests be closed; today they block "updated" and owner sign-off |
| FR-042 | S | Offer L2 sign-off only to assigned owners (Editor seat is offered it today) |
| FR-057 | S | Run the suites on the migrated code; point the smoke test at the Novartis instance with a sign-in check |
| FR-058 | S | Change the banner that claims coverage is generated live |
| FR-067 | S | Current model ID, inference-profile IAM, check temperature/maxTokens, parse the first text block |
| FR-068 | S | Relabel the roll-forward as rule-based, not AI, and update the e2e selectors |
| FR-066 | S | Agreed after sign-off: seed the UPC report from the UPC 2026 template (`DECISIONS.md` D4) |

## All V1 requirements

| Req | Section | Requirement | Status | Effort |
|---|---|---|---|---|
| FR-001 | Report Management | Create a report for a reporting cycle. | Stays future | - |
| FR-002 | Report Management | Dashboard of reports and each user's open tasks. | Built | - |
| FR-003 | Report Management | Lifecycle stages for subsections and the report. | Built | - |
| FR-004 | Report Management | Start a new cycle from the prior approved report (roll-forward). | Built | - |
| FR-005 | Report Management | Report-level audit history. | Stays future | - |
| FR-006 | Source Ingestion | Manual upload of PDF and Word sources; the disclosure checklist (maintained by Novartis in Excel) uploaded as Excel or CSV. | Partial | M |
| FR-013 | Document Parsing | Parse PDF and Word: text and tables with page references. | Partial | L |
| FR-015 | Document Parsing | Parse Excel, citing sheet and cell. | Partial | M |
| FR-016 | External Data Sources | Reporting-framework requirement libraries: ESRS, ISSB, GRI, TCFD, the UK, Australian and Canadian modern-slavery acts, and the Norwegian Transparency Act. | Built | - |
| FR-018 | Template and Rules Handling | Report structure (template). | Partial | L (waits for the blueprint) |
| FR-019 | Template and Rules Handling | Apply framework requirements to each subsection. | Not Built | L |
| FR-020 | Template and Rules Handling | Version and publish structure changes. | Built | - |
| FR-023 | Conversational Assistant | In-editor assistant to draft and revise text. | Partial | S |
| FR-025 | AI Drafting and Generation | Draft section by section, requirement by requirement. | Built | - |
| FR-026 | AI Drafting and Generation | Use RAG grounded in indexed sources. | Stays future | - |
| FR-027 | AI Drafting and Generation | Follow Novartis tone and the Communications Style Guide. | Built | - |
| FR-028 | AI Drafting and Generation | Fit content to the target format. | Stays future | - |
| FR-030 | AI Drafting and Generation | Support user instructions per run. | Partial | M |
| FR-031 | AI Drafting and Generation | AI never changes approved text silently. | Partial | S |
| FR-032 | Attribution and Traceability | Citations shown for drafted content. | Partial | S |
| FR-033 | Attribution and Traceability | Display citations in the review UI. | Built | - |
| FR-036 | Confidence Scoring | Confidence score per disclosure requirement. | Built | - |
| FR-037 | Confidence Scoring | Provide a confidence rationale. | Built | - |
| FR-038 | Human Review and Approval | Accept, edit, reject or regenerate content. | Partial | M |
| FR-039 | Human Review and Approval | Inline editing that stays distinguishable. | Partial | S |
| FR-040 | Human Review and Approval | Comments and change requests. | Partial | S |
| FR-041 | Human Review and Approval | Display overall review progress. | Built | - |
| FR-042 | Human Review and Approval | Approval workflow with six roles. | Partial | S |
| FR-043 | Output Export | Export editable Word. | Partial | M |
| FR-044 | Output Export | Populate the output with the latest reviewed content. | Built | - |
| FR-045 | Output Export | Preserve formatting; exclude guidance text. | Built | - |
| FR-047 | Persistent Memory | Retain approved outputs for future cycles. | Partial | M |
| FR-050 | Administration, Audit, and Monitoring | Admin manages structure and requirement mappings. | Built | - |
| FR-052 | Administration, Audit, and Monitoring | Admin manages model and prompt configuration. | Built | - |
| FR-053 | Administration, Audit, and Monitoring | Operations dashboards and logs. | Built | - |
| FR-054 | Security, Quality, and Guardrails | Enforce approved security and access controls. | Partial | M |
| FR-055 | Security, Quality, and Guardrails | Avoid fabricated claims. | Partial | M |
| FR-057 | Security, Quality, and Guardrails | Evaluation datasets and regression testing. | Partial | S |
| FR-058 | ESG Framework Mapping, Compliance and Report Governance | Gap analysis and indicative 2027 ESRS readiness view. | Partial | S |
| FR-059 | ESG Framework Mapping, Compliance and Report Governance | Disclosure checklist as the datapoint source of truth. | Partial | M |
| FR-061 | ESG Framework Mapping, Compliance and Report Governance | Report-structure governance. | Built | - |
| FR-062 | ESG Framework Mapping, Compliance and Report Governance | Evidence attached to a specific claim. | Partial | M |
| FR-063 | ESG Framework Mapping, Compliance and Report Governance | Auditor release and dedicated audit view. | Built | - |
| FR-064 | ESG Framework Mapping, Compliance and Report Governance | “Send to” requests from any page. | Built | - |
| FR-066 | ESG Framework Mapping, Compliance and Report Governance | Extensible to the wider report suite. | Built | S (UPC 2026 template, agreed 3 Nov) |
| FR-067 | ESG Framework Mapping, Compliance and Report Governance | One current Claude model for all capabilities. | Partial | S |
| FR-068 | ESG Framework Mapping, Compliance and Report Governance | AI content governance (DDIT compliance requirement). | Partial | S |
| FR-069 | ESG Framework Mapping, Compliance and Report Governance | Advisory per-subsection edit locks. | Stays future | - |
| FR-070 | ESG Framework Mapping, Compliance and Report Governance | Section view of all subsections as one document. | Built | - |
| FR-071 | ESG Framework Mapping, Compliance and Report Governance | Flag data not yet available. | Built | - |
| FR-072 | ESG Framework Mapping, Compliance and Report Governance | Footnotes. | Built | - |
| FR-073 | ESG Framework Mapping, Compliance and Report Governance | Disclosure checklist: manual upload or SharePoint sync. | Built | - |

## "Today:" notes in the signed-off document that the code contradicts

These do not change scope but are worth correcting in the next version:

- **FR-006:** the sent text says uploads are "recorded and indexed" today. They are not: only file name, size and type are stored, and nothing is indexed. Indexing is V1 work.
- **FR-003:** SME review and Legal review exist only as seed values; no action moves a subsection into Legal review or Exported.
- **FR-038:** see Fix first, item 2.
- **FR-040:** plain comments and sent-back requests cannot be closed.
- **FR-043:** the MDD paragraph styles are defined in the Word export but not applied to any text.
- **FR-063:** there is no Auditor seat in the "View as" switch, and nothing confines an auditor to the Audit View.
- **FR-068:** accepting the AI baseline does record who and when (in version history). Separately, the roll-forward is labelled as AI throughout although it is a year substitution.
- **FR-069:** all subsections of a report are one document, so two users saving different subsections can still overwrite each other.

## Detail per requirement

### FR-001 — Create a report per reporting cycle  (M / V1)

**Acceptance criteria:** The four reports in scope – the Sustainability Statement (RNFM), the Update on Public Commitments (UPC), the ESG Index and the Australian ISSB report (ASRS) – are pre-configured, as today. Creating a new report cycle in the app is a future enhancement (Section 3.16).

- **Status:** N/A-STAYS-FUTURE
- **Current state:** `data/reports.ts` (`reports`) pre-configures six reports: the four in scope (`rnfm`, `upc`, `esg-index`, `asrs`) plus `tcfd-uk` and `hrs`, all listed in the report switcher (`App.tsx`) and on Home (`LandingView.tsx`). The "New Report Cycle" wizard (`DashboardView.tsx` `startNewCycle`/`handleNextStep`) runs a timed "Generating AI Draft…" bar, ignores its inputs and opens the editor; nothing is created or stored.
- **V1 gap:** None required by the AC. To confirm (not in AC): whether TCFD (UK) and the Human Rights Statement stay visible; whether the wizard is hidden or labelled as future, since it simulates AI generation; the app names the RNFM "Report on Nonfinancial Matters", not "Sustainability Statement".
- **Today-note:** matches.
- **Effort:** -

### FR-002 — Dashboard of reports and open tasks  (M / V1)

**Acceptance criteria:** Dashboard and personal task list as today; some counts and progress remain pre-computed.

- **Status:** BUILT
- **Current state:** Home (`LandingView.tsx`, `data/portfolio.ts` `getPortfolioSummary`/`getMyTasks`) shows one card per report and "My tasks across all reports", matching the signed-in alias against seeded owner names and falling back to the full, flagged queue; the report Dashboard (`DashboardView.tsx`) adds a live sign-off rollup (`data/workflowStatus.ts` `loadLiveWorkflowRollup`) and a per-role "Open Tasks" list. Pre-computed: "Active Reports" is a literal `1`; coverage, overdue, KB and roll-forward counts are static seeds, and open tasks and due dates come from seed stages (`data/workflowState.ts` `sectionAssignments`, `dueFor`), not live sign-offs.
- **V1 gap:** None. Note: section owners are fictional personas (`reportSections.ts` `P`), so named build users get the unfiltered queue until sections are assigned to them.
- **Today-note:** matches.
- **Effort:** -

### FR-003 — Lifecycle stages for subsections and the report  (M / V1)

**Acceptance criteria:** Subsection stages Draft, SME review, Legal review, Approved and Exported, with Edited and Updated markers, as today (applied in the browser).

- **Status:** BUILT
- **Current state:** `data/reportSections.ts` `WorkflowStage` defines Draft / SME review / Legal review / Approved / Exported; `data/workflowStatus.ts` `deriveStatus` adds the Edited / Updated markers (`section-progress`) and owner sign-off states. All transitions run in the browser (`EditorView.tsx`: `markSectionUpdated`; `ownerSignOffL2` sets Approved once all required owners sign; `confirmReEdit` resets to Draft); `backend/routers/api.py` accepts any authenticated PUT with no stage or role check.
- **V1 gap:** None as written ("as today"). If every listed stage must be reachable, transitions into SME review, Legal review and Exported need adding (S–M) — see Today-note.
- **Today-note:** partly accurate: SME review and Legal review exist only as seed values (`defaultStage`) and display as "In review"; no action moves a subsection to Legal review or Exported (export leaves the stage unchanged). Legal sign-off is a legal owner's L2 sign-off.
- **Effort:** -

### FR-004 — Roll-forward from the prior approved report  (M / V1)

**Acceptance criteria:** Prior-year baseline and change-by-change roll-forward review as today; the FY2026 draft text is produced as in the prototype. Live AI roll-forward is a future enhancement.

- **Status:** BUILT
- **Current state:** The FY2025 approved text (`data/priorYearContent.ts`) is the baseline; of the 86 RNFM subsections, 43 get their FY2026 draft from `rollForwardText()` (regex year substitution, no model call), 31 carry hand-written text (`OVERRIDES`) and 12 are stubs. Review is change-by-change: `RollForwardChangeList` (Keep FY2026 / Revert to FY2025 / Accept all), `RollForwardChecklist` (Confirm / Update / Flag, persisted via `api.report.rollForward`) and the read-only `PriorYearSection`.
- **V1 gap:** None required by the AC. Recommended (S, not in AC): `rollForwardText` replaces 2024→2025 and then 2025→2026, so prior-year comparatives also become 2026 (verified: "In 2025 … vs 2024" → "In 2026 … vs 2026"); the provenance (`ROLL_FORWARD_MODEL = 'claude-sonnet-4-6 (Bedrock AgentCore)'`) and UI text ("AI rolled this section forward") attribute the substitution to an AI model.
- **Today-note:** matches.
- **Effort:** -

### FR-005 — Report-level audit history  (M / V1)

**Acceptance criteria:** Audit view as today, showing a log of activities; only evidence attachments are added live. A complete audit trail is a future enhancement. Retention of the audit record is outside the build; Novartis DDIT includes it in its roadmap.

- **Status:** N/A-STAYS-FUTURE
- **Current state:** `AuditView.tsx` merges the 50 static events in `data/auditEvents.ts` with live "upload" events built from audit-evidence attachments (`api.report.evidence` entries with `evidenceKind`/`paragraphRef`, one of them seeded), with filters and JSON export; the backend writes no audit records. Access is gated on a "View as" role that defaults to Admin, so every user can view it.
- **V1 gap:** None required by the AC. Not in AC but contradicts it: a hard-coded "7 years — Retention" tile and the text "assurance-grade record of every change, sign-off and export"; relabel (S).
- **Today-note:** matches. Sign-offs and version snapshots are stored (`l2-signoff`, `versions`) but not shown in the audit view.
- **Effort:** -

### FR-006 — Manual upload of PDF/Word sources and the disclosure checklist  (M / V1)

**Acceptance criteria:** Disclosure-checklist upload (Excel or CSV, FR-015); document uploads are recorded and indexed, and both upload pages are labelled as such in the app.

- **Status:** PARTIAL
- **Current state:** The checklist upload (`DatapointChecklistPanel.tsx`) accepts CSV only and stores versions via `/api/reports/rnfm/datapoint-checklist`. Document uploads are simulated: Upload Documents (`UploadView.tsx` `simulateUpload`) saves only name/size/type via `PUT /api/uploads` and states contents are "not sent to a backend or indexed"; Knowledge Base (`KnowledgeBaseView.tsx` `simulateUpload`) keeps uploads in component state only, toasts "ingestion queued", does not role-gate its drop zone (`handleDrop`), and lists 67 static documents (`data/knowledgeBaseDocuments.ts`: 65 "indexed", 12,745 chunks, Titan/OpenSearch details) that are not the deployed corpus; Previous Reports (`PreviousReportsView.tsx`) has a third, local-only upload.
- **V1 gap:** (1) Excel checklist — see FR-015. (2) Send the file from both upload pages to a new backend upload route, keep the record, and parse/index it (FR-013); show real per-file status and errors. (3) Relabel both pages to describe what actually happens (drop the "illustration only", "ingestion queued" and Titan/OpenSearch text, list the real indexed sources) and role-gate the KB drop zone. Decide whether the Previous Reports upload stays.
- **Today-note:** wrong: only Upload Documents records uploads, as metadata; no file content is sent or indexed anywhere, and the KB page persists nothing. Checklist upload works for CSV only.
- **Effort:** M (excludes FR-013 parsing/indexing and FR-015 Excel, counted there)

### FR-013 — Parse PDF and Word: text and tables with page references  (M / V1)

**Acceptance criteria:** The indexed corpus is deployed as today: 225 passages from the RNFM FY2025, the Communications Style Guide and extracts of four reference files. Newly uploaded documents are parsed as text and indexed for the AI features (FR-006).

- **Status:** PARTIAL
- **Current state:** `backend/kb_corpus.json` holds 225 passages — 174 RNFM FY2025 and 40 Style Guide (pypdf page text with `p.N` refs, `scripts/build_kb_corpus.py`) plus 11 from four reference markdown files (no page ref) — shipped in the image (`Dockerfile` `COPY . .`) and loaded by `backend/retrieval.py` `_corpus()`. Nothing is parsed at runtime: no file-upload route, no PDF/Word library in `backend/requirements.txt`, and the retriever reads only the committed file.
- **V1 gap:** Backend route that receives PDF/DOCX (add pinned `python-multipart`, `pypdf`, `python-docx`); extract text with page refs (PDF) or heading/paragraph refs (Word); chunk with the existing `chunk()` logic; store files and chunks durably (the ECS task role today covers only DynamoDB and the frontend bucket); make `LocalRetriever` read shipped plus uploaded chunks, refreshed across the 4 uvicorn workers. Tables stay plain text, per the AC.
- **Today-note:** matches. Note: `customer-inputs/` (source of the 11 reference passages) is not in the repo, so the corpus cannot be rebuilt from the repo; the committed JSON still deploys unchanged.
- **Effort:** L

### FR-015 — Parse Excel, citing sheet and cell  (M / V1)

**Acceptance criteria:** The checklist can be uploaded as Excel or CSV; its columns are read on upload.

- **Status:** PARTIAL
- **Current state:** CSV only: `parseChecklistCsv` (`data/datapointChecklist.ts`) maps flexible headers (`HEADER_ALIASES`: DR ID, Framework, Standard, Requirement, Materiality, Mandatory, Note) and reports bad rows; the input accepts `.csv` and `frontend/package.json` has no Excel reader. The parser splits lines before handling quotes, so a quoted cell containing a line break (common in Excel exports) breaks the row.
- **V1 gap:** Accept `.xlsx` (a pinned xlsx reader in the browser, or openpyxl in the backend), choose the sheet(s) and feed rows into the existing header mapping; fix multi-line quoted CSV cells; add tests. The register arrived as one sheet (`data/Novartis Datapoint Register_291026.xlsx`): title on row 1, header on row 3, 27 columns, one row per datapoint (310 rows, 55 DRs). The upload reads the first line as the header and recognises only DR and Standard, so map the register's own columns (DR, Datapoint, Inclusion decision, DMA topic(s), Classification, Table reference(s)); see `DECISIONS.md`.
- **Today-note:** matches.
- **Effort:** M

### FR-016 — Reporting-framework requirement libraries  (M / V1)

**Acceptance criteria:** The 180 requirements and their standard text are deployed as today.

- **Status:** BUILT
- **Current state:** `data/esrsRequirements.ts` `allRequirements` holds 180 requirements (ESRS 80, ISSB 58, GRI 11, TCFD 11, modern-slavery acts 17, Norwegian Transparency Act 3). `data/standardText.ts` `standardExtracts` holds 88 extracts — 32 ESRS (`preAdoption`), 14 IFRS S1/S2, and 42 GRI/TCFD/MSA/NTA each carrying a "pending reconciliation" `sourceNote` — all keyed to existing requirement ids and shown in `StandardTextPopup.tsx`.
- **V1 gap:** None.
- **Today-note:** matches (counts verified). Fidelity of the 46 transcribed ESRS/ISSB extracts to the Novartis files not verified (files not in repo).
- **Effort:** -

### FR-018 — Report structure (template)  (M / V1)

**Acceptance criteria:** The report structure follows the FY27 report blueprint shared by Novartis; the prototype was built on the RNFM structure with 86 subsections. The Human Rights Statement is a separate report.

- **Status:** PARTIAL
- **Current state:** `data/reportSections.ts` `STRUCTURE` holds 93 rows from the FY2025-based "RNFM Section Breakdown" blueprint; `reportSections` drops the 7 Human Rights rows (86 subsections render) and `hrsSections` back the separate `hrs` report. Structure changes go through Structure Admin draft → commit → publish → editor review/apply (`StructureAdminView.tsx`, `data/structureStore.ts`); no FY27 blueprint exists in the repo (searched), and the wizard's "2027 ESRS-aligned structure" option does nothing.
- **V1 gap:** Agreed 3 Nov (`DECISIONS.md` D3): until Novartis shares the FY27 blueprint, the FY2025 structure stays and is adjusted in Structure Admin, so no work starts now. When the blueprint arrives, make it the baseline (replace `STRUCTURE`, or publish it through Structure Admin) and re-key the seed data tied to today's refs and ids (`priorYearContent.ts`, `OVERRIDES`/`drsCovered`, owner maps, `aiProvenance.ts`, `comments.ts`, `editorChanges.ts`, `rollForwardItems.ts`, `sectionEvidence.ts`, `sectionLocks.ts`). Novartis' outline for the start of the FY27 report: Basis of preparation (BP-1, BP-2), Corporate governance (GOV-1 to GOV-4), Strategy (SBM-1 to SBM-3) and Materiality assessment (IRO-1, IRO-2), with 2, 4, 3 and 2 subsections; the rest follows the DMA topics. Size not verified: it depends on how far FY27 differs from FY2025.
- **Today-note:** matches (the file header still says "93-subsection" because it counts the HRS rows).
- **Effort:** L once the blueprint arrives; none before

### FR-019 — Apply framework requirements to each subsection  (M / V1)

**Acceptance criteria:** Subsection mappings come from the uploaded datapoint register, using the section it names for each datapoint. Coverage status as today.

- **Status:** NOT BUILT
- **Current state:** `data/complianceMappings.ts` builds mappings once at import from the requirement library, hand-set `drsCovered` per subsection and a keyword fallback (`fallbackSection`); coverage comes from hard-coded `coveredDRs`/`partialDRs` sets, and "Run scan" (`ComplianceView.tsx` `runScan`) is a timed animation. The uploaded checklist is stored but no view reads it — although the upload toast says its datapoints "now drive the gap analysis" — and neither the parser nor the register has a section column.
- **V1 gap:** Place each register datapoint with the agreed rule (`DECISIONS.md` D1: ESRS 2 by DR, the rest by DMA topic and Classification) instead of a section column, and report unplaced rows (8 Included Water use datapoints today); build mappings from the current checklist version instead of `drsCovered`/`fallbackSection`, keeping today's coverage lookup and deciding the status for datapoints the library does not hold (the register uses the amended ESRS numbering, so its DR codes cannot be matched to the library's by code alone; see FR-059); load mappings at runtime for the 7 modules that import them (Dashboard, Editor, Compliance, Structure Admin, Standard-text popup, Admin, `reportData.ts`), with today's mapping as fallback when no checklist exists.
- **Today-note:** matches; add that the uploaded checklist does not reach the mappings.
- **Effort:** L

### FR-020 — Version and publish structure changes  (M / V1)

**Acceptance criteria:** Structure versioning and publishing as today.

- **Status:** BUILT
- **Current state:** `StructureAdminView.tsx` commits draft snapshots, publishes with a change summary into a permanent `publishedVersions` history and rolls back; the editor applies a publish after a diff review (`EditorView.tsx` `applyPublishedStructure`). Data is stored via `/api/structure/{draft|versions|published|published-versions|applied}` in DynamoDB (`.env.production` `VITE_API_MODE=rest`); the page is hidden from non-allowlisted aliases (`canEditStructure`), but the routes only require a valid token.
- **V1 gap:** None.
- **Today-note:** matches.
- **Effort:** -

### FR-023 — In-editor assistant to draft and revise text  (M / V1)

**Acceptance criteria:** In-editor assistant on Amazon Bedrock as today. Should: include the earlier conversation in each request.

- **Status:** PARTIAL
- **Current state:** `AiAssistantPanel.tsx` keeps the conversation in local state, but `aiChat()` (`api/aiClient.ts`) sends only the current prompt, section title/text and evidence name; `ai.chat()` (`backend/ai.py`) makes a single-message Bedrock Converse call (Claude 3 Haiku, `BEDROCK_MODEL_ID` in `infrastructure/ecs.tf`) with no retrieval. On an HTTP or network failure the browser silently substitutes a canned local answer (`respondToPrompt`).
- **V1 gap:** Send the earlier turns (bounded) from `AiAssistantPanel` via `aiChat` to `/api/ai/chat`, validate them in `routers/api.py`, and build alternating user/assistant `messages` in `ai.chat()`; add tests (`backend/tests/test_ai.py`, `api/aiClient.test.ts`). The `SuggestingEditor` "Ask AI" (flag `trackChangesEngine`, off by default) is single-turn.
- **Today-note:** matches. Claude 3 Haiku availability on Bedrock not verified (no AWS call made).
- **Effort:** S

### FR-025 — Draft section by section, requirement by requirement  (M / V1)

**Acceptance criteria:** Per-requirement drafting on Amazon Bedrock as today; the prompt instructs the model to state gaps rather than invent figures.

- **Status:** BUILT
- **Current state:** "✦ AI: Draft datapoint" (`EditorView.tsx` `handleAiDraftDatapoint`, DR ref typed into `window.prompt`) calls `/api/ai/draft` → `ai.draft_section()`, which sends the DR, prior-year text and the top 4 retrieved passages to Bedrock and inserts the reply as a pending AI tracked change. `DRAFT_SYSTEM_PROMPT` says "NEVER invent specific figures … write a clear placeholder like '[confirm FY2026 figure]'".
- **V1 gap:** None. (If an explicit "state what is missing" instruction is wanted beyond placeholders, it is a one-line prompt edit.) Note: on model failure the editor inserts placeholder text attributed to "AI Draft Assistant".
- **Today-note:** matches.
- **Effort:** -

### FR-026 — RAG grounded in indexed sources  (M / V1)

**Acceptance criteria:** Keyword retrieval over the 225 indexed passages, as today; semantic retrieval is a future enhancement.

- **Status:** N/A-STAYS-FUTURE
- **Current state:** `backend/retrieval.py` `LocalRetriever` ranks the 225 passages by TF-IDF (top 4) for `draft_section` and `compliance_explain` only, not for chat or section review. `ecs.tf` sets neither `BEDROCK_KB_ID` nor `RETRIEVER` and `knowledge-base.tf` defaults `enable_knowledge_base = false`, so `BedrockKbRetriever` is inert.
- **V1 gap:** None for this requirement; FR-013 must add uploaded passages to this retriever.
- **Today-note:** matches.
- **Effort:** -

### FR-027 — Follow Novartis tone and the Communications Style Guide  (M / V1)

**Acceptance criteria:** Style Guide in the indexed corpus and the existing style checks, as today.

- **Status:** BUILT
- **Current state:** 40 Style Guide passages sit in `kb_corpus.json` (`docType: style_guide`), reached only through the general retrieval in drafting and compliance explanations. Style checks: rule-based `analyzeSection` (`data/aiEditor.ts`: CO₂, en-dash ranges, "%", inclusive terms, typos, one 2025/2026 consistency rule) and model-based `/api/ai/analyze` (rules written into `ANALYZE_SYSTEM_PROMPT`, results validated server-side), falling back to the rule-based checks.
- **V1 gap:** None. (Not in AC: the en-dash rule also flags DR codes and dates such as "E1-6", "GRI 305-1", "2026-03-15" — verified.)
- **Today-note:** matches.
- **Effort:** -

### FR-028 — Fit content to the target format  (C / V1)

**Acceptance criteria:** Future enhancement (Section 3.16). Content in the editor and in exports is not limited in length; AI drafts are one or two short paragraphs and can be edited or extended.

- **Status:** N/A-STAYS-FUTURE
- **Current state:** Drafts are capped at `maxTokens` 900 (chat 1024) and both prompts ask for "1-2 short paragraphs"; AI text arrives as an editable tracked change. No length limit exists in the editor or in the exporters (`utils/exportPdf.ts`, `exportDocx.ts`, `exportCsv.ts`).
- **V1 gap:** None.
- **Today-note:** matches.
- **Effort:** -

### FR-030 — Support user instructions per run  (M / V1)

**Acceptance criteria:** Chat instructions and Admin AI Tuning as today. Admin and Editor rights are a list of user names, set at deployment for the named build users.

- **Status:** PARTIAL
- **Current state:** Chat instructions are free-text prompts in `AiAssistantPanel.tsx`; Admin AI Tuning (`AdminView.tsx` AI tab → `/api/admin/config`) stores per-capability instructions and global context that `admin_config.augment_system_prompt` appends after the built-in rules. Rights are hard-coded: frontend Admin = `data/permissions.ts` `STRUCTURE_ADMIN_ALIASES` (4 demo aliases; no alias → allowed), Editors = fictional `EDITOR_TEAM` plus `EDITOR_ALIASES` (`data/workflowRoles.ts`), backend `require_admin` = env `ADMIN_ALIASES`, set from the Terraform variable `admin_aliases` (empty by default); the editor and audit "View as" switch puts every signed-in user in the Admin seat, and "Reset Demo" (`POST /api/reports/rnfm/reset`) is open to all.
- **V1 gap:** Set one Admin and one Editor user-name list at deployment (the admin list is already a Terraform variable → ECS env `ADMIN_ALIASES`; add the same for editors), expose it to the SPA (e.g. a `/api/me` roles route), replace the hard-coded frontend sets and the no-alias allow, and offer the Admin/Editor "View as" seats only to listed users; fill the lists with the named build users and update `data/permissions-matrix.test.ts`.
- **Today-note:** matches.
- **Effort:** M

### FR-031 — AI never changes approved text silently  (M / V1)

**Acceptance criteria:** AI output enters as tracked suggestions, as today (applied in the browser). Editors and Admins edit approved text without re-approval; other roles' edits reset the subsection to Draft.

- **Status:** PARTIAL
- **Current state:** Every AI path in `EditorView.tsx` (`insertAiTrackedChange`, `applyEditorFlag`, `handleAiDraftDatapoint`, `applyRequestAsTrackedChange`) only adds a pending `TrackedChange` with `origin: 'ai'` and never writes `content`; `backend/ai.py` only returns text. `requestEdit`/`confirmReEdit` (browser-only) let Editor/Admin seats edit approved text without re-approval, while other seats go through "Snapshot & edit", which resets the subsection to Draft and clears its L2 sign-offs (both covered by e2e tests in `workflow.spec.ts`).
- **V1 gap:** In the L2 consolidated view, the Edit button (`onEditSubsection` in `EditorView.tsx`) calls `setSelectedSection(sec)` and then `requestEdit()` in the same handler. Because `requestEdit` is a stale closure, the approval check and lock run on the previously selected subsection. An Owner who opens an approved group while a non-approved subsection is selected can therefore edit approved text with no reset. Fix: pass the target section into `requestEdit`/`acquireLock`.
- **Today-note:** Matches, except for this L2-view bypass.
- **Effort:** S

### FR-032 — Citations shown for drafted content  (M / V1)

**Acceptance criteria:** Citations display as today. Should: show the sources the per-requirement AI draft already retrieves.

- **Status:** PARTIAL (citation display is built; the "Should" item is not)
- **Current state:** `ContentViewer.tsx` renders `[n]` as clickable markers that open a source panel (document, type, page, excerpt) from `section.citations`; these are seeded on 20 of 86 subsections (21 citations). `ai.draft_section` returns `{text, sources}` from the TF-IDF retriever (`retrieval.py` over `kb_corpus.json`, 225 chunks), but `aiClient.ts` `aiDraft()` returns only the text string, `TrackedChange` (`editorChanges.ts`) has no sources field, and `ChangeTracker.tsx` shows none.
- **V1 gap:** (Should) Return `sources` from `aiDraft()`, store them on the AI tracked change, and render them in `ChangeTracker`. `ComplianceView.tsx` already uses the same "Grounded in:" pattern for Explain with AI.
- **Today-note:** Matches.
- **Effort:** S

### FR-033 — Display citations in the review UI  (M / V1)

**Acceptance criteria:** As today.

- **Status:** BUILT
- **Current state:** The Clean view (`ContentViewer.tsx`) shows clickable citation markers with a source panel. `AuditorView.tsx` lists each released subsection's citations, and the DOCX export emits citation superscripts plus a source list (`exportDocx.ts` `buildCitationFootnotes`). The L2 consolidated view and the Editor-view redline show `[n]` only as plain text.
- **V1 gap:** None.
- **Today-note:** Matches.
- **Effort:** -

### FR-036 — Confidence score per disclosure requirement  (M / V1)

**Acceptance criteria:** Confidence scores as today (illustrative, derived from the pre-computed coverage). Re-assessing coverage and scores from the section text depends on each datapoint carrying its full requirement text.

- **Status:** BUILT
- **Current state:** `complianceMappings.ts` `confidence(status, seed)` is a fixed base per pre-computed status plus deterministic jitter. Measured across 180 DRs: covered 0.85–0.95 (98), partial 0.55–0.65 (41), missing 0.15–0.25 (41). The score is shown in the `ComplianceView.tsx` gap table, in `StandardTextPopup.tsx`, in the CSV exports and as the Admin average. "Run Scan" replays the stored results and makes no model call.
- **V1 gap:** None. Re-assessment from section text is not built; the criteria tie it to each datapoint having full requirement text, and verbatim text exists for 88 of 180 DRs (`standardText.ts`).
- **Today-note:** Matches.
- **Effort:** -

### FR-037 — Provide a confidence rationale  (M / V1)

**Acceptance criteria:** “Explain with AI” live and templated default rationales, as today.

- **Status:** BUILT
- **Current state:** Templated rationales (`partialRationale`, `missingRationale` and `missingBenefit` in `complianceMappings.ts`) cover all 82 partial/missing DRs; covered DRs have none, by design. "✦ Explain with AI" appears on partial/missing gap-analysis rows for allowlisted aliases (`canRunAnalysis`). It calls `POST /api/ai/compliance` → `ai.compliance_explain` (Bedrock Converse with TF-IDF grounding) and shows the rationale, suggested fill and sources. The result is kept in component state only.
- **V1 gap:** None. Not verified: whether the pinned model `anthropic.claude-3-haiku-20240307-v1:0` (`ecs.tf`, `ai.py`) can be invoked in the Novartis account. Button visibility depends on the alias allowlist (see FR-052).
- **Today-note:** Matches.
- **Effort:** -

### FR-038 — Accept, edit, reject or regenerate content  (M / V1)

**Acceptance criteria:** Accept, reject and “Edit & accept” as today; regenerate is a future enhancement (FR-029).

- **Status:** PARTIAL
- **Current state:** `ChangeTracker.tsx` gives Editor/Admin seats Accept, Edit & accept and Reject; there is no regenerate action (correct per FR-029). In `EditorView.tsx` the three handlers are faulty:
  - `handleAcceptChange` only flips the status. AI suggestions are never in `content`, so accepting one never puts its text into the section, the Clean view or the export.
  - `handleRejectChange` reverts only when `originalText` is non-empty and the type is modification/insertion. A rejected paragraph insertion therefore stays, and a rejected paragraph deletion is not restored.
  - `handleAcceptEditedChange` overwrites `paras[paragraphIndex]`. Two AI insertions created before either is accepted share that index, so the second overwrites the first.
- **V1 gap:**
  - Make Accept apply AI insertions and modifications, or write AI suggestions into the working text as pending, the way human edits are.
  - Make Reject remove insertions and restore deletions.
  - Make Edit & accept insert rather than overwrite.
  - Add e2e tests that check content after accept and reject; none exist today.
- **Today-note:** Correction. The controls exist, but Accept does nothing to content for AI suggestions, and Reject does not undo paragraph insertions or deletions.
- **Effort:** M

### FR-039 — Inline editing that stays distinguishable  (M / V1)

**Acceptance criteria:** Inline insertions and deletions with author and AI-origin markers, and the toggle between Clean View (without track changes) and Editor View (with track changes), as today; the always-on track-changes view stays a preview feature.

- **Status:** PARTIAL
- **Current state:** Editor/Admin seats get the Clean view / Editor view toggle (`DraftViewToggle` in `RollForwardCompare.tsx`); other seats see only Clean. `WorkingRedline` shows pending human edits inline (green / struck red) with no author or AI marker. Those markers (author, date, reason, "✦ AI DRAFT") appear only in the change list below, and pending AI suggestions are not shown inline at all. The always-on `SuggestingEditor` sits behind the `trackChangesEngine` flag, off by default (`featureFlags.ts`).
- **V1 gap:** Render pending AI changes inline in `WorkingRedline`, with AI styling and an author tooltip. The `.tc-ins[data-origin="ai"]` CSS already exists for the preview. This overlaps with the FR-038 fix.
- **Today-note:** Partly correct: the author and AI markers are in the change list, not inline. The off-by-default flag matches.
- **Effort:** S

### FR-040 — Comments and change requests  (M / V1)

**Acceptance criteria:** Comments and change requests (Resolved, Dismiss, Send back) as today; every role except Auditor can comment.

- **Status:** PARTIAL
- **Current state:** In `CommentsPanel.tsx`, the Admin, Editor, Owner, Input Provider and Guest seats can all add comments and change requests; `AuditorView.tsx` has no comment UI. For requests, the Editor assigns and then chooses Resolved (applied as a tracked change), Dismiss or Send back. Plain comments have no Resolve or Dismiss control, and a sent-back request has no follow-up action. Both stay unresolved (`isUnresolved`), and `markSectionUpdated` refuses while any are open, so the subsection can never be marked updated and Owner sign-off for its L2 group is blocked.
- **V1 gap:** In `CommentsPanel.tsx`, add Resolve/Dismiss for plain comments and a follow-up step for sent-back requests (reply/resubmit, or an Editor resolve). Alternatively, exclude them from the `markSectionUpdated` gate.
- **Today-note:** Correction. The request actions exist, but plain comments and sent-back requests cannot be closed.
- **Effort:** S

### FR-041 — Display overall review progress  (M / V1)

**Acceptance criteria:** As today.

- **Status:** BUILT
- **Current state:** The Dashboard "Report Progress" bar and "% approved" come from `loadLiveWorkflowRollup()` (`workflowStatus.ts`), built from persisted progress and L2 sign-offs. Status also shows per subsection in the sidebar, as "updated N/N · sign-off X/Y" in the L2 view, and in the ApprovalPanel stepper. The "Overdue Sections" count uses seeded due dates (`workflowState.ts` `dueFor`).
- **V1 gap:** None.
- **Today-note:** Matches.
- **Effort:** -

### FR-042 — Approval workflow with six roles  (M / V1)

**Acceptance criteria:** Six roles and sign-off rules as today, applied in the browser: a section can have several Input Providers, every non-legal owner signs, and one sign-off suffices among Legal/Compliance owners. Server-side enforcement is a future enhancement.

- **Status:** PARTIAL
- **Current state:** `ROLE_PERMISSIONS` (`workflowRoles.ts`) defines all six roles. `allRequiredOwnersSigned` (`reportSections.ts`) requires every non-legal owner plus one legal owner, and `inputProviders` is an array; both are unit-tested in `permissions-matrix.test.ts`. Enforcement is browser-only, with a "View as" switch. However, `EditorView` passes `canSignOff={l2Owners.includes(currentActor) || actingIsEditor}`. So the Editor seat, which has no sign-off right in the matrix, is offered "Sign off as Quinn Harper". That record never counts toward approval (nor does a non-owner Admin's), but it is saved and versioned as an "Owner sign-off".
- **V1 gap:**
  - Restrict the L2 sign-off control to assigned owners.
  - All 86 seeded subsections have exactly one Input Provider, and the app has no way to assign more. If no other requirement covers assignment (not verified), add it.
  - Not required by the criteria, but worth deciding: because the acting role is user-selectable, any user can act as Admin or sign under an owner's name.
- **Today-note:** Matches.
- **Effort:** S (M if an assignment UI is needed)

### FR-043 — Export editable Word  (M / V1)

**Acceptance criteria:** Word (MDD), Word (readable) and PDF exports as today, using the MDD paragraph styles and the Novartis 2026 brand colours. (Limited to Editors and Admin)

- **Status:** PARTIAL
- **Current state:** The export modal in `EditorView.tsx` offers Word (MDD) with `[Table Reference: DP_*]` placeholders, Word (readable) with rendered tables, and PDF (`exportDocx.ts`, `exportPdf.ts`). Only Admin/Editor seats see it (`canExportReport = actingIsEditor`). Colours come from `brand.ts`, whose own comment calls them best-match values pending the official hex. The 11 MDD styles (nov_*, Section_MetaInfo, TableReferenz) are only defined in `paragraphStyles`; no Paragraph sets `style`. Headings use built-in Heading 1/2 and body text is directly formatted Normal, although the modal says "MDD Paragraph Styles Applied".
- **V1 gap:**
  - Apply the nov_* styles to headings, L3 titles, body text, bullets and table placeholders, keeping the TOC field working.
  - Validate against the real MDD template, which is not in the repo.
  - Confirm the brand hex values with Novartis.
  - Note: the Audit View's released-sections PDF is open to any user.
- **Today-note:** Matches for the three formats. The MDD styles named in the acceptance criteria are defined but not applied.
- **Effort:** M

### FR-044 — Populate the output with the latest reviewed content  (M / V1)

**Acceptance criteria:** Exports the current working text, as today.

- **Status:** BUILT
- **Current state:** `runExport` passes the in-memory working `sections` to the exporters, and `handleSaveEdit` writes saved edits into `content` before acceptance, so unaccepted human edits are exported. Pending AI suggestions are not in `content` and are not exported.
- **V1 gap:** None. Observation: the modal says draft exports are "watermarked as a draft", but neither exporter adds a watermark.
- **Today-note:** Matches for human edits.
- **Effort:** -

### FR-045 — Preserve formatting; exclude guidance text  (M / V1)

**Acceptance criteria:** Export of the whole document, selected sections or one section, as today, with the studio's own formatting. Placeholder text in subsections that have no content yet is exported as it stands.

- **Status:** BUILT
- **Current state:** `EditorView.tsx` exports the whole document, chosen subsections, or one subsection ("Export section"). The exporters keep the studio's markup: headings, bold, bullets, footnotes, images, citations and readable tables. Placeholder text (`stubContent`, 3 seeded subsections) is exported as it stands.
- **V1 gap:** None.
- **Today-note:** Matches.
- **Effort:** -

### FR-047 — Retain approved outputs for future cycles  (M / V1)

**Acceptance criteria:** Version history and comparison of any two versions, as today, kept for the life of the build.

- **Status:** PARTIAL
- **Current state:** `makeVersion` (`sectionVersions.ts`) freezes a version on each save, each "mark updated", each owner sign-off (one per subsection in the group), AI-baseline acceptance and re-open. `VersionHistoryModal.tsx` compares any two versions, or a version against the current draft, as a word-level redline. The FY2025 baseline is shown separately (`PriorYearSection`), not as a version. All versions sit in one DynamoDB item (`store.py` `REPORT#rnfm`/`versions`; PITR is on) and are written with `void api.report.versions.set`, so failed writes are silent. "Reset Demo" is shown to every seat, and `POST /api/reports/{id}/reset` (no admin check) deletes all report state, versions included.
- **V1 gap:**
  - Remove or admin-gate Reset Demo, in the UI and on the route.
  - Store versions one item per version, or in S3. DynamoDB caps an item at 400 KB; the seed `sections` document is already about 191 KB of JSON, and the editor embeds images of up to 5 MB as base64 (`RichContentEditor.tsx`).
  - Surface failed writes to the user.
  - Growth over the 45 days was not verified at runtime.
- **Today-note:** Mostly matches. The prior-year text is a separate reference, not one of the comparable versions.
- **Effort:** M

### FR-050 — Admin manages structure and requirement mappings  (M / V1)

**Acceptance criteria:** Structure governance as today; requirement mappings stay reference data.

- **Status:** BUILT
- **Current state:** `StructureAdminView.tsx` is alias-gated, with the nav item hidden for everyone else. It supports L1–L3 add, rename, reorder and remove; a guard before removing content; commit with rollback; and publish with diff, note and history, after which the editor applies or dismisses the change (`applyStructureToSections`). Mappings are static (`complianceMappings.ts`); removing a section only flags that they "need to be re-pointed".
- **V1 gap:** None. Observations: `/api/structure/*` is not admin-gated on the server, and `canEditStructure(null)` returns true when the token carries no email claim.
- **Today-note:** Matches.
- **Effort:** -

### FR-052 — Admin manages model and prompt configuration  (M / V1)

**Acceptance criteria:** Admin AI Tuning as today.

- **Status:** BUILT
- **Current state:** The AdminView "AI Tuning" tab holds an app-wide context plus instructions for five capabilities, saved via `PUT /api/admin/config` (`require_admin`). `admin_config.augment_system_prompt` appends them after the built-in guardrails on every `ai.py` call. The model ID can be set only by environment variable (`BEDROCK_MODEL_ID` in `ecs.tf`).
- **V1 gap:** None in code. Deployment config: add the Novartis admin aliases to both demo allowlists, which differ from each other: `permissions.ts` `STRUCTURE_ADMIN_ALIASES` (compiled into the frontend) and the backend `ADMIN_ALIASES` default.
- **Today-note:** Matches. The tab also holds the app-wide context.
- **Effort:** -

### FR-053 — Operations dashboards and logs  (M / V1)

**Acceptance criteria:** Application logs in Amazon CloudWatch in the Novartis account, as today. Container metrics and operational dashboards are a future enhancement.

- **Status:** BUILT
- **Current state:** `ecs.tf` ships container output to the `/ecs/<project>` log group via `awslogs` (14-day retention), and `main.py` logs at INFO level. Container Insights is enabled on the cluster. Terraform defines no dashboards or alarms, and the Admin "Metrics & Confidence" tab is computed from seed data.
- **V1 gap:** None specific to this requirement. Landing the logs in the Novartis account is deployment work (`DEPLOYMENT.md`).
- **Today-note:** Matches. Container Insights already sends container metrics to CloudWatch; what is missing is dashboards and alarms.
- **Effort:** -

### FR-054 — Approved security and access controls  (M / V1)

**Acceptance criteria:** Sign-in through an Amazon Cognito user pool created in the Novartis account with the named build users; encryption at rest, and HTTPS from the browser to the content delivery layer. Role checks as today. Federation to the Novartis identity provider is outside CDE (INT-001); server-side role enforcement and HTTPS on the internal hop are future enhancements.

- **Status:** PARTIAL
- **Current state:** `infrastructure/cognito.tf` creates only an app client (`aws_cognito_user_pool_client.app`) in an existing pool given by `var.cognito_user_pool_id`; identity providers come from `var.cognito_identity_providers` (default `COGNITO`). `backend/auth.py` `get_current_user` verifies RS256 tokens (issuer + audience) on every `/api/*` route (router dependency in `main.py`). Encryption at rest is on (DynamoDB SSE + PITR in `dynamodb.tf`, S3 AES256 in `frontend.tf`). CloudFront uses `redirect-to-https` with TLSv1.2_2021 on an existing certificate looked up in `acm.tf` (`var.certificate_domain`); the ALB origin is `http-only`. The only server-side role check is `require_admin` (`ADMIN_ALIASES`) on `/api/admin/*`. The ALB is internet-facing with a plain-HTTP :80 listener open to 0.0.0.0/0 (`alb.tf`).
- **V1 gap:** Add a Cognito user pool in the Novartis account (`aws_cognito_user_pool` + hosted-UI domain; the app client already defaults to `COGNITO` only), or create it outside Terraform and pass its ID and domain as variables. Create the named build users with an `email` attribute (the alias is its local part in `auth.py`/`useAuth.ts`). Provide a certificate and domain in that account (`acm.tf`, `dns.tf`; the ALB HTTPS listener uses the same certificate lookup). For role checks to work "as today" for the build users, add their aliases to `frontend/src/data/permissions.ts` `STRUCTURE_ADMIN_ALIASES` (it drives structure editing, KB upload, Run Scan/Explain with AI and report cycle) and to `admin_aliases`.
- **Today-note:** Matches. The prototype does not yet run against a pool in a Novartis account.
- **Effort:** M

### FR-055 — Avoid fabricated claims  (M / V1)

**Acceptance criteria:** Prompts instruct the model not to invent figures, as today. AI failures are shown as errors; no placeholder or illustrative text is inserted in place of a failed AI call.

- **Status:** PARTIAL
- **Current state:** All five system prompts in `backend/ai.py` (`SYSTEM_PROMPT`, `PEER_SYSTEM_PROMPT`, `DRAFT_SYSTEM_PROMPT`, `COMPLIANCE_SYSTEM_PROMPT`, `ANALYZE_SYSTEM_PROMPT`) forbid invented figures, and admin prompt overrides are append-only (`admin_config.augment_system_prompt`). On failure the backend returns HTTP 200 substitutes (`routers/api.py`: a "temporarily unavailable" answer for chat/peer, `{text:null}`, null rationale, `{flags:null}`) and the frontend substitutes content: `aiChat` → `respondToPrompt` sim with insertable `proposedText`, and `aiPeer` → local keyword answer (`BenchmarkingView.localAnswer`), both on HTTP/network/shape errors; `aiAnalyze` null → regex `analyzeSection` flags (`AiAssistantPanel`); `aiDraft` null → `[AI proposed] Draft narrative addressing …` inserted as a pending AI tracked change (`EditorView.handleAiDraftDatapoint`); `SuggestingEditor.askAi` inserts "revised text reflecting your instruction" when no text comes back. Only "Explain with AI" shows an error toast and keeps the pre-computed text (`ComplianceView.explainWithAi`).
- **V1 gap:** In REST mode, remove these substitutions and show an error state instead: `frontend/src/api/aiClient.ts` (`aiChat`, `aiPeer`, `aiAnalyze`, `aiDraft`), `EditorView.handleAiDraftDatapoint` (no placeholder tracked change), `SuggestingEditor.askAi`, the `AiAssistantPanel` review tab and `BenchmarkingView`. Make backend failures explicit (an error status or error field, not 200 + substitute text). Update the tests that assert the fallbacks (`backend/tests/test_ai.py` lines 68, 136, 232, 303; `frontend/src/api/aiClient.test.ts` "falls back to the local sim") and the fallback signatures in `scripts/smoke-prod.sh`.
- **Today-note:** Matches. Outside the AC wording: pre-computed gap rows show seeded "AI Suggested Fill" text rotated across unrelated DRs (`complianceMappings.ts` `suggestedFills[idx % n]`). It cites specific documents, pages and figures (e.g. "50% packaging recyclability target by 2030") and is labelled as AI in `ComplianceView` and the CSV export.
- **Effort:** M

### FR-057 — Evaluation datasets and regression testing  (M / V1)

**Acceptance criteria:** The existing unit and end-to-end suites pass on the migrated code, and the smoke test checks the deployed instance in the Novartis account: health, sign-in, a data round-trip and each AI route. An AI evaluation set is a future enhancement.

- **Status:** PARTIAL
- **Current state:** The suites exist: 62 backend `test_*` functions (`backend/tests/`), 113 Vitest cases in 10 `*.test.ts` files and 97 Playwright `test(` declarations in `frontend/e2e`. The default config ignores `capture-screens.spec.ts` (5 tests) and runs offline with `VITE_E2E_AUTH_BYPASS` + `VITE_API_MODE=local`; `scripts/test-all.sh` runs all layers. `scripts/smoke-prod.sh` checks `/health`, 401s on unauthenticated calls, a DynamoDB PUT/GET/DELETE round-trip on report `__smoke` and all five AI routes (with real-vs-fallback detection) against `BASE` (required), using a hand-copied ID token.
- **V1 gap:** Run the suites on the migrated code and fix what breaks. On 30 Oct the handover code passed 62 backend and 117 Vitest tests; Playwright passed 99 and failed 6 (6 also failed on 27 Oct). Run the smoke test with `BASE` set to the Novartis instance and add an explicit sign-in check: today the token is pasted by hand, and scripting the sign-in needs an auth flow enabled on the new app client. Update the fallback signatures if FR-055 changes the failure responses.
- **Today-note:** Matches (all three counts verified).
- **Effort:** S

### FR-058 — Gap analysis and indicative 2027 ESRS readiness view  (M / V1)

**Acceptance criteria:** Gap analysis and readiness view as today, with pre-computed coverage (indicative, not a compliance assessment) and live “Explain with AI”. Gap detail also shows how the indexed peers disclose the same requirement, as today.

- **Status:** PARTIAL
- **Current state:** `ComplianceView.tsx` ("2027 ESRS Readiness Assessment") renders By Standard, Gap Analysis and Disclosure Checklist tabs from the static `complianceMappings`, whose statuses come from hand-assigned `coveredDRs`/`partialDRs` sets in `complianceMappings.ts`; "Run Scan" only replays a progress animation. Expanded gap rows show "How peers disclose this" via `peerInsightForDr`, a keyword match over the seeded `benchmarkAnswers` in `peerBenchmarking.ts`. Partial and missing rows also offer a live "✦ Explain with AI" (`aiCompliance` → `/api/ai/compliance`, grounded by `retrieval.retrieve`), limited to users who pass `canRunAnalysis(alias)`.
- **V1 gap:** The functionality is in place; only the on-page text needs fixing. The page must say the coverage is pre-computed and indicative, not a compliance assessment. Today's banner says "In the production Novartis environment the Compliance Gap Analysis agent generates it live", which will be untrue in the Novartis build. This is a wording change in `ComplianceView.tsx`.
- **Today-note:** Matches. "Explain with AI" is live only in REST mode, and only for users on the alias allow-list.
- **Effort:** S

### FR-059 — Disclosure checklist as the datapoint source of truth  (M / V1)

**Acceptance criteria:** Versioned upload as today; the gap analysis uses the latest uploaded checklist.

- **Status:** PARTIAL
- **Current state:** On the Upload page, `DatapointChecklistPanel.handleFile` parses the CSV (`parseChecklistCsv`) and saves `{current, history}` with an incremented `version` via `api.report.datapointChecklist` → `REPORT#rnfm/datapoint-checklist` (`store.py` `REPORT_RESOURCES`), with `uploadedBy: 'ESG Lead'` hard-coded. Nothing else reads it: `ComplianceView`, `complianceStats` and `standardGroups` use only the static `complianceMappings`, although the upload toast says the datapoints "now drive the gap analysis".
- **V1 gap:** Load `api.report.datapointChecklist.get()` in `ComplianceView` and use `current.datapoints` as the datapoint list for the stats, all three tabs and both CSV exports. Take materiality from the register's Inclusion decision (agreed 3 Nov, `DECISIONS.md` D2: Included = material; Excluded = not material and not a gap, with the exit reason shown; Pending = open decision); the register has no mandatory column (Conditionality is the nearest). Join to the pre-computed coverage through a map from the register's amended ESRS DRs to the library's original ones (about half of the shared codes mean a different requirement, e.g. E1-6), show datapoints without coverage as "not assessed", and fall back to the built-in dataset when no checklist exists. Storage: one register version is about 350 KB as JSON with all 27 columns, and the current and all prior versions are stored in one DynamoDB item (400 KB limit), so a second full version does not fit.
- **Today-note:** Matches.
- **Effort:** M

### FR-061 — Report-structure governance  (M / V1)

**Acceptance criteria:** As today.

- **Status:** BUILT
- **Current state:** `StructureAdminView.tsx` edits a draft (`api.structure.draft`) and publishes only after a confirm dialog that lists `diffStructures`/`summarizeDiff` against the last publish. Each publish appends an immutable `publishedVersions` entry (who, when, summary, note), and the draft can be rolled back to any of them. Removing a subsection with content opens a guard (`removeRow` → `pendingRemoval`). Access is `canEditStructure(alias)` in the browser only (the nav item is hidden too; `/api/structure/*` PUTs are not admin-gated), and the Report Editor shows a review banner before applying a publish (`applyStructureToSections`).
- **V1 gap:** None.
- **Today-note:** Mostly matches, with one correction: the "has content" check reads the code seed (`CONTENT_BY_REF`, built from `reportSections`), not the saved sections. Content written in the app (for example in a subsection added through a structure change) is therefore removed without the confirmation.
- **Effort:** -

### FR-062 — Evidence attached to a specific claim  (M / V1)

**Acceptance criteria:** Evidence attached to a claim can include the file; all roles can open it wherever the evidence is shown, including the Auditor view.

- **Status:** PARTIAL
- **Current state:** `EvidencePanel.tsx` records only typed metadata (file name typed as text, `evidenceKind`, a `paragraphRef` quote of the claim, a note) via `EditorView.addAuditEvidence` into the `evidence` document (`EvidenceDoc` in `sectionEvidence.ts`). There is no file input, no upload route in `backend/routers/api.py` (it stores JSON documents only) and no evidence bucket; the ECS task role's S3 access covers only the frontend bucket (`ecs.tf`). `AuditorView.tsx` lists evidence names as plain text. Evidence is shown in three places: the editor's "Evidence & sources" card (`EvidencePanel`, visible to every role that opens the subsection; adding and removing is limited to roles that can edit it, `canEditThis`), the AI Assistant panel's evidence list (`AiAssistantPanel.tsx`), and the Auditor view. The audit trail shows evidence attachments as events.
- **V1 gap:** Add a private, encrypted S3 evidence bucket (with CORS for uploads from the browser) and task-role IAM for it. Add backend endpoints that issue presigned upload and download URLs, with size and type limits. Store the object key, size and type on `EvidenceDoc`; add a file picker and upload to `EvidencePanel`, and an "Open" action available to all roles in `EvidencePanel`, the AI Assistant evidence list and `AuditorView` (download URLs issued to any signed-in user who can see the section); keep add and remove limited to roles that can edit; update the tests.
- **Today-note:** Matches.
- **Effort:** M

### FR-063 — Auditor release and dedicated audit view  (M / V1)

**Acceptance criteria:** Auditor release and audit view as today (applied in the browser), demonstrated with synthetic personas.

- **Status:** BUILT
- **Current state:** Once an L2 section is approved, `ConsolidatedSectionView` shows "Release to Audit" / "Withdraw from audit". The browser limits this to assigned owners and Editor/Admin seats (`canReleaseToAudit` in `EditorView`; `toggleReleaseToAudit` persists to `audit-releases`). `AuditorView.tsx` (route `/auditview`) shows only released and approved L2 groups, with content, data points, evidence and a PDF download of the released sections (`generateAndDownloadPdf`). The personas come from the editor's "View as" switch (Admin/Editor/Owner/Input Provider/Guest, with synthetic names from `reportSections.ts`).
- **V1 gap:** None.
- **Today-note:** Partly accurate. "Enforced in the browser" covers only the release gating and the released-and-approved filter. The "View as" switch has no Auditor seat, and nothing confines an auditor to the Audit View: it and every other page are in the nav for any signed-in user. The `auditor` role exists only in `workflowRoles.ts`/`directoryResolver.ts` (persona "KPMG Assurance").
- **Effort:** -

### FR-064 — "Send to" requests from any page  (M / V1)

**Acceptance criteria:** As today, using the app's synthetic user directory.

- **Status:** BUILT
- **Current state:** The global top bar in `App.tsx` opens `SendToDialog.tsx` on every page. `resolveRecipient` (`sendTo.ts`) matches the synthetic `AD_USERS` directory, or accepts an unknown `@novartis.com` address as an "auto-provisioned Guest" (shown in the preview and toast; nothing is stored). Sending appends a `kind: 'request'`, `status: 'assigned'` thread to the RNFM comments document; there is no notification code (no SNS/SES anywhere).
- **V1 gap:** None.
- **Today-note:** Matches. Requests always target an RNFM subsection (the picker lists `reportSections` whatever report is active), and the sender is recorded as the login alias with `authorRole: 'editor'`.
- **Effort:** -

### FR-066 — Extensible to the wider report suite  (M / V1)

**Acceptance criteria:** The UPC, the ESG Index and the ASRS are shown with seeded content alongside the Sustainability Statement (RNFM), as today. The build focuses on these four reports.

- **Status:** BUILT
- **Current state:** `reports.ts` defines six reports for the sidebar switcher: rnfm, esg-index, upc, asrs (labelled "ISSB (AU)"), tcfd-uk and hrs. The non-RNFM reports render seeded content through `ScopedViews.tsx` (`getReportDataset` in `reportData.ts`) and `ParallelReportView.tsx` (`upc.ts`, `asrs.ts`, `esgIndex.ts`, `localReports.ts`). Only RNFM has saved authoring state (`RestAdapter` `REPORT_ID = 'rnfm'`).
- **V1 gap:** None against the AC. Agreed 3 Nov (`DECISIONS.md` D4): seed the UPC report from the UPC 2026 template (`data/UPC 2026_WIP_draft template for Studio_2026 10 29.docx`). `upc.ts` already uses the template's nine columns; the sections differ (the template groups People and culture and Ethics, Risk and Compliance under Business fundamentals and adds Forward-looking statements and a Disclaimer), and its 2026 values are `xx`. Label the second year column of the People and culture table 2025. UK TCFD and HRS are still in the switcher, and the AC does not say whether to hide them; that is a decision, not development work.
- **Today-note:** Matches.
- **Effort:** S (agreed 3 Nov)

### FR-067 — One current Claude model for all capabilities  (M / V1)

**Acceptance criteria:** One Claude model on Amazon Bedrock for all capabilities, chosen with Novartis from the models available in the target region. The prototype's model has reached end of life, so the build moves to a current model; this needs a configuration change, a matching permission for the model, and a check of the request settings.

- **Status:** PARTIAL
- **Current state:** All five capabilities in `backend/ai.py` (`chat`, `peer_chat`, `draft_section`, `compliance_explain`, `analyze_section`) call the Converse API with one `BEDROCK_MODEL_ID`. Both the code default and `ecs.tf` set it to `anthropic.claude-3-haiku-20240307-v1:0`. The task role allows `bedrock:InvokeModel*` only on `arn:aws:bedrock:*::foundation-model/*` (no inference-profile ARN). Each call sends `temperature` 0.1–0.3 and `maxTokens` 900–1400, and the reply parser reads `content[0]['text']`.
- **V1 gap:** Set `BEDROCK_MODEL_ID` (and `BEDROCK_REGION` if needed) in `ecs.tf`, and the `ai.py` default, to the model chosen with Novartis. Add the matching IAM resource: the inference-profile ARN if that model is profile-only, which the `ai.py`/`ecs.tf` comments say is the case for 4.x models. Check that the model accepts the `temperature` and `maxTokens` values sent, make the parser take the first `text` block instead of `content[0]`, and re-run the AI checks in `smoke-prod.sh`.
- **Today-note:** Matches. The single model id is confirmed; end-of-life status cannot be checked from the code.
- **Effort:** S

### FR-068 — AI content governance (DDIT)  (M / V1)

**Acceptance criteria:** As today. Note that the roll-forward baseline marked as an AI draft is produced by a template, not a model call (FR-004); the build corrects that labelling.

- **Status:** PARTIAL
- **Current state:** AI datapoint drafts are inserted as pending tracked changes with `origin: 'ai'`, author "AI Draft Assistant", a `reason` and a `drRef` (`EditorView.handleAiDraftDatapoint`). The roll-forward is shown as a redline against FY2025 with one summary line (`RollForwardRedline` in `RollForwardCompare.tsx`) and needs one "✓ Accept AI draft as working base" per subsection (`acceptAiBaseline`, which must happen before "mark updated"); nothing highlights AI text afterwards (no component imports `aiProvenance.ts`). The FY2026 roll-forward text is a regex year swap (`rollForwardText` in `reportSections.ts`: 2024→2025, 2025→2026), yet it is labelled as AI throughout: "AI rolled/carried this section forward…", "the baseline the AI rolled forward", "The AI produced this draft…", and the provenance model `'claude-sonnet-4-6 (Bedrock AgentCore)'`.
- **V1 gap:** Relabel the roll-forward as a rule-based carry-forward rather than AI output: in `RollForwardCompare.tsx`; in the EditorView banner, button, toasts and version note; and in the `ROLL_FORWARD_MODEL`/`MODEL` provenance in `reportSections.ts`/`aiProvenance.ts`. Update the e2e selectors that match these strings (`workflow.spec.ts`, `track-changes.spec.ts`, `editor.smoke.spec.ts`). A related labelling problem: where no real FY2025 text exists, EditorView builds the "FY2025 approved" baseline by replacing 2026 with 2025 in the current text (`priorYearText`), and still presents it as approved prior-year text.
- **Today-note:** Partly wrong. The `ai-baseline` document stores only section ids, but `acceptAiBaseline` also freezes a version (`makeVersion` via `appendVersions`) with `snapshotBy` (the "View as" persona) and `snapshotAt`. Who accepted, and when, is therefore recorded in the version history.
- **Effort:** S

### FR-069 — Advisory per-subsection edit locks  (M / V1)

**Acceptance criteria:** Per-subsection edit locks as today: advisory, applied in the browser and refreshed when a page is opened. Each report section is stored as one document and the last save wins, so build users edit one subsection at a time. Conflict-safe saving is a future enhancement.

- **Status:** N/A-STAYS-FUTURE
- **Current state:** Locks (`SectionLock` in `sectionLocks.ts`) are one `locks` document, read once when the Report Editor mounts (no polling). They show as "In use by …" with take-over and a queue (`acquireLock`, `takeOverLock`), are released on save or cancel, and are enforced only in the browser. Every save PUTs whole documents (`handleSaveEdit` → `api.report.sections.set(updatedSections)`, likewise `changes`, `versions` and `comments`), and the backend's `put_doc` overwrites without a condition, so the last write wins.
- **V1 gap:** None; conflict-safe saving stays a future enhancement.
- **Today-note:** Matches, but the AC assumption that "each report section is stored as one document" is wrong. All subsections of a report are one document (`REPORT#rnfm` / `sections`), so two users saving *different* subsections from pages loaded before each other's saves can still overwrite each other. The safe rule is one person saving at a time per report, reloading the page before editing. Risk (not verified): whole-report documents such as `versions`, which holds full-content snapshots, grow toward DynamoDB's 400 KB item limit.
- **Effort:** -

### FR-070 — Section view of all subsections as one document  (M / V1)

**Acceptance criteria:** As today.

- **Status:** BUILT
- **Current state:** Selecting an L2 topic in `SectionSidebar` (`onSelectL2`) renders `ConsolidatedSectionView.tsx`, which shows every subsection under that L2 as one continuous document (`contentToHtml`). Each subsection has Edit and Comment actions, and the view carries the L2 owner sign-off and release to audit.
- **V1 gap:** None.
- **Today-note:** Matches. "Edit" opens the single-subsection editor; it does not edit inline in the combined view, despite the component's header comment.
- **Effort:** -

### FR-071 — Flag data not yet available  (M / V1)

**Acceptance criteria:** As today.

- **Status:** BUILT
- **Current state:** In `RollForwardChecklist.tsx`, seats with edit rights can mark a roll-forward item as `flagged`; the items come from `rollForwardItemsFor`, which returns seeded or auto-detected year, target and metric snippets. The flag is saved in `rollforward` (`EditorView.resolveRollForward`), and `ContentViewer.highlightFlags` wraps the flagged snippets in a pink `<mark>` (#fce7f3) titled "data not yet available".
- **V1 gap:** None.
- **Today-note:** Matches.
- **Effort:** -

### FR-072 — Footnotes  (M / V1)

**Acceptance criteria:** Footnotes can be added and edited, and are rendered as numbered notes at the end of each section in the Word and PDF exports, as today.

- **Status:** BUILT
- **Current state:** The rich editor's "⁋ Footnote" button inserts an inline `[^ text ]` marker (`RichContentEditor.handleInsertFootnote`), which is edited as ordinary text. `ContentViewer` shows superscript markers and a numbered list. Both exports number the footnotes per subsection and add a "Footnotes" block at its end (`exportDocx.ts` `extractFootnotes`/`buildFootnotesBlock`; `exportPdf.ts` `cleanInline`).
- **V1 gap:** None against the AC.
- **Today-note:** Matches. Verified rendering defects that the AC does not require fixing: in Word, the superscript markers are appended at the end of the paragraph, markers inside bullet items are dropped, and `## ` headings keep the raw `[^ … ]`. In the PDF, footnote markers appear as `[n]`, the same form as the citation markers left in the text.
- **Effort:** -

### FR-073 — Disclosure checklist: manual upload or SharePoint sync  (M / V1)

**Acceptance criteria:** Manual versioned upload as today; SharePoint sync is outside CDE (Section 2.2).

- **Status:** BUILT
- **Current state:** `DatapointChecklistPanel.tsx` on the Upload page provides a manual, versioned CSV upload (gated by `canManageKnowledgeBase(alias)`) and keeps prior versions in `history`. No SharePoint or URL connector exists, only roadmap text in the panel and in `datapointChecklist.ts`.
- **V1 gap:** None; SharePoint sync stays outside CDE. The DynamoDB item-size risk is under FR-059.
- **Today-note:** Matches. The upload accepts CSV only, so an Excel checklist must be exported to CSV first.
- **Effort:** -

## Security scan (ProtoShield v0.17.2)

Scan of the handover code on 30 Oct 2026. Details and residual risks are in `docs/SECURITY-SCAN.md`.

| Scanner | Critical | High | Medium | Low |
|---|---|---|---|---|
| Semgrep, Secrets, IAM least-privilege | 0 | 0 | 0 | 0 |
| CVE (dependencies) | 0 | 0 | 6 | 1 |
| Checkov (Terraform) | 0 | 0 | 36 | 0 |
| Bandit | 0 | 0 | 0 | 137 (asserts in tests) |
| License headers | 0 | 140 | 0 | 0 |

- **Fixed before handover:** critical and high dependency CVEs (backend installs from a hashed lock file; jsPDF 4.2.1, PDF output unchanged); ECS task role narrowed to four DynamoDB actions on one table and the configured Bedrock model; unused S3 permissions removed; Knowledge Base data-access policy narrowed.
- **License headers:** no LICENSE file and no license header in source files. The license is not yet decided.
- **Remaining medium:** dependency CVEs in idna, react-router, react-router-dom and @tiptap/core (major upgrade); Checkov hardening items (no WAF, HTTP between CloudFront and the load balancer, AWS-managed KMS keys, open egress, limited logging).

## Not verified

- The 6 Playwright failures (pre-existing; cause not investigated).
- Model availability in the Novartis account and region.
- The FY27 blueprint (not yet shared), which sizes FR-018 and settles the final placements in FR-019.
- Runtime growth of the single-item DynamoDB documents against the 400 KB limit.
