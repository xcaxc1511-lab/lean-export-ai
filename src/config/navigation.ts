import type { L } from "@/lib/i18n";
import { servicesConfig } from "./services";
import { areasConfig } from "./areas";

export interface NavLink {
  key: string;
  label: L;
  href: string;
  subLinks?: { label: L; href: string }[];
}

export const navigationConfig = {
  mainLinks: [
    { key: "home", label: { en: "Home", vi: "Trang chủ" }, href: "/" },
    { key: "about", label: { en: "About Us", vi: "Về chúng tôi" }, href: "/about" },
    {
      key: "products",
      label: { en: "Products", vi: "Sản phẩm" },
      href: "/services",
      subLinks: servicesConfig.map((service) => ({
        label: service.name,
        href: `/services/${service.slug}`,
      })),
    },
    {
      key: "markets",
      label: { en: "Export Markets", vi: "Thị trường" },
      href: "/areas",
      subLinks: areasConfig.map((area) => ({
        label: area.name,
        href: `/areas/${area.slug}`,
      })),
    },
    { key: "gallery", label: { en: "Gallery", vi: "Hình ảnh" }, href: "/#photo-gallery" },
    { key: "contact", label: { en: "Contact", vi: "Liên hệ" }, href: "/contact" },
  ] as NavLink[],
  cta: {
    label: { en: "Get a Quote", vi: "Nhận báo giá" } as L,
    href: "/get-free-quote",
  },
};

export const productLinks =
  navigationConfig.mainLinks.find((l) => l.key === "products")?.subLinks ?? [];
export const marketLinks =
  navigationConfig.mainLinks.find((l) => l.key === "markets")?.subLinks ?? [];
