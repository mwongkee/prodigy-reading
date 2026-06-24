import { create } from 'zustand';
import {
  createLearner,
  applyAttempt,
  selectNextItem,
  estimateSeedRating,
  STRAND_IDS,
  DEFAULT_RATING,
  type LearnerState,
  type Rating,
  type StrandId,
  type PlacementResult,
} from '../engine/adaptive';
import {
  QUESTION_BANK,
  gradeResponse,
  buildWarmup,
  type Question,
  PETS,
  STARTER_PET,
  stageName,
  chooseMove,
  type PetSpecies,
  type Enemy,
  REGION_BOSSES,
  PUPPET_MASTER,
  MINIONS_BEFORE_BOSS,
  ALL_KEYSTONE_IDS,
  randomMinion,
} from '../content';
import {
  createLocalStorageRepository,
  newId,
  type HouseholdRepository,
  type PlayerSave,
  type ProfileMeta,
  type SessionEntry,
} from './storage';
import { createAuthProvider, AuthError, type AuthSession } from '../auth';
import { readCloudConfig } from '../auth/config';
import { createHttpCloudSync, withCloudSync, type SyncedRepository } from './cloudRepository';

export type { SessionEntry } from './storage';

/** Result the sign-in UI branches on. */
export type AuthResult = { ok: true } | { ok: false; code: AuthError['code']; message: string };

/** 'finale' is the Puppet Master encounter; otherwise a literacy region. */
export type Region = StrandId | 'finale';

/**
 * Resolve a species id against the kid's creations first, then the static
 * roster. Falls back to the starter so a stale persisted id can never crash a
 * render. This is the single lookup that lets custom pets behave like any other.
 */
export function resolveSpecies(id: string, customPets: PetSpecies[]): PetSpecies {
  return customPets.find((p) => p.id === id) ?? PETS[id] ?? PETS[STARTER_PET];
}

interface BattleState {
  enemy: Enemy;
  enemyHp: number;
  petMaxHp: number;
  petHp: number;
}

interface GameState {
  // ---- household / multi-player ----
  /** All kid profiles in this household (parent-owned). */
  profiles: ProfileMeta[];
  /** The profile currently being played, or null while at the picker. */
  activeProfileId: string | null;
  /** Transient: force the player picker even when a profile is active. */
  showPicker: boolean;
  /** Cloud-sync session (username/password). null when offline or signed out. */
  session: AuthSession | null;

  // ---- active profile's game state ----
  learner: LearnerState;
  itemRatings: Record<string, Rating>;
  speciesId: string;
  /** Kid-created creatures from the Pet Workshop (persisted per profile). */
  customPets: PetSpecies[];
  region: Region | null;
  current: Question | null;
  battle: BattleState | null;
  xp: number;
  level: number;
  petStage: number;
  /** Minions cleared in each region, counting toward that region's boss. */
  progress: Record<StrandId, number>;
  bossDefeated: Record<StrandId, boolean>;
  keystones: string[];
  finaleWon: boolean;
  lastResult: { correctness: number; message: string } | null;
  petMood: 'idle' | 'attack' | 'hurt' | 'happy';
  log: SessionEntry[];

  /** Whether the one-time placement warm-up has been completed. */
  placed: boolean;
  /** Calibrated starting rating from the warm-up (persisted so it survives reloads). */
  seedRating: Rating | null;
  /** Active warm-up run, or null when not warming up. */
  placement: { ladder: Question[]; index: number; results: PlacementResult[] } | null;

  // ---- profile actions (management is parent-gated in the UI) ----
  createProfile: (name: string) => void;
  selectProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  /** Park the current player and show the picker (does not delete anything). */
  openPicker: () => void;
  /** Return to the active player from the picker. */
  closePicker: () => void;

  // ---- cloud auth (username/password; parent-gated in the UI) ----
  /** Create a synced login and a matching profile. Resolves to a typed result. */
  signUp: (username: string, password: string, displayName?: string) => Promise<AuthResult>;
  /** Sign in an existing kid and pull their saves. */
  signIn: (username: string, password: string) => Promise<AuthResult>;
  /** Sign out of cloud sync (local profiles stay on the device). */
  signOut: () => Promise<void>;

  // ---- placement warm-up ----
  beginPlacement: () => void;
  answerPlacement: (response: unknown) => void;
  skipPlacement: () => void;

  // ---- core loop ----
  enterRegion: (region: Region) => void;
  leaveRegion: () => void;
  setSpecies: (id: string) => void;
  addCustomPet: (species: PetSpecies) => void;
  answer: (response: unknown, opts?: { hintsUsed?: number; responseSeconds?: number }) => void;
  next: () => void;
}

function xpForLevel(level: number): number {
  return 30 + level * 20;
}

const zeroProgress = () =>
  Object.fromEntries(STRAND_IDS.map((s) => [s, 0])) as Record<StrandId, number>;
const noBossesDefeated = () =>
  Object.fromEntries(STRAND_IDS.map((s) => [s, false])) as Record<StrandId, boolean>;

const freshItemRatings = () =>
  Object.fromEntries(QUESTION_BANK.map((q) => [q.id, q.difficulty]));

/** A brand-new profile's save: fresh ratings, no progress, warm-up pending. */
function freshSave(): PlayerSave {
  return {
    learner: createLearner(),
    seedRating: null,
    placed: false,
    customPets: [],
    speciesId: STARTER_PET,
    xp: 0,
    level: 1,
    petStage: 0,
    progress: zeroProgress(),
    bossDefeated: noBossesDefeated(),
    keystones: [],
    finaleWon: false,
    log: [],
  };
}

/** Snapshot the savable slice of state for persistence. */
function saveFromState(s: GameState): PlayerSave {
  return {
    learner: s.learner,
    seedRating: s.seedRating,
    placed: s.placed,
    customPets: s.customPets,
    speciesId: s.speciesId,
    xp: s.xp,
    level: s.level,
    petStage: s.petStage,
    progress: s.progress,
    bossDefeated: s.bossDefeated,
    keystones: s.keystones,
    finaleWon: s.finaleWon,
    log: s.log,
  };
}

/**
 * Turn a (possibly partial/legacy) save into a loadable state slice. Missing
 * fields fall back to fresh defaults, and a save without a per-strand learner
 * (the pre-warm-up format) is re-seeded from its placement rating.
 */
type GameSlice = Pick<
  GameState,
  | 'learner' | 'seedRating' | 'placed' | 'customPets' | 'speciesId'
  | 'xp' | 'level' | 'petStage' | 'progress' | 'bossDefeated'
  | 'keystones' | 'finaleWon' | 'log' | 'itemRatings'
  | 'region' | 'current' | 'battle' | 'lastResult' | 'petMood' | 'placement'
>;

function hydrateSlice(save: Partial<PlayerSave>): GameSlice {
  const base = freshSave();
  return {
    learner: save.learner ?? createLearner(save.seedRating ?? DEFAULT_RATING),
    seedRating: save.seedRating ?? base.seedRating,
    placed: save.placed ?? base.placed,
    customPets: save.customPets ?? base.customPets,
    speciesId: save.speciesId ?? base.speciesId,
    xp: save.xp ?? base.xp,
    level: save.level ?? base.level,
    petStage: save.petStage ?? base.petStage,
    progress: save.progress ?? base.progress,
    bossDefeated: save.bossDefeated ?? base.bossDefeated,
    keystones: save.keystones ?? base.keystones,
    finaleWon: save.finaleWon ?? base.finaleWon,
    log: save.log ?? base.log,
    itemRatings: freshItemRatings(),
    // Volatile session bits always start clean.
    region: null,
    current: null,
    battle: null,
    lastResult: null,
    petMood: 'idle',
    placement: null,
  };
}

/** Resolve which strand to draw a question from for a region. */
function strandFor(region: Region): StrandId {
  if (region === 'finale') {
    return STRAND_IDS[Math.floor(Math.random() * STRAND_IDS.length)];
  }
  return region;
}

/** Decide the next foe: the boss once enough minions are cleared, else a minion. */
function spawnEnemy(region: Region, bossDefeated: Record<StrandId, boolean>, progress: Record<StrandId, number>): Enemy {
  if (region === 'finale') return PUPPET_MASTER;
  if (!bossDefeated[region] && progress[region] >= MINIONS_BEFORE_BOSS) {
    return REGION_BOSSES[region];
  }
  return randomMinion();
}

function newBattle(enemy: Enemy): BattleState {
  return { enemy, enemyHp: enemy.maxHp, petMaxHp: 5, petHp: 5 };
}

function pickQuestion(strand: StrandId, learner: LearnerState, itemRatings: Record<string, Rating>): Question | null {
  const pool = QUESTION_BANK.filter((q) => q.strand === strand).map((q) => ({
    ...q,
    difficulty: itemRatings[q.id] ?? q.difficulty,
  }));
  const chosen = selectNextItem({ pool, learnerRating: learner.ratings[strand], seen: learner.seen });
  return chosen ? QUESTION_BANK.find((q) => q.id === chosen.id) ?? null : null;
}

// ---- persistence seam + auth ----
// localStorage is always the synchronous source of truth. When the Cognito pool
// is configured (env present), writes are *also* mirrored to the cloud and a
// reconcile pulls a kid's saves on sign-in. With no env, this is a pure local
// repo and the app is fully offline — identical behavior to before.
const auth = createAuthProvider();
const cloudCfg = readCloudConfig();
const localRepo = createLocalStorageRepository();
const syncedRepo: SyncedRepository | null = cloudCfg
  ? withCloudSync(
      localRepo,
      createHttpCloudSync({ apiUrl: cloudCfg.apiUrl, getToken: () => auth.currentSession()?.token ?? null }),
    )
  : null;
const repo: HouseholdRepository = syncedRepo ?? localRepo;

const bootHousehold = repo.loadHousehold();
const bootActiveId = bootHousehold.activeProfileId;
const bootSave =
  bootActiveId != null ? repo.loadSave(bootActiveId) ?? freshSave() : freshSave();
const bootSession = auth.currentSession();

export const useGame = create<GameState>((set, get) => ({
  profiles: bootHousehold.profiles,
  activeProfileId: bootActiveId,
  showPicker: false,
  session: bootSession,
  ...hydrateSlice(bootSave),

  createProfile: (name) => {
    const id = newId();
    const now = Date.now();
    const meta: ProfileMeta = {
      id,
      name: name.trim() || `Player ${get().profiles.length + 1}`,
      speciesId: STARTER_PET,
      createdAt: now,
      lastPlayedAt: now,
    };
    const profiles = [...get().profiles, meta];
    const save = freshSave();
    repo.saveSave(id, save);
    repo.saveHousehold({ profiles, activeProfileId: id });
    set({ profiles, activeProfileId: id, showPicker: false, ...hydrateSlice(save) });
  },

  selectProfile: (id) => {
    if (!get().profiles.some((p) => p.id === id)) return;
    const save = repo.loadSave(id) ?? freshSave();
    const profiles = get().profiles.map((p) =>
      p.id === id ? { ...p, lastPlayedAt: Date.now() } : p,
    );
    repo.saveHousehold({ profiles, activeProfileId: id });
    set({ profiles, activeProfileId: id, showPicker: false, ...hydrateSlice(save) });
  },

  deleteProfile: (id) => {
    repo.deleteSave(id);
    const profiles = get().profiles.filter((p) => p.id !== id);
    const wasActive = get().activeProfileId === id;
    const activeProfileId = wasActive ? null : get().activeProfileId;
    repo.saveHousehold({ profiles, activeProfileId });
    if (wasActive) {
      set({ profiles, activeProfileId: null, showPicker: false, ...hydrateSlice(freshSave()) });
    } else {
      set({ profiles });
    }
  },

  renameProfile: (id, name) => {
    const clean = name.trim();
    if (!clean) return;
    const profiles = get().profiles.map((p) => (p.id === id ? { ...p, name: clean } : p));
    repo.saveHousehold({ profiles, activeProfileId: get().activeProfileId });
    set({ profiles });
  },

  openPicker: () => set({ showPicker: true, region: null, current: null, battle: null, lastResult: null }),
  closePicker: () => set({ showPicker: false }),

  signUp: async (username, password, displayName) => {
    try {
      // Siblings on a device join the active session's household; first kid mints one.
      const householdId = get().session?.householdId;
      const session = await auth.createLogin({ username, password, displayName, householdId });
      applySession(session, displayName?.trim() || username.trim());
      return { ok: true };
    } catch (e) {
      return authResult(e);
    }
  },

  signIn: async (username, password) => {
    try {
      const session = await auth.signIn(username, password);
      applySession(session, username.trim());
      return { ok: true };
    } catch (e) {
      return authResult(e);
    }
  },

  signOut: async () => {
    await auth.signOut();
    set({ session: null });
  },

  beginPlacement: () =>
    set({ placement: { ladder: buildWarmup(), index: 0, results: [] } }),

  answerPlacement: (response) => {
    const p = get().placement;
    if (!p) return;
    const q = p.ladder[p.index];
    const correctness = gradeResponse(q, response);
    const results: PlacementResult[] = [
      ...p.results,
      { difficulty: q.difficulty, correct: correctness >= 0.5 },
    ];
    const nextIndex = p.index + 1;
    if (nextIndex >= p.ladder.length) {
      const seed = estimateSeedRating(results);
      set({ learner: createLearner(seed), seedRating: seed, placed: true, placement: null });
    } else {
      set({ placement: { ...p, index: nextIndex, results } });
    }
  },

  skipPlacement: () =>
    set({
      learner: createLearner(DEFAULT_RATING),
      seedRating: DEFAULT_RATING,
      placed: true,
      placement: null,
    }),

  enterRegion: (region) => {
    const s = get();
    const enemy = spawnEnemy(region, s.bossDefeated, s.progress);
    set({
      region,
      battle: newBattle(enemy),
      lastResult: null,
      petMood: 'idle',
      current: pickQuestion(strandFor(region), s.learner, s.itemRatings),
    });
  },

  leaveRegion: () => set({ region: null, current: null, battle: null, lastResult: null }),

  setSpecies: (id) => {
    const species = resolveSpecies(id, get().customPets);
    if (species && get().level >= species.unlockLevel) set({ speciesId: id });
  },

  addCustomPet: (species) =>
    set((s) => ({ customPets: [...s.customPets, species], speciesId: species.id })),

  answer: (response, opts) => {
    const state = get();
    const q = state.current;
    const battle = state.battle;
    const region = state.region;
    if (!q || !battle || !region) return;

    const species = resolveSpecies(state.speciesId, state.customPets);
    const correctness = gradeResponse(q, response);
    const itemRating = state.itemRatings[q.id] ?? q.difficulty;

    // Update the adaptive engine — this is what makes difficulty slide.
    const { state: learner, itemRating: newItemRating } = applyAttempt(state.learner, {
      strand: q.strand,
      itemId: q.id,
      itemRating,
      attempt: { correctness, hintsUsed: opts?.hintsUsed, responseSeconds: opts?.responseSeconds },
    });

    const petName = stageName(species, state.petStage);
    let { enemyHp, petHp } = battle;
    let mood: GameState['petMood'];
    let message: string;

    if (correctness >= 1) {
      const move = chooseMove(species, petHp < battle.petMaxHp);
      if (move.kind === 'heal') {
        petHp = Math.min(battle.petMaxHp, petHp + move.power);
        mood = 'happy';
        message = `${petName} used ${move.name}! ${move.emoji} +${move.power} HP`;
      } else {
        enemyHp -= move.power;
        mood = 'attack';
        message = `${petName} used ${move.name}! ${move.emoji}`;
      }
    } else if (correctness > 0) {
      enemyHp -= 0.5;
      mood = 'attack';
      message = 'Close! A glancing hit — you got part of it.';
    } else {
      petHp -= 1;
      mood = 'hurt';
      message = q.hint ? `Not quite. Hint: ${q.hint}` : 'Not quite — try the next one!';
    }

    let { xp, level, petStage, keystones, finaleWon } = state;
    const progress = { ...state.progress };
    const bossDefeated = { ...state.bossDefeated };
    let nextBattle: BattleState = { ...battle, enemyHp, petHp };

    if (enemyHp <= 0) {
      mood = 'happy';
      const enemy = battle.enemy;

      if (enemy.isBoss && region === 'finale') {
        finaleWon = true;
        message = `You broke ${enemy.name}'s spell and freed every pet! 🎉`;
      } else if (enemy.isBoss && region !== 'finale') {
        bossDefeated[region] = true;
        progress[region] = 0;
        if (enemy.keystoneId && !keystones.includes(enemy.keystoneId)) {
          keystones = [...keystones, enemy.keystoneId];
        }
        const haveAll = ALL_KEYSTONE_IDS.every((k) => keystones.includes(k));
        message = haveAll
          ? `You defeated ${enemy.name} and earned the last Keystone! The Puppet Master can now be faced.`
          : `You defeated ${enemy.name} and earned a Keystone! 🔑`;
      } else {
        // minion cleared — count toward the region boss
        if (region !== 'finale' && !bossDefeated[region]) {
          progress[region] = Math.min(MINIONS_BEFORE_BOSS, progress[region] + 1);
        }
        message = `You befriended ${enemy.name}! +20 XP`;
      }

      xp += 20;
      while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level += 1;
        if (level === 3) petStage = 1;
        if (level === 6) petStage = 2;
      }
      nextBattle = newBattle(spawnEnemy(region, bossDefeated, progress));
    } else if (petHp <= 0) {
      // No punishment — a gentle rest (ETHICS.md: no failure shame, no paid revive).
      message = 'Your pet needs a little rest. All better — keep going!';
      nextBattle = { ...battle, enemyHp, petHp: battle.petMaxHp };
    }

    const entry: SessionEntry = {
      strand: q.strand,
      correctness,
      ratingAfter: learner.ratings[q.strand],
      at: Date.now(),
    };

    set({
      learner,
      itemRatings: { ...state.itemRatings, [q.id]: newItemRating },
      battle: nextBattle,
      xp,
      level,
      petStage,
      progress,
      bossDefeated,
      keystones,
      finaleWon,
      petMood: mood,
      lastResult: { correctness, message },
      log: [...state.log, entry],
      current: pickQuestion(strandFor(region), learner, { ...state.itemRatings, [q.id]: newItemRating }),
    });
  },

  next: () => set({ lastResult: null, petMood: 'idle' }),
}));

// ---- auth helpers (hoisted; called by the signUp/signIn actions) ----

/** Turn an auth failure into the typed result the UI branches on. */
function authResult(e: unknown): AuthResult {
  if (e instanceof AuthError) return { ok: false, code: e.code, message: e.message };
  return { ok: false, code: 'unknown', message: 'Something went wrong. Try again.' };
}

/**
 * Adopt a freshly-authenticated session: ensure a local profile keyed by the
 * session's `profileId` exists (so cloud `sub` === local profile id), make it
 * active, then kick a background reconcile to pull the kid's cloud saves.
 */
function applySession(session: AuthSession, fallbackName: string): void {
  const now = Date.now();
  const id = session.profileId;
  const existing = useGame.getState().profiles;
  const profiles = existing.some((p) => p.id === id)
    ? existing.map((p) =>
        p.id === id ? { ...p, username: session.username, lastPlayedAt: now } : p,
      )
    : [
        ...existing,
        {
          id,
          name: fallbackName || 'Player',
          username: session.username,
          speciesId: STARTER_PET,
          createdAt: now,
          lastPlayedAt: now,
        } satisfies ProfileMeta,
      ];

  // A brand-new login has no save yet; reconcile may replace it from the cloud.
  const save = repo.loadSave(id) ?? freshSave();
  repo.saveSave(id, save);
  repo.saveHousehold({ profiles, activeProfileId: id });
  useGame.setState({ profiles, activeProfileId: id, session, showPicker: false, ...hydrateSlice(save) });
  void reconcileThenRefresh();
}

/** After a cloud pull changes local storage, re-hydrate the visible state. */
async function reconcileThenRefresh(): Promise<void> {
  if (!syncedRepo) return;
  const changed = await syncedRepo.reconcile();
  if (!changed) return;
  const hh = repo.loadHousehold();
  const id = useGame.getState().activeProfileId;
  const save = id ? repo.loadSave(id) ?? freshSave() : freshSave();
  useGame.setState({ profiles: hh.profiles, ...(id ? hydrateSlice(save) : {}) });
}

// On boot with an existing session, pull saves in the background.
if (syncedRepo && bootSession) void reconcileThenRefresh();

// ---- autosave: persist the active profile whenever its savable state changes ----
const SAVABLE_KEYS = [
  'learner', 'seedRating', 'placed', 'customPets', 'speciesId',
  'xp', 'level', 'petStage', 'progress', 'bossDefeated',
  'keystones', 'finaleWon', 'log',
] as const;

function savableChanged(a: GameState, b: GameState): boolean {
  return SAVABLE_KEYS.some((k) => a[k] !== b[k]);
}

useGame.subscribe((s, prev) => {
  const id = s.activeProfileId;
  if (!id) return;
  if (!savableChanged(s, prev)) return;
  repo.saveSave(id, saveFromState(s));
  // Keep the picker avatar in sync when the active pet changes.
  const meta = s.profiles.find((p) => p.id === id);
  if (meta && meta.speciesId !== s.speciesId) {
    const profiles = s.profiles.map((p) => (p.id === id ? { ...p, speciesId: s.speciesId } : p));
    repo.saveHousehold({ profiles, activeProfileId: id });
    useGame.setState({ profiles });
  }
});
