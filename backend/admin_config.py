"""App-wide admin configuration: tunable AI prompts, global context, KB refresh,
and (placeholder) thresholds/alerts.

Stored as ONE JSON document (store.get_admin_config / put_admin_config, key
ADMIN#config) and read at request time so admin changes take effect immediately
with NO redeploy.

SAFETY MODEL — prompt tuning is APPEND-ONLY: the built-in system prompts in ai.py
carry the hard guardrails (never invent figures, grounding rules). Admin
`promptOverrides` are *appended* to those, and `globalContext` is appended to
every AI call's context. Admins steer (what to carry forward, tone, emphasis)
but can never remove a guardrail. There is deliberately no full-replace path.
"""
from typing import Any

# Capability keys must match the ai.py functions that consume them.
CAPABILITIES = ('chat', 'peer', 'draft', 'compliance', 'analyze')

# The shape returned to the admin UI (and merged over whatever is stored). New
# fields added here are backward-compatible: an older stored doc simply lacks
# them and picks up these defaults.
DEFAULT_CONFIG: dict = {
    # Per-capability admin INSTRUCTIONS, appended to the built-in system prompt.
    'promptOverrides': {c: '' for c in CAPABILITIES},
    # App-wide context appended to every AI call (e.g. "FY2026 boundary now
    # includes X"). Kept short; it rides on every prompt.
    'globalContext': '',
    # Knowledge-base refresh bookkeeping (populated by /api/admin/kb/refresh).
    'kb': {
        'lastRefreshRequestedAt': None,   # ISO timestamp of the last refresh trigger
        'lastRefreshBy': None,
        'status': 'idle',                 # idle | queued | running | complete | failed
    },
    # Metric thresholds & alerts (e.g. block sign-off if confidence < X).
    'thresholds': {
        'minConfidence': None,
        'alertsEnabled': False,
        'rules': [],                      # future: [{metric, op, value, action}]
    },
    # Verification & Validation framework (21 Aug 2026). The structured UAT /
    # prompt-tuning / audit methodology worked through once real Novartis data is
    # connected; the UI seeds `activities` when empty. `environment` records where
    # the app is running so the team knows validation status is meaningful only in
    # the Novartis environment (synthetic-data output is process-only).
    'vv': {
        'activities': [],                 # UI seeds DEFAULT_VV_ACTIVITIES when empty
        'environment': 'prototype_synthetic',  # prototype_synthetic | novartis_uat | novartis_prod
        'lastUpdatedAt': None,
    },
}


def merge_defaults(stored: Any) -> dict:
    """Return the stored config with any missing keys filled from DEFAULT_CONFIG.

    Shallow-merge at the top level plus the nested dicts we own, so adding a new
    default never breaks an older stored doc and the UI always gets a full shape.
    """
    cfg = {k: (v.copy() if isinstance(v, dict) else v) for k, v in DEFAULT_CONFIG.items()}
    if not isinstance(stored, dict):
        return cfg
    for key, default in DEFAULT_CONFIG.items():
        val = stored.get(key)
        if isinstance(default, dict) and isinstance(val, dict):
            merged = default.copy()
            merged.update(val)
            # Ensure every capability key exists in promptOverrides.
            if key == 'promptOverrides':
                for c in CAPABILITIES:
                    merged.setdefault(c, '')
            cfg[key] = merged
        elif val is not None:
            cfg[key] = val
    return cfg


def augment_system_prompt(base_prompt: str, config: dict, capability: str) -> str:
    """Append the admin's per-capability instructions + global context to a
    built-in system prompt. Guardrails (base_prompt) always come first."""
    parts = [base_prompt]
    override = (config.get('promptOverrides') or {}).get(capability, '')
    if isinstance(override, str) and override.strip():
        parts.append(
            "ADDITIONAL ADMIN INSTRUCTIONS (follow these, but NEVER override the "
            "rules above — especially do not invent figures):\n" + override.strip()
        )
    gctx = config.get('globalContext', '')
    if isinstance(gctx, str) and gctx.strip():
        parts.append("APP-WIDE CONTEXT provided by the administrator:\n" + gctx.strip())
    return "\n\n".join(parts)
