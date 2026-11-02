import {
  clearSession,
  getRequestHeader,
  getRequestIP,
  getSession,
  updateSession,
} from "@tanstack/react-start/server";
import { canAccess, type Area, type Role } from "@/lib/roles";
import { getDb } from "./db";
import { getEnv, isProduction } from "./env";
import { generateRecoveryCodes, generateSecret, otpauthUri, verifyTotp } from "./totp";

/**
 * Admin accounts: each person signs in with their own email + password.
 * The sealed session cookie holds the user id and the account's
 * session_version, so disabling an account or changing its password signs it
 * out everywhere. ADMIN_PASSWORD is only the key for creating the first
 * account (and stays a recovery path while no account exists).
 */

/** p2fa: user id that passed the password step and still owes a 2FA code (since p2faAt). */
type AdminSession = {
  uid?: number | undefined;
  v?: number | undefined;
  at?: number | undefined;
  p2fa?: number | undefined;
  p2faAt?: number | undefined;
};

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  title: string | null;
  role: Role;
  status: "active" | "disabled";
  last_login_at: string | null;
  created_at: string;
  /** 1 when two-factor sign-in is on. */
  totp_enabled: number;
}

interface UserRow extends AdminUser {
  password_hash: string;
  session_version: number;
}

const USER_COLS = "id, email, name, title, role, status, last_login_at, created_at, totp_enabled";

/** How long a passed password step waits for the 2FA code. */
const SECOND_FACTOR_MS = 5 * 60_000;

const LOCKOUT = {
  windowMinutes: 15,
  /** Failed attempts on one email before it is locked for the window. */
  perEmail: 5,
  /** Failed attempts from one IP before it is blocked for the window. */
  perIp: 20,
};

const DEV_SECRET = "local-dev-only-session-secret-not-for-production-use";

function sessionConfig() {
  const password = getEnv("SESSION_SECRET") ?? (isProduction() ? undefined : DEV_SECRET);
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set (at least 32 characters).");
  }
  return {
    password,
    name: "lx_admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
    // Only accept the encrypted cookie, never a session passed in a request header.
    sessionHeader: false as const,
  };
}

export const requestIp = () =>
  getRequestHeader("cf-connecting-ip") ?? getRequestIP({ xForwardedFor: true }) ?? null;

/* ---------------------------------------------------------- passwords */

// Cloudflare Workers caps PBKDF2 at 100k iterations.
const PBKDF2_ITERATIONS = 100_000;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
const fromHex = (hex: string) =>
  new Uint8Array(hex.match(/../g)?.map((h) => parseInt(h, 16)) ?? []);

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

/** "pbkdf2$<iterations>$<salt hex>$<hash hex>" */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !iter || !salt || !hash) return false;
  const actual = toHex(await pbkdf2(password, fromHex(salt), Number(iter)));
  return safeEqual(actual, hash);
}

/** Constant-time string comparison (avoids leaking secrets via timing). */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i]! ^ vb[i]!;
  return diff === 0;
}

/** Minimum password rule shared by setup, account creation and changes. */
export const PASSWORD_MIN = 10;

/* ----------------------------------------------------------- sessions */

export async function currentUser(): Promise<AdminUser | null> {
  try {
    const session = await getSession<AdminSession>(sessionConfig());
    if (!session.data.uid) return null;
    const db = await getDb();
    const row = await db.first<UserRow>(
      `SELECT ${USER_COLS}, session_version FROM admin_users WHERE id = ?`,
      [session.data.uid],
    );
    if (!row || row.status !== "active" || row.session_version !== session.data.v) return null;
    const { session_version: _v, ...user } = row;
    return user;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  return (await currentUser()) !== null;
}

/** Signed-in user allowed in `area`; throws UNAUTHORIZED / FORBIDDEN otherwise. */
export async function requireAdmin(area?: Area): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (area && !canAccess(user.role, area)) throw new Error("FORBIDDEN");
  return user;
}

async function startSession(user: { id: number; session_version: number }) {
  await updateSession<AdminSession>(sessionConfig(), {
    uid: user.id,
    v: user.session_version,
    at: Date.now(),
  });
}

/** Re-issue the current browser's session after the user's session_version changed. */
export async function refreshSession(userId: number) {
  const db = await getDb();
  const row = await db.first<{ id: number; session_version: number }>(
    "SELECT id, session_version FROM admin_users WHERE id = ?",
    [userId],
  );
  if (row) await startSession(row);
}

export async function logoutAdmin(): Promise<void> {
  await clearSession(sessionConfig());
}

/* ------------------------------------------------------------- login */

export async function needsSetup(): Promise<boolean> {
  const db = await getDb();
  const row = await db.first<{ n: number }>("SELECT COUNT(*) AS n FROM admin_users");
  return (row?.n ?? 0) === 0;
}

export type LoginResult =
  { ok: true; user: AdminUser } | { ok: false; error: "invalid" | "locked" | "setup" | "2fa" };

async function recentFailures(column: "email" | "ip", value: string) {
  const db = await getDb();
  const since = new Date(Date.now() - LOCKOUT.windowMinutes * 60_000).toISOString();
  // Count failures since the last success for this email/IP.
  const row = await db.first<{ n: number }>(
    `SELECT COUNT(*) AS n FROM login_attempts
     WHERE ${column} = ? AND success = 0 AND created_at > ?
       AND created_at > COALESCE((SELECT MAX(created_at) FROM login_attempts WHERE ${column} = ? AND success = 1), '')`,
    [value, since, value],
  );
  return row?.n ?? 0;
}

export async function loginAdmin(emailInput: string, password: string): Promise<LoginResult> {
  const db = await getDb();
  if (await needsSetup()) return { ok: false, error: "setup" };

  const email = emailInput.trim().toLowerCase();
  const ip = requestIp();
  if (
    (await recentFailures("email", email)) >= LOCKOUT.perEmail ||
    (ip && (await recentFailures("ip", ip)) >= LOCKOUT.perIp)
  ) {
    return { ok: false, error: "locked" };
  }

  const row = await db.first<UserRow>(
    `SELECT ${USER_COLS}, password_hash, session_version FROM admin_users WHERE email = ?`,
    [email],
  );
  const valid =
    row && row.status === "active" && (await verifyPassword(password, row.password_hash));
  const at = new Date().toISOString();
  await db.run("INSERT INTO login_attempts (email, ip, success, created_at) VALUES (?, ?, ?, ?)", [
    email,
    ip,
    valid ? 1 : 0,
    at,
  ]);
  if (!valid || !row) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 600));
    return { ok: false, error: "invalid" };
  }
  if (row.totp_enabled) {
    // Password OK; the code step still has to pass before a real session starts.
    await updateSession<AdminSession>(sessionConfig(), {
      uid: undefined,
      v: undefined,
      p2fa: row.id,
      p2faAt: Date.now(),
    });
    return { ok: false, error: "2fa" };
  }
  return finishLogin(row, at);
}

async function finishLogin(row: UserRow, at: string): Promise<LoginResult> {
  const db = await getDb();
  await db.run("UPDATE admin_users SET last_login_at = ? WHERE id = ?", [at, row.id]);
  await updateSession<AdminSession>(sessionConfig(), {
    uid: row.id,
    v: row.session_version,
    at: Date.now(),
    p2fa: undefined,
    p2faAt: undefined,
  });
  const { password_hash: _h, session_version: _v, ...user } = row;
  return { ok: true, user };
}

const sha256Hex = async (value: string) =>
  toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
const normalizeRecovery = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Second sign-in step: a 6-digit app code or a one-time recovery code. */
export async function verifySecondFactor(
  code: string,
): Promise<LoginResult | { ok: false; error: "expired" }> {
  const session = await getSession<AdminSession>(sessionConfig());
  const { p2fa, p2faAt } = session.data;
  if (!p2fa || !p2faAt || Date.now() - p2faAt > SECOND_FACTOR_MS)
    return { ok: false, error: "expired" };

  const db = await getDb();
  const row = await db.first<
    UserRow & {
      totp_secret: string | null;
      totp_last_step: number | null;
      recovery_codes: string | null;
    }
  >(
    `SELECT ${USER_COLS}, password_hash, session_version, totp_secret, totp_last_step, recovery_codes
     FROM admin_users WHERE id = ?`,
    [p2fa],
  );
  if (!row || row.status !== "active" || !row.totp_secret) return { ok: false, error: "expired" };

  const ip = requestIp();
  if ((await recentFailures("email", row.email)) >= LOCKOUT.perEmail)
    return { ok: false, error: "locked" };

  const at = new Date().toISOString();
  const step = await verifyTotp(row.totp_secret, code, row.totp_last_step);
  let ok = step !== null;
  if (step !== null) {
    await db.run("UPDATE admin_users SET totp_last_step = ? WHERE id = ?", [step, row.id]);
  } else if (normalizeRecovery(code).length === 8 && row.recovery_codes) {
    const hashes = JSON.parse(row.recovery_codes) as string[];
    const hash = await sha256Hex(normalizeRecovery(code));
    if (hashes.includes(hash)) {
      ok = true;
      // Each recovery code works once.
      await db.run("UPDATE admin_users SET recovery_codes = ? WHERE id = ?", [
        JSON.stringify(hashes.filter((h) => h !== hash)),
        row.id,
      ]);
    }
  }
  await db.run("INSERT INTO login_attempts (email, ip, success, created_at) VALUES (?, ?, ?, ?)", [
    row.email,
    ip,
    ok ? 1 : 0,
    at,
  ]);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: false, error: "invalid" };
  }
  return finishLogin(row, at);
}

/* ---------------------------------------------------- 2FA enrolment */

/** Start enrolment: store a new (not yet active) secret and return what the app needs. */
export async function beginTwoFactor(user: AdminUser) {
  const secret = generateSecret();
  const db = await getDb();
  await db.run("UPDATE admin_users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?", [
    secret,
    user.id,
  ]);
  return { secret, uri: otpauthUri(secret, user.email) };
}

/** Finish enrolment with a code from the app; returns the recovery codes (shown once). */
export async function confirmTwoFactor(userId: number, code: string): Promise<string[] | null> {
  const db = await getDb();
  const row = await db.first<{ totp_secret: string | null }>(
    "SELECT totp_secret FROM admin_users WHERE id = ?",
    [userId],
  );
  if (!row?.totp_secret) return null;
  const step = await verifyTotp(row.totp_secret, code, null);
  if (step === null) return null;
  const codes = generateRecoveryCodes();
  const hashes = await Promise.all(codes.map((c) => sha256Hex(normalizeRecovery(c))));
  await db.run(
    "UPDATE admin_users SET totp_enabled = 1, totp_last_step = ?, recovery_codes = ? WHERE id = ?",
    [step, JSON.stringify(hashes), userId],
  );
  return codes;
}

export async function disableTwoFactor(userId: number) {
  const db = await getDb();
  await db.run(
    "UPDATE admin_users SET totp_enabled = 0, totp_secret = NULL, totp_last_step = NULL, recovery_codes = NULL WHERE id = ?",
    [userId],
  );
}

/** Check a current 2FA code for an enrolled user (used before turning 2FA off). */
export async function checkTwoFactorCode(userId: number, code: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.first<{ totp_secret: string | null; totp_last_step: number | null }>(
    "SELECT totp_secret, totp_last_step FROM admin_users WHERE id = ?",
    [userId],
  );
  if (!row?.totp_secret) return false;
  return (await verifyTotp(row.totp_secret, code, row.totp_last_step)) !== null;
}

export async function recoveryCodesLeft(userId: number): Promise<number> {
  const db = await getDb();
  const row = await db.first<{ recovery_codes: string | null }>(
    "SELECT recovery_codes FROM admin_users WHERE id = ?",
    [userId],
  );
  return row?.recovery_codes ? (JSON.parse(row.recovery_codes) as string[]).length : 0;
}

/** First run: create the owner account, guarded by the ADMIN_PASSWORD setup key. */
export async function setupFirstAdmin(input: {
  setupKey: string;
  email: string;
  name: string;
  password: string;
}): Promise<{ ok: true; user: AdminUser } | { ok: false; error: "invalid_key" | "done" }> {
  if (!(await needsSetup())) return { ok: false, error: "done" };
  const key = getEnv("ADMIN_PASSWORD");
  if (!key || !(await safeEqual(input.setupKey, key))) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: false, error: "invalid_key" };
  }
  const user = await createUserRecord({ ...input, role: "admin" });
  const db = await getDb();
  await db.run("UPDATE admin_users SET last_login_at = ? WHERE id = ?", [
    new Date().toISOString(),
    user.id,
  ]);
  const row = await db.first<{ id: number; session_version: number }>(
    "SELECT id, session_version FROM admin_users WHERE id = ?",
    [user.id],
  );
  if (row) await startSession(row);
  return { ok: true, user };
}

export async function createUserRecord(input: {
  email: string;
  name: string;
  password: string;
  role: Role;
  title?: string | undefined;
}): Promise<AdminUser> {
  const db = await getDb();
  const at = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const exists = await db.first("SELECT id FROM admin_users WHERE email = ?", [email]);
  if (exists) throw new Error("EMAIL_TAKEN");
  const { lastId } = await db.run(
    `INSERT INTO admin_users (email, name, title, role, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      email,
      input.name.trim(),
      input.title?.trim() || null,
      input.role,
      await hashPassword(input.password),
      at,
      at,
    ],
  );
  const user = await db.first<AdminUser>(`SELECT ${USER_COLS} FROM admin_users WHERE id = ?`, [
    lastId,
  ]);
  if (!user) throw new Error("CREATE_FAILED");
  return user;
}

/** Check a user's current password (for "change my password"). */
export async function checkPassword(userId: number, password: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.first<{ password_hash: string }>(
    "SELECT password_hash FROM admin_users WHERE id = ?",
    [userId],
  );
  return !!row && verifyPassword(password, row.password_hash);
}

/** Set a new password and sign the account out on every device. */
export async function setPassword(userId: number, password: string) {
  const db = await getDb();
  await db.run(
    "UPDATE admin_users SET password_hash = ?, session_version = session_version + 1, updated_at = ? WHERE id = ?",
    [await hashPassword(password), new Date().toISOString(), userId],
  );
}
