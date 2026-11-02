import { businessConfig } from "@/config/business";

/**
 * Website settings editable in /admin/settings (stored in D1). They are applied
 * onto `businessConfig` on the server and in the browser, so every component
 * that reads the phone, email, chat numbers or address picks up the saved values
 * without code changes.
 */
export interface SiteSettings {
  phone: string;
  email: string;
  whatsapp: string;
  zalo: string;
  website: string;
  addressVi: string;
  addressEn: string;
  /** Who receives new-enquiry / chat-contact emails (comma-separated). Server only. */
  salesEmails: string;
}

export type PublicSiteSettings = Omit<SiteSettings, "salesEmails">;

/** Values shipped in code, used until something is saved in the admin. */
export const DEFAULT_SETTINGS: SiteSettings = {
  phone: businessConfig.phone,
  email: businessConfig.email,
  whatsapp: businessConfig.whatsapp,
  zalo: businessConfig.zalo,
  website: businessConfig.website,
  addressVi: businessConfig.localized.address.vi,
  addressEn: businessConfig.localized.address.en,
  salesEmails: "",
};

/** Template placeholders that must be replaced before going live. */
export function isPlaceholder(key: keyof SiteSettings, value: string): boolean {
  const v = value.trim();
  if (!v) return key !== "salesEmails";
  if (key === "phone") return /^\+?84\s?0{3}/.test(v) || /000 000 000/.test(v);
  if (key === "whatsapp") return /^840{6,}/.test(v.replace(/\D/g, ""));
  if (key === "zalo") return /^0{6,}/.test(v.replace(/\D/g, ""));
  if (key === "email" || key === "salesEmails") return /yourdomain\.com/i.test(v);
  if (key === "website") return /yourwebsite\.com/i.test(v);
  return false;
}

/** Copy saved settings onto the shared business config (idempotent). */
export function applySettings(s: Partial<SiteSettings> | null | undefined) {
  if (!s) return;
  if (s.phone) businessConfig.phone = s.phone;
  if (s.email) businessConfig.email = s.email;
  if (s.whatsapp) businessConfig.whatsapp = s.whatsapp;
  if (s.zalo) businessConfig.zalo = s.zalo;
  if (s.website) businessConfig.website = s.website;
  if (s.addressVi) businessConfig.localized.address.vi = s.addressVi;
  if (s.addressEn) businessConfig.localized.address.en = s.addressEn;
}
