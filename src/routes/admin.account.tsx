import { useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AdminTopbar, Avatar } from "@/components/admin/AdminShell";
import { changeMyPassword, updateMyProfile } from "@/functions/admin";
import { ROLE_HINT, ROLE_LABEL } from "@/lib/roles";

export const Route = createFileRoute("/admin/account")({
  component: AccountPage,
});

const PASSWORD_MIN = 10;

function AccountPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  if (!user) return null;

  return (
    <>
      <AdminTopbar title="Tài khoản của tôi" />
      <div className="grid flex-1 content-start gap-5 p-4 lg:grid-cols-2 lg:p-6">
        <section className="admin-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-admin-ink">{user.name}</p>
              <p className="truncate text-sm text-admin-muted">{user.email}</p>
              <p className="mt-1 text-xs text-admin-dim">
                {ROLE_LABEL[user.role]}: {ROLE_HINT[user.role]}
              </p>
            </div>
          </div>
          <ProfileForm
            name={user.name}
            title={user.title ?? ""}
            onSaved={() => router.invalidate()}
          />
        </section>
        <section className="admin-card p-6">
          <h2 className="mb-1 text-base font-semibold text-admin-ink">Đổi mật khẩu</h2>
          <p className="mb-5 text-sm text-admin-dim">
            Đổi xong, các thiết bị khác đang đăng nhập sẽ bị đăng xuất.
          </p>
          <PasswordForm />
        </section>
      </div>
    </>
  );
}

function ProfileForm({
  name,
  title,
  onSaved,
}: {
  name: string;
  title: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ name, title });
  const save = useMutation({
    mutationFn: () => updateMyProfile({ data: form }),
    onSuccess: onSaved,
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="grid gap-4"
    >
      <label className="admin-label">
        Họ tên
        <input
          className="admin-input"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="admin-label">
        Chức danh
        <input
          className="admin-input"
          value={form.title}
          placeholder="VD: Trưởng phòng xuất khẩu"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <span className="admin-hint">
          Tên và chức danh hiện ở phần tác giả trên các bài viết của bạn.
        </span>
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu hồ sơ"}
        </button>
        {save.isSuccess && <span className="text-sm text-[#067647]">Đã lưu hồ sơ</span>}
      </div>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const change = useMutation({
    mutationFn: () => changeMyPassword({ data: { current: form.current, next: form.next } }),
    onSuccess: (res) => {
      if (res.ok) {
        setForm({ current: "", next: "", confirm: "" });
        setMsg({ ok: true, text: "Đã đổi mật khẩu." });
      } else setMsg({ ok: false, text: "Mật khẩu hiện tại không đúng." });
    },
    onError: () => setMsg({ ok: false, text: "Chưa đổi được mật khẩu. Thử lại sau." }),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.next.length < PASSWORD_MIN)
      return setMsg({ ok: false, text: `Mật khẩu mới cần ít nhất ${PASSWORD_MIN} ký tự.` });
    if (form.next !== form.confirm)
      return setMsg({ ok: false, text: "Hai mật khẩu mới chưa khớp nhau." });
    change.mutate();
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="admin-label">
        Mật khẩu hiện tại
        <input
          className="admin-input"
          type="password"
          required
          autoComplete="current-password"
          value={form.current}
          onChange={(e) => setForm({ ...form, current: e.target.value })}
        />
      </label>
      <label className="admin-label">
        Mật khẩu mới
        <input
          className="admin-input"
          type="password"
          required
          autoComplete="new-password"
          value={form.next}
          onChange={(e) => setForm({ ...form, next: e.target.value })}
        />
        <span className="admin-hint">Ít nhất {PASSWORD_MIN} ký tự.</span>
      </label>
      <label className="admin-label">
        Nhập lại mật khẩu mới
        <input
          className="admin-input"
          type="password"
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />
      </label>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-[#067647]" : "text-[#b42318]"}`}>{msg.text}</p>
      )}
      <button
        type="submit"
        className="admin-btn admin-btn-primary justify-self-start"
        disabled={change.isPending}
      >
        {change.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
