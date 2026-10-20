import { HeroMedia } from "@/components/HeroMedia";
import { businessConfig } from "@/config/business";
import { images } from "@/config/images";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useLang } from "@/lib/i18n";

const copy = {
  heroTitle: { en: "About {name}", vi: "Về {name}" },
  heroBody: {
    en: "Exporting traceable Vietnamese coffee from the Central Highlands to buyers worldwide since {year}.",
    vi: "Xuất khẩu cà phê Việt Nam có truy xuất nguồn gốc từ Tây Nguyên ra thế giới từ năm {year}.",
  },
  overviewTitle: {
    en: "Rooted at Origin, Built for Export",
    vi: "Bắt rễ tại vùng trồng, vươn ra thế giới",
  },
  overview1: {
    en: "{name} is based in {city}, {state} — in the middle of Vietnam's most productive Robusta region. Being at origin means we know our farmers by name, see every harvest first-hand and control quality before coffee ever reaches a warehouse.",
    vi: "{name} đặt trụ sở tại Chư Prông, Gia Lai — giữa vùng Robusta năng suất nhất Việt Nam. Ở ngay vùng nguyên liệu giúp chúng tôi biết từng hộ nông dân, theo sát mỗi vụ thu hoạch và kiểm soát chất lượng trước khi cà phê vào kho.",
  },
  overview2: {
    en: "We run a lean export operation: one team handles sourcing, processing, grading, documents and logistics, so buyers get one point of contact and fast, accurate answers. Our goal is simple — coffee that matches the sample, shipments that arrive on time, and partnerships that last for many harvests.",
    vi: "Chúng tôi vận hành xuất khẩu tinh gọn: một đội ngũ phụ trách thu mua, chế biến, phân loại, chứng từ và logistics, nên khách hàng chỉ cần một đầu mối và nhận phản hồi nhanh, chính xác. Mục tiêu rất đơn giản — cà phê đúng như mẫu, giao hàng đúng hẹn và hợp tác bền lâu qua nhiều mùa vụ.",
  },
  whyTitle: { en: "Why Buyers Choose Us", vi: "Vì sao khách hàng chọn chúng tôi" },
  whyIntro: {
    en: "There are many coffee exporters in Vietnam. Here is what sets us apart.",
    vi: "Việt Nam có rất nhiều doanh nghiệp xuất khẩu cà phê. Đây là điều làm chúng tôi khác biệt.",
  },
  cards: [
    {
      title: { en: "Direct from Origin", vi: "Trực tiếp từ vùng trồng" },
      body: {
        en: "We buy straight from partner farms in Gia Lai, Dak Lak and Lam Dong — no long chain of middlemen.",
        vi: "Thu mua trực tiếp từ vườn liên kết tại Gia Lai, Đắk Lắk và Lâm Đồng — không qua nhiều tầng trung gian.",
      },
    },
    {
      title: { en: "Consistent Quality", vi: "Chất lượng ổn định" },
      body: {
        en: "In-house grading, optical sorting and cupping keep every lot true to its contract.",
        vi: "Tự phân loại, máy bắn màu và cupping nội bộ giúp mỗi lô hàng đúng như hợp đồng.",
      },
    },
    {
      title: { en: "Full Traceability", vi: "Truy xuất đầy đủ" },
      body: {
        en: "Farm records and geolocation data ready for EUDR and other compliance needs.",
        vi: "Hồ sơ vườn trồng và dữ liệu định vị sẵn sàng cho EUDR và các yêu cầu tuân thủ khác.",
      },
    },
  ],
  ctaTitle: { en: "Ready to Source Vietnamese Coffee?", vi: "Sẵn sàng nhập cà phê Việt Nam?" },
  ctaBody: {
    en: "Contact {name} for current offers, samples and shipping schedules.",
    vi: "Liên hệ {name} để nhận chào hàng mới nhất, mẫu thử và lịch tàu.",
  },
  ctaQuote: { en: "Get a Quote", vi: "Nhận báo giá" },
  ctaContact: { en: "Contact Us", vi: "Liên hệ" },
};

export default function AboutPage() {
  const { t } = useLang();
  const vars = {
    name: businessConfig.businessName,
    year: businessConfig.establishedYear,
    city: businessConfig.address,
    state: businessConfig.city,
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 bg-brand-ink-2 flex items-center justify-center overflow-hidden pt-[120px]">
          <HeroMedia imageUrl={images.coffeeBlossom} />
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="container relative z-20 mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t(copy.heroTitle, vars)}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              {t(copy.heroBody, vars)}
            </p>
          </div>
        </section>

        {/* Company Overview */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
                {t(copy.overviewTitle)}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {t(copy.overview1, vars)}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">{t(copy.overview2)}</p>
            </div>
          </div>
        </section>

        {/* Values / Why Choose Us */}
        <section className="py-24 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {t(copy.whyTitle)}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t(copy.whyIntro)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {copy.cards.map((card) => (
                <div
                  key={card.title.en}
                  className="bg-white p-8 rounded-sm shadow-sm border border-gray-100"
                >
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">{t(card.title)}</h3>
                  <p className="text-gray-600 leading-relaxed">{t(card.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-brand-ink py-24 text-center text-white md:py-28">
          <img
            src={images.containerStacks}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-linear-to-b from-brand-ink/90 via-brand-ink/75 to-brand-ink/90" />
          <div className="container relative z-10 mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t(copy.ctaTitle)}</h2>
            <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto">{t(copy.ctaBody, vars)}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/get-free-quote" className="btn btn-primary">
                {t(copy.ctaQuote)}{" "}
                <span className="btn-arrow">
                  <ArrowRight />
                </span>
              </Link>
              <Link to="/contact" className="btn btn-outline-light">
                {t(copy.ctaContact)}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
