"""Bedrock-backed AI for the authoring studio.

First real-model capability: the in-editor AI chat. Replaces the deterministic
`respondToPrompt` sim in the frontend (frontend/src/data/aiEditor.ts) with a
real Claude call on Amazon Bedrock, grounded in the current section's context.

Design notes:
- Uses the Bedrock Converse API via boto3 `bedrock-runtime` (uniform message
  shape across Anthropic models; simpler than raw invoke_model bodies).
- The ECS task role already grants bedrock:InvokeModel (infrastructure/ecs.tf).
- Model + region come from env with sane defaults (CLAUDE.md targets
  claude-sonnet-4-6). No knowledge base / RAG yet — grounding is the section
  title + current content + an optional attached-evidence name. The answer and
  any proposed text still flow through the frontend's tracked-change accept
  path; nothing is applied to the document here.
- The client is created lazily and cached, so importing this module needs no AWS
  creds (tests patch `_client`).
"""
import logging
import os
import re
from typing import Optional

import boto3

import retrieval
import admin_config

logger = logging.getLogger('ai')


def _load_config() -> dict:
    """Load admin config for this request (append-only prompt tuning + global
    context). Never raises — falls back to defaults so AI keeps working if the
    config doc is missing or the store is unreachable."""
    try:
        from store import store
        return admin_config.merge_defaults(store.get_admin_config())
    except Exception:
        return admin_config.merge_defaults(None)


def _grounding_block(chunks: list[dict]) -> str:
    """Render retrieved chunks as a prompt grounding block."""
    lines = []
    for i, c in enumerate(chunks, start=1):
        src = c.get('source', '')
        ref = c.get('pageRef', '')
        tag = f"{src}{(' ' + ref) if ref else ''}".strip() or f'source {i}'
        lines.append(f"[{i}] ({tag}) {c.get('text', '').strip()}")
    return "\n\n".join(lines)


def _dedup_sources(chunks: list[dict]) -> list[dict]:
    """Compact, de-duplicated {source, pageRef} list for the UI to show as the
    grounding provenance (distinct from model-authored citations)."""
    seen = set()
    out = []
    for c in chunks:
        key = (c.get('source', ''), c.get('pageRef', ''))
        if key in seen or not key[0]:
            continue
        seen.add(key)
        out.append({'source': key[0], 'pageRef': key[1]})
    return out

# MVP default: Claude 3 Haiku — an ON_DEMAND foundation model, invokable directly
# via the foundation-model ARN, so it needs no inference-profile IAM (keeps the
# task role's Bedrock permission minimal). The 4.x models (e.g. sonnet-4-6) are
# INFERENCE_PROFILE-only and would require broadening IAM to inference-profile/*
# plus a `us.`-prefixed profile id — deliberately avoided for the MVP. Overridable
# via env, so switching models later is a config change (+ IAM if going 4.x).
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')
BEDROCK_REGION = os.environ.get('BEDROCK_REGION', os.environ.get('AWS_REGION', 'us-east-1'))

# Keep responses tight for an in-editor assistant; a section answer + a short
# proposed paragraph fits comfortably.
MAX_TOKENS = 1024

SYSTEM_PROMPT = (
    "You are a senior ESG sustainability report author for Novartis, helping a "
    "contributor draft and refine one subsection of the Report on Nonfinancial "
    "Matters (RNFM). You write in a precise, factual, regulator-facing style "
    "aligned with ESRS/GRI/TCFD/ISSB disclosure expectations.\n\n"
    "Rules you MUST follow:\n"
    "- Ground every statement in the section context you are given. NEVER invent "
    "specific figures, dates, targets, or percentages. If a number is needed but "
    "not supplied, say so and describe what the contributor must confirm.\n"
    "- When the user asks you to draft or revise text, return the prose to insert "
    "in a section titled 'PROPOSED TEXT:' on its own, after a short conversational "
    "reply. Keep proposed text to 1-2 short paragraphs unless asked for more.\n"
    "- Prefer prior-year comparatives, stated methodology, and assurance scope "
    "where relevant, but do not fabricate them.\n"
    "- Be concise; this is an in-editor assistant, not an essay."
)


class AiError(Exception):
    """Raised when the model call fails; the route turns this into a graceful reply."""


_cached_client = None


def _client():
    """Lazily create and cache the bedrock-runtime client (tests patch this)."""
    global _cached_client
    if _cached_client is None:
        _cached_client = boto3.client('bedrock-runtime', region_name=BEDROCK_REGION)
    return _cached_client


def _build_context(section_title: str, section_content: str, evidence_name: Optional[str]) -> str:
    parts = [f"Subsection title: {section_title or '(untitled)'}"]
    if evidence_name:
        parts.append(f"Attached evidence document: {evidence_name}")
    body = section_content.strip() if section_content else ''
    if body:
        # Cap the context so a very long section doesn't blow the token budget;
        # the head carries the topic + framing the assistant needs.
        parts.append("Current section text:\n" + body[:6000])
    else:
        parts.append("Current section text: (empty — this section has no draft yet)")
    return "\n\n".join(parts)


def _split_answer(text: str) -> dict:
    """Split the model output into a conversational answer + optional proposed text.

    The system prompt asks the model to put insertable prose after a 'PROPOSED
    TEXT:' marker. We surface that as `proposedText` so the frontend can offer
    'Insert as tracked change'. If no marker is present, the whole reply is the
    answer and there's nothing to insert.
    """
    m = re.split(r'\n?\s*PROPOSED TEXT:\s*\n?', text, maxsplit=1, flags=re.IGNORECASE)
    if len(m) == 2:
        answer = m[0].strip() or 'Here is a proposed revision:'
        proposed = m[1].strip()
        return {'answer': answer, 'proposedText': proposed or None}
    return {'answer': text.strip(), 'proposedText': None}


PEER_SYSTEM_PROMPT = (
    "You are an ESG research analyst helping a Novartis sustainability author "
    "benchmark against pharmaceutical peers (Roche, AstraZeneca, Pfizer, GSK, "
    "Sanofi). You answer natural-language questions by synthesizing a comparative "
    "answer STRICTLY from the peer benchmark corpus you are given.\n\n"
    "Rules you MUST follow:\n"
    "- Use ONLY facts present in the provided corpus. NEVER invent figures, "
    "targets, or claims. If the corpus does not cover the question, say so and "
    "point to the topics that ARE covered.\n"
    "- Reporting YEARS DIFFER by company — always state the year for a figure and "
    "never present differing-year figures as a like-for-like comparison.\n"
    "- When the corpus marks something 'not disclosed / not verifiable', say that "
    "explicitly rather than filling the gap.\n"
    "- Structure the answer by company where useful; be concise and factual.\n"
    "- After your answer, on a line by itself write 'CITATIONS:' followed by a "
    "JSON array of the citations you relied on, each {company, excerpt, pageRef, "
    "section}, copied verbatim from the corpus. Only include citations that "
    "appear in the corpus."
)


def _split_citations(text: str) -> dict:
    """Split the model output into the prose answer + a parsed citations array.

    The peer system prompt asks the model to append 'CITATIONS:' + a JSON array.
    We parse that out so the frontend can render source chips exactly as the sim
    did. If the marker is missing or the JSON is unparseable, we return the whole
    text as the answer with no citations (never fabricate citations here).
    """
    import json as _json
    m = re.split(r'\n?\s*CITATIONS:\s*', text, maxsplit=1, flags=re.IGNORECASE)
    if len(m) != 2:
        return {'answer': text.strip(), 'citations': []}
    answer = m[0].strip()
    try:
        cites = _json.loads(m[1].strip())
        if not isinstance(cites, list):
            cites = []
    except Exception:
        cites = []
    # Keep only well-shaped citation objects.
    clean = [
        {k: str(c.get(k, '')) for k in ('company', 'excerpt', 'pageRef', 'section')}
        for c in cites if isinstance(c, dict)
    ]
    return {'answer': answer, 'citations': clean}


DRAFT_SYSTEM_PROMPT = (
    "You are a senior ESG sustainability report author for Novartis, drafting one "
    "subsection of the Report on Nonfinancial Matters (RNFM). You produce a concise "
    "first draft that a human contributor will then review and refine.\n\n"
    "Rules you MUST follow:\n"
    "- Address the specified disclosure requirement (DR) for the given subsection.\n"
    "- If a prior-year narrative is provided, roll it forward as the basis — keep "
    "its structure and factual claims, advance the reporting period, and adapt to "
    "the DR. If none is provided, write a fresh but conservative draft.\n"
    "- NEVER invent specific figures, targets, dates, or percentages. Where a number "
    "is required, write a clear placeholder like '[confirm FY2026 figure]' rather "
    "than a made-up value.\n"
    "- Write 1-2 short paragraphs of regulator-facing prose. Output ONLY the draft "
    "text — no preamble, no 'here is', no headings."
)


COMPLIANCE_SYSTEM_PROMPT = (
    "You are an ESG compliance analyst specialising in ESRS/GRI/TCFD/ISSB "
    "disclosure requirements, assessing a Novartis RNFM subsection against one "
    "disclosure requirement (DR).\n\n"
    "You are told the DR, its assessed coverage status (covered / partial / "
    "missing) for a given subsection, and (when available) the verbatim "
    "requirement text from the standard. Your job:\n"
    "- Explain WHY the DR is at that status for this subsection — for 'partial', "
    "what is present vs. what is still needed; for 'missing', what the standard "
    "expects that is absent; for 'covered', what evidences the coverage.\n"
    "- Base the explanation ONLY on the requirement text and status provided. Do "
    "NOT assert specific Novartis figures or claims you were not given.\n"
    "- Then propose fill text to close the gap (for partial/missing). The fill "
    "must NOT invent figures — use placeholders like '[confirm FY2026 figure]'.\n"
    "Output the explanation, then on a line by itself 'SUGGESTED FILL:' followed "
    "by the proposed text. Omit the SUGGESTED FILL section entirely if status is "
    "'covered'. Be concise."
)


def _split_fill(text: str) -> dict:
    """Split model output into rationale + optional suggested fill."""
    m = re.split(r'\n?\s*SUGGESTED FILL:\s*\n?', text, maxsplit=1, flags=re.IGNORECASE)
    if len(m) == 2:
        return {'rationale': m[0].strip(), 'suggestedFill': (m[1].strip() or None)}
    return {'rationale': text.strip(), 'suggestedFill': None}


def compliance_explain(dr_id: str, title: str, status: str,
                       section_title: str = '', requirement_text: str = '') -> dict:
    """Explain a DR's coverage status for a subsection + suggest fill text.

    Returns {rationale, suggestedFill}. Raises AiError on model/transport failure.
    """
    if not dr_id or not dr_id.strip():
        raise AiError('empty dr_id')

    parts = [
        f"Disclosure requirement: {dr_id.strip()} — {title or '(no title)'}",
        f"Assessed coverage status for this subsection: {status or 'unknown'}",
    ]
    if section_title:
        parts.append(f"Subsection being assessed: {section_title}")
    if requirement_text.strip():
        parts.append("Verbatim requirement text from the standard:\n"
                     + requirement_text.strip()[:6000])
    else:
        parts.append("(No verbatim requirement text supplied — reason from the DR id/title.)")

    # RAG: retrieve Novartis source chunks relevant to this DR/section so the
    # suggested fill can be grounded in real prior-report/policy text.
    chunks = retrieval.retrieve(f"{title} {section_title} {dr_id}", top_k=4)
    if chunks:
        parts.append("Relevant Novartis source excerpts (ground the suggested fill in these; "
                     "cite by number):\n" + _grounding_block(chunks))
    user_message = "\n\n".join(parts)

    try:
        resp = _client().converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{'text': admin_config.augment_system_prompt(COMPLIANCE_SYSTEM_PROMPT, _load_config(), 'compliance')}],
            messages=[{'role': 'user', 'content': [{'text': user_message}]}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2},
        )
    except Exception as e:  # noqa: BLE001
        logger.error('Bedrock compliance converse failed (model=%s region=%s): %s',
                     BEDROCK_MODEL_ID, BEDROCK_REGION, e)
        raise AiError(str(e)) from e

    try:
        text = resp['output']['message']['content'][0]['text']
    except (KeyError, IndexError, TypeError) as e:
        raise AiError(f'unexpected Bedrock response shape: {e}') from e

    out = _split_fill(text)
    # Surface the grounding sources (deduped) so the UI can show what informed it.
    out['sources'] = _dedup_sources(chunks)
    return out


def draft_section(section_title: str, dr_ref: str, topic: str = '',
                  prior_year_text: str = '') -> dict:
    """Generate a first-draft paragraph for a subsection/DR. Returns {text}.

    Grounded in the prior-year narrative when available (roll-forward). Raises
    AiError on model/transport failure so the route can fall back gracefully.
    """
    if not dr_ref or not dr_ref.strip():
        raise AiError('empty dr_ref')

    parts = [f"Subsection: {section_title or '(untitled)'}"]
    if topic:
        parts.append(f"Topic area: {topic}")
    parts.append(f"Disclosure requirement to address: {dr_ref.strip()}")
    if prior_year_text.strip():
        parts.append("Prior-year (FY2025) approved narrative to roll forward:\n"
                     + prior_year_text.strip()[:6000])
    else:
        parts.append("No prior-year narrative available — write a fresh conservative draft.")

    # RAG: retrieve Novartis source chunks (prior report / policies / style) to
    # ground the draft in real material beyond just the prior-year paragraph.
    chunks = retrieval.retrieve(f"{section_title} {topic} {dr_ref}", top_k=4)
    if chunks:
        parts.append("Relevant Novartis source excerpts to ground the draft (do not copy "
                     "verbatim; do not invent figures beyond these):\n" + _grounding_block(chunks))
    user_message = "\n\n".join(parts)

    try:
        resp = _client().converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{'text': admin_config.augment_system_prompt(DRAFT_SYSTEM_PROMPT, _load_config(), 'draft')}],
            messages=[{'role': 'user', 'content': [{'text': user_message}]}],
            inferenceConfig={'maxTokens': 900, 'temperature': 0.3},
        )
    except Exception as e:  # noqa: BLE001
        logger.error('Bedrock draft converse failed (model=%s region=%s): %s',
                     BEDROCK_MODEL_ID, BEDROCK_REGION, e)
        raise AiError(str(e)) from e

    try:
        text = resp['output']['message']['content'][0]['text']
    except (KeyError, IndexError, TypeError) as e:
        raise AiError(f'unexpected Bedrock response shape: {e}') from e

    return {'text': text.strip(), 'sources': _dedup_sources(chunks)}


ANALYZE_SYSTEM_PROMPT = (
    "You are a meticulous Novartis ESG report copy-editor. You review one RNFM "
    "subsection and flag concrete issues in three categories:\n"
    "- typo: misspellings, doubled words, obvious grammar errors.\n"
    "- style: deviations from the Novartis style guide (e.g. 'CO2' should be "
    "'CO₂', numeric ranges should use an en-dash, use '%' not 'per cent', "
    "inclusive language).\n"
    "- consistency: internal inconsistencies, esp. a stale reporting year mixed "
    "with the current one, or a metric stated two different ways.\n\n"
    "The section text is given as numbered paragraphs (¶0, ¶1, ...). Return ONLY "
    "a JSON array (no prose) of at most 12 issues, each:\n"
    '  {"kind":"typo|style|consistency","paragraphIndex":<int>,'
    '"original":"<EXACT verbatim substring copied from that paragraph>",'
    '"suggestion":"<the corrected replacement for that substring>",'
    '"message":"<one-sentence explanation>"}\n'
    "CRITICAL: `original` MUST be an exact, character-for-character substring of "
    "the referenced paragraph (it is used for a literal find-and-replace). Do NOT "
    "invent issues — if the section is clean, return []. Keep `original` short "
    "(the specific span to change, not the whole paragraph)."
)


def analyze_section(content: str) -> dict:
    """Model-driven typo/style/consistency review. Returns {flags:[...]}.

    Each flag: {kind, paragraphIndex, original, suggestion, message}. The server
    VALIDATES every flag — `original` must be a real substring of the referenced
    paragraph and `kind` must be valid — so the frontend's literal find-replace
    (applyFlag) always works and the model can't inject a bogus edit. Raises
    AiError on model/transport failure.
    """
    import json as _json
    if not content or not content.strip():
        return {'flags': []}

    paras = content.split('\n\n')
    numbered = "\n\n".join(f"¶{i} {p}" for i, p in enumerate(paras))
    user_message = "Section paragraphs:\n\n" + numbered[:8000]

    try:
        resp = _client().converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{'text': admin_config.augment_system_prompt(ANALYZE_SYSTEM_PROMPT, _load_config(), 'analyze')}],
            messages=[{'role': 'user', 'content': [{'text': user_message}]}],
            inferenceConfig={'maxTokens': 1200, 'temperature': 0.1},
        )
    except Exception as e:  # noqa: BLE001
        logger.error('Bedrock analyze converse failed (model=%s region=%s): %s',
                     BEDROCK_MODEL_ID, BEDROCK_REGION, e)
        raise AiError(str(e)) from e

    try:
        text = resp['output']['message']['content'][0]['text']
    except (KeyError, IndexError, TypeError) as e:
        raise AiError(f'unexpected Bedrock response shape: {e}') from e

    # Extract the JSON array (model may wrap it in prose/fences despite instructions).
    m = re.search(r'\[.*\]', text, re.DOTALL)
    if not m:
        return {'flags': []}
    try:
        raw = _json.loads(m.group(0))
    except Exception:
        return {'flags': []}

    valid = []
    for i, f in enumerate(raw if isinstance(raw, list) else []):
        if not isinstance(f, dict):
            continue
        kind = f.get('kind')
        if kind not in ('typo', 'style', 'consistency'):
            continue
        try:
            pidx = int(f.get('paragraphIndex'))
        except (TypeError, ValueError):
            continue
        original = f.get('original')
        suggestion = f.get('suggestion')
        message = f.get('message')
        if not all(isinstance(x, str) and x for x in (original, suggestion, message)):
            continue
        # original MUST be a real substring of the referenced paragraph, else the
        # frontend's literal replace would no-op or hit the wrong span.
        if not (0 <= pidx < len(paras)) or original not in paras[pidx]:
            continue
        valid.append({
            'id': f'ai-flag-{kind}-{pidx}-{i}',
            'kind': kind, 'paragraphIndex': pidx,
            'original': original, 'suggestion': suggestion, 'message': message,
        })
    return {'flags': valid}


def peer_chat(question: str, corpus: str) -> dict:
    """Answer a peer-benchmarking question grounded in the supplied corpus.

    `corpus` is a text rendering of the peer companies + benchmark answers +
    citations (the frontend owns peerBenchmarking.ts and passes it in, so the
    backend stays stateless and there's one source of truth). Returns
    {answer, citations}. Raises AiError on model/transport failure.
    """
    if not question or not question.strip():
        raise AiError('empty question')

    user_message = (
        "PEER BENCHMARK CORPUS (the only facts you may use):\n\n"
        f"{corpus[:24000]}\n\n---\n\n"
        f"Question: {question.strip()}"
    )
    try:
        resp = _client().converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{'text': admin_config.augment_system_prompt(PEER_SYSTEM_PROMPT, _load_config(), 'peer')}],
            messages=[{'role': 'user', 'content': [{'text': user_message}]}],
            inferenceConfig={'maxTokens': 1400, 'temperature': 0.2},
        )
    except Exception as e:  # noqa: BLE001
        logger.error('Bedrock peer converse failed (model=%s region=%s): %s',
                     BEDROCK_MODEL_ID, BEDROCK_REGION, e)
        raise AiError(str(e)) from e

    try:
        text = resp['output']['message']['content'][0]['text']
    except (KeyError, IndexError, TypeError) as e:
        raise AiError(f'unexpected Bedrock response shape: {e}') from e

    return _split_citations(text)


def chat(prompt: str, section_title: str = '', section_content: str = '',
         evidence_name: Optional[str] = None) -> dict:
    """Run one in-editor chat turn against Bedrock. Returns {answer, proposedText?}.

    Raises AiError on any model/transport failure so the caller can respond
    gracefully rather than 500.
    """
    if not prompt or not prompt.strip():
        raise AiError('empty prompt')

    context = _build_context(section_title, section_content, evidence_name)
    user_message = f"{context}\n\n---\n\nContributor's request:\n{prompt.strip()}"

    try:
        resp = _client().converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{'text': admin_config.augment_system_prompt(SYSTEM_PROMPT, _load_config(), 'chat')}],
            messages=[{'role': 'user', 'content': [{'text': user_message}]}],
            inferenceConfig={'maxTokens': MAX_TOKENS, 'temperature': 0.2},
        )
    except Exception as e:  # noqa: BLE001 — surface any boto/model error uniformly
        # Log the real cause (AccessDenied / ValidationException / throttle) so a
        # prod failure is diagnosable; the route still degrades gracefully.
        logger.error('Bedrock converse failed (model=%s region=%s): %s',
                     BEDROCK_MODEL_ID, BEDROCK_REGION, e)
        raise AiError(str(e)) from e

    try:
        text = resp['output']['message']['content'][0]['text']
    except (KeyError, IndexError, TypeError) as e:
        raise AiError(f'unexpected Bedrock response shape: {e}') from e

    return _split_answer(text)
