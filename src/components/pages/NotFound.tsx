import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { images } from "@/config/images";
import { servicesConfig } from "@/config/services";
import { useLang } from "@/lib/i18n";

const copy = {
  kicker: { en: "Error 404", vi: "Lỗi 404" },
  title: { en: "This shipment went off course", vi: "Lô hàng này đã đi lạc hướng" },
  body: {
    en: "The page you're looking for doesn't exist or has moved. Head back home, or jump straight to one of our products.",
    vi: "Trang bạn tìm không tồn tại hoặc đã được chuyển đi. Hãy quay về trang chủ hoặc xem ngay các sản phẩm của chúng tôi.",
  },
  home: { en: "Back to home", vi: "Về trang chủ" },
  contact: { en: "Contact us", vi: "Liên hệ" },
  popular: { en: "Popular products", vi: "Sản phẩm nổi bật" },
};

const NotFound = () => {
  const { t } = useLang();
  return (
    <section className="relative flex min-h-[calc(100vh-6rem)] items-center overflow-hidden bg-brand-ink py-24 text-white">
      <img
        src={images.containerStacks}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-r from-brand-ink via-brand-ink/90 to-brand-ink/60" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-2xl">
          <p
            className="mb-2 text-[7rem] font-bold leading-none text-transparent md:text-[10rem]"
            style={{ WebkitTextStroke: "2px #f5cf5a" }}
            aria-hidden="true"
          >
            404
          </p>
          <p className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
            <span className="h-0.5 w-8 rounded-full bg-primary" />
            {t(copy.kicker)}
          </p>
          <h1 className="mb-5 text-3xl font-bold leading-tight md:text-5xl">{t(copy.title)}</h1>
          <p className="mb-10 text-lg leading-relaxed text-gray-300">{t(copy.body)}</p>

          <div className="mb-12 flex flex-col gap-4 sm:flex-row">
            <Link to="/" className="btn btn-primary">
              {t(copy.home)}
              <span className="btn-arrow">
                <ArrowRight />
              </span>
            </Link>
            <Link to="/contact" className="btn btn-outline-light">
              {t(copy.contact)}
            </Link>
          </div>

          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t(copy.popular)}
          </p>
          <div className="flex flex-wrap gap-2">
            {servicesConfig.map((service) => (
              <Link
                key={service.slug}
                to="/services/$serviceId"
                params={{ serviceId: service.slug }}
                className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-primary hover:text-primary"
              >
                {t(service.name)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
