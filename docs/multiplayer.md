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

## Planned cloud path (DynamoDB + Terraform)

Not built yet — scope of the current iteration is client-only. When we add
sync, the goal is **cheapest with the least friction**:

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

### Dropping it in (the follow-up PR)

1. **Auth UI:** add a sign-in screen (username + password → Cognito) and a
   parent-gated "create kid login" flow. The existing `ProfilePicker` becomes
   the post-sign-in household home.
2. **Cloud repo:** add `createCloudRepository(token)` implementing
   `HouseholdRepository`. Simplest path that needs **no UI change**: keep the
   local repo as the source of truth and add a thin background syncer that
   mirrors `saveSave`/`saveHousehold` to the Lambda and reconciles on launch
   (last-write-wins per profile). If we'd rather read straight from the cloud,
   the store's load/switch paths become `await`-aware instead.
3. **Infra:** the `infra/` Terraform above — authored and `terraform validate`'d
   in CI, `apply` run manually with credentials.
