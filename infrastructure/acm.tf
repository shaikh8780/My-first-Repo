# Existing ACM certificate covering domain_name (looked up, not created).

data "aws_acm_certificate" "wildcard" {
  domain      = var.certificate_domain
  statuses    = ["ISSUED"]
  most_recent = true
}
