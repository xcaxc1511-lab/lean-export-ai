import { useState, type FormEvent, type ReactNode } from "react";
import {
  Link,
  Navigate,
  Outlet,
  createFileRoute,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { adminLogin, adminSetup, getAdminStatus } from "@/functions/admin";
import { DEFAULT_ENQUIRY_FILTERS, listEnquiries } from "@/functions/enquiries";
import { listChats } from "@/functions/chat";
import { AdminFrame } from "@/components/admin/AdminShell";
import { businessConfig } from "@/config/business";
import { areaOfPath, canAccess, homeFor } from "@/lib/roles";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => getAdminStatus(),
  head: () => ({
    meta: [{ title: "Quản trị | Lean Export" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminShell,
});

/** Minimum length, matching the server rule (PASSWORD_MIN). */
const PASSWORD_MIN = 10;

function AdminShell() {
  const { user, needsSetup } = Route.useRouteContext();
  if (user) return <AdminLayout user={user} />;
  return needsSetup ? <SetupScreen /> : <LoginScreen />;
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-canvas px-4 py-16">
      <div className="w-full max-w-[420px]">
        <img
          src={`${import.meta.env.BASE_URL}lean-export-logo.png`}
          alt={businessConfig.logoAlt}
          className="mx-auto mb-8 h-9 w-auto object-contain"
        />
        <div className="admin-card p-8">
          <h1 className="text-2xl font-semibold text-admin-ink">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-admin-dim">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "invalid" | "locked" | "error">("idle");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("loading");
    try {
      const res = await adminLogin({ data: { email, password } });
      if (!res.ok)
        return setState(
          res.error === "locked" ? "locked" : res.error === "setup" ? "error" : "invalid",
        );
      await router.invalidate();
    } catch {
      setState("error");
    }
  };

  return (
    <AuthCard title="Đăng nhập" subtitle="Trang quản trị yêu cầu báo giá, hội thoại và tin tức.">
      <form onSubmit={submit} className="grid gap-5">
        <label className="admin-label">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@congty.com"
            className="admin-input"
          />
        </label>
        <label className="admin-label">
          Mật khẩu
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input"
          />
        </label>
        {state === "invalid" && (
          <p role="alert" className="text-sm text-[#b42318]">
            Email hoặc mật khẩu không đúng. Kiểm tra lại (tắt bộ gõ tiếng Việt) rồi thử lần nữa.
          </p>
        )}
        {state === "locked" && (
          <p role="alert" className="text-sm text-[#b42318]">
            Đăng nhập sai quá nhiều lần. Tài khoản tạm khóa 15 phút, hãy thử lại sau hoặc nhờ quản
            trị viên đặt lại mật khẩu.
          </p>
        )}
        {state === "error" && (
          <p role="alert" className="text-sm text-[#b42318]">
            Không đăng nhập được lúc này. Tải lại trang rồi thử lại.
          </p>
        )}
        <button
          type="submit"
          className="admin-btn admin-btn-primary w-full"
          disabled={state === "loading"}
        >
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
        </button>
        <p className="text-center text-xs text-admin-dim">
          Quên mật khẩu? Liên hệ quản trị viên để được đặt lại.
        </p>
      </form>
    </AuthCard>
  );
}

function SetupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    setupKey: "",
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.password.length < PASSWORD_MIN)
      return setError(`Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`);
    if (form.password !== form.confirm) return setError("Hai mật khẩu chưa khớp nhau.");
    setError(null);
    setLoading(true);
    try {
      const res = await adminSetup({
        data: {
          setupKey: form.setupKey,
          name: form.name,
          email: form.email,
          password: form.password,
        },
      });
      if (!res.ok) {
        setError(
          res.error === "invalid_key"
            ? "Mật khẩu cài đặt không đúng (đây là ADMIN_PASSWORD đang dùng trước đây)."
            : "Tài khoản quản trị đã được tạo. Tải lại trang để đăng nhập.",
        );
        return;
      }
      await router.invalidate();
    } catch {
      setError("Chưa tạo được tài khoản. Kiểm tra email hợp lệ rồi thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Tạo tài khoản quản trị đầu tiên"
      subtitle="Từ nay mỗi người đăng nhập bằng email và mật khẩu riêng. Tài khoản đầu tiên có toàn quyền và sẽ tạo tài khoản cho những người khác."
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="admin-label">
          Mật khẩu cài đặt
          <input
            type="password"
            required
            autoComplete="off"
            value={form.setupKey}
            onChange={set("setupKey")}
            className="admin-input"
          />
          <span className="admin-hint">
            Mật khẩu admin chung đang dùng (ADMIN_PASSWORD), để xác nhận bạn là chủ website.
          </span>
        </label>
        <label className="admin-label">
          Họ tên
          <input
            required
            value={form.name}
            onChange={set("name")}
            autoComplete="name"
            className="admin-input"
          />
        </label>
        <label className="admin-label">
          Email đăng nhập
          <input
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            autoComplete="username"
            className="admin-input"
          />
        </label>
        <label className="admin-label">
          Mật khẩu mới
          <input
            type="password"
            required
            minLength={PASSWORD_MIN}
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
            className="admin-input"
          />
          <span className="admin-hint">Ít nhất {PASSWORD_MIN} ký tự.</span>
        </label>
        <label className="admin-label">
          Nhập lại mật khẩu mới
          <input
            type="password"
            required
            value={form.confirm}
            onChange={set("confirm")}
            autoComplete="new-password"
            className="admin-input"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        )}
        <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo tài khoản và đăng nhập"}
        </button>
      </form>
    </AuthCard>
  );
}

type User = NonNullable<ReturnType<typeof Route.useRouteContext>["user"]>;

function AdminLayout({ user }: { user: User }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const seesEnquiries = canAccess(user.role, "enquiries");
  const seesChats = canAccess(user.role, "chats");

  const enquiries = useQuery({
    queryKey: ["enquiries", DEFAULT_ENQUIRY_FILTERS],
    queryFn: () => listEnquiries({ data: DEFAULT_ENQUIRY_FILTERS }),
    enabled: seesEnquiries,
  });
  // Same key as the conversations page's default view; refreshes so new chats show up.
  const chats = useQuery({
    queryKey: ["chats", "all", ""],
    queryFn: () => listChats({ data: { filter: "all", q: "" } }),
    refetchInterval: 20_000,
    enabled: seesChats,
  });

  const area = areaOfPath(pathname);
  // Editors land on the news list instead of the enquiries page.
  if (area === "enquiries" && !seesEnquiries && pathname.replace(/\/$/, "") === "/admin")
    return <Navigate to={homeFor(user.role)} replace />;
  const allowed = !area || canAccess(user.role, area);

  return (
    <AdminFrame
      user={user}
      newCount={seesEnquiries ? (enquiries.data?.counts["new"] ?? 0) : 0}
      chatUnread={seesChats ? (chats.data?.unreadCount ?? 0) : 0}
    >
      {allowed ? (
        <Outlet />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <ShieldAlert className="h-9 w-9 text-admin-dim" />
          <p className="font-semibold text-admin-ink">
            Tài khoản của bạn không có quyền mở trang này
          </p>
          <p className="max-w-sm text-sm text-admin-dim">
            Cần thêm quyền thì nhờ quản trị viên cập nhật vai trò.
          </p>
          <Link to={homeFor(user.role)} className="admin-btn admin-btn-secondary mt-2">
            Về trang của tôi
          </Link>
        </div>
      )}
    </AdminFrame>
  );
}
