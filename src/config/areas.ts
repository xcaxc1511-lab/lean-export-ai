import type { L } from "@/lib/i18n";
import { images } from "./images";

type LocalReason = { title: L; description: L };

/** An export market. The template's "service areas" are this site's destination markets. */
export interface AreaConfig {
  /** Approved 1920×1080 background photograph. */
  heroImageUrl?: string;
  /** Separate introduction photograph. */
  introImageUrl?: string;
  introImageAlt?: L;
  slug: string;
  /** Market name, e.g. "Japan". */
  name: L;
  /** Broader region, e.g. "East Asia". */
  region: L;
  heroTitle: L;
  heroDescription: L;
  introParagraphs: [L, L];
  whyChooseCards: [LocalReason, LocalReason, LocalReason, LocalReason];
  reviewsHeading: L;
  reviewsDescription: L;
  faqs: { question: L; answer: L }[];
  /** SEO meta stays in English. */
  seoTitle: string;
  seoDescription: string;
}

const traceability: LocalReason = {
  title: { en: "Farm-to-container traceability", vi: "Truy xuất từ vườn đến container" },
  description: {
    en: "Every lot is linked to its farms, processing records and quality reports.",
    vi: "Mỗi lô hàng đều gắn với vườn trồng, hồ sơ chế biến và báo cáo chất lượng.",
  },
};

const samples: LocalReason = {
  title: { en: "Approve before you ship", vi: "Duyệt mẫu trước khi giao" },
  description: {
    en: "Type samples and pre-shipment samples are sent for your approval on every contract.",
    vi: "Mẫu chào hàng và mẫu trước giao hàng được gửi để bạn duyệt cho mọi hợp đồng.",
  },
};

export const areasConfig: AreaConfig[] = [
  {
    slug: "japan",
    name: { en: "Japan", vi: "Nhật Bản" },
    region: { en: "East Asia", vi: "Đông Á" },
    heroImageUrl: images.tokyo,
    introImageUrl: images.cupping,
    introImageAlt: { en: "Coffee cupping session", vi: "Buổi thử nếm cà phê" },
    heroTitle: {
      en: "Vietnamese Coffee Export to Japan",
      vi: "Xuất khẩu cà phê Việt Nam sang Nhật Bản",
    },
    heroDescription: {
      en: "Low-defect Robusta and washed Arabica prepared for Japan's demanding roasters and canned-coffee makers.",
      vi: "Robusta ít lỗi và Arabica chế biến ướt, chuẩn bị cho các nhà rang và nhà sản xuất cà phê lon khắt khe của Nhật.",
    },
    introParagraphs: [
      {
        en: "Japanese buyers expect consistency above everything. We sort to tight defect counts and keep each contract's lots uniform from first container to last.",
        vi: "Khách hàng Nhật Bản đặt sự ổn định lên hàng đầu. Chúng tôi sàng lọc theo số lỗi chặt chẽ và giữ các lô trong cùng hợp đồng đồng nhất từ container đầu đến cuối.",
      },
      {
        en: "Residue testing is planned around Japan's Positive List System, and results travel with the shipping documents.",
        vi: "Kiểm nghiệm dư lượng được thực hiện theo Hệ thống Danh mục Tích cực (Positive List) của Nhật, kết quả gửi kèm bộ chứng từ.",
      },
    ],
    whyChooseCards: [
      {
        title: { en: "Tight defect control", vi: "Kiểm soát lỗi chặt chẽ" },
        description: {
          en: "Optical sorting plus hand-picking for low-defect specifications.",
          vi: "Máy bắn màu kết hợp nhặt tay cho tiêu chuẩn ít lỗi.",
        },
      },
      {
        title: { en: "Residue testing", vi: "Kiểm nghiệm dư lượng" },
        description: {
          en: "Lab reports aligned with Japanese maximum residue limits.",
          vi: "Báo cáo kiểm nghiệm theo giới hạn dư lượng tối đa của Nhật.",
        },
      },
      traceability,
      samples,
    ],
    reviewsHeading: {
      en: "What Our Japanese Partners Say",
      vi: "Đối tác Nhật Bản nói gì về chúng tôi",
    },
    reviewsDescription: {
      en: "Feedback from roasters and importers we supply in Japan.",
      vi: "Phản hồi từ các nhà rang và nhà nhập khẩu tại Nhật Bản.",
    },
    faqs: [
      {
        question: {
          en: "Which port do you ship to in Japan?",
          vi: "Bạn giao hàng đến cảng nào ở Nhật?",
        },
        answer: {
          en: "We ship CIF to Tokyo, Yokohama, Kobe or Nagoya, or FOB Ho Chi Minh City for your own forwarder.",
          vi: "Chúng tôi giao CIF đến Tokyo, Yokohama, Kobe hoặc Nagoya, hoặc FOB TP.HCM cho đơn vị vận chuyển của bạn.",
        },
      },
    ],
    seoTitle: "Vietnamese Coffee Exporter to Japan | Lean Export AI",
    seoDescription:
      "Low-defect Vietnamese Robusta and Arabica for Japanese roasters, with residue testing and full lot traceability.",
  },
  {
    slug: "philippines",
    name: { en: "Philippines", vi: "Philippines" },
    region: { en: "Southeast Asia", vi: "Đông Nam Á" },
    heroImageUrl: images.manila,
    introImageUrl: images.beansInSack,
    introImageAlt: { en: "Green coffee in jute sacks", vi: "Cà phê nhân trong bao đay" },
    heroTitle: {
      en: "Vietnamese Coffee Export to the Philippines",
      vi: "Xuất khẩu cà phê Việt Nam sang Philippines",
    },
    heroDescription: {
      en: "Robusta green beans and instant coffee for Philippine manufacturers and distributors, a short sail from Vietnam.",
      vi: "Cà phê nhân Robusta và cà phê hòa tan cho nhà sản xuất, nhà phân phối Philippines — chỉ vài ngày đi biển.",
    },
    introParagraphs: [
      {
        en: "The Philippines is one of the closest and fastest-growing markets for Vietnamese Robusta, used widely in instant and 3-in-1 products.",
        vi: "Philippines là một trong những thị trường gần và tăng trưởng nhanh nhất của Robusta Việt Nam, được dùng nhiều cho cà phê hòa tan và 3 trong 1.",
      },
      {
        en: "As both countries are in ASEAN, we prepare Form D certificates of origin so qualifying shipments can use ATIGA preferential tariffs.",
        vi: "Do cùng thuộc ASEAN, chúng tôi chuẩn bị C/O mẫu D để lô hàng đủ điều kiện được hưởng thuế ưu đãi ATIGA.",
      },
    ],
    whyChooseCards: [
      {
        title: { en: "Short transit times", vi: "Thời gian vận chuyển ngắn" },
        description: {
          en: "Regular sailings to Manila, Batangas and Cebu.",
          vi: "Có chuyến tàu thường xuyên đến Manila, Batangas và Cebu.",
        },
      },
      {
        title: { en: "ATIGA paperwork handled", vi: "Lo trọn chứng từ ATIGA" },
        description: {
          en: "Form D and phytosanitary certificates prepared with every shipment.",
          vi: "C/O mẫu D và giấy kiểm dịch thực vật chuẩn bị cho từng lô hàng.",
        },
      },
      traceability,
      samples,
    ],
    reviewsHeading: {
      en: "What Our Philippine Partners Say",
      vi: "Đối tác Philippines nói gì về chúng tôi",
    },
    reviewsDescription: {
      en: "Feedback from manufacturers and distributors in the Philippines.",
      vi: "Phản hồi từ nhà sản xuất và nhà phân phối tại Philippines.",
    },
    faqs: [
      {
        question: {
          en: "Can you supply instant coffee in bulk?",
          vi: "Bạn có cung cấp cà phê hòa tan dạng bulk không?",
        },
        answer: {
          en: "Yes — spray-dried and freeze-dried instant coffee in bulk cartons for local repacking.",
          vi: "Có — cà phê hòa tan sấy phun và sấy lạnh đóng thùng bulk để đóng gói lại tại chỗ.",
        },
      },
    ],
    seoTitle: "Vietnamese Coffee Exporter to the Philippines | Lean Export AI",
    seoDescription:
      "Robusta green beans and instant coffee from Vietnam to the Philippines, with Form D for ATIGA tariff preferences.",
  },
  {
    slug: "south-korea",
    name: { en: "South Korea", vi: "Hàn Quốc" },
    region: { en: "East Asia", vi: "Đông Á" },
    heroImageUrl: images.seoul,
    introImageUrl: images.roaster,
    introImageAlt: { en: "Coffee roaster in operation", vi: "Máy rang cà phê đang hoạt động" },
    heroTitle: {
      en: "Vietnamese Coffee Export to South Korea",
      vi: "Xuất khẩu cà phê Việt Nam sang Hàn Quốc",
    },
    heroDescription: {
      en: "Green and roasted coffee for Korea's café chains, roasters and RTD beverage brands.",
      vi: "Cà phê nhân và cà phê rang cho chuỗi café, nhà rang và thương hiệu đồ uống pha sẵn tại Hàn Quốc.",
    },
    introParagraphs: [
      {
        en: "Korea's café culture drives demand for both high-volume Robusta and characterful Arabica. We supply both, plus custom roasted blends.",
        vi: "Văn hóa café ở Hàn Quốc thúc đẩy nhu cầu cả Robusta sản lượng lớn lẫn Arabica giàu hương vị. Chúng tôi cung cấp cả hai, cùng các blend rang theo yêu cầu.",
      },
      {
        en: "Certificates of origin under the Vietnam–Korea FTA are prepared with each shipment to support preferential import duties.",
        vi: "C/O theo Hiệp định thương mại tự do Việt Nam – Hàn Quốc được chuẩn bị cho từng lô hàng để hỗ trợ thuế nhập khẩu ưu đãi.",
      },
    ],
    whyChooseCards: [
      {
        title: { en: "Blend development", vi: "Phát triển blend" },
        description: {
          en: "We co-develop blends for espresso, drip and RTD applications.",
          vi: "Cùng phát triển blend cho espresso, pha phin giấy và đồ uống pha sẵn.",
        },
      },
      {
        title: { en: "VKFTA documentation", vi: "Chứng từ VKFTA" },
        description: {
          en: "Origin and phytosanitary documents ready for Korean customs.",
          vi: "Chứng từ xuất xứ và kiểm dịch sẵn sàng cho hải quan Hàn Quốc.",
        },
      },
      traceability,
      samples,
    ],
    reviewsHeading: {
      en: "What Our Korean Partners Say",
      vi: "Đối tác Hàn Quốc nói gì về chúng tôi",
    },
    reviewsDescription: {
      en: "Feedback from café chains and roasters in South Korea.",
      vi: "Phản hồi từ chuỗi café và nhà rang tại Hàn Quốc.",
    },
    faqs: [
      {
        question: {
          en: "Do you ship roasted coffee to Korea?",
          vi: "Bạn có xuất cà phê rang sang Hàn Quốc không?",
        },
        answer: {
          en: "Yes, nitrogen-flushed roasted coffee ships well to Busan and Incheon.",
          vi: "Có, cà phê rang bơm nitơ vận chuyển tốt đến Busan và Incheon.",
        },
      },
    ],
    seoTitle: "Vietnamese Coffee Exporter to South Korea | Lean Export AI",
    seoDescription:
      "Green and roasted Vietnamese coffee for Korean roasters and café chains, with VKFTA origin documents.",
  },
  {
    slug: "australia",
    name: { en: "Australia", vi: "Úc" },
    region: { en: "Oceania", vi: "Châu Đại Dương" },
    heroImageUrl: images.sydney,
    introImageUrl: images.cuppingPour,
    introImageAlt: { en: "Brewing coffee samples", vi: "Pha mẫu cà phê" },
    heroTitle: {
      en: "Vietnamese Coffee Export to Australia",
      vi: "Xuất khẩu cà phê Việt Nam sang Úc",
    },
    heroDescription: {
      en: "Quality-focused green coffee for Australia's specialty roasters, packed to meet biosecurity rules.",
      vi: "Cà phê nhân chú trọng chất lượng cho các nhà rang đặc sản tại Úc, đóng gói đáp ứng quy định an toàn sinh học.",
    },
    introParagraphs: [
      {
        en: "Australian roasters are curious about fine Robusta and Vietnamese Arabica. We offer cupped lots with transparent origin stories.",
        vi: "Các nhà rang Úc quan tâm đến Robusta chất lượng cao và Arabica Việt Nam. Chúng tôi chào các lô đã cupping với câu chuyện nguồn gốc minh bạch.",
      },
      {
        en: "Shipments are prepared against Australia's biosecurity import conditions (BICON), with clean packaging and complete documents.",
        vi: "Lô hàng được chuẩn bị theo điều kiện nhập khẩu an toàn sinh học của Úc (BICON), bao bì sạch và chứng từ đầy đủ.",
      },
    ],
    whyChooseCards: [
      {
        title: { en: "Specialty-ready lots", vi: "Lô hàng chuẩn đặc sản" },
        description: {
          en: "Cupping scores and lot details shared up front.",
          vi: "Điểm cupping và thông tin lô được chia sẻ ngay từ đầu.",
        },
      },
      {
        title: { en: "Biosecurity-ready packing", vi: "Đóng gói đạt chuẩn sinh học" },
        description: {
          en: "Clean bags, liners and documents prepared for Australian inspection.",
          vi: "Bao bì, lớp lót và chứng từ sạch sẵn sàng cho kiểm tra tại Úc.",
        },
      },
      traceability,
      samples,
    ],
    reviewsHeading: {
      en: "What Our Australian Partners Say",
      vi: "Đối tác Úc nói gì về chúng tôi",
    },
    reviewsDescription: {
      en: "Feedback from roasters and importers in Australia.",
      vi: "Phản hồi từ nhà rang và nhà nhập khẩu tại Úc.",
    },
    faqs: [
      {
        question: {
          en: "Can you ship less than a full container?",
          vi: "Bạn có giao ít hơn một container không?",
        },
        answer: {
          en: "For specialty lots we can consolidate LCL shipments — ask about current availability.",
          vi: "Với lô đặc sản, chúng tôi có thể gom hàng lẻ (LCL) — hãy hỏi lượng hàng hiện có.",
        },
      },
    ],
    seoTitle: "Vietnamese Coffee Exporter to Australia | Lean Export AI",
    seoDescription:
      "Cupped Vietnamese Robusta and Arabica lots for Australian roasters, packed for biosecurity import conditions.",
  },
  {
    slug: "european-union",
    name: { en: "European Union", vi: "Liên minh châu Âu" },
    region: { en: "Europe", vi: "Châu Âu" },
    heroImageUrl: images.containerStacks,
    introImageUrl: images.cherriesOnBranch,
    introImageAlt: { en: "Coffee cherries on the branch", vi: "Quả cà phê trên cành" },
    heroTitle: {
      en: "Vietnamese Coffee Export to the EU",
      vi: "Xuất khẩu cà phê Việt Nam sang EU",
    },
    heroDescription: {
      en: "Deforestation-free, geolocated supply chains ready for the EU Deforestation Regulation (EUDR).",
      vi: "Chuỗi cung ứng không phá rừng, có định vị vườn trồng, sẵn sàng cho Quy định chống phá rừng của EU (EUDR).",
    },
    introParagraphs: [
      {
        en: "Europe is the largest buyer of Vietnamese coffee. Under the EUDR, importers need proof that coffee was not grown on recently deforested land.",
        vi: "Châu Âu là khách hàng lớn nhất của cà phê Việt Nam. Theo EUDR, nhà nhập khẩu cần bằng chứng cà phê không được trồng trên đất mới phá rừng.",
      },
      {
        en: "We map partner farms with GPS polygons and provide the geolocation and due-diligence data your compliance team needs.",
        vi: "Chúng tôi lập bản đồ vườn liên kết bằng tọa độ GPS và cung cấp dữ liệu định vị, thẩm định mà bộ phận tuân thủ của bạn cần.",
      },
    ],
    whyChooseCards: [
      {
        title: { en: "EUDR-ready data", vi: "Dữ liệu sẵn sàng EUDR" },
        description: {
          en: "Plot geolocation and deforestation-free evidence for every lot.",
          vi: "Tọa độ lô đất và bằng chứng không phá rừng cho từng lô hàng.",
        },
      },
      {
        title: { en: "EVFTA origin documents", vi: "Chứng từ xuất xứ EVFTA" },
        description: {
          en: "Origin paperwork prepared under the EU–Vietnam Free Trade Agreement.",
          vi: "Chứng từ xuất xứ theo Hiệp định thương mại tự do EU – Việt Nam.",
        },
      },
      traceability,
      samples,
    ],
    reviewsHeading: {
      en: "What Our European Partners Say",
      vi: "Đối tác châu Âu nói gì về chúng tôi",
    },
    reviewsDescription: {
      en: "Feedback from importers and roasters across the EU.",
      vi: "Phản hồi từ nhà nhập khẩu và nhà rang khắp EU.",
    },
    faqs: [
      {
        question: {
          en: "Can you provide EUDR geolocation data?",
          vi: "Bạn có cung cấp dữ liệu định vị EUDR không?",
        },
        answer: {
          en: "Yes. Farm polygons and supporting records are shared with each contract.",
          vi: "Có. Bản đồ vùng trồng và hồ sơ liên quan được chia sẻ theo từng hợp đồng.",
        },
      },
      {
        question: { en: "Which EU ports do you ship to?", vi: "Bạn giao hàng đến cảng nào ở EU?" },
        answer: {
          en: "Most often Hamburg, Antwerp, Rotterdam and Trieste — other ports on request.",
          vi: "Thường là Hamburg, Antwerp, Rotterdam và Trieste — các cảng khác theo yêu cầu.",
        },
      },
    ],
    seoTitle: "EUDR-Ready Vietnamese Coffee Exporter to the EU | Lean Export AI",
    seoDescription:
      "Deforestation-free Vietnamese coffee with farm geolocation data for EUDR compliance, shipped to major EU ports.",
  },
  {
    slug: "middle-east",
    name: { en: "Middle East", vi: "Trung Đông" },
    region: { en: "Gulf & Levant", vi: "Vùng Vịnh & Levant" },
    heroImageUrl: images.dubai,
    introImageUrl: images.roastedPile,
    introImageAlt: { en: "Roasted coffee beans", vi: "Cà phê hạt đã rang" },
    heroTitle: {
      en: "Vietnamese Coffee Export to the Middle East",
      vi: "Xuất khẩu cà phê Việt Nam sang Trung Đông",
    },
    heroDescription: {
      en: "Robusta, roasted and instant coffee for Gulf distributors, with halal certification available on request.",
      vi: "Robusta, cà phê rang và hòa tan cho nhà phân phối vùng Vịnh, có chứng nhận Halal theo yêu cầu.",
    },
    introParagraphs: [
      {
        en: "Fast-growing café chains and re-export hubs make the Middle East an important market for Vietnamese coffee.",
        vi: "Chuỗi café tăng trưởng nhanh và các trung tâm tái xuất khiến Trung Đông trở thành thị trường quan trọng của cà phê Việt Nam.",
      },
      {
        en: "We ship to Jebel Ali and other regional ports and can supply halal-certified roasted and instant products.",
        vi: "Chúng tôi giao hàng đến Jebel Ali và các cảng khác trong khu vực, cung cấp sản phẩm rang và hòa tan có chứng nhận Halal.",
      },
    ],
    whyChooseCards: [
      {
        title: { en: "Halal on request", vi: "Halal theo yêu cầu" },
        description: {
          en: "Halal-certified production lines for roasted and instant coffee.",
          vi: "Dây chuyền có chứng nhận Halal cho cà phê rang và hòa tan.",
        },
      },
      {
        title: { en: "Re-export friendly", vi: "Thuận tiện tái xuất" },
        description: {
          en: "Flexible documents for distributors serving neighbouring markets.",
          vi: "Chứng từ linh hoạt cho nhà phân phối phục vụ các thị trường lân cận.",
        },
      },
      traceability,
      samples,
    ],
    reviewsHeading: {
      en: "What Our Middle East Partners Say",
      vi: "Đối tác Trung Đông nói gì về chúng tôi",
    },
    reviewsDescription: {
      en: "Feedback from distributors and café chains in the region.",
      vi: "Phản hồi từ nhà phân phối và chuỗi café trong khu vực.",
    },
    faqs: [
      {
        question: { en: "Is halal certification available?", vi: "Có chứng nhận Halal không?" },
        answer: {
          en: "Yes, for roasted and instant coffee lines — please mention it in your enquiry.",
          vi: "Có, cho dòng cà phê rang và hòa tan — vui lòng ghi rõ trong yêu cầu báo giá.",
        },
      },
    ],
    seoTitle: "Vietnamese Coffee Exporter to the Middle East | Lean Export AI",
    seoDescription:
      "Robusta, roasted and instant Vietnamese coffee for Gulf distributors, with halal certification on request.",
  },
];
