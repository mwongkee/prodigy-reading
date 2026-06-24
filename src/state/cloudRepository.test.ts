import { describe, it, expect, vi } from 'vitest';
import {
  createHttpCloudSync,
  mergeHousehold,
  withCloudSync,
  type CloudSnapshot,
  type CloudSync,
} from './cloudRepository';
import { createLocalStorageRepository, type HouseholdData, type PlayerSave, type StorageLike } from './storage';
import { createLearner } from '../engine/adaptive';

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const meta = (id: string, lastPlayedAt: number) => ({
  id,
  name: id,
  speciesId: 'luminex',
  createdAt: 0,
  lastPlayedAt,
});

const save = (level: number): PlayerSave => ({
  learner: createLearner(1000),
  seedRating: 1000,
  placed: true,
  customPets: [],
  speciesId: 'luminex',
  xp: 0,
  level,
  petStage: 0,
  progress: {} as PlayerSave['progress'],
  bossDefeated: {} as PlayerSave['bossDefeated'],
  keystones: [],
  finaleWon: false,
  log: [],
});

/** In-memory CloudSync for wrapper tests. */
function fakeSync(initial?: CloudSnapshot) {
  const state: CloudSnapshot = initial ?? { household: null, saves: {} };
  return {
    state,
    pushHousehold: vi.fn(async (d: HouseholdData) => void (state.household = d)),
    pushSave: vi.fn(async (id: string, s: PlayerSave) => void (state.saves[id] = s)),
    deleteSave: vi.fn(async (id: string) => void delete state.saves[id]),
    pull: vi.fn(async () => ({ household: state.household, saves: { ...state.saves } })),
  } satisfies CloudSync & { state: CloudSnapshot };
}

describe('createHttpCloudSync', () => {
  it('GETs /state with a bearer token', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ household: null, saves: {} })));
    const sync = createHttpCloudSync({ apiUrl: 'https://api.test/', getToken: () => 'TKN', fetchFn });
    await sync.pull();
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.test/state');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer TKN');
  });

  it('PUTs a save to /profile/{id}', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{}'));
    const sync = createHttpCloudSync({ apiUrl: 'https://api.test', getToken: () => 'TKN', fetchFn });
    await sync.pushSave('p1', save(3));
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.test/profile/p1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string).level).toBe(3);
  });

  it('no-ops (no fetch) when signed out', async () => {
    const fetchFn = vi.fn();
    const sync = createHttpCloudSync({ apiUrl: 'https://api.test', getToken: () => null, fetchFn });
    expect(await sync.pull()).toEqual({ household: null, saves: {} });
    await sync.pushSave('p1', save(1));
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('mergeHousehold (last-write-wins)', () => {
  it('takes the newer profile by lastPlayedAt and flags cloud wins', () => {
    const local: HouseholdData = { profiles: [meta('a', 100), meta('b', 500)], activeProfileId: 'a' };
    const cloud: HouseholdData = { profiles: [meta('a', 300), meta('c', 50)], activeProfileId: 'c' };
    const { merged, cloudWins } = mergeHousehold(local, cloud);

    expect(cloudWins).toEqual(new Set(['a', 'c'])); // a newer in cloud, c only in cloud
    expect(merged.profiles.find((p) => p.id === 'a')?.lastPlayedAt).toBe(300);
    expect(merged.profiles.find((p) => p.id === 'b')?.lastPlayedAt).toBe(500); // local-only kept
    expect(merged.profiles.map((p) => p.id).sort()).toEqual(['a', 'b', 'c']);
    expect(merged.activeProfileId).toBe('a'); // device selection still valid → kept
  });

  it('falls back to the cloud active id when local selection is gone', () => {
    const local: HouseholdData = { profiles: [], activeProfileId: 'gone' };
    const cloud: HouseholdData = { profiles: [meta('c', 1)], activeProfileId: 'c' };
    expect(mergeHousehold(local, cloud).merged.activeProfileId).toBe('c');
  });
});

describe('withCloudSync', () => {
  it('writes through to local and mirrors to the cloud', async () => {
    const local = createLocalStorageRepository(fakeStorage());
    const sync = fakeSync();
    const repo = withCloudSync(local, sync);

    repo.saveSave('p1', save(4));
    repo.saveHousehold({ profiles: [meta('p1', 10)], activeProfileId: 'p1' });

    expect(local.loadSave('p1')?.level).toBe(4); // local is synchronous source of truth
    await Promise.resolve(); // let the fire-and-forget mirror settle
    expect(sync.pushSave).toHaveBeenCalledWith('p1', expect.objectContaining({ level: 4 }));
    expect(sync.pushHousehold).toHaveBeenCalled();
  });

  it('reconcile pulls a newer cloud save into local and reports change', async () => {
    const storage = fakeStorage();
    const local = createLocalStorageRepository(storage);
    local.saveHousehold({ profiles: [meta('p1', 100)], activeProfileId: 'p1' });
    local.saveSave('p1', save(1));

    const sync = fakeSync({
      household: { profiles: [meta('p1', 999)], activeProfileId: 'p1' },
      saves: { p1: save(9) },
    });
    const repo = withCloudSync(local, sync);

    const changed = await repo.reconcile();
    expect(changed).toBe(true);
    expect(local.loadSave('p1')?.level).toBe(9); // cloud was newer → overwrote local
  });

  it('reconcile keeps the local save when it is newer', async () => {
    const storage = fakeStorage();
    const local = createLocalStorageRepository(storage);
    local.saveHousehold({ profiles: [meta('p1', 999)], activeProfileId: 'p1' });
    local.saveSave('p1', save(7));

    const sync = fakeSync({
      household: { profiles: [meta('p1', 100)], activeProfileId: 'p1' },
      saves: { p1: save(2) },
    });
    const repo = withCloudSync(local, sync);

    expect(await repo.reconcile()).toBe(false);
    expect(local.loadSave('p1')?.level).toBe(7); // local newer → untouched
  });

  it('reconcile pushes a fresh device up when the cloud is empty', async () => {
    const local = createLocalStorageRepository(fakeStorage());
    local.saveHousehold({ profiles: [meta('p1', 5)], activeProfileId: 'p1' });
    local.saveSave('p1', save(3));
    const sync = fakeSync(); // empty cloud
    const repo = withCloudSync(local, sync);

    expect(await repo.reconcile()).toBe(false);
    await Promise.resolve();
    expect(sync.pushHousehold).toHaveBeenCalled();
    expect(sync.pushSave).toHaveBeenCalledWith('p1', expect.objectContaining({ level: 3 }));
  });

  it('never throws when the cloud errors', async () => {
    const local = createLocalStorageRepository(fakeStorage());
    const sync = fakeSync();
    sync.pull.mockRejectedValueOnce(new Error('boom'));
    const repo = withCloudSync(local, sync, () => {});
    expect(await repo.reconcile()).toBe(false);
  });
});
