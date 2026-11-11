"""API routes backing the frontend data-access ports.

Every route here corresponds 1:1 to a call in frontend/src/api/RestAdapter.ts.
The frontend stores each resource as a single JSON document; these routes read
and write those documents in DynamoDB via `store`.

Contract notes:
- GET returns the stored JSON value. When no document exists we return HTTP 404
  (not an empty body) so the frontend adapter falls back to its seed/default —
  the same branch `localStorage.getItem` returning null used to take.
- PUT accepts the raw JSON value (a list, object, string, or null) as the body
  and replaces the document.
- DELETE removes a document (used by `clear`), and is idempotent (deleting an
  absent item is a no-op, returns 204).
- Auth is enforced by the router-level Depends(get_current_user) in main.py; the
  authenticated alias is available per-route for audit/ownership if needed.

ROUTE ORDER MATTERS: Starlette matches in declaration order, and several paths
share a prefix. The specific report sub-routes (reset, tracked-drafts) are
declared BEFORE the generic /reports/{report_id}/{resource} routes so the
generic {resource} param never captures "reset" or "tracked-drafts".
"""
import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from auth import get_current_user
from store import (
    store, is_missing, REPORT_RESOURCES, STRUCTURE_RESOURCES,
)
import ai
import admin_config

router = APIRouter(tags=['api'])

# Admin allowlist (aliases), set at deployment via env ADMIN_ALIASES
# (comma-separated). Empty by default: no user is an admin until configured.
# Mirrors the frontend's structure-admin allowlist (frontend/src/data/permissions.ts).
_ADMIN_ALIASES = {
    a.strip().lower() for a in os.environ.get(
        'ADMIN_ALIASES', ''
    ).split(',') if a.strip()
}


def require_admin(alias: str = Depends(get_current_user)) -> str:
    """Gate a route to admins. `get_current_user` already validated the JWT; here
    we additionally require the alias to be an administrator."""
    if alias.lower() not in _ADMIN_ALIASES:
        raise HTTPException(403, 'Admin access required')
    return alias


async def _json_body(request: Request):
    """Parse the request body as JSON (any value: list/object/string/null)."""
    try:
        return await request.json()
    except Exception:
        raise HTTPException(400, 'Request body must be valid JSON')


# ---------------------------------------------------------------------------
# Reset the whole report authoring state (Reset Demo). Declared first so the
# generic {resource} routes below never capture "reset".
# ---------------------------------------------------------------------------
@router.post('/reports/{report_id}/reset', status_code=204)
async def reset_report(report_id: str):
    store.reset_report(report_id)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Tracked-draft side-channel. clearAll (DELETE with no section id) and the
# keyed routes are declared before the generic {resource} routes so
# "tracked-drafts" is never treated as a report resource.
# ---------------------------------------------------------------------------
@router.delete('/reports/{report_id}/tracked-drafts', status_code=204)
async def clear_tracked_drafts(report_id: str):
    store.clear_tracked_drafts(report_id)
    return Response(status_code=204)


@router.get('/reports/{report_id}/tracked-drafts/{section_id}')
async def get_tracked_draft(report_id: str, section_id: str):
    value = store.get_tracked_draft(report_id, section_id)
    if is_missing(value):
        raise HTTPException(404, 'Not found')
    return value


@router.put('/reports/{report_id}/tracked-drafts/{section_id}')
async def put_tracked_draft(report_id: str, section_id: str, request: Request):
    value = await _json_body(request)
    store.put_tracked_draft(report_id, section_id, value)
    return value


@router.delete('/reports/{report_id}/tracked-drafts/{section_id}', status_code=204)
async def delete_tracked_draft(report_id: str, section_id: str):
    store.delete_tracked_draft(report_id, section_id)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Report-scoped channels: /api/reports/{report_id}/{resource}
# ---------------------------------------------------------------------------
@router.get('/reports/{report_id}/{resource}')
async def get_report_resource(report_id: str, resource: str):
    if resource not in REPORT_RESOURCES:
        raise HTTPException(404, f'Unknown report resource: {resource}')
    value = store.get_report_resource(report_id, resource)
    if is_missing(value):
        raise HTTPException(404, 'Not found')
    return value


@router.put('/reports/{report_id}/{resource}')
async def put_report_resource(report_id: str, resource: str, request: Request):
    if resource not in REPORT_RESOURCES:
        raise HTTPException(404, f'Unknown report resource: {resource}')
    value = await _json_body(request)
    store.put_report_resource(report_id, resource, value)
    return value


@router.delete('/reports/{report_id}/{resource}', status_code=204)
async def delete_report_resource(report_id: str, resource: str):
    if resource not in REPORT_RESOURCES:
        raise HTTPException(404, f'Unknown report resource: {resource}')
    store.delete_report_resource(report_id, resource)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Structure admin channel: /api/structure/{resource}
# ---------------------------------------------------------------------------
@router.get('/structure/{resource}')
async def get_structure(resource: str):
    if resource not in STRUCTURE_RESOURCES:
        raise HTTPException(404, f'Unknown structure resource: {resource}')
    value = store.get_structure(resource)
    if is_missing(value):
        raise HTTPException(404, 'Not found')
    return value


@router.put('/structure/{resource}')
async def put_structure(resource: str, request: Request):
    if resource not in STRUCTURE_RESOURCES:
        raise HTTPException(404, f'Unknown structure resource: {resource}')
    value = await _json_body(request)
    store.put_structure(resource, value)
    return value


@router.delete('/structure/{resource}', status_code=204)
async def delete_structure(resource: str):
    if resource not in STRUCTURE_RESOURCES:
        raise HTTPException(404, f'Unknown structure resource: {resource}')
    store.delete_structure(resource)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Uploaded source files: /api/uploads
# ---------------------------------------------------------------------------
@router.get('/uploads')
async def get_uploads():
    value = store.get_uploads()
    if is_missing(value):
        raise HTTPException(404, 'Not found')
    return value


@router.put('/uploads')
async def put_uploads(request: Request):
    value = await _json_body(request)
    store.put_uploads(value)
    return value


# ---------------------------------------------------------------------------
# AI — in-editor chat (Bedrock). Body: { prompt, sectionTitle?, sectionContent?,
# evidenceName? } → { answer, proposedText? }. The answer + any proposed text are
# returned for the frontend to surface; insertion still goes through the
# tracked-change accept path client-side. On a model/transport failure we return
# a graceful answer (HTTP 200) rather than a 500 so the editor chat stays usable.
# ---------------------------------------------------------------------------
@router.post('/ai/chat')
async def ai_chat(request: Request):
    body = await _json_body(request)
    if not isinstance(body, dict):
        raise HTTPException(400, 'Body must be a JSON object')
    prompt = body.get('prompt', '')
    if not isinstance(prompt, str) or not prompt.strip():
        raise HTTPException(400, 'prompt is required')
    try:
        return ai.chat(
            prompt=prompt,
            section_title=str(body.get('sectionTitle', '')),
            section_content=str(body.get('sectionContent', '')),
            evidence_name=(body.get('evidenceName') or None),
        )
    except ai.AiError:
        # Don't 500 the editor — return a usable fallback message.
        return {
            'answer': (
                'The AI assistant is temporarily unavailable. You can keep '
                'editing; try again in a moment, or draft the text manually and '
                'the reviewer can refine it.'
            ),
            'proposedText': None,
        }


# ---------------------------------------------------------------------------
# AI — peer benchmarking Q&A (Bedrock). Body: { question, corpus } → { answer,
# citations }. The corpus (peer companies + benchmark answers + citations) is
# supplied by the frontend, which owns peerBenchmarking.ts — the backend stays
# stateless and grounds the model strictly on that text. Graceful fallback on
# model/transport failure so the benchmarking chat stays usable.
# ---------------------------------------------------------------------------
@router.post('/ai/peer')
async def ai_peer(request: Request):
    body = await _json_body(request)
    if not isinstance(body, dict):
        raise HTTPException(400, 'Body must be a JSON object')
    question = body.get('question', '')
    if not isinstance(question, str) or not question.strip():
        raise HTTPException(400, 'question is required')
    corpus = body.get('corpus', '')
    if not isinstance(corpus, str) or not corpus.strip():
        raise HTTPException(400, 'corpus is required')
    try:
        return ai.peer_chat(question=question, corpus=corpus)
    except ai.AiError:
        return {
            'answer': (
                'The peer benchmarking assistant is temporarily unavailable. '
                'Please try again in a moment.'
            ),
            'citations': [],
        }


# ---------------------------------------------------------------------------
# AI — draft generation (Bedrock). Body: { sectionTitle, drRef, topic?,
# priorYearText? } → { text }. Generates a first-draft paragraph for a subsection
# addressing a disclosure requirement, rolling the prior-year narrative forward
# when supplied. The frontend inserts the text as an AI-origin tracked change.
# On failure returns { text: null } so the editor can fall back to a placeholder.
# ---------------------------------------------------------------------------
@router.post('/ai/draft')
async def ai_draft(request: Request):
    body = await _json_body(request)
    if not isinstance(body, dict):
        raise HTTPException(400, 'Body must be a JSON object')
    dr_ref = body.get('drRef', '')
    if not isinstance(dr_ref, str) or not dr_ref.strip():
        raise HTTPException(400, 'drRef is required')
    try:
        return ai.draft_section(
            section_title=str(body.get('sectionTitle', '')),
            dr_ref=dr_ref,
            topic=str(body.get('topic', '')),
            prior_year_text=str(body.get('priorYearText', '')),
        )
    except ai.AiError:
        # Signal failure to the client; it will insert a placeholder instead.
        return {'text': None}


# ---------------------------------------------------------------------------
# AI — compliance gap rationale (Bedrock). Body: { drId, title, status,
# sectionTitle?, requirementText? } → { rationale, suggestedFill }. Explains why
# a DR is covered/partial/missing for a subsection and proposes fill text,
# grounded in the supplied requirement text. On failure returns nulls so the UI
# keeps its seeded rationale.
# ---------------------------------------------------------------------------
@router.post('/ai/compliance')
async def ai_compliance(request: Request):
    body = await _json_body(request)
    if not isinstance(body, dict):
        raise HTTPException(400, 'Body must be a JSON object')
    dr_id = body.get('drId', '')
    if not isinstance(dr_id, str) or not dr_id.strip():
        raise HTTPException(400, 'drId is required')
    try:
        return ai.compliance_explain(
            dr_id=dr_id,
            title=str(body.get('title', '')),
            status=str(body.get('status', '')),
            section_title=str(body.get('sectionTitle', '')),
            requirement_text=str(body.get('requirementText', '')),
        )
    except ai.AiError:
        return {'rationale': None, 'suggestedFill': None}


# ---------------------------------------------------------------------------
# AI — section review (Bedrock). Body: { content } → { flags: [...] }. Model-
# driven typo/style/consistency flags, each validated server-side so `original`
# is a real substring (safe for the frontend's literal find-replace). On failure
# returns { flags: null } so the editor falls back to the regex analyzer.
# ---------------------------------------------------------------------------
@router.post('/ai/analyze')
async def ai_analyze(request: Request):
    body = await _json_body(request)
    if not isinstance(body, dict):
        raise HTTPException(400, 'Body must be a JSON object')
    content = body.get('content', '')
    if not isinstance(content, str):
        raise HTTPException(400, 'content must be a string')
    try:
        return ai.analyze_section(content)
    except ai.AiError:
        return {'flags': None}


# ---------------------------------------------------------------------------
# ADMIN — app-wide config (tunable AI prompts, global context, thresholds) +
# knowledge-base refresh. All admin-gated (require_admin). Config is a single
# doc read by the AI routes at call time, so changes apply with no redeploy.
# ---------------------------------------------------------------------------
@router.get('/admin/config')
async def get_admin_config(_admin: str = Depends(require_admin)):
    return admin_config.merge_defaults(store.get_admin_config())


@router.put('/admin/config')
async def put_admin_config(request: Request, _admin: str = Depends(require_admin)):
    body = await _json_body(request)
    if not isinstance(body, dict):
        raise HTTPException(400, 'Config must be a JSON object')
    # Merge over defaults so the stored doc is always complete + well-shaped, and
    # unknown top-level keys are dropped (can't inject arbitrary state).
    merged = admin_config.merge_defaults(body)
    store.put_admin_config(merged)
    return merged


@router.post('/admin/kb/refresh')
async def admin_kb_refresh(request: Request, admin: str = Depends(require_admin)):
    """Trigger a knowledge-base refresh / re-embed. Real ingestion sync lands
    when the Bedrock KB is provisioned (see infrastructure/knowledge-base.tf);
    for now this records the request + returns a queued job so the admin UI and
    the audit trail reflect it."""
    import time
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    cfg = admin_config.merge_defaults(store.get_admin_config())
    cfg['kb'] = {'lastRefreshRequestedAt': now, 'lastRefreshBy': admin, 'status': 'queued'}
    store.put_admin_config(cfg)
    kb_live = bool(os.environ.get('BEDROCK_KB_ID'))
    return {
        'status': 'queued',
        'requestedAt': now,
        'requestedBy': admin,
        'live': kb_live,
        'message': (
            'Knowledge base re-embed queued.' if kb_live else
            'Recorded. A vector Knowledge Base is not yet provisioned in this '
            'environment, so no live re-embed runs — this is a no-op placeholder '
            'until the KB is enabled (infrastructure/knowledge-base.tf).'
        ),
    }
