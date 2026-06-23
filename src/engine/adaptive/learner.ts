import { updateRatings } from './elo';
import {
  DEFAULT_RATING,
  STRAND_IDS,
  type Attempt,
  type LearnerState,
  type Rating,
  type StrandId,
} from './types';

/** A fresh learner: every strand seeded at the default rating, no history. */
export function createLearner(seedRating: Rating = DEFAULT_RATING): LearnerState {
  const ratings = {} as Record<StrandId, Rating>;
  const stats = {} as LearnerState['stats'];
  for (const id of STRAND_IDS) {
    ratings[id] = seedRating;
    stats[id] = { attempts: 0, correct: 0 };
  }
  return { ratings, seen: {}, stats };
}

/**
 * Apply one answered item to a learner. Returns a NEW state (pure) plus the
 * updated item rating, so callers can persist the item's drift too.
 */
export function applyAttempt(
  state: LearnerState,
  params: { strand: StrandId; itemId: string; itemRating: Rating; attempt: Attempt },
): { state: LearnerState; itemRating: Rating } {
  const { strand, itemId, itemRating, attempt } = params;
  const { learnerRating, itemRating: newItemRating } = updateRatings(
    state.ratings[strand],
    itemRating,
    attempt,
  );

  const prevStats = state.stats[strand];
  return {
    state: {
      ratings: { ...state.ratings, [strand]: learnerRating },
      seen: { ...state.seen, [itemId]: (state.seen[itemId] ?? 0) + 1 },
      stats: {
        ...state.stats,
        [strand]: {
          attempts: prevStats.attempts + 1,
          correct: prevStats.correct + (attempt.correctness >= 0.5 ? 1 : 0),
        },
      },
    },
    itemRating: newItemRating,
  };
}

/** Supportive, parent-facing band labels. Mirrors docs/skill-catalog.md. */
export type BandLabel = 'Exploring' | 'Building' | 'Growing' | 'Confident' | 'Soaring';

export function bandFor(rating: Rating): BandLabel {
  if (rating < 950) return 'Exploring';
  if (rating < 1100) return 'Building';
  if (rating < 1250) return 'Growing';
  if (rating < 1400) return 'Confident';
  return 'Soaring';
}

/**
 * Rank strands from weakest to strongest, so the dashboard can suggest where to
 * focus next. Strands with no attempts sort last (no signal yet).
 */
export function focusOrder(state: LearnerState): StrandId[] {
  return [...STRAND_IDS].sort((a, b) => {
    const aSeen = state.stats[a].attempts > 0;
    const bSeen = state.stats[b].attempts > 0;
    if (aSeen !== bSeen) return aSeen ? -1 : 1;
    return state.ratings[a] - state.ratings[b];
  });
}
