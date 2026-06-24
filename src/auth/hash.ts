/**
 * Password hashing for the offline (local) auth provider, via the Web Crypto
 * SubtleCrypto PBKDF2 primitive — no dependencies. Cloud (Cognito) mode never
 * uses this; Cognito hashes server-side.
 *
 * Format (single self-describing string, like a mini PHC):
 *   `pbkdf2$<iterations>$<saltHex>$<derivedHex>`
 * so `verifyPassword` can re-derive with the original salt + iteration count.
 *
 * This is a real KDF, not a toy, but the threat model is modest: it protects a
 * kid's local save from a casual sibling, not a determined attacker with the
 * device. The cloud path is the real security boundary.
 */

const SCHEME = 'pbkdf2';
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function subtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) throw new Error('Web Crypto SubtleCrypto is unavailable');
  return c.subtle;
}

function randomBytes(n: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const s = subtle();
  const keyData = new TextEncoder().encode(password) as BufferSource;
  const key = await s.importKey('raw', keyData, 'PBKDF2', false, ['deriveBits']);
  const bits = await s.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

/** Hash a password into a self-describing `pbkdf2$...` string. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await derive(password, salt, ITERATIONS);
  return `${SCHEME}$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

/** Constant-time compare of two equal-length byte arrays. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Verify a password against a `pbkdf2$...` string produced by `hashPassword`. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== SCHEME) return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;
  const salt = fromHex(parts[2]);
  const expected = fromHex(parts[3]);
  const actual = await derive(password, salt, iterations);
  return timingSafeEqual(actual, expected);
}
