# ReadQuest cloud sync — cheapest coherent username/password + sync stack.
#
#   Cognito User Pool (free to 50k MAU)  → kid username/password
#   PreSignUp Lambda                     → auto-confirm (kids have no email)
#   DynamoDB (on-demand)                 → one small table, pay-per-request
#   Sync Lambda + Function URL           → no API Gateway charge
#
# Nothing here has a fixed monthly cost; an idle app bills ~$0. `apply` is a
# manual, credentialed step — see infra/README.md.

locals {
  name = var.project
  tags = { Project = var.project, ManagedBy = "terraform" }

  cognito_issuer = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

# ---------------------------------------------------------------------------
# Cognito: username + password, plus a custom householdId attribute that groups
# a family's profiles. No email/phone — kids sign in with a plain username.
# ---------------------------------------------------------------------------

resource "aws_cognito_user_pool" "this" {
  name = "${local.name}-users"

  # Username-based sign-in (no email/phone alias).
  auto_verified_attributes = []

  password_policy {
    minimum_length    = var.min_password_length
    require_lowercase = false
    require_uppercase = false
    require_numbers   = false
    require_symbols   = false
  }

  # custom:householdId — set at sign-up, immutable, groups siblings.
  schema {
    name                = "householdId"
    attribute_data_type = "String"
    mutable             = false
    required            = false

    string_attribute_constraints {
      min_length = 1
      max_length = 64
    }
  }

  lambda_config {
    pre_sign_up = aws_lambda_function.presignup.arn
  }

  tags = local.tags
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.name}-web"
  user_pool_id = aws_cognito_user_pool.this.id

  # Public SPA client: no secret, browser-only flows.
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Don't leak whether a username exists on a failed sign-in.
  prevent_user_existence_errors = "ENABLED"

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

# ---------------------------------------------------------------------------
# DynamoDB: single on-demand table. PK = HH#<householdId>, SK = HOUSEHOLD |
# PROFILE#<profileId>.
# ---------------------------------------------------------------------------

resource "aws_dynamodb_table" "this" {
  name         = "${local.name}-sync"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }

  tags = local.tags
}

# ---------------------------------------------------------------------------
# PreSignUp trigger Lambda: auto-confirm new kid logins (no email to verify).
# ---------------------------------------------------------------------------

data "archive_file" "presignup" {
  type        = "zip"
  source_file = "${path.module}/lambda/presignup.mjs"
  output_path = "${path.module}/build/presignup.zip"
}

resource "aws_iam_role" "presignup" {
  name               = "${local.name}-presignup"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "presignup_logs" {
  role       = aws_iam_role.presignup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "presignup" {
  function_name    = "${local.name}-presignup"
  role             = aws_iam_role.presignup.arn
  runtime          = "nodejs20.x"
  handler          = "presignup.handler"
  filename         = data.archive_file.presignup.output_path
  source_code_hash = data.archive_file.presignup.output_base64sha256
  timeout          = 5
  tags             = local.tags
}

resource "aws_lambda_permission" "cognito_presignup" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.presignup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.this.arn
}

# ---------------------------------------------------------------------------
# Sync Lambda: verifies the Cognito IdToken, scopes all DynamoDB access to the
# caller's householdId. Exposed via a Function URL (no API Gateway).
# ---------------------------------------------------------------------------

data "archive_file" "sync" {
  type        = "zip"
  source_file = "${path.module}/lambda/sync.mjs"
  output_path = "${path.module}/build/sync.zip"
}

resource "aws_iam_role" "sync" {
  name               = "${local.name}-sync"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "sync_logs" {
  role       = aws_iam_role.sync.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Least privilege: only this one table, only the four ops the handler uses.
data "aws_iam_policy_document" "sync_ddb" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:Query",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = [aws_dynamodb_table.this.arn]
  }
}

resource "aws_iam_role_policy" "sync_ddb" {
  name   = "${local.name}-sync-ddb"
  role   = aws_iam_role.sync.id
  policy = data.aws_iam_policy_document.sync_ddb.json
}

resource "aws_lambda_function" "sync" {
  function_name    = "${local.name}-sync"
  role             = aws_iam_role.sync.arn
  runtime          = "nodejs20.x"
  handler          = "sync.handler"
  filename         = data.archive_file.sync.output_path
  source_code_hash = data.archive_file.sync.output_base64sha256
  timeout          = 10
  tags             = local.tags

  environment {
    variables = {
      TABLE_NAME      = aws_dynamodb_table.this.name
      COGNITO_ISSUER  = local.cognito_issuer
      COGNITO_CLIENT  = aws_cognito_user_pool_client.web.id
      ALLOWED_ORIGINS = join(",", var.allowed_origins)
    }
  }
}

resource "aws_lambda_function_url" "sync" {
  function_name      = aws_lambda_function.sync.function_name
  authorization_type = "NONE" # auth is the Cognito JWT the handler verifies

  cors {
    allow_origins     = var.allowed_origins
    allow_methods     = ["GET", "PUT", "DELETE"]
    allow_headers     = ["authorization", "content-type"]
    allow_credentials = false
    max_age           = 3600
  }
}

# ---------------------------------------------------------------------------
# Shared: the trust policy both Lambdas assume.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}
