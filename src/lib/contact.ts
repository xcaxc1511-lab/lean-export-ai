import { businessConfig } from "@/config/business";

/**
 * Build a safe `tel:` href from a phone string, normalizing to E.164 format.
 *
 * Handles all common input formats without producing a malformed double
 * country code:
 *   "(217) 555-1234"   -> tel:+12175551234
 *   "217-555-1234"     -> tel:+12175551234
 *   "2175551234"       -> tel:+12175551234
 *   "+1 217-555-1234"  -> tel:+12175551234
 *
 * Visible formatting in the UI should use the raw `businessConfig.phone`
 * value; only the `tel:` href needs to be normalized.
 */
export function phoneHref(phone: string = businessConfig.phone): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "tel:";
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:+${digits}`;
}

/** Mailto href for the configured (or provided) business email. */
export function emailHref(email: string = businessConfig.email): string {
  return `mailto:${email}`;
}

/** Mailto href with a pre-filled subject (and optional body). */
export function mailtoHref(
  subject: string,
  body?: string,
  email: string = businessConfig.email,
): string {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${email}?${params.join("&")}`;
}

/** WhatsApp chat link (international digits only, e.g. "84901234567"). */
export function whatsappHref(number: string = businessConfig.whatsapp): string {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}

/** Zalo chat link (Vietnamese phone number, e.g. "0901234567"). */
export function zaloHref(number: string = businessConfig.zalo): string {
  return `https://zalo.me/${number.replace(/\D/g, "")}`;
}
