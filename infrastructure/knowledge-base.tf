# ---------------------------------------------------------------------------
# Bedrock Knowledge Base + OpenSearch Serverless (RAG vector store).
#
# STATUS: WRITTEN, NEVER APPLIED. Disabled by default (enable_knowledge_base =
# false). Provisioning needs IAM role creation + `terraform apply` by an
# infra-capable principal; once applied, the backend switches to it via env —
# see the `RETRIEVER` / `BEDROCK_KB_ID` wiring at the bottom.
#
# Until then the backend uses the offline LocalRetriever over the committed
# corpus (backend/kb_corpus.json) — real retrieval + citations, no infra.
#
# Design follows CLAUDE.md: OpenSearch Serverless VectorSearch collection,
# amazon.titan-embed-text-v2:0 embeddings, S3 raw-documents data source,
# metadata filtering by docType/framework/year.
#
# To enable later:
#   1. terraform apply (with an IAM-capable principal)
#   2. upload source docs to the raw-documents bucket (or run the ingestion job)
#   3. set BEDROCK_KB_ID + RETRIEVER=bedrock on the ECS task (see ecs.tf note)
# ---------------------------------------------------------------------------

# NOTE: guarded by a flag so a plain `terraform apply` of the existing stack does
# NOT accidentally start billing for OpenSearch Serverless. Set to true only when
# intentionally standing up the KB.
variable "enable_knowledge_base" {
  type        = bool
  default     = false
  description = "Provision the Bedrock KB + OpenSearch Serverless vector store. Off by default (AOSS has standing cost)."
}

locals {
  kb_name         = "${var.project_name}-kb"
  aoss_collection = "${var.project_name}-vectors"
  kb_count        = var.enable_knowledge_base ? 1 : 0
}

# --- S3 data source: raw source documents (PDFs/DOCX ingested into the KB) ---
resource "aws_s3_bucket" "raw_documents" {
  count  = local.kb_count
  bucket = "${var.project_name}-raw-documents"
}

resource "aws_s3_bucket_public_access_block" "raw_documents" {
  count                   = local.kb_count
  bucket                  = aws_s3_bucket.raw_documents[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "raw_documents" {
  count  = local.kb_count
  bucket = aws_s3_bucket.raw_documents[0].id
  versioning_configuration { status = "Enabled" }
}

# --- OpenSearch Serverless: encryption / network / data-access policies ------
resource "aws_opensearchserverless_security_policy" "kb_encryption" {
  count = local.kb_count
  name  = "${var.project_name}-kb-enc"
  type  = "encryption"
  policy = jsonencode({
    Rules       = [{ ResourceType = "collection", Resource = ["collection/${local.aoss_collection}"] }]
    AWSOwnedKey = true
  })
}

resource "aws_opensearchserverless_security_policy" "kb_network" {
  count = local.kb_count
  name  = "${var.project_name}-kb-net"
  type  = "network"
  policy = jsonencode([{
    Rules = [
      { ResourceType = "collection", Resource = ["collection/${local.aoss_collection}"] },
      { ResourceType = "dashboard", Resource = ["collection/${local.aoss_collection}"] },
    ]
    AllowFromPublic = true # tighten to a VPC endpoint in the target environment
  }])
}

resource "aws_opensearchserverless_collection" "kb" {
  count      = local.kb_count
  name       = local.aoss_collection
  type       = "VECTORSEARCH"
  depends_on = [aws_opensearchserverless_security_policy.kb_encryption]
}

# Data-access policy: the KB service role + the ECS task role may read/write the
# collection index.
resource "aws_opensearchserverless_access_policy" "kb_data" {
  count = local.kb_count
  name  = "${var.project_name}-kb-data"
  type  = "data"
  policy = jsonencode([{
    Rules = [
      { ResourceType = "index", Resource = ["index/${local.aoss_collection}/*"], Permission = ["aoss:CreateIndex", "aoss:DeleteIndex", "aoss:UpdateIndex", "aoss:DescribeIndex", "aoss:ReadDocument", "aoss:WriteDocument"] },
      { ResourceType = "collection", Resource = ["collection/${local.aoss_collection}"], Permission = ["aoss:CreateCollectionItems", "aoss:DeleteCollectionItems", "aoss:UpdateCollectionItems", "aoss:DescribeCollectionItems"] },
    ]
    Principal = [aws_iam_role.kb_role[0].arn, aws_iam_role.ecs_task.arn]
  }])
}

# --- KB service role ---------------------------------------------------------
resource "aws_iam_role" "kb_role" {
  count = local.kb_count
  name  = "${var.project_name}-kb-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "bedrock.amazonaws.com" }
      Condition = { StringEquals = { "aws:SourceAccount" = var.aws_account_id } }
    }]
  })
}

resource "aws_iam_role_policy" "kb_role" {
  count = local.kb_count
  name  = "${var.project_name}-kb-policy"
  role  = aws_iam_role.kb_role[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["bedrock:InvokeModel"], Resource = ["arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v2:0"] },
      # aoss:APIAccessAll is the only IAM action that grants OpenSearch Serverless
      # data-plane access; there is no finer-grained IAM action. It is scoped to
      # this one collection, and what the role may do inside it is limited by the
      # data-access policy above (index and collection item actions only). This
      # is the policy AWS documents for a Knowledge Base service role (Bedrock
      # User Guide, "Create a service role for Amazon Bedrock Knowledge Bases").
      { Effect = "Allow", Action = ["aoss:APIAccessAll"], Resource = [aws_opensearchserverless_collection.kb[0].arn] },
      { Effect = "Allow", Action = ["s3:ListBucket"], Resource = [aws_s3_bucket.raw_documents[0].arn], Condition = { StringEquals = { "aws:ResourceAccount" = var.aws_account_id } } },
      { Effect = "Allow", Action = ["s3:GetObject"], Resource = ["${aws_s3_bucket.raw_documents[0].arn}/*"], Condition = { StringEquals = { "aws:ResourceAccount" = var.aws_account_id } } },
    ]
  })
}

# --- The Bedrock Knowledge Base + S3 data source -----------------------------
# NOTE: the AOSS index (with the titan v2 1024-dim vector field + text/metadata
# fields) must exist before the KB is created. Create it via the ingestion
# bootstrap (aws opensearch API / a null_resource) — documented in the ingestion
# runbook; not inlined here because it needs data-plane access at apply time.
resource "aws_bedrockagent_knowledge_base" "kb" {
  count    = local.kb_count
  name     = local.kb_name
  role_arn = aws_iam_role.kb_role[0].arn
  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v2:0"
    }
  }
  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.kb[0].arn
      vector_index_name = "${var.project_name}-index"
      field_mapping {
        vector_field   = "vector"
        text_field     = "text"
        metadata_field = "metadata"
      }
    }
  }
  depends_on = [aws_opensearchserverless_access_policy.kb_data]
}

resource "aws_bedrockagent_data_source" "raw_documents" {
  count             = local.kb_count
  knowledge_base_id = aws_bedrockagent_knowledge_base.kb[0].id
  name              = "${var.project_name}-raw-documents"
  data_source_configuration {
    type = "S3"
    s3_configuration { bucket_arn = aws_s3_bucket.raw_documents[0].arn }
  }
  vector_ingestion_configuration {
    chunking_configuration {
      chunking_strategy = "FIXED_SIZE"
      fixed_size_chunking_configuration {
        max_tokens         = 512
        overlap_percentage = 10
      }
    }
  }
}

output "knowledge_base_id" {
  value       = local.kb_count > 0 ? aws_bedrockagent_knowledge_base.kb[0].id : ""
  description = "Set this as BEDROCK_KB_ID on the ECS task to switch the backend to real RAG."
}

# ---------------------------------------------------------------------------
# WIRING (when the KB is live): add to the ECS task container `environment` in
# ecs.tf so the backend's retrieval.py uses the Bedrock retriever:
#
#   { name = "BEDROCK_KB_ID", value = aws_bedrockagent_knowledge_base.kb[0].id },
#   { name = "RETRIEVER",     value = "bedrock" },
#
# and add to the ECS task IAM policy (ecs.tf) so the task may query the KB:
#   bedrock:Retrieve, bedrock:RetrieveAndGenerate on the KB arn, plus
#   aoss:APIAccessAll on the collection arn.
# ---------------------------------------------------------------------------
