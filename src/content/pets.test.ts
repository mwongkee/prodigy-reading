import { describe, it, expect } from 'vitest';
import { LUMINEX, PETS, STARTER_PET, stageName, chooseMove } from './pets';
import {
  REGION_BOSSES,
  KEYSTONES,
  ALL_KEYSTONE_IDS,
  PUPPET_MASTER,
  randomMinion,
} from './enemies';
import { STRAND_IDS } from '../engine/adaptive';

describe('Luminex species', () => {
  it('has the three evolution stages and the four named moves', () => {
    expect(LUMINEX.stageNames).toEqual(['Luminex', 'Luminite', 'Luminaut']);
    const moveNames = LUMINEX.moves.map((m) => m.name);
    expect(moveNames).toEqual(
      expect.arrayContaining(['Crunch', 'Heal', 'Refrigerate', 'Ice Storm']),
    );
  });

  it('is the starter and a wolf', () => {
    expect(PETS[STARTER_PET]).toBe(LUMINEX);
    expect(LUMINEX.shape).toBe('wolf');
  });

  it('clamps stageName to the last stage', () => {
    expect(stageName(LUMINEX, 0)).toBe('Luminex');
    expect(stageName(LUMINEX, 2)).toBe('Luminaut');
    expect(stageName(LUMINEX, 9)).toBe('Luminaut');
  });
});

describe('chooseMove', () => {
  it('never heals when the pet is at full health', () => {
    for (let i = 0; i < 30; i++) {
      expect(chooseMove(LUMINEX, false).kind).toBe('attack');
    }
  });

  it('can heal when the pet is hurt', () => {
    let healed = false;
    // forced low rng -> heal branch
    for (let i = 0; i < 5; i++) {
      if (chooseMove(LUMINEX, true, () => 0).kind === 'heal') healed = true;
    }
    expect(healed).toBe(true);
  });
});

describe('bosses & keystones', () => {
  it('gives every region a boss with a unique keystone', () => {
    const keystoneIds = STRAND_IDS.map((s) => REGION_BOSSES[s].keystoneId);
    expect(new Set(keystoneIds).size).toBe(STRAND_IDS.length);
    for (const id of keystoneIds) {
      expect(KEYSTONES[id!]).toBeDefined();
    }
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
