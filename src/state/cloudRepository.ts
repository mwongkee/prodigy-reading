import type { HouseholdData, HouseholdRepository, PlayerSave, ProfileMeta } from './storage';

/**
 * Cloud sync layer (DynamoDB-backed via the sync Lambda Function URL).
 *
 * Design goal from docs/multiplayer.md: **the UI and store never go async.**
 * localStorage stays the synchronous source of truth; the cloud is a background
 * mirror. So this module is two pieces:
 *
 *   - `CloudSync` — the async transport (`createHttpCloudSync` talks to the
 *     Lambda with the Cognito JWT). No-ops when signed out (no token).
 *   - `withCloudSync` — wraps a local `HouseholdRepository`: every write still
 *     hits local synchronously and is *also* mirrored to the cloud fire-and-
 *     forget. `reconcile()` pulls the cloud snapshot and merges it into local
 *     (best-effort last-write-wins per profile), for the store to call on
 *     sign-in / boot.
 *
 * Failures never surface: an offline or erroring cloud leaves the local app
 * fully working.
 */

export interface CloudSnapshot {
  household: HouseholdData | null;
  /** Per-profile save keyed by profile id. */
  saves: Record<string, PlayerSave>;
}

export interface CloudSync {
  pull(): Promise<CloudSnapshot>;
  pushHousehold(data: HouseholdData): Promise<void>;
  pushSave(profileId: string, save: PlayerSave): Promise<void>;
  deleteSave(profileId: string): Promise<void>;
}

export interface SyncedRepository extends HouseholdRepository {
  /**
   * Pull the cloud snapshot and merge it into local storage (LWW per profile).
   * Resolves true when local changed (so the store can re-hydrate). Best-effort:
   * any error resolves false, never throws.
   */
  reconcile(): Promise<boolean>;
}

// ---- HTTP transport against the sync Lambda Function URL ----

type FetchFn = typeof fetch;

export function createHttpCloudSync(opts: {
  apiUrl: string;
  /** Current bearer token (Cognito IdToken), or null when signed out. */
  getToken: () => string | null;
  fetchFn?: FetchFn;
}): CloudSync {
  const base = opts.apiUrl.replace(/\/$/, '');
  const fetchFn = opts.fetchFn ?? fetch;

  async function send(path: string, init: RequestInit): Promise<Response | null> {
    const token = opts.getToken();
    if (!token) return null; // signed out → no-op
    const res = await fetchFn(`${base}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
    });
    if (!res.ok) throw new Error(`sync ${init.method} ${path} → ${res.status}`);
    return res;
  }

  return {
    async pull() {
      const res = await send('/state', { method: 'GET' });
      if (!res) return { household: null, saves: {} };
      const body = (await res.json()) as Partial<CloudSnapshot>;
      return { household: body.household ?? null, saves: body.saves ?? {} };
    },
    async pushHousehold(data) {
      await send('/household', { method: 'PUT', body: JSON.stringify(data) });
    },
    async pushSave(profileId, save) {
      await send(`/profile/${encodeURIComponent(profileId)}`, { method: 'PUT', body: JSON.stringify(save) });
    },
    async deleteSave(profileId) {
      await send(`/profile/${encodeURIComponent(profileId)}`, { method: 'DELETE' });
    },
  };
}

// ---- merge helpers (exported for tests) ----

/**
 * Merge a cloud snapshot into local data, last-write-wins per profile using
 * `lastPlayedAt`. Returns the merged household plus the set of profile ids whose
 * *cloud* save should overwrite local (cloud is newer or local-missing).
 */
export function mergeHousehold(
  local: HouseholdData,
  cloud: HouseholdData,
): { merged: HouseholdData; cloudWins: Set<string> } {
  const byId = new Map<string, ProfileMeta>();
  const cloudWins = new Set<string>();
  for (const p of local.profiles) byId.set(p.id, p);
  for (const c of cloud.profiles) {
    const mine = byId.get(c.id);
    if (!mine || c.lastPlayedAt > mine.lastPlayedAt) {
      byId.set(c.id, c);
      cloudWins.add(c.id);
    }
  }
  // Keep the device's current selection if it still exists, else the cloud's.
  const merged: HouseholdData = {
    profiles: [...byId.values()],
    activeProfileId:
      local.activeProfileId && byId.has(local.activeProfileId)
        ? local.activeProfileId
        : cloud.activeProfileId,
  };
  return { merged, cloudWins };
}

// ---- the wrapper ----

export function withCloudSync(
  local: HouseholdRepository,
  sync: CloudSync,
  onError: (err: unknown) => void = () => {},
): SyncedRepository {
  /** Mirror a write to the cloud without blocking or breaking the local path. */
  const mirror = (p: Promise<void>) => void p.catch(onError);

  return {
    loadHousehold: () => local.loadHousehold(),
    loadSave: (id) => local.loadSave(id),

    saveHousehold(data) {
      local.saveHousehold(data);
      mirror(sync.pushHousehold(data));
    },
    saveSave(profileId, save) {
      local.saveSave(profileId, save);
      mirror(sync.pushSave(profileId, save));
    },
    deleteSave(profileId) {
      local.deleteSave(profileId);
      mirror(sync.deleteSave(profileId));
    },

    async reconcile() {
      try {
        const snap = await sync.pull();
        const localHH = local.loadHousehold();

        // First sync of a fresh device: adopt the cloud household wholesale.
        if (!snap.household) {
          // Push whatever this device already has up to the cloud, then done.
          if (localHH.profiles.length) {
            mirror(sync.pushHousehold(localHH));
            for (const p of localHH.profiles) {
              const s = local.loadSave(p.id);
              if (s) mirror(sync.pushSave(p.id, s));
            }
          }
          return false;
        }

        const { merged, cloudWins } = mergeHousehold(localHH, snap.household);
        let changed = cloudWins.size > 0;

        for (const id of cloudWins) {
          const cloudSave = snap.saves[id];
          if (cloudSave) local.saveSave(id, cloudSave);
        }
        if (
          changed ||
          merged.activeProfileId !== localHH.activeProfileId ||
          merged.profiles.length !== localHH.profiles.length
        ) {
          local.saveHousehold(merged);
          changed = true;
        }

        // Converge the other way: push profiles the cloud is missing/older on.
        for (const p of merged.profiles) {
          if (!cloudWins.has(p.id)) {
            const s = local.loadSave(p.id);
            if (s) mirror(sync.pushSave(p.id, s));
          }
        }
        mirror(sync.pushHousehold(merged));

        return changed;
      } catch (err) {
        onError(err);
        return false;
      }
    },
  };
}
