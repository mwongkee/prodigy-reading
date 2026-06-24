# ReadQuest cloud sync — infrastructure

Terraform for the cheapest coherent username/password + sync stack. Everything
here is **pay-per-use with no fixed monthly cost**, so an idle app bills ~$0 and
a typical family stays inside the AWS free tier.

| Resource | Why |
| --- | --- |
| **Cognito User Pool** + app client | Kid username/password. Free to 50k monthly active users. |
| **PreSignUp Lambda** | Auto-confirms new logins (kids have no email to verify). |
| **DynamoDB** (on-demand) | One small single-table store, billed per request. |
| **Sync Lambda + Function URL** | Read/write the table. Function URL = **no API Gateway charge**. |
| **IAM** | Least-privilege role scoped to the one table. |

## What it provisions

```
Cognito User Pool ── PreSignUp trigger ──▶ auto-confirm
   │  custom:householdId groups a family
   ▼
Browser ──SignUp / InitiateAuth (public, client-id only)──▶ Cognito
Browser ──Bearer IdToken──▶ Sync Lambda (Function URL) ──verify JWT──▶ DynamoDB
                                          scoped to HH#<householdId>
```

The browser only ever calls **public** Cognito APIs (no AWS credentials). The
Sync Lambda verifies the Cognito IdToken against the pool's JWKS and scopes every
DynamoDB access to the caller's `custom:householdId` claim.

## Apply (manual, credentialed — not run by CI)

> Requires an IAM user/role with permission to create the resources above.

```sh
cd infra
terraform init
terraform plan
terraform apply

# Then wire the app into cloud mode:
terraform output -json vite_env | jq -r 'to_entries[] | "\(.key)=\(.value)"' > ../.env
```

Add your deployed site's origin to `allowed_origins` (CORS) before going live:

```sh
terraform apply -var='allowed_origins=["http://localhost:5173","https://your-site.example"]'
```

With those four `VITE_*` vars present, the app switches itself into cloud mode
(`src/auth/config.ts`); without them it stays fully offline. There is no other
toggle, so an un-provisioned build can never half-connect.

## CI

`terraform validate` runs in CI; `terraform apply` is always a deliberate,
credentialed step. The Lambda sources under `lambda/` have **no dependencies**
(AWS SDK v3 and `node:crypto` ship with the Node 20 runtime), so there is no
build step — Terraform zips the `.mjs` files directly.

## Cost note

Cognito (50k MAU free), DynamoDB on-demand, and a Function URL Lambda all bill
only on use. The realistic monthly cost for a family is dominated by rounding to
zero.
