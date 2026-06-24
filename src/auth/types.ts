/**
 * Auth seam for cloud sync.
 *
 * Each kid signs in with a **username + password**. There are two interchangeable
 * implementations behind `AuthProvider`:
 *
 * - `createLocalAuth` — offline stand-in. Credentials and the session live in
 *   `localStorage`; passwords are PBKDF2-hashed (see `hash.ts`). The app is fully
 *   usable with no backend.
 * - `createCognitoAuth` — talks to an Amazon Cognito User Pool over plain `fetch`
 *   (no AWS SDK), activated only when the pool is configured via env.
 *
 * The model is identical either way: a session carries the kid's `householdId`
 * (so a family's profiles group together) and a stable `profileId`. In cloud mode
 * `token` is the Cognito JWT the sync Lambda authorizes against; in local mode it
 * is null. See docs/multiplayer.md.
 */

export interface AuthSession {
  /** Normalized (lowercased, trimmed) login handle. */
  username: string;
  /** Groups a family's profiles; the sync key. */
  householdId: string;
  /** Stable id for this login (Cognito `sub` in cloud mode). */
  profileId: string;
  /** Bearer token for the sync API, or null in local (offline) mode. */
  token: string | null;
  /** Epoch ms when `token` expires; null when it does not expire (local). */
  expiresAt: number | null;
}

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'username-taken'
  | 'weak-password'
  | 'network'
  | 'not-configured'
  | 'unknown';

/** Typed failure the UI can branch on without parsing messages. */
export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AuthError';
  }
}

export interface NewLogin {
  username: string;
  password: string;
  /** Display name for the kid's profile; defaults to the username. */
  displayName?: string;
  /**
   * Household to join. Omit to start a new household (the first kid on a device);
   * pass an existing id to add a sibling to the same family.
   */
  householdId?: string;
}

export interface AuthProvider {
  /** True for the Cognito provider, false for the local stand-in. */
  readonly isCloud: boolean;
  /** Cached current session (synchronous), or null when signed out. */
  currentSession(): AuthSession | null;
  /** Create a kid login. Parent-gated in the UI. Resolves to the new session. */
  createLogin(input: NewLogin): Promise<AuthSession>;
  /** Sign in an existing kid. */
  signIn(username: string, password: string): Promise<AuthSession>;
  /** Clear the local session (and revoke server-side where supported). */
  signOut(): Promise<void>;
}

/** Lowercase + trim so "Mia " and "mia" are the same login. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Shared minimum so local and Cognito reject the same weak passwords. */
export const MIN_PASSWORD_LENGTH = 6;
