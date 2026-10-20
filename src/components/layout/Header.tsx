import { useState, type FocusEvent } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Phone, Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { phoneHref } from "@/lib/contact";
import { businessConfig } from "@/config/business";
import { navigationConfig, productLinks, marketLinks } from "@/config/navigation";
import { useLang, type Lang } from "@/lib/i18n";

const ui = {
  home: { en: "Home", vi: "Trang chủ" },
  products: { en: "Products", vi: "Sản phẩm" },
  markets: { en: "Export Markets", vi: "Thị trường" },
  about: { en: "About Us", vi: "Về chúng tôi" },
  gallery: { en: "Gallery", vi: "Hình ảnh" },
  contact: { en: "Contact", vi: "Liên hệ" },
  openMenu: { en: "Open menu", vi: "Mở menu" },
  closeMenu: { en: "Close menu", vi: "Đóng menu" },
  switchTo: { en: "Chuyển sang tiếng Việt", vi: "Switch to English" },
};

function FlagVN() {
  return (
    <svg viewBox="0 0 30 20" className="h-3 w-[18px] rounded-[2px]" aria-hidden="true">
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        fill="#FFFF00"
        points="15,4 16.18,7.64 20,7.64 16.91,9.88 18.09,13.52 15,11.28 11.91,13.52 13.09,9.88 10,7.64 13.82,7.64"
      />
    </svg>
  );
}

function FlagGB() {
  return (
    <svg viewBox="0 0 60 30" className="h-3 w-[18px] rounded-[2px]" aria-hidden="true">
      <clipPath id="gb-clip">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="gb-diag">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#gb-clip)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath="url(#gb-diag)"
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

/** Shows the *other* language, like the VCU switcher: click to switch. */
function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  const next: Lang = lang === "en" ? "vi" : "en";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={t(ui.switchTo)}
      title={t(ui.switchTo)}
      className={`flex h-[42px] items-center gap-2 rounded-full border-2 border-white/25 px-4 text-[13px] font-bold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-[#0a0a0a] ${className}`}
    >
      {next === "vi" ? <FlagVN /> : <FlagGB />}
      {next.toUpperCase()}
    </button>
  );
}

/**
 * Hover dropdown (Leandigi style). Picking an item closes the menu right away:
 * focus is dropped and the menu stays shut until the pointer leaves the dropdown,
 * otherwise :hover / :focus-within would keep it open after navigating.
 */
function NavDropdown({
  label,
  active,
  links,
}: {
  label: string;
  active: boolean;
  links: { href: string; label: string }[];
}) {
  const [closed, setClosed] = useState(false);
  const reopen = () => setClosed(false);
  return (
    <div
      className={`nav-dropdown${closed ? " is-closed" : ""}`}
      onMouseLeave={reopen}
      onBlur={(e: FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) reopen();
      }}
    >
      <button
        type="button"
        className={`nav-dropdown-toggle${active ? " active" : ""}`}
        onClick={reopen}
      >
        {label} <ChevronDown className="caret" aria-hidden="true" />
      </button>
      <div className="nav-dropdown-menu">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            onClick={(e) => {
              e.currentTarget.blur();
              setClosed(true);
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const { t } = useLang();
  const pathname = useLocation({ select: (location) => location.pathname });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);

  const toggleMobileSection = (section: string) => {
    setOpenMobileSection(openMobileSection === section ? null : section);
  };

  const services = productLinks;
  const serviceAreas = marketLinks;

  return (
    <header className="w-full bg-brand-ink text-white border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 z-50">
          <img
            src={businessConfig.logoUrl}
            alt={businessConfig.logoAlt || businessConfig.businessName}
            width={1020}
            height={187}
            className="h-8 w-auto sm:h-9 xl:h-11"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <nav className="site-nav">
            <Link to="/" className="nav-link" activeOptions={{ exact: true, includeHash: true }}>
              {t(ui.home)}
            </Link>

            {/* Products Dropdown */}
            {services.length > 0 && (
              <NavDropdown
                label={t(ui.products)}
                active={pathname.startsWith("/services")}
                links={services.map((link) => ({ href: link.href, label: t(link.label) }))}
              />
            )}

            {/* Export Markets Dropdown */}
            {serviceAreas.length > 0 && (
              <NavDropdown
                label={t(ui.markets)}
                active={pathname.startsWith("/areas")}
                links={serviceAreas.map((link) => ({ href: link.href, label: t(link.label) }))}
              />
            )}

            <Link to="/about" className="nav-link">
              {t(ui.about)}
            </Link>
            <Link
              to="/"
              hash="photo-gallery"
              className="nav-link"
              activeOptions={{ exact: true, includeHash: true }}
            >
              {t(ui.gallery)}
            </Link>
            <Link to="/contact" className="nav-link">
              {t(ui.contact)}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <a href={phoneHref()} className="btn btn-outline-light btn-sm hidden xl:inline-flex">
              <Phone className="w-4 h-4" />
              {businessConfig.phone}
            </a>
            <Link to={navigationConfig.cta.href} className="btn btn-primary btn-sm">
              {t(navigationConfig.cta.label)}
            </Link>
          </div>
        </div>

        {/* Mobile: language toggle + menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle className="z-50" />
          <button
            className="text-white p-2 z-50"
            aria-label={isMobileMenuOpen ? t(ui.closeMenu) : t(ui.openMenu)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="lg:hidden absolute top-24 left-0 w-full bg-brand-ink border-b border-white/10 shadow-xl overflow-y-auto max-h-[calc(100vh-6rem)]"
        >
          <nav className="flex flex-col p-4 text-gray-300 font-medium">
            <Link
              to="/"
              className="py-3 border-b border-white/5"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t(ui.home)}
            </Link>

            {/* Mobile Products */}
            {services.length > 0 && (
              <div className="border-b border-white/5">
                <button
                  className="w-full flex items-center justify-between py-3"
                  aria-expanded={openMobileSection === "services"}
                  onClick={() => toggleMobileSection("services")}
                >
                  {t(ui.products)}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openMobileSection === "services" ? "rotate-180" : ""}`}
                  />
                </button>
                {openMobileSection === "services" && (
                  <div className="flex flex-col pl-4 pb-3 space-y-3">
                    {services.map((service) => (
                      <Link
                        key={service.href}
                        to={service.href}
                        className="text-gray-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t(service.label)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Export Markets */}
            {serviceAreas.length > 0 && (
              <div className="border-b border-white/5">
                <button
                  className="w-full flex items-center justify-between py-3"
                  aria-expanded={openMobileSection === "areas"}
                  onClick={() => toggleMobileSection("areas")}
                >
                  {t(ui.markets)}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openMobileSection === "areas" ? "rotate-180" : ""}`}
                  />
                </button>
                {openMobileSection === "areas" && (
                  <div className="flex flex-col pl-4 pb-3 space-y-3">
                    {serviceAreas.map((area) => (
                      <Link
                        key={area.href}
                        to={area.href}
                        className="text-gray-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t(area.label)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Link
              to="/about"
              className="py-3 border-b border-white/5 block"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t(ui.about)}
            </Link>

            <Link
              to="/"
              hash="photo-gallery"
              className="py-3 border-b border-white/5 block"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t(ui.gallery)}
            </Link>
            <Link
              to="/contact"
              className="py-3 border-b border-white/5"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t(ui.contact)}
            </Link>

            <div className="flex flex-col gap-3 mt-6">
              <a href={phoneHref()} className="btn btn-outline-light w-full">
                <Phone className="w-4 h-4" />
                {businessConfig.phone}
              </a>
              <Link
                to={navigationConfig.cta.href}
                className="btn btn-primary w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t(navigationConfig.cta.label)}{" "}
                <span className="btn-arrow">
                  <ArrowRight />
                </span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
