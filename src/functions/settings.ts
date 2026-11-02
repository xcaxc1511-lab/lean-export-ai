import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { ensureSettings, loadSettings, saveSettings } from "@/server/settings";
import type { PublicSiteSettings, SiteSettings } from "@/lib/site-settings";

/** Public: contact details the website shows (no internal fields). */
export const getPublicSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSiteSettings> => {
    const { salesEmails: _internal, ...pub } = await ensureSettings();
    return pub;
  },
);

export const getAdminSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin("settings");
  return loadSettings(true);
});

const emailList = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => !v || v.split(",").every((e) => z.string().email().safeParse(e.trim()).success),
    "INVALID_EMAILS",
  );

const settingsInput = z.object({
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(200),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .regex(/^[\d\s+()-]*$/),
  zalo: z
    .string()
    .trim()
    .max(30)
    .regex(/^[\d\s+()-]*$/),
  website: z
    .string()
    .trim()
    .max(200)
    .regex(/^https?:\/\/[^\s/]+$/i, "INVALID_WEBSITE"),
  addressVi: z.string().trim().min(3).max(200),
  addressEn: z.string().trim().min(3).max(200),
  salesEmails: emailList,
});

const LABELS: Record<keyof SiteSettings, string> = {
  phone: "điện thoại",
  email: "email",
  whatsapp: "WhatsApp",
  zalo: "Zalo",
  website: "website",
  addressVi: "địa chỉ (VI)",
  addressEn: "địa chỉ (EN)",
  salesEmails: "email nhận thông báo",
};

export const updateSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => settingsInput.parse(data))
  .handler(async ({ data }) => {
    const user = await requireAdmin("settings");
    const before = await loadSettings(true);
    const values = { ...data, website: data.website.replace(/\/+$/, "") };
    await saveSettings(values);
    const changed = (Object.keys(values) as (keyof SiteSettings)[])
      .filter((k) => before[k] !== values[k])
      .map((k) => LABELS[k]);
    if (changed.length) await audit(user, "settings.update", null, `Đổi ${changed.join(", ")}`);
    return { ok: true as const };
  });
