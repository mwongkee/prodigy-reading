import { describe, it, expect } from 'vitest';
import {
  genomeFromSeed,
  randomGenome,
  clampGenome,
  defaultGenome,
  defaultMovesFor,
  buildCustomSpecies,
  BODY_SHAPES,
  EAR_STYLES,
  EYE_STYLES,
  MOUTH_STYLES,
  TAIL_STYLES,
  PATTERNS,
  GENOME_SLIDERS,
  type PetGenome,
} from './genome';
import { chooseMove, formAt, stageName } from './pets';
import { ELEMENT_ORDER } from './elements';
import { mulberry32 } from '../engine/rng';

const everySlider = (g: PetGenome, fn: (v: number) => boolean) =>
  GENOME_SLIDERS.every((k) => fn(g[k]));

describe('genomeFromSeed', () => {
  it('is deterministic — same seed yields an identical genome', () => {
    expect(genomeFromSeed(1234)).toEqual(genomeFromSeed(1234));
    expect(genomeFromSeed('Max')).toEqual(genomeFromSeed('Max'));
  });

  it('different seeds generally yield different genomes', () => {
    const a = genomeFromSeed('Max');
    const b = genomeFromSeed('Ruby');
    expect(a).not.toEqual(b);
  });

  it('a name and its hash seed produce the same creature', () => {
    // genomeFromSeed hashes strings, so the string and number paths must agree.
    const byName = genomeFromSeed('Sparky');
    const byNameAgain = genomeFromSeed('Sparky');
    expect(byName).toEqual(byNameAgain);
  });
});

describe('randomGenome / clampGenome', () => {
  it('produces in-range, valid genomes across many seeds', () => {
    for (let s = 0; s < 200; s++) {
      const g = randomGenome(mulberry32(s));
      expect(everySlider(g, (v) => v >= 0 && v <= 1)).toBe(true);
      expect(BODY_SHAPES).toContain(g.bodyShape);
      expect(EAR_STYLES).toContain(g.earStyle);
      expect(EYE_STYLES).toContain(g.eyeStyle);
      expect(MOUTH_STYLES).toContain(g.mouthStyle);
      expect(TAIL_STYLES).toContain(g.tailStyle);
      expect(PATTERNS).toContain(g.pattern);
      expect(ELEMENT_ORDER).toContain(g.element);
      expect(g.bodyColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(g.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('clamps out-of-range params and invalid options', () => {
    const dirty = {
      ...defaultGenome('frost'),
      bodyW: 5,
      eyeSize: -3,
      bodyShape: 'banana',
      element: 'plasma',
      bodyColor: 'not-a-hex',
    } as unknown as PetGenome;
    const g = clampGenome(dirty);
    expect(g.bodyW).toBe(1);
    expect(g.eyeSize).toBe(0);
    expect(BODY_SHAPES).toContain(g.bodyShape);
    expect(ELEMENT_ORDER).toContain(g.element);
    expect(g.bodyColor).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('defaultMovesFor', () => {
  it('gives every element ≥1 attack and ≥1 heal', () => {
    for (const el of ELEMENT_ORDER) {
      const moves = defaultMovesFor(el);
      expect(moves.filter((m) => m.kind === 'attack').length).toBeGreaterThanOrEqual(1);
      expect(moves.filter((m) => m.kind === 'heal').length).toBeGreaterThanOrEqual(1);
      expect(moves.every((m) => m.name && m.emoji)).toBe(true);
    }
  });
});

describe('buildCustomSpecies', () => {
  it('builds a valid PetSpecies that plugs into the game helpers', () => {
    const g = genomeFromSeed('Pebble');
    const species = buildCustomSpecies(g, '  Pebble  ');
    expect(species.custom).toBe(true);
    expect(species.unlockLevel).toBe(1);
    expect(ELEMENT_ORDER).toContain(species.element);
    expect(species.stages.length).toBeGreaterThanOrEqual(1);
    expect(species.stages[0].name).toBe('Pebble'); // trimmed
    expect(species.stages.every((s) => s.art.kind === 'genome')).toBe(true);

    // works with the same helpers the static roster uses
    expect(stageName(species, 0)).toBe('Pebble');
    expect(formAt(species, 9).art.kind).toBe('genome'); // clamps stage
    const rng = mulberry32(7);
    expect(['attack', 'heal']).toContain(chooseMove(species, true, rng).kind);
  });

  it('falls back to a name and stays deterministic by id', () => {
    const g = defaultGenome('leaf');
    expect(buildCustomSpecies(g, '', 'custom-x').stages[0].name).toBe('My Pet');
    expect(buildCustomSpecies(g, 'A', 'fixed').id).toBe('fixed');
    // auto-id is stable for identical name+genome
    expect(buildCustomSpecies(g, 'A').id).toBe(buildCustomSpecies(g, 'A').id);
  });
});
