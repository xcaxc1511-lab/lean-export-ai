import type { L } from "@/lib/i18n";

export const businessConfig = {
  /** Enable only after replacing and verifying the master business defaults. */
  publishBusinessSchema: false,
  businessName: "Lean Export AI",
  /** English values below feed SEO meta and structured data; bilingual copy lives in `localized`. */
  tagline: "Vietnamese coffee, sourced at origin and exported with full traceability",
  primaryServiceCategory: "Vietnamese Coffee Export",
  /** Placeholder contact details — replace with the real hotline and sales email. */
  phone: "+84 000 000 000",
  email: "export@yourdomain.com",
  /** Chat apps for the floating contact buttons — leave empty to hide a button. Placeholders: replace before launch. */
  whatsapp: "84000000000",
  zalo: "0000000000",
  /** Production domain — single source of truth for canonical URLs, sitemap and robots.txt. */
  website: "https://yourwebsite.com",
  address: "Chu Prong",
  city: "Gia Lai",
  state: "Vietnam",
  zip: "",
  serviceRadius: "",
  establishedYear: "2022",
  logoUrl: "https://leandigi.pages.dev/assets/logo-white.png",
  logoAlt: "Leandigi — Digital Marketing Tinh Gọn",
  /** Default social preview image for og:image / twitter:image. Replace with the client's own image after cloning. */
  ogImageUrl:
    "https://vibe.filesafe.space/1788233320733500527/assets/414edb03-1ed7-4ce8-929c-97d36a996e0b.png",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  accentColor: "#cccccc",
  businessHours: [
    {
      days: { en: "Mon - Fri", vi: "Thứ 2 - Thứ 6" },
      hours: { en: "7:30 AM - 5:30 PM", vi: "7:30 - 17:30" },
    },
    { days: { en: "Sat", vi: "Thứ 7" }, hours: { en: "7:30 AM - 12:00 PM", vi: "7:30 - 12:00" } },
    { days: { en: "Sun", vi: "Chủ nhật" }, hours: { en: "Closed", vi: "Nghỉ" } },
  ] as { days: L; hours: L }[],
  localized: {
    tagline: {
      en: "Vietnamese coffee, sourced at origin and exported with full traceability",
      vi: "Cà phê Việt Nam — thu mua tận gốc, xuất khẩu minh bạch, truy xuất đầy đủ",
    } as L,
    category: { en: "Vietnamese Coffee Export", vi: "Xuất khẩu cà phê Việt Nam" } as L,
    address: {
      en: "Chu Prong, Gia Lai, Vietnam",
      vi: "Chư Prông, Gia Lai, Việt Nam",
    } as L,
  },
  socialLinks: {
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
  },
  googleBusinessProfileUrl: "",
};
