/**
 * Runtime environment access.
 * - On Cloudflare Workers, Nitro exposes bindings/vars/secrets on `globalThis.__env__`.
 * - Locally (vite dev / node), values come from `process.env` (e.g. a `.env` file).
 */

type CloudflareEnv = Record<string, unknown> & { DB?: D1Database };

export interface D1Result<T> {
  results?: T[];
  meta?: { last_row_id?: number; changes?: number };
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<D1Result<T>>;
  first<T>(): Promise<T | null>;
  run(): Promise<D1Result<unknown>>;
}
export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  exec(sql: string): Promise<unknown>;
}

export function cloudflareEnv(): CloudflareEnv | undefined {
  return (globalThis as { __env__?: CloudflareEnv }).__env__;
}

let localEnvLoaded = false;

/** Locally, load `.env` into process.env once (Node ≥ 20.12 has process.loadEnvFile). */
function loadLocalEnv() {
  if (localEnvLoaded) return;
  localEnvLoaded = true;
  if (cloudflareEnv() || typeof process === "undefined") return;
  try {
    (process as unknown as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(".env");
  } catch {
    // No .env file — fine.
  }
}

/** Read a string config value (secret or var). */
export function getEnv(name: string): string | undefined {
  loadLocalEnv();
  const fromCf = cloudflareEnv()?.[name];
  if (typeof fromCf === "string" && fromCf) return fromCf;
  if (typeof process !== "undefined" && process.env?.[name]) return process.env[name];
  return undefined;
}

export const isProduction = () =>
  Boolean(cloudflareEnv()) ||
  (typeof process !== "undefined" && process.env?.["NODE_ENV"] === "production");
