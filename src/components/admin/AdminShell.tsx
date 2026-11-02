import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CalendarClock,
  LayoutDashboard,
  ShieldAlert,
  ChevronLeft,
  ExternalLink,
  History,
  Images,
  Settings,
  UserCog,
  UserRound,
  Globe,
  Inbox,
  LogOut,
  Menu,
  MessagesSquare,
  Newspaper,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationsSeen,
  type AdminNotification,
  type NotificationKind,
} from "@/functions/overview";
import { adminLogout } from "@/functions/admin";
import { businessConfig } from "@/config/business";
import { ROLE_LABEL, canAccess, homeFor, type Area, type Role } from "@/lib/roles";

const colourLogo = `${import.meta.env.BASE_URL}lean-export-logo.png`;
const siteHref = import.meta.env.BASE_URL;
const COLLAPSE_KEY = "admin-sidebar-collapsed";

/** The signed-in admin, as the shell needs it. */
export interface ShellUser {
  name: string;
  email: string;
  role: Role;
}

/** Lets the top bar open the mobile sidebar and show who is signed in. */
const ShellContext = createContext<{ openMenu: () => void; user: ShellUser | null }>({
  openMenu: () => {},
  user: null,
});

function useLogout() {
  const router = useRouter();
  return async () => {
    await adminLogout();
    await router.invalidate();
  };
}

/* ------------------------------------------------------------------ avatar */

const AVATAR_TONES = [
  "bg-[#eff4ff] text-[#155eef]",
  "bg-[#fef6ee] text-[#b93815]",
  "bg-[#ecfdf3] text-[#067647]",
  "bg-[#f4f3ff] text-[#5925dc]",
  "bg-[#fdf2fa] text-[#c11574]",
  "bg-[#fffaeb] text-[#b54708]",
  "bg-[#f0f9ff] text-[#026aa2]",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return (first + last).toUpperCase();
}

/** Initials in a pastel circle, colour picked from the name (like GHL contacts). */
export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${tone} ${
        size === "lg" ? "h-14 w-14 text-lg" : "h-8 w-8 text-xs"
      }`}
    >
      {initials(name)}
    </span>
  );
}

/* ---------------------------------------------------------- notifications */

const NOTIF_ICON: Record<NotificationKind, typeof Inbox> = {
  enquiry: Inbox,
  chat: MessagesSquare,
  post_live: Newspaper,
  post_soon: CalendarClock,
  security: ShieldAlert,
};

const NOTIF_TONE: Record<NotificationKind, string> = {
  enquiry: "bg-admin-blue-soft text-admin-blue",
  chat: "bg-[#ecfdf3] text-[#067647]",
  post_live: "bg-[#f4f3ff] text-[#5925dc]",
  post_soon: "bg-[#f4f3ff] text-[#5925dc]",
  security: "bg-[#fef3f2] text-[#b42318]",
};

/** "5 phút trước", "3 giờ trước", then the date and time. */
export function timeAgo(iso: string, now = Date.now()) {
  const diff = now - Date.parse(iso);
  const min = Math.round(diff / 60_000);
  if (diff < 0) return "sắp tới";
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  if (min < 24 * 60) return `${Math.round(min / 60)} giờ trước`;
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Bell in the top bar: new enquiries, chats waiting, scheduled posts, sign-in warnings. */
function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 30_000,
  });
  const items = query.data?.items ?? [];
  const unread = query.data?.unreadCount ?? 0;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // Closing marks what was shown as seen; the dots stay visible while the panel is open.
    if (!next && unread > 0)
      void markNotificationsSeen().then(() =>
        qc.invalidateQueries({ queryKey: ["notifications"] }),
      );
  };

  const go = (n: AdminNotification) => {
    onOpenChange(false);
    if (n.to === "/admin") void navigate({ to: "/admin", search: { status: "new" } });
    else void navigate({ to: n.to });
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={unread ? `Thông báo, ${unread} chưa xem` : "Thông báo"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-admin-text outline-none hover:bg-admin-row focus-visible:ring-4 focus-visible:ring-admin-blue/20"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#d92d20] px-1 text-[11px] font-semibold leading-[18px] text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(380px,calc(100vw-24px))] p-0">
        <div className="flex items-center justify-between border-b border-admin-line px-4 py-3">
          <p className="text-sm font-semibold text-admin-ink">Thông báo</p>
          {unread > 0 && <span className="text-xs text-admin-dim">{unread} chưa xem</span>}
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto h-6 w-6 text-admin-dim" />
            <p className="mt-2 text-sm text-admin-muted">Không có việc gì đang chờ bạn.</p>
          </div>
        ) : (
          <ul className="max-h-[min(440px,70vh)] overflow-y-auto py-1">
            {items.map((n) => {
              const Icon = NOTIF_ICON[n.kind];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => go(n)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-admin-row focus-visible:bg-admin-row focus-visible:outline-none"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${NOTIF_TONE[n.kind]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm leading-snug ${n.unread ? "font-semibold text-admin-ink" : "text-admin-text"}`}
                      >
                        {n.title}
                      </span>
                      {n.detail && (
                        <span className="mt-0.5 block truncate text-xs text-admin-muted">
                          {n.detail}
                        </span>
                      )}
                      <span className="mt-0.5 block text-xs text-admin-dim">{timeAgo(n.at)}</span>
                    </span>
                    {n.unread && (
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-admin-blue"
                        aria-label="Chưa xem"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* --------------------------------------------------------------- top bars */

export function AdminTopbar({
  title,
  tabs,
  mobileTabs = true,
}: {
  title: string;
  tabs?: ReactNode;
  /** Show the tabs as an extra row on phones (off when there is only one tab). */
  mobileTabs?: boolean;
}) {
  const { openMenu, user } = useContext(ShellContext);
  const logout = useLogout();
  return (
    <header className="sticky top-0 z-30 border-b border-admin-line bg-white">
      <div className="flex h-16 items-center gap-4 px-4 lg:gap-8 lg:px-6">
        <button
          type="button"
          onClick={openMenu}
          aria-label="Mở menu"
          className="-ml-1 rounded-lg p-2 text-admin-text hover:bg-admin-row lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="shrink-0 text-xl font-semibold text-admin-ink">{title}</h1>
        {tabs && (
          <nav className="hidden h-full items-stretch gap-8 overflow-x-auto md:flex">{tabs}</nav>
        )}
        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <a
            href={siteHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Xem website"
            aria-label="Xem website"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#17b26a] text-white hover:brightness-95"
          >
            <Globe className="h-5 w-5" />
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Tài khoản"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#b692f6] text-sm font-semibold text-white outline-none hover:brightness-95 focus-visible:ring-4 focus-visible:ring-[#b692f6]/30"
            >
              {initials(user?.name ?? "")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate font-semibold text-admin-ink">{user?.name}</span>
                <span className="block truncate text-xs text-admin-dim">{user?.email}</span>
                {user && (
                  <span className="mt-1.5 inline-flex rounded-full bg-admin-blue-soft px-2 py-0.5 text-xs font-medium text-admin-blue">
                    {ROLE_LABEL[user.role]}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/account">
                  <UserRound className="mr-2 h-4 w-4" /> Tài khoản của tôi
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={siteHref} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Xem website
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {tabs && mobileTabs && (
        <nav className="flex h-11 items-stretch gap-6 overflow-x-auto border-t border-admin-line px-4 [scrollbar-width:none] md:hidden">
          {tabs}
        </nav>
      )}
    </header>
  );
}

/** Second bar ("All + Add" in GHL): smart-list tabs on the left, page actions on the right. */
export function AdminSubbar({ tabs, actions }: { tabs: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-h-14 items-stretch justify-between gap-x-2 border-b border-admin-line bg-white pl-1 pr-3 sm:min-h-16 lg:px-4">
      {/* Tabs scroll sideways on phones so the actions stay on the same row. */}
      <nav className="-mb-px flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none]">
        {tabs}
      </nav>
      {actions && <div className="flex shrink-0 items-center gap-3 py-2">{actions}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- sidebar */

function SidebarBody({
  collapsed,
  newCount,
  chatUnread,
  role,
  onNavigate,
  onToggle,
}: {
  collapsed: boolean;
  newCount: number;
  chatUnread: number;
  role: Role;
  onNavigate?: () => void;
  onToggle?: () => void;
}) {
  const navigate = useNavigate();
  const logout = useLogout();
  const searchRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    void navigate({ to: "/admin", search: q ? { q } : {} });
    setTerm("");
    searchRef.current?.blur();
    onNavigate?.();
  };

  const canSearch = canAccess(role, "enquiries");
  type Item = {
    to:
      | "/admin/overview"
      | "/admin"
      | "/admin/chats"
      | "/admin/news"
      | "/admin/media"
      | "/admin/users"
      | "/admin/activity"
      | "/admin/settings";
    label: string;
    icon: typeof Inbox;
    exact: boolean;
    badge: number;
    /** Null: every signed-in user. */
    area: Area | null;
  };
  const work: Item[] = [
    {
      to: "/admin/overview",
      label: "Tổng quan",
      icon: LayoutDashboard,
      exact: true,
      badge: 0,
      area: null,
    },
    {
      to: "/admin",
      label: "Yêu cầu báo giá",
      icon: Inbox,
      exact: true,
      badge: newCount,
      area: "enquiries",
    },
    {
      to: "/admin/chats",
      label: "Hội thoại",
      icon: MessagesSquare,
      exact: false,
      badge: chatUnread,
      area: "chats",
    },
    { to: "/admin/news", label: "Tin tức", icon: Newspaper, exact: false, badge: 0, area: "posts" },
    {
      to: "/admin/media",
      label: "Thư viện ảnh",
      icon: Images,
      exact: false,
      badge: 0,
      area: "media",
    },
  ];
  const manage: Item[] = [
    {
      to: "/admin/users",
      label: "Tài khoản",
      icon: UserCog,
      exact: false,
      badge: 0,
      area: "users",
    },
    {
      to: "/admin/settings",
      label: "Cài đặt website",
      icon: Settings,
      exact: false,
      badge: 0,
      area: "settings",
    },
    {
      to: "/admin/activity",
      label: "Nhật ký hoạt động",
      icon: History,
      exact: false,
      badge: 0,
      area: "audit",
    },
  ];
  const visible = (list: Item[]) => list.filter((i) => !i.area || canAccess(role, i.area));

  const renderItem = (item: Item) => (
    <Link
      key={item.to}
      to={item.to}
      activeOptions={{ exact: item.exact, includeSearch: false }}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`admin-side-link ${collapsed ? "relative justify-center px-0" : ""}`}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && item.label}
      {item.badge > 0 &&
        (collapsed ? (
          <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-primary" />
        ) : (
          <span
            className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-admin-ink"
            title={`${item.badge} mục mới`}
          >
            {item.badge}
          </span>
        ))}
    </Link>
  );

  return (
    <div className="flex h-full flex-col px-3 pb-4 pt-5 text-[#e4e7ec]">
      {/* Logo tile */}
      <Link
        to={homeFor(role)}
        onClick={onNavigate}
        className={`mx-auto mb-5 flex items-center justify-center rounded bg-white ${
          collapsed ? "h-11 w-11" : "h-14 w-36"
        }`}
      >
        {collapsed ? (
          <img src={`${siteHref}favicon.svg`} alt={businessConfig.logoAlt} className="h-7 w-7" />
        ) : (
          <img src={colourLogo} alt={businessConfig.logoAlt} className="h-6 w-auto" />
        )}
      </Link>

      {/* Business card (GHL's sub-account switcher) */}
      {!collapsed && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-admin-side-2 px-3 py-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-white">
              {businessConfig.businessName}
            </span>
            <span className="block truncate text-xs text-[#98a2b3]">
              {businessConfig.address}, {businessConfig.city}
            </span>
          </span>
        </div>
      )}

      {/* Search (enquiries) */}
      {!canSearch ? null : collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Tìm kiếm"
          className="admin-side-link mb-5 justify-center px-0"
        >
          <Search className="h-5 w-5" />
        </button>
      ) : (
        <form onSubmit={submitSearch} role="search" className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
          <input
            ref={searchRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Tìm yêu cầu"
            aria-label="Tìm yêu cầu báo giá"
            className="h-10 w-full rounded-lg border border-admin-side-line bg-admin-side-2 pl-9 pr-14 text-sm text-white outline-none placeholder:text-[#98a2b3] focus:border-[#84adff]"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/10 px-1.5 py-0.5 font-sans text-[11px] text-[#d0d5dd]">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </form>
      )}

      <nav className="grid gap-1">{visible(work).map(renderItem)}</nav>

      {visible(manage).length > 0 && (
        <>
          {!collapsed && (
            <p className="mb-1 mt-5 px-3 text-xs font-medium text-[#98a2b3]">Quản trị hệ thống</p>
          )}
          {collapsed && <div className="my-3 border-t border-admin-side-line" />}
          <nav className="grid gap-1">{visible(manage).map(renderItem)}</nav>
        </>
      )}

      <div className="my-4 border-t border-admin-side-line" />

      <a
        href={siteHref}
        target="_blank"
        rel="noopener noreferrer"
        title={collapsed ? "Xem website" : undefined}
        className={`admin-side-link ${collapsed ? "justify-center px-0" : ""}`}
      >
        <Globe className="h-5 w-5 shrink-0" />
        {!collapsed && "Xem website"}
      </a>

      <button
        type="button"
        onClick={logout}
        title={collapsed ? "Đăng xuất" : undefined}
        className={`admin-side-link mt-auto w-full text-left ${collapsed ? "justify-center px-0" : ""}`}
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {!collapsed && "Đăng xuất"}
      </button>
    </div>
  );
}

export function AdminFrame({
  user,
  newCount,
  chatUnread,
  children,
}: {
  user: ShellUser;
  newCount: number;
  chatUnread: number;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });

  return (
    <ShellContext.Provider value={{ openMenu: () => setMenuOpen(true), user }}>
      <div className="flex min-h-screen bg-admin-canvas text-admin-ink">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 bg-admin-side transition-[width] duration-200 lg:block ${
            collapsed ? "w-[76px]" : "w-60"
          }`}
        >
          <SidebarBody
            collapsed={collapsed}
            newCount={newCount}
            chatUnread={chatUnread}
            role={user.role}
            onToggle={toggle}
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            className="absolute -right-3 bottom-6 inline-flex h-6 w-6 items-center justify-center rounded-full border border-admin-line bg-white text-admin-text shadow-sm hover:bg-admin-row"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </aside>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-64 border-0 bg-admin-side p-0 text-white">
            <SheetTitle className="sr-only">Menu quản trị</SheetTitle>
            <SidebarBody
              collapsed={false}
              newCount={newCount}
              chatUnread={chatUnread}
              role={user.role}
              onNavigate={() => setMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ShellContext.Provider>
  );
}
