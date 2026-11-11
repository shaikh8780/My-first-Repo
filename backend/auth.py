"""Cognito JWT validation for FastAPI.

Uses PyJWT (actively maintained) for signature verification. python-jose
was abandoned and has unpatched CVEs (CVE-2024-33663 / CVE-2024-33664);
do not reintroduce it.
"""
import os
import time
import threading
from typing import Optional

import httpx
import jwt
from jwt.algorithms import RSAAlgorithm
from jwt.exceptions import InvalidTokenError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID', '')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID', '__COGNITO_CLIENT_ID__')
COGNITO_REGION = os.environ.get('AWS_REGION', 'us-east-1')

JWKS_URL = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json'
ISSUER = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}'

_jwks_cache: dict = {}
_jwks_fetched_at: float = 0
_jwks_lock = threading.Lock()

security = HTTPBearer(auto_error=False)


def _fetch_jwks() -> dict:
    """Fetch + cache the Cognito JWKS. One-hour TTL; thread-safe refresh."""
    global _jwks_cache, _jwks_fetched_at
    now = time.time()
    if _jwks_cache and (now - _jwks_fetched_at) < 3600:
        return _jwks_cache
    with _jwks_lock:
        if _jwks_cache and (now - _jwks_fetched_at) < 3600:
            return _jwks_cache
        resp = httpx.get(JWKS_URL, timeout=5.0)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = time.time()
        return _jwks_cache


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """Validate the Cognito-issued access/id token and return the user alias.

    Returns the username portion of the `email` claim (e.g. `alice` from
    `alice@example.com`), falling back to `sub` when no email is present.
    """
    if not credentials:
        raise HTTPException(401, 'Missing authorization token')
    try:
        unverified_header = jwt.get_unverified_header(credentials.credentials)
        jwks = _fetch_jwks()
        key_data = next(
            (k for k in jwks.get('keys', []) if k.get('kid') == unverified_header.get('kid')),
            None,
        )
        if not key_data:
            raise InvalidTokenError('Signing key not found in JWKS')

        public_key = RSAAlgorithm.from_jwk(key_data)
        claims = jwt.decode(
            credentials.credentials,
            public_key,
            algorithms=['RS256'],
            audience=COGNITO_CLIENT_ID,
            issuer=ISSUER,
            options={'verify_at_hash': False},
        )
        email = claims.get('email', '')
        if email and '@' in email:
            return email.split('@')[0].lower()
        return claims.get('sub', 'unknown')
    except Exception as e:
        raise HTTPException(401, f'Invalid token: {e}')
