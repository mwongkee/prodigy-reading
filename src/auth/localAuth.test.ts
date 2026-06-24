import { describe, it, expect } from 'vitest';
import { createLocalAuth } from './localAuth';
import { AuthError } from './types';
import type { StorageLike } from '../state/storage';

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe('createLocalAuth', () => {
  it('creates a login and returns a session with a household', async () => {
    const auth = createLocalAuth(fakeStorage());
    const s = await auth.createLogin({ username: 'Mia', password: 'secret1' });
    expect(s.username).toBe('mia');
    expect(s.householdId).toBeTruthy();
    expect(s.profileId).toBeTruthy();
    expect(s.token).toBeNull();
  });

  it('persists the session across provider instances (same storage)', async () => {
    const storage = fakeStorage();
    await createLocalAuth(storage).createLogin({ username: 'mia', password: 'secret1' });
    expect(createLocalAuth(storage).currentSession()?.username).toBe('mia');
  });

  it('signs in with the right password and rejects the wrong one', async () => {
    const storage = fakeStorage();
    const a = createLocalAuth(storage);
    await a.createLogin({ username: 'sam', password: 'goodpass' });
    await a.signOut();
    expect(a.currentSession()).toBeNull();

    const s = await a.signIn('SAM', 'goodpass');
    expect(s.username).toBe('sam');
    await expect(a.signIn('sam', 'wrong')).rejects.toMatchObject({ code: 'invalid-credentials' });
  });

  it('rejects an unknown user with invalid-credentials', async () => {
    const a = createLocalAuth(fakeStorage());
    await expect(a.signIn('ghost', 'whatever')).rejects.toBeInstanceOf(AuthError);
  });

  it('refuses a duplicate username', async () => {
    const a = createLocalAuth(fakeStorage());
    await a.createLogin({ username: 'mia', password: 'secret1' });
    await expect(a.createLogin({ username: 'Mia', password: 'other1' })).rejects.toMatchObject({
      code: 'username-taken',
    });
  });

  it('refuses a too-short password', async () => {
    const a = createLocalAuth(fakeStorage());
    await expect(a.createLogin({ username: 'mia', password: '123' })).rejects.toMatchObject({
      code: 'weak-password',
    });
  });

  it('shares one household across siblings on a device, distinct profiles', async () => {
    const storage = fakeStorage();
    const a = createLocalAuth(storage);
    const mia = await a.createLogin({ username: 'mia', password: 'secret1' });
    const sam = await a.createLogin({ username: 'sam', password: 'secret2' });
    expect(sam.householdId).toBe(mia.householdId);
    expect(sam.profileId).not.toBe(mia.profileId);
  });

  it('can join an explicit household id', async () => {
    const a = createLocalAuth(fakeStorage());
    const s = await a.createLogin({ username: 'ana', password: 'secret1', householdId: 'HH-shared' });
    expect(s.householdId).toBe('HH-shared');
  });
});
