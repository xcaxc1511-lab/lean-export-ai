import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { requireAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { askAssistant, assistantConfigured, type AssistantTurn } from "@/server/assistant";
import { emailLayout, escapeHtml, sendMail } from "@/server/email";
import { businessConfig } from "@/config/business";

/**
 * Website chat widget + Voice AI: visitors talk to the AI assistant, staff can
 * read every conversation in /admin and take over (which pauses the AI).
 */

export type ChatRole = "visitor" | "ai" | "agent";
export type ChatChannel = "chat" | "voice";

export interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface ChatSessionRow {
  id: string;
  channel: ChatChannel;
  lang: string | null;
  page: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: "open" | "closed";
  ai_paused: number;
  unread: number;
  enquiry_id: number | null;
  created_at: string;
  updated_at: string;
}

const LIMITS = {
  /** Visitor messages per IP in the window. */
  perIp: 30,
  /** New conversations per IP in the window. */
  sessionsPerIp: 8,
  windowMinutes: 10,
  /** Visitor messages in one conversation. */
  perSession: 80,
  /** Turns sent to the model (most recent). */
  history: 24,
};

const HANDOFF = {
  vi: "Cảm ơn bạn! Đội ngũ Lean Export đã nhận được tin nhắn và sẽ phản hồi sớm. Bạn có thể để lại email hoặc số điện thoại để chúng tôi liên hệ lại nhé.",
  en: "Thanks for your message! The Lean Export team has received it and will get right back to you. Feel free to leave your email or phone number so we can follow up.",
};

const now = () => new Date().toISOString();

const clientIp = () =>
  getRequestHeader("cf-connecting-ip") ?? getRequestIP({ xForwardedFor: true }) ?? null;

function randomToken(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  let bin = "";
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Load a conversation only if the visitor's secret token matches. */
async function ownedSession(sessionId: string, token: string) {
  const db = await getDb();
  const row = await db.first<ChatSessionRow & { token_hash: string; ip: string | null }>(
    "SELECT * FROM chat_sessions WHERE id = ?",
    [sessionId],
  );
  if (!row || row.token_hash !== (await sha256(token))) return null;
  return row;
}

async function messagesAfter(sessionId: string, afterId: number) {
  const db = await getDb();
  return db.all<ChatMessage>(
    "SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? AND id > ? ORDER BY id",
    [sessionId, afterId],
  );
}

async function addMessage(sessionId: string, role: ChatRole, content: string) {
  const db = await getDb();
  const at = now();
  const { lastId } = await db.run(
    "INSERT INTO chat_messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
    [sessionId, role, content, at],
  );
  await db.run(
    `UPDATE chat_sessions SET updated_at = ?${role === "visitor" ? ", unread = unread + 1, status = 'open'" : ""} WHERE id = ?`,
    [at, sessionId],
  );
  return lastId;
}

/* ------------------------------------------------------------- visitor */

const lang = z.enum(["vi", "en"]).catch("en");

const sendInput = z.object({
  sessionId: z.string().max(64).optional(),
  token: z.string().max(128).optional(),
  message: z.string().trim().min(1).max(2000),
  channel: z.enum(["chat", "voice"]).catch("chat"),
  lang,
  page: z.string().max(300).optional().default(""),
  /** Last message id the widget already shows. */
  afterId: z.number().int().min(0).optional().default(0),
});

/** Public: send a visitor message; returns the new messages (incl. the AI reply). */
export const sendChatMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => sendInput.parse(data))
  .handler(async ({ data }) => {
    const db = await getDb();
    const ip = clientIp();
    const since = new Date(Date.now() - LIMITS.windowMinutes * 60_000).toISOString();

    if (ip) {
      const recent = await db.first<{ n: number }>(
        `SELECT COUNT(*) AS n FROM chat_messages m JOIN chat_sessions s ON s.id = m.session_id
         WHERE s.ip = ? AND m.role = 'visitor' AND m.created_at > ?`,
        [ip, since],
      );
      if ((recent?.n ?? 0) >= LIMITS.perIp) throw new Error("RATE_LIMITED");
    }

    let session =
      data.sessionId && data.token ? await ownedSession(data.sessionId, data.token) : null;
    let newToken: string | undefined;

    if (!session) {
      if (ip) {
        const fresh = await db.first<{ n: number }>(
          "SELECT COUNT(*) AS n FROM chat_sessions WHERE ip = ? AND created_at > ?",
          [ip, since],
        );
        if ((fresh?.n ?? 0) >= LIMITS.sessionsPerIp) throw new Error("RATE_LIMITED");
      }
      const id = crypto.randomUUID();
      newToken = randomToken();
      const at = now();
      await db.run(
        `INSERT INTO chat_sessions (id, token_hash, channel, lang, page, ip, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, await sha256(newToken), data.channel, data.lang, data.page || null, ip, at, at],
      );
      session = await db.first("SELECT * FROM chat_sessions WHERE id = ?", [id]);
      if (!session) throw new Error("SESSION_FAILED");
    }

    const count = await db.first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM chat_messages WHERE session_id = ? AND role = 'visitor'",
      [session.id],
    );
    if ((count?.n ?? 0) >= LIMITS.perSession) throw new Error("SESSION_FULL");

    await addMessage(session.id, "visitor", data.message);

    let reply: string | null = null;
    if (!session.ai_paused) {
      const history = await db.all<AssistantTurn>(
        `SELECT role, content FROM (
           SELECT id, role, content FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT ?
         ) ORDER BY id`,
        [session.id, LIMITS.history],
      );
      reply = await askAssistant(history, { channel: data.channel });
      if (reply) {
        await addMessage(session.id, "ai", reply);
      } else if (data.channel === "chat") {
        // No AI available: acknowledge once, a person takes it from here.
        const answered = await db.first<{ n: number }>(
          "SELECT COUNT(*) AS n FROM chat_messages WHERE session_id = ? AND role != 'visitor'",
          [session.id],
        );
        if (!answered?.n) await addMessage(session.id, "ai", HANDOFF[data.lang]);
      }
    }

    return {
      sessionId: session.id,
      ...(newToken && { token: newToken }),
      reply,
      aiAvailable: assistantConfigured() && !session.ai_paused,
      hasContact: Boolean(session.email || session.phone),
      messages: await messagesAfter(session.id, data.afterId),
    };
  });

/** Public: new messages since `afterId` (staff replies arrive this way). */
export const pollChat = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        sessionId: z.string().max(64),
        token: z.string().max(128),
        afterId: z.number().int().min(0),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await ownedSession(data.sessionId, data.token);
    if (!session) return { ok: false as const, messages: [] as ChatMessage[] };
    return {
      ok: true as const,
      hasContact: Boolean(session.email || session.phone),
      messages: await messagesAfter(session.id, data.afterId),
    };
  });

/** Public: whether the AI assistant is switched on (Voice AI needs it). */
export const getAssistantStatus = createServerFn({ method: "GET" }).handler(async () => ({
  aiAvailable: assistantConfigured(),
}));

const contactInput = z
  .object({
    sessionId: z.string().max(64),
    token: z.string().max(128),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().default(""),
  })
  .refine((d) => d.email || d.phone, { message: "EMAIL_OR_PHONE" });

/** Public: visitor leaves contact details — saved on the chat and as an enquiry. */
export const saveChatContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => contactInput.parse(data))
  .handler(async ({ data }) => {
    const session = await ownedSession(data.sessionId, data.token);
    if (!session) throw new Error("NOT_FOUND");
    const db = await getDb();
    const email = data.email || "";

    const transcript = await db.all<ChatMessage>(
      "SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY id LIMIT 40",
      [session.id],
    );
    const summary = transcript
      .map(
        (m) =>
          `${m.role === "visitor" ? "Khách" : m.role === "ai" ? "AI" : "Nhân viên"}: ${m.content}`,
      )
      .join("\n")
      .slice(0, 4500);

    let enquiryId = session.enquiry_id;
    if (!enquiryId) {
      const res = await db.run(
        `INSERT INTO enquiries (created_at, kind, name, email, message, lang, source_page, ip)
         VALUES (?, 'contact', ?, ?, ?, ?, ?, ?)`,
        [
          now(),
          data.name,
          email || `(${data.phone})`,
          `${session.channel === "voice" ? "Voice AI" : "Chat"} — SĐT: ${data.phone || "—"}\n\n${summary}`,
          session.lang,
          `${session.channel}:${session.page ?? ""}`,
          session.ip ?? null,
        ],
      );
      enquiryId = res.lastId;
    }
    await db.run(
      "UPDATE chat_sessions SET name = ?, email = ?, phone = ?, enquiry_id = ?, updated_at = ? WHERE id = ?",
      [data.name, email || null, data.phone || null, enquiryId, now(), session.id],
    );

    const to = (getEnv("SALES_EMAIL") ?? businessConfig.email)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await sendMail({
      to,
      subject: `[Chat] ${data.name} để lại liên hệ (#${enquiryId})`,
      replyTo: email || undefined,
      text: `${data.name}
${email || "—"}
${data.phone || "—"}

${summary}`,
      html: emailLayout(
        "Khách để lại liên hệ qua chat",
        `<p><b>${escapeHtml(data.name)}</b><br>${escapeHtml(email || "—")}<br>${escapeHtml(data.phone || "—")}</p>
         <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(summary)}</pre>`,
      ),
    });
    return { ok: true as const };
  });

/* --------------------------------------------------------------- admin */

export const listChats = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        filter: z.enum(["all", "unread", "chat", "voice"]).catch("all"),
        q: z.string().trim().max(200).optional().default(""),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin("chats");
    const db = await getDb();
    const where: string[] = [];
    const params: unknown[] = [];
    if (data.filter === "unread") where.push("s.unread > 0");
    if (data.filter === "chat" || data.filter === "voice") {
      where.push("s.channel = ?");
      params.push(data.filter);
    }
    if (data.q) {
      where.push(
        "(s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR EXISTS (SELECT 1 FROM chat_messages x WHERE x.session_id = s.id AND x.content LIKE ?))",
      );
      const like = `%${data.q}%`;
      params.push(like, like, like, like);
    }
    const rows = await db.all<
      ChatSessionRow & { last: string | null; last_role: ChatRole | null; total: number }
    >(
      `SELECT s.id, s.channel, s.lang, s.page, s.name, s.email, s.phone, s.status, s.ai_paused, s.unread,
              s.enquiry_id, s.created_at, s.updated_at,
              (SELECT content FROM chat_messages m WHERE m.session_id = s.id ORDER BY m.id DESC LIMIT 1) AS last,
              (SELECT role FROM chat_messages m WHERE m.session_id = s.id ORDER BY m.id DESC LIMIT 1) AS last_role,
              (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.id) AS total
       FROM chat_sessions s ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY s.updated_at DESC LIMIT 200`,
      params,
    );
    const unread = await db.first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM chat_sessions WHERE unread > 0",
    );
    return { rows, unreadCount: unread?.n ?? 0, aiAvailable: assistantConfigured() };
  });

export const getChat = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ id: z.string().max(64) }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin("chats");
    const db = await getDb();
    const session = await db.first<ChatSessionRow>(
      `SELECT id, channel, lang, page, name, email, phone, status, ai_paused, unread, enquiry_id, created_at, updated_at
       FROM chat_sessions WHERE id = ?`,
      [data.id],
    );
    if (!session) return null;
    if (session.unread) await db.run("UPDATE chat_sessions SET unread = 0 WHERE id = ?", [data.id]);
    return { session: { ...session, unread: 0 }, messages: await messagesAfter(data.id, 0) };
  });

/** Admin: staff reply. Taking over pauses the AI for this conversation. */
export const replyChat = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().max(64), content: z.string().trim().min(1).max(4000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin("chats");
    const db = await getDb();
    await addMessage(data.id, "agent", data.content);
    await db.run("UPDATE chat_sessions SET ai_paused = 1, unread = 0 WHERE id = ?", [data.id]);
    await audit(user, "chat.reply", data.id.slice(0, 8), data.content.slice(0, 120));
    return { ok: true as const };
  });

export const updateChat = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().max(64),
        aiPaused: z.boolean().optional(),
        status: z.enum(["open", "closed"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin("chats");
    const db = await getDb();
    if (data.aiPaused !== undefined)
      await audit(user, "chat.ai", data.id.slice(0, 8), data.aiPaused ? "tắt AI" : "bật AI");
    if (data.aiPaused !== undefined)
      await db.run("UPDATE chat_sessions SET ai_paused = ? WHERE id = ?", [
        data.aiPaused ? 1 : 0,
        data.id,
      ]);
    if (data.status)
      await db.run("UPDATE chat_sessions SET status = ? WHERE id = ?", [data.status, data.id]);
    return { ok: true as const };
  });

export const deleteChat = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.string().max(64) }).parse(data))
  .handler(async ({ data }) => {
    const user = await requireAdmin("chats");
    const db = await getDb();
    await db.run("DELETE FROM chat_messages WHERE session_id = ?", [data.id]);
    await audit(user, "chat.delete", data.id.slice(0, 8));
    await db.run("DELETE FROM chat_sessions WHERE id = ?", [data.id]);
    return { ok: true as const };
  });
