/**
 * App lock PIN. Stored only on this device (never uploaded).
 * PBKDF2-SHA256 with a random salt, and an escalating lockout after repeated wrong attempts.
 * Note: this is a privacy screen for a shared phone, not encryption of the stored data.
 */

const ITERATIONS = 150_000;
const KEY = (scope: string) => `hisabpro:v2:pin:${scope}`;
const FREE_ATTEMPTS = 5;

export interface PinRecord {
  salt: string;
  hash: string;
  iter: number;
  len: 4 | 6;
  autoLockMin: number; // 0 = lock as soon as the app is left
  fails: number;
  lockedUntil: number;
}

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => new Uint8Array((hex.match(/.{2}/g) || []).map((h) => parseInt(h, 16)));

async function derive(pin: string, salt: Uint8Array, iter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function getPin(scope: string): PinRecord | null {
  try {
    const raw = localStorage.getItem(KEY(scope));
    if (!raw) return null;
    const r = JSON.parse(raw);
    if (typeof r?.hash !== 'string' || typeof r?.salt !== 'string') return null;
    return {
      salt: r.salt,
      hash: r.hash,
      iter: Number(r.iter) || ITERATIONS,
      len: r.len === 6 ? 6 : 4,
      autoLockMin: Number.isFinite(r.autoLockMin) ? r.autoLockMin : 5,
      fails: Number(r.fails) || 0,
      lockedUntil: Number(r.lockedUntil) || 0,
    };
  } catch {
    return null;
  }
}

function save(scope: string, rec: PinRecord): void {
  try {
    localStorage.setItem(KEY(scope), JSON.stringify(rec));
  } catch {
    /* storage unavailable */
  }
}

export async function setPin(scope: string, pin: string, len: 4 | 6, autoLockMin?: number): Promise<void> {
  if (!/^\d+$/.test(pin) || pin.length !== len) throw new Error('PIN must be ' + len + ' digits');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, ITERATIONS);
  const prev = getPin(scope);
  save(scope, {
    salt: toHex(salt),
    hash,
    iter: ITERATIONS,
    len,
    autoLockMin: autoLockMin ?? prev?.autoLockMin ?? 5,
    fails: 0,
    lockedUntil: 0,
  });
}

export function setAutoLock(scope: string, minutes: number): void {
  const r = getPin(scope);
  if (r) save(scope, { ...r, autoLockMin: minutes });
}

export function clearPin(scope: string): void {
  try {
    localStorage.removeItem(KEY(scope));
  } catch {
    /* ignore */
  }
}

export type VerifyResult = { ok: true } | { ok: false; lockedMs: number; attemptsLeft: number };

export async function verifyPin(scope: string, pin: string): Promise<VerifyResult> {
  const rec = getPin(scope);
  if (!rec) return { ok: true };
  const now = Date.now();
  if (rec.lockedUntil > now) return { ok: false, lockedMs: rec.lockedUntil - now, attemptsLeft: 0 };

  const hash = await derive(pin, fromHex(rec.salt), rec.iter);
  if (timingSafeEqual(hash, rec.hash)) {
    if (rec.fails || rec.lockedUntil) save(scope, { ...rec, fails: 0, lockedUntil: 0 });
    return { ok: true };
  }

  const fails = rec.fails + 1;
  let lockedUntil = 0;
  if (fails >= FREE_ATTEMPTS) {
    // 30s, 60s, 2m, 4m ... capped at 15 minutes
    const wait = Math.min(15 * 60_000, 30_000 * 2 ** (fails - FREE_ATTEMPTS));
    lockedUntil = Date.now() + wait;
  }
  save(scope, { ...rec, fails, lockedUntil });
  return {
    ok: false,
    lockedMs: lockedUntil ? lockedUntil - Date.now() : 0,
    attemptsLeft: Math.max(0, FREE_ATTEMPTS - fails),
  };
}
