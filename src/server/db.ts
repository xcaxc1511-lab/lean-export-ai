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
  // Website chat widget + Voice AI conversations (see src/functions/chat.ts).
  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'chat',
    lang TEXT,
    page TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    ai_paused INTEGER NOT NULL DEFAULT 0,
    unread INTEGER NOT NULL DEFAULT 0,
    enquiry_id INTEGER,
    ip TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions (updated_at)`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id, id)`,
  // Admin accounts (see src/server/auth.ts). session_version bumps log out every device.
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    title TEXT,
    role TEXT NOT NULL DEFAULT 'editor',
    status TEXT NOT NULL DEFAULT 'active',
    password_hash TEXT NOT NULL,
    session_version INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    ip TEXT,
    success INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts (email, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts (ip, created_at)`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    action TEXT NOT NULL,
    target TEXT,
    detail TEXT,
    ip TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at)`,
  // Website settings edited in /admin/settings (see src/server/settings.ts).
  // Uploaded images, served from /media/<id> (see src/routes/media.$file.ts).
  `CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    alt TEXT,
    data BLOB NOT NULL,
    uploaded_by INTEGER,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_created ON media (created_at)`,
  // Saved versions of each post (newest 30 kept).
  `CREATE TABLE IF NOT EXISTS post_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    status TEXT NOT NULL,
    author_name TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_post_revisions_post ON post_revisions (post_id, id)`,
  `CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
];

/**
 * Columns added after a table first shipped. SQLite has no "ADD COLUMN IF NOT
 * EXISTS", so each runs once and "duplicate column" errors are ignored.
 */
const MIGRATIONS = [`ALTER TABLE posts ADD COLUMN author_id INTEGER`];

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
  for (const statement of MIGRATIONS) {
    try {
      await db.run(statement);
    } catch (error) {
      if (!/duplicate column/i.test(String(error))) throw error;
    }
  }
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
