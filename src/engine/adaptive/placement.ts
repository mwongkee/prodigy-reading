import { DEFAULT_RATING, type Rating } from './types';

/**
 * Placement (warm-up) calibration.
 *
 * Instead of asking a child their grade (forbidden by ETHICS.md #4), a brand-new
 * learner plays a short ladder of questions of increasing difficulty. We then
 * seed every strand's starting rating from how they did — purely from gameplay.
 *
 * Why this works with the Elo engine: a learner's rating is their ~50%-success
 * point. The selector deliberately serves items ~240 Elo *below* that (the 0.8
 * target band), so estimating the 50%-point and seeding it there makes the very
 * first "real" questions land comfortably inside the learner's zone.
 */

/** Difficulty rungs for the warm-up, low (early Grade 1) → high (late Grade 3). */
export const WARMUP_LADDER: Rating[] = [780, 900, 1020, 1140, 1260, 1380];

/** Half the spacing between rungs — used to step past the ends of the ladder. */
const STEP = 60;

/** Seeds never run off the edges of the authored bank (~700-1480). */
const SEED_FLOOR = 720;
const SEED_CEIL = 1440;

export interface PlacementResult {
  difficulty: Rating;
  /** Treat partial credit (e.g. word-order) >= 0.5 as "correct" for placement. */
  correct: boolean;
}

/**
 * Estimate a single starting rating from warm-up results: the midpoint between
 * the hardest item answered correctly and the easiest item missed (the implied
 * 50%-success point). Aced ladders seed just above the top rung; all-wrong
 * ladders seed just below the bottom. Empty input falls back to the default.
 */
export function estimateSeedRating(results: PlacementResult[]): Rating {
  if (results.length === 0) return DEFAULT_RATING;

  const difficulties = results.map((r) => r.difficulty);
  const correct = results.filter((r) => r.correct).map((r) => r.difficulty);
  const wrong = results.filter((r) => !r.correct).map((r) => r.difficulty);

  const hardestCorrect = correct.length ? Math.max(...correct) : null;
  const easiestWrong = wrong.length ? Math.min(...wrong) : null;

  let seed: number;
  if (hardestCorrect === null) {
    // Missed everything — start just below the easiest rung.
    seed = Math.min(...difficulties) - STEP;
  } else if (easiestWrong === null) {
    // Aced it — start just above the hardest rung.
    seed = Math.max(...difficulties) + STEP;
  } else {
    seed = (hardestCorrect + easiestWrong) / 2;
  }

  return Math.round(Math.max(SEED_FLOOR, Math.min(SEED_CEIL, seed)));
}
