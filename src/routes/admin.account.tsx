import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import QRCode from "qrcode";
import { AdminTopbar, Avatar } from "@/components/admin/AdminShell";
import {
  changeMyPassword,
  confirm2faSetup,
  disableMy2fa,
  getMy2faStatus,
  start2faSetup,
  updateMyProfile,
} from "@/functions/admin";
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
        <section className="admin-card p-6 lg:col-span-2">
          <TwoFactorSection />
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

/* --------------------------------------------------- two-factor sign-in */

function TwoFactorSection() {
  const qc = useQueryClient();
  const router = useRouter();
  const status = useQuery({ queryKey: ["2fa"], queryFn: () => getMy2faStatus() });
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["2fa"] });
    await router.invalidate();
  };

  const start = useMutation({
    mutationFn: () => start2faSetup(),
    onSuccess: (res) => res.ok && setSetup({ secret: res.secret, uri: res.uri }),
  });

  const enabled = status.data?.enabled;

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:gap-10">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-admin-ink">
          {enabled ? (
            <ShieldCheck className="h-5 w-5 text-[#067647]" />
          ) : (
            <ShieldOff className="h-5 w-5 text-admin-dim" />
          )}
          Xác thực 2 lớp
        </h2>
        <p className="mt-1 text-sm text-admin-dim">
          Khi đăng nhập, ngoài mật khẩu cần thêm mã 6 số từ ứng dụng trên điện thoại (Google
          Authenticator, Microsoft Authenticator…). Lộ mật khẩu vẫn chưa vào được admin.
        </p>
      </div>
      <div>
        {status.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-admin-dim" />
        ) : codes ? (
          <RecoveryCodes codes={codes} onDone={() => setCodes(null)} />
        ) : enabled ? (
          <EnabledState recoveryLeft={status.data?.recoveryLeft ?? 0} onDisabled={refresh} />
        ) : setup ? (
          <SetupSteps
            setup={setup}
            onCancel={() => setSetup(null)}
            onEnabled={async (recovery) => {
              setSetup(null);
              setCodes(recovery);
              await refresh();
            }}
          />
        ) : (
          <div className="grid justify-items-start gap-3">
            <span className="rounded-full bg-[#f9fafb] px-2.5 py-0.5 text-xs font-medium text-admin-muted ring-1 ring-inset ring-admin-line">
              Đang tắt
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Bật xác thực 2 lớp"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SetupSteps({
  setup,
  onCancel,
  onEnabled,
}: {
  setup: { secret: string; uri: string };
  onCancel: () => void;
  onEnabled: (recoveryCodes: string[]) => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Rendered in the browser: the secret never goes to a third-party QR service.
    void QRCode.toDataURL(setup.uri, { margin: 1, width: 220 }).then(setQr);
  }, [setup.uri]);

  const confirm = useMutation({
    mutationFn: () => confirm2faSetup({ data: { code } }),
    onSuccess: (res) =>
      res.ok
        ? onEnabled(res.recoveryCodes)
        : setError("Mã chưa đúng. Nhập mã đang hiện trong ứng dụng."),
  });

  return (
    <ol className="grid gap-5 text-sm text-admin-text">
      <li className="grid gap-3">
        <p>
          <b>1.</b> Mở ứng dụng xác thực trên điện thoại, chọn thêm tài khoản và quét mã QR:
        </p>
        <div className="flex flex-wrap items-center gap-5">
          {qr ? (
            <img
              src={qr}
              alt="Mã QR cài đặt xác thực 2 lớp"
              className="h-[180px] w-[180px] rounded-lg border border-admin-line"
            />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center rounded-lg border border-admin-line">
              <Loader2 className="h-5 w-5 animate-spin text-admin-dim" />
            </div>
          )}
          <div className="text-xs text-admin-dim">
            Không quét được? Nhập khóa này vào ứng dụng:
            <code className="mt-1 block break-all rounded bg-admin-row px-2 py-1.5 font-mono text-sm text-admin-ink">
              {setup.secret.replace(/(.{4})/g, "$1 ").trim()}
            </code>
          </div>
        </div>
      </li>
      <li className="grid gap-3">
        <p>
          <b>2.</b> Nhập mã 6 số ứng dụng đang hiện để xác nhận:
        </p>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            confirm.mutate();
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            aria-label="Mã xác thực 6 số"
            className="admin-input w-40 text-center font-mono tracking-[0.3em]"
          />
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={code.length < 6 || confirm.isPending}
          >
            {confirm.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Bật xác thực 2 lớp"
            )}
          </button>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>
            Hủy
          </button>
        </form>
        {error && <p className="text-[#b42318]">{error}</p>}
      </li>
    </ol>
  );
}

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const text = `Mã khôi phục Lean Export Admin (mỗi mã dùng 1 lần)\n\n${codes.join("\n")}\n`;
  return (
    <div className="grid gap-4">
      <p className="rounded-lg border border-[#abefc6] bg-[#ecfdf3] px-4 py-3 text-sm text-[#067647]">
        Đã bật xác thực 2 lớp. Lưu các mã khôi phục dưới đây ở nơi an toàn: khi mất điện thoại, mỗi
        mã thay cho một lần nhập mã 6 số. Các mã này <b>chỉ hiện một lần</b>.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {codes.map((c) => (
          <li
            key={c}
            className="rounded-md bg-admin-row px-3 py-2 text-center font-mono text-sm text-admin-ink"
          >
            {c}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => void navigator.clipboard.writeText(text)}
        >
          <Copy className="h-4 w-4" /> Chép
        </button>
        <a
          className="admin-btn admin-btn-secondary"
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
          download="lean-export-recovery-codes.txt"
        >
          <Download className="h-4 w-4" /> Tải file .txt
        </a>
        <button type="button" className="admin-btn admin-btn-primary" onClick={onDone}>
          Tôi đã lưu mã
        </button>
      </div>
    </div>
  );
}

function EnabledState({
  recoveryLeft,
  onDisabled,
}: {
  recoveryLeft: number;
  onDisabled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ password: "", code: "" });
  const [error, setError] = useState<string | null>(null);
  const disable = useMutation({
    mutationFn: () => disableMy2fa({ data: form }),
    onSuccess: (res) => {
      if (res.ok) return onDisabled();
      setError(res.error === "wrong_password" ? "Mật khẩu không đúng." : "Mã xác thực không đúng.");
    },
  });
  return (
    <div className="grid justify-items-start gap-3">
      <span className="rounded-full bg-[#ecfdf3] px-2.5 py-0.5 text-xs font-medium text-[#067647] ring-1 ring-inset ring-[#abefc6]">
        Đang bật
      </span>
      <p className={`text-sm ${recoveryLeft <= 2 ? "text-[#b54708]" : "text-admin-muted"}`}>
        Còn {recoveryLeft} mã khôi phục chưa dùng.
        {recoveryLeft <= 2 && " Hãy tắt rồi bật lại để nhận bộ mã mới."}
      </p>
      {!open ? (
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => setOpen(true)}
        >
          Tắt xác thực 2 lớp
        </button>
      ) : (
        <form
          className="grid w-full max-w-md gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            disable.mutate();
          }}
        >
          <input
            type="password"
            className="admin-input"
            placeholder="Mật khẩu hiện tại"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <input
            className="admin-input font-mono tracking-[0.3em]"
            placeholder="Mã 6 số từ ứng dụng"
            inputMode="numeric"
            maxLength={6}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          {error && <p className="text-sm text-[#b42318]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="admin-btn admin-btn-danger"
              disabled={disable.isPending}
            >
              {disable.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Tắt xác thực 2 lớp"
              )}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setOpen(false)}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
