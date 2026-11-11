# Data

Only public, synthetic or Novartis-approved documents belong in this folder.
The app's report content, users and workflow data are synthetic.

## Included

| File | Source | Used by |
|---|---|---|
| `Q1_novartis-report-nonfinancial-matters-2025.pdf` | Novartis public report on non-financial matters 2025 | `scripts/build_kb_corpus.py` (builds `backend/kb_corpus.json`); source of the prior-year text in `frontend/src/data/priorYearContent.ts` |
| `Q4_EN_Novartis Communications Style Guide - March 2024.pdf` | Novartis communications style guide | `scripts/build_kb_corpus.py` |
| `Novartis Datapoint Register_291026.xlsx` | Novartis SI&S, received 30 Oct 2026. Updated disclosure checklist: one sheet, 310 datapoints across 55 DRs, header on row 3 | Not used by the code yet (FR-015, FR-019, FR-059); how to use it: `handover/DECISIONS.md` D1, D2 |
| `UPC 2026_WIP_draft template for Studio_2026 10 29.docx` | Novartis SI&S, received 30 Oct 2026. Update on Public Commitments 2026 template with dummy values (`xx`) | Not used by the code yet (FR-066 seed content); `handover/DECISIONS.md` D4 |

`backend/kb_corpus.json` (225 chunks) also contains 11 chunks from reference
notes on files Novartis shared in July 2026 (ESRS datapoint register, IFRS S1/S2
checklist, sample disclosure checklist template, sample internal policy list).
Those notes are not in this repo; the builder reads them from `customer-inputs/`
if present and skips them otherwise, so a rebuild without them drops those
chunks.

Rebuild the corpus after changing documents here:

```bash
cd backend && source .venv/bin/activate && python ../scripts/build_kb_corpus.py   # needs pypdf (requirements-dev.txt)
```

## Status of the requested inputs (requirements §2.6)

| Input | Status |
|---|---|
| Updated disclosure checklist (datapoint register) | Received 30 Oct 2026. It has no section column; sections follow the agreed rule (`handover/DECISIONS.md` D1) |
| Sustainability Statement FY25/26 | Received; identical to `Q1_novartis-report-nonfinancial-matters-2025.pdf`. The FY2026 report is in preparation at Novartis |
| FY27 report blueprint | In progress at Novartis. Until it arrives, the build uses the FY2025 structure, adjusted in the tool (D3) |
| UPC template with dummy text | Received 30 Oct 2026; used for the UPC report (D4) |

Novartis shared these files for the build and confirmed how they are used
(reply recorded 3 Nov 2026 in `handover/DECISIONS.md`).
