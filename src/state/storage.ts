import type { LearnerState, Rating, StrandId } from '../engine/adaptive';
import type { PetSpecies } from '../content';

/**
 * Persistence seam for multi-player support.
 *
 * A *household* owns several kid *profiles*; each profile has its own saved game
 * (`PlayerSave`). Today the only implementation is localStorage, but every read
 * and write goes through `HouseholdRepository`, so a DynamoDB-backed sync layer
 * can drop in later without touching the store or UI. (The cloud path is sketched
 * in docs/multiplayer.md.)
 */

/** One recorded answer, surfaced in the parent dashboard. */
export interface SessionEntry {
  strand: StrandId;
  correctness: number;
  ratingAfter: Rating;
  at: number;
}

/** The full, serializable game state for a single profile. */
export interface PlayerSave {
  learner: LearnerState;
  seedRating: Rating | null;
  placed: boolean;
  customPets: PetSpecies[];
  speciesId: string;
  xp: number;
  level: number;
  petStage: number;
  progress: Record<StrandId, number>;
  bossDefeated: Record<StrandId, boolean>;
  keystones: string[];
  finaleWon: boolean;
  log: SessionEntry[];
}

/** Lightweight per-profile card shown on the player picker. */
export interface ProfileMeta {
  id: string;
  name: string;
  /** Active pet id — drives the avatar on the picker. */
  speciesId: string;
  createdAt: number;
  lastPlayedAt: number;
}

export interface HouseholdData {
  profiles: ProfileMeta[];
  activeProfileId: string | null;
}

export interface HouseholdRepository {
  loadHousehold(): HouseholdData;
  saveHousehold(data: HouseholdData): void;
  loadSave(profileId: string): PlayerSave | null;
  saveSave(profileId: string, save: PlayerSave): void;
  deleteSave(profileId: string): void;
}

/** Minimal subset of the Web Storage API we depend on (so tests can fake it). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const HOUSEHOLD_KEY = 'readquest.household.v1';
const saveKey = (id: string) => `readquest.profile.v1.${id}`;
/** The pre-multiplayer single-player blob, migrated into a first profile. */
const LEGACY_KEY = 'readquest.creations';

/** Collision-resistant id without pulling in a uuid dependency. */
export function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const emptyHousehold = (): HouseholdData => ({ profiles: [], activeProfileId: null });

/**
 * localStorage-backed repository. Pass a fake `StorageLike` in tests. Reads are
 * defensive: malformed JSON is treated as "no data" rather than throwing, so a
 * corrupt entry can never brick the app.
 */
export function createLocalStorageRepository(
  storage: StorageLike | undefined = (globalThis as { localStorage?: StorageLike }).localStorage,
): HouseholdRepository {
  // In-memory fallback keeps the app usable even if storage is unavailable
  // (private mode, disabled cookies). Data just won't survive a reload.
  const store: StorageLike = storage ?? memoryStorage();

  function read<T>(key: string): T | null {
    const raw = store.getItem(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  return {
    loadHousehold() {
      const existing = read<HouseholdData>(HOUSEHOLD_KEY);
      if (existing) return existing;
      // First run on this device: migrate any legacy single-player save.
      return migrateLegacy(store);
    },
    saveHousehold(data) {
      store.setItem(HOUSEHOLD_KEY, JSON.stringify(data));
    },
    loadSave(profileId) {
      return read<PlayerSave>(saveKey(profileId));
    },
    saveSave(profileId, save) {
      store.setItem(saveKey(profileId), JSON.stringify(save));
    },
    deleteSave(profileId) {
      store.removeItem(saveKey(profileId));
    },
  };
}

/**
 * If a pre-multiplayer save exists, fold it into a single "Player 1" profile so
 * existing kids keep their pets and placement. Returns the new household and
 * clears the legacy key. Runs at most once (the household key then wins).
 */
function migrateLegacy(store: StorageLike): HouseholdData {
  const raw = store.getItem(LEGACY_KEY);
  if (raw == null) return emptyHousehold();

  let legacy: Partial<PlayerSave> | null = null;
  try {
    legacy = JSON.parse(raw) as Partial<PlayerSave>;
  } catch {
    legacy = null;
  }
  if (!legacy) {
    store.removeItem(LEGACY_KEY);
    return emptyHousehold();
  }

  const id = newId();
  const now = Date.now();
  const meta: ProfileMeta = {
    id,
    name: 'Player 1',
    speciesId: legacy.speciesId ?? 'luminex',
    createdAt: now,
    lastPlayedAt: now,
  };
  // Persist whatever fields the legacy blob carried; the store fills the rest
  // with fresh defaults when it hydrates a partial save.
  store.setItem(saveKey(id), JSON.stringify(legacy));
  store.removeItem(LEGACY_KEY);

  const household: HouseholdData = { profiles: [meta], activeProfileId: id };
  store.setItem(HOUSEHOLD_KEY, JSON.stringify(household));
  return household;
}

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}
