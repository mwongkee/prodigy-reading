variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Name prefix for all resources."
  type        = string
  default     = "readquest"
}

variable "allowed_origins" {
  description = "Browser origins allowed to call the sync Function URL (CORS). Add your deployed site here."
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "min_password_length" {
  description = "Cognito minimum password length. Keep in sync with MIN_PASSWORD_LENGTH in src/auth/types.ts."
  type        = number
  default     = 6
}
