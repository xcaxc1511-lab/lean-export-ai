import { businessConfig } from "@/config/business";

/**
 * Build a safe `tel:` href from a phone string, normalizing to E.164 format.
 * Vietnamese numbers are the default:
 *   "0901 234 567"      -> tel:+84901234567
 *   "+84 901 234 567"   -> tel:+84901234567
 *   "84901234567"       -> tel:+84901234567
 *
 * Visible formatting in the UI should use the raw `businessConfig.phone`
 * value; only the `tel:` href needs to be normalized.
 */
export function phoneHref(phone: string = businessConfig.phone): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "tel:";
  // Domestic format (leading 0) -> Vietnam country code.
  if (!phone.trim().startsWith("+") && digits.startsWith("0")) return `tel:+84${digits.slice(1)}`;
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
  // Zalo links use the domestic number (0…); accept +84… too.
  const digits = number.replace(/\D/g, "");
  return `https://zalo.me/${digits.startsWith("84") ? `0${digits.slice(2)}` : digits}`;
}
