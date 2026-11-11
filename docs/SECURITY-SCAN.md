# Security scan record

Scanner: ProtoShield v0.17.2 (Semgrep, Bandit, CVE, Checkov, Secrets, IAM least-privilege).
Scan reports are written to `.protoshield/scans/` (not committed).

## 30 Oct 2026 (handover export)

Scanned the `git archive` export (what is handed over), all plugins enabled.

| Scanner | Critical | High | Medium | Low |
|---|---|---|---|---|
| Semgrep, Secrets, IAM least-privilege | 0 | 0 | 0 | 0 |
| CVE (dependencies) | 0 | 0 | 6 | 1 |
| Checkov (Terraform) | 0 | 0 | 36 | 0 |
| Bandit | 0 | 0 | 0 | 137 |
| License headers | 0 | 140 | 0 | 0 |

The six scanners used on 27 Oct are unchanged at 0 critical / 0 high. The
license-headers check was not enabled on 27 Oct; it reports no LICENSE file and
no Apache 2.0 header in 139 source files. Open: the license for this code has
not been decided.

Medium CVEs: idna, react-router, react-router-dom, @tiptap/core (major upgrade).
Low: esbuild (dev server, Windows only).

## 27 Oct 2026

| Scan | Critical | High | Medium | Low |
|---|---|---|---|---|
| Baseline (`9ecf5b0`) | 9 | 30 | 78 | 147 |
| Final (scan 1793095193807832000) | 0 | 0 | 42 | 138 |

Fixed: all critical and high dependency CVEs (PyJWT, AnyIO, certifi, jsPDF,
Vitest/Tinypool, ProseMirror, markdown-it, fast-xml-parser, Vite, nanoid,
Browserslist, PostCSS, source-map-js); ECS task role narrowed from `dynamodb:*`
and `foundation-model/*`; unused S3 permissions removed; Knowledge Base
data-access policy narrowed from `aoss:*`.

## Justified findings

| Finding | Severity | Disposition |
|---|---|---|
| `aoss:APIAccessAll` on the Knowledge Base service role (`infrastructure/knowledge-base.tf`) | Was High; not raised in the final scan | Kept by design. It is the only IAM action that grants OpenSearch Serverless data-plane access and the policy AWS documents for a Bedrock Knowledge Base service role. Scoped to one collection; data rights are limited by the collection's data-access policy. The stack is disabled by default (`enable_knowledge_base = false`). |
| DynamoDB `Query` on the ECS task role | Was High; not raised in the final scan | Required. The reviewer confirms the action is used (`store.py` `query_pk()`). Policy grants only GetItem, PutItem, DeleteItem and Query on the one table. |
| Bandit B101 `assert` (137) | Low | Test code only. |

## Residual risk for Novartis (medium, not fixed in the build)

Production hardening, owned by Novartis at deployment: AWS WAF on CloudFront and
the load balancer; HTTPS between CloudFront and the load balancer; customer-managed
KMS keys for DynamoDB, S3, ECR and logs; access logging (CloudFront, ALB, S3) and
longer log retention; ECR image tag immutability; restricted security-group egress;
remaining medium dependency CVEs.
