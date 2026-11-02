import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { History, Loader2, Search } from "lucide-react";
import { AdminSubbar, AdminTopbar } from "@/components/admin/AdminShell";
import { listAudit } from "@/functions/admin";
import { ACTION_LABEL } from "@/lib/audit-labels";

export const Route = createFileRoute("/admin/activity")({
  component: ActivityPage,
});

type Group = "all" | "auth" | "users" | "enquiries" | "posts" | "chats" | "settings";

const GROUPS: { value: Group; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "auth", label: "Đăng nhập" },
  { value: "users", label: "Tài khoản" },
  { value: "enquiries", label: "Yêu cầu" },
  { value: "posts", label: "Tin tức" },
  { value: "chats", label: "Hội thoại" },
  { value: "settings", label: "Cài đặt" },
];

const tone = (action: string) =>
  action.endsWith(".delete")
    ? "bg-[#fef3f2] text-[#b42318]"
    : action === "login" || action === "logout"
      ? "bg-admin-canvas text-admin-muted"
      : action.startsWith("user.") || action.startsWith("account.")
        ? "bg-[#f4f3ff] text-[#5925dc]"
        : "bg-admin-blue-soft text-admin-blue";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

function ActivityPage() {
  const [group, setGroup] = useState<Group>("all");
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => setQ(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term]);
  useEffect(() => setPage(1), [group, q]);

  const query = useQuery({
    queryKey: ["audit", group, q, page],
    queryFn: () => listAudit({ data: { group, q, page } }),
    placeholderData: keepPreviousData,
  });
  const rows = query.data?.rows ?? [];

  return (
    <>
      <AdminTopbar title="Nhật ký hoạt động" />
      <AdminSubbar
        tabs={GROUPS.map((g) => (
          <button
            key={g.value}
            type="button"
            className="admin-subtab"
            aria-current={group === g.value ? "page" : undefined}
            onClick={() => setGroup(g.value)}
          >
            {g.label}
          </button>
        ))}
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="admin-card">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <p className="text-sm text-admin-muted">
              Ai đã làm gì trong trang quản trị, mới nhất ở trên.
            </p>
            <label className="relative ml-auto w-full sm:w-80">
              <span className="sr-only">Tìm trong nhật ký</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-dim" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Tìm người, đối tượng, chi tiết…"
                className="admin-input pl-9"
              />
            </label>
          </div>
          <div className="mx-4 mb-4 overflow-hidden rounded-lg border border-admin-line">
            {query.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-sm text-admin-dim">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <History className="h-7 w-7 text-admin-dim" />
                <p className="font-semibold text-admin-ink">Chưa có hoạt động nào khớp bộ lọc</p>
              </div>
            ) : (
              <ul className="divide-y divide-admin-line">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span className="w-40 shrink-0 text-xs tabular-nums text-admin-dim">
                      {fmt(r.created_at)}
                    </span>
                    <span className="w-40 shrink-0 truncate text-sm font-medium text-admin-ink">
                      {r.user_name ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-admin-text">
                      <span
                        className={`mr-2 inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${tone(r.action)}`}
                      >
                        {ACTION_LABEL[r.action] ?? r.action}
                      </span>
                      {r.target && <span className="font-medium">{r.target}</span>}
                      {r.detail && (
                        <span className="text-admin-muted">
                          {r.target ? ": " : ""}
                          {r.detail}
                        </span>
                      )}
                    </span>
                    {r.ip && (
                      <span className="shrink-0 text-xs tabular-nums text-admin-dim">{r.ip}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 px-4 pb-4">
            <span className="text-sm text-admin-text">Trang {page}</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={!query.data?.hasMore}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
