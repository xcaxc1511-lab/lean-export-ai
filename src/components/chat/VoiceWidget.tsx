import { useEffect, useRef, useState } from "react";
import { OPEN_CHAT_EVENT, OPEN_VOICE_EVENT } from "@/lib/chat-events";
import { useLang } from "@/lib/i18n";
import { VoiceAgent } from "./VoiceAgent";

const label = { en: "Voice AI assistant", vi: "Trợ lý AI giọng nói" };

/**
 * Voice AI popup, opened by the floating voice button or the hero button.
 * Mounted only while open, so the globe animation and the microphone stop on close.
 */
export function VoiceWidget() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onChat = () => setOpen(false);
    window.addEventListener(OPEN_VOICE_EVENT, onOpen);
    window.addEventListener(OPEN_CHAT_EVENT, onChat);
    return () => {
      window.removeEventListener(OPEN_VOICE_EVENT, onOpen);
      window.removeEventListener(OPEN_CHAT_EVENT, onChat);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <>
      {/* Phones: dim the page behind the bottom sheet. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[60] bg-black/40 md:hidden"
      />
      <section
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={t(label)}
        className="voice-pop fixed inset-x-0 bottom-0 z-[61] max-h-[calc(100svh-1rem)] overflow-y-auto rounded-t-[24px] bg-white shadow-2xl shadow-black/30 outline-none md:inset-x-auto md:bottom-[6.5rem] md:right-6 md:w-[400px] md:rounded-[24px] md:ring-1 md:ring-black/5"
      >
        <VoiceAgent onClose={() => setOpen(false)} />
      </section>
    </>
  );
}
