"""Retrieval layer for grounding the AI (RAG).

Ports-and-adapters, mirroring the frontend api/ seam so the grounding source can
move from "docs we ship" to a real Bedrock Knowledge Base as a config flip:

  RETRIEVER=local (default) → LocalRetriever: keyword/TF-IDF rank over the
      committed corpus (backend/kb_corpus.json, built by scripts/build_kb_corpus.py
      from the RNFM FY2025 PDF, Style Guide, and the ESRS/IFRS/policy references).
      Works today with NO extra infra.
  RETRIEVER=bedrock (or BEDROCK_KB_ID set) → BedrockKbRetriever: calls the Bedrock
      Knowledge Base Retrieve API against a real vector store (OpenSearch
      Serverless). Inert until a KB is provisioned (see infrastructure/
      knowledge-base.tf) and BEDROCK_KB_ID is set.

A retrieved chunk is {text, source, pageRef, score}. Callers add the top-K to the
model prompt and surface them as citations. Retrieval never raises to the caller
— on any failure it returns [] and the AI falls back to non-grounded generation.
"""
import json
import math
import os
import re
from functools import lru_cache
from typing import Optional

import boto3

CORPUS_PATH = os.path.join(os.path.dirname(__file__), 'kb_corpus.json')
BEDROCK_KB_ID = os.environ.get('BEDROCK_KB_ID', '')
RETRIEVER = os.environ.get('RETRIEVER', 'bedrock' if BEDROCK_KB_ID else 'local')
BEDROCK_REGION = os.environ.get('BEDROCK_REGION', os.environ.get('AWS_REGION', 'us-east-1'))

_WORD = re.compile(r'[a-z0-9]+')


def _tokens(s: str) -> list[str]:
    return _WORD.findall(s.lower())


@lru_cache(maxsize=1)
def _corpus() -> list[dict]:
    try:
        with open(CORPUS_PATH, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []


@lru_cache(maxsize=1)
def _idf() -> dict:
    """Inverse document frequency over the corpus (computed once)."""
    docs = _corpus()
    n = len(docs) or 1
    df: dict[str, int] = {}
    for d in docs:
        for t in set(_tokens(d.get('text', ''))):
            df[t] = df.get(t, 0) + 1
    return {t: math.log(1 + n / c) for t, c in df.items()}


class LocalRetriever:
    """TF-IDF keyword ranking over the shipped corpus. No external services."""

    def retrieve(self, query: str, top_k: int = 4, doc_types: Optional[list[str]] = None) -> list[dict]:
        docs = _corpus()
        if not docs or not query.strip():
            return []
        idf = _idf()
        q_terms = [t for t in _tokens(query) if t in idf]
        if not q_terms:
            return []
        scored: list[tuple[float, dict]] = []
        for d in docs:
            if doc_types and d.get('docType') not in doc_types:
                continue
            toks = _tokens(d.get('text', ''))
            if not toks:
                continue
            tf: dict[str, int] = {}
            for t in toks:
                tf[t] = tf.get(t, 0) + 1
            score = sum((tf.get(t, 0) / len(toks)) * idf.get(t, 0) for t in q_terms)
            if score > 0:
                scored.append((score, d))
        scored.sort(key=lambda x: x[0], reverse=True)
        out = []
        for score, d in scored[:top_k]:
            out.append({'text': d['text'], 'source': d.get('source', ''),
                        'pageRef': d.get('pageRef', ''), 'score': round(score, 4)})
        return out


class BedrockKbRetriever:
    """Retrieve against a real Bedrock Knowledge Base (vector search)."""

    def __init__(self, kb_id: str):
        self._kb_id = kb_id
        self._client = None

    def _c(self):
        if self._client is None:
            self._client = boto3.client('bedrock-agent-runtime', region_name=BEDROCK_REGION)
        return self._client

    def retrieve(self, query: str, top_k: int = 4, doc_types: Optional[list[str]] = None) -> list[dict]:
        if not query.strip():
            return []
        cfg = {'vectorSearchConfiguration': {'numberOfResults': top_k}}
        if doc_types:
            cfg['vectorSearchConfiguration']['filter'] = {
                'in': {'key': 'docType', 'value': doc_types}
            }
        try:
            resp = self._c().retrieve(
                knowledgeBaseId=self._kb_id,
                retrievalQuery={'text': query},
                retrievalConfiguration=cfg,
            )
        except Exception:
            return []  # KB missing / not ready / no perms → non-grounded fallback
        out = []
        for r in resp.get('retrievalResults', []):
            md = r.get('metadata', {}) or {}
            out.append({
                'text': (r.get('content', {}) or {}).get('text', ''),
                'source': md.get('source', md.get('x-amz-bedrock-kb-source-uri', '')),
                'pageRef': md.get('pageRef', ''),
                'score': round(r.get('score', 0), 4),
            })
        return out


@lru_cache(maxsize=1)
def get_retriever():
    if RETRIEVER == 'bedrock' and BEDROCK_KB_ID:
        return BedrockKbRetriever(BEDROCK_KB_ID)
    return LocalRetriever()


def retrieve(query: str, top_k: int = 4, doc_types: Optional[list[str]] = None) -> list[dict]:
    """Module-level convenience — never raises; [] on any failure."""
    try:
        return get_retriever().retrieve(query, top_k=top_k, doc_types=doc_types)
    except Exception:
        return []
