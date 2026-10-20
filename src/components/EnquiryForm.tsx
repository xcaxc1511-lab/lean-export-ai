import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LeadForm, hasFormId } from "@/components/LeadForm";
import { servicesConfig } from "@/config/services";
import { mailtoHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";

const copy = {
  name: { en: "Full name", vi: "Họ và tên" },
  company: { en: "Company", vi: "Công ty" },
  yourEmail: { en: "Your email", vi: "Email của bạn" },
  country: { en: "Country / destination port", vi: "Quốc gia / cảng đến" },
  product: { en: "Product of interest", vi: "Sản phẩm quan tâm" },
  chooseProduct: { en: "Select a product", vi: "Chọn sản phẩm" },
  other: { en: "Other / not sure yet", vi: "Khác / chưa xác định" },
  volume: { en: "Estimated volume", vi: "Sản lượng dự kiến" },
  volumePlaceholder: { en: "e.g. 1 × 20ft container / month", vi: "VD: 1 container 20ft / tháng" },
  incoterm: { en: "Preferred Incoterm", vi: "Điều kiện giao hàng" },
  notSure: { en: "Not sure yet", vi: "Chưa xác định" },
  samples: { en: "Please send me samples first", vi: "Tôi muốn nhận mẫu trước" },
  message: { en: "Message", vi: "Nội dung" },
  messagePlaceholder: {
    en: "Grade, processing, packing, target price, timeline…",
    vi: "Cấp hạt, phương pháp chế biến, đóng gói, giá mục tiêu, thời gian…",
  },
  yes: { en: "Yes", vi: "Có" },
  sendEnquiry: { en: "Send enquiry", vi: "Gửi yêu cầu" },
  sendQuote: { en: "Request quote", vi: "Gửi yêu cầu báo giá" },
  enquirySubject: { en: "Enquiry from {company}", vi: "Yêu cầu từ {company}" },
  quoteSubject: { en: "Quote request from {company}", vi: "Yêu cầu báo giá từ {company}" },
  note: {
    en: "Submitting opens your email app with the details pre-filled.",
    vi: "Khi gửi, ứng dụng email của bạn sẽ mở với nội dung đã điền sẵn.",
  },
};

const INCOTERMS = ["FOB", "CIF", "CFR"];

const fieldClass =
  "h-12 rounded-md border-gray-200 bg-white text-base focus-visible:border-primary focus-visible:ring-primary/30";

interface EnquiryFormProps {
  /** LeadConnector form ID; when configured it replaces the built-in form. */
  formId?: string;
  /** "quote" adds Incoterm and sample-request fields. */
  variant?: "contact" | "quote";
  /** Prefill for the country / destination field (e.g. on an export-market page). */
  defaultCountry?: string;
  /** Unique prefix for input ids when several forms could share a page. */
  idPrefix?: string;
}

/**
 * Bilingual enquiry form. Until a form backend is connected it composes an
 * email with the details pre-filled, so enquiries still reach the sales inbox.
 */
export function EnquiryForm({
  formId,
  variant = "contact",
  defaultCountry = "",
  idPrefix = "enq",
}: EnquiryFormProps) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    country: defaultCountry,
    product: "",
    volume: "",
    incoterm: "",
    samples: false,
    message: "",
  });
  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const id = (field: string) => `${idPrefix}-${field}`;
  const isQuote = variant === "quote";

  if (hasFormId(formId)) {
    return <LeadForm formId={formId!} title="Enquiry Form" formName="Enquiry Form" />;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const lines = [
      `${t(copy.name)}: ${form.name}`,
      `${t(copy.company)}: ${form.company}`,
      `${t(copy.yourEmail)}: ${form.email}`,
      `${t(copy.country)}: ${form.country}`,
      `${t(copy.product)}: ${form.product}`,
      `${t(copy.volume)}: ${form.volume}`,
      ...(isQuote
        ? [
            `${t(copy.incoterm)}: ${form.incoterm}`,
            `${t(copy.samples)}: ${form.samples ? t(copy.yes) : "-"}`,
          ]
        : []),
      "",
      form.message,
    ];
    const subject = t(isQuote ? copy.quoteSubject : copy.enquirySubject, {
      company: form.company || form.name,
    });
    window.location.href = mailtoHref(subject, lines.join("\n"));
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={id("name")}>{t(copy.name)} *</Label>
        <Input
          id={id("name")}
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id("company")}>{t(copy.company)}</Label>
        <Input
          id={id("company")}
          autoComplete="organization"
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id("email")}>{t(copy.yourEmail)} *</Label>
        <Input
          id={id("email")}
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id("country")}>{t(copy.country)}</Label>
        <Input
          id={id("country")}
          autoComplete="country-name"
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id("product")}>{t(copy.product)}</Label>
        <select
          id={id("product")}
          value={form.product}
          onChange={(e) => update("product", e.target.value)}
          className={`${fieldClass} w-full border px-3 outline-none focus-visible:ring-[3px]`}
        >
          <option value="">{t(copy.chooseProduct)}</option>
          {servicesConfig.map((service) => (
            <option key={service.slug} value={t(service.name)}>
              {t(service.name)}
            </option>
          ))}
          <option value={t(copy.other)}>{t(copy.other)}</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id("volume")}>{t(copy.volume)}</Label>
        <Input
          id={id("volume")}
          placeholder={t(copy.volumePlaceholder)}
          value={form.volume}
          onChange={(e) => update("volume", e.target.value)}
          className={fieldClass}
        />
      </div>

      {isQuote && (
        <>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">{t(copy.incoterm)}</legend>
            <div className="flex flex-wrap gap-2">
              {[...INCOTERMS, t(copy.notSure)].map((term) => (
                <label
                  key={term}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    form.incoterm === term
                      ? "border-brand-ink bg-brand-ink text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name={id("incoterm")}
                    value={term}
                    checked={form.incoterm === term}
                    onChange={() => update("incoterm", term)}
                    className="sr-only"
                  />
                  {term}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={form.samples}
              onChange={(e) => update("samples", e.target.checked)}
              className="h-4 w-4 accent-[#13182c]"
            />
            {t(copy.samples)}
          </label>
        </>
      )}

      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor={id("message")}>{t(copy.message)}</Label>
        <Textarea
          id={id("message")}
          rows={5}
          placeholder={t(copy.messagePlaceholder)}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className="rounded-md border-gray-200 bg-white text-base focus-visible:border-primary focus-visible:ring-primary/30"
        />
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">{t(copy.note)}</p>
        <button type="submit" className="btn btn-primary">
          {t(isQuote ? copy.sendQuote : copy.sendEnquiry)}
          <span className="btn-arrow">
            <Send />
          </span>
        </button>
      </div>
    </form>
  );
}
