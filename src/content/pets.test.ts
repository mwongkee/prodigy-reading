import { describe, it, expect } from 'vitest';
import {
  LUMINEX,
  PETS,
  SPECIES_LIST,
  STARTER_PET,
  TOTAL_FORMS,
  stageName,
  formAt,
  chooseMove,
} from './pets';
import { ELEMENTS } from './elements';
import {
  REGION_BOSSES,
  KEYSTONES,
  ALL_KEYSTONE_IDS,
  PUPPET_MASTER,
  randomMinion,
} from './enemies';
import { STRAND_IDS } from '../engine/adaptive';

describe('roster', () => {
  it('has exactly 16 forms total', () => {
    expect(TOTAL_FORMS).toBe(16);
  });

  it('gives every species a known element and unique id', () => {
    const ids = SPECIES_LIST.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SPECIES_LIST) {
      expect(ELEMENTS[s.element]).toBeDefined();
      expect(s.stages.length).toBeGreaterThanOrEqual(2);
      expect(s.unlockLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it('uses well-formed, unique image sources and keeps Luminex as svg/wolf', () => {
    const srcs: string[] = [];
    for (const s of SPECIES_LIST) {
      for (const form of s.stages) {
        if (form.art.kind === 'image') {
          expect(form.art.src).toMatch(/^[a-z0-9-]+\.png$/);
          srcs.push(form.art.src);
        }
      }
    }
    expect(new Set(srcs).size).toBe(srcs.length);
    for (const form of LUMINEX.stages) {
      expect(form.art).toEqual({ kind: 'svg', shape: 'wolf' });
    }
  });
});

describe('Luminex species', () => {
  it('is the starter with the four named moves and three stages', () => {
    expect(PETS[STARTER_PET]).toBe(LUMINEX);
    expect(LUMINEX.stages.map((f) => f.name)).toEqual(['Luminex', 'Luminite', 'Luminaut']);
    expect(LUMINEX.moves.map((m) => m.name)).toEqual(
      expect.arrayContaining(['Crunch', 'Heal', 'Refrigerate', 'Ice Storm']),
    );
  });

  it('clamps stageName and formAt to the last stage', () => {
    expect(stageName(LUMINEX, 0)).toBe('Luminex');
    expect(stageName(LUMINEX, 9)).toBe('Luminaut');
    expect(formAt(LUMINEX, 9).name).toBe('Luminaut');
  });
});

describe('chooseMove', () => {
  it('never heals at full health', () => {
    for (let i = 0; i < 30; i++) {
      expect(chooseMove(LUMINEX, false).kind).toBe('attack');
    }
  });

  it('can heal when hurt', () => {
    expect(chooseMove(LUMINEX, true, () => 0).kind).toBe('heal');
  });
});

describe('bosses & keystones', () => {
  it('gives every region a boss with a unique keystone', () => {
    const keystoneIds = STRAND_IDS.map((s) => REGION_BOSSES[s].keystoneId);
    expect(new Set(keystoneIds).size).toBe(STRAND_IDS.length);
    for (const id of keystoneIds) expect(KEYSTONES[id!]).toBeDefined();
  });

  it('includes the named bosses', () => {
    const names = STRAND_IDS.map((s) => REGION_BOSSES[s].name);
    expect(names).toEqual(expect.arrayContaining(['Gerald', 'Ice Dragon', 'Ice Worm']));
  });

  it('needs all keystones and a tougher Puppet Master for the finale', () => {
    expect(ALL_KEYSTONE_IDS).toHaveLength(STRAND_IDS.length);
    expect(PUPPET_MASTER.isBoss).toBe(true);
    expect(PUPPET_MASTER.maxHp).toBeGreaterThan(REGION_BOSSES.phonics.maxHp);
  });

  it('randomMinion returns a non-boss enemy', () => {
    expect(randomMinion(() => 0).isBoss).toBe(false);
  });
});
