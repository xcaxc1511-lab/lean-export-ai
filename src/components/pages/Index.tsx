import { HeroMedia } from "@/components/HeroMedia";
import { Link } from "@tanstack/react-router";
import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileCheck,
  Globe,
  Mail,
  MapPin,
  Phone,
  Ship,
} from "lucide-react";
import { businessConfig } from "@/config/business";
import { servicesConfig } from "@/config/services";
import { areasConfig } from "@/config/areas";
import { integrationsConfig } from "@/config/integrations";
import { images } from "@/config/images";
import { phoneHref, emailHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";

const copy = {
  heroTitle: {
    en: "Vietnamese Coffee, Exported Lean & Traceable",
    vi: "Cà phê Việt Nam — xuất khẩu tinh gọn & minh bạch",
  },
  getQuote: { en: "Get a Quote", vi: "Nhận báo giá" },
  productsKicker: { en: "Our Products", vi: "Sản phẩm của chúng tôi" },
  viewProduct: { en: "View {name}", vi: "Xem {name}" },
  aboutKicker: { en: "About Us", vi: "Về chúng tôi" },
  aboutTitle: {
    en: "From Central Highlands Farms to Your Port",
    vi: "Từ nông trại Tây Nguyên đến cảng của bạn",
  },
  aboutBody: {
    en: "{name} was founded in {city} — the heart of Vietnam's Robusta country — in {year}. We work directly with farming families, process and grade every lot ourselves, and handle the export paperwork so importers, roasters and brands get consistent coffee with no surprises.",
    vi: "{name} được thành lập tại {city} — trái tim vùng Robusta của Việt Nam — từ năm {year}. Chúng tôi làm việc trực tiếp với các hộ nông dân, tự chế biến và phân loại từng lô, đồng thời lo trọn thủ tục xuất khẩu để nhà nhập khẩu, nhà rang và thương hiệu nhận được cà phê ổn định, không bất ngờ.",
  },
  aboutCta: { en: "More About Us", vi: "Tìm hiểu thêm" },
  aboutImageAlt: { en: "Coffee cherries harvested by hand", vi: "Quả cà phê thu hái bằng tay" },
  processKicker: { en: "How It Works", vi: "Quy trình" },
  processTitle: { en: "From Cherry to Container", vi: "Từ quả cà phê đến container" },
  processIntro: {
    en: "A lean, documented export process — so you always know where your coffee comes from and when it will arrive.",
    vi: "Quy trình xuất khẩu tinh gọn, có hồ sơ rõ ràng — để bạn luôn biết cà phê đến từ đâu và khi nào cập cảng.",
  },
  videoTitle: { en: "A Closer Look at {name}", vi: "Cận cảnh {name}" },
  videoBody: {
    en: "Meet the farms, the processing line and the people behind every shipment.",
    vi: "Gặp gỡ nông trại, dây chuyền chế biến và những con người đứng sau mỗi lô hàng.",
  },
  galleryKicker: { en: "Photo Gallery", vi: "Hình ảnh" },
  galleryTitle: { en: "From Our Farms & Factory", vi: "Từ nông trại & nhà máy" },
  quoteTitle: { en: "Request a Quote", vi: "Yêu cầu báo giá" },
  talkTitle: { en: "Ready to Talk With {name}?", vi: "Sẵn sàng trao đổi với {name}?" },
  talkBody: {
    en: "Tell us the product, grade, volume and destination port — we'll reply with FOB/CIF pricing and sample options.",
    vi: "Cho chúng tôi biết sản phẩm, cấp hạt, sản lượng và cảng đến — chúng tôi sẽ phản hồi giá FOB/CIF và phương án gửi mẫu.",
  },
  promises: [
    { en: "Reply within one business day", vi: "Phản hồi trong vòng một ngày làm việc" },
    { en: "Free type samples by courier", vi: "Gửi mẫu chào hàng miễn phí qua chuyển phát" },
    { en: "FOB or CIF pricing to your port", vi: "Báo giá FOB hoặc CIF đến cảng của bạn" },
  ],
  hotline: { en: "Hotline", vi: "Hotline" },
  contactUs: { en: "Contact Us", vi: "Liên hệ" },
  marketsTitle: { en: "Proudly Exporting To", vi: "Thị trường xuất khẩu" },
  marketsSubtitle: { en: "{count} key markets worldwide", vi: "{count} thị trường trọng điểm" },
  facts: [
    {
      icon: Ship,
      label: { en: "Incoterms", vi: "Điều kiện giao" },
      value: { en: "FOB · CIF · CFR", vi: "FOB · CIF · CFR" },
    },
    {
      icon: Anchor,
      label: { en: "Port of loading", vi: "Cảng xếp hàng" },
      value: { en: "Ho Chi Minh City", vi: "TP. Hồ Chí Minh" },
    },
    {
      icon: FileCheck,
      label: { en: "Documents", vi: "Chứng từ" },
      value: { en: "C/O · Phyto · QC", vi: "C/O · Kiểm dịch · QC" },
    },
  ],
  locationTitle: { en: "{name} Location", vi: "Vị trí {name}" },
};

const processSteps = [
  {
    title: { en: "Farm Sourcing", vi: "Thu mua tại vườn" },
    body: {
      en: "We buy ripe cherries from partner farms in Gia Lai, Dak Lak and Lam Dong, recording every plot for traceability.",
      vi: "Thu mua quả chín từ vườn liên kết tại Gia Lai, Đắk Lắk và Lâm Đồng, ghi nhận từng lô đất để truy xuất nguồn gốc.",
    },
  },
  {
    title: { en: "Processing & Drying", vi: "Chế biến & phơi sấy" },
    body: {
      en: "Natural, honey or washed processing, then controlled drying to a stable export moisture.",
      vi: "Chế biến tự nhiên, honey hoặc ướt, sau đó phơi sấy có kiểm soát đến độ ẩm xuất khẩu ổn định.",
    },
  },
  {
    title: { en: "Grading & Sorting", vi: "Phân loại & sàng lọc" },
    body: {
      en: "Screen sizing, density tables and optical sorters bring every lot to its contracted grade.",
      vi: "Sàng cỡ hạt, bàn tỷ trọng và máy bắn màu đưa từng lô về đúng cấp hạt theo hợp đồng.",
    },
  },
  {
    title: { en: "Cupping & Samples", vi: "Cupping & gửi mẫu" },
    body: {
      en: "Our QC team cups each lot and sends type and pre-shipment samples for your approval.",
      vi: "Bộ phận QC cupping từng lô và gửi mẫu chào hàng, mẫu trước giao hàng để bạn duyệt.",
    },
  },
  {
    title: { en: "Packing & Documents", vi: "Đóng gói & chứng từ" },
    body: {
      en: "Jute bags, GrainPro or bulk liners — plus phytosanitary, origin and quality certificates.",
      vi: "Bao đay, túi GrainPro hoặc container lót bulk — kèm giấy kiểm dịch, C/O và chứng nhận chất lượng.",
    },
  },
  {
    title: { en: "Shipping & Follow-up", vi: "Vận chuyển & hậu mãi" },
    body: {
      en: "FOB or CIF from Ho Chi Minh City with tracking updates until your coffee is cleared at destination.",
      vi: "Giao FOB hoặc CIF từ TP.HCM, cập nhật hành trình đến khi cà phê thông quan tại cảng đến.",
    },
  },
];

const gallery = [
  { src: images.coffeeBlossom, alt: { en: "Coffee plants in bloom", vi: "Vườn cà phê trổ hoa" } },
  {
    src: images.cherriesOnBranch,
    alt: { en: "Ripening coffee cherries", vi: "Quả cà phê đang chín" },
  },
  { src: images.greenBeans, alt: { en: "Green coffee beans", vi: "Cà phê nhân xanh" } },
  { src: images.beansInSack, alt: { en: "Beans in jute sacks", vi: "Cà phê trong bao đay" } },
  { src: images.roaster, alt: { en: "Roasting in progress", vi: "Đang rang cà phê" } },
  {
    src: images.cupping,
    alt: { en: "Quality cupping session", vi: "Thử nếm kiểm định chất lượng" },
  },
  { src: images.roastedPile, alt: { en: "Roasted coffee beans", vi: "Cà phê đã rang" } },
  { src: images.cargoShip, alt: { en: "Container ship at port", vi: "Tàu container tại cảng" } },
];

export default function Index() {
  const { t } = useLang();
  const vars = {
    name: businessConfig.businessName,
    city: businessConfig.city,
    year: businessConfig.establishedYear,
  };

  // Build YouTube embed URL from video ID
  const youtubeEmbedUrl =
    integrationsConfig.youtubeVideoId &&
    integrationsConfig.youtubeVideoId !== "YOUR_YOUTUBE_VIDEO_ID"
      ? `https://www.youtube-nocookie.com/embed/${integrationsConfig.youtubeVideoId}`
      : null;

  const telHref = phoneHref();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="relative h-[100vh] min-h-[680px] md:min-h-[700px] flex items-center justify-center bg-brand-ink-2 overflow-hidden">
          <HeroMedia
            imageUrl={integrationsConfig.heroPosterUrl}
            videoUrl={integrationsConfig.heroVideoUrl}
          />
          <div className="absolute inset-0 bg-black/50" />

          <div className="container relative z-10 mx-auto px-4 text-center md:text-left pt-16">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight md:leading-none lg:leading-none">
                {t(copy.heroTitle)}
              </h1>
              <p className="text-lg md:text-2xl text-gray-200 mb-10 font-medium">
                {t(businessConfig.localized.tagline)}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/get-free-quote" className="btn btn-primary w-full sm:w-auto">
                  {t(copy.getQuote)}{" "}
                  <span className="btn-arrow">
                    <ArrowRight />
                  </span>
                </Link>
                <a href={telHref} className="btn btn-outline-light w-full sm:w-auto">
                  <Phone className="h-4 w-4" /> {businessConfig.phone}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        {servicesConfig.length > 0 && (
          <section className="py-20 bg-[#f8f8f8]">
            <div className="container mx-auto px-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8 text-center md:text-left">
                {t(copy.productsKicker)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {servicesConfig.map((service) => (
                  <Link
                    key={service.slug}
                    to="/services/$serviceId"
                    params={{ serviceId: service.slug }}
                    aria-label={t(copy.viewProduct, { name: t(service.name) })}
                    className="bg-white shadow-sm overflow-hidden group cursor-pointer flex flex-col h-full"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={service.imageUrl}
                        alt={t(service.imageAlt)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute bottom-4 left-4 bg-black/80 text-white px-4 py-2 font-bold text-lg flex items-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {t(service.name)} <span className="text-xl leading-none">→</span>
                      </div>
                    </div>
                    <div className="p-6 flex-grow">
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {t(service.shortDescription)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                  {t(copy.aboutKicker)}
                </h3>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight md:leading-none">
                  {t(copy.aboutTitle)}
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  {t(copy.aboutBody, vars)}
                </p>
                <Link to="/about" className="btn btn-primary">
                  {t(copy.aboutCta)}{" "}
                  <span className="btn-arrow">
                    <ArrowRight />
                  </span>
                </Link>
              </div>
              <div className="flex justify-center lg:justify-end">
                <img
                  src={images.cherriesHandful}
                  alt={t(copy.aboutImageAlt)}
                  className="w-full max-w-4xl aspect-[4/3] object-cover rounded-sm shadow-xl"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-24 bg-brand-ink text-white">
          <div className="container mx-auto px-4">
            <div className="mb-16 md:w-2/3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                {t(copy.processKicker)}
              </h3>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{t(copy.processTitle)}</h2>
              <p className="text-xl text-gray-400">{t(copy.processIntro)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processSteps.map((step, i) => (
                <div
                  key={i}
                  className="bg-brand-ink-2 p-8 rounded-sm relative overflow-hidden group hover:bg-brand-ink-3 transition-colors"
                >
                  <h4 className="text-lg font-bold uppercase tracking-wider mb-4">
                    {t(step.title)}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                    {t(step.body)}
                  </p>
                  <div className="absolute bottom-2 right-4 text-7xl font-bold text-white/5 z-0 group-hover:text-primary/10 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Section */}
        {youtubeEmbedUrl && (
          <section className="py-24 bg-gray-50 border-t border-gray-100">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {t(copy.videoTitle, vars)}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">{t(copy.videoBody)}</p>
              </div>
              <div className="max-w-[1100px] mx-auto bg-white p-2 md:p-4 rounded-lg shadow-xl">
                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`${businessConfig.businessName} video`}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        <section id="photo-gallery" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                {t(copy.galleryKicker)}
              </h3>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                {t(copy.galleryTitle)}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((item, index) => (
                <figure
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-sm group bg-gray-200"
                >
                  <img
                    src={item.src.replace("w=1600", "w=800").replace("w=1920", "w=800")}
                    alt={t(item.alt)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-xs font-medium text-white">
                    {t(item.alt)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Request a Quote & Export Markets Section */}
        <section
          id="request-free-quote"
          className="relative overflow-hidden bg-brand-ink py-24 text-white md:py-28"
        >
          <img
            src={images.cargoShip}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-linear-to-r from-brand-ink via-brand-ink/95 to-brand-ink/75" />

          <div className="container relative z-10 mx-auto px-4">
            <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
              {/* Left Column: pitch & contact */}
              <div className="flex flex-col">
                <p className="mb-5 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
                  <span className="h-0.5 w-8 rounded-full bg-primary" />
                  {t(copy.quoteTitle)}
                </p>
                <h2 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
                  {t(copy.talkTitle, vars)}
                </h2>
                <p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-300">
                  {t(copy.talkBody)}
                </p>

                <ul className="mb-10 grid gap-3">
                  {copy.promises.map((promise) => (
                    <li key={promise.en} className="flex items-center gap-3 text-gray-200">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {t(promise)}
                    </li>
                  ))}
                </ul>

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                  <a
                    href={telHref}
                    className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-primary/60 hover:bg-white/[0.07]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Phone className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {t(copy.hotline)}
                      </span>
                      <span className="block text-lg font-bold text-white transition-colors group-hover:text-primary">
                        {businessConfig.phone}
                      </span>
                    </span>
                  </a>
                  <a
                    href={emailHref()}
                    className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-primary/60 hover:bg-white/[0.07]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Mail className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Email
                      </span>
                      <span className="block truncate text-lg font-bold text-white transition-colors group-hover:text-primary">
                        {businessConfig.email}
                      </span>
                    </span>
                  </a>
                </div>

                <p className="mb-10 flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t(businessConfig.localized.address)}
                </p>

                <div className="mt-auto flex flex-col gap-4 sm:flex-row">
                  <Link to="/get-free-quote" className="btn btn-primary">
                    {t(copy.getQuote)}{" "}
                    <span className="btn-arrow">
                      <ArrowRight />
                    </span>
                  </Link>
                  <Link to="/contact" className="btn btn-outline-light">
                    {t(copy.contactUs)}
                  </Link>
                </div>
              </div>

              {/* Right Column: export markets */}
              {areasConfig.length > 0 && (
                <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm md:p-8">
                  <div className="mb-6">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                      <Globe className="h-4 w-4" />
                      {t(copy.marketsTitle)}
                    </p>
                    <h3 className="text-2xl font-bold md:text-3xl">
                      {t(copy.marketsSubtitle, { count: areasConfig.length })}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {areasConfig.map((area) => (
                      <Link
                        key={area.slug}
                        to="/areas/$areaId"
                        params={{ areaId: area.slug }}
                        className="group relative block h-32 overflow-hidden rounded-xl md:h-40"
                      >
                        {area.heroImageUrl && (
                          <img
                            src={area.heroImageUrl.replace("w=1920", "w=640")}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10" />
                        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                        <span className="absolute inset-x-4 bottom-3">
                          <span className="block text-base font-bold leading-tight text-white md:text-lg">
                            {t(area.name)}
                          </span>
                          <span className="block text-xs text-gray-300">{t(area.region)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
                    {copy.facts.map((fact) => (
                      <div key={fact.label.en} className="flex items-start gap-3">
                        <fact.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {t(fact.label)}
                          </p>
                          <p className="text-sm font-medium text-white">{t(fact.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {integrationsConfig.googleMapsEmbedUrl &&
                    integrationsConfig.googleMapsEmbedUrl !== "YOUR_GOOGLE_MAPS_EMBED_URL" && (
                      <div className="mt-6 h-64 w-full overflow-hidden rounded-xl border border-white/10">
                        <iframe
                          src={integrationsConfig.googleMapsEmbedUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={t(copy.locationTitle, vars)}
                        ></iframe>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
