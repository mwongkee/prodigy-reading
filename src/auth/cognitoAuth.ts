import {
  AuthError,
  MIN_PASSWORD_LENGTH,
  normalizeUsername,
  type AuthErrorCode,
  type AuthProvider,
  type AuthSession,
  type NewLogin,
} from './types';
import type { StorageLike } from '../state/storage';

/**
 * Cognito User Pool auth over plain `fetch` — no `aws-sdk` / `amazon-cognito-*`
 * dependency, so the bundle stays tiny. We only use two **public** Cognito APIs,
 * both callable from a browser with just the app client id (no AWS credentials):
 *
 *   - `SignUp`      — create a kid login (parent-gated in the UI). A PreSignUp
 *                     Lambda trigger auto-confirms (kids have no email), so the
 *                     account is immediately usable.
 *   - `InitiateAuth` (USER_PASSWORD_AUTH) — sign in, returns the JWTs.
 *
 * The IdToken carries `sub` and `custom:householdId`; it is the bearer the sync
 * Lambda authorizes against (the Lambda verifies it against the pool's JWKS).
 * See infra/ and docs/multiplayer.md.
 */

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
}

const SESSION_KEY = 'readquest.auth.session.v1';
type FetchFn = typeof fetch;

interface InitiateAuthResult {
  AuthenticationResult?: { IdToken?: string; AccessToken?: string; ExpiresIn?: number };
}

/** Decode a JWT payload (base64url, no signature check — the Lambda verifies). */
function decodeClaims(jwt: string): Record<string, unknown> {
  try {
    const b64 = (jwt.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Map a Cognito `__type` / error name to our typed code. */
function codeFor(type: string): AuthErrorCode {
  if (/UsernameExists/.test(type)) return 'username-taken';
  if (/InvalidPassword/.test(type)) return 'weak-password';
  if (/NotAuthorized|UserNotFound/.test(type)) return 'invalid-credentials';
  return 'unknown';
}

export function createCognitoAuth(
  config: CognitoConfig,
  storage: StorageLike,
  fetchFn: FetchFn = fetch,
): AuthProvider {
  const endpoint = `https://cognito-idp.${config.region}.amazonaws.com/`;

  async function call<T>(target: string, body: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new AuthError('network', 'Could not reach the sign-in service');
    }
    const text = await res.text();
    const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    if (!res.ok) {
      const type = String(json.__type ?? res.headers.get('x-amzn-errortype') ?? '');
      throw new AuthError(codeFor(type), String(json.message ?? type) || 'Sign-in failed');
    }
    return json as T;
  }

  function persist(session: AuthSession): AuthSession {
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async function authenticate(username: string, password: string): Promise<AuthSession> {
    const result = await call<InitiateAuthResult>('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: config.clientId,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    });
    const idToken = result.AuthenticationResult?.IdToken;
    if (!idToken) throw new AuthError('unknown', 'No token returned');
    const claims = decodeClaims(idToken);
    const householdId = String(claims['custom:householdId'] ?? '');
    if (!householdId) throw new AuthError('unknown', 'Login is missing a household');
    const expiresIn = result.AuthenticationResult?.ExpiresIn ?? 3600;
    return persist({
      username,
      householdId,
      profileId: String(claims.sub ?? ''),
      token: idToken,
      expiresAt: Date.now() + expiresIn * 1000,
    });
  }

  return {
    isCloud: true,

    currentSession() {
      const raw = storage.getItem(SESSION_KEY);
      if (raw == null) return null;
      try {
        const session = JSON.parse(raw) as AuthSession;
        // Expired tokens are useless to the sync layer; treat as signed out.
        if (session.expiresAt != null && session.expiresAt <= Date.now()) return null;
        return session;
      } catch {
        return null;
      }
    },

    async createLogin(input: NewLogin): Promise<AuthSession> {
      const username = normalizeUsername(input.username);
      if (!username) throw new AuthError('invalid-credentials', 'Username is required');
      if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new AuthError('weak-password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      }
      // First kid on a device starts a household; siblings pass the existing id.
      const householdId = input.householdId ?? crypto.randomUUID();
      await call('SignUp', {
        ClientId: config.clientId,
        Username: username,
        Password: input.password,
        UserAttributes: [{ Name: 'custom:householdId', Value: householdId }],
      });
      // PreSignUp trigger auto-confirms, so we can sign in immediately.
      return authenticate(username, input.password);
    },

    signIn(rawUsername: string, password: string): Promise<AuthSession> {
      return authenticate(normalizeUsername(rawUsername), password);
    },

    async signOut(): Promise<void> {
      storage.removeItem(SESSION_KEY);
    },
  };
}
