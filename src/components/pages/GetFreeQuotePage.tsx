import { Phone, MapPin, Clock } from "lucide-react";
import { businessConfig } from "@/config/business";
import { integrationsConfig } from "@/config/integrations";
import { LeadForm, hasFormId } from "@/components/LeadForm";
import { phoneHref, emailHref } from "@/lib/contact";
import { useLang } from "@/lib/i18n";

const copy = {
  phone: { en: "Phone", vi: "Điện thoại" },
  office: { en: "Office", vi: "Văn phòng" },
  hours: { en: "Hours", vi: "Giờ làm việc" },
  talkTitle: { en: "Ready to Talk With {name}?", vi: "Sẵn sàng trao đổi với {name}?" },
  talkBody: {
    en: "For samples, specifications or pricing, contact the {name} export team directly.",
    vi: "Để nhận mẫu, quy cách hoặc báo giá, hãy liên hệ trực tiếp đội ngũ xuất khẩu {name}.",
  },
  title: { en: "Request a Quote", vi: "Yêu cầu báo giá" },
  intro: {
    en: "Tell us the product, grade, volume and destination port. The {name} team will reply with FOB/CIF pricing and sample options.",
    vi: "Cho chúng tôi biết sản phẩm, cấp hạt, sản lượng và cảng đến. Đội ngũ {name} sẽ phản hồi giá FOB/CIF và phương án gửi mẫu.",
  },
};

export default function GetFreeQuotePage() {
  const { t } = useLang();
  const vars = { name: businessConfig.businessName };
  const telHref = phoneHref();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Content Section */}
        <section className="py-24 bg-white md:pt-40 pt-[50px]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Left Column: Contact Info */}
              <div>
                <h1 className="text-3xl font-bold mb-8">{t(copy.title)}</h1>
                <p className="text-lg text-gray-600 mb-10 leading-relaxed">{t(copy.intro, vars)}</p>

                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{t(copy.phone)}</h3>
                      <a
                        href={telHref}
                        className="text-gray-600 hover:text-primary transition-colors text-lg"
                      >
                        {businessConfig.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{t(copy.office)}</h3>
                      <p className="text-gray-600 text-lg">{t(businessConfig.localized.address)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{t(copy.hours)}</h3>
                      {businessConfig.businessHours.map((hour, idx) => (
                        <p key={idx} className="text-gray-600">
                          {t(hour.days)}: {t(hour.hours)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact Form or Fallback */}
              <div>
                {hasFormId(integrationsConfig.quoteFormId) ? (
                  <LeadForm
                    formId={integrationsConfig.quoteFormId}
                    title="Quote Form"
                    formName="Quote Form"
                  />
                ) : (
                  <div className="bg-gray-50 p-8 md:p-12 rounded-sm border border-gray-200 h-full flex flex-col justify-center">
                    <h3 className="font-bold text-2xl mb-6">{t(copy.talkTitle, vars)}</h3>
                    <p className="text-gray-600 mb-8">{t(copy.talkBody, vars)}</p>
                    <div className="space-y-4">
                      <a
                        href={telHref}
                        className="flex items-center gap-3 text-lg text-gray-900 font-medium hover:text-primary transition-colors"
                      >
                        <Phone className="w-5 h-5 text-gray-400" />
                        {businessConfig.phone}
                      </a>
                      <a
                        href={emailHref()}
                        className="flex items-center gap-3 text-lg text-gray-900 font-medium hover:text-primary transition-colors break-all min-w-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5 text-gray-400"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        {businessConfig.email}
                      </a>
                    </div>
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
