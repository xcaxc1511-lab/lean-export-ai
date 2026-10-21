import { cloudflareEnv } from "./env";

/**
 * Minimal database interface implemented by Cloudflare D1 (production) and
 * Node's built-in SQLite (local development). Both speak SQLite, so the same
 * SQL runs everywhere.
 */
export interface Db {
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  first<T>(sql: string, params?: unknown[]): Promise<T | null>;
  run(sql: string, params?: unknown[]): Promise<{ lastId: number; changes: number }>;
}

/** Schema is applied idempotently on first use, so no manual migration step is needed. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    country TEXT,
    product TEXT,
    volume TEXT,
    incoterm TEXT,
    samples INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    lang TEXT,
    source_page TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    ip TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries (created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries (status)`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_vi TEXT NOT NULL,
    excerpt_en TEXT,
    excerpt_vi TEXT,
    body_en TEXT,
    body_vi TEXT,
    cover_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_posts_published ON posts (status, published_at)`,
];

function d1Adapter(d1: NonNullable<ReturnType<typeof cloudflareEnv>>["DB"] & object): Db {
  const stmt = (sql: string, params: unknown[] = []) =>
    params.length ? d1.prepare(sql).bind(...params) : d1.prepare(sql);
  return {
    async all<T>(sql: string, params?: unknown[]) {
      return ((await stmt(sql, params).all<T>()).results ?? []) as T[];
    },
    async first<T>(sql: string, params?: unknown[]) {
      return stmt(sql, params).first<T>();
    },
    async run(sql: string, params?: unknown[]) {
      const res = await stmt(sql, params).run();
      return {
        lastId: Number(res.meta?.last_row_id ?? 0),
        changes: Number(res.meta?.changes ?? 0),
      };
    },
  };
}

type SqliteStatement = {
  all(...p: unknown[]): unknown[];
  get(...p: unknown[]): unknown;
  run(...p: unknown[]): { lastInsertRowid: number | bigint; changes: number | bigint };
};

async function nodeSqliteAdapter(): Promise<Db> {
  // Variable specifiers keep these Node-only modules out of the Workers bundle.
  const sqliteId = "node:sqlite";
  const fsId = "node:fs";
  const { DatabaseSync } = (await import(/* @vite-ignore */ sqliteId)) as {
    DatabaseSync: new (path: string) => {
      prepare(sql: string): SqliteStatement;
      exec(sql: string): void;
    };
  };
  const { mkdirSync } = (await import(/* @vite-ignore */ fsId)) as {
    mkdirSync: (p: string, o: { recursive: boolean }) => void;
  };
  const dir = process.env["LOCAL_DB_DIR"] ?? ".data";
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(`${dir}/local.sqlite`);
  const norm = (params: unknown[] = []) =>
    params.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : (v ?? null)));
  return {
    async all<T>(sql: string, params?: unknown[]) {
      return db.prepare(sql).all(...norm(params)) as T[];
    },
    async first<T>(sql: string, params?: unknown[]) {
      return (db.prepare(sql).get(...norm(params)) as T | undefined) ?? null;
    },
    async run(sql: string, params?: unknown[]) {
      const res = db.prepare(sql).run(...norm(params));
      return { lastId: Number(res.lastInsertRowid), changes: Number(res.changes) };
    },
  };
}

let dbPromise: Promise<Db> | undefined;

async function connect(): Promise<Db> {
  const d1 = cloudflareEnv()?.DB;
  const db = d1 ? d1Adapter(d1) : await nodeSqliteAdapter();
  for (const statement of SCHEMA) await db.run(statement);
  return db;
}

/** Shared database handle (connection + schema set up once per process/isolate). */
export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = connect().catch((error) => {
      dbPromise = undefined;
      throw error;
    });
  }
  return dbPromise;
}
