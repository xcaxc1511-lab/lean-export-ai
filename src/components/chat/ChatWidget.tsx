import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Coffee, Loader2, MessageCircle, Mic, SendHorizontal, Square, X } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { pollChat, saveChatContact, sendChatMessage, type ChatMessage } from "@/functions/chat";
import { OPEN_CHAT_EVENT } from "@/lib/chat-events";
import { useLang } from "@/lib/i18n";
import { createRecognition, speechSupported, type Recognition } from "@/lib/speech";
import { MessageText } from "./MessageText";

const STORE_KEY = "lx_chat";
const GREETED_KEY = "lx_chat_greeted";

const copy = {
  greeting: { en: "Hi there! Have a question?", vi: "Xin chào! Bạn cần tư vấn?" },
  greetingSub: { en: "Chat with us here.", vi: "Nhắn tin với chúng tôi tại đây." },
  title: { en: "Have a question?", vi: "Bạn cần tư vấn?" },
  subtitle: { en: "Lean Export sales assistant", vi: "Trợ lý bán hàng Lean Export" },
  welcome: {
    en: "Enter your question below and a representative will get right back to you.",
    vi: "Nhập câu hỏi bên dưới, đội ngũ Lean Export sẽ phản hồi bạn ngay.",
  },
  placeholder: { en: "Type a message…", vi: "Nhập tin nhắn…" },
  send: { en: "Send", vi: "Gửi" },
  open: { en: "Open chat", vi: "Mở khung chat" },
  close: { en: "Close chat", vi: "Đóng khung chat" },
  dismiss: { en: "Dismiss", vi: "Ẩn" },
  dictate: { en: "Speak your message", vi: "Nói để nhập tin nhắn" },
  stopDictate: { en: "Stop dictation", vi: "Dừng ghi âm" },
  agent: { en: "Lean Export team", vi: "Nhân viên Lean Export" },
  typing: { en: "Typing…", vi: "Đang trả lời…" },
  rateLimited: {
    en: "You're sending messages too quickly. Please wait a few minutes.",
    vi: "Bạn gửi tin quá nhanh. Vui lòng chờ vài phút rồi thử lại.",
  },
  failed: {
    en: "Message not sent. Check your connection and try again.",
    vi: "Chưa gửi được tin nhắn. Kiểm tra kết nối rồi thử lại.",
  },
  contactTitle: {
    en: "Leave your details so we can follow up",
    vi: "Để lại thông tin để chúng tôi liên hệ lại",
  },
  name: { en: "Your name", vi: "Họ tên" },
  email: { en: "Email", vi: "Email" },
  phone: { en: "Phone / WhatsApp", vi: "SĐT / Zalo / WhatsApp" },
  saveContact: { en: "Send details", vi: "Gửi thông tin" },
  later: { en: "Later", vi: "Để sau" },
  contactSaved: {
    en: "Thanks! Our sales team will contact you soon.",
    vi: "Cảm ơn bạn! Đội ngũ sales sẽ liên hệ sớm.",
  },
  contactInvalid: {
    en: "Enter your name and an email or phone number.",
    vi: "Nhập họ tên và email hoặc số điện thoại.",
  },
};

const QUICK_REPLIES = [
  { en: "Robusta export price this season?", vi: "Giá Robusta xuất khẩu vụ này?" },
  { en: "Can I get samples first?", vi: "Tôi muốn nhận mẫu thử trước" },
  { en: "What is your minimum order?", vi: "Đơn hàng tối thiểu là bao nhiêu?" },
];

interface Stored {
  sessionId: string;
  token: string;
  messages: ChatMessage[];
  hasContact: boolean;
  contactDismissed?: boolean;
}

function readStore(): Stored | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}
function writeStore(value: Stored) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(value));
  } catch {
    /* private mode — the chat still works for this page view */
  }
}

/** Round assistant avatar (brand mark, not a stock photo of a person). */
export function AssistantAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-ld-gold-button text-ld-navy ${
        size === "sm" ? "h-8 w-8" : "h-11 w-11 ring-2 ring-white/30"
      }`}
    >
      <Coffee className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}

export function ChatWidget() {
  const { t, lang } = useLang();
  const pathname = useLocation({ select: (l) => l.pathname });
  const [open, setOpen] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [store, setStore] = useState<Stored | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [canDictate, setCanDictate] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<Recognition | null>(null);

  const messages = store?.messages ?? [];
  const lastId = messages.at(-1)?.id ?? 0;

  const update = useCallback((next: Stored) => {
    setStore(next);
    writeStore(next);
  }, []);

  // Restore the conversation and show the greeting bubble once per browser.
  useEffect(() => {
    setStore(readStore());
    setCanDictate(speechSupported());
    let greeted = false;
    try {
      greeted = localStorage.getItem(GREETED_KEY) === "1";
    } catch {
      /* ignore */
    }
    const timer = greeted ? undefined : setTimeout(() => setGreeting(true), 3500);
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
    };
  }, []);

  const dismissGreeting = () => {
    setGreeting(false);
    try {
      localStorage.setItem(GREETED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (open) {
      dismissGreeting();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending, open]);

  // Staff replies from /admin arrive by polling while the chat is open.
  useEffect(() => {
    if (!open || !store) return;
    const id = setInterval(async () => {
      try {
        const res = await pollChat({
          data: { sessionId: store.sessionId, token: store.token, afterId: lastId },
        });
        if (res.ok && res.messages.length)
          update({
            ...store,
            hasContact: res.hasContact,
            messages: [...store.messages, ...res.messages],
          });
      } catch {
        /* offline — try again on the next tick */
      }
    }, 6000);
    return () => clearInterval(id);
  }, [open, store, lastId, update]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setError(null);
    setSending(true);
    setInput("");
    // Show the visitor's message immediately.
    const optimistic: ChatMessage = {
      id: -Date.now(),
      role: "visitor",
      content: message,
      created_at: new Date().toISOString(),
    };
    setStore((s) =>
      s
        ? { ...s, messages: [...s.messages, optimistic] }
        : { sessionId: "", token: "", hasContact: false, messages: [optimistic] },
    );
    try {
      const res = await sendChatMessage({
        data: {
          ...(store && { sessionId: store.sessionId, token: store.token }),
          message,
          channel: "chat",
          lang,
          page: pathname,
          afterId: lastId,
        },
      });
      update({
        sessionId: res.sessionId,
        token: res.token ?? store?.token ?? "",
        hasContact: res.hasContact,
        contactDismissed: store?.contactDismissed ?? false,
        messages: [...(store?.messages ?? []), ...res.messages],
      });
    } catch (e) {
      setStore(store);
      setInput(message);
      setError(String(e).includes("RATE_LIMITED") ? t(copy.rateLimited) : t(copy.failed));
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  const toggleDictation = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = createRecognition(lang);
    if (!rec) return;
    const base = input ? `${input.trimEnd()} ` : "";
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i]![0].transcript;
      setInput(base + text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const showContact =
    store &&
    !store.hasContact &&
    !store.contactDismissed &&
    messages.some((m) => m.role !== "visitor");

  return (
    <>
      {/* Greeting bubble */}
      {greeting && !open && (
        <div className="fixed bottom-5 right-[5.25rem] z-50 flex max-w-[calc(100vw-6.5rem)] items-start gap-3 rounded-2xl bg-white p-3.5 pr-9 shadow-xl shadow-black/15 ring-1 ring-black/5 md:bottom-8 md:right-[5.75rem] md:max-w-xs">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-start gap-3 text-left"
          >
            <AssistantAvatar size="sm" />
            <span className="text-sm leading-snug text-ld-ink">
              <span className="block font-semibold">{t(copy.greeting)}</span>
              {t(copy.greetingSub)}
            </span>
          </button>
          <button
            type="button"
            onClick={dismissGreeting}
            aria-label={t(copy.dismiss)}
            className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
          <span
            aria-hidden="true"
            className="absolute -right-1.5 bottom-5 h-3 w-3 rotate-45 bg-white ring-1 ring-black/5 [clip-path:polygon(100%_0,100%_100%,0_0)]"
          />
        </div>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t(copy.close) : t(copy.open)}
        aria-expanded={open}
        className={`fixed bottom-5 right-4 z-50 h-14 w-14 items-center justify-center rounded-full bg-ld-gold-button text-ld-black shadow-lg shadow-black/25 transition-transform hover:scale-105 focus-visible:outline-offset-4 md:bottom-8 md:right-6 ${
          open ? "hidden md:flex" : "flex"
        }`}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <section
          role="dialog"
          aria-label={t(copy.title)}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white md:inset-auto md:bottom-[6.5rem] md:right-6 md:h-[min(620px,calc(100vh-9rem))] md:w-[380px] md:rounded-2xl md:shadow-2xl md:shadow-black/25 md:ring-1 md:ring-black/5"
        >
          <header className="flex items-center gap-3 bg-ld-navy px-4 py-3.5 text-white">
            <AssistantAvatar />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold">{t(copy.title)}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" aria-hidden="true" />
                {t(copy.subtitle)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t(copy.close)}
              className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-white px-4 py-4"
          >
            <AssistantBubble>{t(copy.welcome)}</AssistantBubble>

            {messages.map((m) =>
              m.role === "visitor" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-ld-navy px-3.5 py-2.5 text-[15px] leading-relaxed text-white">
                    {m.content}
                  </p>
                </div>
              ) : (
                <AssistantBubble key={m.id} label={m.role === "agent" ? t(copy.agent) : undefined}>
                  <MessageText text={m.content} />
                </AssistantBubble>
              ),
            )}

            {sending && (
              <AssistantBubble>
                <span className="flex items-center gap-1 py-1" aria-label={t(copy.typing)}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-ld-dim"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              </AssistantBubble>
            )}

            {messages.length === 0 && !sending && (
              <div className="flex flex-wrap gap-2 pl-10">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q.en}
                    type="button"
                    onClick={() => void send(t(q))}
                    className="rounded-full border border-ld-line px-3 py-1.5 text-left text-sm text-ld-ink transition-colors hover:border-ld-gold hover:bg-ld-gold-soft"
                  >
                    {t(q)}
                  </button>
                ))}
              </div>
            )}

            {showContact && store && (
              <ContactCard
                onSaved={() => update({ ...store, hasContact: true })}
                onLater={() => update({ ...store, contactDismissed: true })}
                sessionId={store.sessionId}
                token={store.token}
              />
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 border-t border-ld-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <label className="sr-only" htmlFor="lx-chat-input">
              {t(copy.placeholder)}
            </label>
            <textarea
              id="lx-chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={listening ? "…" : t(copy.placeholder)}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-ld-line bg-ld-row px-4 py-2.5 text-[15px] leading-snug text-ld-ink outline-none [field-sizing:content] focus:border-ld-gold focus:bg-white focus:ring-2 focus:ring-ld-gold/30"
            />
            {canDictate && (
              <button
                type="button"
                onClick={toggleDictation}
                aria-label={listening ? t(copy.stopDictate) : t(copy.dictate)}
                aria-pressed={listening}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                  listening
                    ? "animate-pulse bg-red-500 text-white"
                    : "text-ld-muted hover:bg-ld-row hover:text-ld-ink"
                }`}
              >
                {listening ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label={t(copy.send)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ld-gold-button text-ld-black transition-colors hover:bg-ld-navy hover:text-white disabled:bg-ld-row disabled:text-ld-dim"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <SendHorizontal className="h-5 w-5" />
              )}
            </button>
          </form>
        </section>
      )}
    </>
  );
}

function AssistantBubble({ children, label }: { children: ReactNode; label?: string | undefined }) {
  return (
    <div className="flex items-end gap-2">
      <AssistantAvatar size="sm" />
      <div className="max-w-[85%]">
        {label && <p className="mb-1 text-xs font-semibold text-ld-muted">{label}</p>}
        <div className="break-words rounded-2xl rounded-bl-md bg-ld-row px-3.5 py-2.5 text-[15px] leading-relaxed text-ld-ink">
          {children}
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  sessionId,
  token,
  onSaved,
  onLater,
}: {
  sessionId: string;
  token: string;
  onSaved: () => void;
  onLater: () => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error" | "done">("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) return setState("error");
    setState("saving");
    try {
      await saveChatContact({ data: { sessionId, token, name, email, phone } });
      setState("done");
      setTimeout(onSaved, 1800);
    } catch {
      setState("error");
    }
  };

  if (state === "done")
    return (
      <p className="ml-10 rounded-xl bg-ld-gold-soft px-3.5 py-2.5 text-sm text-ld-ink">
        {t(copy.contactSaved)}
      </p>
    );

  const field =
    "h-10 w-full rounded-lg border border-ld-line bg-white px-3 text-sm text-ld-ink outline-none focus:border-ld-gold focus:ring-2 focus:ring-ld-gold/30";
  return (
    <form onSubmit={submit} className="ml-10 space-y-2 rounded-xl border border-ld-line p-3">
      <p className="text-sm font-semibold text-ld-ink">{t(copy.contactTitle)}</p>
      <input
        className={field}
        placeholder={t(copy.name)}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        aria-label={t(copy.name)}
      />
      <input
        className={field}
        placeholder={t(copy.email)}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        aria-label={t(copy.email)}
      />
      <input
        className={field}
        placeholder={t(copy.phone)}
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
        aria-label={t(copy.phone)}
      />
      {state === "error" && <p className="text-xs text-red-600">{t(copy.contactInvalid)}</p>}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={state === "saving"}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-ld-gold-button px-4 text-sm font-bold text-ld-black transition-colors hover:bg-ld-navy hover:text-white"
        >
          {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
          {t(copy.saveContact)}
        </button>
        <button type="button" onClick={onLater} className="text-sm text-ld-muted hover:text-ld-ink">
          {t(copy.later)}
        </button>
      </div>
    </form>
  );
}
