#!/usr/bin/env python3
"""Build the local retrieval corpus (backend/kb_corpus.json) from the source docs.

This is the OFFLINE / RAG-lite grounding corpus: the LocalRetriever
(backend/retrieval.py) keyword-ranks these chunks so draft-generation and
compliance-fill can cite real Novartis source text WITHOUT the Bedrock Knowledge
Base + OpenSearch infra (which isn't provisioned yet — see
infrastructure/knowledge-base.tf). When the real KB exists, BedrockKbRetriever
takes over via env and this file is no longer used at runtime.

Sources (repo-committed):
  - Q1 RNFM FY2025 PDF            → document_type=prior_report
  - Q4 Novartis Style Guide PDF  → document_type=style_guide
  - customer-inputs/*.md          → document_type=standard/policy reference

Run:  /path/to/venv/bin/python scripts/build_kb_corpus.py
Needs: pypdf (dev-only; NOT a backend runtime dependency).
Output: backend/kb_corpus.json  (committed; the backend loads it at import).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'backend', 'kb_corpus.json')

# Approx chunk size in characters (~512 tokens ≈ 2000 chars) with overlap so a
# claim spanning a boundary is still retrievable.
CHUNK_CHARS = 1800
OVERLAP = 250


def clean(text: str) -> str:
    text = text.replace('\x00', ' ')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def chunk(text: str) -> list[str]:
    text = clean(text)
    if len(text) <= CHUNK_CHARS:
        return [text] if text else []
    out, i = [], 0
    while i < len(text):
        end = min(i + CHUNK_CHARS, len(text))
        piece = text[i:end]
        # Prefer to end on a paragraph/sentence boundary near the limit.
        if end < len(text):
            cut = max(piece.rfind('\n\n'), piece.rfind('. '))
            if cut > CHUNK_CHARS // 2:
                end = i + cut + 1
                piece = text[i:end]
        s = piece.strip()
        if s:
            out.append(s)
        if end >= len(text):
            break
        # Advance by a fixed stride from the window END (never from piece length,
        # which could be tiny after a boundary cut and cause a near-zero advance).
        i = max(end - OVERLAP, i + 1)
    return out


def from_pdf(path: str, source: str, doc_type: str) -> list[dict]:
    import pypdf
    reader = pypdf.PdfReader(path)
    chunks: list[dict] = []
    for pnum, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ''
        for c in chunk(text):
            chunks.append({'text': c, 'source': source, 'docType': doc_type, 'pageRef': f'p.{pnum}'})
    return chunks


def from_md(path: str, source: str, doc_type: str) -> list[dict]:
    with open(path, encoding='utf-8') as f:
        text = f.read()
    return [{'text': c, 'source': source, 'docType': doc_type, 'pageRef': ''} for c in chunk(text)]


def main() -> int:
    corpus: list[dict] = []
    rnfm = os.path.join(ROOT, 'data', 'Q1_novartis-report-nonfinancial-matters-2025.pdf')
    style = os.path.join(ROOT, 'data', 'Q4_EN_Novartis Communications Style Guide - March 2024.pdf')
    ci = os.path.join(ROOT, 'customer-inputs')

    if os.path.exists(rnfm):
        corpus += from_pdf(rnfm, 'Novartis RNFM FY2025', 'prior_report')
    if os.path.exists(style):
        corpus += from_pdf(style, 'Novartis Communications Style Guide (Mar 2024)', 'style_guide')
    md_types = {
        'Q2_ESRS_datapoint_register_REFERENCE.md': ('ESRS datapoint register', 'standard'),
        'Q2b_IFRS_S1_S2_checklist_REFERENCE.md': ('IFRS S1/S2 checklist', 'standard'),
        'Q2c_Sample_Disclosure_Checklist_TEMPLATE_REFERENCE.md': ('Disclosure checklist template', 'standard'),
        'Q5_internal_policy_list_REFERENCE.md': ('Novartis internal policy list', 'policy'),
    }
    for fn, (src, dt) in md_types.items():
        p = os.path.join(ci, fn)
        if os.path.exists(p):
            corpus += from_md(p, src, dt)

    # Stable ids so citations are addressable.
    for i, c in enumerate(corpus):
        c['id'] = f'chunk-{i:04d}'

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(corpus, f, ensure_ascii=False)
    by_src: dict[str, int] = {}
    for c in corpus:
        by_src[c['source']] = by_src.get(c['source'], 0) + 1
    print(f'Wrote {len(corpus)} chunks -> {OUT}')
    for s, n in by_src.items():
        print(f'  {n:4d}  {s}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
