"""Admin config + KB-refresh routes, the admin gate, and the append-only
prompt-tuning behaviour."""
import pytest

import admin_config


# --- admin_config unit ------------------------------------------------------
def test_merge_defaults_fills_missing():
    cfg = admin_config.merge_defaults(None)
    assert set(cfg['promptOverrides']) == set(admin_config.CAPABILITIES)
    assert cfg['globalContext'] == ''
    assert cfg['kb']['status'] == 'idle'
    assert 'thresholds' in cfg


def test_merge_defaults_preserves_stored():
    stored = {'promptOverrides': {'draft': 'carry forward targets'}, 'globalContext': 'FY2026 boundary changed'}
    cfg = admin_config.merge_defaults(stored)
    assert cfg['promptOverrides']['draft'] == 'carry forward targets'
    assert cfg['promptOverrides']['chat'] == ''      # other capabilities still defaulted
    assert cfg['globalContext'] == 'FY2026 boundary changed'


def test_augment_appends_override_and_context():
    cfg = admin_config.merge_defaults({
        'promptOverrides': {'draft': 'Always start with the roll-forward summary.'},
        'globalContext': 'The reporting boundary now includes JV sites.',
    })
    out = admin_config.augment_system_prompt('BASE GUARDRAILS', cfg, 'draft')
    assert out.startswith('BASE GUARDRAILS')            # guardrails first
    assert 'roll-forward summary' in out
    assert 'JV sites' in out


def test_augment_noop_when_empty():
    cfg = admin_config.merge_defaults(None)
    assert admin_config.augment_system_prompt('BASE', cfg, 'chat') == 'BASE'


def test_ai_uses_admin_override(fake_bedrock, dynamo_table):
    """An admin draft override is appended to the system prompt sent to Bedrock."""
    import ai
    dynamo_table.put_admin_config(admin_config.merge_defaults(
        {'promptOverrides': {'draft': 'UNIQUE_ADMIN_RULE_XYZ'}}))
    fake = fake_bedrock(text='drafted')
    ai.draft_section('Climate', 'ESRS-E1-4')
    sent_system = fake.calls[0]['system'][0]['text']
    assert 'UNIQUE_ADMIN_RULE_XYZ' in sent_system
    assert 'never invent' in sent_system.lower()  # guardrail still present


# --- routes: admin gate -----------------------------------------------------
def test_admin_config_requires_admin(dynamo_table, monkeypatch):
    """A valid non-admin user is 403; the admin override user passes."""
    import main
    from auth import get_current_user
    # Non-admin authenticated user.
    main.app.dependency_overrides[get_current_user] = lambda: 'randomcontributor'
    from fastapi.testclient import TestClient
    with TestClient(main.app) as c:
        assert c.get('/api/admin/config').status_code == 403
    main.app.dependency_overrides.clear()


def test_admin_config_get_put_roundtrip(client):
    # `client` fixture authenticates as 'testuser' — add it to the allowlist.
    import routers.api as api
    api._ADMIN_ALIASES.add('testuser')
    try:
        got = client.get('/api/admin/config')
        assert got.status_code == 200
        assert 'promptOverrides' in got.json()

        cfg = got.json()
        cfg['promptOverrides']['draft'] = 'roll forward all targets'
        cfg['globalContext'] = 'boundary changed'
        put = client.put('/api/admin/config', json=cfg)
        assert put.status_code == 200
        assert put.json()['promptOverrides']['draft'] == 'roll forward all targets'

        again = client.get('/api/admin/config')
        assert again.json()['globalContext'] == 'boundary changed'
    finally:
        api._ADMIN_ALIASES.discard('testuser')


def test_admin_kb_refresh_records_request(client):
    import routers.api as api
    api._ADMIN_ALIASES.add('testuser')
    try:
        r = client.post('/api/admin/kb/refresh', json={})
        assert r.status_code == 200
        assert r.json()['status'] == 'queued'
        # Reflected in the stored config.
        cfg = client.get('/api/admin/config').json()
        assert cfg['kb']['status'] == 'queued'
        assert cfg['kb']['lastRefreshBy'] == 'testuser'
    finally:
        api._ADMIN_ALIASES.discard('testuser')


def test_admin_config_requires_auth(dynamo_table):
    from fastapi.testclient import TestClient
    import main
    with TestClient(main.app) as c:
        assert c.get('/api/admin/config').status_code == 401