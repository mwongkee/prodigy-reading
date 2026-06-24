/**
 * Auth entry point. Picks the cloud (Cognito) provider when the pool is
 * configured, otherwise the offline local provider. The rest of the app depends
 * only on `AuthProvider`, never on which implementation is live.
 */

import { createLocalAuth } from './localAuth';
import { createCognitoAuth } from './cognitoAuth';
import { readCloudConfig, type CloudConfig } from './config';
import type { AuthProvider } from './types';
import type { StorageLike } from '../state/storage';

export type { AuthProvider, AuthSession, NewLogin, AuthErrorCode } from './types';
export { AuthError, normalizeUsername, MIN_PASSWORD_LENGTH } from './types';
export { readCloudConfig, type CloudConfig } from './config';

function defaultStorage(): StorageLike {
  const ls = (globalThis as { localStorage?: StorageLike }).localStorage;
  if (ls) return ls;
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

export function createAuthProvider(opts?: {
  storage?: StorageLike;
  cloud?: CloudConfig | null;
  fetchFn?: typeof fetch;
}): AuthProvider {
  const storage = opts?.storage ?? defaultStorage();
  const cloud = opts?.cloud === undefined ? readCloudConfig() : opts.cloud;
  return cloud
    ? createCognitoAuth(cloud, storage, opts?.fetchFn)
    : createLocalAuth(storage);
}
