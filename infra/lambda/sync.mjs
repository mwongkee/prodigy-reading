/**
 * ReadQuest sync API (Lambda Function URL).
 *
 * Auth: verifies the Cognito **IdToken** in the Authorization header against the
 * pool's JWKS (RS256), then scopes every DynamoDB access to the caller's
 * `custom:householdId` claim — a kid can only ever touch their own household.
 *
 * Routes (single-table: PK = HH#<householdId>):
 *   GET    /state          → { household, saves: { <profileId>: save } }
 *   PUT    /household       → upsert the household index (SK = HOUSEHOLD)
 *   PUT    /profile/{id}    → upsert a profile save (SK = PROFILE#<id>)
 *   DELETE /profile/{id}    → remove a profile save
 *
 * No external dependencies: the AWS SDK v3 and node:crypto ship with the Node 20
 * runtime, and JWKS is fetched with the built-in `fetch`.
 */

import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME;
const ISSUER = process.env.COGNITO_ISSUER;
const CLIENT = process.env.COGNITO_CLIENT;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// ---- JWT verification (cached JWKS) ----

let jwks = null;
async function publicKeyFor(kid) {
  if (!jwks) {
    const res = await fetch(`${ISSUER}/.well-known/jwks.json`);
    if (!res.ok) throw new Error('jwks fetch failed');
    jwks = (await res.json()).keys;
  }
  const jwk = jwks.find((k) => k.kid === kid);
  if (!jwk) throw new Error('unknown key id');
  return createPublicKey({ key: jwk, format: 'jwk' });
}

const b64urlToBuf = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const b64urlToJson = (s) => JSON.parse(b64urlToBuf(s).toString('utf8'));

async function verifyIdToken(token) {
  const [h, p, sig] = token.split('.');
  if (!h || !p || !sig) throw new Error('malformed token');
  const header = b64urlToJson(h);
  const key = await publicKeyFor(header.kid);
  const ok = cryptoVerify('RSA-SHA256', Buffer.from(`${h}.${p}`), key, b64urlToBuf(sig));
  if (!ok) throw new Error('bad signature');

  const claims = b64urlToJson(p);
  if (claims.iss !== ISSUER) throw new Error('bad issuer');
  if (claims.token_use !== 'id') throw new Error('not an id token');
  if (claims.aud !== CLIENT) throw new Error('bad audience');
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) throw new Error('expired');
  if (!claims['custom:householdId']) throw new Error('no household');
  return claims;
}

// ---- DynamoDB helpers ----

const pk = (hh) => `HH#${hh}`;
const HOUSEHOLD_SK = 'HOUSEHOLD';
const profileSk = (id) => `PROFILE#${id}`;

async function getState(hh) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': pk(hh) },
    }),
  );
  let household = null;
  const saves = {};
  for (const item of out.Items ?? []) {
    if (item.SK === HOUSEHOLD_SK) household = item.data ?? null;
    else if (typeof item.SK === 'string' && item.SK.startsWith('PROFILE#')) {
      saves[item.SK.slice('PROFILE#'.length)] = item.save;
    }
  }
  return { household, saves };
}

// ---- HTTP ----

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? 'GET';
  const path = event.rawPath ?? event.requestContext?.http?.path ?? '/';

  const auth = event.headers?.authorization ?? event.headers?.Authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return json(401, { error: 'missing token' });

  let claims;
  try {
    claims = await verifyIdToken(token);
  } catch (err) {
    return json(401, { error: 'invalid token', detail: String(err.message ?? err) });
  }
  const hh = claims['custom:householdId'];

  try {
    if (method === 'GET' && path === '/state') {
      return json(200, await getState(hh));
    }

    if (method === 'PUT' && path === '/household') {
      const data = JSON.parse(event.body ?? '{}');
      await ddb.send(
        new PutCommand({ TableName: TABLE, Item: { PK: pk(hh), SK: HOUSEHOLD_SK, data, updatedAt: Date.now() } }),
      );
      return json(200, { ok: true });
    }

    const profileMatch = path.match(/^\/profile\/([^/]+)$/);
    if (profileMatch) {
      const id = decodeURIComponent(profileMatch[1]);
      if (method === 'PUT') {
        const save = JSON.parse(event.body ?? '{}');
        await ddb.send(
          new PutCommand({ TableName: TABLE, Item: { PK: pk(hh), SK: profileSk(id), save, updatedAt: Date.now() } }),
        );
        return json(200, { ok: true });
      }
      if (method === 'DELETE') {
        await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { PK: pk(hh), SK: profileSk(id) } }));
        return json(200, { ok: true });
      }
    }

    return json(404, { error: 'not found' });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'server error' });
  }
};
