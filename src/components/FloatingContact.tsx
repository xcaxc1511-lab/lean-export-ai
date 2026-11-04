import { useEffect, useRef, useState } from "react";
import { AudioLines, Plus } from "lucide-react";
import { businessConfig } from "@/config/business";
import { openVoice, voiceEnabled } from "@/lib/chat-events";
import { zaloHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";

const labels = {
  zalo: { en: "Chat on Zalo", vi: "Chat Zalo" },
  voice: { en: "Ask our AI by voice", vi: "Hỏi AI bằng giọng nói" },
  more: { en: "More ways to contact us", vi: "Thêm cách liên hệ" },
  less: { en: "Hide contact options", vi: "Thu gọn" },
};

/** Same size as the chat launcher on phones (48px); a touch smaller than it on desktop. */
const BUTTON =
  "group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg shadow-black/20 transition-transform hover:scale-105 md:h-13 md:w-13";

/** Name beside the button: on hover on desktop, always while the phone menu is open. */
function Label({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white shadow-lg md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
      {text}
    </span>
  );
}

/**
 * Floating buttons above the chat launcher: Voice AI first, then Zalo. On
 * phones they fold behind one button so they don't cover the page.
 */
export function FloatingContact() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const items = [
    voiceEnabled() && (
      <button
        key="voice"
        type="button"
        onClick={() => {
          setOpen(false);
          openVoice();
        }}
        aria-label={t(labels.voice)}
        className={`${BUTTON} bg-ld-navy text-ld-gold ring-2 ring-ld-gold/60`}
      >
        <AudioLines className="h-5 w-5 md:h-6 md:w-6" />
        <Label text={t(labels.voice)} />
      </button>
    ),
    businessConfig.zalo && (
      <a
        key="zalo"
        href={zaloHref()}
        aria-label={t(labels.zalo)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpen(false)}
        className={`${BUTTON} bg-[#0068FF] text-white`}
      >
        <span className="text-[13px] font-bold tracking-tight">Zalo</span>
        <Label text={t(labels.zalo)} />
      </a>
    ),
  ].filter(Boolean);

  // Tap anywhere else to fold the phone menu again.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  if (items.length === 0) return null;
  return (
    <div
      ref={rootRef}
      className="fixed bottom-20 right-4 z-40 flex flex-col items-center gap-3 md:bottom-[6.25rem] md:right-[1.625rem]"
    >
      <div
        id="floating-contact-items"
        className={`flex-col items-center gap-3 md:flex ${open ? "flex" : "hidden"}`}
      >
        {items}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="floating-contact-items"
        aria-label={open ? t(labels.less) : t(labels.more)}
        className={`${BUTTON} bg-ld-navy text-white ring-2 ring-white/70 md:hidden`}
      >
        <Plus className={`h-6 w-6 transition-transform ${open ? "rotate-45" : ""}`} />
      </button>
    </div>
  );
}
