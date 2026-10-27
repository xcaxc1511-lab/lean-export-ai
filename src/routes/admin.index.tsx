import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Download, Inbox, Loader2, Mail, Search, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  ENQUIRY_STATUSES,
  deleteEnquiry,
  listEnquiries,
  updateEnquiry,
  type Enquiry,
  type EnquiryStatus,
} from "@/functions/enquiries";

export const Route = createFileRoute("/admin/")({
  component: EnquiriesPage,
});

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  quoted: "Đã báo giá",
  won: "Chốt đơn",
  lost: "Không thành",
  spam: "Spam",
};

/** Fill darkens as an enquiry moves down the pipeline: gold → navy. */
const STATUS_STYLE: Record<EnquiryStatus, string> = {
  new: "bg-primary text-admin-ink",
  contacted: "bg-accent text-admin-ink ring-1 ring-inset ring-primary",
  quoted: "bg-white text-admin-ink ring-1 ring-inset ring-admin-ink/35",
  won: "bg-brand-ink text-white",
  lost: "bg-admin-row text-admin-dim",
  spam: "bg-red-50 text-red-700",
};

/** The sales pipeline, in order. `lost` and `spam` are exits, listed separately. */
const PIPELINE = ["new", "contacted", "quoted", "won"] as const;
const PIPELINE_BAR: Record<(typeof PIPELINE)[number], string> = {
  new: "bg-primary",
  contacted: "bg-primary/45",
  quoted: "bg-admin-ink/35",
  won: "bg-brand-ink",
};

type StatusFilter = "all" | EnquiryStatus;
type KindFilter = "all" | "contact" | "quote";

const KINDS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "quote", label: "Báo giá" },
  { value: "contact", label: "Liên hệ" },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function Pipeline({
  counts,
  total,
  status,
  onChange,
}: {
  counts: Record<string, number>;
  total: number;
  status: StatusFilter;
  onChange: (s: StatusFilter) => void;
}) {
  const exits: [StatusFilter, string, number][] = [
    ["all", "Tất cả", total],
    ["lost", STATUS_LABEL.lost, counts["lost"] ?? 0],
    ["spam", STATUS_LABEL.spam, counts["spam"] ?? 0],
  ];
  return (
    <div className="admin-panel mb-6 overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {PIPELINE.map((s, i) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => onChange(status === s ? "all" : s)}
            className={`group relative flex flex-col gap-2 border-admin-line px-5 pb-6 pt-5 text-left transition-colors md:px-6 ${
              i % 2 === 1 ? "border-l" : ""
            } ${i >= 2 ? "border-t md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""} ${
              status === s ? "bg-accent" : "hover:bg-admin-row"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium text-admin-muted">
              {STATUS_LABEL[s]}
              {i < PIPELINE.length - 1 && (
                <ChevronRight className="hidden h-4 w-4 text-admin-dim/70 md:inline" />
              )}
            </span>
            <span className="text-4xl font-bold leading-none tabular-nums text-admin-ink">
              {counts[s] ?? 0}
            </span>
            <span
              className={`absolute inset-x-0 bottom-0 h-1 transition-opacity ${PIPELINE_BAR[s]} ${
                status === s ? "opacity-100" : "opacity-0 group-hover:opacity-60"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-admin-line bg-admin-row/60 px-5 py-2.5 text-sm md:px-6">
        {exits.map(([s, label, n]) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => onChange(s)}
            className={`py-1 transition-colors ${
              status === s
                ? "font-bold text-admin-ink underline decoration-primary decoration-2 underline-offset-[6px]"
                : "text-admin-muted hover:text-admin-ink"
            }`}
          >
            {label} <span className="tabular-nums text-admin-dim">{n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EnquiriesPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const filters = { status, kind, q };
  const query = useQuery({
    queryKey: ["enquiries", filters],
    queryFn: () => listEnquiries({ data: filters }),
    placeholderData: keepPreviousData,
  });

  const rows = query.data?.rows ?? [];
  const counts = query.data?.counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const csvHref = `${import.meta.env.BASE_URL}api/admin/enquiries.csv?${new URLSearchParams(filters)}`;
  const filtered = status !== "all" || kind !== "all" || q !== "";

  const clearFilters = () => {
    setStatus("all");
    setKind("all");
    setSearch("");
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[2rem] font-bold leading-tight text-admin-ink">Yêu cầu báo giá</h1>
          <p className="mt-1 text-admin-muted">
            Mọi yêu cầu gửi từ form trên website. Bấm vào một dòng để xem và cập nhật.
          </p>
        </div>
        <a href={csvHref} className="btn btn-outline-dark btn-sm self-start md:self-auto">
          <Download className="h-4 w-4" /> Xuất CSV
        </a>
      </div>

      <Pipeline counts={counts} total={total} status={status} onChange={setStatus} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Tìm kiếm</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-dim" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, công ty, email, quốc gia, sản phẩm…"
            className="admin-input pl-10 text-sm"
          />
        </label>
        <div
          role="group"
          aria-label="Loại yêu cầu"
          className="flex shrink-0 gap-1 self-start rounded-full bg-admin-row p-1 ring-1 ring-inset ring-admin-line sm:self-auto"
        >
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={kind === k.value}
              onClick={() => setKind(k.value)}
              className="admin-segment"
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-panel overflow-hidden">
        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-admin-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
          </div>
        ) : query.isError ? (
          <p className="p-12 text-center text-red-600">
            Không tải được dữ liệu. Tải lại trang để thử lần nữa.
          </p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Inbox className="mb-2 h-8 w-8 text-admin-dim" />
            {filtered ? (
              <>
                <p className="font-bold text-admin-ink">Không có yêu cầu nào khớp bộ lọc</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-admin-muted underline underline-offset-4 hover:text-admin-ink"
                >
                  Xóa bộ lọc
                </button>
              </>
            ) : (
              <>
                <p className="font-bold text-admin-ink">Chưa có yêu cầu nào</p>
                <p className="max-w-sm text-sm text-admin-muted">
                  Khi khách gửi form Liên hệ hoặc Báo giá trên website, yêu cầu sẽ hiện ở đây.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-admin-line text-[13px] text-admin-dim">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 font-medium">#</th>
                  <th className="px-3 py-3.5 font-medium">Khách hàng</th>
                  <th className="px-3 py-3.5 font-medium">Quốc gia</th>
                  <th className="px-3 py-3.5 font-medium">Sản phẩm</th>
                  <th className="px-3 py-3.5 font-medium">Loại</th>
                  <th className="px-3 py-3.5 font-medium">Nhận lúc</th>
                  <th className="py-3.5 pl-3 pr-6 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="cursor-pointer border-b border-admin-line last:border-0 hover:bg-accent/60"
                  >
                    <td className="py-4 pl-6 pr-3 tabular-nums text-admin-dim">{r.id}</td>
                    <td className="px-3 py-4">
                      {/* Real button so the row is reachable by keyboard. */}
                      <button
                        type="button"
                        className={`text-left text-admin-ink ${
                          r.status === "new" ? "font-bold" : "font-medium"
                        }`}
                      >
                        {r.company || r.name}
                      </button>
                      <div className="text-xs text-admin-muted">
                        {r.company ? `${r.name}, ` : ""}
                        {r.email}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-admin-muted">{r.country || "—"}</td>
                    <td className="px-3 py-4 text-admin-muted">{r.product || "—"}</td>
                    <td className="px-3 py-4 text-admin-muted">
                      {r.kind === "quote" ? "Báo giá" : "Liên hệ"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 tabular-nums text-admin-muted">
                      {fmtDate(r.created_at)}
                    </td>
                    <td className="py-4 pl-3 pr-6">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto border-admin-line bg-white p-0 sm:max-w-lg">
          {selected && (
            <EnquiryDetail
              key={selected.id}
              enquiry={selected}
              onDone={() => setSelectedId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EnquiryDetail({ enquiry: e, onDone }: { enquiry: Enquiry; onDone: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<EnquiryStatus>(e.status);
  const [notes, setNotes] = useState(e.notes ?? "");
  const refresh = () => qc.invalidateQueries({ queryKey: ["enquiries"] });

  const save = useMutation({
    mutationFn: () => updateEnquiry({ data: { id: e.id, status, notes } }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => deleteEnquiry({ data: { id: e.id } }),
    onSuccess: async () => {
      await refresh();
      onDone();
    },
  });

  const fields: [string, string | null][] = [
    ["Họ tên", e.name],
    ["Công ty", e.company],
    ["Email", e.email],
    ["Quốc gia / cảng", e.country],
    ["Sản phẩm", e.product],
    ["Sản lượng", e.volume],
    ...(e.kind === "quote"
      ? ([
          ["Điều kiện giao hàng", e.incoterm],
          ["Nhận mẫu trước", e.samples ? "Có" : "Không"],
        ] as [string, string | null][])
      : []),
    ["Ngôn ngữ", e.lang?.toUpperCase() ?? null],
    ["Gửi từ trang", e.source_page],
  ];
  const replySubject = encodeURIComponent(
    `Re: ${e.kind === "quote" ? "Quote request" : "Your enquiry"} #${e.id}`,
  );

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-admin-line bg-admin-canvas px-6 pb-6 pt-8">
        <div className="mb-3 flex items-center gap-2 text-sm text-admin-dim">
          <span className="tabular-nums">#{e.id}</span>
          <StatusBadge status={e.status} />
        </div>
        <SheetTitle className="text-2xl font-bold leading-tight text-admin-ink">
          {e.company || e.name}
        </SheetTitle>
        <SheetDescription className="mt-1 text-admin-muted">
          {e.kind === "quote" ? "Yêu cầu báo giá" : "Liên hệ"}, nhận lúc {fmtDate(e.created_at)}
        </SheetDescription>
        <a
          href={`mailto:${e.email}?subject=${replySubject}`}
          className="btn btn-primary btn-sm mt-5"
        >
          <Mail className="h-4 w-4" /> Trả lời qua email
        </a>
      </div>

      <div className="grid gap-6 px-6 py-6">
        <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-2.5 text-sm">
          {fields
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-admin-dim">{k}</dt>
                <dd className="break-words font-medium text-admin-ink">{v}</dd>
              </div>
            ))}
        </dl>

        {e.message && (
          <div>
            <p className="mb-2 text-sm text-admin-dim">Nội dung</p>
            <p className="whitespace-pre-wrap rounded-2xl bg-admin-row p-4 text-sm leading-relaxed text-admin-ink">
              {e.message}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto grid gap-4 border-t border-admin-line px-6 py-6">
        <label className="admin-label">
          Trạng thái
          <select
            value={status}
            onChange={(ev) => setStatus(ev.target.value as EnquiryStatus)}
            className="admin-input"
          >
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-label">
          Ghi chú nội bộ
          <textarea
            rows={4}
            value={notes}
            onChange={(ev) => setNotes(ev.target.value)}
            placeholder="VD: đã gửi báo giá FOB ngày…"
            className="admin-input"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-dark btn-sm"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
          </button>
          {save.isSuccess && <span className="text-sm text-green-700">Đã lưu thay đổi</span>}
          <button
            type="button"
            className="ml-auto flex items-center gap-1.5 text-sm text-red-600 hover:underline"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`Xóa vĩnh viễn yêu cầu #${e.id}?`)) remove.mutate();
            }}
          >
            <Trash2 className="h-4 w-4" /> Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
