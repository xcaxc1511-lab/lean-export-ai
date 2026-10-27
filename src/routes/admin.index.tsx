import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Download,
  Inbox,
  Loader2,
  Mail,
  Search,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { AdminSubbar, AdminTopbar, Avatar } from "@/components/admin/AdminShell";
import {
  ENQUIRY_STATUSES,
  deleteEnquiry,
  listEnquiries,
  updateEnquiry,
  type Enquiry,
  type EnquiryStatus,
} from "@/functions/enquiries";

const searchSchema = z.object({
  status: z
    .enum(["all", ...ENQUIRY_STATUSES])
    .optional()
    .catch(undefined),
  kind: z.enum(["all", "contact", "quote"]).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/admin/")({
  validateSearch: (search) => searchSchema.parse(search),
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
  new: "bg-[#eff4ff] text-[#004eeb] ring-[#b2ccff]",
  contacted: "bg-[#fffaeb] text-[#b54708] ring-[#fedf89]",
  quoted: "bg-[#f4f3ff] text-[#5925dc] ring-[#d9d6fe]",
  won: "bg-[#ecfdf3] text-[#067647] ring-[#abefc6]",
  lost: "bg-[#f9fafb] text-[#475467] ring-[#eaecf0]",
  spam: "bg-[#fef3f2] text-[#b42318] ring-[#fecdca]",
};

type StatusFilter = "all" | EnquiryStatus;
type KindFilter = "all" | "contact" | "quote";
type SortKey = "created" | "name" | "country" | "product" | "status";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const KINDS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "Tất cả yêu cầu" },
  { value: "quote", label: "Báo giá" },
  { value: "contact", label: "Liên hệ" },
];

const SORT_PRESETS: { label: string; sort: Sort }[] = [
  { label: "Mới nhất", sort: { key: "created", dir: "desc" } },
  { label: "Cũ nhất", sort: { key: "created", dir: "asc" } },
  { label: "Tên A–Z", sort: { key: "name", dir: "asc" } },
];

const PAGE_SIZES = [20, 50, 100];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const displayName = (e: Enquiry) => e.company || e.name;

function sortValue(e: Enquiry, key: SortKey): string | number {
  switch (key) {
    case "created":
      return e.created_at;
    case "name":
      return displayName(e).toLowerCase();
    case "country":
      return (e.country ?? "").toLowerCase();
    case "product":
      return (e.product ?? "").toLowerCase();
    case "status":
      return ENQUIRY_STATUSES.indexOf(e.status);
  }
}

function StatusTag({ status }: { status: EnquiryStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: Sort;
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className="flex w-full items-center justify-between gap-2 font-semibold"
      >
        {label}
        <Icon className={`h-4 w-4 ${active ? "text-admin-ink" : "text-admin-dim"}`} />
      </button>
    </th>
  );
}

function EnquiriesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const status: StatusFilter = search.status ?? "all";
  const kind: KindFilter = search.kind ?? "all";
  const q = search.q ?? "";

  const [term, setTerm] = useState(q);
  const [sort, setSort] = useState<Sort>({ key: "created", dir: "desc" });
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const qc = useQueryClient();

  const setFilter = (next: { status?: StatusFilter; kind?: KindFilter; q?: string }) =>
    navigate({
      search: (prev) => {
        const merged = { ...prev, ...next };
        return {
          status: merged.status === "all" ? undefined : merged.status,
          kind: merged.kind === "all" ? undefined : merged.kind,
          q: merged.q ? merged.q : undefined,
        };
      },
      replace: true,
    });

  // Keep the box in sync when the sidebar search changes the URL.
  useEffect(() => setTerm(q), [q]);

  // Debounce typing into the URL.
  useEffect(() => {
    const value = term.trim();
    if (value === q) return;
    const id = setTimeout(() => void setFilter({ q: value }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  // New filter → back to page 1, clear the selection.
  useEffect(() => {
    setPage(1);
    setChecked(new Set());
  }, [status, kind, q, pageSize]);

  const filters = { status, kind, q };
  const query = useQuery({
    queryKey: ["enquiries", filters],
    queryFn: () => listEnquiries({ data: filters }),
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => query.data?.rows ?? [], [query.data]);
  const counts = query.data?.counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = sortValue(a, sort.key);
      const vb = sortValue(b, sort.key);
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
  }, [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const csvHref = `${import.meta.env.BASE_URL}api/admin/enquiries.csv?${new URLSearchParams(filters)}`;
  const filtered = status !== "all" || kind !== "all" || q !== "";

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "created" ? "desc" : "asc" },
    );

  const allOnPage = visible.length > 0 && visible.every((r) => checked.has(r.id));
  const togglePage = () =>
    setChecked((prev) => {
      const next = new Set(prev);
      for (const r of visible) {
        if (allOnPage) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
  const toggleOne = (id: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulk = useMutation({
    mutationFn: async (action: { status: EnquiryStatus } | { remove: true }) => {
      const ids = [...checked];
      await Promise.all(
        ids.map((id) =>
          "remove" in action
            ? deleteEnquiry({ data: { id } })
            : updateEnquiry({ data: { id, status: action.status } }),
        ),
      );
    },
    onSuccess: async () => {
      setChecked(new Set());
      await qc.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });

  const statusTabs: [StatusFilter, string, number][] = [
    ["all", "Tất cả", total],
    ...ENQUIRY_STATUSES.map(
      (s) => [s, STATUS_LABEL[s], counts[s] ?? 0] as [StatusFilter, string, number],
    ),
  ];

  return (
    <>
      <AdminTopbar
        title="Yêu cầu báo giá"
        tabs={KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            className="admin-tab"
            aria-current={kind === k.value ? "page" : undefined}
            onClick={() => void setFilter({ kind: k.value })}
          >
            {k.label}
          </button>
        ))}
      />
      <AdminSubbar
        tabs={statusTabs.map(([s, label, n]) => (
          <button
            key={s}
            type="button"
            className="admin-subtab"
            aria-current={status === s ? "page" : undefined}
            onClick={() => void setFilter({ status: s })}
          >
            {label}
            <span className="rounded-full bg-admin-canvas px-1.5 text-xs font-medium tabular-nums text-admin-muted">
              {n}
            </span>
          </button>
        ))}
        actions={
          <a href={csvHref} className="admin-btn admin-btn-primary">
            <Download className="h-4 w-4" /> Xuất CSV
          </a>
        }
      />

      <div className="flex-1 p-4 lg:p-6">
        <div className="admin-card">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4">
            {checked.size > 0 ? (
              <>
                <span className="rounded-full bg-admin-blue-soft px-4 py-2 text-sm font-medium text-admin-blue">
                  Đã chọn {checked.size}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="admin-pill" disabled={bulk.isPending}>
                    Đổi trạng thái <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {ENQUIRY_STATUSES.map((s) => (
                      <DropdownMenuItem key={s} onSelect={() => bulk.mutate({ status: s })}>
                        <StatusTag status={s} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  className="admin-pill text-[#b42318]"
                  disabled={bulk.isPending}
                  onClick={() => {
                    if (window.confirm(`Xóa vĩnh viễn ${checked.size} yêu cầu đã chọn?`))
                      bulk.mutate({ remove: true });
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Xóa
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-admin-muted hover:text-admin-ink"
                  onClick={() => setChecked(new Set())}
                >
                  Bỏ chọn
                </button>
                {bulk.isPending && <Loader2 className="h-4 w-4 animate-spin text-admin-dim" />}
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger className="admin-pill">
                    <ArrowDownUp className="h-4 w-4" /> Sắp xếp
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {SORT_PRESETS.map((p) => (
                      <DropdownMenuItem key={p.label} onSelect={() => setSort(p.sort)}>
                        {p.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="rounded-full bg-admin-blue-soft px-4 py-2 text-sm font-medium text-admin-blue">
                  {rows.length.toLocaleString("vi-VN")} yêu cầu
                </span>
              </>
            )}
            <label className="relative ml-auto w-full sm:w-80">
              <span className="sr-only">Tìm yêu cầu</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-dim" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Tìm tên, công ty, email, quốc gia…"
                className="admin-input pl-9"
              />
            </label>
          </div>

          {/* Table */}
          <div className="mx-4 overflow-hidden rounded-lg border border-admin-line">
            {query.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-16 text-sm text-admin-dim">
                <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
              </div>
            ) : query.isError ? (
              <p className="p-12 text-center text-sm text-[#b42318]">
                Không tải được dữ liệu. Tải lại trang để thử lần nữa.
              </p>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-admin-canvas">
                  <Inbox className="h-6 w-6 text-admin-dim" />
                </span>
                {filtered ? (
                  <>
                    <p className="font-semibold text-admin-ink">Không có yêu cầu nào khớp bộ lọc</p>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary mt-2"
                      onClick={() => void setFilter({ status: "all", kind: "all", q: "" })}
                    >
                      Xóa bộ lọc
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-admin-ink">Chưa có yêu cầu nào</p>
                    <p className="max-w-sm text-sm text-admin-dim">
                      Khi khách gửi form Liên hệ hoặc Báo giá trên website, yêu cầu sẽ hiện ở đây.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table w-full min-w-[980px]">
                  <thead>
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          className="admin-check align-middle"
                          checked={allOnPage}
                          onChange={togglePage}
                          aria-label="Chọn tất cả trên trang"
                        />
                      </th>
                      <SortHeader label="Khách hàng" k="name" sort={sort} onSort={onSort} />
                      <th>Email</th>
                      <SortHeader label="Quốc gia" k="country" sort={sort} onSort={onSort} />
                      <SortHeader label="Sản phẩm" k="product" sort={sort} onSort={onSort} />
                      <SortHeader label="Nhận lúc" k="created" sort={sort} onSort={onSort} />
                      <SortHeader label="Trạng thái" k="status" sort={sort} onSort={onSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id} onClick={() => setSelectedId(r.id)} className="cursor-pointer">
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="admin-check align-middle"
                            checked={checked.has(r.id)}
                            onChange={() => toggleOne(r.id)}
                            aria-label={`Chọn yêu cầu #${r.id}`}
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={r.name} />
                            {/* Real button so each row is reachable by keyboard. */}
                            <span className="min-w-0 leading-tight">
                              <button
                                type="button"
                                className={`block max-w-[200px] truncate text-left text-admin-ink ${
                                  r.status === "new" ? "font-semibold" : ""
                                }`}
                              >
                                {displayName(r)}
                              </button>
                              <span className="text-xs text-admin-dim">
                                {r.kind === "quote" ? "Yêu cầu báo giá" : "Liên hệ"}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="flex max-w-[200px] items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0 text-admin-dim" />
                            <span className="truncate">{r.email}</span>
                          </span>
                        </td>
                        <td className="max-w-[180px] truncate">{r.country || "—"}</td>
                        <td className="max-w-[180px] truncate">{r.product || "—"}</td>
                        <td className="whitespace-nowrap tabular-nums">{fmtDate(r.created_at)}</td>
                        <td>
                          <StatusTag status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <span className="text-sm text-admin-text">
              Trang {currentPage} / {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="page-size">
                Số dòng mỗi trang
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="admin-input w-20 px-3"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Trước
              </button>
              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-admin-blue px-3 text-sm font-semibold text-admin-blue">
                {currentPage}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
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
    </>
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
      <div className="flex items-start gap-4 border-b border-admin-line px-6 pb-6 pt-8">
        <Avatar name={e.name} size="lg" />
        <div className="min-w-0">
          <SheetTitle className="truncate text-xl font-semibold text-admin-ink">
            {displayName(e)}
          </SheetTitle>
          <SheetDescription className="mt-0.5 text-sm text-admin-dim">
            #{e.id} · {e.kind === "quote" ? "Yêu cầu báo giá" : "Liên hệ"} · {fmtDate(e.created_at)}
          </SheetDescription>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusTag status={e.status} />
            <a
              href={`mailto:${e.email}?subject=${replySubject}`}
              className="admin-btn admin-btn-primary h-9 px-3"
            >
              <Mail className="h-4 w-4" /> Trả lời qua email
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6">
        <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-3 text-sm">
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
            <p className="whitespace-pre-wrap rounded-lg border border-admin-line bg-admin-row p-4 text-sm leading-relaxed text-admin-ink">
              {e.message}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto grid gap-4 border-t border-admin-line bg-admin-row px-6 py-6">
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
            className="admin-btn admin-btn-primary"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
          </button>
          {save.isSuccess && <span className="text-sm text-[#067647]">Đã lưu thay đổi</span>}
          <button
            type="button"
            className="admin-btn admin-btn-danger ml-auto"
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
