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
- **Identity (offline-first):** a generated `householdId` lives on the device and
  keys all rows. localStorage stays the source of truth; the cloud is a
  background mirror (last-write-wins per profile), so the app keeps working
  offline and reads/writes stay tiny. A parent **Cognito** login can be layered
  on later to claim a household across devices.
- **IaC:** Terraform module under `infra/` — `aws_dynamodb_table`,
  `aws_lambda_function` + `aws_lambda_function_url`, and a least-privilege
  `aws_iam_role` scoped to that one table. `terraform validate` in CI; `apply`
  is a manual, credentialed step.

### Why this stays cheap

On-demand DynamoDB + a Function URL Lambda have no fixed monthly cost — you pay
per request and per stored item. A household is a handful of small rows synced
occasionally, so a typical family is comfortably inside the AWS free tier.

### Dropping it in

Add `createCloudRepository(householdId)` implementing `HouseholdRepository`
(async; the store's load/switch paths become `await`-aware) or, simpler, keep
the sync local repo as the source of truth and add a thin background syncer that
pushes `saveSave`/`saveHousehold` writes to the Lambda and reconciles on launch.
The UI does not change either way.
