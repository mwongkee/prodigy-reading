# Multi-player & cloud sync

ReadQuest supports several kids per device today, and is wired so a DynamoDB
sync layer can be added later without touching the UI.

## Model: household → profiles

```
Household                       (parent-owned; one per device today)
 ├─ Profile: Mia   → PlayerSave (ratings, progress, pets, placement, log)
 ├─ Profile: Sam   → PlayerSave
 └─ Profile: Ana   → PlayerSave
```

- **Choosing** a player is kid-facing and open (the picker).
- **Adding / renaming / removing** a player is **parent-gated** (`ParentGate`),
  per ETHICS.md #3 & #6 (child-account management is a grown-up step).
- Each profile has fully independent state: its own warm-up/placement, per-strand
  ratings, region progress, custom pets, and dashboard history.

## The persistence seam

Everything goes through one interface — `HouseholdRepository` in
`src/state/storage.ts`:

```ts
interface HouseholdRepository {
  loadHousehold(): HouseholdData;
  saveHousehold(data: HouseholdData): void;
  loadSave(profileId: string): PlayerSave | null;
  saveSave(profileId: string, save: PlayerSave): void;
  deleteSave(profileId: string): void;
}
```

- Today: `createLocalStorageRepository()` (offline-first, synchronous).
- The store autosaves the active profile on every savable change and hydrates a
  profile's `PlayerSave` on switch.
- A legacy single-player save (`readquest.creations`) is migrated into a first
  "Player 1" profile on first run, so existing kids keep their pets.

Keys: `readquest.household.v1`, `readquest.profile.v1.<id>`.

## Cloud path (DynamoDB + Cognito + Terraform)

Implemented and **offline-first**: localStorage is always the synchronous source
of truth. When the Cognito pool is configured (four `VITE_*` env vars present,
see below) the app runs in **cloud mode** — writes also mirror to DynamoDB and a
sign-in pulls a kid's saves. With no env it stays fully offline; there is no
other toggle, so an un-provisioned build can never half-connect. The goal was
**cheapest with the least friction**:

- **Compute:** a single AWS **Lambda Function URL** (no API Gateway → no
  per-request gateway cost), Node/TypeScript handler. One function, a couple of
  routes (`GET /household`, `PUT /profile/{id}`, `DELETE /profile/{id}`).
- **Data:** one **DynamoDB** table, **on-demand (pay-per-request)** billing so an
  idle app costs ~nothing. Single-table design:
  - `PK = HH#<householdId>`, `SK = PROFILE#<profileId>` → profile meta + save.
  - `PK = HH#<householdId>`, `SK = HOUSEHOLD` → the profile index / active id.
- **Identity / auth:** each kid gets a **username + password**, backed by an
  **Amazon Cognito User Pool** (free up to 50k monthly active users → ~$0 at our
  scale, and the cheapest managed username/password on AWS). To stay
  COPPA-aligned (ETHICS #6), a kid login is **created by a parent** behind the
  `ParentGate`; kids then just sign in. Each Cognito user carries a
  `custom:householdId` attribute so a family's profiles group together for sync
  and the parent dashboard. The Cognito `sub` is the stable `profileId`.
  - Offline-first still holds: localStorage is the source of truth and the cloud
    is a background mirror (last-write-wins per profile), so the app works
    offline and signs in only to sync.
- **Authorization:** the Lambda verifies the Cognito JWT and scopes every read/
  write to `HH#<householdId>` from the token — a kid can only touch their own
  household's rows.
- **IaC:** Terraform module under `infra/` — `aws_cognito_user_pool` (+ client),
  `aws_dynamodb_table`, `aws_lambda_function` + `aws_lambda_function_url`, and a
  least-privilege `aws_iam_role` scoped to that one table. `terraform validate`
  in CI; `apply` is a manual, credentialed step.

### Why this stays cheap

Cognito (50k MAU free), on-demand DynamoDB, and a Function URL Lambda all have no
fixed monthly cost — you pay per request and per stored item, with no API Gateway
charge. A household is a handful of small rows synced occasionally, so a typical
family is comfortably inside the AWS free tier.

### How it's wired

- **Auth** (`src/auth/`): one `AuthProvider` interface, two implementations
  chosen by `createAuthProvider()`:
  - `createLocalAuth` — offline stand-in; PBKDF2-hashed credentials in
    localStorage. The app (and a kid's username/password) works with no backend.
  - `createCognitoAuth` — Cognito over plain `fetch` (no AWS SDK): public
    `SignUp` + `InitiateAuth (USER_PASSWORD_AUTH)` only, so the browser needs
    just the app client id. The IdToken's `sub` is the profile id and
    `custom:householdId` is the sync key.
- **Sign-in is identity, not a gate:** a session's `profileId` *is* a local
  `ProfileMeta.id`, so signing in adopts/creates that profile and selects it.
  Plain "Add player" still makes offline-only profiles; "Create a synced login"
  is parent-gated (`ParentGate` → `SignIn`, COPPA).
- **Cloud repo** (`src/state/cloudRepository.ts`): `withCloudSync(local, sync)`
  keeps every write synchronous on local **and** mirrors it fire-and-forget to
  the Lambda; `reconcile()` pulls the cloud snapshot and merges it into local
  (best-effort last-write-wins per profile by `lastPlayedAt`). The store calls
  `reconcile()` on sign-in and boot, then re-hydrates. **No UI goes async**, and
  an offline/erroring cloud never breaks the local app.
- **Infra** (`infra/`): the Terraform above — Cognito pool + client + PreSignUp
  auto-confirm Lambda, on-demand DynamoDB, sync Lambda + Function URL, and a
  least-privilege IAM role. `terraform validate` in CI; `apply` is manual.

### Switching on cloud mode

After `terraform apply`, `terraform output -json vite_env` emits exactly these
four — drop them into `.env`:

```
VITE_AWS_REGION
VITE_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID
VITE_SYNC_API_URL
```

`readCloudConfig()` returns null unless **all four** are set, so partial config
never half-activates.
