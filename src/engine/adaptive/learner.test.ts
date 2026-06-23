import { describe, it, expect } from 'vitest';
import { createLearner, applyAttempt, bandFor, focusOrder } from './learner';
import { selectNextItem, isInTargetBand } from './selectItem';
import { expectedScore } from './elo';
import type { Rating } from './types';

/** Deterministic RNG so the simulation is reproducible. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('createLearner', () => {
  it('seeds every strand at the default rating with empty stats', () => {
    const l = createLearner();
    expect(l.ratings.phonics).toBe(1000);
    expect(l.ratings.writing).toBe(1000);
    expect(l.stats.phonics).toEqual({ attempts: 0, correct: 0 });
  });
});

describe('applyAttempt', () => {
  it('updates rating, seen-count, and stats, immutably', () => {
    const l0 = createLearner();
    const { state: l1 } = applyAttempt(l0, {
      strand: 'spelling',
      itemId: 'q1',
      itemRating: 1100,
      attempt: { correctness: 1 },
    });
    expect(l1.ratings.spelling).toBeGreaterThan(1000);
    expect(l1.seen.q1).toBe(1);
    expect(l1.stats.spelling).toEqual({ attempts: 1, correct: 1 });
    // original untouched
    expect(l0.ratings.spelling).toBe(1000);
    expect(l0.seen.q1).toBeUndefined();
  });
});

describe('bandFor', () => {
  it('maps ratings to supportive bands', () => {
    expect(bandFor(800)).toBe('Exploring');
    expect(bandFor(1000)).toBe('Building');
    expect(bandFor(1200)).toBe('Growing');
    expect(bandFor(1350)).toBe('Confident');
    expect(bandFor(1450)).toBe('Soaring');
  });
});

describe('focusOrder', () => {
  it('puts the lowest-rated attempted strand first and unseen strands last', () => {
    let l = createLearner();
    // Make spelling clearly the weakest attempted strand.
    for (let i = 0; i < 8; i++) {
      l = applyAttempt(l, {
        strand: 'spelling',
        itemId: `s${i}`,
        itemRating: 1200,
        attempt: { correctness: 0 },
      }).state;
    }
    l = applyAttempt(l, {
      strand: 'phonics',
      itemId: 'p1',
      itemRating: 900,
      attempt: { correctness: 1 },
    }).state;
    const order = focusOrder(l);
    expect(order[0]).toBe('spelling'); // weakest attempted -> focus here
    // strands never attempted sort to the end
    expect(order[order.length - 1] === 'phonics').toBe(false);
  });
});

describe('adaptive convergence simulation', () => {
  it('slides the estimate toward a hidden true ability and stays in the band', () => {
    const rng = mulberry32(42);
    const TRUE_ABILITY: Rating = 1180;

    // A broad item bank around the strand.
    const pool = Array.from({ length: 40 }, (_, i) => ({
      id: `item-${i}`,
      difficulty: 700 + i * 20, // 700 .. 1480
    }));

    let learner = createLearner(); // starts at 1000, 180 below the truth
    let inBand = 0;
    const ROUNDS = 120;

    for (let r = 0; r < ROUNDS; r++) {
      const item = selectNextItem({
        pool,
        learnerRating: learner.ratings.phonics,
        seen: learner.seen,
      })!;
      if (isInTargetBand(learner.ratings.phonics, item.difficulty)) inBand++;

      // Simulate the child: correct with probability set by their TRUE ability.
      const pCorrect = expectedScore(TRUE_ABILITY, item.difficulty);
      const correct = rng() < pCorrect ? 1 : 0;
      learner = applyAttempt(learner, {
        strand: 'phonics',
        itemId: item.id,
        itemRating: item.difficulty,
        attempt: { correctness: correct },
      }).state;
    }

    // The estimate should land close to the hidden true ability...
    expect(Math.abs(learner.ratings.phonics - TRUE_ABILITY)).toBeLessThan(120);
    // ...and most served items should have been comfortably challenging.
    expect(inBand / ROUNDS).toBeGreaterThan(0.6);
  });

  it('raises the estimate after a streak of correct answers and lowers it after misses', () => {
    let up = createLearner();
    for (let i = 0; i < 6; i++) {
      up = applyAttempt(up, {
        strand: 'vocabulary',
        itemId: `u${i}`,
        itemRating: 1000,
        attempt: { correctness: 1 },
      }).state;
    }
    expect(up.ratings.vocabulary).toBeGreaterThan(1080);

    let down = createLearner();
    for (let i = 0; i < 6; i++) {
      down = applyAttempt(down, {
        strand: 'vocabulary',
        itemId: `d${i}`,
        itemRating: 1000,
        attempt: { correctness: 0 },
      }).state;
    }
    expect(down.ratings.vocabulary).toBeLessThan(920);
  });
});
