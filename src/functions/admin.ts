import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ROLES, ROLE_LABEL } from "@/lib/roles";
import { getDb } from "@/server/db";
import { audit } from "@/server/audit";
import {
  PASSWORD_MIN,
  checkPassword,
  createUserRecord,
  currentUser,
  loginAdmin,
  logoutAdmin,
  needsSetup,
  refreshSession,
  requireAdmin,
  setPassword,
  setupFirstAdmin,
  type AdminUser,
} from "@/server/auth";

const password = z.string().min(PASSWORD_MIN).max(200);
const email = z.string().trim().email().max(200);
const name = z.string().trim().min(1).max(120);
const title = z.string().trim().max(120).optional().default("");

/* ---------------------------------------------------------- sign in */

/** Who is signed in (null if nobody), and whether the first account still has to be created. */
export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  return { user, needsSetup: user ? false : await needsSetup() };
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({ email: z.string().trim().max(200), password: z.string().min(1).max(200) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const res = await loginAdmin(data.email, data.password);
    if (res.ok) await audit(res.user, "login");
    return res.ok ? { ok: true as const } : { ok: false as const, error: res.error };
  });

export const adminSetup = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ setupKey: z.string().min(1).max(200), email, name, password }).parse(data),
  )
  .handler(async ({ data }) => {
    const res = await setupFirstAdmin(data);
    if (res.ok) await audit(res.user, "user.setup", data.email, "Tạo tài khoản quản trị đầu tiên");
    return res.ok ? { ok: true as const } : { ok: false as const, error: res.error };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const user = await currentUser();
  if (user) await audit(user, "logout");
  await logoutAdmin();
  return { ok: true as const };
});

/* ------------------------------------------------------- my account */

export const updateMyProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ name, title }).parse(data))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const db = await getDb();
    await db.run("UPDATE admin_users SET name = ?, title = ?, updated_at = ? WHERE id = ?", [
      data.name,
      data.title || null,
      new Date().toISOString(),
      user.id,
    ]);
    await audit({ ...user, name: data.name }, "account.profile");
    return { ok: true as const };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ current: z.string().min(1).max(200), next: password }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    if (!(await checkPassword(user.id, data.current)))
      return { ok: false as const, error: "wrong_password" };
    await setPassword(user.id, data.next);
    // Other devices are signed out; keep this browser signed in.
    await refreshSession(user.id);
    await audit(user, "account.password");
    return { ok: true as const };
  });

/* ---------------------------------------------------------- accounts */

export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireAdmin("users");
  const db = await getDb();
  const users = await db.all<AdminUser>(
    "SELECT id, email, name, title, role, status, last_login_at, created_at FROM admin_users ORDER BY created_at",
  );
  return { users, meId: me.id };
});

export const createUser = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ email, name, title, role: z.enum(ROLES), password }).parse(data),
  )
  .handler(async ({ data }) => {
    const me = await requireAdmin("users");
    try {
      const user = await createUserRecord(data);
      await audit(me, "user.create", user.email, `Vai trò: ${ROLE_LABEL[user.role]}`);
      return { ok: true as const };
    } catch (error) {
      if (String(error).includes("EMAIL_TAKEN"))
        return { ok: false as const, error: "email_taken" };
      throw error;
    }
  });

/** Admin count excluding one user — used to never remove the last active admin. */
async function otherActiveAdmins(excludeId: number) {
  const db = await getDb();
  const row = await db.first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM admin_users WHERE role = 'admin' AND status = 'active' AND id != ?",
    [excludeId],
  );
  return row?.n ?? 0;
}

export const updateUser = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        name: name.optional(),
        title: z.string().trim().max(120).optional(),
        role: z.enum(ROLES).optional(),
        status: z.enum(["active", "disabled"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const me = await requireAdmin("users");
    const db = await getDb();
    const target = await db.first<AdminUser>(
      "SELECT id, email, name, title, role, status, last_login_at, created_at FROM admin_users WHERE id = ?",
      [data.id],
    );
    if (!target) return { ok: false as const, error: "not_found" };
    const losesAdmin =
      target.role === "admin" &&
      target.status === "active" &&
      ((data.role && data.role !== "admin") || data.status === "disabled");
    if (losesAdmin && (await otherActiveAdmins(target.id)) === 0)
      return { ok: false as const, error: "last_admin" };

    const sets: string[] = [];
    const params: unknown[] = [];
    const set = (column: string, value: unknown) => {
      sets.push(`${column} = ?`);
      params.push(value);
    };
    if (data.name !== undefined) set("name", data.name);
    if (data.title !== undefined) set("title", data.title || null);
    if (data.role !== undefined) set("role", data.role);
    if (data.status !== undefined) {
      sets.push("status = ?");
      params.push(data.status);
      // Disabling signs the account out everywhere.
      if (data.status === "disabled") sets.push("session_version = session_version + 1");
    }
    if (!sets.length) return { ok: true as const };
    sets.push("updated_at = ?");
    params.push(new Date().toISOString(), data.id);
    await db.run(`UPDATE admin_users SET ${sets.join(", ")} WHERE id = ?`, params);

    const changes = [
      data.role && data.role !== target.role
        ? `vai trò ${ROLE_LABEL[target.role]} → ${ROLE_LABEL[data.role]}`
        : "",
      data.status && data.status !== target.status
        ? data.status === "disabled"
          ? "khóa tài khoản"
          : "mở khóa tài khoản"
        : "",
      data.name && data.name !== target.name ? `tên → ${data.name}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    await audit(me, "user.update", target.email, changes || "Cập nhật thông tin");
    return { ok: true as const };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.number().int().positive(), password }).parse(data))
  .handler(async ({ data }) => {
    const me = await requireAdmin("users");
    const db = await getDb();
    const target = await db.first<{ email: string }>("SELECT email FROM admin_users WHERE id = ?", [
      data.id,
    ]);
    if (!target) return { ok: false as const, error: "not_found" };
    await setPassword(data.id, data.password);
    if (data.id === me.id) await refreshSession(me.id);
    await audit(me, "user.password_reset", target.email);
    return { ok: true as const };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }) => {
    const me = await requireAdmin("users");
    if (data.id === me.id) return { ok: false as const, error: "self" };
    const db = await getDb();
    const target = await db.first<AdminUser>(
      "SELECT id, email, name, title, role, status, last_login_at, created_at FROM admin_users WHERE id = ?",
      [data.id],
    );
    if (!target) return { ok: false as const, error: "not_found" };
    if (target.role === "admin" && (await otherActiveAdmins(target.id)) === 0)
      return { ok: false as const, error: "last_admin" };
    await db.run("DELETE FROM admin_users WHERE id = ?", [data.id]);
    await audit(me, "user.delete", target.email);
    return { ok: true as const };
  });

/* ------------------------------------------------------- activity log */

export interface AuditEntry {
  id: number;
  user_id: number | null;
  user_name: string | null;
  action: string;
  target: string | null;
  detail: string | null;
  ip: string | null;
  created_at: string;
}

export const listAudit = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        q: z.string().trim().max(200).optional().default(""),
        group: z
          .enum(["all", "auth", "users", "enquiries", "posts", "chats", "settings"])
          .catch("all"),
        page: z.number().int().min(1).max(1000).optional().default(1),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin("audit");
    const db = await getDb();
    const where: string[] = [];
    const params: unknown[] = [];
    const prefixes: Record<string, string[]> = {
      auth: ["login", "logout", "account."],
      users: ["user."],
      enquiries: ["enquiry."],
      posts: ["post.", "media."],
      chats: ["chat."],
      settings: ["settings."],
    };
    if (data.group !== "all") {
      const list = prefixes[data.group]!;
      where.push(`(${list.map(() => "action LIKE ?").join(" OR ")})`);
      params.push(...list.map((p) => (p.endsWith(".") ? `${p}%` : p)));
    }
    if (data.q) {
      where.push("(user_name LIKE ? OR target LIKE ? OR detail LIKE ?)");
      const like = `%${data.q}%`;
      params.push(like, like, like);
    }
    const PAGE = 50;
    const rows = await db.all<AuditEntry>(
      `SELECT * FROM audit_log ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, PAGE + 1, (data.page - 1) * PAGE],
    );
    return { rows: rows.slice(0, PAGE), hasMore: rows.length > PAGE };
  });
