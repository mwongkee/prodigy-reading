/**
 * Tiny deterministic RNG helpers, shared across the game.
 *
 * `mulberry32` is the same fast, well-distributed 32-bit generator already used
 * by the adaptive-engine tests; pulled into one place so features that need a
 * *reproducible* random stream (e.g. the parametric Pet Workshop) can seed it.
 */

/** A seeded PRNG: returns a function producing floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Stable, order-sensitive string hash (FNV-1a-ish) → unsigned 32-bit int.
 * Lets a *name* deterministically seed a creature ("Max" always makes the same
 * pet) and gives SVG gradients collision-resistant ids.
 */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
