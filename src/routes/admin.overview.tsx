import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronRight,
  FilePen,
  Inbox,
  Loader2,
  MessagesSquare,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AdminTopbar, Avatar, timeAgo } from "@/components/admin/AdminShell";
import { getOverview } from "@/functions/overview";
import { ACTION_LABEL } from "@/lib/audit-labels";

export const Route = createFileRoute("/admin/overview")({
  component: OverviewPage,
});

type Overview = Awaited<ReturnType<typeof getOverview>>;

function greeting() {
  const h = Number(
    new Date().toLocaleString("en-GB", { hour: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }),
  );
  return h < 11
    ? "Chào buổi sáng"
    : h < 14
      ? "Chào buổi trưa"
      : h < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";
}

const firstName = (name: string) => name.trim().split(/\s+/).pop() ?? name;

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function OverviewPage() {
  const query = useQuery({
    queryKey: ["overview"],
    queryFn: () => getOverview(),
    refetchInterval: 60_000,
  });
  const data = query.data;

  return (
    <>
      <AdminTopbar title="Tổng quan" />
      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-5 p-4 lg:p-6">
        {!data ? (
          <div className="flex items-center gap-2 py-16 text-sm text-admin-dim">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-admin-ink">
                {greeting()}, {firstName(data.me.name)}
              </h2>
              <p className="text-sm text-admin-muted">{summaryLine(data)}</p>
            </div>

            <Numbers data={data} />

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <TodoCard data={data} />
              <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
                {data.enquiries && <EnquiryChart daily={data.enquiries.daily} />}
                {data.posts && <UpcomingCard posts={data.posts.upcoming} />}
              </div>
            </div>

            {data.security && (
              <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <ActivityCard rows={data.activity} />
                <SecurityCard data={data} />
              </div>
            )}
            {!data.security && !data.me.twoFactor && <TwoFactorNudge />}
          </>
        )}
      </main>
    </>
  );
}

/** One sentence on what is waiting, so the page answers "what now?" before the numbers. */
function summaryLine(d: Overview) {
  const parts: string[] = [];
  if (d.enquiries?.newCount) parts.push(`${d.enquiries.newCount} yêu cầu mới`);
  if (d.chats?.unreadCount) parts.push(`${d.chats.unreadCount} hội thoại chờ trả lời`);
  if (d.posts?.upcoming.length) parts.push(`${d.posts.upcoming.length} bài đang hẹn giờ`);
  return parts.length ? `Đang chờ bạn: ${parts.join(", ")}.` : "Không có việc gì đang chờ.";
}

/* ---------------------------------------------------------------- numbers */

function Numbers({ data }: { data: Overview }) {
  const cells: {
    label: string;
    value: number;
    note?: string;
    to: "/admin" | "/admin/chats" | "/admin/news";
    search?: { status: "new" | "won" };
  }[] = [];
  const e = data.enquiries;
  if (e) {
    const delta = e.last30 - e.prev30;
    cells.push(
      {
        label: "Yêu cầu mới",
        value: e.newCount,
        note: "chưa xử lý",
        to: "/admin",
        search: { status: "new" },
      },
      {
        label: "Yêu cầu 30 ngày",
        value: e.last30,
        note:
          delta === 0
            ? "bằng 30 ngày trước"
            : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} so với 30 ngày trước`,
        to: "/admin",
      },
      { label: "Chốt đơn 30 ngày", value: e.won30, to: "/admin", search: { status: "won" } },
    );
  }
  if (data.chats)
    cells.push({
      label: "Hội thoại chờ",
      value: data.chats.unreadCount,
      note: `${data.chats.open} đang mở`,
      to: "/admin/chats",
    });
  if (data.posts)
    cells.push(
      { label: "Bài đã đăng", value: data.posts.published, to: "/admin/news" },
      { label: "Bài nháp", value: data.posts.drafts, to: "/admin/news" },
    );

  return (
    <section
      aria-label="Số liệu chính"
      className="admin-card grid grid-cols-2 overflow-hidden sm:grid-cols-3 xl:auto-cols-fr xl:grid-flow-col xl:grid-cols-none"
    >
      {cells.map((c) => (
        <Link
          key={c.label}
          to={c.to}
          search={c.search ?? {}}
          className="group -mb-px -mr-px border-b border-r border-admin-line px-4 py-4 hover:bg-admin-row lg:px-5"
        >
          <p className="text-[13px] text-admin-muted">{c.label}</p>
          <p className="mt-1 text-[28px] font-semibold leading-none tabular-nums text-admin-ink">
            {c.value.toLocaleString("vi-VN")}
          </p>
          {c.note && <p className="mt-1.5 text-xs text-admin-dim">{c.note}</p>}
        </Link>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ to-do */

function CardHead({
  title,
  to,
  linkLabel,
}: {
  title: string;
  to?: "/admin" | "/admin/chats" | "/admin/news" | "/admin/activity";
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-admin-line px-4 py-3 lg:px-5">
      <h3 className="text-[15px] font-semibold text-admin-ink">{title}</h3>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-0.5 text-sm font-medium text-admin-blue hover:underline"
        >
          {linkLabel} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function TodoCard({ data }: { data: Overview }) {
  const enquiries = data.enquiries?.recent ?? [];
  const chats = data.chats?.waiting ?? [];
  const drafts = data.posts?.myDrafts ?? [];
  const empty = !enquiries.length && !chats.length && !drafts.length;

  return (
    <section className="admin-card">
      <CardHead title="Cần xử lý" />
      {empty ? (
        <div className="px-5 py-12 text-center">
          <ShieldCheck className="mx-auto h-7 w-7 text-[#17b26a]" />
          <p className="mt-2 text-sm font-medium text-admin-ink">Đã xử lý hết</p>
          <p className="text-sm text-admin-muted">
            Yêu cầu mới, hội thoại chờ trả lời và bài nháp sẽ hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-admin-line">
          {enquiries.length > 0 && (
            <TodoGroup
              icon={Inbox}
              title="Yêu cầu mới"
              more={
                data.enquiries!.newCount > enquiries.length
                  ? { label: `Xem cả ${data.enquiries!.newCount} yêu cầu`, to: "/admin" }
                  : undefined
              }
            >
              {enquiries.map((e) => (
                <TodoRow
                  key={e.id}
                  to="/admin"
                  search={{ q: e.name }}
                  avatar={e.name}
                  title={e.company ? `${e.name}, ${e.company}` : e.name}
                  detail={[e.kind === "quote" ? "Báo giá" : "Liên hệ", e.product, e.country]
                    .filter(Boolean)
                    .join(", ")}
                  at={e.created_at}
                />
              ))}
            </TodoGroup>
          )}
          {chats.length > 0 && (
            <TodoGroup icon={MessagesSquare} title="Hội thoại chờ trả lời">
              {chats.map((c) => (
                <TodoRow
                  key={c.id}
                  to="/admin/chats"
                  avatar={c.name || "Khách"}
                  title={c.name || "Khách chưa để tên"}
                  detail={c.last ?? ""}
                  at={c.updated_at}
                  badge={c.channel === "voice" ? <Phone className="h-3.5 w-3.5" /> : c.unread}
                />
              ))}
            </TodoGroup>
          )}
          {drafts.length > 0 && (
            <TodoGroup icon={FilePen} title="Bài nháp đang viết dở">
              {drafts.map((p) => (
                <TodoRow
                  key={p.id}
                  to="/admin/news/$id"
                  params={{ id: String(p.id) }}
                  title={p.title_vi || "(Chưa có tiêu đề)"}
                  detail="Sửa lần cuối"
                  at={p.updated_at}
                />
              ))}
            </TodoGroup>
          )}
        </div>
      )}
    </section>
  );
}

function TodoGroup({
  icon: Icon,
  title,
  more,
  children,
}: {
  icon: typeof Inbox;
  title: string;
  more?: { label: string; to: "/admin" } | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <p className="flex items-center gap-2 px-4 pb-1 pt-1.5 text-[13px] font-medium text-admin-muted lg:px-5">
        <Icon className="h-4 w-4" /> {title}
      </p>
      <ul>{children}</ul>
      {more && (
        <Link
          to={more.to}
          search={{ status: "new" }}
          className="mx-4 mt-1 inline-flex items-center gap-0.5 text-sm font-medium text-admin-blue hover:underline lg:mx-5"
        >
          {more.label} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function TodoRow({
  to,
  search,
  params,
  avatar,
  title,
  detail,
  at,
  badge,
}: {
  to: "/admin" | "/admin/chats" | "/admin/news/$id";
  search?: { q: string };
  params?: { id: string };
  avatar?: string;
  title: string;
  detail: string;
  at: string;
  badge?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        {...(search ? { search } : {})}
        {...(params ? { params } : {})}
        className="flex items-center gap-3 px-4 py-2 hover:bg-admin-row lg:px-5"
      >
        {avatar ? (
          <Avatar name={avatar} />
        ) : (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-row text-admin-muted">
            <FilePen className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-admin-ink">{title}</span>
          <span className="block truncate text-xs text-admin-muted">{detail}</span>
        </span>
        {badge !== undefined && badge !== 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-admin-blue-soft px-1.5 text-xs font-semibold text-admin-blue">
            {badge}
          </span>
        )}
        <span className="shrink-0 text-xs text-admin-dim">{timeAgo(at)}</span>
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------ chart */

/** Enquiries per day, last 14 days: one series, so no legend; hover or focus a bar for its value. */
function EnquiryChart({ daily }: { daily: { day: string; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.n));
  const total = daily.reduce((s, d) => s + d.n, 0);
  const label = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
  const shown = hover ?? null;

  return (
    <section className="admin-card">
      <CardHead title="Yêu cầu 14 ngày qua" to="/admin" linkLabel="Danh sách" />
      <div className="px-4 pb-4 pt-3 lg:px-5">
        <p className="text-sm text-admin-muted" aria-live="polite">
          {shown === null ? (
            <>
              Tổng <span className="font-semibold text-admin-ink">{total}</span> yêu cầu (không tính
              spam)
            </>
          ) : (
            <>
              {label(daily[shown]!.day)}:{" "}
              <span className="font-semibold text-admin-ink">{daily[shown]!.n}</span> yêu cầu
            </>
          )}
        </p>
        <div className="relative mt-3 h-32" onMouseLeave={() => setHover(null)}>
          <span className="absolute -top-1 right-0 text-[11px] tabular-nums text-admin-dim">
            {max}
          </span>
          <div className="absolute inset-x-0 top-1 border-t border-dashed border-admin-line" />
          <div className="absolute inset-0 flex items-end gap-[2px] border-b border-admin-field">
            {daily.map((d, i) => (
              <button
                key={d.day}
                type="button"
                aria-label={`${label(d.day)}: ${d.n} yêu cầu`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="group flex h-full flex-1 items-end outline-none"
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-colors ${
                    hover === i ? "bg-admin-blue-dark" : "bg-admin-blue"
                  } ${d.n === 0 ? "opacity-0" : ""} group-focus-visible:ring-2 group-focus-visible:ring-admin-blue/30`}
                  style={{ height: `${Math.max(d.n ? 4 : 0, (d.n / max) * 92)}%` }}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-admin-dim">
          <span>{label(daily[0]!.day)}</span>
          <span>{label(daily[7]!.day)}</span>
          <span>Hôm nay</span>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- schedule */

function UpcomingCard({ posts }: { posts: NonNullable<Overview["posts"]>["upcoming"] }) {
  return (
    <section className="admin-card">
      <CardHead title="Lịch đăng bài" to="/admin/news" linkLabel="Tin tức" />
      {posts.length === 0 ? (
        <p className="px-4 py-5 text-sm text-admin-muted lg:px-5">
          Chưa có bài nào hẹn giờ. Trong trình soạn bài, chọn mũi tên cạnh nút Đăng rồi chọn "Hẹn
          giờ đăng…".
        </p>
      ) : (
        <ul className="divide-y divide-admin-line">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                to="/admin/news/$id"
                params={{ id: String(p.id) }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-admin-row lg:px-5"
              >
                <CalendarClock className="h-4 w-4 shrink-0 text-[#5925dc]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-admin-ink">
                    {p.title_vi}
                  </span>
                  <span className="block text-xs text-admin-muted">
                    {fmtDateTime(p.published_at!)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------------------------------------------------- admin-only */

function ActivityCard({ rows }: { rows: Overview["activity"] }) {
  return (
    <section className="admin-card">
      <CardHead title="Hoạt động gần đây" to="/admin/activity" linkLabel="Nhật ký" />
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm text-admin-muted lg:px-5">Chưa có hoạt động nào.</p>
      ) : (
        <ul className="divide-y divide-admin-line">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
              <Avatar name={r.user_name ?? "?"} />
              <p className="min-w-0 flex-1 truncate text-sm text-admin-text">
                <span className="font-medium text-admin-ink">{r.user_name ?? "Hệ thống"}</span>{" "}
                {(ACTION_LABEL[r.action] ?? r.action).toLowerCase()}
                {r.target && <span className="text-admin-muted">: {r.target}</span>}
              </p>
              <span className="shrink-0 text-xs text-admin-dim">{timeAgo(r.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SecurityCard({ data }: { data: Overview }) {
  const s = data.security!;
  const ok = data.me.twoFactor && s.failedLogins24h < 5;
  return (
    <section className="admin-card">
      <CardHead title="Bảo mật" />
      <ul className="grid gap-3 px-4 py-4 text-sm lg:px-5">
        <li className="flex items-start gap-2.5">
          {data.me.twoFactor ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#17b26a]" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#dc6803]" />
          )}
          <span className="text-admin-text">
            {data.me.twoFactor ? (
              "Tài khoản của bạn đã bật xác thực 2 lớp."
            ) : (
              <>
                Tài khoản của bạn chưa bật xác thực 2 lớp.{" "}
                <Link to="/admin/account" className="font-medium text-admin-blue hover:underline">
                  Bật ngay
                </Link>
              </>
            )}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          {s.usersWithout2fa === 0 ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#17b26a]" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#dc6803]" />
          )}
          <span className="text-admin-text">
            {s.usersWithout2fa === 0 ? (
              "Mọi tài khoản đều đã bật 2 lớp."
            ) : (
              <>
                {s.usersWithout2fa} tài khoản chưa bật 2 lớp.{" "}
                <Link to="/admin/users" className="font-medium text-admin-blue hover:underline">
                  Xem danh sách
                </Link>
              </>
            )}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          {s.failedLogins24h < 5 ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#17b26a]" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#d92d20]" />
          )}
          <span className="text-admin-text">
            {s.failedLogins24h} lần đăng nhập sai trong 24 giờ qua
            {s.failedLogins24h >= 5 &&
              ". Email nào sai 5 lần trong 15 phút sẽ bị tạm khóa đăng nhập."}
          </span>
        </li>
      </ul>
      {ok && <span className="sr-only">Không có cảnh báo bảo mật.</span>}
    </section>
  );
}

function TwoFactorNudge() {
  return (
    <div className="admin-card flex flex-wrap items-center gap-3 px-4 py-3 lg:px-5">
      <ShieldAlert className="h-5 w-5 text-[#dc6803]" />
      <p className="min-w-0 flex-1 text-sm text-admin-text">
        Bật xác thực 2 lớp để lộ mật khẩu vẫn không ai vào được tài khoản của bạn.
      </p>
      <Link to="/admin/account" className="admin-btn admin-btn-secondary">
        Bật xác thực 2 lớp
      </Link>
    </div>
  );
}
