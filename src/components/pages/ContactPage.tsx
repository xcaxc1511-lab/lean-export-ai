import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  FlaskConical,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Send,
  Ship,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HeroMedia } from "@/components/HeroMedia";
import { LeadForm, hasFormId } from "@/components/LeadForm";
import { businessConfig } from "@/config/business";
import { integrationsConfig } from "@/config/integrations";
import { servicesConfig } from "@/config/services";
import { images } from "@/config/images";
import { phoneHref, emailHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";

const copy = {
  kicker: { en: "Contact", vi: "Liên hệ" },
  title: { en: "Get In Touch", vi: "Liên hệ với chúng tôi" },
  intro: {
    en: "Questions about grades, pricing, samples or shipping? The {name} team will get back to you within one business day.",
    vi: "Bạn có câu hỏi về cấp hạt, giá, mẫu hay vận chuyển? Đội ngũ {name} sẽ phản hồi trong vòng một ngày làm việc.",
  },
  hotline: { en: "Hotline", vi: "Hotline" },
  email: { en: "Email", vi: "Email" },
  office: { en: "Office", vi: "Văn phòng" },
  hours: { en: "Working hours", vi: "Giờ làm việc" },
  callNow: { en: "Call now", vi: "Gọi ngay" },
  writeUs: { en: "Write to us", vi: "Gửi email" },
  timezone: { en: "Vietnam time (GMT+7)", vi: "Giờ Việt Nam (GMT+7)" },
  deskKicker: { en: "Who to contact", vi: "Liên hệ theo nhu cầu" },
  deskTitle: { en: "Reach the right team, faster", vi: "Gặp đúng bộ phận, nhanh hơn" },
  deskIntro: {
    en: "Pick the topic that fits your enquiry — your email opens with the subject already filled in.",
    vi: "Chọn chủ đề phù hợp — email sẽ mở sẵn tiêu đề tương ứng để bạn gửi ngay.",
  },
  formKicker: { en: "Send an enquiry", vi: "Gửi yêu cầu" },
  formTitle: { en: "Tell us what you need", vi: "Cho chúng tôi biết nhu cầu của bạn" },
  formNote: {
    en: "Submitting opens your email app with the details pre-filled.",
    vi: "Khi gửi, ứng dụng email của bạn sẽ mở với nội dung đã điền sẵn.",
  },
  name: { en: "Full name", vi: "Họ và tên" },
  company: { en: "Company", vi: "Công ty" },
  yourEmail: { en: "Your email", vi: "Email của bạn" },
  country: { en: "Country / destination port", vi: "Quốc gia / cảng đến" },
  product: { en: "Product of interest", vi: "Sản phẩm quan tâm" },
  chooseProduct: { en: "Select a product", vi: "Chọn sản phẩm" },
  other: { en: "Other / not sure yet", vi: "Khác / chưa xác định" },
  volume: { en: "Estimated volume", vi: "Sản lượng dự kiến" },
  volumePlaceholder: { en: "e.g. 1 × 20ft container / month", vi: "VD: 1 container 20ft / tháng" },
  message: { en: "Message", vi: "Nội dung" },
  messagePlaceholder: {
    en: "Grade, processing, packing, target price, timeline…",
    vi: "Cấp hạt, phương pháp chế biến, đóng gói, giá mục tiêu, thời gian…",
  },
  send: { en: "Send enquiry", vi: "Gửi yêu cầu" },
  enquirySubject: { en: "Enquiry from {company}", vi: "Yêu cầu từ {company}" },
  visitKicker: { en: "Visit us", vi: "Ghé thăm" },
  visitTitle: { en: "At the heart of Vietnam's coffee country", vi: "Giữa vùng cà phê Tây Nguyên" },
  visitBody: {
    en: "Buyers are welcome to visit our partner farms and processing line during harvest season (November – March). Let us know in advance and we'll arrange the trip.",
    vi: "Khách hàng được chào đón đến thăm vườn liên kết và dây chuyền chế biến trong mùa thu hoạch (tháng 11 – tháng 3). Hãy báo trước để chúng tôi sắp xếp chuyến đi.",
  },
  planVisit: { en: "Plan a visit", vi: "Đặt lịch tham quan" },
  visitSubject: { en: "Farm & factory visit request", vi: "Đăng ký tham quan vườn & nhà máy" },
  quoteCta: { en: "Need pricing? Request a quote", vi: "Cần báo giá? Gửi yêu cầu" },
};

const desks = [
  {
    icon: Handshake,
    title: { en: "Sales & quotations", vi: "Kinh doanh & báo giá" },
    body: {
      en: "Pricing, contracts, payment terms and long-term supply programmes.",
      vi: "Giá bán, hợp đồng, điều khoản thanh toán và chương trình cung ứng dài hạn.",
    },
    subject: { en: "Sales enquiry", vi: "Yêu cầu kinh doanh" },
  },
  {
    icon: FlaskConical,
    title: { en: "Samples & quality", vi: "Mẫu & chất lượng" },
    body: {
      en: "Type samples, cupping reports, specifications and lab results.",
      vi: "Mẫu chào hàng, phiếu cupping, quy cách kỹ thuật và kết quả kiểm nghiệm.",
    },
    subject: { en: "Sample request", vi: "Yêu cầu gửi mẫu" },
  },
  {
    icon: Ship,
    title: { en: "Logistics & documents", vi: "Logistics & chứng từ" },
    body: {
      en: "Shipping schedules, Incoterms, C/O, phytosanitary and EUDR data.",
      vi: "Lịch tàu, điều kiện giao hàng, C/O, kiểm dịch thực vật và dữ liệu EUDR.",
    },
    subject: { en: "Logistics question", vi: "Câu hỏi logistics" },
  },
];

const fieldClass =
  "h-12 rounded-md border-gray-200 bg-white text-base focus-visible:border-primary focus-visible:ring-primary/30";

export default function ContactPage() {
  const { t } = useLang();
  const vars = { name: businessConfig.businessName };
  const telHref = phoneHref();
  const mailTo = (subject: string, body?: string) =>
    `${emailHref()}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    country: "",
    product: "",
    volume: "",
    message: "",
  });
  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const lines = [
      `${t(copy.name)}: ${form.name}`,
      `${t(copy.company)}: ${form.company}`,
      `${t(copy.yourEmail)}: ${form.email}`,
      `${t(copy.country)}: ${form.country}`,
      `${t(copy.product)}: ${form.product}`,
      `${t(copy.volume)}: ${form.volume}`,
      "",
      form.message,
    ];
    window.location.href = mailTo(
      t(copy.enquirySubject, { company: form.company || form.name }),
      lines.join("\n"),
    );
  };

  const infoCards = [
    {
      icon: Phone,
      label: t(copy.hotline),
      value: businessConfig.phone,
      action: { href: telHref, label: t(copy.callNow) },
    },
    {
      icon: Mail,
      label: t(copy.email),
      value: businessConfig.email,
      action: { href: emailHref(), label: t(copy.writeUs) },
    },
    {
      icon: MapPin,
      label: t(copy.office),
      value: t(businessConfig.localized.address),
    },
    {
      icon: Clock,
      label: t(copy.hours),
      lines: businessConfig.businessHours.map((h) => `${t(h.days)}: ${t(h.hours)}`),
      note: t(copy.timezone),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-ink pb-36 pt-24 text-white md:pb-44 md:pt-32">
        <HeroMedia imageUrl={images.portCrane} />
        <div className="absolute inset-0 z-10 bg-linear-to-r from-brand-ink via-brand-ink/75 to-brand-ink/30" />
        <div className="container relative z-20 mx-auto px-4">
          <div className="max-w-3xl">
            <p className="mb-5 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
              <span className="h-0.5 w-8 rounded-full bg-primary" />
              {t(copy.kicker)}
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">{t(copy.title)}</h1>
            <p className="max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
              {t(copy.intro, vars)}
            </p>
          </div>
        </div>
      </section>

      {/* Contact info cards (overlap the hero) */}
      <section className="relative z-30 -mt-24 pb-20 md:-mt-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {infoCards.map((card) => (
              <div
                key={card.label}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-brand-ink/5"
              >
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <card.icon className="h-5 w-5" />
                </span>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {card.label}
                </p>
                {card.value && (
                  <p className="break-words text-lg font-bold text-gray-900">{card.value}</p>
                )}
                {card.lines?.map((line) => (
                  <p key={line} className="text-sm font-medium text-gray-800">
                    {line}
                  </p>
                ))}
                {card.note && <p className="mt-2 text-xs text-gray-500">{card.note}</p>}
                {card.action && (
                  <a
                    href={card.action.href}
                    className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-gray-900 transition-colors hover:text-primary"
                  >
                    {card.action.label} <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Desks + enquiry form */}
      <section className="bg-white pb-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            {/* Who to contact */}
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
                {t(copy.deskKicker)}
              </p>
              <h2 className="mb-4 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
                {t(copy.deskTitle)}
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-600">{t(copy.deskIntro)}</p>

              <div className="grid gap-4">
                {desks.map((desk) => (
                  <a
                    key={desk.subject.en}
                    href={mailTo(t(desk.subject))}
                    className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-white hover:shadow-lg hover:shadow-brand-ink/5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-primary">
                      <desk.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 block text-lg font-bold text-gray-900">
                        {t(desk.title)}
                      </span>
                      <span className="block text-sm leading-relaxed text-gray-600">
                        {t(desk.body)}
                      </span>
                    </span>
                    <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-primary" />
                  </a>
                ))}
              </div>

              <Link
                to="/get-free-quote"
                className="mt-8 inline-flex items-center gap-2 font-semibold text-gray-900 underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary"
              >
                {t(copy.quoteCta)} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Enquiry form */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-10">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-500">
                {t(copy.formKicker)}
              </p>
              <h2 className="mb-8 text-2xl font-bold text-gray-900 md:text-3xl">
                {t(copy.formTitle)}
              </h2>

              {hasFormId(integrationsConfig.contactFormId) ? (
                <LeadForm
                  formId={integrationsConfig.contactFormId}
                  title="Contact Form"
                  formName="Contact Form"
                />
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="c-name">{t(copy.name)} *</Label>
                    <Input
                      id="c-name"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => update("name")(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="c-company">{t(copy.company)}</Label>
                    <Input
                      id="c-company"
                      autoComplete="organization"
                      value={form.company}
                      onChange={(e) => update("company")(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="c-email">{t(copy.yourEmail)} *</Label>
                    <Input
                      id="c-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update("email")(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="c-country">{t(copy.country)}</Label>
                    <Input
                      id="c-country"
                      autoComplete="country-name"
                      value={form.country}
                      onChange={(e) => update("country")(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="c-product">{t(copy.product)}</Label>
                    <select
                      id="c-product"
                      value={form.product}
                      onChange={(e) => update("product")(e.target.value)}
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
                    <Label htmlFor="c-volume">{t(copy.volume)}</Label>
                    <Input
                      id="c-volume"
                      placeholder={t(copy.volumePlaceholder)}
                      value={form.volume}
                      onChange={(e) => update("volume")(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="c-message">{t(copy.message)}</Label>
                    <Textarea
                      id="c-message"
                      rows={5}
                      placeholder={t(copy.messagePlaceholder)}
                      value={form.message}
                      onChange={(e) => update("message")(e.target.value)}
                      className="rounded-md border-gray-200 bg-white text-base focus-visible:border-primary focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">{t(copy.formNote)}</p>
                    <button type="submit" className="btn btn-primary">
                      {t(copy.send)}
                      <span className="btn-arrow">
                        <Send />
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Visit / location */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl bg-brand-ink text-white lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
              <p className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
                <span className="h-0.5 w-8 rounded-full bg-primary" />
                {t(copy.visitKicker)}
              </p>
              <h2 className="mb-5 text-3xl font-bold leading-tight md:text-4xl">
                {t(copy.visitTitle)}
              </h2>
              <p className="mb-6 leading-relaxed text-gray-300">{t(copy.visitBody)}</p>
              <p className="mb-8 flex items-center gap-2 font-medium">
                <MapPin className="h-5 w-5 text-primary" />
                {t(businessConfig.localized.address)}
              </p>
              <div>
                <a href={mailTo(t(copy.visitSubject))} className="btn btn-primary">
                  {t(copy.planVisit)}{" "}
                  <span className="btn-arrow">
                    <ArrowRight />
                  </span>
                </a>
              </div>
            </div>
            <div className="relative min-h-[320px]">
              {integrationsConfig.googleMapsEmbedUrl &&
              integrationsConfig.googleMapsEmbedUrl !== "YOUR_GOOGLE_MAPS_EMBED_URL" ? (
                <iframe
                  src={integrationsConfig.googleMapsEmbedUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${businessConfig.businessName} location`}
                ></iframe>
              ) : (
                <img
                  src={images.heroPlantation.replace("w=1920", "w=1200")}
                  alt={t(copy.visitTitle)}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
