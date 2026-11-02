import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AudioLines,
  Bot,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  Search,
  SendHorizontal,
  Trash2,
} from "lucide-react";
import { AdminSubbar, AdminTopbar, Avatar } from "@/components/admin/AdminShell";
import {
  deleteChat,
  getChat,
  listChats,
  replyChat,
  updateChat,
  type ChatMessage,
  type ChatSessionRow,
} from "@/functions/chat";

export const Route = createFileRoute("/admin/chats")({
  component: ChatsPage,
});

type Filter = "all" | "unread" | "chat" | "voice";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "chat", label: "Chat" },
  { value: "voice", label: "Voice AI" },
];

const visitorName = (s: Pick<ChatSessionRow, "name" | "id">) =>
  s.name || `Khách #${s.id.slice(0, 4).toUpperCase()}`;

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

function ChannelTag({ channel }: { channel: ChatSessionRow["channel"] }) {
  return channel === "voice" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f3ff] px-2 py-0.5 text-xs font-medium text-[#5925dc] ring-1 ring-inset ring-[#d9d6fe]">
      <AudioLines className="h-3 w-3" /> Voice AI
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-admin-blue-soft px-2 py-0.5 text-xs font-medium text-admin-blue ring-1 ring-inset ring-[#b2ccff]">
      <MessageCircle className="h-3 w-3" /> Chat
    </span>
  );
}

function ChatsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setQ(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term]);

  const list = useQuery({
    queryKey: ["chats", filter, q],
    queryFn: () => listChats({ data: { filter, q } }),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  });
  const rows = list.data?.rows ?? [];

  return (
    <>
      <AdminTopbar title="Hội thoại" />
      <AdminSubbar
        tabs={FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className="admin-subtab"
            aria-current={filter === f.value ? "page" : undefined}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value === "unread" && (list.data?.unreadCount ?? 0) > 0 && (
              <span className="rounded-full bg-admin-blue px-1.5 text-xs font-semibold text-white">
                {list.data?.unreadCount}
              </span>
            )}
          </button>
        ))}
      />

      {list.data && !list.data.aiAvailable && (
        <p className="mx-4 mt-4 rounded-lg border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-sm text-[#b54708] lg:mx-6">
          Trợ lý AI chưa bật (thiếu ANTHROPIC_API_KEY). Chat vẫn nhận tin nhắn và gửi lời chào, nhân
          viên trả lời tại đây; Voice AI tạm tắt.
        </p>
      )}

      <div className="flex min-h-0 flex-1 p-4 lg:p-6">
        <div className="admin-card grid min-h-[70vh] w-full overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Conversation list */}
          <div
            className={`flex min-h-0 flex-col border-admin-line lg:border-r ${selectedId ? "hidden lg:flex" : "flex"}`}
          >
            <div className="border-b border-admin-line p-3">
              <label className="relative block">
                <span className="sr-only">Tìm hội thoại</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-dim" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Tìm tên, email, nội dung…"
                  className="admin-input pl-9"
                />
              </label>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-admin-line overflow-y-auto">
              {list.isLoading ? (
                <li className="flex items-center justify-center gap-2 p-10 text-sm text-admin-dim">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
                </li>
              ) : rows.length === 0 ? (
                <li className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <MessagesSquare className="h-7 w-7 text-admin-dim" />
                  <p className="font-semibold text-admin-ink">
                    {filter === "all" && !q
                      ? "Chưa có hội thoại nào"
                      : "Không có hội thoại khớp bộ lọc"}
                  </p>
                  {filter === "all" && !q && (
                    <p className="max-w-xs text-sm text-admin-dim">
                      Khi khách nhắn tin qua chat hoặc gọi Voice AI trên website, hội thoại sẽ hiện
                      ở đây.
                    </p>
                  )}
                </li>
              ) : (
                rows.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      aria-current={selectedId === r.id ? "true" : undefined}
                      className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-admin-row ${
                        selectedId === r.id ? "bg-admin-blue-soft hover:bg-admin-blue-soft" : ""
                      }`}
                    >
                      <Avatar name={r.name || "Khách"} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={`truncate text-sm text-admin-ink ${r.unread ? "font-semibold" : "font-medium"}`}
                          >
                            {visitorName(r)}
                          </span>
                          <span className="shrink-0 text-xs text-admin-dim">
                            {timeAgo(r.updated_at)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span
                            className={`line-clamp-1 flex-1 text-sm ${r.unread ? "text-admin-ink" : "text-admin-muted"}`}
                          >
                            {r.last_role === "ai" ? "AI: " : r.last_role === "agent" ? "Bạn: " : ""}
                            {r.last}
                          </span>
                          {r.unread > 0 && (
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full bg-admin-blue"
                              aria-label="Chưa đọc"
                            />
                          )}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <ChannelTag channel={r.channel} />
                          {(r.email || r.phone) && (
                            <span className="rounded-full bg-[#ecfdf3] px-2 py-0.5 text-xs font-medium text-[#067647] ring-1 ring-inset ring-[#abefc6]">
                              Có liên hệ
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Thread */}
          <div className={`min-h-0 flex-col ${selectedId ? "flex" : "hidden lg:flex"}`}>
            {selectedId ? (
              <Thread
                key={selectedId}
                id={selectedId}
                onBack={() => setSelectedId(null)}
                onDeleted={() => setSelectedId(null)}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-admin-dim">
                <MessagesSquare className="h-8 w-8" />
                <p className="text-sm">Chọn một hội thoại để xem và trả lời.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Thread({
  id,
  onBack,
  onDeleted,
}: {
  id: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ["chat", id],
    queryFn: () => getChat({ data: { id } }),
    refetchInterval: 5_000,
  });
  const session = query.data?.session;
  const messages: ChatMessage[] = query.data?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["chat", id] }),
      qc.invalidateQueries({ queryKey: ["chats"] }),
    ]);

  const reply = useMutation({
    mutationFn: (content: string) => replyChat({ data: { id, content } }),
    onSuccess: async () => {
      setDraft("");
      await refresh();
    },
  });
  const toggleAi = useMutation({
    mutationFn: (aiPaused: boolean) => updateChat({ data: { id, aiPaused } }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => deleteChat({ data: { id } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["chats"] });
      onDeleted();
    },
  });

  const sendDraft = () => {
    if (draft.trim() && !reply.isPending) reply.mutate(draft.trim());
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    sendDraft();
  };

  if (query.isLoading)
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-admin-dim">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
      </div>
    );
  if (!session)
    return <p className="p-10 text-center text-sm text-admin-dim">Hội thoại không còn tồn tại.</p>;

  const aiOn = !session.ai_paused;

  return (
    <>
      <div className="space-y-2.5 border-b border-admin-line px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="admin-icon-btn h-9 w-9 shrink-0 lg:hidden"
            aria-label="Về danh sách hội thoại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Avatar name={session.name || "Khách"} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-admin-ink">{visitorName(session)}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-admin-muted">
              {session.email && (
                <a
                  href={`mailto:${session.email}`}
                  className="inline-flex min-w-0 items-center gap-1 hover:text-admin-blue"
                >
                  <Mail className="h-3 w-3 shrink-0" />{" "}
                  <span className="truncate">{session.email}</span>
                </a>
              )}
              {session.phone && (
                <a
                  href={`tel:${session.phone}`}
                  className="inline-flex items-center gap-1 hover:text-admin-blue"
                >
                  <Phone className="h-3 w-3" /> {session.phone}
                </a>
              )}
              {!session.email && !session.phone && <span>Chưa để lại liên hệ</span>}
            </p>
          </div>
          <button
            type="button"
            className="admin-icon-btn h-9 w-9 shrink-0 text-[#b42318]"
            aria-label="Xóa hội thoại"
            title="Xóa hội thoại"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm("Xóa vĩnh viễn hội thoại này?")) remove.mutate();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-admin-muted">
          <ChannelTag channel={session.channel} />
          <span>
            Bắt đầu {fmtTime(session.created_at)}
            {session.page ? `, trang ${session.page}` : ""}
          </span>
          <span className="ml-auto flex items-center gap-2 text-sm font-medium text-admin-text">
            <Bot className="h-4 w-4" />
            <span id={`ai-${id}`}>AI tự trả lời</span>
            <button
              type="button"
              role="switch"
              aria-checked={aiOn}
              aria-labelledby={`ai-${id}`}
              disabled={toggleAi.isPending}
              onClick={() => toggleAi.mutate(aiOn)}
              className={`relative h-6 w-11 rounded-full transition-colors ${aiOn ? "bg-admin-blue" : "bg-admin-field"}`}
            >
              <span
                className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${aiOn ? "translate-x-[22px]" : "translate-x-0.5"}`}
              />
            </button>
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-admin-row px-4 py-5">
        {messages.map((m) =>
          m.role === "visitor" ? (
            <div key={m.id} className="flex max-w-[80%] flex-col items-start">
              <p className="whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed text-admin-ink ring-1 ring-admin-line">
                {m.content}
              </p>
              <span className="mt-1 text-[11px] text-admin-dim">{fmtTime(m.created_at)}</span>
            </div>
          ) : (
            <div key={m.id} className="ml-auto flex max-w-[80%] flex-col items-end">
              <p
                className={`whitespace-pre-wrap break-words rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "agent"
                    ? "bg-admin-blue text-white"
                    : "bg-admin-blue-soft text-admin-ink"
                }`}
              >
                {m.content}
              </p>
              <span className="mt-1 text-[11px] text-admin-dim">
                {m.role === "ai" ? "Trợ lý AI" : "Nhân viên"} · {fmtTime(m.created_at)}
              </span>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="border-t border-admin-line bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendDraft();
              }
            }}
            placeholder="Nhập câu trả lời cho khách… (Ctrl+Enter để gửi)"
            className="admin-input min-h-[44px] flex-1 resize-none"
            maxLength={4000}
          />
          <button
            type="submit"
            className="admin-btn admin-btn-primary h-11"
            disabled={!draft.trim() || reply.isPending}
          >
            {reply.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </div>
        <p className="mt-1.5 text-xs text-admin-dim">
          {session.channel === "voice"
            ? "Hội thoại Voice AI đã kết thúc khi khách cúp máy; khách chỉ thấy trả lời nếu quay lại bằng chat."
            : aiOn
              ? "Khi bạn trả lời, AI sẽ tạm dừng ở hội thoại này để bạn tiếp quản."
              : "AI đang tạm dừng; khách thấy câu trả lời của bạn trong khung chat."}
        </p>
      </form>
    </>
  );
}
