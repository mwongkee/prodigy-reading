import type { Attempt, Rating } from './types';

/** Standard Elo logistic scale. 400 means a 10x odds shift per 400 points. */
export const ELO_SCALE = 400;

/** How fast a learner's rating moves per attempt. */
export const LEARNER_K = 32;

/** Items drift much more slowly than learners so the bank stays calibrated. */
export const ITEM_K = 8;

/**
 * Probability that a learner of `learnerRating` answers an item of
 * `itemRating` correctly. Classic Elo expected-score formula.
 */
export function expectedScore(learnerRating: Rating, itemRating: Rating): number {
  return 1 / (1 + Math.pow(10, (itemRating - learnerRating) / ELO_SCALE));
}

/**
 * Convert a raw attempt into an "effective score" in [0, 1].
 *
 * Correctness is the backbone. We then apply small, bounded confidence
 * adjustments so the rating reflects *how* the answer was reached:
 *  - hints reduce the credit for a correct answer (they leaned on support),
 *  - a fast correct answer nudges the score up a touch (fluency),
 *  - a very slow correct answer nudges it down a touch (effortful).
 *
 * The adjustments never flip the result (a correct answer always scores > a
 * wrong one) and are clamped to [0, 1].
 */
export function effectiveScore(attempt: Attempt): number {
  const base = clamp01(attempt.correctness);

  let score = base;

  // Hint penalty: each hint shaves a little off a correct-leaning answer.
  const hints = Math.max(0, attempt.hintsUsed ?? 0);
  if (hints > 0) {
    score -= Math.min(0.25, hints * 0.1) * base;
  }

  // Response-time signal only applies to (near-)correct answers.
  if (base >= 0.5 && attempt.responseSeconds != null) {
    const t = attempt.responseSeconds;
    if (t <= 4) score += 0.05; // confident & quick
    else if (t >= 20) score -= 0.05; // slow & effortful
  }

  return clamp01(score);
}

export interface RatingUpdate {
  learnerRating: Rating;
  itemRating: Rating;
}

/**
 * Two-sided Elo update: move the learner toward/away from the item based on
 * the effective score, and nudge the item the opposite way so the bank
 * self-calibrates over time.
 */
export function updateRatings(
  learnerRating: Rating,
  itemRating: Rating,
  attempt: Attempt,
): RatingUpdate {
  const expected = expectedScore(learnerRating, itemRating);
  const score = effectiveScore(attempt);
  const delta = score - expected;
  return {
    learnerRating: learnerRating + LEARNER_K * delta,
    itemRating: itemRating - ITEM_K * delta,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
