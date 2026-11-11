# Route53 DNS record pointing to CloudFront

resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.parent.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.app.domain_name
    zone_id                = aws_cloudfront_distribution.app.hosted_zone_id
    evaluate_target_health = false
  }
}

output "app_url" {
  value = "https://${var.domain_name}"
}
