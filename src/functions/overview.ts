import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/server/auth";
import { getDb } from "@/server/db";
import { canAccess } from "@/lib/roles";
import { PUBLISHED_SQL } from "./posts";

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

/** Calendar day (YYYY-MM-DD) in Vietnam time, which is what the team works in. */
const vnDay = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10);

export interface OverviewEnquiry {
  id: number;
  name: string;
  company: string | null;
  country: string | null;
  product: string | null;
  kind: string;
  created_at: string;
}

export interface OverviewChat {
  id: string;
  name: string | null;
  channel: string;
  unread: number;
  last: string | null;
  updated_at: string;
}

export interface OverviewPost {
  id: number;
  title_vi: string;
  published_at: string | null;
  updated_at: string;
}

/** Home page of the admin: what needs doing, plus a few numbers. Sections follow the user's role. */
export const getOverview = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireAdmin();
  const db = await getDb();
  const now = Date.now();

  let enquiries: {
    newCount: number;
    last30: number;
    prev30: number;
    won30: number;
    recent: OverviewEnquiry[];
    /** Last 14 days, oldest first. */
    daily: { day: string; n: number }[];
  } | null = null;
  if (canAccess(user.role, "enquiries")) {
    const counts = await db.first<{ fresh: number; last30: number; prev30: number; won30: number }>(
      `SELECT
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS fresh,
         SUM(CASE WHEN created_at >= ? AND status != 'spam' THEN 1 ELSE 0 END) AS last30,
         SUM(CASE WHEN created_at >= ? AND created_at < ? AND status != 'spam' THEN 1 ELSE 0 END) AS prev30,
         SUM(CASE WHEN created_at >= ? AND status = 'won' THEN 1 ELSE 0 END) AS won30
       FROM enquiries`,
      [iso(now - 30 * DAY), iso(now - 60 * DAY), iso(now - 30 * DAY), iso(now - 30 * DAY)],
    );
    const recent = await db.all<OverviewEnquiry>(
      `SELECT id, name, company, country, product, kind, created_at FROM enquiries
       WHERE status = 'new' ORDER BY created_at DESC LIMIT 6`,
    );
    const rows = await db.all<{ created_at: string }>(
      "SELECT created_at FROM enquiries WHERE created_at >= ? AND status != 'spam'",
      [iso(now - 15 * DAY)],
    );
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const d = vnDay(Date.parse(r.created_at));
      byDay.set(d, (byDay.get(d) ?? 0) + 1);
    }
    const daily = Array.from({ length: 14 }, (_, i) => {
      const day = vnDay(now - (13 - i) * DAY);
      return { day, n: byDay.get(day) ?? 0 };
    });
    enquiries = {
      newCount: counts?.fresh ?? 0,
      last30: counts?.last30 ?? 0,
      prev30: counts?.prev30 ?? 0,
      won30: counts?.won30 ?? 0,
      recent,
      daily,
    };
  }

  let chats: { unreadCount: number; open: number; waiting: OverviewChat[] } | null = null;
  if (canAccess(user.role, "chats")) {
    const c = await db.first<{ unread: number; open: number }>(
      `SELECT SUM(CASE WHEN unread > 0 THEN 1 ELSE 0 END) AS unread,
              SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open
       FROM chat_sessions`,
    );
    const waiting = await db.all<OverviewChat>(
      `SELECT s.id, s.name, s.channel, s.unread, s.updated_at,
              (SELECT content FROM chat_messages m WHERE m.session_id = s.id ORDER BY m.id DESC LIMIT 1) AS last
       FROM chat_sessions s WHERE s.unread > 0 ORDER BY s.updated_at DESC LIMIT 5`,
    );
    chats = { unreadCount: c?.unread ?? 0, open: c?.open ?? 0, waiting };
  }

  let posts: {
    published: number;
    drafts: number;
    upcoming: OverviewPost[];
    myDrafts: OverviewPost[];
  } | null = null;
  if (canAccess(user.role, "posts")) {
    const c = await db.first<{ published: number; drafts: number }>(
      `SELECT SUM(CASE WHEN ${PUBLISHED_SQL} THEN 1 ELSE 0 END) AS published,
              SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts
       FROM posts`,
    );
    const upcoming = await db.all<OverviewPost>(
      `SELECT id, title_vi, published_at, updated_at FROM posts
       WHERE status = 'scheduled' AND published_at > ? ORDER BY published_at LIMIT 5`,
      [iso(now)],
    );
    const myDrafts = await db.all<OverviewPost>(
      `SELECT id, title_vi, published_at, updated_at FROM posts
       WHERE status = 'draft' AND (author_id = ? OR author_id IS NULL)
       ORDER BY updated_at DESC LIMIT 4`,
      [user.id],
    );
    posts = { published: c?.published ?? 0, drafts: c?.drafts ?? 0, upcoming, myDrafts };
  }

  let activity: {
    id: number;
    user_name: string | null;
    action: string;
    target: string | null;
    created_at: string;
  }[] = [];
  let security: { failedLogins24h: number; usersWithout2fa: number } | null = null;
  if (canAccess(user.role, "audit")) {
    activity = await db.all(
      `SELECT id, user_name, action, target, created_at FROM audit_log
       WHERE action NOT IN ('login', 'logout') ORDER BY id DESC LIMIT 6`,
    );
    const failed = await db.first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM login_attempts WHERE success = 0 AND created_at >= ?",
      [iso(now - DAY)],
    );
    const no2fa = await db.first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM admin_users WHERE status = 'active' AND totp_enabled = 0",
    );
    security = { failedLogins24h: failed?.n ?? 0, usersWithout2fa: no2fa?.n ?? 0 };
  }

  return {
    me: { name: user.name, twoFactor: !!user.totp_enabled },
    enquiries,
    chats,
    posts,
    activity,
    security,
  };
});

export type NotificationKind = "enquiry" | "chat" | "post_live" | "post_soon" | "security";

export interface AdminNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  at: string;
  to: "/admin" | "/admin/chats" | "/admin/news" | "/admin/account";
  /** Newer than the user's last look at the bell. */
  unread: boolean;
}

/** Items for the bell in the top bar, newest first, limited to the user's areas. */
export const getNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireAdmin();
  const db = await getDb();
  const now = Date.now();
  const seenRow = await db.first<{ notif_seen_at: string | null }>(
    "SELECT notif_seen_at FROM admin_users WHERE id = ?",
    [user.id],
  );
  // A new account starts with the last day's items unread rather than the whole history.
  const seen = seenRow?.notif_seen_at ?? iso(now - DAY);
  const items: Omit<AdminNotification, "unread">[] = [];

  if (canAccess(user.role, "enquiries")) {
    const rows = await db.all<OverviewEnquiry>(
      `SELECT id, name, company, country, product, kind, created_at FROM enquiries
       WHERE status = 'new' ORDER BY created_at DESC LIMIT 8`,
    );
    for (const e of rows)
      items.push({
        id: `enquiry-${e.id}`,
        kind: "enquiry",
        title: `${e.kind === "quote" ? "Yêu cầu báo giá" : "Liên hệ"} mới từ ${e.name}`,
        detail: [e.company, e.country, e.product].filter(Boolean).join(", "),
        at: e.created_at,
        to: "/admin",
      });
  }

  if (canAccess(user.role, "chats")) {
    const rows = await db.all<OverviewChat>(
      `SELECT s.id, s.name, s.channel, s.unread, s.updated_at,
              (SELECT content FROM chat_messages m WHERE m.session_id = s.id AND m.role = 'visitor' ORDER BY m.id DESC LIMIT 1) AS last
       FROM chat_sessions s WHERE s.unread > 0 ORDER BY s.updated_at DESC LIMIT 5`,
    );
    for (const c of rows)
      items.push({
        id: `chat-${c.id}-${c.updated_at}`,
        kind: "chat",
        title: `${c.name || "Khách"} đang chờ trả lời${c.channel === "voice" ? " (gọi thoại)" : ""}`,
        detail: (c.last ?? "").slice(0, 120),
        at: c.updated_at,
        to: "/admin/chats",
      });
  }

  if (canAccess(user.role, "posts")) {
    const live = await db.all<OverviewPost>(
      `SELECT id, title_vi, published_at, updated_at FROM posts
       WHERE status = 'scheduled' AND published_at <= ? AND published_at > ? ORDER BY published_at DESC`,
      [iso(now), iso(now - 3 * DAY)],
    );
    for (const p of live)
      items.push({
        id: `post-live-${p.id}`,
        kind: "post_live",
        title: "Bài hẹn giờ đã lên website",
        detail: p.title_vi,
        at: p.published_at!,
        to: "/admin/news",
      });
    const soon = await db.all<OverviewPost>(
      `SELECT id, title_vi, published_at, updated_at FROM posts
       WHERE status = 'scheduled' AND published_at > ? AND published_at <= ? ORDER BY published_at`,
      [iso(now), iso(now + DAY)],
    );
    for (const p of soon)
      items.push({
        id: `post-soon-${p.id}`,
        kind: "post_soon",
        title: `Sắp đăng lúc ${new Date(p.published_at!).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}`,
        detail: p.title_vi,
        // Shown when it was scheduled, so it is not "unread" again every refresh.
        at: p.updated_at,
        to: "/admin/news",
      });
  }

  const failed = await db.first<{ n: number; last: string | null }>(
    `SELECT COUNT(*) AS n, MAX(created_at) AS last FROM login_attempts
     WHERE success = 0 AND email = ? AND created_at >= ?`,
    [user.email, iso(now - DAY)],
  );
  if (failed?.n && failed.last)
    items.push({
      id: `security-${failed.last}`,
      kind: "security",
      title: `${failed.n} lần đăng nhập sai vào tài khoản của bạn`,
      detail: user.totp_enabled
        ? "Trong 24 giờ qua. Nếu không phải bạn, hãy đổi mật khẩu."
        : "Trong 24 giờ qua. Nên đổi mật khẩu và bật xác thực 2 lớp.",
      at: failed.last,
      to: "/admin/account",
    });

  items.sort((a, b) => b.at.localeCompare(a.at));
  const list: AdminNotification[] = items.slice(0, 15).map((n) => ({ ...n, unread: n.at > seen }));
  return { items: list, unreadCount: list.filter((n) => n.unread).length };
});

/** The user opened the bell: everything up to now counts as seen. */
export const markNotificationsSeen = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireAdmin();
  const db = await getDb();
  await db.run("UPDATE admin_users SET notif_seen_at = ? WHERE id = ?", [
    new Date().toISOString(),
    user.id,
  ]);
  return { ok: true as const };
});
