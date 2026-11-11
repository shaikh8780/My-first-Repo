FROM public.ecr.aws/docker/library/python:3.13-slim-bookworm

# ---------------------------------------------------------------------------
# Security hardening:
#   - apt-get upgrade picks up any OS-level CVE fixes (openssl, glibc, etc.)
#     beyond whatever the base image was last rebuilt with. Safe/fast.
#   - pip/setuptools/wheel kept current so installs themselves don't pull in
#     tooling with known CVEs.
#   - Runtime as a non-root user to reduce blast radius if the FastAPI app
#     is compromised (container escape attempts need root).
# ---------------------------------------------------------------------------

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && python -m pip install --upgrade pip setuptools wheel

WORKDIR /app
# Install from the hashed lock file so the image gets exactly the scanned
# versions. Regenerate with the command at the top of requirements-lock.txt
# after changing requirements.txt.
COPY requirements.txt requirements-lock.txt ./
RUN pip install --no-cache-dir --require-hashes -r requirements-lock.txt

COPY . .

# Drop privileges — FastAPI doesn't need root to bind 8000 (>1024)
RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
