import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

/** One recorded answer, used by the parent dashboard. */
export interface SessionEntry {
  strand: StrandId;
  correctness: number;
  ratingAfter: Rating;
  at: number;
}

interface BattleState {
  enemy: Enemy;
  enemyHp: number;
  petMaxHp: number;
  petHp: number;
}

interface GameState {
  learner: LearnerState;
  itemRatings: Record<string, Rating>;
  speciesId: string;
  /** Kid-created creatures from the Pet Workshop (persisted across sessions). */
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

  /** Build and start the placement warm-up. */
  beginPlacement: () => void;
  /** Record a warm-up answer; finishing seeds every strand and clears the gate. */
  answerPlacement: (response: unknown) => void;
  /** Skip the warm-up — seed at the neutral default and let play adapt from there. */
  skipPlacement: () => void;

  enterRegion: (region: Region) => void;
  leaveRegion: () => void;
  /** Switch the active pet (only if unlocked at the current level). */
  setSpecies: (id: string) => void;
  /** Save a created creature and make it the active pet. */
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

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
  learner: createLearner(),
  itemRatings: Object.fromEntries(QUESTION_BANK.map((q) => [q.id, q.difficulty])),
  speciesId: STARTER_PET,
  customPets: [],
  region: null,
  current: null,
  battle: null,
  xp: 0,
  level: 1,
  petStage: 0,
  progress: zeroProgress(),
  bossDefeated: noBossesDefeated(),
  keystones: [],
  finaleWon: false,
  lastResult: null,
  petMood: 'idle',
  log: [],
  placed: false,
  seedRating: null,
  placement: null,

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
    }),
    {
      name: 'readquest.creations',
      // Persist the kid's creations + active pet, plus the one-time placement
      // result (so the warm-up isn't repeated and the calibrated seed sticks).
      // Volatile battle/learner drift is intentionally not persisted.
      partialize: (s) => ({
        customPets: s.customPets,
        speciesId: s.speciesId,
        placed: s.placed,
        seedRating: s.seedRating,
      }),
      // The learner itself isn't persisted, so re-seed it from the saved
      // placement rating on reload to honor the warm-up across sessions.
      onRehydrateStorage: () => (state) => {
        if (state && state.seedRating != null) {
          state.learner = createLearner(state.seedRating);
        }
      },
    },
  ),
);
