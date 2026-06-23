import type { StrandId } from '../engine/adaptive/types';

/**
 * Keystones are earned by defeating a region's boss. Collect all six to break
 * the Puppet Master's hold and face him. They are won purely through play —
 * never bought (see ETHICS.md).
 */
export interface Keystone {
  id: string;
  name: string;
  emoji: string;
}

export interface Enemy {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  isBoss: boolean;
  /** Keystone awarded when this boss is defeated (bosses only). */
  keystoneId?: string;
}

/** Wandering minions — the everyday foes between bosses. */
export const MINIONS: Enemy[] = [
  { id: 'frostling', name: 'Frostling', emoji: '🧊', maxHp: 3, isBoss: false },
  { id: 'snowpuff', name: 'Snowpuff', emoji: '☃️', maxHp: 3, isBoss: false },
  { id: 'icicle-imp', name: 'Icicle Imp', emoji: '🥶', maxHp: 3, isBoss: false },
  { id: 'shiverbat', name: 'Shiverbat', emoji: '🦇', maxHp: 3, isBoss: false },
];

/** One boss guards each region; defeating it yields that region's keystone. */
export const REGION_BOSSES: Record<StrandId, Enemy> = {
  phonics: {
    id: 'ice-worm', name: 'Ice Worm', emoji: '🪱', maxHp: 6, isBoss: true,
    keystoneId: 'shore-key',
  },
  spelling: {
    id: 'gerald', name: 'Gerald', emoji: '🧊', maxHp: 6, isBoss: true,
    keystoneId: 'rune-key',
  },
  comprehension: {
    id: 'ice-dragon', name: 'Ice Dragon', emoji: '🐲', maxHp: 7, isBoss: true,
    keystoneId: 'story-key',
  },
  vocabulary: {
    id: 'glacier-golem', name: 'Glacier Golem', emoji: '🗿', maxHp: 6, isBoss: true,
    keystoneId: 'vale-key',
  },
  grammar: {
    id: 'snow-phantom', name: 'Snow Phantom', emoji: '👻', maxHp: 6, isBoss: true,
    keystoneId: 'grove-key',
  },
  writing: {
    id: 'blizzard-witch', name: 'Blizzard Witch', emoji: '🧙', maxHp: 6, isBoss: true,
    keystoneId: 'quill-key',
  },
};

export const KEYSTONES: Record<string, Keystone> = {
  'shore-key': { id: 'shore-key', name: 'Shore Keystone', emoji: '🔑' },
  'rune-key': { id: 'rune-key', name: 'Rune Keystone', emoji: '🗝️' },
  'story-key': { id: 'story-key', name: 'Story Keystone', emoji: '🔑' },
  'vale-key': { id: 'vale-key', name: 'Vale Keystone', emoji: '🗝️' },
  'grove-key': { id: 'grove-key', name: 'Grove Keystone', emoji: '🔑' },
  'quill-key': { id: 'quill-key', name: 'Quill Keystone', emoji: '🗝️' },
};

export const ALL_KEYSTONE_IDS = Object.values(REGION_BOSSES).map((b) => b.keystoneId!);

/**
 * The Puppet Master — the villain pulling every boss's strings. He stays out of
 * reach until all six keystones are collected, then becomes the final fight.
 */
export const PUPPET_MASTER: Enemy = {
  id: 'puppet-master',
  name: 'The Puppet Master',
  emoji: '🎭',
  maxHp: 10,
  isBoss: true,
};

/** How many minions a child clears before a region's boss appears. */
export const MINIONS_BEFORE_BOSS = 3;

export function randomMinion(rng = Math.random): Enemy {
  return MINIONS[Math.floor(rng() * MINIONS.length)];
}
