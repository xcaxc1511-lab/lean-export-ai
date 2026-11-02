import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminShell";
import { getAdminSettings, updateSettings } from "@/functions/settings";
import { isPlaceholder, type SiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type Field = {
  key: keyof SiteSettings;
  label: string;
  hint: string;
  placeholder: string;
  type?: string;
};

const SECTIONS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: "Liên hệ trên website",
    description:
      "Hiện ở header, footer, nút gọi/WhatsApp/Zalo nổi, trang Liên hệ, email gửi khách và câu trả lời của trợ lý AI.",
    fields: [
      {
        key: "phone",
        label: "Số điện thoại",
        hint: "Hiển thị nguyên văn; link gọi tự đổi 0… thành +84…",
        placeholder: "0901 234 567",
      },
      {
        key: "email",
        label: "Email liên hệ",
        hint: "Email khách nhìn thấy trên website.",
        placeholder: "export@leanexport.vn",
        type: "email",
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        hint: "Số quốc tế, chỉ chữ số, ví dụ 84901234567.",
        placeholder: "84901234567",
      },
      {
        key: "zalo",
        label: "Zalo",
        hint: "Số điện thoại đăng ký Zalo, ví dụ 0901234567.",
        placeholder: "0901234567",
      },
    ],
  },
  {
    title: "Địa chỉ",
    description: "Dùng ở footer, trang Liên hệ và thông tin cho trợ lý AI.",
    fields: [
      {
        key: "addressVi",
        label: "Địa chỉ (tiếng Việt)",
        hint: "",
        placeholder: "Chư Prông, Gia Lai, Việt Nam",
      },
      {
        key: "addressEn",
        label: "Địa chỉ (tiếng Anh)",
        hint: "",
        placeholder: "Chu Prong, Gia Lai, Vietnam",
      },
    ],
  },
  {
    title: "Website và thông báo",
    description: "Dùng cho sitemap, link chia sẻ mạng xã hội và email báo có yêu cầu mới.",
    fields: [
      {
        key: "website",
        label: "Địa chỉ website",
        hint: "Đổi khi gắn tên miền riêng, ví dụ https://leanexport.vn (không có / ở cuối).",
        placeholder: "https://leanexport.vn",
      },
      {
        key: "salesEmails",
        label: "Email nhận thông báo",
        hint: "Nhận email khi có yêu cầu báo giá hoặc khách để lại liên hệ trong chat. Nhiều email cách nhau bằng dấu phẩy. Để trống thì dùng email liên hệ.",
        placeholder: "sales@leanexport.vn, giamdoc@leanexport.vn",
      },
    ],
  },
];

function SettingsPage() {
  const query = useQuery({ queryKey: ["settings"], queryFn: () => getAdminSettings() });
  return (
    <>
      <AdminTopbar title="Cài đặt website" />
      <div className="flex-1 p-4 lg:p-6">
        {query.isLoading || !query.data ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-admin-dim">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
          </div>
        ) : (
          <SettingsForm initial={query.data} />
        )}
      </div>
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-card grid gap-5 p-6 lg:grid-cols-[260px_1fr] lg:gap-10">
      <div>
        <h2 className="text-base font-semibold text-admin-ink">{title}</h2>
        <p className="mt-1 text-sm text-admin-dim">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setForm(initial), [initial]);

  const pending = (Object.keys(form) as (keyof SiteSettings)[]).filter((k) =>
    isPlaceholder(k, form[k]),
  );
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: () => updateSettings({ data: form }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      await router.invalidate(); // re-run the root loader so the admin shows the new details too
    },
    onError: () =>
      setError(
        "Chưa lưu được. Kiểm tra số điện thoại, email hợp lệ và địa chỉ website bắt đầu bằng https://.",
      ),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      {pending.length > 0 ? (
        <p className="flex items-start gap-3 rounded-lg border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-sm text-[#b54708]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {pending.length} mục vẫn là thông tin mẫu (đánh dấu bên dưới). Khách đang thấy số và email
          giả, hãy cập nhật trước khi quảng bá website.
        </p>
      ) : (
        <p className="flex items-center gap-3 rounded-lg border border-[#abefc6] bg-[#ecfdf3] px-4 py-3 text-sm text-[#067647]">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Thông tin liên hệ đã được cập nhật.
        </p>
      )}

      {SECTIONS.map((section) => (
        <Section key={section.title} title={section.title} description={section.description}>
          {section.fields.map((f) => {
            const sample = isPlaceholder(f.key, form[f.key]);
            return (
              <label
                key={f.key}
                className={`admin-label ${f.key === "salesEmails" ? "sm:col-span-2" : ""}`}
              >
                <span className="flex items-center gap-2">
                  {f.label}
                  {sample && (
                    <span className="rounded-full bg-[#fffaeb] px-2 py-0.5 text-xs font-medium text-[#b54708] ring-1 ring-inset ring-[#fedf89]">
                      Thông tin mẫu
                    </span>
                  )}
                </span>
                <input
                  type={f.type ?? "text"}
                  value={form[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className={`admin-input ${sample ? "border-[#fec84b]" : ""}`}
                />
                {f.hint && <span className="admin-hint">{f.hint}</span>}
              </label>
            );
          })}
        </Section>
      ))}

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-admin-line bg-white px-4 py-3 lg:-mx-6 lg:px-6">
        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={save.isPending || !dirty}
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu cài đặt"}
        </button>
        {save.isSuccess && !dirty && (
          <span className="text-sm text-[#067647]">Đã lưu. Website dùng thông tin mới ngay.</span>
        )}
        {error && <span className="text-sm text-[#b42318]">{error}</span>}
        {dirty && (
          <button
            type="button"
            className="ml-auto text-sm text-admin-muted hover:text-admin-ink"
            onClick={() => setForm(initial)}
          >
            Hoàn tác
          </button>
        )}
      </div>
    </form>
  );
}
