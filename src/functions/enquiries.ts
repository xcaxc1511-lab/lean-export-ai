import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { businessConfig } from "@/config/business";
import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { requireAdmin } from "@/server/auth";
import { emailLayout, escapeHtml, sendMail } from "@/server/email";

export const ENQUIRY_STATUSES = ["new", "contacted", "quoted", "won", "lost", "spam"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** The admin list's unfiltered view (shared by the page and the sidebar badge). */
export const DEFAULT_ENQUIRY_FILTERS = { status: "all", kind: "all", q: "" } as const;

export interface Enquiry {
  id: number;
  created_at: string;
  kind: "contact" | "quote";
  name: string;
  company: string | null;
  email: string;
  country: string | null;
  product: string | null;
  volume: string | null;
  incoterm: string | null;
  samples: number;
  message: string | null;
  lang: string | null;
  source_page: string | null;
  status: EnquiryStatus;
  notes: string | null;
}

const text = (max: number) => z.string().trim().max(max).optional().default("");

const enquiryInput = z.object({
  kind: z.enum(["contact", "quote"]),
  name: z.string().trim().min(1).max(120),
  company: text(160),
  email: z.string().trim().email().max(200),
  country: text(160),
  product: text(160),
  volume: text(160),
  incoterm: text(40),
  samples: z.boolean().optional().default(false),
  message: text(5000),
  lang: z.enum(["en", "vi"]).optional().default("en"),
  sourcePage: text(300),
  /** Honeypot — real users never fill this hidden field. */
  website: z.string().optional().default(""),
});

export type EnquiryInput = z.input<typeof enquiryInput>;

const RATE_LIMIT = { windowMinutes: 10, max: 5 };

function salesRecipients(): string[] {
  const configured = getEnv("SALES_EMAIL") ?? businessConfig.email;
  return configured
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function detailRows(e: z.output<typeof enquiryInput>) {
  return [
    ["Type", e.kind === "quote" ? "Quote request" : "Contact enquiry"],
    ["Name", e.name],
    ["Company", e.company],
    ["Email", e.email],
    ["Country / port", e.country],
    ["Product", e.product],
    ["Volume", e.volume],
    ...(e.kind === "quote"
      ? [
          ["Incoterm", e.incoterm],
          ["Samples first", e.samples ? "Yes" : "No"],
        ]
      : []),
    ["Language", e.lang.toUpperCase()],
    ["Page", e.sourcePage],
  ].filter(([, v]) => v) as [string, string][];
}

async function notify(id: number, e: z.output<typeof enquiryInput>) {
  const rows = detailRows(e);
  const table = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#686a75;white-space:nowrap">${k}</td><td style="padding:6px 0;font-weight:bold">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const message = e.message
    ? `<p style="margin:16px 0 0;padding:14px;background:#f7f7f4;border-radius:8px;white-space:pre-wrap">${escapeHtml(e.message)}</p>`
    : "";
  const label = e.kind === "quote" ? "quote request" : "enquiry";

  const toSales = sendMail({
    to: salesRecipients(),
    replyTo: e.email,
    subject: `New ${label} #${id} — ${e.company || e.name}${e.product ? ` · ${e.product}` : ""}`,
    html: emailLayout(`New ${label} #${id}`, `<table>${table}</table>${message}`),
    text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${e.message}`,
  });

  const vi = e.lang === "vi";
  const confirmTitle = vi
    ? "Chúng tôi đã nhận được yêu cầu của bạn"
    : "We've received your request";
  const confirmBody = vi
    ? `<p>Xin chào ${escapeHtml(e.name)},</p><p>Cảm ơn bạn đã liên hệ ${escapeHtml(businessConfig.businessName)}. Đội ngũ xuất khẩu sẽ phản hồi trong vòng một ngày làm việc.</p><p>Mã yêu cầu của bạn: <b>#${id}</b></p>`
    : `<p>Hi ${escapeHtml(e.name)},</p><p>Thank you for contacting ${escapeHtml(businessConfig.businessName)}. Our export team will get back to you within one business day.</p><p>Your reference: <b>#${id}</b></p>`;
  const toCustomer = sendMail({
    to: e.email,
    replyTo: salesRecipients()[0],
    subject: `${confirmTitle} (#${id})`,
    html: emailLayout(confirmTitle, confirmBody),
    text: confirmBody.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n"),
  });

  await Promise.all([toSales, toCustomer]);
}

/** Public: save an enquiry from the contact / quote forms. */
export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => enquiryInput.parse(data))
  .handler(async ({ data }) => {
    // Bots fill the honeypot — pretend success, store nothing.
    if (data.website) return { ok: true as const, id: 0 };

    const db = await getDb();
    const ip =
      getRequestHeader("cf-connecting-ip") ?? getRequestIP({ xForwardedFor: true }) ?? null;
    if (ip) {
      const since = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60_000).toISOString();
      const recent = await db.first<{ n: number }>(
        "SELECT COUNT(*) AS n FROM enquiries WHERE ip = ? AND created_at > ?",
        [ip, since],
      );
      if ((recent?.n ?? 0) >= RATE_LIMIT.max) {
        throw new Error("RATE_LIMITED");
      }
    }

    const { lastId } = await db.run(
      `INSERT INTO enquiries
        (created_at, kind, name, company, email, country, product, volume, incoterm, samples, message, lang, source_page, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        new Date().toISOString(),
        data.kind,
        data.name,
        data.company || null,
        data.email,
        data.country || null,
        data.product || null,
        data.volume || null,
        data.incoterm || null,
        data.samples ? 1 : 0,
        data.message || null,
        data.lang,
        data.sourcePage || null,
        ip,
      ],
    );

    await notify(lastId, data);
    return { ok: true as const, id: lastId };
  });

export const listInput = z.object({
  status: z
    .enum(["all", ...ENQUIRY_STATUSES])
    .optional()
    .default("all"),
  kind: z.enum(["all", "contact", "quote"]).optional().default("all"),
  q: z.string().trim().max(200).optional().default(""),
});

export function filterSql(f: z.output<typeof listInput>) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.status !== "all") {
    where.push("status = ?");
    params.push(f.status);
  }
  if (f.kind !== "all") {
    where.push("kind = ?");
    params.push(f.kind);
  }
  if (f.q) {
    where.push(
      "(name LIKE ? OR company LIKE ? OR email LIKE ? OR country LIKE ? OR product LIKE ? OR message LIKE ?)",
    );
    const like = `%${f.q}%`;
    params.push(like, like, like, like, like, like);
  }
  return { clause: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

/** Admin: list enquiries (newest first) plus per-status counts. */
export const listEnquiries = createServerFn({ method: "GET" })
  .validator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    const { clause, params } = filterSql(data);
    const rows = await db.all<Enquiry>(
      `SELECT id, created_at, kind, name, company, email, country, product, volume, incoterm,
              samples, message, lang, source_page, status, notes
       FROM enquiries ${clause} ORDER BY created_at DESC LIMIT 500`,
      params,
    );
    const counts = await db.all<{ status: string; n: number }>(
      "SELECT status, COUNT(*) AS n FROM enquiries GROUP BY status",
    );
    return { rows, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) };
  });

/** Admin: change status / internal notes. */
export const updateEnquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        status: z.enum(ENQUIRY_STATUSES).optional(),
        notes: z.string().max(5000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.status) {
      sets.push("status = ?");
      params.push(data.status);
    }
    if (data.notes !== undefined) {
      sets.push("notes = ?");
      params.push(data.notes);
    }
    if (sets.length)
      await db.run(`UPDATE enquiries SET ${sets.join(", ")} WHERE id = ?`, [...params, data.id]);
    return { ok: true as const };
  });

/** Admin: permanently delete an enquiry (e.g. spam). */
export const deleteEnquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    await db.run("DELETE FROM enquiries WHERE id = ?", [data.id]);
    return { ok: true as const };
  });
