# Cognito app client for this project, created in the existing user pool
# given by var.cognito_user_pool_id. Callback URLs use var.domain_name.

resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.project_name}-client"
  user_pool_id = var.cognito_user_pool_id

  generate_secret = false

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = var.cognito_identity_providers

  callback_urls = [
    "https://${var.domain_name}",
    "https://${var.domain_name}/callback",
    "http://localhost:5173",
    "http://localhost:5173/callback",
  ]

  logout_urls = [
    "https://${var.domain_name}",
    "http://localhost:5173",
  ]

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  prevent_user_existence_errors = "ENABLED"
}

output "cognito_client_id" {
  value       = aws_cognito_user_pool_client.app.id
  description = "Cognito App Client ID for this project"
}
