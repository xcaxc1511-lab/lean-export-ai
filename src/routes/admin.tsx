import { useState, type FormEvent } from "react";
import { Outlet, createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { adminLogin, getAdminStatus } from "@/functions/admin";
import { DEFAULT_ENQUIRY_FILTERS, listEnquiries } from "@/functions/enquiries";
import { AdminFrame } from "@/components/admin/AdminShell";
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
    <div className="flex min-h-screen items-center justify-center bg-admin-canvas px-4 py-16">
      <div className="w-full max-w-[400px]">
        <img
          src={`${import.meta.env.BASE_URL}lean-export-logo.png`}
          alt={businessConfig.logoAlt}
          className="mx-auto mb-8 h-9 w-auto"
        />
        <form onSubmit={submit} className="admin-card p-8">
          <h1 className="text-2xl font-semibold text-admin-ink">Đăng nhập</h1>
          <p className="mb-6 mt-1 text-sm text-admin-dim">
            Trang quản trị yêu cầu báo giá và tin tức.
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
              placeholder="Nhập mật khẩu quản trị"
              className="admin-input"
            />
          </label>
          {state === "error" && (
            <p role="alert" className="mb-5 text-sm text-[#b42318]">
              Mật khẩu không đúng. Kiểm tra lại (tắt bộ gõ tiếng Việt) rồi thử lần nữa.
            </p>
          )}
          <button
            type="submit"
            className="admin-btn admin-btn-primary w-full"
            disabled={state === "loading"}
          >
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminLayout() {
  const enquiries = useQuery({
    queryKey: ["enquiries", DEFAULT_ENQUIRY_FILTERS],
    queryFn: () => listEnquiries({ data: DEFAULT_ENQUIRY_FILTERS }),
  });
  return (
    <AdminFrame newCount={enquiries.data?.counts["new"] ?? 0}>
      <Outlet />
    </AdminFrame>
  );
}
