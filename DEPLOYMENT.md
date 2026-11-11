# Deployment

How to deploy the prototype into one AWS account with Terraform. Commands run
from the repo root unless stated.

## What gets created

| Component | Resource |
|---|---|
| Frontend | S3 bucket + CloudFront distribution (also routes `/api/*` and `/health` to the ALB) |
| Backend | ECR repository, ECS Fargate cluster/service (private subnets), internet-facing ALB (public subnets) |
| Data | DynamoDB table |
| Auth | Cognito app client in an existing user pool |
| DNS | Route 53 A record for `domain_name` pointing at CloudFront |
| Optional | Bedrock Knowledge Base + OpenSearch Serverless (`enable_knowledge_base = true`; never applied so far) |

Confirm these services, the internet-facing ALB and CloudFront are allowed in
the target account before you start. If they are not, the frontend hosting and
load balancer in `infrastructure/frontend.tf` and `infrastructure/alb.tf` need
to change.

## Prerequisites

In the target account:

- A VPC with private and public subnets, identifiable by a `Name` tag pattern.
  ECS tasks need outbound access to ECR, DynamoDB, Bedrock and CloudWatch Logs
  (NAT or VPC endpoints).
- A Route 53 public hosted zone (`parent_zone_name`).
- An issued ACM certificate covering `domain_name` in **us-east-1**. CloudFront
  only accepts us-east-1 certificates, and the ALB uses the same certificate
  lookup, so deploy in us-east-1 or split the lookup.
- A Cognito user pool with a hosted-UI domain. Users are created in that pool
  (or federated into it; add the provider name to `cognito_identity_providers`).
- Bedrock model access for the model you set in `bedrock_model_id`.
- An S3 bucket and DynamoDB table for Terraform state and locking.

On the deploying machine: Terraform >= 1.5, AWS CLI v2, Docker (builds
`linux/amd64`), Node.js 20+, Python 3.13.

## 1. Configure Terraform

```bash
cd infrastructure
cp backend.hcl.example backend.hcl            # state bucket, key, lock table
cp terraform.tfvars.example terraform.tfvars  # account, domain, VPC, Cognito, model
```

Also set in `terraform.tfvars`:

```hcl
admin_aliases = ["<alias>"]   # users with admin rights in the backend
```

The backend derives a user's alias from the `email` claim (the part before
`@`), falling back to `sub`. Do not commit `backend.hcl` or `terraform.tfvars`.

## 2. Create the infrastructure

```bash
terraform init -backend-config=backend.hcl
terraform apply
```

The first apply creates the ECR repository and an ECS service that points at
`<ecr_repository_url>:latest`. Tasks fail to start until step 3 pushes an image.

## 3. Build and push the backend image

```bash
REGION=us-east-1
REPO=$(terraform -chdir=infrastructure output -raw ecr_repository_url)
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "${REPO%%/*}"
docker build --platform linux/amd64 -t "$REPO:latest" backend
docker push "$REPO:latest"
aws ecs update-service --region "$REGION" \
  --cluster novartis-esg-ai-enabled-sust \
  --service novartis-esg-ai-enabled-sust-api --force-new-deployment
```

Cluster and service names follow `project_name`; change them if you override it.
The image installs Python packages from the hashed `backend/requirements-lock.txt`.

## 4. Build and publish the frontend

```bash
export AWS_ACCOUNT_ID=<account-id>
export APP_HOSTNAME=<domain_name>
export COGNITO_USER_POOL_ID=<pool-id>
export COGNITO_DOMAIN=<prefix>.auth.<region>.amazoncognito.com
./deploy-frontend.sh
```

The script checks the caller account, reads the Cognito client ID and CloudFront
ID from Terraform, builds the SPA, syncs it to S3 and invalidates CloudFront.
It writes the real values into `frontend/.env.production` for the build and
restores the placeholders afterwards.

## 5. Configure roles

- **Backend admins:** `admin_aliases` (step 1). Empty means no admins.
- **Frontend structure admins:** `STRUCTURE_ADMIN_ALIASES` in
  `frontend/src/data/permissions.ts` and `EDITOR_ALIASES` in
  `frontend/src/data/workflowRoles.ts` hold synthetic demo aliases. Replace them,
  or move to Cognito groups, before real users sign in. Frontend checks are not
  a security boundary. The backend requires sign-in on every `/api` route but
  checks roles only on `/api/admin/*`.

## 6. Verify

```bash
curl -s https://<domain_name>/health                 # 200
BASE=https://<domain_name> ./scripts/smoke-prod.sh    # health + 401 checks
BASE=https://<domain_name> ID_TOKEN=<id-token> ./scripts/smoke-prod.sh  # + data and AI routes
```

The script header explains how to copy an ID token after signing in. It writes
only to a throwaway report (`__smoke`) and deletes it.

## Known gaps for a production deployment

See `docs/SECURITY-SCAN.md` for the scan record. Not done in this prototype:

- CloudFront to ALB traffic is HTTP (`origin_protocol_policy = "http-only"`).
- No AWS WAF; no customer-managed KMS keys; limited access logging and log retention.
- ECR tags are mutable; security-group egress is open.
- The default Bedrock model is retired (see README.md).
- Callback URLs on the Cognito app client include `http://localhost:5173`;
  remove them outside development (`infrastructure/cognito.tf`).
