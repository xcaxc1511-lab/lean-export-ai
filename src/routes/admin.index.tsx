import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Mail, Search, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

const STATUS_STYLE: Record<EnquiryStatus, string> = {
  new: "bg-amber-100 text-amber-900",
  contacted: "bg-sky-100 text-sky-900",
  quoted: "bg-indigo-100 text-indigo-900",
  won: "bg-green-100 text-green-900",
  lost: "bg-gray-200 text-gray-700",
  spam: "bg-red-100 text-red-800",
};

type StatusFilter = "all" | EnquiryStatus;
type KindFilter = "all" | "contact" | "quote";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
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
  });

  const rows = query.data?.rows ?? [];
  const counts = query.data?.counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const csvHref = `${import.meta.env.BASE_URL}api/admin/enquiries.csv?${new URLSearchParams(filters)}`;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yêu cầu báo giá & liên hệ</h1>
          <p className="text-sm text-gray-500">
            Tất cả yêu cầu gửi từ form trên website. Bấm vào một dòng để xem chi tiết.
          </p>
        </div>
        <a href={csvHref} className="btn btn-outline-dark btn-sm self-start md:self-auto">
          <Download className="h-4 w-4" /> Xuất CSV
        </a>
      </div>

      {/* Status filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...ENQUIRY_STATUSES] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              status === s
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {s === "all" ? "Tất cả" : STATUS_LABEL[s]}{" "}
            <span className="opacity-60">{s === "all" ? total : (counts[s] ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, công ty, email, quốc gia, sản phẩm…"
            className="h-11 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30"
          />
        </label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as KindFilter)}
          className="h-11 rounded-md border border-gray-200 bg-white px-3 text-sm"
        >
          <option value="all">Mọi loại</option>
          <option value="quote">Yêu cầu báo giá</option>
          <option value="contact">Liên hệ</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
          </div>
        ) : query.isError ? (
          <p className="p-8 text-center text-red-600">Không tải được dữ liệu. Thử tải lại trang.</p>
        ) : rows.length === 0 ? (
          <p className="p-12 text-center text-gray-500">Chưa có yêu cầu nào khớp bộ lọc.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 font-semibold">Quốc gia</th>
                  <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                  <th className="px-4 py-3 font-semibold">Loại</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`cursor-pointer border-b border-gray-100 last:border-0 hover:bg-amber-50/50 ${
                      r.status === "new" ? "font-semibold" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400">{r.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {fmtDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{r.company || r.name}</div>
                      <div className="text-xs font-normal text-gray-500">
                        {r.company ? `${r.name} · ` : ""}
                        {r.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.country || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{r.product || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.kind === "quote" ? "Báo giá" : "Liên hệ"}
                    </td>
                    <td className="px-4 py-3">
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
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
    <div className="flex flex-col gap-6 p-1">
      <SheetHeader className="p-0">
        <SheetTitle className="flex items-center gap-3 text-xl">
          #{e.id} · {e.company || e.name}
        </SheetTitle>
        <p className="text-sm text-gray-500">
          {e.kind === "quote" ? "Yêu cầu báo giá" : "Liên hệ"} · {fmtDate(e.created_at)}
        </p>
      </SheetHeader>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {fields
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-gray-500">{k}</dt>
              <dd className="break-words font-medium text-gray-900">{v}</dd>
            </div>
          ))}
      </dl>

      {e.message && (
        <div>
          <p className="mb-1 text-sm text-gray-500">Nội dung</p>
          <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-relaxed">
            {e.message}
          </p>
        </div>
      )}

      <a
        href={`mailto:${e.email}?subject=${replySubject}`}
        className="btn btn-primary btn-sm self-start"
      >
        <Mail className="h-4 w-4" /> Trả lời qua email
      </a>

      <div className="grid gap-4 border-t border-gray-200 pt-6">
        <label className="grid gap-2 text-sm font-medium">
          Trạng thái
          <select
            value={status}
            onChange={(ev) => setStatus(ev.target.value as EnquiryStatus)}
            className="h-11 rounded-md border border-gray-200 bg-white px-3"
          >
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Ghi chú nội bộ
          <textarea
            rows={4}
            value={notes}
            onChange={(ev) => setNotes(ev.target.value)}
            placeholder="VD: đã gửi báo giá FOB ngày…"
            className="rounded-md border border-gray-200 p-3 font-normal outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn btn-dark btn-sm"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
          </button>
          {save.isSuccess && <span className="text-sm text-green-700">Đã lưu</span>}
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
