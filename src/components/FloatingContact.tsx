import { Phone } from "lucide-react";
import type { ReactNode } from "react";
import { businessConfig } from "@/config/business";
import { phoneHref, whatsappHref, zaloHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";

const labels = {
  whatsapp: { en: "Chat on WhatsApp", vi: "Chat WhatsApp" },
  zalo: { en: "Chat on Zalo", vi: "Chat Zalo" },
  call: { en: "Call us", vi: "Gọi ngay" },
};

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.02c0-5.22 4.25-9.46 9.48-9.46 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.46 9.46zm8.05-17.52A11.32 11.32 0 0 0 12.05.65C5.78.65.67 5.75.67 12.03c0 2 .52 3.96 1.52 5.69L.57 23.65l6.07-1.59a11.35 11.35 0 0 0 5.41 1.38h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.34-8.06z" />
    </svg>
  );
}

function FloatingButton({
  href,
  label,
  className,
  external,
  children,
}: {
  href: string;
  label: string;
  className: string;
  external?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-full shadow-lg shadow-black/20 transition-transform hover:scale-105 md:h-13 md:w-13 ${className}`}
    >
      {children}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
        {label}
      </span>
    </a>
  );
}

/** Floating quick-contact buttons (WhatsApp, Zalo, phone), like the VCU site. */
export function FloatingContact() {
  const { t } = useLang();
  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-3 md:bottom-8 md:right-6">
      {businessConfig.whatsapp && (
        <FloatingButton
          href={whatsappHref()}
          label={t(labels.whatsapp)}
          external
          className="bg-[#25D366] text-white"
        >
          <WhatsAppIcon />
        </FloatingButton>
      )}
      {businessConfig.zalo && (
        <FloatingButton
          href={zaloHref()}
          label={t(labels.zalo)}
          external
          className="bg-[#0068FF] text-white"
        >
          <span className="text-[13px] font-bold tracking-tight">Zalo</span>
        </FloatingButton>
      )}
      <FloatingButton
        href={phoneHref()}
        label={t(labels.call)}
        className="bg-primary text-primary-foreground"
      >
        <Phone className="h-5 w-5" />
      </FloatingButton>
    </div>
  );
}
