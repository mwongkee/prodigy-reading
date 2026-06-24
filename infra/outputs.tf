# These map 1:1 to the Vite env vars the app reads (src/auth/config.ts). After
# `apply`, run `terraform output -json vite_env` and write them into a .env file.

output "aws_region" {
  value = var.aws_region
}

output "user_pool_id" {
  value = aws_cognito_user_pool.this.id
}

output "client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "sync_api_url" {
  value = aws_lambda_function_url.sync.function_url
}

output "vite_env" {
  description = "Drop these into the app's .env to switch it into cloud mode."
  value = {
    VITE_AWS_REGION           = var.aws_region
    VITE_COGNITO_USER_POOL_ID = aws_cognito_user_pool.this.id
    VITE_COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.web.id
    VITE_SYNC_API_URL         = aws_lambda_function_url.sync.function_url
  }
}
