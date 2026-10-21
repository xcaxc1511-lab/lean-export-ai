import { useState, type FormEvent } from "react";
import { Link, Outlet, createFileRoute, useRouter } from "@tanstack/react-router";
import { ExternalLink, Inbox, Loader2, Lock, LogOut, Newspaper } from "lucide-react";
import { adminLogin, adminLogout, getAdminStatus } from "@/functions/admin";
import { businessConfig } from "@/config/business";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => getAdminStatus(),
  head: () => ({
    meta: [{ title: "Quản trị | Lean Export" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminShell,
});

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
    <div className="flex min-h-screen items-center justify-center bg-brand-ink px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl shadow-black/30"
      >
        <img
          src={`${import.meta.env.BASE_URL}lean-export-logo.png`}
          alt={businessConfig.logoAlt}
          className="mb-8 h-8 w-auto"
        />
        <h1 className="mb-1 flex items-center gap-2 text-xl font-bold text-gray-900">
          <Lock className="h-5 w-5" /> Đăng nhập quản trị
        </h1>
        <p className="mb-6 text-sm text-gray-500">Chỉ dành cho đội ngũ Lean Export.</p>
        <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">
          Mật khẩu
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 h-12 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30"
        />
        {state === "error" && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            Mật khẩu không đúng hoặc chưa cấu hình ADMIN_PASSWORD.
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={state === "loading"}>
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

const navItems = [
  { to: "/admin", label: "Yêu cầu báo giá", icon: Inbox, exact: true },
  { to: "/admin/news", label: "Tin tức", icon: Newspaper, exact: false },
] as const;

function AdminLayout() {
  const router = useRouter();
  const logout = async () => {
    await adminLogout();
    await router.invalidate();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-ink text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/admin" className="flex shrink-0 items-center gap-3">
            <img src={businessConfig.logoUrl} alt={businessConfig.logoAlt} className="h-6 w-auto" />
            <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold sm:inline">
              Admin
            </span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <a
            href={import.meta.env.BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-sm text-white/70 hover:text-white md:flex"
          >
            Xem website <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-sm hover:bg-white hover:text-brand-ink"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
