import { describe, it, expect } from 'vitest';
import { selectNextItem, isInTargetBand, TARGET_SUCCESS } from './selectItem';
import { expectedScore } from './elo';

const pool = [
  { id: 'easy', difficulty: 700 },
  { id: 'mid', difficulty: 850 },
  { id: 'target', difficulty: 760 }, // ~0.8 success for a 1000 learner... see below
  { id: 'hard', difficulty: 1300 },
];

describe('selectNextItem', () => {
  it('returns null for an empty pool', () => {
    expect(selectNextItem({ pool: [], learnerRating: 1000 })).toBeNull();
  });

  it('chooses the item closest to the target success probability', () => {
    // Build a pool spanning easy..hard around a 1000 learner.
    const items = [
      { id: 'too-easy', difficulty: 500 },
      { id: 'just-right', difficulty: 760 }, // expected ~0.8
      { id: 'too-hard', difficulty: 1300 },
    ];
    const chosen = selectNextItem({ pool: items, learnerRating: 1000 });
    expect(chosen?.id).toBe('just-right');
    // sanity: that item really is near the 0.8 target
    expect(expectedScore(1000, 760)).toBeCloseTo(TARGET_SUCCESS, 1);
  });

  it('prefers unseen items when two are equally close to target', () => {
    const items = [
      { id: 'a', difficulty: 760 },
      { id: 'b', difficulty: 760 },
    ];
    const chosen = selectNextItem({
      pool: items,
      learnerRating: 1000,
      seen: { a: 3, b: 0 },
    });
    expect(chosen?.id).toBe('b');
  });

  it('keeps real selections within the comfortable band', () => {
    const chosen = selectNextItem({ pool, learnerRating: 900 });
    expect(chosen).not.toBeNull();
    expect(isInTargetBand(900, chosen!.difficulty)).toBe(true);
  });
});
