import { describe, it, expect, vi } from 'vitest';
import { createCognitoAuth, type CognitoConfig } from './cognitoAuth';
import type { StorageLike } from '../state/storage';

const CONFIG: CognitoConfig = { region: 'us-east-1', userPoolId: 'us-east-1_pool', clientId: 'abc123' };

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

/** Minimal unsigned JWT carrying the claims the provider reads. */
function fakeIdToken(claims: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'none' })}.${b64(claims)}.sig`;
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}
function err(type: string, status = 400): Response {
  return new Response(JSON.stringify({ __type: type, message: type }), { status });
}

function target(call: unknown[]): string {
  const init = call[1] as RequestInit;
  return (init.headers as Record<string, string>)['X-Amz-Target'];
}

describe('createCognitoAuth', () => {
  it('signs in via InitiateAuth and extracts household + profile from the IdToken', async () => {
    const idToken = fakeIdToken({ sub: 'cog-sub-1', 'custom:householdId': 'HH-42' });
    const fetchFn = vi
      .fn()
      .mockResolvedValue(ok({ AuthenticationResult: { IdToken: idToken, ExpiresIn: 3600 } }));
    const auth = createCognitoAuth(CONFIG, fakeStorage(), fetchFn as unknown as typeof fetch);

    const s = await auth.signIn('Mia', 'secret1');
    expect(s).toMatchObject({ username: 'mia', householdId: 'HH-42', profileId: 'cog-sub-1', token: idToken });
    expect(s.expiresAt).toBeGreaterThan(Date.now());

    expect(target(fetchFn.mock.calls[0])).toMatch(/InitiateAuth$/);
    const body = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: 'abc123',
      AuthParameters: { USERNAME: 'mia', PASSWORD: 'secret1' },
    });
  });

  it('caches the session so currentSession() returns it', async () => {
    const idToken = fakeIdToken({ sub: 's', 'custom:householdId': 'HH-1' });
    const storage = fakeStorage();
    const fetchFn = vi.fn().mockResolvedValue(ok({ AuthenticationResult: { IdToken: idToken, ExpiresIn: 3600 } }));
    const auth = createCognitoAuth(CONFIG, storage, fetchFn as unknown as typeof fetch);
    await auth.signIn('mia', 'secret1');
    expect(auth.currentSession()?.householdId).toBe('HH-1');
  });

  it('createLogin calls SignUp then InitiateAuth with the household attribute', async () => {
    const idToken = fakeIdToken({ sub: 'new', 'custom:householdId': 'HH-new' });
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(ok({ UserConfirmed: true }))
      .mockResolvedValueOnce(ok({ AuthenticationResult: { IdToken: idToken, ExpiresIn: 3600 } }));
    const auth = createCognitoAuth(CONFIG, fakeStorage(), fetchFn as unknown as typeof fetch);

    const s = await auth.createLogin({ username: 'ana', password: 'secret1', householdId: 'HH-new' });
    expect(s.householdId).toBe('HH-new');
    expect(target(fetchFn.mock.calls[0])).toMatch(/SignUp$/);
    const signUpBody = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(signUpBody.UserAttributes).toContainEqual({ Name: 'custom:householdId', Value: 'HH-new' });
    expect(target(fetchFn.mock.calls[1])).toMatch(/InitiateAuth$/);
  });

  it('maps Cognito error types to typed codes', async () => {
    const taken = createCognitoAuth(
      CONFIG,
      fakeStorage(),
      vi.fn().mockResolvedValue(err('UsernameExistsException')) as unknown as typeof fetch,
    );
    await expect(taken.createLogin({ username: 'mia', password: 'secret1' })).rejects.toMatchObject({
      code: 'username-taken',
    });

    const bad = createCognitoAuth(
      CONFIG,
      fakeStorage(),
      vi.fn().mockResolvedValue(err('NotAuthorizedException')) as unknown as typeof fetch,
    );
    await expect(bad.signIn('mia', 'nope')).rejects.toMatchObject({ code: 'invalid-credentials' });
  });

  it('treats a network failure as a typed network error', async () => {
    const auth = createCognitoAuth(
      CONFIG,
      fakeStorage(),
      vi.fn().mockRejectedValue(new TypeError('offline')) as unknown as typeof fetch,
    );
    await expect(auth.signIn('mia', 'secret1')).rejects.toMatchObject({ code: 'network' });
  });
});
