import { describe, it, expect } from 'vitest';
import { expectedScore, effectiveScore, updateRatings } from './elo';

describe('expectedScore', () => {
  it('is 0.5 for an evenly matched learner and item', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
  });

  it('rises as the learner outclasses the item', () => {
    expect(expectedScore(1400, 1000)).toBeGreaterThan(0.9);
    expect(expectedScore(600, 1000)).toBeLessThan(0.1);
  });

  it('is monotonic in learner rating', () => {
    let prev = 0;
    for (const r of [600, 800, 1000, 1200, 1400]) {
      const p = expectedScore(r, 1000);
      expect(p).toBeGreaterThan(prev);
      prev = p;
    }
  });
});

describe('effectiveScore', () => {
  it('passes through a clean correct/wrong answer', () => {
    expect(effectiveScore({ correctness: 1 })).toBe(1);
    expect(effectiveScore({ correctness: 0 })).toBe(0);
  });

  it('penalizes hints on a correct answer but never flips it below wrong', () => {
    const withHints = effectiveScore({ correctness: 1, hintsUsed: 2 });
    expect(withHints).toBeLessThan(1);
    expect(withHints).toBeGreaterThan(effectiveScore({ correctness: 0 }));
  });

  it('rewards fast and dings slow correct answers, staying in [0,1]', () => {
    const fast = effectiveScore({ correctness: 0.9, responseSeconds: 2 });
    const slow = effectiveScore({ correctness: 0.9, responseSeconds: 30 });
    expect(fast).toBeGreaterThan(slow);
    expect(fast).toBeLessThanOrEqual(1);
    expect(slow).toBeGreaterThanOrEqual(0);
  });
});

describe('updateRatings', () => {
  it('raises the learner and lowers the item on an upset win', () => {
    const before = 1000;
    const { learnerRating, itemRating } = updateRatings(before, 1200, {
      correctness: 1,
    });
    expect(learnerRating).toBeGreaterThan(before);
    expect(itemRating).toBeLessThan(1200);
  });

  it('lowers the learner when they miss an easy item', () => {
    const { learnerRating } = updateRatings(1200, 900, { correctness: 0 });
    expect(learnerRating).toBeLessThan(1200);
  });

  it('barely moves a well-matched expected outcome', () => {
    const { learnerRating } = updateRatings(1000, 1000, { correctness: 0.5 });
    expect(Math.abs(learnerRating - 1000)).toBeLessThan(1);
  });
});
