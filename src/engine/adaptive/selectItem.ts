import { expectedScore } from './elo';
import type { Rating } from './types';

/**
 * Target success probability for the next item: the "zone of proximal
 * development" — hard enough to grow, easy enough to stay encouraged.
 */
export const TARGET_SUCCESS = 0.8;
export const TARGET_BAND: [number, number] = [0.75, 0.85];

/** Minimal shape the selector needs from a question item. */
export interface SelectableItem {
  id: string;
  difficulty: Rating;
}

export interface SelectOptions<T extends SelectableItem> {
  /** Candidate items (already filtered to the desired strand). */
  pool: T[];
  /** The learner's current rating for that strand. */
  learnerRating: Rating;
  /** itemId -> times seen, to discourage repeats. */
  seen?: Record<string, number>;
  /** Desired success probability (defaults to TARGET_SUCCESS). */
  target?: number;
}

/**
 * Pick the next item whose expected success probability is closest to the
 * target. Unseen items win ties over seen ones, and among seen items the
 * least-recently-piled-on wins, so a learner doesn't get the same question
 * twice in a row when better-spread options exist.
 *
 * Returns `null` only when the pool is empty.
 */
export function selectNextItem<T extends SelectableItem>(
  opts: SelectOptions<T>,
): T | null {
  const { pool, learnerRating, seen = {}, target = TARGET_SUCCESS } = opts;
  if (pool.length === 0) return null;

  let best: T | null = null;
  let bestKey: [number, number] = [Infinity, Infinity];

  for (const item of pool) {
    const p = expectedScore(learnerRating, item.difficulty);
    const closeness = Math.abs(p - target);
    const seenCount = seen[item.id] ?? 0;
    // Sort by (distance from target, times seen). Lower is better on both.
    const key: [number, number] = [closeness, seenCount];
    if (key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
      best = item;
      bestKey = key;
    }
  }

  return best;
}

/** Convenience: is the item within the comfortable target band for a learner? */
export function isInTargetBand(learnerRating: Rating, itemRating: Rating): boolean {
  const p = expectedScore(learnerRating, itemRating);
  return p >= TARGET_BAND[0] && p <= TARGET_BAND[1];
}
