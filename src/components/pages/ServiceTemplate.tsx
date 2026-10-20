import { HeroMedia } from "@/components/HeroMedia";
import { Link } from "@tanstack/react-router";
import type { ServiceConfig } from "@/config/services";
import { businessConfig } from "@/config/business";
import { phoneHref } from "@/lib/contact";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const telHref = phoneHref();

const copy = {
  getQuote: { en: "Get a Quote", vi: "Nhận báo giá" },
  introTitle: { en: "{name} — Specification & Supply", vi: "{name} — Quy cách & nguồn cung" },
  imagePlaceholder: { en: "{name} Image Placeholder", vi: "Ảnh {name}" },
  processTitle: { en: "How We Prepare Your {name}", vi: "Quy trình chuẩn bị {name}" },
  processIntro: {
    en: "Every lot follows a documented process so quality is consistent from sample to shipment.",
    vi: "Mỗi lô hàng tuân theo quy trình có hồ sơ để chất lượng đồng nhất từ mẫu đến lô giao.",
  },
  faqTitle: { en: "Common Questions", vi: "Câu hỏi thường gặp" },
  faqIntro: {
    en: "What buyers usually ask about our {name}.",
    vi: "Những điều khách hàng thường hỏi về {name}.",
  },
  ctaTitle: { en: "Ready to Order {name}?", vi: "Sẵn sàng đặt hàng {name}?" },
  ctaBody: {
    en: "Share your grade, volume and destination port — we'll reply with pricing, samples and shipping schedule.",
    vi: "Gửi cho chúng tôi cấp hạt, sản lượng và cảng đến — chúng tôi sẽ phản hồi giá, mẫu và lịch tàu.",
  },
  ctaButton: { en: "Request a Quote", vi: "Yêu cầu báo giá" },
};

const ServiceTemplate = ({ service }: { service: ServiceConfig }) => {
  const { t } = useLang();
  const name = t(service.name);
  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="relative py-24 bg-brand-ink-2 overflow-hidden">
          <HeroMedia imageUrl={service.heroImageUrl || service.imageUrl} className="opacity-40" />
          {(service.heroImageUrl || service.imageUrl !== "/placeholder.svg") && (
            <div className="absolute inset-0 bg-linear-to-r from-black/80 to-black/40" />
          )}
          <div className="container relative z-10 mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight md:leading-none">
                {t(service.heroTitle) || name}
              </h1>
              <p className="text-xl text-gray-200 mb-10 leading-relaxed max-w-2xl">
                {t(service.heroDescription) || t(service.shortDescription)}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/get-free-quote" className="btn btn-primary">
                  {t(copy.getQuote)}{" "}
                  <span className="btn-arrow">
                    <ArrowRight />
                  </span>
                </Link>
                <a href={telHref} className="btn btn-outline-light">
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
                  {t(copy.introTitle, { name })}
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  {t(service.shortDescription)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {service.features?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                      <span className="text-gray-700 font-medium">{t(feature)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-sm overflow-hidden shadow-2xl bg-gray-100 flex items-center justify-center">
                  {service.imageUrl && service.imageUrl !== "/placeholder.svg" ? (
                    <img
                      src={service.imageUrl}
                      alt={t(service.imageAlt) || name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <p className="text-gray-400 text-sm uppercase tracking-widest">
                      {t(copy.imagePlaceholder, { name })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        {service.processSteps && service.processSteps.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {t(copy.processTitle, { name })}
                </h2>
                <p className="text-gray-600 text-lg">{t(copy.processIntro)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {service.processSteps.map((step, i) => (
                  <div
                    key={i}
                    className="bg-white p-8 rounded-sm shadow-sm border border-gray-100 relative group hover:border-primary/20 transition-all"
                  >
                    <div className="text-4xl font-bold text-gray-100 absolute top-4 right-6 group-hover:text-primary/5 transition-colors">
                      0{i + 1}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 relative z-10">
                      {t(step.title)}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed relative z-10">
                      {t(step.description)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {service.faqs && service.faqs.length > 0 && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {t(copy.faqTitle)}
                </h2>
                <p className="text-gray-600">{t(copy.faqIntro, { name })}</p>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {service.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b border-gray-200">
                    <AccordionTrigger className="text-left font-bold text-gray-900 py-6 hover:text-primary hover:no-underline">
                      {t(faq.question)}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                      {t(faq.answer)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-brand-ink py-24 text-white md:py-28">
          <img
            src={service.ctaImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-linear-to-b from-brand-ink/90 via-brand-ink/75 to-brand-ink/90" />
          <div className="container relative z-10 mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">{t(copy.ctaTitle, { name })}</h2>
            <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto">{t(copy.ctaBody)}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/get-free-quote" className="btn btn-primary w-full sm:w-auto">
                {t(copy.ctaButton)}{" "}
                <span className="btn-arrow">
                  <ArrowRight />
                </span>
              </Link>
              <a href={telHref} className="btn btn-outline-light w-full sm:w-auto">
                <Phone className="h-4 w-4" /> {businessConfig.phone}
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ServiceTemplate;
