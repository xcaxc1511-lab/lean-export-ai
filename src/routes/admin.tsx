import { useState, type FormEvent } from "react";
import { Link, Outlet, createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Inbox, Loader2, LogOut, Newspaper } from "lucide-react";
import { adminLogin, adminLogout, getAdminStatus } from "@/functions/admin";
import { DEFAULT_ENQUIRY_FILTERS, listEnquiries } from "@/functions/enquiries";
import { businessConfig } from "@/config/business";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => getAdminStatus(),
  head: () => ({
    meta: [{ title: "Quản trị | Lean Export" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminShell,
});

const colourLogo = `${import.meta.env.BASE_URL}lean-export-logo.png`;

function AdminShell() {
  const { admin } = Route.useRouteContext();
  return admin ? <AdminLayout /> : <LoginScreen />;
}

function LoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("loading");
    try {
      const { ok } = await adminLogin({ data: { password } });
      if (!ok) return setState("error");
      await router.invalidate();
    } catch {
      setState("error");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-admin-canvas px-4 py-16">
      <div className="admin-rings" aria-hidden="true">
        {[440, 640, 860, 1100, 1360].map((size, i) => (
          <span key={size} style={{ width: size, height: size, opacity: 1 - i * 0.18 }} />
        ))}
      </div>
      <form
        onSubmit={submit}
        className="admin-panel relative w-full max-w-sm rounded-3xl p-8 sm:p-10"
      >
        <img src={colourLogo} alt={businessConfig.logoAlt} className="mb-10 h-9 w-auto" />
        <h1 className="mb-1.5 text-2xl font-bold text-admin-ink">Đăng nhập quản trị</h1>
        <p className="mb-8 text-sm text-admin-muted">
          Quản lý yêu cầu báo giá và tin tức của Lean Export.
        </p>
        <label htmlFor="admin-password" className="admin-label mb-5">
          Mật khẩu
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input"
          />
        </label>
        {state === "error" && (
          <p role="alert" className="mb-5 text-sm text-red-600">
            Mật khẩu không đúng. Kiểm tra lại (tắt bộ gõ tiếng Việt) rồi thử lần nữa.
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={state === "loading"}>
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

function AdminLayout() {
  const router = useRouter();
  const enquiries = useQuery({
    queryKey: ["enquiries", DEFAULT_ENQUIRY_FILTERS],
    queryFn: () => listEnquiries({ data: DEFAULT_ENQUIRY_FILTERS }),
  });
  const newCount = enquiries.data?.counts["new"] ?? 0;

  const logout = async () => {
    await adminLogout();
    await router.invalidate();
  };

  const navItems = [
    { to: "/admin", label: "Yêu cầu báo giá", icon: Inbox, exact: true, badge: newCount },
    { to: "/admin/news", label: "Tin tức", icon: Newspaper, exact: false, badge: 0 },
  ] as const;

  const nav = navItems.map((item) => (
    <Link
      key={item.to}
      to={item.to}
      activeOptions={{ exact: item.exact }}
      className="admin-nav-link"
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      {item.label}
      {item.badge > 0 && (
        <span
          className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-admin-ink"
          title={`${item.badge} yêu cầu mới`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  ));

  return (
    <div className="min-h-screen bg-admin-canvas text-admin-ink lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-admin-line bg-white px-4 py-6 lg:flex">
        <Link to="/admin" className="mb-10 block px-2">
          <img src={colourLogo} alt={businessConfig.logoAlt} className="h-8 w-auto" />
        </Link>
        <nav className="grid gap-1">{nav}</nav>
        <div className="mt-auto grid gap-1 border-t border-admin-line pt-4">
          <a
            href={import.meta.env.BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-nav-link"
          >
            <ExternalLink className="h-[18px] w-[18px]" /> Xem website
          </a>
          <button type="button" onClick={logout} className="admin-nav-link w-full text-left">
            <LogOut className="h-[18px] w-[18px]" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-admin-line bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/admin">
            <img src={colourLogo} alt={businessConfig.logoAlt} className="h-7 w-auto" />
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="Đăng xuất"
            className="rounded-full p-2 text-admin-muted hover:bg-admin-row hover:text-admin-ink"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">{nav}</nav>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
