import { getEnv } from "./env";

interface Mail {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | undefined;
}

/**
 * Send an email through Resend (https://resend.com).
 * Needs RESEND_API_KEY and MAIL_FROM (an address on a domain verified in Resend).
 * Returns false — never throws — when email is not configured or the API fails,
 * so a mail outage can't lose an enquiry that is already saved.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("MAIL_FROM");
  if (!apiKey || !from) {
    console.warn("[email] RESEND_API_KEY / MAIL_FROM not set — skipping:", mail.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(mail.to) ? mail.to : [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo && { reply_to: mail.replyTo }),
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Resend request failed", error);
    return false;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Simple, inline-styled email layout that renders well in common clients. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#13182c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#13182c;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Lean <span style="color:#f5cf5a">Export</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
${bodyHtml}
</td></tr></table></td></tr></table></body></html>`;
}
