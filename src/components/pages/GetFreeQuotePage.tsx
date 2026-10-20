import { Check, Mail, MessageCircle, Phone } from "lucide-react";
import { HeroMedia } from "@/components/HeroMedia";
import { EnquiryForm } from "@/components/EnquiryForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { businessConfig } from "@/config/business";
import { integrationsConfig } from "@/config/integrations";
import { images } from "@/config/images";
import { phoneHref, emailHref, whatsappHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";

const copy = {
  kicker: { en: "Request a Quote", vi: "Yêu cầu báo giá" },
  title: { en: "Get Pricing for Vietnamese Coffee", vi: "Nhận báo giá cà phê Việt Nam" },
  intro: {
    en: "Tell us the product, grade, volume and destination port. The {name} team will reply with FOB/CIF pricing and sample options.",
    vi: "Cho chúng tôi biết sản phẩm, cấp hạt, sản lượng và cảng đến. Đội ngũ {name} sẽ phản hồi giá FOB/CIF và phương án gửi mẫu.",
  },
  promises: [
    { en: "Reply within one business day", vi: "Phản hồi trong một ngày làm việc" },
    { en: "Free type samples", vi: "Mẫu chào hàng miễn phí" },
    { en: "FOB · CIF · CFR", vi: "FOB · CIF · CFR" },
  ],
  formKicker: { en: "Quote request", vi: "Yêu cầu báo giá" },
  formTitle: { en: "Your requirements", vi: "Nhu cầu của bạn" },
  stepsTitle: { en: "What happens next", vi: "Quy trình tiếp theo" },
  steps: [
    {
      title: { en: "We review your request", vi: "Tiếp nhận yêu cầu" },
      body: {
        en: "Our sales team checks grade, volume and current availability.",
        vi: "Bộ phận kinh doanh kiểm tra cấp hạt, sản lượng và nguồn hàng hiện có.",
      },
    },
    {
      title: { en: "You receive an offer", vi: "Gửi chào giá" },
      body: {
        en: "Pricing on your Incoterm, with specification and packing options.",
        vi: "Báo giá theo điều kiện giao hàng, kèm quy cách và phương án đóng gói.",
      },
    },
    {
      title: { en: "Samples & approval", vi: "Gửi mẫu & duyệt" },
      body: {
        en: "Type samples by courier so you can cup before you commit.",
        vi: "Gửi mẫu chào hàng qua chuyển phát để bạn thử nếm trước khi quyết định.",
      },
    },
    {
      title: { en: "Contract & shipment", vi: "Hợp đồng & giao hàng" },
      body: {
        en: "We prepare the contract, documents and book the vessel.",
        vi: "Chúng tôi soạn hợp đồng, chuẩn bị chứng từ và đặt lịch tàu.",
      },
    },
  ],
  directTitle: { en: "Prefer to talk?", vi: "Muốn trao đổi trực tiếp?" },
  hotline: { en: "Hotline", vi: "Hotline" },
  email: { en: "Email", vi: "Email" },
  faqTitle: { en: "Before you ask", vi: "Câu hỏi thường gặp" },
  faqs: [
    {
      q: {
        en: "What is the minimum order quantity?",
        vi: "Số lượng đặt hàng tối thiểu là bao nhiêu?",
      },
      a: {
        en: "One 20ft container (about 19.2 MT) for green coffee. Roasted, instant and private-label orders can start smaller.",
        vi: "Một container 20ft (khoảng 19,2 tấn) với cà phê nhân. Đơn cà phê rang, hòa tan và nhãn riêng có thể bắt đầu với số lượng nhỏ hơn.",
      },
    },
    {
      q: {
        en: "Which payment terms do you accept?",
        vi: "Bạn chấp nhận điều khoản thanh toán nào?",
      },
      a: {
        en: "Typically T/T (deposit and balance against documents) or L/C at sight. We agree the details in each contract.",
        vi: "Thông thường là T/T (đặt cọc và thanh toán phần còn lại khi nhận chứng từ) hoặc L/C trả ngay. Chi tiết được thống nhất trong từng hợp đồng.",
      },
    },
    {
      q: { en: "How long until shipment?", vi: "Bao lâu thì giao hàng?" },
      a: {
        en: "Usually 2–4 weeks after the contract and sample approval, depending on grade, volume and vessel schedule.",
        vi: "Thường 2–4 tuần sau khi ký hợp đồng và duyệt mẫu, tùy cấp hạt, sản lượng và lịch tàu.",
      },
    },
  ],
};

export default function GetFreeQuotePage() {
  const { t } = useLang();
  const vars = { name: businessConfig.businessName };

  const direct = [
    { icon: Phone, label: t(copy.hotline), value: businessConfig.phone, href: phoneHref() },
    { icon: Mail, label: t(copy.email), value: businessConfig.email, href: emailHref() },
    ...(businessConfig.whatsapp
      ? [
          {
            icon: MessageCircle,
            label: "WhatsApp",
            value: `+${businessConfig.whatsapp}`,
            href: whatsappHref(),
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-ink pb-36 pt-24 text-white md:pb-44 md:pt-32">
        <HeroMedia imageUrl={images.sacks} />
        <div className="absolute inset-0 z-10 bg-linear-to-r from-brand-ink via-brand-ink/80 to-brand-ink/40" />
        <div className="container relative z-20 mx-auto px-4">
          <div className="max-w-3xl">
            <p className="mb-5 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
              <span className="h-0.5 w-8 rounded-full bg-primary" />
              {t(copy.kicker)}
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">{t(copy.title)}</h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
              {t(copy.intro, vars)}
            </p>
            <ul className="flex flex-wrap gap-3">
              {copy.promises.map((promise) => (
                <li
                  key={promise.en}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium backdrop-blur-sm"
                >
                  <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                  {t(promise)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Form + sidebar (overlap the hero) */}
      <section className="relative z-30 -mt-24 pb-20 md:-mt-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:gap-8">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-brand-ink/5 md:p-10">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-500">
                {t(copy.formKicker)}
              </p>
              <h2 className="mb-8 text-2xl font-bold text-gray-900 md:text-3xl">
                {t(copy.formTitle)}
              </h2>
              <EnquiryForm
                formId={integrationsConfig.quoteFormId}
                variant="quote"
                idPrefix="quote"
              />
            </div>

            <aside className="flex flex-col gap-6">
              <div className="rounded-2xl bg-brand-ink p-6 text-white shadow-xl shadow-brand-ink/10 md:p-8">
                <h3 className="mb-6 text-xl font-bold">{t(copy.stepsTitle)}</h3>
                <ol className="relative grid gap-6">
                  <span
                    className="absolute bottom-4 left-[15px] top-4 w-px bg-white/15"
                    aria-hidden="true"
                  />
                  {copy.steps.map((step, i) => (
                    <li key={step.title.en} className="relative flex gap-4">
                      <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{t(step.title)}</p>
                        <p className="text-sm leading-relaxed text-gray-400">{t(step.body)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
                <h3 className="mb-5 text-xl font-bold text-gray-900">{t(copy.directTitle)}</h3>
                <div className="grid gap-3">
                  {direct.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-primary hover:bg-white"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                          {item.label}
                        </span>
                        <span className="block truncate font-bold text-gray-900">{item.value}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Quick FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            {t(copy.faqTitle)}
          </h2>
          <Accordion type="single" collapsible className="grid gap-3">
            {copy.faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q.en}
                value={`faq-${i}`}
                className="rounded-xl border border-gray-200 bg-white px-6"
              >
                <AccordionTrigger className="py-5 text-left text-lg font-semibold text-gray-900 hover:no-underline">
                  {t(faq.q)}
                </AccordionTrigger>
                <AccordionContent className="pb-5 leading-relaxed text-gray-600">
                  {t(faq.a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
