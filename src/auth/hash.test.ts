import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './hash';

describe('password hashing', () => {
  it('verifies a correct password', async () => {
    const stored = await hashPassword('hunter2!');
    expect(await verifyPassword('hunter2!', stored)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('hunter2!');
    expect(await verifyPassword('hunter3!', stored)).toBe(false);
  });

  it('salts: same password hashes to different strings', async () => {
    const a = await hashPassword('same-pass');
    const b = await hashPassword('same-pass');
    expect(a).not.toBe(b);
    expect(await verifyPassword('same-pass', a)).toBe(true);
    expect(await verifyPassword('same-pass', b)).toBe(true);
  });

  it('self-describes its scheme and iterations', async () => {
    const stored = await hashPassword('x');
    const [scheme, iterations] = stored.split('$');
    expect(scheme).toBe('pbkdf2');
    expect(Number(iterations)).toBeGreaterThan(0);
  });

  it('treats a malformed stored value as a non-match (never throws)', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2$bad')).toBe(false);
    expect(await verifyPassword('x', '')).toBe(false);
  });
});
