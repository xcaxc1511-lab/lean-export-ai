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
  Building2,
  ChevronLeft,
  ExternalLink,
  Globe,
  Inbox,
  LogOut,
  Menu,
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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { adminLogout } from "@/functions/admin";
import { businessConfig } from "@/config/business";

const colourLogo = `${import.meta.env.BASE_URL}lean-export-logo.png`;
const siteHref = import.meta.env.BASE_URL;
const COLLAPSE_KEY = "admin-sidebar-collapsed";

/** Lets the top bar open the mobile sidebar that lives in the layout. */
const ShellContext = createContext<{ openMenu: () => void }>({ openMenu: () => {} });

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

/* --------------------------------------------------------------- top bars */

export function AdminTopbar({ title, tabs }: { title: string; tabs?: ReactNode }) {
  const { openMenu } = useContext(ShellContext);
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
              AD
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block font-semibold text-admin-ink">Quản trị viên</span>
                <span className="block text-xs text-admin-dim">{businessConfig.businessName}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
      {tabs && (
        <nav className="flex h-11 items-stretch gap-6 overflow-x-auto border-t border-admin-line px-4 md:hidden">
          {tabs}
        </nav>
      )}
    </header>
  );
}

/** Second bar ("All + Add" in GHL): smart-list tabs on the left, page actions on the right. */
export function AdminSubbar({ tabs, actions }: { tabs: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-h-16 flex-wrap items-stretch justify-between gap-x-4 border-b border-admin-line bg-white px-2 lg:px-4">
      <nav className="-mb-px flex min-h-12 w-full items-stretch overflow-x-auto [scrollbar-width:none] sm:w-auto">
        {tabs}
      </nav>
      {actions && <div className="flex items-center gap-3 px-2 py-3">{actions}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- sidebar */

function SidebarBody({
  collapsed,
  newCount,
  onNavigate,
  onToggle,
}: {
  collapsed: boolean;
  newCount: number;
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

  const items = [
    { to: "/admin", label: "Yêu cầu báo giá", icon: Inbox, exact: true, badge: newCount },
    { to: "/admin/news", label: "Tin tức", icon: Newspaper, exact: false, badge: 0 },
  ] as const;

  return (
    <div className="flex h-full flex-col px-3 pb-4 pt-5 text-[#e4e7ec]">
      {/* Logo tile */}
      <Link
        to="/admin"
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

      {/* Search */}
      {collapsed ? (
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

      <nav className="grid gap-1">
        {items.map((item) => (
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
                  title={`${item.badge} yêu cầu mới`}
                >
                  {item.badge}
                </span>
              ))}
          </Link>
        ))}
      </nav>

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

export function AdminFrame({ newCount, children }: { newCount: number; children: ReactNode }) {
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
    <ShellContext.Provider value={{ openMenu: () => setMenuOpen(true) }}>
      <div className="flex min-h-screen bg-admin-canvas text-admin-ink">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 bg-admin-side transition-[width] duration-200 lg:block ${
            collapsed ? "w-[76px]" : "w-60"
          }`}
        >
          <SidebarBody collapsed={collapsed} newCount={newCount} onToggle={toggle} />
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
              onNavigate={() => setMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ShellContext.Provider>
  );
}
