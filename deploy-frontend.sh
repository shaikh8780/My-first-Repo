#!/usr/bin/env bash
#
# Manual frontend deploy: read the Cognito client ID from Terraform, build the
# SPA, sync it to S3 and invalidate CloudFront. See DEPLOYMENT.md.
#
# Prerequisites:
#   - `terraform apply` has run in infrastructure/ (outputs are read from it).
#   - Authenticated to the target AWS account with S3 write, CloudFront
#     invalidation and Terraform state read permissions.
#   - Environment variables: AWS_ACCOUNT_ID, APP_HOSTNAME, COGNITO_USER_POOL_ID,
#     COGNITO_DOMAIN (optional: AWS_REGION, S3_BUCKET).
#   - Run from the repo root.
#
# The real Cognito client ID is read from Terraform at runtime and written into
# frontend/.env.production. That file keeps the __CREATED_BY_TERRAFORM__
# placeholder in git — do NOT commit the resolved value.

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?set AWS_ACCOUNT_ID to the target account}"
S3_BUCKET="${S3_BUCKET:-novartis-esg-ai-enabled-sust-frontend}"
APP_HOSTNAME="${APP_HOSTNAME:?set APP_HOSTNAME (same as Terraform domain_name)}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:?set COGNITO_USER_POOL_ID}"
COGNITO_DOMAIN="${COGNITO_DOMAIN:?set COGNITO_DOMAIN}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

# --- Safety: confirm we are pointed at the expected account -----------------
CALLER_ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
if [ "$CALLER_ACCOUNT" != "$AWS_ACCOUNT_ID" ]; then
  echo "ERROR: current AWS account is $CALLER_ACCOUNT, expected $AWS_ACCOUNT_ID." >&2
  echo "Authenticate to $AWS_ACCOUNT_ID first." >&2
  exit 1
fi
echo "==> Authenticated to account $CALLER_ACCOUNT"

# --- Read Terraform outputs -------------------------------------------------
if command -v terraform >/dev/null 2>&1; then
  echo "==> Reading Terraform outputs via terraform CLI"
  pushd infrastructure >/dev/null
  terraform init -input=false -backend-config=backend.hcl >/dev/null
  COGNITO_CLIENT_ID="$(terraform output -raw cognito_client_id)"
  CF_DIST_ID="$(terraform output -raw cloudfront_distribution_id)"
  popd >/dev/null
else
  echo "ERROR: terraform CLI is required to read the outputs." >&2
  exit 1
fi

if [ -z "$COGNITO_CLIENT_ID" ]; then
  echo "ERROR: cognito_client_id Terraform output is empty." >&2
  exit 1
fi
echo "==> Cognito client ID resolved; CloudFront distribution: ${CF_DIST_ID:-<none>}"

# --- Write frontend/.env.production (real ID, not committed) ----------------
echo "==> Writing frontend/.env.production"
cat > frontend/.env.production << EOF
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_COGNITO_DOMAIN=$COGNITO_DOMAIN
VITE_APP_HOSTNAME=$APP_HOSTNAME
VITE_APP_NAME=Novartis ESG AI-Enabled Sustainability Report Generation
VITE_API_ENDPOINT=/api
VITE_API_MODE=rest
EOF

# --- Build the frontend -----------------------------------------------------
echo "==> Building frontend"
pushd frontend >/dev/null
npm install
npm run build
popd >/dev/null

# --- Deploy to S3 -----------------------------------------------------------
# Two-pass sync with correct cache headers:
#  1. Fingerprinted assets (/assets/index-<hash>.js|css) are immutable — cache
#     them for a year so returning users don't re-download unchanged bundles.
#  2. index.html (and other non-hashed files) MUST be revalidated every load, or
#     browsers/CloudFront keep serving an OLD index.html that points at a stale
#     bundle — which shows old UI or a blank screen after a deploy. Serve it
#     no-cache so a new deploy is picked up immediately (paired with the
#     CloudFront invalidation below).
echo "==> Syncing hashed assets to s3://$S3_BUCKET (long cache)"
aws s3 sync frontend/dist/ "s3://$S3_BUCKET" --delete \
  --exclude "*.html" \
  --cache-control "public,max-age=31536000,immutable"

echo "==> Syncing HTML to s3://$S3_BUCKET (no-cache)"
aws s3 sync frontend/dist/ "s3://$S3_BUCKET" \
  --exclude "*" --include "*.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

# --- Invalidate CloudFront --------------------------------------------------
if [ -n "$CF_DIST_ID" ]; then
  echo "==> Invalidating CloudFront distribution $CF_DIST_ID"
  aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"
else
  echo "WARN: no CloudFront distribution ID; skipping invalidation." >&2
fi

# --- Restore the committed placeholder so the real ID never lands in git ----
echo "==> Restoring frontend/.env.production placeholder"
git checkout -- frontend/.env.production 2>/dev/null || true

echo "==> Done. Verify: https://$APP_HOSTNAME/ (hard-refresh)"
