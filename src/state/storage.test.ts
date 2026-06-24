import { describe, it, expect } from 'vitest';
import {
  createLocalStorageRepository,
  newId,
  type PlayerSave,
  type StorageLike,
} from './storage';
import { createLearner } from '../engine/adaptive';

function fakeStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const sampleSave = (): PlayerSave => ({
  learner: createLearner(1100),
  seedRating: 1100,
  placed: true,
  customPets: [],
  speciesId: 'luminex',
  xp: 10,
  level: 2,
  petStage: 0,
  progress: {} as PlayerSave['progress'],
  bossDefeated: {} as PlayerSave['bossDefeated'],
  keystones: [],
  finaleWon: false,
  log: [],
});

describe('createLocalStorageRepository', () => {
  it('starts with an empty household', () => {
    const repo = createLocalStorageRepository(fakeStorage());
    expect(repo.loadHousehold()).toEqual({ profiles: [], activeProfileId: null });
  });

  it('round-trips a household', () => {
    const repo = createLocalStorageRepository(fakeStorage());
    const data = {
      profiles: [{ id: 'a', name: 'Mia', speciesId: 'luminex', createdAt: 1, lastPlayedAt: 2 }],
      activeProfileId: 'a',
    };
    repo.saveHousehold(data);
    expect(repo.loadHousehold()).toEqual(data);
  });

  it('round-trips and deletes a player save', () => {
    const repo = createLocalStorageRepository(fakeStorage());
    const save = sampleSave();
    repo.saveSave('a', save);
    expect(repo.loadSave('a')).toEqual(save);
    repo.deleteSave('a');
    expect(repo.loadSave('a')).toBeNull();
  });

  it('isolates saves per profile id', () => {
    const repo = createLocalStorageRepository(fakeStorage());
    repo.saveSave('a', { ...sampleSave(), level: 2 });
    repo.saveSave('b', { ...sampleSave(), level: 7 });
    expect(repo.loadSave('a')?.level).toBe(2);
    expect(repo.loadSave('b')?.level).toBe(7);
  });

  it('tolerates corrupt JSON without throwing', () => {
    const storage = fakeStorage();
    storage.map.set('readquest.household.v1', '{not json');
    storage.map.set('readquest.profile.v1.a', '{not json');
    const repo = createLocalStorageRepository(storage);
    expect(repo.loadHousehold()).toEqual({ profiles: [], activeProfileId: null });
    expect(repo.loadSave('a')).toBeNull();
  });

  it('migrates a legacy single-player save into "Player 1"', () => {
    const storage = fakeStorage();
    // Pre-multiplayer blob written by the old persist middleware.
    storage.map.set(
      'readquest.creations',
      JSON.stringify({ customPets: [], speciesId: 'flickit', placed: true, seedRating: 980 }),
    );
    const repo = createLocalStorageRepository(storage);

    const hh = repo.loadHousehold();
    expect(hh.profiles).toHaveLength(1);
    expect(hh.profiles[0].name).toBe('Player 1');
    expect(hh.profiles[0].speciesId).toBe('flickit');
    expect(hh.activeProfileId).toBe(hh.profiles[0].id);

    // The migrated save is loadable and the legacy key is cleared.
    const save = repo.loadSave(hh.activeProfileId!);
    expect(save?.seedRating).toBe(980);
    expect(storage.map.has('readquest.creations')).toBe(false);

    // Migration is idempotent: a second load returns the same household.
    expect(repo.loadHousehold()).toEqual(hh);
  });

  it('generates distinct ids', () => {
    expect(newId()).not.toBe(newId());
  });
});
