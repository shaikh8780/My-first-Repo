"""DynamoDB single-table store for the ESG authoring studio.

Backs the frontend's data-access ports (frontend/src/api/ports.ts). Each port
resource is persisted as ONE JSON document in the shared `${project}-data`
table, addressed by a (pk, sk) pair:

    Report-scoped channels   pk = REPORT#<reportId>   sk = <resource>
        resource in: sections, changes, approvals, locks, section-progress,
        audit-releases, ip-signoff, comments,
                     l2-signoff, ai-baseline, rollforward, versions, evidence
    Tracked-draft side-chan  pk = REPORT#<reportId>   sk = tracked-draft#<sectionId>
    Structure admin channel  pk = STRUCTURE           sk = draft|versions|
                                                           published|published-versions|applied
    Uploaded source files    pk = UPLOADS             sk = files

The stored value lives under a single `value` attribute (arbitrary JSON: list,
dict, string, or null). A missing item is reported as "not found" so the API
can return 404 and let the frontend adapter fall back to its seed/default —
mirroring how `localStorage.getItem` returning null triggered the seed path.

The ECS task role already grants dynamodb:* on `${project}-*` tables (see
infrastructure/ecs.tf), so no extra IAM is needed.
"""
import os
from typing import Any, Optional

import boto3
from boto3.dynamodb.conditions import Key

# Table name is injected by the ECS task definition (DYNAMODB_TABLE); the default
# matches infrastructure/dynamodb.tf ("${project_name}-data").
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'novartis-esg-ai-enabled-sust-data')

_TRACKED_DRAFT_PREFIX = 'tracked-draft#'

# Sentinel so a genuinely-stored null/empty value is distinguishable from "no
# item". get_doc returns _MISSING when the item does not exist.
_MISSING = object()


class _Store:
    """Thin wrapper over the DynamoDB table resource.

    Lazily binds the boto3 resource so importing this module never requires AWS
    credentials (tests patch `table` with a moto-backed resource, and the app
    binds on first use inside the container).
    """

    def __init__(self) -> None:
        self._table = None

    @property
    def table(self):
        if self._table is None:
            self._table = boto3.resource('dynamodb').Table(TABLE_NAME)
        return self._table

    # -- generic single-doc access -----------------------------------------
    def get_doc(self, pk: str, sk: str) -> Any:
        """Return the stored value for (pk, sk), or _MISSING if absent."""
        resp = self.table.get_item(Key={'pk': pk, 'sk': sk})
        item = resp.get('Item')
        if item is None or 'value' not in item:
            return _MISSING
        return item['value']

    def put_doc(self, pk: str, sk: str, value: Any) -> None:
        self.table.put_item(Item={'pk': pk, 'sk': sk, 'value': value})

    def delete_doc(self, pk: str, sk: str) -> None:
        self.table.delete_item(Key={'pk': pk, 'sk': sk})

    def query_pk(self, pk: str) -> list[dict]:
        """All items under a partition key (paginated)."""
        items: list[dict] = []
        kwargs = {'KeyConditionExpression': Key('pk').eq(pk)}
        while True:
            resp = self.table.query(**kwargs)
            items.extend(resp.get('Items', []))
            lek = resp.get('LastEvaluatedKey')
            if not lek:
                break
            kwargs['ExclusiveStartKey'] = lek
        return items

    # -- report-scoped channels --------------------------------------------
    def get_report_resource(self, report_id: str, resource: str) -> Any:
        return self.get_doc(f'REPORT#{report_id}', resource)

    def put_report_resource(self, report_id: str, resource: str, value: Any) -> None:
        self.put_doc(f'REPORT#{report_id}', resource, value)

    def delete_report_resource(self, report_id: str, resource: str) -> None:
        self.delete_doc(f'REPORT#{report_id}', resource)

    # -- tracked-draft side-channel (keyed by section) ---------------------
    def get_tracked_draft(self, report_id: str, section_id: str) -> Any:
        return self.get_doc(f'REPORT#{report_id}', f'{_TRACKED_DRAFT_PREFIX}{section_id}')

    def put_tracked_draft(self, report_id: str, section_id: str, html: str) -> None:
        self.put_doc(f'REPORT#{report_id}', f'{_TRACKED_DRAFT_PREFIX}{section_id}', html)

    def delete_tracked_draft(self, report_id: str, section_id: str) -> None:
        self.delete_doc(f'REPORT#{report_id}', f'{_TRACKED_DRAFT_PREFIX}{section_id}')

    def clear_tracked_drafts(self, report_id: str) -> None:
        for item in self.query_pk(f'REPORT#{report_id}'):
            if str(item.get('sk', '')).startswith(_TRACKED_DRAFT_PREFIX):
                self.delete_doc(item['pk'], item['sk'])

    # -- reset (Reset Demo): drop the whole report scope -------------------
    def reset_report(self, report_id: str) -> None:
        for item in self.query_pk(f'REPORT#{report_id}'):
            self.delete_doc(item['pk'], item['sk'])

    # -- structure admin channel -------------------------------------------
    def get_structure(self, resource: str) -> Any:
        return self.get_doc('STRUCTURE', resource)

    def put_structure(self, resource: str, value: Any) -> None:
        self.put_doc('STRUCTURE', resource, value)

    def delete_structure(self, resource: str) -> None:
        self.delete_doc('STRUCTURE', resource)

    # -- uploads ------------------------------------------------------------
    def get_uploads(self) -> Any:
        return self.get_doc('UPLOADS', 'files')

    def put_uploads(self, value: Any) -> None:
        self.put_doc('UPLOADS', 'files', value)

    # -- admin config (single app-wide document) ----------------------------
    def get_admin_config(self) -> Any:
        return self.get_doc('ADMIN', 'config')

    def put_admin_config(self, value: Any) -> None:
        self.put_doc('ADMIN', 'config', value)


store = _Store()

# Re-export the sentinel so routers can test for "not found".
MISSING = _MISSING


def is_missing(value: Any) -> bool:
    return value is _MISSING


# Allowed report-scoped resource names (defence-in-depth: the router validates
# against this set so an arbitrary sk can't be written under a report).
#
# 'section-progress' (edited/updated map) and 'audit-releases' were added with
# the 2026-08-31 role/workflow overhaul; 'ip-signoff' is retained for backward
# compatibility with any state persisted before that change.
REPORT_RESOURCES = frozenset({
    'sections', 'changes', 'approvals', 'locks', 'ip-signoff', 'comments',
    'l2-signoff', 'ai-baseline', 'rollforward', 'versions', 'evidence',
    'section-progress', 'audit-releases',
    # 'datapoint-checklist' — the customer-maintained disclosure-checklist Excel
    # ingested as the authoritative datapoint source of truth (Thevi, 21 Aug 2026).
    'datapoint-checklist',
})

# Allowed structure channel resource names.
STRUCTURE_RESOURCES = frozenset({
    'draft', 'versions', 'published', 'published-versions', 'applied',
})
