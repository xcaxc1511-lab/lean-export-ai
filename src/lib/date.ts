/** Long, localised date for article bylines ("21 October 2026" / "21 tháng 10, 2026"). */
export function formatPostDate(iso: string | null, lang: "en" | "vi"): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
