/**
 * Cloud configuration from Vite env vars. When all four are present the app runs
 * in **cloud mode** (Cognito + DynamoDB sync); when any is missing it stays fully
 * **offline** (local auth, localStorage only). This is the single switch — there
 * is no runtime toggle, so an un-provisioned build can never half-connect.
 *
 * Set after `terraform apply` (the outputs map straight to these):
 *   VITE_AWS_REGION, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, VITE_SYNC_API_URL
 */

import type { CognitoConfig } from './cognitoAuth';

export interface CloudConfig extends CognitoConfig {
  /** Base URL of the sync Lambda Function URL. */
  apiUrl: string;
}

type EnvRecord = Record<string, string | undefined>;

/**
 * Read cloud config from an env record (defaults to Vite's `import.meta.env`).
 * Returns null unless every field is set, so partial config never activates.
 */
export function readCloudConfig(env?: EnvRecord): CloudConfig | null {
  const e = env ?? viteEnv();
  const region = e.VITE_AWS_REGION;
  const userPoolId = e.VITE_COGNITO_USER_POOL_ID;
  const clientId = e.VITE_COGNITO_CLIENT_ID;
  const apiUrl = e.VITE_SYNC_API_URL;
  if (!region || !userPoolId || !clientId || !apiUrl) return null;
  return { region, userPoolId, clientId, apiUrl: apiUrl.replace(/\/$/, '') };
}

/** Guarded access to `import.meta.env` so this module is safe to unit-test. */
function viteEnv(): EnvRecord {
  try {
    return (import.meta as unknown as { env?: EnvRecord }).env ?? {};
  } catch {
    return {};
  }
}
