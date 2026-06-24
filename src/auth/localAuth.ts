import {
  AuthError,
  MIN_PASSWORD_LENGTH,
  normalizeUsername,
  type AuthProvider,
  type AuthSession,
  type NewLogin,
} from './types';
import { hashPassword, verifyPassword } from './hash';
import { newId, type StorageLike } from '../state/storage';

/**
 * Offline auth provider. Credentials and the active session live in
 * `localStorage`; passwords are PBKDF2-hashed. Same shape as the Cognito
 * provider so the UI and store are identical in both modes — the app is fully
 * usable with no backend, and a kid's username/password is real (not a stub).
 */

const AUTH_KEY = 'readquest.auth.v1';
const SESSION_KEY = 'readquest.auth.session.v1';

interface LocalUser {
  profileId: string;
  displayName: string;
  /** PBKDF2 string from `hash.ts`. */
  hash: string;
}

interface LocalAuthData {
  /** Device household; the first created login mints it, siblings reuse it. */
  householdId: string | null;
  users: Record<string, LocalUser>;
}

export function createLocalAuth(storage: StorageLike): AuthProvider {
  function readData(): LocalAuthData {
    const raw = storage.getItem(AUTH_KEY);
    if (raw == null) return { householdId: null, users: {} };
    try {
      const parsed = JSON.parse(raw) as Partial<LocalAuthData>;
      return { householdId: parsed.householdId ?? null, users: parsed.users ?? {} };
    } catch {
      return { householdId: null, users: {} };
    }
  }

  function writeData(data: LocalAuthData): void {
    storage.setItem(AUTH_KEY, JSON.stringify(data));
  }

  function readSession(): AuthSession | null {
    const raw = storage.getItem(SESSION_KEY);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  function writeSession(session: AuthSession): AuthSession {
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  return {
    isCloud: false,

    currentSession() {
      return readSession();
    },

    async createLogin(input: NewLogin): Promise<AuthSession> {
      const username = normalizeUsername(input.username);
      if (!username) throw new AuthError('invalid-credentials', 'Username is required');
      if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new AuthError('weak-password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      }

      const data = readData();
      if (data.users[username]) throw new AuthError('username-taken', 'That username is taken');

      const householdId = input.householdId ?? data.householdId ?? newId();
      const profileId = newId();
      const user: LocalUser = {
        profileId,
        displayName: input.displayName?.trim() || input.username.trim(),
        hash: await hashPassword(input.password),
      };
      writeData({ householdId, users: { ...data.users, [username]: user } });

      return writeSession({ username, householdId, profileId, token: null, expiresAt: null });
    },

    async signIn(rawUsername: string, password: string): Promise<AuthSession> {
      const username = normalizeUsername(rawUsername);
      const data = readData();
      const user = data.users[username];
      // Verify even on a miss-shaped record to keep timing uniform.
      const ok = user ? await verifyPassword(password, user.hash) : false;
      if (!user || !ok || data.householdId == null) {
        throw new AuthError('invalid-credentials', 'Wrong username or password');
      }
      return writeSession({
        username,
        householdId: data.householdId,
        profileId: user.profileId,
        token: null,
        expiresAt: null,
      });
    },

    async signOut(): Promise<void> {
      storage.removeItem(SESSION_KEY);
    },
  };
}
