import { create } from 'zustand';
import {
  createLearner,
  applyAttempt,
  selectNextItem,
  type LearnerState,
  type Rating,
  type StrandId,
} from '../engine/adaptive';
import { QUESTION_BANK, gradeResponse, type Question } from '../content';

/** One recorded answer, used by the parent dashboard. */
export interface SessionEntry {
  strand: StrandId;
  correctness: number;
  ratingAfter: Rating;
  at: number;
}

interface BattleState {
  enemyName: string;
  enemyMaxHp: number;
  enemyHp: number;
  petMaxHp: number;
  petHp: number;
}

const ENEMY_NAMES = ['Mossback', 'Glimmerfish', 'Tideling', 'Pebblepup', 'Brackle'];

interface GameState {
  learner: LearnerState;
  /** Live item ratings (start from the bank, drift as the bank self-calibrates). */
  itemRatings: Record<string, Rating>;
  region: StrandId | null;
  current: Question | null;
  battle: BattleState | null;
  xp: number;
  level: number;
  petStage: number;
  /** Feedback shown after an answer. */
  lastResult: { correctness: number; message: string } | null;
  petMood: 'idle' | 'attack' | 'hurt' | 'happy';
  log: SessionEntry[];

  enterRegion: (strand: StrandId) => void;
  leaveRegion: () => void;
  answer: (response: unknown, opts?: { hintsUsed?: number; responseSeconds?: number }) => void;
  next: () => void;
}

function xpForLevel(level: number): number {
  return 30 + level * 20;
}

function newEnemy(rng = Math.random): BattleState {
  const hp = 3; // hits to defeat; tuned so a few correct answers win
  return {
    enemyName: ENEMY_NAMES[Math.floor(rng() * ENEMY_NAMES.length)],
    enemyMaxHp: hp,
    enemyHp: hp,
    petMaxHp: 5,
    petHp: 5,
  };
}

function pickQuestion(state: Pick<GameState, 'learner' | 'itemRatings' | 'region'>): Question | null {
  if (!state.region) return null;
  const pool = QUESTION_BANK.filter((q) => q.strand === state.region).map((q) => ({
    ...q,
    difficulty: state.itemRatings[q.id] ?? q.difficulty,
  }));
  const chosen = selectNextItem({
    pool,
    learnerRating: state.learner.ratings[state.region],
    seen: state.learner.seen,
  });
  // Return the canonical question object (the pool copies only adjusted difficulty).
  return chosen ? QUESTION_BANK.find((q) => q.id === chosen.id) ?? null : null;
}

export const useGame = create<GameState>((set, get) => ({
  learner: createLearner(),
  itemRatings: Object.fromEntries(QUESTION_BANK.map((q) => [q.id, q.difficulty])),
  region: null,
  current: null,
  battle: null,
  xp: 0,
  level: 1,
  petStage: 0,
  lastResult: null,
  petMood: 'idle',
  log: [],

  enterRegion: (strand) => {
    set({ region: strand, battle: newEnemy(), lastResult: null, petMood: 'idle' });
    set({ current: pickQuestion(get()) });
  },

  leaveRegion: () => set({ region: null, current: null, battle: null, lastResult: null }),

  answer: (response, opts) => {
    const state = get();
    const q = state.current;
    const battle = state.battle;
    if (!q || !battle) return;

    const correctness = gradeResponse(q, response);
    const itemRating = state.itemRatings[q.id] ?? q.difficulty;

    // Update the adaptive engine (this is what makes difficulty slide).
    const { state: learner, itemRating: newItemRating } = applyAttempt(state.learner, {
      strand: q.strand,
      itemId: q.id,
      itemRating,
      attempt: { correctness, hintsUsed: opts?.hintsUsed, responseSeconds: opts?.responseSeconds },
    });

    // Translate the answer into battle action.
    let { enemyHp, petHp } = battle;
    let mood: GameState['petMood'];
    let message: string;
    if (correctness >= 1) {
      enemyHp -= 1;
      mood = 'attack';
      message = 'Direct hit! Great reading!';
    } else if (correctness > 0) {
      enemyHp -= 0.5;
      mood = 'attack';
      message = 'Close! A glancing hit — you got part of it.';
    } else {
      petHp -= 1;
      mood = 'hurt';
      message = q.hint ? `Not quite. Hint: ${q.hint}` : 'Not quite — try the next one!';
    }

    let { xp, level, petStage } = state;
    let nextBattle: BattleState = { ...battle, enemyHp, petHp };

    if (enemyHp <= 0) {
      // Victory: reward XP, maybe level up + evolve, spawn the next foe.
      mood = 'happy';
      message = `You befriended ${battle.enemyName}! +20 XP`;
      xp += 20;
      while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level += 1;
        if (level === 3) petStage = 1;
        if (level === 6) petStage = 2;
      }
      nextBattle = newEnemy();
    } else if (petHp <= 0) {
      // No punishment — a gentle rest. Ethics: no failure shame, no paywalled revive.
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
      petMood: mood,
      lastResult: { correctness, message },
      log: [...state.log, entry],
    });

    // Queue the next adaptive question.
    set({ current: pickQuestion(get()) });
  },

  next: () => set({ lastResult: null, petMood: 'idle' }),
}));
