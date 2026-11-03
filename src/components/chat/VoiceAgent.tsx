import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, MessageCircle, Mic, Phone, PhoneOff, Sparkles, X } from "lucide-react";
import { getAssistantStatus, sendChatMessage } from "@/functions/chat";
import { businessConfig } from "@/config/business";
import { openChat } from "@/lib/chat-events";
import { phoneHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";
import {
  createRecognition,
  speak,
  speechSupported,
  warmUpVoices,
  type Recognition,
} from "@/lib/speech";
import { VoiceOrb } from "./VoiceOrb";

const VOICE_KEY = "lx_voice";

type Phase = "idle" | "connecting" | "listening" | "thinking" | "speaking";
type Problem = null | "unsupported" | "mic" | "offline" | "network";

const copy = {
  title: { en: "Ask us by voice", vi: "Hỏi nhanh bằng giọng nói" },
  badge: { en: "Voice AI", vi: "Voice AI" },
  call: { en: "Call us here", vi: "Gọi cho chúng tôi" },
  end: { en: "End call", vi: "Kết thúc" },
  idleHint: {
    en: "Talk to our AI assistant about grades, samples, MOQ and shipping.",
    vi: "Trò chuyện với trợ lý AI về cấp hạt, mẫu thử, đơn tối thiểu và giao hàng.",
  },
  connecting: { en: "Connecting…", vi: "Đang kết nối…" },
  listening: { en: "Listening — go ahead", vi: "Đang nghe — mời bạn nói" },
  thinking: { en: "Thinking…", vi: "Đang suy nghĩ…" },
  speaking: { en: "Speaking…", vi: "Đang trả lời…" },
  greeting: {
    en: "Hi, this is the Lean Export voice assistant. How can I help with your coffee order today?",
    vi: "Xin chào, tôi là trợ lý giọng nói của Lean Export. Tôi có thể giúp gì cho đơn hàng cà phê của bạn?",
  },
  goodbye: {
    en: "I didn't catch anything, so I'll end the call here. Feel free to call again or chat with us anytime.",
    vi: "Tôi chưa nghe thấy bạn nói, nên sẽ kết thúc cuộc gọi tại đây. Bạn có thể gọi lại hoặc nhắn tin bất cứ lúc nào nhé.",
  },
  fallbackReply: {
    en: "Sorry, I couldn't get an answer just now. Please try again, or leave your details in the chat and our sales team will call you back.",
    vi: "Xin lỗi, tôi chưa lấy được câu trả lời. Bạn thử lại nhé, hoặc để lại thông tin trong khung chat để đội sales gọi lại.",
  },
  unsupported: {
    en: "This browser can't do voice calls. Use Chrome, Edge or Safari — or chat with us instead.",
    vi: "Trình duyệt này chưa hỗ trợ gọi giọng nói. Hãy dùng Chrome, Edge hoặc Safari, hoặc nhắn tin với chúng tôi.",
  },
  mic: {
    en: "Microphone access is blocked. Allow the microphone for this site and try again.",
    vi: "Micro đang bị chặn. Hãy cho phép trang dùng micro rồi thử lại.",
  },
  offline: {
    en: "The voice assistant isn't available right now. Call or chat with our team instead.",
    vi: "Trợ lý giọng nói đang tạm nghỉ. Bạn có thể gọi điện hoặc nhắn tin cho đội ngũ.",
  },
  network: {
    en: "Connection problem. Check your internet and try again.",
    vi: "Mất kết nối. Kiểm tra mạng rồi thử lại.",
  },
  chat: { en: "Chat instead", vi: "Nhắn tin" },
  close: { en: "Close", vi: "Đóng" },
  line: { en: "Lean Export AI voice line", vi: "Tổng đài AI Lean Export" },
  you: { en: "You", vi: "Bạn" },
  disclaimer: {
    en: "AI answers are for guidance; prices and terms are confirmed by our sales team.",
    vi: "Câu trả lời của AI mang tính tham khảo; giá và điều khoản do đội sales xác nhận.",
  },
};

function readVoiceSession(): { sessionId: string; token: string } | null {
  try {
    const raw = sessionStorage.getItem(VOICE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Voice AI widget: a spoken conversation with the website's AI assistant. */
export function VoiceAgent({ onClose }: { onClose?: () => void }) {
  const { t, lang } = useLang();
  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState<Problem>(null);
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");

  /** Mirror of `phase` for the audio loop. */
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const level = useRef(0);
  const live = useRef(false);
  const silentRounds = useRef(0);
  const recRef = useRef<Recognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const speakingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelSpeech = useRef<() => void>(() => {});

  useEffect(() => warmUpVoices(), []);

  const stopAll = useCallback(() => {
    live.current = false;
    recRef.current?.abort();
    recRef.current = null;
    cancelSpeech.current();
    if (speakingTimer.current) clearInterval(speakingTimer.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    level.current = 0;
  }, []);

  useEffect(() => stopAll, [stopAll]);

  /** Speak a line; the orb pulses while the browser talks. */
  const say = useCallback(
    async (text: string) => {
      setPhase("speaking");
      setReply(text);
      speakingTimer.current = setInterval(() => {
        level.current = 0.35 + Math.random() * 0.45;
      }, 120);
      const { done, cancel } = speak(text, lang);
      cancelSpeech.current = cancel;
      await done;
      if (speakingTimer.current) clearInterval(speakingTimer.current);
      level.current = 0;
    },
    [lang],
  );

  const ask = useCallback(
    async (text: string) => {
      setPhase("thinking");
      const session = readVoiceSession();
      try {
        const res = await sendChatMessage({
          data: {
            ...(session ?? {}),
            message: text,
            channel: "voice",
            lang,
            page: typeof location !== "undefined" ? location.pathname : "/",
          },
        });
        try {
          sessionStorage.setItem(
            VOICE_KEY,
            JSON.stringify({ sessionId: res.sessionId, token: res.token ?? session?.token }),
          );
        } catch {
          /* ignore */
        }
        return res.reply ?? t(copy.fallbackReply);
      } catch {
        return t(copy.fallbackReply);
      }
    },
    [lang, t],
  );

  const listen = useCallback(() => {
    if (!live.current) return;
    const rec = createRecognition(lang);
    if (!rec) return;
    recRef.current = rec;
    let finalText = "";
    setHeard("");
    setPhase("listening");
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]!;
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setHeard((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setProblem("mic");
        stopAll();
        setPhase("idle");
      } else if (e.error === "network") {
        setProblem("network");
        stopAll();
        setPhase("idle");
      }
    };
    rec.onend = async () => {
      if (!live.current) return;
      const text = finalText.trim();
      if (!text) {
        silentRounds.current += 1;
        if (silentRounds.current >= 3) {
          await say(t(copy.goodbye));
          stopAll();
          setPhase("idle");
          return;
        }
        listen();
        return;
      }
      silentRounds.current = 0;
      const answer = await ask(text);
      if (!live.current) return;
      await say(answer);
      listen();
    };
    rec.start();
  }, [ask, lang, say, stopAll, t]);

  const start = async () => {
    setProblem(null);
    setHeard("");
    setReply("");
    if (!speechSupported()) return setProblem("unsupported");
    setPhase("connecting");
    try {
      const status = await getAssistantStatus();
      if (!status.aiAvailable) {
        setPhase("idle");
        return setProblem("offline");
      }
    } catch {
      setPhase("idle");
      return setProblem("network");
    }
    try {
      // Microphone stream drives the orb while the visitor talks.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!audioCtxRef.current) return;
        // While the assistant speaks, `say` drives the level instead.
        if (phaseRef.current === "listening") {
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
          level.current = Math.min(1, peak / 50);
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setPhase("idle");
      return setProblem("mic");
    }
    live.current = true;
    silentRounds.current = 0;
    await say(t(copy.greeting));
    listen();
  };

  const end = () => {
    stopAll();
    setPhase("idle");
  };

  const active = phase !== "idle";
  const status =
    phase === "connecting"
      ? t(copy.connecting)
      : phase === "listening"
        ? t(copy.listening)
        : phase === "thinking"
          ? t(copy.thinking)
          : phase === "speaking"
            ? t(copy.speaking)
            : null;

  const close = () => {
    end();
    onClose?.();
  };

  return (
    <div className="w-full overflow-hidden bg-white text-ld-ink">
      <div className="flex items-center justify-between gap-3 bg-ld-navy px-5 py-3.5 text-white">
        <span className="flex items-center gap-2.5 font-bold">
          <AudioLines className="h-5 w-5 text-ld-gold" />
          {t(copy.title)}
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/90">
            {t(copy.badge)}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={close}
              aria-label={t(copy.close)}
              className="-mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white hover:text-ld-black"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </span>
      </div>

      <div className="flex flex-col items-center px-5 pb-5 pt-2">
        <div className="relative">
          {/* Soft light pooling under the globe */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[12%] bottom-[2%] h-[38%] rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--ld-gold)_60%,transparent),transparent)] blur-xl"
          />
          <VoiceOrb level={level} active={active} size={300} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pt-6">
            <button
              type="button"
              onClick={active ? end : start}
              aria-label={active ? t(copy.end) : t(copy.call)}
              className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full text-white shadow-lg shadow-ld-navy/20 ring-1 ring-white/50 backdrop-blur-[3px] transition-colors ${
                active ? "bg-ld-navy" : "bg-ld-navy/75 hover:bg-ld-navy/90"
              }`}
            >
              {phase === "listening" && (
                <span
                  aria-hidden="true"
                  className="absolute h-[72px] w-[72px] animate-ping rounded-full bg-ld-gold/30 motion-reduce:hidden"
                />
              )}
              <Mic className="relative h-8 w-8" />
            </button>
            {!active && (
              <button
                type="button"
                onClick={start}
                className="btn btn-primary btn-sm shadow-lg shadow-ld-gold-dark/30"
              >
                {t(copy.call)}
              </button>
            )}
          </div>
          <span className="absolute bottom-1 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ld-navy shadow-[0_4px_18px_color-mix(in_srgb,var(--ld-navy)_14%,transparent)]">
            <Sparkles className="h-3.5 w-3.5 text-ld-gold-dark" />
            {t(copy.line)}
          </span>
        </div>

        <div className="mt-4 min-h-[4.5rem] w-full text-center" aria-live="polite">
          {problem ? (
            <div className="space-y-3">
              <p className="text-sm text-red-700">{t(copy[problem])}</p>
              {(problem === "offline" || problem === "unsupported") && (
                <div className="flex flex-wrap justify-center gap-2">
                  <a href={phoneHref()} className="btn btn-outline-dark btn-sm">
                    <Phone className="h-4 w-4" /> {businessConfig.phone}
                  </a>
                  <button type="button" onClick={openChat} className="btn btn-primary btn-sm">
                    <MessageCircle className="h-4 w-4" /> {t(copy.chat)}
                  </button>
                </div>
              )}
            </div>
          ) : active ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-ld-muted">{status}</p>
              {heard && phase !== "speaking" && (
                <p className="line-clamp-2 text-sm text-ld-ink">
                  <span className="font-semibold">{t(copy.you)}:</span> {heard}
                </p>
              )}
              {reply && phase === "speaking" && (
                <p className="line-clamp-3 text-sm leading-relaxed text-ld-ink">{reply}</p>
              )}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-ld-muted">{t(copy.idleHint)}</p>
          )}
        </div>

        {active && (
          <button type="button" onClick={end} className="btn btn-outline-dark btn-sm mt-1">
            <PhoneOff className="h-4 w-4" /> {t(copy.end)}
          </button>
        )}
        <p className="mt-3 text-center text-[11px] leading-snug text-ld-dim">
          {t(copy.disclaimer)}
        </p>
      </div>
    </div>
  );
}
