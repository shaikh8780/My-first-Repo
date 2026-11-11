"""Route tests for the data-access API, mirroring the frontend RestAdapter
contract: GET-404 -> PUT -> GET roundtrip, DELETE/clear semantics, reset,
tracked-drafts keyed ops, structure + uploads channels, and auth enforcement."""


# --- report-scoped channels -------------------------------------------------
def test_report_resource_404_then_put_then_get(client):
    # Absent -> 404 (frontend falls back to its seed).
    assert client.get('/api/reports/rnfm/sections').status_code == 404

    sections = [{'id': 'sub-1', 'content': 'hello'}]
    put = client.put('/api/reports/rnfm/sections', json=sections)
    assert put.status_code == 200
    assert put.json() == sections

    got = client.get('/api/reports/rnfm/sections')
    assert got.status_code == 200
    assert got.json() == sections


def test_report_resource_delete_is_idempotent(client):
    client.put('/api/reports/rnfm/comments', json=[{'id': 'c1'}])
    assert client.delete('/api/reports/rnfm/comments').status_code == 204
    # gone -> 404
    assert client.get('/api/reports/rnfm/comments').status_code == 404
    # deleting again is still fine
    assert client.delete('/api/reports/rnfm/comments').status_code == 204


def test_unknown_report_resource_rejected(client):
    assert client.get('/api/reports/rnfm/bogus').status_code == 404
    assert client.put('/api/reports/rnfm/bogus', json=[]).status_code == 404


def test_section_progress_and_audit_releases_roundtrip(client):
    # Channels added with the 2026-08-31 role/workflow overhaul. Without them in
    # the allowlist, marking a section "updated" or releasing to audit would 404
    # on PUT and silently fail to persist.
    progress = {'sub-8-2-1': 'updated', 'sub-8-2-2': 'edited'}
    assert client.put('/api/reports/rnfm/section-progress', json=progress).status_code == 200
    assert client.get('/api/reports/rnfm/section-progress').json() == progress

    releases = {'Environmental matters||Pollution of water': {'by': 'Jordan Avery', 'at': '2026-08-31T00:00:00Z'}}
    assert client.put('/api/reports/rnfm/audit-releases', json=releases).status_code == 200
    assert client.get('/api/reports/rnfm/audit-releases').json() == releases


def test_datapoint_checklist_roundtrip(client):
    # Customer-maintained disclosure checklist (21 Aug 2026) — authoritative
    # datapoint source ingested + versioned through the backend.
    store = {
        'current': {
            'version': 1, 'uploadedBy': 'ESG Lead', 'uploadedAt': '2026-08-21T00:00:00Z',
            'sourceFileName': 'DMA_checklist.csv', 'rowCount': 1,
            'datapoints': [{'drId': 'ESRS-E1-6', 'framework': 'ESRS', 'standard': 'E1', 'title': 'GHG emissions', 'materiality': 'material', 'mandatory': True}],
        },
        'history': [],
    }
    assert client.put('/api/reports/rnfm/datapoint-checklist', json=store).status_code == 200
    assert client.get('/api/reports/rnfm/datapoint-checklist').json() == store


def test_object_and_scalar_values_roundtrip(client):
    # l2-signoff is an object map; ai-baseline is a list; both must roundtrip.
    obj = {'Env||Water': {'Alex Moreau': {'at': '2026-07-16T00:00:00Z'}}}
    assert client.put('/api/reports/rnfm/l2-signoff', json=obj).status_code == 200
    assert client.get('/api/reports/rnfm/l2-signoff').json() == obj

    lst = ['sub-8-2-1', 'sub-8-2-2']
    assert client.put('/api/reports/rnfm/ai-baseline', json=lst).status_code == 200
    assert client.get('/api/reports/rnfm/ai-baseline').json() == lst


# --- reset ------------------------------------------------------------------
def test_reset_clears_only_that_report(client):
    client.put('/api/reports/rnfm/sections', json=[{'id': 's'}])
    client.put('/api/reports/rnfm/changes', json=[{'id': 'c'}])
    client.put('/api/reports/hrs/sections', json=[{'id': 'other'}])

    assert client.post('/api/reports/rnfm/reset').status_code == 204

    assert client.get('/api/reports/rnfm/sections').status_code == 404
    assert client.get('/api/reports/rnfm/changes').status_code == 404
    # a different report is untouched
    assert client.get('/api/reports/hrs/sections').status_code == 200


# --- tracked-draft side-channel --------------------------------------------
def test_tracked_draft_keyed_ops(client):
    assert client.get('/api/reports/rnfm/tracked-drafts/sub-8-1-1').status_code == 404

    html = '<p>draft <ins>added</ins></p>'
    assert client.put('/api/reports/rnfm/tracked-drafts/sub-8-1-1', json=html).status_code == 200
    assert client.get('/api/reports/rnfm/tracked-drafts/sub-8-1-1').json() == html

    assert client.delete('/api/reports/rnfm/tracked-drafts/sub-8-1-1').status_code == 204
    assert client.get('/api/reports/rnfm/tracked-drafts/sub-8-1-1').status_code == 404


def test_clear_all_tracked_drafts_only(client):
    client.put('/api/reports/rnfm/tracked-drafts/a', json='<p>a</p>')
    client.put('/api/reports/rnfm/tracked-drafts/b', json='<p>b</p>')
    client.put('/api/reports/rnfm/sections', json=[{'id': 's'}])

    assert client.delete('/api/reports/rnfm/tracked-drafts').status_code == 204

    assert client.get('/api/reports/rnfm/tracked-drafts/a').status_code == 404
    assert client.get('/api/reports/rnfm/tracked-drafts/b').status_code == 404
    # a non-draft resource under the same report is NOT cleared by clearAll
    assert client.get('/api/reports/rnfm/sections').status_code == 200


def test_reset_also_clears_tracked_drafts(client):
    client.put('/api/reports/rnfm/tracked-drafts/a', json='<p>a</p>')
    client.post('/api/reports/rnfm/reset')
    assert client.get('/api/reports/rnfm/tracked-drafts/a').status_code == 404


# --- structure channel ------------------------------------------------------
def test_structure_channel(client):
    assert client.get('/api/structure/published').status_code == 404
    pub = {'rows': [{'id': 'sub-1', 'ref': '1.0'}], 'publishedBy': 'x', 'publishedAt': 't'}
    assert client.put('/api/structure/published', json=pub).status_code == 200
    assert client.get('/api/structure/published').json() == pub
    assert client.delete('/api/structure/applied').status_code == 204
    assert client.get('/api/structure/bogus').status_code == 404


# --- uploads ----------------------------------------------------------------
def test_uploads_channel(client):
    assert client.get('/api/uploads').status_code == 404
    files = [{'name': 'prior.pdf', 'status': 'complete', 'progress': 100}]
    assert client.put('/api/uploads', json=files).status_code == 200
    assert client.get('/api/uploads').json() == files


# --- auth -------------------------------------------------------------------
def test_auth_required_without_override(dynamo_table):
    """Without the dependency override, a request with no bearer token is 401."""
    from fastapi.testclient import TestClient
    import main
    with TestClient(main.app) as c:
        assert c.get('/api/reports/rnfm/sections').status_code == 401
    # health stays open
    with TestClient(main.app) as c:
        assert c.get('/health').status_code == 200
