import { businessConfig } from "@/config/business";
import { DEFAULT_SETTINGS, applySettings, type SiteSettings } from "@/lib/site-settings";
import { getDb } from "./db";
import { getEnv } from "./env";

/** Saved settings merged over the defaults; cached briefly per isolate. */
let cache: { at: number; value: SiteSettings } | null = null;
const TTL_MS = 30_000;

export async function loadSettings(force = false): Promise<SiteSettings> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const db = await getDb();
  const rows = await db.all<{ key: string; value: string }>("SELECT key, value FROM site_settings");
  const saved = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<SiteSettings>;
  const value: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
    if (typeof saved[key] === "string" && saved[key]) value[key] = saved[key]!;
  }
  cache = { at: Date.now(), value };
  return value;
}

/** Load (cached) settings and apply them to businessConfig for this request. */
export async function ensureSettings(): Promise<SiteSettings> {
  const settings = await loadSettings();
  applySettings(settings);
  return settings;
}

export async function saveSettings(values: SiteSettings) {
  const db = await getDb();
  const at = new Date().toISOString();
  for (const [key, value] of Object.entries(values)) {
    await db.run(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, at],
    );
  }
  cache = null;
  applySettings(await loadSettings(true));
}

/** Notification recipients: admin setting, then the SALES_EMAIL var, then the public email. */
export async function salesRecipients(): Promise<string[]> {
  const settings = await ensureSettings();
  const configured = settings.salesEmails || getEnv("SALES_EMAIL") || businessConfig.email;
  return configured
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
