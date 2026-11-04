import { useEffect, useRef, useState } from "react";
import { AudioLines, X } from "lucide-react";
import { integrationsConfig } from "@/config/integrations";
import { OPEN_CHAT_EVENT, OPEN_VOICE_EVENT } from "@/lib/chat-events";
import { useLang } from "@/lib/i18n";

const LOADER_SRC = "https://widgets.leadconnectorhq.com/loader.js";
const RESOURCES_URL = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";

const copy = {
  label: { en: "Voice AI assistant", vi: "Trợ lý AI giọng nói" },
  title: { en: "Ask us by voice", vi: "Hỏi nhanh bằng giọng nói" },
  badge: { en: "Voice AI", vi: "Voice AI" },
  close: { en: "Close", vi: "Đóng" },
};

/**
 * Voice AI popup, opened by the floating voice button or the hero button. The
 * call itself is GHL's Voice AI widget (LeadConnector), embedded in the panel:
 * GHL runs the AI, the voice and the call log in its CRM.
 *
 * The panel is created on first open and then only hidden, so the GHL script
 * loads once and a call is not cut off by closing the panel.
 */
export function VoiceWidget() {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = integrationsConfig.voiceWidgetId;

  useEffect(() => {
    const onOpen = () => {
      setMounted(true);
      setOpen(true);
    };
    const onChat = () => setOpen(false);
    window.addEventListener(OPEN_VOICE_EVENT, onOpen);
    window.addEventListener(OPEN_CHAT_EVENT, onChat);
    return () => {
      window.removeEventListener(OPEN_VOICE_EVENT, onOpen);
      window.removeEventListener(OPEN_CHAT_EVENT, onChat);
    };
  }, []);

  // Load GHL's loader inside the panel; it renders the widget next to the script tag.
  useEffect(() => {
    const host = hostRef.current;
    if (!mounted || !host || !widgetId) return;
    if (host.querySelector(`script[data-widget-id="${widgetId}"]`)) return;
    const script = document.createElement("script");
    script.src = LOADER_SRC;
    script.async = true;
    script.setAttribute("data-resources-url", RESOURCES_URL);
    script.setAttribute("data-widget-id", widgetId);
    host.appendChild(script);
  }, [mounted, widgetId]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!widgetId || !mounted) return null;
  return (
    <>
      {/* Phones: dim the page behind the bottom sheet. */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-black/40 md:hidden"
        />
      )}
      <section
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={t(copy.label)}
        hidden={!open}
        className="voice-pop fixed inset-x-0 bottom-0 z-[61] max-h-[calc(100svh-1rem)] overflow-y-auto rounded-t-[24px] bg-white shadow-2xl shadow-black/30 outline-none md:inset-x-auto md:bottom-[6.5rem] md:right-6 md:w-[400px] md:rounded-[24px] md:ring-1 md:ring-black/5"
      >
        <div className="flex items-center justify-between gap-3 bg-ld-navy px-5 py-3.5 text-white">
          <span className="flex items-center gap-2.5 font-bold">
            <AudioLines className="h-5 w-5 text-ld-gold" />
            {t(copy.title)}
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/90">
              {t(copy.badge)}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t(copy.close)}
              className="-mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white hover:text-ld-black"
            >
              <X className="h-5 w-5" />
            </button>
          </span>
        </div>
        {/* GHL appends its <chat-widget> here. */}
        <div
          ref={hostRef}
          className="flex min-h-[380px] items-center justify-center overflow-hidden bg-white py-4"
        />
      </section>
    </>
  );
}
