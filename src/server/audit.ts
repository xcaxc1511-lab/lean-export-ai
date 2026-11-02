import { requestIp } from "./auth";
import { getDb } from "./db";

/**
 * Activity log: who did what in the admin, and when. Never throws — a logging
 * failure must not undo the action that was just taken.
 */
export async function audit(
  user: { id: number; name: string } | null,
  action: string,
  target?: string | null,
  detail?: string | null,
): Promise<void> {
  try {
    const db = await getDb();
    await db.run(
      `INSERT INTO audit_log (user_id, user_name, action, target, detail, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user?.id ?? null,
        user?.name ?? null,
        action,
        target ?? null,
        detail ? detail.slice(0, 500) : null,
        requestIp(),
        new Date().toISOString(),
      ],
    );
  } catch (error) {
    console.error("[audit] failed to record", action, error);
  }
}
