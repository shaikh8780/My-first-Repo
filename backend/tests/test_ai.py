"""Tests for the Bedrock-backed /api/ai/* routes.

No real Bedrock call: the shared `fake_bedrock` fixture (conftest.py) patches
ai._client with a fake that returns a canned Converse response.
"""
import pytest

import ai


# --- unit: ai.chat ----------------------------------------------------------
def test_chat_splits_proposed_text(fake_bedrock):
    fake_bedrock(text="Here is a tighter version.\n\nPROPOSED TEXT:\nNovartis reports on a like-for-like basis.")
    out = ai.chat('rephrase this', section_title='Climate policies', section_content='old text')
    assert out['answer'] == 'Here is a tighter version.'
    assert out['proposedText'] == 'Novartis reports on a like-for-like basis.'


def test_chat_no_proposed_text(fake_bedrock):
    fake_bedrock(text='The minimum disclosures are A, B, C.')
    out = ai.chat('what are the requirements?', section_title='X')
    assert out['answer'] == 'The minimum disclosures are A, B, C.'
    assert out['proposedText'] is None


def test_chat_empty_prompt_raises(fake_bedrock):
    fake_bedrock(text='irrelevant')
    with pytest.raises(ai.AiError):
        ai.chat('   ', section_title='X')


def test_chat_model_error_raises_aierror(fake_bedrock):
    fake_bedrock(raise_exc=RuntimeError('throttled'))
    with pytest.raises(ai.AiError):
        ai.chat('draft something', section_title='X')


def test_chat_passes_section_context_to_model(fake_bedrock):
    fake = fake_bedrock(text='ok')
    ai.chat('draft', section_title='Water pollution', section_content='body here', evidence_name='CDP-2026.pdf')
    sent = fake.calls[0]['messages'][0]['content'][0]['text']
    assert 'Water pollution' in sent
    assert 'CDP-2026.pdf' in sent
    assert 'body here' in sent


# --- route: /api/ai/chat ----------------------------------------------------
def test_ai_chat_route_ok(client, fake_bedrock):
    fake_bedrock(text='Reply.\n\nPROPOSED TEXT:\nInserted paragraph.')
    r = client.post('/api/ai/chat', json={'prompt': 'draft a paragraph', 'sectionTitle': 'Climate'})
    assert r.status_code == 200
    body = r.json()
    assert body['answer'] == 'Reply.'
    assert body['proposedText'] == 'Inserted paragraph.'


def test_ai_chat_route_requires_prompt(client, fake_bedrock):
    fake_bedrock(text='x')
    assert client.post('/api/ai/chat', json={'sectionTitle': 'Climate'}).status_code == 400
    assert client.post('/api/ai/chat', json={'prompt': '   '}).status_code == 400


def test_ai_chat_route_graceful_on_model_error(client, fake_bedrock):
    fake_bedrock(raise_exc=RuntimeError('bedrock down'))
    r = client.post('/api/ai/chat', json={'prompt': 'draft'})
    # Model failure must NOT 500 the editor — graceful 200 with a usable message.
    assert r.status_code == 200
    assert 'temporarily unavailable' in r.json()['answer'].lower()
    assert r.json()['proposedText'] is None


def test_ai_chat_route_requires_auth(dynamo_table):
    """Without the auth override, no token → 401 (route is under the authed router)."""
    from fastapi.testclient import TestClient
    import main
    with TestClient(main.app) as c:
        assert c.post('/api/ai/chat', json={'prompt': 'hi'}).status_code == 401


# --- peer benchmarking ------------------------------------------------------
def test_peer_chat_splits_citations(fake_bedrock):
    fake_bedrock(text=(
        'GSK reports 8,385 ktCO2e Scope 3 (FY2024).\n\n'
        'CITATIONS:\n[{"company":"GSK","excerpt":"8,385","pageRef":"p.21","section":"RBR 2025"}]'
    ))
    out = ai.peer_chat('scope 3?', corpus='GSK FY2024 Scope 3 = 8,385 ktCO2e')
    assert 'GSK' in out['answer']
    assert out['citations'] == [{'company': 'GSK', 'excerpt': '8,385', 'pageRef': 'p.21', 'section': 'RBR 2025'}]


def test_peer_chat_no_citations_marker(fake_bedrock):
    fake_bedrock(text='No peer data covers that topic.')
    out = ai.peer_chat('quantum computing?', corpus='(peer corpus)')
    assert out['answer'] == 'No peer data covers that topic.'
    assert out['citations'] == []


def test_peer_chat_bad_citation_json_is_dropped(fake_bedrock):
    fake_bedrock(text='Answer.\n\nCITATIONS:\nnot valid json')
    out = ai.peer_chat('q', corpus='c')
    assert out['answer'] == 'Answer.'
    assert out['citations'] == []


def test_peer_chat_empty_question_raises(fake_bedrock):
    fake_bedrock(text='x')
    with pytest.raises(ai.AiError):
        ai.peer_chat('  ', corpus='c')


def test_peer_chat_passes_corpus_to_model(fake_bedrock):
    fake = fake_bedrock(text='ok')
    ai.peer_chat('scope 3?', corpus='UNIQUE_CORPUS_MARKER_123')
    sent = fake.calls[0]['messages'][0]['content'][0]['text']
    assert 'UNIQUE_CORPUS_MARKER_123' in sent


def test_ai_peer_route_ok(client, fake_bedrock):
    fake_bedrock(text='GSK leads.\n\nCITATIONS:\n[{"company":"GSK","excerpt":"x","pageRef":"p.1","section":"s"}]')
    r = client.post('/api/ai/peer', json={'question': 'who leads on scope 3?', 'corpus': 'GSK ...'})
    assert r.status_code == 200
    assert r.json()['answer'] == 'GSK leads.'
    assert r.json()['citations'][0]['company'] == 'GSK'


def test_ai_peer_route_requires_question_and_corpus(client, fake_bedrock):
    fake_bedrock(text='x')
    assert client.post('/api/ai/peer', json={'corpus': 'c'}).status_code == 400
    assert client.post('/api/ai/peer', json={'question': 'q'}).status_code == 400


def test_ai_peer_route_graceful_on_error(client, fake_bedrock):
    fake_bedrock(raise_exc=RuntimeError('bedrock down'))
    r = client.post('/api/ai/peer', json={'question': 'q', 'corpus': 'c'})
    assert r.status_code == 200
    assert 'temporarily unavailable' in r.json()['answer'].lower()
    assert r.json()['citations'] == []


# --- draft generation -------------------------------------------------------
def test_draft_section_returns_text(fake_bedrock):
    fake_bedrock(text='In 2026 Novartis advanced its climate transition plan [confirm FY2026 figure].')
    out = ai.draft_section('Climate strategy', 'ESRS-E1-4', topic='Environmental', prior_year_text='In 2025 we ...')
    assert 'transition plan' in out['text']


def test_draft_section_empty_drref_raises(fake_bedrock):
    fake_bedrock(text='x')
    with pytest.raises(ai.AiError):
        ai.draft_section('Climate strategy', '  ')


def test_draft_section_grounds_on_prior_year(fake_bedrock):
    fake = fake_bedrock(text='ok')
    ai.draft_section('Climate strategy', 'ESRS-E1-4', prior_year_text='UNIQUE_PRIOR_YEAR_MARKER')
    sent = fake.calls[0]['messages'][0]['content'][0]['text']
    assert 'UNIQUE_PRIOR_YEAR_MARKER' in sent
    assert 'ESRS-E1-4' in sent


def test_ai_draft_route_ok(client, fake_bedrock):
    fake_bedrock(text='Drafted paragraph addressing the DR.')
    r = client.post('/api/ai/draft', json={'sectionTitle': 'Climate', 'drRef': 'ESRS-E1-4'})
    assert r.status_code == 200
    assert r.json()['text'] == 'Drafted paragraph addressing the DR.'


def test_ai_draft_route_requires_drref(client, fake_bedrock):
    fake_bedrock(text='x')
    assert client.post('/api/ai/draft', json={'sectionTitle': 'Climate'}).status_code == 400
    assert client.post('/api/ai/draft', json={'drRef': '  '}).status_code == 400


def test_ai_draft_route_null_text_on_error(client, fake_bedrock):
    fake_bedrock(raise_exc=RuntimeError('bedrock down'))
    r = client.post('/api/ai/draft', json={'sectionTitle': 'Climate', 'drRef': 'ESRS-E1-4'})
    # Failure signals null so the editor inserts a placeholder — still HTTP 200.
    assert r.status_code == 200
    assert r.json()['text'] is None


# --- compliance gap rationale -----------------------------------------------
def test_compliance_explain_splits_fill(fake_bedrock):
    fake_bedrock(text=(
        'Partially covered: the section states the target but omits the base year.\n\n'
        'SUGGESTED FILL:\nAdd the base year and interim milestones [confirm FY2026 figure].'
    ))
    out = ai.compliance_explain('ESRS-E1-4', 'GHG targets', 'partial',
                                section_title='Climate strategy', requirement_text='Disclose base year...')
    assert 'base year' in out['rationale']
    assert 'interim milestones' in out['suggestedFill']


def test_compliance_explain_no_fill_marker(fake_bedrock):
    fake_bedrock(text='Covered: the section fully addresses the DR.')
    out = ai.compliance_explain('ESRS-E1-1', 'Transition plan', 'covered')
    assert out['rationale'].startswith('Covered')
    assert out['suggestedFill'] is None


def test_compliance_explain_empty_drid_raises(fake_bedrock):
    fake_bedrock(text='x')
    with pytest.raises(ai.AiError):
        ai.compliance_explain('  ', 'title', 'missing')


def test_compliance_explain_grounds_on_requirement(fake_bedrock):
    fake = fake_bedrock(text='ok')
    ai.compliance_explain('ESRS-E1-4', 'GHG targets', 'partial', requirement_text='UNIQUE_REQ_MARKER')
    sent = fake.calls[0]['messages'][0]['content'][0]['text']
    assert 'UNIQUE_REQ_MARKER' in sent
    assert 'partial' in sent


def test_ai_compliance_route_ok(client, fake_bedrock):
    fake_bedrock(text='Missing: no disclosure present.\n\nSUGGESTED FILL:\nAdd a paragraph on X.')
    r = client.post('/api/ai/compliance', json={'drId': 'ESRS-E1-9', 'title': 'Financial effects', 'status': 'missing'})
    assert r.status_code == 200
    assert r.json()['rationale'].startswith('Missing')
    assert 'paragraph on X' in r.json()['suggestedFill']


def test_ai_compliance_route_requires_drid(client, fake_bedrock):
    fake_bedrock(text='x')
    assert client.post('/api/ai/compliance', json={'title': 't', 'status': 'missing'}).status_code == 400


def test_ai_compliance_route_null_on_error(client, fake_bedrock):
    fake_bedrock(raise_exc=RuntimeError('bedrock down'))
    r = client.post('/api/ai/compliance', json={'drId': 'ESRS-E1-9', 'status': 'missing'})
    assert r.status_code == 200
    assert r.json() == {'rationale': None, 'suggestedFill': None}


# --- retrieval (RAG-lite) ---------------------------------------------------
def test_local_retriever_ranks_relevant_chunks():
    import retrieval
    hits = retrieval.retrieve('greenhouse gas emissions scope 3 climate', top_k=3)
    assert len(hits) >= 1
    assert all('text' in h and 'source' in h and 'score' in h for h in hits)
    # Scores are sorted descending.
    assert hits == sorted(hits, key=lambda h: h['score'], reverse=True)


def test_retrieve_empty_query_returns_empty():
    import retrieval
    assert retrieval.retrieve('   ', top_k=3) == []


def test_retrieve_never_raises(monkeypatch):
    import retrieval
    # Even if the underlying retriever explodes, retrieve() returns [].
    class Boom:
        def retrieve(self, *a, **k): raise RuntimeError('kaboom')
    monkeypatch.setattr(retrieval, 'get_retriever', lambda: Boom())
    assert retrieval.retrieve('anything', top_k=3) == []


def test_analyze_validates_original_is_substring(fake_bedrock):
    # Two flags: one whose `original` really is in the paragraph (kept), one that
    # is not (dropped — protects the frontend's literal find-replace).
    content = "We are committed to to net zero. Renewable share is 96 per cent."
    fake_bedrock(text=(
        '[{"kind":"typo","paragraphIndex":0,"original":"committed to to","suggestion":"committed to","message":"doubled to"},'
        '{"kind":"style","paragraphIndex":0,"original":"NONEXISTENT SPAN","suggestion":"x","message":"bogus"}]'
    ))
    out = ai.analyze_section(content)
    assert len(out['flags']) == 1
    assert out['flags'][0]['original'] == 'committed to to'
    assert out['flags'][0]['id']


def test_analyze_drops_bad_kind_and_bounds(fake_bedrock):
    content = "Scope 1 and 2 emissions."
    fake_bedrock(text=(
        '[{"kind":"bogus","paragraphIndex":0,"original":"Scope","suggestion":"x","message":"m"},'
        '{"kind":"typo","paragraphIndex":9,"original":"Scope","suggestion":"x","message":"out of range"}]'
    ))
    assert ai.analyze_section(content)['flags'] == []


def test_analyze_empty_content_returns_empty(fake_bedrock):
    fake_bedrock(text='[]')
    assert ai.analyze_section('   ')['flags'] == []


def test_analyze_non_json_returns_empty(fake_bedrock):
    fake_bedrock(text='Sorry, I could not find any issues.')
    assert ai.analyze_section('Some text here.')['flags'] == []


def test_ai_analyze_route_ok(client, fake_bedrock):
    fake_bedrock(text='[{"kind":"style","paragraphIndex":0,"original":"CO2","suggestion":"CO₂","message":"subscript"}]')
    r = client.post('/api/ai/analyze', json={'content': 'Emissions of CO2 rose.'})
    assert r.status_code == 200
    assert r.json()['flags'][0]['suggestion'] == 'CO₂'


def test_ai_analyze_route_null_on_error(client, fake_bedrock):
    fake_bedrock(raise_exc=RuntimeError('bedrock down'))
    r = client.post('/api/ai/analyze', json={'content': 'text'})
    assert r.status_code == 200
    assert r.json() == {'flags': None}


def test_draft_and_compliance_include_sources(fake_bedrock):
    fake_bedrock(text='Drafted.')
    d = ai.draft_section('Climate strategy', 'ESRS-E1-4', topic='Environmental')
    assert 'sources' in d and isinstance(d['sources'], list)
    fake_bedrock(text='Missing: X.\n\nSUGGESTED FILL:\nAdd Y.')
    c = ai.compliance_explain('ESRS-E1-9', 'Financial effects', 'missing', section_title='Climate')
    assert 'sources' in c and isinstance(c['sources'], list)
