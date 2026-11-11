# Novartis ESG Studio — UAT / Acceptance Checklist

A running list of changes delivered, each with a **test scenario**, **expected
result**, and **how to tell real AI from the fallback** where relevant. Run
these against the live site when you're ready to validate.

- **Live site:** the deployed app URL
- **AWS account:** the target account (us-east-1).

## Automated tests (run before/after any change)
One command runs all four layers (offline — no AWS/live backend needed):
```
PYTHON=/path/to/venv/bin/python ./scripts/test-all.sh      # or just ./scripts/test-all.sh if python3 has the deps
```
Layers: backend **pytest** (41 — store + AI routes, mocked DynamoDB/Bedrock),
frontend **tsc**, frontend **Vitest** (25 — api/ adapters + aiClient + Local/Rest
port contract), frontend **Playwright** (102 E2E, LocalAdapter build).
`SKIP_E2E=1` skips the slow Playwright layer for a quick inner loop.

_Note: the automated suites run in **local/mocked** mode. Real-backend + real-AI
verification is the live smoke script + the manual UAT below._

### Live smoke test against the DEPLOYED backend
`scripts/smoke-prod.sh` automates the post-deploy verification (health, auth
enforcement, a DynamoDB round-trip, and each AI route incl. real-AI-vs-fallback).
Safe against prod — it only uses a throwaway report id (`__smoke`) and deletes
what it writes; it never touches real report data.

```
# Unauthenticated checks only (health + 401s):
./scripts/smoke-prod.sh

# Full run (adds DynamoDB round-trip + AI real-vs-fallback):
ID_TOKEN=eyJ... ./scripts/smoke-prod.sh
```
**Getting the ID token** (short-lived, ~1h): log in to the live site → DevTools →
Console → run, and paste the result:
```js
(()=>{const k=Object.keys(localStorage).find(k=>/CognitoIdentityServiceProvider\..*\.idToken$/.test(k));if(k){copy(localStorage.getItem(k));return 'idToken copied';}return 'not logged in?';})()
```
Each AI check reports **REAL AI** (200, no fallback signature) or **FELL BACK**
(200 but matched the graceful-fallback phrase / null) — the definitive
real-vs-sim proof without reading server logs.

## ⚠️ Before you test — ALWAYS hard-refresh first
The app is a single-page app. After any deploy it keeps the OLD JavaScript in
memory until a full reload, so you can see stale behaviour (e.g. an AI chat
returning a canned "no data" message without ever calling the backend).
**Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows).**

To confirm you're on the current build: DevTools → Network → reload → the main
script should be the bundle named in "Deployed versions" below.

## Deployed versions (update on each deploy)
_As of 2026-07-16:_
- **Frontend bundle:** `index-Bwabu_Rb.js`
- **Backend:** ECS task-def `novartis-esg-ai-enabled-sust-api:4`, image `2584fca`
- **AI model:** Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) via Bedrock
- **Data mode:** `VITE_API_MODE=rest` (frontend reads/writes the DynamoDB backend)

---

## How to tell REAL AI from the FALLBACK
Every AI feature falls back silently to a canned/deterministic response if the
backend or model is unreachable — so "I got an answer" is NOT proof of real AI.
Use one of these:

| Check | Real AI | Fallback |
|---|---|---|
| **Network tab** (DevTools) | a POST to `ai/chat` or `ai/peer` → **200** with a JSON body | no such request, or it failed (4xx/5xx/blocked) |
| **Answer content** | novel, synthesised, **varies** if you re-ask the same question | a fixed template — e.g. *"I don't have specific peer benchmark data on that topic…"* or *"…temporarily unavailable"* |
| **Server logs** (definitive) | CloudWatch `/ecs/novartis-esg-ai-enabled-sust`: `POST …200` with **no** `converse failed` line nearby | a `Bedrock … converse failed: …` line showing the exact reason |

---

## 1. Backend data persistence (cutover to DynamoDB)
The app now reads/writes a real backend (DynamoDB via FastAPI on ECS) instead of
browser localStorage.

- **Scenario:** Open a section in the Report Editor, make an edit, save it.
  Then open the same report in a **different browser or an incognito window**
  and log in.
- **Expected:** the edit is present in the other browser (state is server-side,
  not per-browser). Reloading also preserves it.
- **Verify (optional):** DevTools → Network → editing/saving fires POST/PUT
  requests to `/api/reports/rnfm/...` returning 200.
- **Note:** the report starts from seeded content; "Reset Demo" restores seeds.

## 2. Editor — bullet lists render correctly in both views
- **Scenario:** Open a section with a bullet list (e.g. **7.1.1** Board of
  Directors oversight). View it in **Clean view**, then switch to **Editor view**.
- **Expected:** bullets render as a real bulleted list in BOTH views — no raw
  "`- `" dashes shown as text, and the two views look consistent.

## 3. Editor (track changes) — removing a bullet
_Requires the track-changes editor: append `?ff_trackChangesEngine=on` to the
/editor URL, or set `localStorage.setItem('ff:trackChangesEngine','true')`._

- **Scenario A (structural):** In a bulleted section, put the cursor at the very
  **start** of a bullet line and press **Backspace**.
  - **Expected:** the bullet is removed (the item lifts/joins) — it does NOT get
    stuck as a red deletion mark.
- **Scenario B (delete + accept):** Select a whole bullet's text, delete it (it
  shows red/struck-through), then click **Accept** (or Accept all).
  - **Expected:** the text AND the now-empty bullet are both removed — no empty
    bullet left behind.

## 4. AI — in-editor assistant chat (REAL Bedrock)
- **Scenario:** Open a section → open the **AI Assistant** panel → **Chat** tab.
  Ask: *"Draft a sentence on our climate transition plan."*
- **Expected:** a real, section-relevant answer with a **PROPOSED TEXT** you can
  "Insert as tracked change". It should **not invent specific figures** (it will
  say to confirm any number). Re-asking gives slightly different wording.
- **Real-vs-fallback:** Network tab shows `ai/chat` → 200. Fallback message is
  *"The AI assistant is temporarily unavailable…"*.

## 5. AI — Peer Benchmarking Q&A (REAL Bedrock)
_Peer Benchmarking is a TAB inside the **Analysis** nav item (not a top-level
entry)._

- **Scenario:** Analysis → **Peer Benchmarking** tab. Ask something the old
  keyword sim could NOT answer, e.g. *"Rank these peers by how ambitious their
  net-zero target year is."*
- **Expected:** a real comparative answer synthesised across Roche / AstraZeneca
  / Pfizer / GSK / Sanofi, grounded ONLY in the indexed corpus, with **reporting
  years labelled** and source **citations**. It says "not disclosed" rather than
  inventing where the corpus lacks data.
- **Real-vs-fallback:** Network tab shows `ai/peer` → 200. The fixed message
  *"I don't have specific peer benchmark data on that topic… Try asking about…"*
  means it fell back (usually stale cache — hard-refresh and retry).

## 6. AI — Draft a datapoint (REAL Bedrock)
- **Scenario:** Open a section (ideally one with prior-year content, e.g. an
  **8.1.x** climate subsection) → click **"✦ AI: Draft datapoint"** → enter a
  disclosure requirement, e.g. `ESRS-E1-4`.
- **Expected:** a real drafted paragraph is inserted as an AI-origin **tracked
  change** (accept/reject). It rolls the prior-year narrative forward, addresses
  the DR, and uses placeholders like `[confirm FY2026 figure]` instead of
  inventing numbers.
- **Real-vs-fallback:** Network tab shows `ai/draft` → 200 with a `text` body.
  If it falls back, the inserted text is the fixed *"[AI proposed] Draft
  narrative addressing … grounded in the knowledge base …"* placeholder.

## 7. AI — Compliance gap rationale (REAL Bedrock)
- **Scenario:** Analysis → **Compliance** → **Gap Analysis** view → filter to
  `partial` or `missing` → expand a datapoint row → click **"✦ Explain with AI"**.
- **Expected:** a fresh rationale ("why partial/missing") + a suggested fill,
  grounded in the standard's requirement text, replaces the seeded text for that
  row (tagged **✦ AI**). Suggested fill uses `[confirm …]` placeholders, not
  invented figures.
- **Real-vs-fallback:** Network tab shows `ai/compliance` → 200. On failure the
  row keeps its original (seeded) rationale and a toast says the AI explanation
  was unavailable.
- **Scope note:** the covered/partial/missing **status** itself is still the
  seeded assessment — only the rationale + fill are model-generated.
- **Grounding (RAG-lite):** the rationale/fill (and AI drafts) are grounded via
  retrieval over real Novartis source text (RNFM FY2025, Style Guide, ESRS/IFRS/
  policy refs). Compliance shows a **"✦ Grounded in: …"** line naming the
  sources. Keyword retrieval over shipped docs; the full vector Knowledge Base
  is written as IaC (`infrastructure/knowledge-base.tf`) but not yet provisioned.

## 8. AI — section Review tab (REAL Bedrock)
- **Scenario:** open a section → **AI Assistant** → **Review** tab. (To force an
  issue, edit the text to include e.g. "committed to to", "CO2", "per cent", or a
  stale year.)
- **Expected:** model-found typo/style/consistency flags appear ("✦ AI reviewing…"
  while it loads); each **Apply as tracked change** inserts the fix. Flags are
  validated server-side so the highlighted span always matches the text.
- **Real-vs-fallback:** Network tab shows `ai/analyze` → 200 with `{flags:[…]}`.
  If it fell back, the header reads "Automated …" (regex) instead of "✦ AI …".

---

## Known limitations (by design, for context)
- **AI grounding is not yet RAG.** The editor chat is grounded on the current
  section text; peer benchmarking on a curated corpus. No vector knowledge base
  / document ingestion yet.
- **Model is Claude 3 Haiku** (MVP: cheap/fast, minimal IAM). Higher-quality 4.x
  models are a config + IAM change later (see the backend-architecture notes).
- **Compliance coverage STATUS is still seeded.** The "Explain with AI" rationale
  and fill are real, but the covered/partial/missing classification is a curated
  truth set, not a live model re-scan of section text (a bigger future item).
- **All in-editor AI is now real** (Bedrock): chat, peer benchmarking,
  Draft-datapoint, compliance rationale, retrieval grounding, and the Review-tab
  typo/style/consistency analyzer. The regex analyzer remains only as the
  offline/error fallback.
- **Only the RNFM report is seeded** in DynamoDB; other reports render from code
  seeds until edited/saved.

## Rollback (if a deploy misbehaves)
- **Frontend:** redeploy the previous bundle, or set `VITE_API_MODE=local` +
  `./deploy-frontend.sh` (app returns to browser-localStorage, AI uses the sim).
- **Backend:** point the ECS service back to the prior task-def revision.
