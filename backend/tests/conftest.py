"""Shared pytest fixtures: a moto-backed DynamoDB table and an auth-bypassed
TestClient so route tests never need a real Cognito token.

We bind the moto table directly onto the store singleton's `_table` (rather than
reloading modules) so `routers.api`, which imported the singleton at module load,
uses the same mocked table.
"""
import boto3
import pytest
from moto import mock_aws
from fastapi.testclient import TestClient

TABLE_NAME = 'test-esg-data'


@pytest.fixture()
def dynamo_table():
    """Create the single-table schema in a mocked DynamoDB and bind it onto the
    store singleton for the duration of the test."""
    with mock_aws():
        ddb = boto3.resource('dynamodb', region_name='us-east-1')
        ddb.create_table(
            TableName=TABLE_NAME,
            KeySchema=[
                {'AttributeName': 'pk', 'KeyType': 'HASH'},
                {'AttributeName': 'sk', 'KeyType': 'RANGE'},
            ],
            AttributeDefinitions=[
                {'AttributeName': 'pk', 'AttributeType': 'S'},
                {'AttributeName': 'sk', 'AttributeType': 'S'},
            ],
            BillingMode='PAY_PER_REQUEST',
        )
        import store
        original = store.store._table
        store.store._table = ddb.Table(TABLE_NAME)
        try:
            yield store.store
        finally:
            store.store._table = original


@pytest.fixture()
def client(dynamo_table):
    """TestClient with get_current_user overridden to a fixed alias (no JWT)."""
    import main
    from auth import get_current_user
    main.app.dependency_overrides[get_current_user] = lambda: 'testuser'
    with TestClient(main.app) as c:
        yield c
    main.app.dependency_overrides.clear()


class FakeBedrock:
    """Minimal stand-in for a bedrock-runtime client's .converse()."""
    def __init__(self, text=None, raise_exc=None):
        self._text = text
        self._raise = raise_exc
        self.calls = []

    def converse(self, **kwargs):
        self.calls.append(kwargs)
        if self._raise:
            raise self._raise
        return {'output': {'message': {'content': [{'text': self._text}]}}}


@pytest.fixture()
def fake_bedrock(monkeypatch):
    """Patch ai._client with a FakeBedrock; returns an installer that sets the
    canned response text (or an exception to raise). Shared by test_ai/test_admin."""
    import ai

    def install(text=None, raise_exc=None):
        fake = FakeBedrock(text=text, raise_exc=raise_exc)
        monkeypatch.setattr(ai, '_cached_client', fake, raising=False)
        monkeypatch.setattr(ai, '_client', lambda: fake)
        return fake

    return install
