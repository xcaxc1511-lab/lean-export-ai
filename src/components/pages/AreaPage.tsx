import { HeroMedia } from "@/components/HeroMedia";
import { ReviewWidget } from "@/components/ReviewWidget";
import { Link } from "@tanstack/react-router";
import { MapPin, ChevronRight, Phone, Mail, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AreaConfig } from "@/config/areas";
import { businessConfig } from "@/config/business";
import { servicesConfig } from "@/config/services";
import { integrationsConfig } from "@/config/integrations";
import { LeadForm, hasFormId } from "@/components/LeadForm";
import { phoneHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";

const copy = {
  getQuote: { en: "Get a Quote", vi: "Nhận báo giá" },
  introTitle: { en: "Supplying Buyers in {market}", vi: "Cung ứng cho khách hàng tại {market}" },
  productsTitle: { en: "Our Products for {market}", vi: "Sản phẩm cho thị trường {market}" },
  productsIntro: {
    en: "Green, roasted, instant and private-label coffee prepared to {market}'s import requirements.",
    vi: "Cà phê nhân, rang, hòa tan và nhãn riêng — chuẩn bị theo yêu cầu nhập khẩu của {market}.",
  },
  viewDetails: { en: "View Details", vi: "Xem chi tiết" },
  whyTitle: {
    en: "Why {market} Buyers Choose {name}",
    vi: "Vì sao khách hàng {market} chọn {name}",
  },
  whyIntro: {
    en: "Consistent quality, complete documents and clear communication on every shipment to {market}.",
    vi: "Chất lượng ổn định, chứng từ đầy đủ và trao đổi rõ ràng cho mọi lô hàng đến {market}.",
  },
  faqTitle: { en: "{market} Export FAQs", vi: "Hỏi đáp xuất khẩu sang {market}" },
  faqIntro: {
    en: "Common questions about shipping Vietnamese coffee to {market}.",
    vi: "Câu hỏi thường gặp về xuất khẩu cà phê Việt Nam sang {market}.",
  },
  contactTitle: { en: "Talk to Our {market} Desk", vi: "Liên hệ bộ phận thị trường {market}" },
  contactBody: {
    en: "Tell us your product, volume and destination port — we'll send pricing and samples.",
    vi: "Cho chúng tôi biết sản phẩm, sản lượng và cảng đến — chúng tôi sẽ gửi báo giá và mẫu.",
  },
  mapPlaceholder: { en: "Map Embed Placeholder", vi: "Vị trí bản đồ" },
  formTitle: { en: "Request a Quote", vi: "Yêu cầu báo giá" },
  formPlaceholder: { en: "Form Placeholder", vi: "Biểu mẫu" },
};

export default function AreaPage({ area }: { area: AreaConfig }) {
  const { t } = useLang();
  const telHref = phoneHref();
  const vars = { market: t(area.name), name: businessConfig.businessName };
  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-brand-ink-2 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <HeroMedia imageUrl={area.heroImageUrl} />
          <div className="container relative z-20 mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight md:leading-none lg:leading-none">
                {t(area.heroTitle)}
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-10 font-medium">
                {t(area.heroDescription)}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/get-free-quote" className="btn btn-primary w-full sm:w-auto">
                  {t(copy.getQuote)}{" "}
                  <span className="btn-arrow">
                    <ArrowRight />
                  </span>
                </Link>
                <a href={phoneHref()} className="btn btn-outline-light w-full sm:w-auto">
                  <Phone className="h-4 w-4" /> {businessConfig.phone}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Intro Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight md:leading-[2.5rem]">
                  {t(copy.introTitle, vars)}
                </h2>
                <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                  {area.introParagraphs?.map((paragraph, idx) => (
                    <p key={idx}>{t(paragraph)}</p>
                  ))}
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-xl aspect-[4/3] overflow-hidden rounded-sm shadow-xl bg-gray-100 flex flex-col gap-4 items-center justify-center border border-gray-200">
                  {area.introImageUrl ? (
                    <img
                      src={area.introImageUrl}
                      alt={area.introImageAlt ? t(area.introImageAlt) : vars.market}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <>
                      <MapPin className="w-16 h-16 text-gray-400" />
                      <p className="text-gray-500 font-medium text-sm uppercase tracking-widest">
                        {vars.market}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        {servicesConfig.length > 0 && (
          <section className="py-20 bg-brand-ink text-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  {t(copy.productsTitle, vars)}
                </h2>
                <p className="text-lg text-gray-400">{t(copy.productsIntro, vars)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {servicesConfig.map((service) => (
                  <div
                    key={service.slug}
                    className="bg-brand-ink-2 p-8 rounded-sm shadow-sm border border-brand-line hover:border-primary/50 transition-colors group"
                  >
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {t(service.name)}
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                      {t(service.shortDescription)}
                    </p>
                    <Link
                      to="/services/$serviceId"
                      params={{ serviceId: service.slug }}
                      className="inline-flex items-center text-primary font-bold hover:text-primary/80 transition-colors text-sm uppercase tracking-wider"
                    >
                      {t(copy.viewDetails)} <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trust Section */}
        {area.whyChooseCards && area.whyChooseCards.length > 0 && (
          <section className="py-20 bg-[#f8f8f8]">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {t(copy.whyTitle, vars)}
                </h2>
                <p className="text-xl text-gray-600">{t(copy.whyIntro, vars)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {area.whyChooseCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-10 rounded-sm shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-xl font-bold text-gray-900 mb-3 relative z-10">
                      {t(card.title)}
                    </h4>
                    <p className="text-gray-600 text-base leading-relaxed relative z-10">
                      {t(card.description)}
                    </p>
                    <div className="absolute bottom-2 right-4 text-8xl font-bold text-gray-50 z-0 group-hover:text-primary/5 transition-colors">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="py-24 bg-brand-ink-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/80 z-10" />
          <div className="container relative z-20 mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {t(area.reviewsHeading)}
              </h2>
              <p className="text-lg text-gray-300">{t(area.reviewsDescription)}</p>
            </div>
            <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-lg p-8 md:p-16 flex flex-col items-center justify-center min-h-[300px]">
              <ReviewWidget />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {area.faqs && area.faqs.length > 0 && (
          <section className="py-20 bg-brand-ink text-white">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{t(copy.faqTitle, vars)}</h2>
                <p className="text-lg text-gray-400">{t(copy.faqIntro, vars)}</p>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-4">
                {area.faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-none bg-brand-ink-2 rounded-sm px-6"
                  >
                    <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary py-6 transition-colors [&[data-state=open]]:text-primary">
                      {t(faq.question)}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400 text-base leading-relaxed pb-6 pr-8">
                      {t(faq.answer)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        {/* Bottom Contact/Map/Form Section */}
        <section className="py-24 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Left Column: Map & Contact Info */}
              <div>
                <h2 className="text-3xl font-bold mb-8 text-gray-900">
                  {t(copy.contactTitle, vars)}
                </h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">{t(copy.contactBody)}</p>

                <div className="space-y-6 mb-10">
                  <a
                    href={phoneHref()}
                    className="flex items-center gap-4 text-lg text-gray-800 font-medium hover:text-primary transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    {businessConfig.phone}
                  </a>
                  <a
                    href={`mailto:${businessConfig.email}`}
                    className="flex items-center gap-4 text-lg text-gray-800 font-medium hover:text-primary transition-colors break-all min-w-0"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    {businessConfig.email}
                  </a>
                </div>

                {integrationsConfig.googleMapsEmbedUrl &&
                integrationsConfig.googleMapsEmbedUrl !== "YOUR_GOOGLE_MAPS_EMBED_URL" ? (
                  <div
                    className="w-full rounded-sm overflow-hidden border border-gray-200 shadow-sm"
                    style={{ height: "350px" }}
                  >
                    <iframe
                      src={integrationsConfig.googleMapsEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${businessConfig.businessName} Location`}
                    ></iframe>
                  </div>
                ) : (
                  <div
                    className="w-full rounded-sm border border-gray-200 border-dashed bg-gray-50 flex items-center justify-center text-gray-400 font-medium tracking-widest uppercase"
                    style={{ height: "350px" }}
                  >
                    {t(copy.mapPlaceholder)}
                  </div>
                )}
              </div>

              {/* Right Column: Form */}
              <div className="bg-gray-50 p-8 md:p-10 rounded-sm border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{t(copy.formTitle)}</h3>
                {hasFormId(integrationsConfig.quoteFormId) ? (
                  <LeadForm
                    formId={integrationsConfig.quoteFormId}
                    title="Quote Form"
                    formName="Quote Form"
                  />
                ) : (
                  <div className="min-h-[300px] border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 font-medium tracking-widest uppercase p-8 text-center bg-white">
                    <p className="mb-2">{t(copy.formPlaceholder)}</p>
                    <a
                      href={telHref}
                      className="text-sm normal-case tracking-normal hover:text-primary"
                    >
                      {businessConfig.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
