import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { AdminSubbar, AdminTopbar, Avatar } from "@/components/admin/AdminShell";
import {
  createUser,
  deleteUser,
  listUsers,
  resetUser2fa,
  resetUserPassword,
  updateUser,
} from "@/functions/admin";
import { ROLES, ROLE_HINT, ROLE_LABEL, type Role } from "@/lib/roles";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

const PASSWORD_MIN = 10;

const ERRORS: Record<string, string> = {
  email_taken: "Email này đã có tài khoản.",
  last_admin: "Phải còn ít nhất một quản trị viên đang hoạt động.",
  self: "Không thể xóa tài khoản đang đăng nhập.",
  not_found: "Tài khoản không còn tồn tại.",
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa đăng nhập";

/** A random, readable temporary password the admin can pass on. */
function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function RoleTag({ role }: { role: Role }) {
  const tone =
    role === "admin"
      ? "bg-[#f4f3ff] text-[#5925dc] ring-[#d9d6fe]"
      : role === "editor"
        ? "bg-[#ecfdf3] text-[#067647] ring-[#abefc6]"
        : "bg-admin-blue-soft text-admin-blue ring-[#b2ccff]";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

function UsersPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["users"], queryFn: () => listUsers() });
  const [adding, setAdding] = useState(false);
  const [resetFor, setResetFor] = useState<{ id: number; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });
  const update = useMutation({
    mutationFn: (data: { id: number; role?: Role; status?: "active" | "disabled" }) =>
      updateUser({ data }),
    onSuccess: async (res) => {
      setError(res.ok ? null : (ERRORS[res.error] ?? "Chưa lưu được thay đổi."));
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteUser({ data: { id } }),
    onSuccess: async (res) => {
      setError(res.ok ? null : (ERRORS[res.error] ?? "Chưa xóa được tài khoản."));
      await refresh();
    },
  });

  const reset2fa = useMutation({
    mutationFn: (id: number) => resetUser2fa({ data: { id } }),
    onSuccess: refresh,
  });

  const users = query.data?.users ?? [];
  const meId = query.data?.meId;

  return (
    <>
      <AdminTopbar title="Tài khoản" />
      <AdminSubbar
        tabs={
          <span className="admin-subtab" aria-current="page">
            Người dùng
            <span className="rounded-full bg-admin-canvas px-1.5 text-xs font-medium text-admin-muted">
              {users.length}
            </span>
          </span>
        }
        actions={
          <button
            type="button"
            className="admin-btn admin-btn-primary w-10 px-0 sm:w-auto sm:px-4"
            onClick={() => setAdding(true)}
            aria-label="Thêm tài khoản"
          >
            <UserPlus className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">Thêm tài khoản</span>
          </button>
        }
      />

      <div className="flex-1 space-y-4 p-4 lg:p-6">
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-[#fecdca] bg-[#fef3f2] px-4 py-3 text-sm text-[#b42318]"
          >
            {error}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r} className="admin-card p-4">
              <RoleTag role={r} />
              <p className="mt-2 text-sm text-admin-muted">{ROLE_HINT[r]}</p>
            </div>
          ))}
        </div>

        <div className="admin-card overflow-hidden">
          {query.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-admin-dim">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : (
            <ul className="divide-y divide-admin-line">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap"
                >
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium text-admin-ink">
                      {u.name}
                      {u.id === meId && (
                        <span className="text-xs font-normal text-admin-dim">(bạn)</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-admin-muted">
                      {u.email}
                      {u.title ? `, ${u.title}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      Vai trò của {u.name}
                    </label>
                    <select
                      id={`role-${u.id}`}
                      value={u.role}
                      onChange={(e) => update.mutate({ id: u.id, role: e.target.value as Role })}
                      className="admin-input h-9 w-auto py-0 pr-8 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                    {u.totp_enabled ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2 py-0.5 text-xs font-medium text-[#067647] ring-1 ring-inset ring-[#abefc6]"
                        title="Đã bật xác thực 2 lớp"
                      >
                        <ShieldCheck className="h-3 w-3" /> 2FA
                      </span>
                    ) : null}
                    {u.status === "disabled" && (
                      <span className="rounded-full bg-[#fef3f2] px-2.5 py-0.5 text-xs font-medium text-[#b42318] ring-1 ring-inset ring-[#fecdca]">
                        Đã khóa
                      </span>
                    )}
                  </div>
                  <span className="hidden w-40 text-right text-xs text-admin-dim lg:block">
                    {u.last_login_at ? `Đăng nhập ${fmt(u.last_login_at)}` : "Chưa đăng nhập"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="admin-icon-btn h-9 w-9"
                      aria-label={`Thao tác với ${u.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setResetFor({ id: u.id, email: u.email })}>
                        <KeyRound className="mr-2 h-4 w-4" /> Đặt lại mật khẩu
                      </DropdownMenuItem>
                      {u.totp_enabled ? (
                        <DropdownMenuItem
                          onSelect={() => {
                            if (
                              window.confirm(
                                `Tắt xác thực 2 lớp của ${u.email}? Dùng khi họ mất điện thoại; họ đăng nhập bằng mật khẩu rồi bật lại.`,
                              )
                            )
                              reset2fa.mutate(u.id);
                          }}
                        >
                          <ShieldOff className="mr-2 h-4 w-4" /> Tắt xác thực 2 lớp
                        </DropdownMenuItem>
                      ) : null}
                      {u.id !== meId &&
                        (u.status === "active" ? (
                          <DropdownMenuItem
                            onSelect={() => update.mutate({ id: u.id, status: "disabled" })}
                          >
                            <Lock className="mr-2 h-4 w-4" /> Khóa tài khoản
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => update.mutate({ id: u.id, status: "active" })}
                          >
                            <LockOpen className="mr-2 h-4 w-4" /> Mở khóa
                          </DropdownMenuItem>
                        ))}
                      {u.id !== meId && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-[#b42318] focus:text-[#b42318]"
                            onSelect={() => {
                              if (window.confirm(`Xóa vĩnh viễn tài khoản ${u.email}?`))
                                remove.mutate(u.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa tài khoản
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-admin-dim">
          Khóa tài khoản hoặc đặt lại mật khẩu sẽ đăng xuất người đó khỏi mọi thiết bị ngay lập tức.
        </p>
      </div>

      <Sheet open={adding} onOpenChange={setAdding}>
        <SheetContent className="w-full overflow-y-auto bg-white sm:max-w-md">
          {adding && <AddUserForm onDone={() => (setAdding(false), void refresh())} />}
        </SheetContent>
      </Sheet>
      <Sheet open={resetFor !== null} onOpenChange={(o) => !o && setResetFor(null)}>
        <SheetContent className="w-full overflow-y-auto bg-white sm:max-w-md">
          {resetFor && <ResetPasswordForm user={resetFor} onDone={() => setResetFor(null)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="admin-label">
      Mật khẩu tạm
      <span className="flex gap-2">
        <input
          className="admin-input flex-1 font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minLength={PASSWORD_MIN}
          required
          autoComplete="new-password"
        />
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => onChange(tempPassword())}
        >
          Tạo ngẫu nhiên
        </button>
      </span>
      <span className="admin-hint">
        Ít nhất {PASSWORD_MIN} ký tự. Gửi riêng cho người dùng (Zalo, gặp trực tiếp) và nhắc họ đổi
        trong "Tài khoản của tôi".
      </span>
    </label>
  );
}

function AddUserForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    role: "editor" as Role,
    password: tempPassword(),
  });
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => createUser({ data: form }),
    onSuccess: (res) =>
      res.ok ? onDone() : setError(ERRORS[res.error] ?? "Chưa tạo được tài khoản."),
    onError: () => setError("Chưa tạo được tài khoản. Kiểm tra email hợp lệ và mật khẩu đủ dài."),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };
  return (
    <form onSubmit={submit} className="grid gap-4 p-1">
      <div>
        <SheetTitle className="text-xl font-semibold text-admin-ink">Thêm tài khoản</SheetTitle>
        <SheetDescription className="text-sm text-admin-dim">
          Người dùng đăng nhập bằng email và mật khẩu tạm dưới đây.
        </SheetDescription>
      </div>
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
        Email đăng nhập
        <input
          className="admin-input"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label className="admin-label">
        Chức danh
        <input
          className="admin-input"
          value={form.title}
          placeholder="VD: Chuyên viên xuất khẩu"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <span className="admin-hint">Hiện dưới tên tác giả trên bài viết.</span>
      </label>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium text-admin-text">Vai trò</legend>
        {ROLES.map((r) => (
          <label
            key={r}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              form.role === r ? "border-admin-blue bg-admin-blue-soft" : "border-admin-line"
            }`}
          >
            <input
              type="radio"
              name="role"
              className="mt-1"
              checked={form.role === r}
              onChange={() => setForm({ ...form, role: r })}
            />
            <span>
              <span className="block text-sm font-medium text-admin-ink">{ROLE_LABEL[r]}</span>
              <span className="block text-xs text-admin-dim">{ROLE_HINT[r]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <PasswordField
        value={form.password}
        onChange={(password) => setForm({ ...form, password })}
      />
      {error && <p className="text-sm text-[#b42318]">{error}</p>}
      <button type="submit" className="admin-btn admin-btn-primary" disabled={create.isPending}>
        {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo tài khoản"}
      </button>
    </form>
  );
}

function ResetPasswordForm({
  user,
  onDone,
}: {
  user: { id: number; email: string };
  onDone: () => void;
}) {
  const [password, setPassword] = useState(tempPassword());
  const [done, setDone] = useState(false);
  const reset = useMutation({
    mutationFn: () => resetUserPassword({ data: { id: user.id, password } }),
    onSuccess: (res) => res.ok && setDone(true),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        reset.mutate();
      }}
      className="grid gap-4 p-1"
    >
      <div>
        <SheetTitle className="text-xl font-semibold text-admin-ink">Đặt lại mật khẩu</SheetTitle>
        <SheetDescription className="text-sm text-admin-dim">{user.email}</SheetDescription>
      </div>
      {done ? (
        <>
          <p className="rounded-lg bg-[#ecfdf3] px-4 py-3 text-sm text-[#067647]">
            Đã đặt mật khẩu mới và đăng xuất tài khoản này khỏi mọi thiết bị. Gửi mật khẩu cho người
            dùng qua kênh riêng.
          </p>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onDone}>
            Xong
          </button>
        </>
      ) : (
        <>
          <PasswordField value={password} onChange={setPassword} />
          <button type="submit" className="admin-btn admin-btn-primary" disabled={reset.isPending}>
            {reset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đặt mật khẩu mới"}
          </button>
        </>
      )}
    </form>
  );
}
