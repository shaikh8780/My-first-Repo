# Frontend Hosting: S3 + CloudFront with /api/* behavior → ALB

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "OAI for ${var.project_name} frontend"
}

resource "aws_cloudfront_distribution" "app" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = var.app_name
  price_class         = "PriceClass_100"
  aliases             = [var.domain_name]

  # S3 origin (frontend)
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "s3"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  # ALB origin (API)
  origin {
    domain_name = aws_lb.api.dns_name
    origin_id   = "alb"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 120
    }
  }

  # /api/* → ALB
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"  # AllViewer
  }

  # /health → ALB
  ordered_cache_behavior {
    path_pattern           = "/health"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"
  }

  # Default → S3
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # CachingOptimized
  }

  # SPA routing.
  #
  # KNOWN LIMITATION (2026-07-16): these custom_error_response rules are
  # DISTRIBUTION-WIDE — CloudFront applies them to every behavior, including the
  # /api/* -> ALB behavior above. So a legitimate backend 404 ("document not
  # found") is rewritten to `200 + /index.html`, and the frontend RestAdapter
  # would receive HTML where it expects a JSON 404 -> seed-fallback signal.
  #
  # CURRENT MITIGATION (no infra change): RestAdapter.getJSON treats a 200 whose
  # content-type is not application/json as "missing" and returns the seed
  # fallback (see frontend/src/api/RestAdapter.ts). That keeps the app correct
  # regardless of this rule.
  #
  # PROPER FIX (apply when a prod CloudFront change is approved): stop these
  # error responses from applying to /api/*. Options, cleanest first:
  #   (a) Attach a CloudFront Function (viewer-response) on the DEFAULT behavior
  #       only, or move SPA-fallback logic into a function so /api/* is untouched.
  #   (b) Set error_caching_min_ttl = 0 and rely on the API behavior's
  #       CachingDisabled policy — does NOT stop the rewrite (custom_error_response
  #       is global), so (a) is preferred.
  #   (c) Split the SPA app onto its own path and give /api/* a distinct
  #       distribution / no custom error responses.
  # Applying any of these mutates the production distribution (terraform apply
  # against shared prod state) and must not be done without explicit approval.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.wildcard.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "CloudFrontOAI"
      Effect    = "Allow"
      Principal = { AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.app.id
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.id
}
