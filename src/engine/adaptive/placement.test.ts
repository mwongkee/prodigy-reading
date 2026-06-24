import { describe, it, expect } from 'vitest';
import { estimateSeedRating, WARMUP_LADDER } from './placement';
import { DEFAULT_RATING } from './types';

const all = (correct: boolean) =>
  WARMUP_LADDER.map((difficulty) => ({ difficulty, correct }));

describe('estimateSeedRating', () => {
  it('falls back to the default with no results', () => {
    expect(estimateSeedRating([])).toBe(DEFAULT_RATING);
  });

  it('seeds high when every rung is correct', () => {
    const seed = estimateSeedRating(all(true));
    expect(seed).toBeGreaterThan(Math.max(...WARMUP_LADDER));
  });

  it('seeds low when every rung is wrong', () => {
    const seed = estimateSeedRating(all(false));
    expect(seed).toBeLessThan(Math.min(...WARMUP_LADDER));
  });

  it('seeds at the right/wrong boundary (the implied 50% point)', () => {
    // Correct through 1020, then misses 1140+.
    const results = WARMUP_LADDER.map((d) => ({ difficulty: d, correct: d <= 1020 }));
    // midpoint of hardest-correct (1020) and easiest-wrong (1140) = 1080.
    expect(estimateSeedRating(results)).toBe(1080);
  });

  it('handles a non-monotonic run without throwing or going out of band', () => {
    const results = [
      { difficulty: 780, correct: true },
      { difficulty: 900, correct: false },
      { difficulty: 1020, correct: true },
      { difficulty: 1140, correct: false },
      { difficulty: 1260, correct: false },
      { difficulty: 1380, correct: false },
    ];
    const seed = estimateSeedRating(results);
    expect(seed).toBeGreaterThanOrEqual(720);
    expect(seed).toBeLessThanOrEqual(1440);
  });

  it('clamps within the authored bank bounds', () => {
    expect(estimateSeedRating(all(true))).toBeLessThanOrEqual(1440);
    expect(estimateSeedRating(all(false))).toBeGreaterThanOrEqual(720);
  });
});
