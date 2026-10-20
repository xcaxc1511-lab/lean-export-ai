import { useState } from "react";
import { Link } from "@tanstack/react-router";
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

export function Header() {
  const { t } = useLang();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);

  const toggleMobileSection = (section: string) => {
    setOpenMobileSection(openMobileSection === section ? null : section);
  };

  const services = productLinks;
  const serviceAreas = marketLinks;

  return (
    <header className="w-full bg-brand-ink text-white border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 z-50">
          <img
            src={businessConfig.logoUrl}
            alt={businessConfig.logoAlt || businessConfig.businessName}
            width={215}
            height={52}
            className="h-10 w-auto lg:h-12"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link to="/" className="hover:text-primary transition-colors">
              {t(ui.home)}
            </Link>

            {/* Products Dropdown */}
            {services.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-primary transition-colors py-8">
                  {t(ui.products)} <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 w-64 bg-brand-ink-2 border border-white/10 rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 flex flex-col py-2 max-h-[70vh] overflow-y-auto">
                  {services.map((service) => (
                    <Link
                      key={service.href}
                      to={service.href}
                      className="px-4 py-2 hover:bg-white/5 hover:text-primary transition-colors"
                    >
                      {t(service.label)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Export Markets Dropdown */}
            {serviceAreas.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-primary transition-colors py-8">
                  {t(ui.markets)} <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 w-56 bg-brand-ink-2 border border-white/10 rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 flex flex-col py-2 max-h-[70vh] overflow-y-auto">
                  {serviceAreas.map((area) => (
                    <Link
                      key={area.href}
                      to={area.href}
                      className="px-4 py-2 hover:bg-white/5 hover:text-primary transition-colors"
                    >
                      {t(area.label)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link to="/about" className="hover:text-primary transition-colors">
              {t(ui.about)}
            </Link>

            <Link to="/" hash="photo-gallery" className="hover:text-primary transition-colors">
              {t(ui.gallery)}
            </Link>
            <Link to="/contact" className="hover:text-primary transition-colors">
              {t(ui.contact)}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={phoneHref()}
              className="btn btn-outline-light btn-sm hidden xl:inline-flex"
            >
              <Phone className="w-4 h-4" />
              {businessConfig.phone}
            </a>
            <LanguageToggle />
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
              <a
                href={phoneHref()}
                className="btn btn-outline-light w-full"
              >
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
