# Novartis ESG AI-Enabled Sustainability Report Generation

Prototype of an ESG report authoring studio: a React editor with track changes,
comments, citations and role-based workflow, a FastAPI backend on ECS Fargate,
DynamoDB storage and Amazon Bedrock for AI drafting and checks.

The binding scope is the agreed requirements document
(`handover/ECN ESG Reporting AI Requirements Finalized_27102026.docx`), refined
by the decisions agreed with Novartis since (`handover/DECISIONS.md`). Where
this code and those documents differ, the documents win.

## Status

This is a prototype, not a production system. It runs on synthetic and public
data and Novartis working documents shared for the build (`data/README.md`).
The V1 gap analysis (`handover/ESG-V1-Gap-Analysis.md`) lists what is built,
partial and missing against the agreed requirements. Items to address first:

- **Model (FR-067):** the default Bedrock model `anthropic.claude-3-haiku-20240307-v1:0`
  is retired. Set `bedrock_model_id` to a model enabled in the target account.
  Newer Claude models are called through an inference profile, so the ECS task
  policy (`infrastructure/ecs.tf`) needs the profile ARN, and some reject the
  `temperature` setting used in `backend/ai.py`.
- **Accept AI change (FR-038):** accepting an AI suggestion changes its status
  but does not write the text into the section.
- **Reset Demo (FR-047):** visible to all roles; `POST /api/reports/{id}/reset`
  has no admin check and deletes report data.
- **Comments (FR-040):** open comments cannot be closed and block sign-off.
- **AI errors (FR-055):** on failure some AI routes return placeholder text
  instead of an error.
- **Identity (FR-054):** the app needs a Cognito user pool, certificate and
  domain in the target account (see DEPLOYMENT.md).
- **Frontend roles:** role checks are client-side; the frontend allows
  structure editing when no identity is present, and its admin list
  (`frontend/src/data/permissions.ts`) holds demo aliases.

## Quick start (local, no AWS)

```bash
# Frontend (runs on browser storage, no backend needed)
cd frontend && npm ci && npm run dev          # http://localhost:5173

# Backend
cd backend && python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt           # includes requirements.txt
uvicorn main:app --reload                     # http://localhost:8000/health
```

The container image installs from the hashed `backend/requirements-lock.txt`.

## Tests

```bash
./scripts/test-all.sh            # pytest, tsc, Vitest, Playwright (offline)
SKIP_E2E=1 ./scripts/test-all.sh # without Playwright
```

## Layout

| Path | Contents |
|---|---|
| `frontend/` | React + TypeScript SPA (Vite, TipTap/ProseMirror editor) |
| `backend/` | FastAPI app, Bedrock calls (`ai.py`), DynamoDB store, local retriever, tests |
| `infrastructure/` | Terraform: ECS Fargate, ALB, ECR, DynamoDB, S3 + CloudFront, Cognito app client, ACM/Route 53, optional Bedrock Knowledge Base |
| `scripts/` | Test runner, smoke test, knowledge-base corpus builder, deck builders |
| `data/` | Source documents used by the prototype (see `data/README.md`) |
| `docs/` | Security scan record, UAT checklist, track-changes design notes |
| `CLAUDE.md` | Architecture and coding conventions |

## Further reading

- `handover/README.md`: handover notes, agreed requirements, decisions with Novartis, V1 gap analysis, scan report
- `DEPLOYMENT.md`: deploying to an AWS account
- `docs/SECURITY-SCAN.md`: latest scan results and residual risks
- `data/README.md`: what data is included and what is pending
