# ESG Reporting: prototype handover (30 Oct 2026)

## Contents

| File | What it is |
|---|---|
| `ECN ESG Reporting AI Requirements Finalized_27102026.docx` | Agreed requirements. Together with `DECISIONS.md`, the binding scope; where the code differs, these documents win |
| `DECISIONS.md` | Decisions agreed with Novartis after sign-off (recorded 3 Nov 2026): section mapping for the datapoint register, inclusion decision, report structure, UPC 2026. Where they differ from the requirements, follow this file |
| `ESG-V1-Gap-Analysis.md` | Each V1 requirement against the code: 24 built, 5 stay future, 22 partial, 1 not built; 23 need work |
| `ProtoShield-Scan-2026-10-30.md` | Full security scan report of this code: 0 critical; the only high findings are missing license headers |

The code is in the repository root. Start with `README.md` (overview, local run, tests, items to fix
first), then `DEPLOYMENT.md` (deploying into an AWS account) and
`docs/SECURITY-SCAN.md` (scan results, residual risks).

## Corrections to the 27 Oct walkthrough

1. **OCR (FR-014)** is not V1; it moved to V2.
2. **Identity:** mapping to Entra ID is out of scope for this build (INT-001).
   V1 uses an Amazon Cognito user pool with named users (FR-054).
3. **Report structure:** 11 sections, 24 level-2 topics, 86 subsections. The
   figure 37 is the number of ESG Index topics, not subsections.

## Data

The repository holds public and synthetic data, excerpts from reference notes on
files Novartis shared in July 2026, and the Novartis working documents shared for
the build (`data/README.md`). Received from Novartis on 30 Oct 2026: the updated
datapoint register and the UPC 2026 template. The FY25/26 Sustainability
Statement is the FY2025 report already in `data/`; the FY27 blueprint follows
later. How they are used: `DECISIONS.md`.

## Start here

1. Set `bedrock_model_id` to a current model: the default is retired (FR-067).
2. Fix the accept-AI-change bug (FR-038) and restrict Reset Demo (FR-047).
3. Prepare the target account prerequisites in `DEPLOYMENT.md` (VPC, certificate,
   hosted zone, Cognito user pool, Bedrock model access).
