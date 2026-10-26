import { clearSession, getSession, updateSession } from "@tanstack/react-start/server";
import { getEnv, isProduction } from "./env";

/** `pw` is a fingerprint of the admin password, so changing the password logs out every session. */
type AdminSession = { admin?: boolean; at?: number; pw?: string };

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

/** Constant-time string comparison (avoids leaking the password via timing). */
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

/** One-way fingerprint of the current admin password (never stores the password itself). */
async function passwordFingerprint(): Promise<string | null> {
  const password = getEnv("ADMIN_PASSWORD");
  if (!password) return null;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${sessionConfig().password}:${password}`),
  );
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function isAdmin(): Promise<boolean> {
  try {
    const session = await getSession<AdminSession>(sessionConfig());
    if (session.data.admin !== true) return false;
    // Sessions created before the password changed are no longer valid.
    const current = await passwordFingerprint();
    return current !== null && session.data.pw === current;
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("UNAUTHORIZED");
}

export async function loginAdmin(password: string): Promise<boolean> {
  const expected = getEnv("ADMIN_PASSWORD");
  if (!expected) {
    console.error("[auth] ADMIN_PASSWORD is not set — admin login is disabled.");
    return false;
  }
  if (!(await safeEqual(password, expected))) {
    // Slow down brute-force attempts.
    await new Promise((r) => setTimeout(r, 600));
    return false;
  }
  await updateSession<AdminSession>(sessionConfig(), {
    admin: true,
    at: Date.now(),
    pw: (await passwordFingerprint()) ?? "",
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  await clearSession(sessionConfig());
}
