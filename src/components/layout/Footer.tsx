import type { ReactNode } from "react";

/*
 * Leandigi global footer — a faithful port of the footer on https://leandigi.pages.dev/.
 * Content, links and layout are shared across all Leandigi projects; edit here to update them.
 */
const SITE = "https://leandigi.pages.dev";

const footerData = {
  homeUrl: "https://leandigi.vn/",
  logo: { src: `${SITE}/assets/logo-white.png`, alt: "Leandigi — Digital Marketing Tinh Gọn" },
  bio: "Đồng hành cùng doanh nghiệp tinh gọn hệ thống tiếp thị số, tối ưu tỷ lệ chuyển đổi và tăng trưởng doanh thu bền vững.",
  bizInfo: [
    { label: "Số giấy chứng nhận ĐKKD:", value: "5901195346" },
    { label: "Ngày cấp:", value: "21/11/2022" },
    { label: "Nơi cấp:", value: "Sở Kế hoạch và Đầu tư tỉnh Gia Lai" },
  ],
  address: "26 Mạc Đĩnh Chi, TT. ChưPrông, Gia Lai, Việt Nam",
  hotline: {
    label: "077 357 1333",
    href: "tel:0773571333",
    hours: "(7h00 - 18h00 • Thứ 2 - Thứ 7)",
  },
  email: { label: "Info@leandigi.vn", href: "mailto:Info@leandigi.vn" },
  services: [
    {
      label: "Thiết kế Landing Page",
      href: "https://landing.leandigi.vn/dich-vu-thiet-ke-landing-page-chuyen-doi",
    },
    { label: "Leandigi AI", href: `${SITE}/leandigi-ai.html` },
    { label: "Tư vấn chiến lược", href: "https://leandigi.vn/tu-van-chien-luoc" },
    { label: "Case Studies & Khách hàng", href: `${SITE}/cases.html` },
    { label: "Về chúng tôi", href: `${SITE}/about.html` },
  ],
  legal: [
    {
      label: "Chính sách dịch vụ",
      href: "https://leandigi.vn/chinh-sach-dich-vu/",
      external: true,
    },
    {
      label: "Điều khoản sử dụng",
      href: "https://leandigi.vn/dieu-khoan-su-dung/",
      external: true,
    },
    { label: "Chính sách bảo mật", href: "https://leandigi.vn/privacy-policy/", external: true },
    { label: "Liên hệ chúng tôi", href: `${SITE}/contact.html` },
    { label: "Cộng đồng Leandigi", href: "https://congdong.leandigi.vn/", external: true },
  ],
  copyright: "© 2025, Leandigi - Digital Marketing tinh gọn. All rights reserved.",
  bottomLinks: [
    { label: "Cộng đồng Leandigi", href: "https://congdong.leandigi.vn/", external: true },
    { label: "Leandigi AI", href: "https://leandigi.ai/leandigi-ai", external: true },
    { label: "Hỗ trợ 24/7", href: `${SITE}/contact.html` },
  ],
};

type FooterLink = { label: string; href: string; external?: boolean };

const externalProps = { target: "_blank", rel: "noopener noreferrer" } as const;

const containerClass = "mx-auto w-full max-w-[1280px] px-[clamp(20px,3vw,32px)]";
const listLinkClass =
  "inline-block py-0.5 text-[0.92rem] leading-[1.4] text-white/[0.72] transition-[color,transform] duration-200 hover:translate-x-[3px] hover:text-primary";

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="relative m-0 mb-[18px] pb-2.5 text-[1.05rem] font-bold tracking-[-0.01em] text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-6 after:rounded-full after:bg-primary after:content-['']">
      {children}
    </h4>
  );
}

function LinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {links.map((link) => (
        <li key={link.label}>
          <a href={link.href} className={listLinkClass} {...(link.external ? externalProps : {})}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function ContactItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 text-[0.9rem] leading-[1.55] text-white/[0.72]">
      <span
        className="mt-0.5 flex flex-[0_0_18px] items-center justify-center text-primary"
        aria-hidden="true"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {icon}
        </svg>
      </span>
      <div>
        <strong className="mb-0.5 block text-[0.82rem] font-bold uppercase tracking-[0.3px] text-white">
          {label}
        </strong>
        {children}
      </div>
    </li>
  );
}

const contactLinkClass =
  "font-semibold text-white/85 transition-colors duration-200 hover:text-primary";

export function Footer() {
  return (
    <footer
      id="site-footer"
      className="relative overflow-hidden border-t border-white/[0.08] bg-brand-footer font-sans text-white"
    >
      {/* Main footer columns */}
      <div className="pt-11 pb-9 sm:pt-[clamp(60px,8vw,90px)] sm:pb-[clamp(48px,6vw,70px)]">
        <div
          className={`${containerClass} grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-9 lg:grid-cols-[1.35fr_1.25fr_1fr_1fr] lg:gap-[clamp(28px,3.5vw,44px)]`}
        >
          {/* Col 1: Brand & business registration */}
          <div className="flex flex-col">
            <a
              href={footerData.homeUrl}
              className="mb-[18px] inline-flex"
              aria-label="Leandigi — Trang chủ"
            >
              <img
                src={footerData.logo.src}
                alt={footerData.logo.alt}
                width={215}
                height={52}
                className="block h-[46px] w-auto max-w-[200px] object-contain sm:h-[54px] sm:max-w-[240px]"
                loading="lazy"
                decoding="async"
              />
            </a>
            <p className="m-0 mb-4 text-[0.92rem] leading-[1.65] text-white/[0.68]">
              {footerData.bio}
            </p>
            <div className="grid gap-1.5 border-t border-white/[0.08] pt-3.5">
              {footerData.bizInfo.map((item) => (
                <p key={item.label} className="m-0 text-[0.82rem] leading-[1.55] text-white/[0.52]">
                  <strong className="font-semibold text-white/[0.78]">{item.label}</strong>{" "}
                  {item.value}
                </p>
              ))}
            </div>
          </div>

          {/* Col 2: Contact info */}
          <div className="flex flex-col">
            <FooterHeading>Thông tin liên hệ</FooterHeading>
            <ul className="m-0 grid list-none gap-3.5 p-0">
              <ContactItem
                label="Địa chỉ:"
                icon={
                  <>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </>
                }
              >
                <span>{footerData.address}</span>
              </ContactItem>
              <ContactItem
                label="Hotline:"
                icon={
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                }
              >
                <a href={footerData.hotline.href} className={contactLinkClass}>
                  {footerData.hotline.label}
                </a>
                <span className="mt-0.5 block text-[0.8rem] text-white/45">
                  {footerData.hotline.hours}
                </span>
              </ContactItem>
              <ContactItem
                label="Email:"
                icon={
                  <>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </>
                }
              >
                <a href={footerData.email.href} className={contactLinkClass}>
                  {footerData.email.label}
                </a>
              </ContactItem>
            </ul>
          </div>

          {/* Col 3: Services & navigation */}
          <div className="flex flex-col">
            <FooterHeading>Dịch vụ &amp; Giải pháp</FooterHeading>
            <LinkList links={footerData.services} />
          </div>

          {/* Col 4: Policies & legal */}
          <div className="flex flex-col">
            <FooterHeading>Chính sách &amp; Pháp lý</FooterHeading>
            <LinkList links={footerData.legal} />
          </div>
        </div>
      </div>

      {/* Bottom bar: copyright */}
      <div className="border-t border-white/[0.08] bg-black/[0.22] pt-6 pb-7">
        <div
          className={`${containerClass} flex flex-col flex-wrap items-center justify-between gap-3 text-center sm:flex-row sm:gap-4 sm:text-left`}
        >
          <p className="m-0 text-[0.86rem] text-white/50">{footerData.copyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[0.86rem]">
            {footerData.bottomLinks.map((link, i) => (
              <span key={link.label} className="contents">
                {i > 0 && <span className="text-[0.7rem] text-white/20">•</span>}
                <a
                  href={link.href}
                  className="text-white/[0.62] transition-colors duration-200 hover:text-primary"
                  {...(link.external ? externalProps : {})}
                >
                  {link.label}
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
