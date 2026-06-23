/** The six literacy strands. Mirrors docs/skill-catalog.md. */
export type StrandId =
  | 'phonics'
  | 'vocabulary'
  | 'spelling'
  | 'grammar'
  | 'comprehension'
  | 'writing';

export const STRAND_IDS: StrandId[] = [
  'phonics',
  'vocabulary',
  'spelling',
  'grammar',
  'comprehension',
  'writing',
];

/** An Elo-style rating. Seed is ~1000 (middle of the ages 6-11 range). */
export type Rating = number;

export const DEFAULT_RATING: Rating = 1000;

/**
 * A learner's ability across strands plus per-item exposure history.
 * This is everything the engine needs to keep adapting; it is plain data so it
 * can live client-side now and be persisted (Supabase) later unchanged.
 */
export interface LearnerState {
  /** Current ability rating per strand. */
  ratings: Record<StrandId, Rating>;
  /** itemId -> number of times the learner has seen it (for avoiding repeats). */
  seen: Record<string, number>;
  /** Per-strand counters for reporting. */
  stats: Record<StrandId, StrandStats>;
}

export interface StrandStats {
  attempts: number;
  correct: number;
}

/** The outcome of a single answered question, fed back into the engine. */
export interface Attempt {
  /** 1 = fully correct, 0 = wrong; values in between = partial credit. */
  correctness: number;
  /** Seconds the learner took to answer (optional; used as a soft signal). */
  responseSeconds?: number;
  /** Number of hints used on this item (optional; small confidence penalty). */
  hintsUsed?: number;
}
