variable "project_name" {
  description = "Short project slug (used for resource naming, max 28 chars)"
  default     = "novartis-esg-ai-enabled-sust"
}

variable "app_name" {
  default = "Novartis ESG AI-Enabled Sustainability Report Generation"
}

variable "aws_region" {
  default = "us-east-1"
}

variable "aws_account_id" {
  description = "Target AWS account ID"
  type        = string
}

variable "domain_name" {
  description = "Fully qualified hostname of the app"
  type        = string
}

variable "parent_zone_name" {
  description = "Route 53 hosted zone that domain_name belongs to"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID in the target account"
  type        = string
}

variable "cognito_domain" {
  description = "Cognito hosted-UI domain, e.g. <prefix>.auth.<region>.amazoncognito.com"
  type        = string
}

variable "cognito_identity_providers" {
  description = "Identity providers enabled on the app client. Add a SAML/OIDC provider name here once it exists in the user pool."
  type        = list(string)
  default     = ["COGNITO"]
}

variable "vpc_id" {
  description = "Existing VPC to deploy into"
  type        = string
}

variable "private_subnet_name_filter" {
  description = "Name-tag pattern selecting the private subnets in vpc_id"
  type        = string
}

variable "public_subnet_name_filter" {
  description = "Name-tag pattern selecting the public subnets in vpc_id"
  type        = string
}

variable "certificate_domain" {
  description = "Domain of an issued ACM certificate covering domain_name, e.g. *.example.com"
  type        = string
}

variable "backend_image" {
  description = "Backend Docker image URI (set by CI/CD)"
  default     = ""
}

locals {
  environment = "prod"
}

variable "bedrock_model_id" {
  description = "Bedrock model the backend calls. Also scopes the task role's InvokeModel permission."
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "admin_aliases" {
  description = "User aliases (Cognito username or email prefix) granted admin rights in the backend. Empty = no admins."
  type        = list(string)
  default     = []
}
