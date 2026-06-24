import { describe, it, expect } from 'vitest';
import { buildWarmup } from './warmup';
import { WARMUP_LADDER } from '../engine/adaptive/placement';

describe('buildWarmup', () => {
  const warmup = buildWarmup();

  it('produces one question per ladder rung', () => {
    expect(warmup.length).toBe(WARMUP_LADDER.length);
  });

  it('uses distinct questions', () => {
    const ids = warmup.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rises in difficulty across the ladder', () => {
    for (let i = 1; i < warmup.length; i++) {
      expect(warmup[i].difficulty).toBeGreaterThanOrEqual(warmup[i - 1].difficulty);
    }
  });

  it('strips hints so calibration is not skewed', () => {
    for (const q of warmup) {
      expect(q.hint).toBeUndefined();
    }
  });

  it('spreads across several strands for variety', () => {
    const strands = new Set(warmup.map((q) => q.strand));
    expect(strands.size).toBeGreaterThanOrEqual(4);
  });
});
