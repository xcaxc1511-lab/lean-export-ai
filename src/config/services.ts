import type { L } from "@/lib/i18n";
import { images } from "./images";

/** A product line. The template's "services" are this site's export products. */
export interface ServiceConfig {
  slug: string;
  name: L;
  shortDescription: L;
  heroTitle: L;
  heroDescription: L;
  /** Optional dedicated 1920×1080 hero photograph; defaults to imageUrl. */
  heroImageUrl?: string;
  imageUrl: string;
  /** Background photo for the closing CTA — must differ from the hero and intro images. */
  ctaImageUrl: string;
  imageAlt: L;
  features: L[];
  processSteps: { title: L; description: L }[];
  faqs: { question: L; answer: L }[];
  /** SEO meta stays in English (primary language for international buyers). */
  seoTitle: string;
  seoDescription: string;
  schemaServiceType: string;
}

export const servicesConfig: ServiceConfig[] = [
  {
    slug: "robusta-green-beans",
    name: { en: "Robusta Green Beans", vi: "Cà phê nhân Robusta" },
    shortDescription: {
      en: "Central Highlands Robusta in export grades S13–S18, natural, wet-polished or honey processed.",
      vi: "Robusta Tây Nguyên các cỡ hạt S13–S18, chế biến tự nhiên, đánh bóng ướt hoặc honey.",
    },
    heroTitle: {
      en: "Vietnamese Robusta Green Coffee Beans",
      vi: "Cà phê nhân xanh Robusta Việt Nam",
    },
    heroDescription: {
      en: "Bold, chocolatey Robusta from Gia Lai and Dak Lak — graded, sorted and shipped to your specification.",
      vi: "Robusta đậm vị, hậu socola từ Gia Lai và Đắk Lắk — phân loại, sàng lọc và giao hàng theo đúng tiêu chuẩn của bạn.",
    },
    heroImageUrl: images.beansInSack,
    imageUrl: images.greenBeans,
    ctaImageUrl: images.sacks,
    imageAlt: { en: "Robusta green coffee beans", vi: "Hạt cà phê nhân Robusta" },
    features: [
      { en: "Grades S18, S16, S13", vi: "Cỡ hạt S18, S16, S13" },
      { en: "Moisture max 12.5%", vi: "Độ ẩm tối đa 12,5%" },
      { en: "Natural, wet-polished, honey", vi: "Tự nhiên, đánh bóng ướt, honey" },
      { en: "60 kg jute bags or bulk liner", vi: "Bao đay 60 kg hoặc container lót bulk" },
    ],
    processSteps: [
      {
        title: { en: "Farm sourcing", vi: "Thu mua tại vườn" },
        description: {
          en: "Ripe cherries bought from partner farms in the Central Highlands, recorded by plot.",
          vi: "Thu mua quả chín từ các vườn liên kết tại Tây Nguyên, ghi nhận theo từng lô đất.",
        },
      },
      {
        title: { en: "Sorting & grading", vi: "Sàng lọc & phân loại" },
        description: {
          en: "Screen sizing, density and optical colour sorting to hit the contracted grade.",
          vi: "Sàng cỡ hạt, tách tỷ trọng và máy bắn màu để đạt đúng cấp hạt trong hợp đồng.",
        },
      },
      {
        title: { en: "Pre-shipment sample", vi: "Mẫu trước giao hàng" },
        description: {
          en: "A PSS is sent for your approval before the lot is bagged and loaded.",
          vi: "Gửi mẫu PSS để bạn duyệt trước khi đóng bao và đóng container.",
        },
      },
    ],
    faqs: [
      {
        question: {
          en: "What is the minimum order quantity?",
          vi: "Số lượng đặt hàng tối thiểu là bao nhiêu?",
        },
        answer: {
          en: "One 20ft container — roughly 19.2 MT, or 320 bags of 60 kg.",
          vi: "Một container 20ft — khoảng 19,2 tấn, tương đương 320 bao 60 kg.",
        },
      },
      {
        question: { en: "Can I get a sample first?", vi: "Tôi có thể nhận mẫu trước không?" },
        answer: {
          en: "Yes. We courier type samples so you can cup before signing a contract.",
          vi: "Có. Chúng tôi gửi mẫu chuyển phát nhanh để bạn thử nếm trước khi ký hợp đồng.",
        },
      },
    ],
    seoTitle: "Robusta Green Coffee Beans from Vietnam | Lean Export AI",
    seoDescription:
      "Export-grade Vietnamese Robusta green beans S13–S18, natural or wet-polished, shipped FOB or CIF with full traceability.",
    schemaServiceType: "Product",
  },
  {
    slug: "arabica-green-beans",
    name: { en: "Arabica Green Beans", vi: "Cà phê nhân Arabica" },
    shortDescription: {
      en: "Washed Arabica from Lam Dong and Son La highlands — bright acidity, clean cup.",
      vi: "Arabica chế biến ướt từ cao nguyên Lâm Đồng và Sơn La — chua thanh, vị sạch.",
    },
    heroTitle: { en: "Vietnamese Arabica Green Coffee", vi: "Cà phê nhân xanh Arabica Việt Nam" },
    heroDescription: {
      en: "High-altitude Arabica with floral and citrus notes, ideal for specialty blends and single-origin lines.",
      vi: "Arabica vùng cao với hương hoa và cam chanh, phù hợp cho blend đặc sản và dòng single-origin.",
    },
    heroImageUrl: images.coffeeBlossom,
    imageUrl: images.greenBeansScoop,
    ctaImageUrl: images.cupping,
    imageAlt: { en: "Arabica green coffee beans", vi: "Hạt cà phê nhân Arabica" },
    features: [
      { en: "Grown at 1,000–1,600 m", vi: "Trồng ở độ cao 1.000–1.600 m" },
      { en: "Fully washed & honey", vi: "Chế biến ướt & honey" },
      { en: "Screen S16 / S18", vi: "Cỡ hạt S16 / S18" },
      { en: "Cupping report per lot", vi: "Phiếu cupping cho từng lô" },
    ],
    processSteps: [
      {
        title: { en: "Selective picking", vi: "Hái chọn lọc" },
        description: {
          en: "Only ripe red cherries are picked and processed within 24 hours.",
          vi: "Chỉ hái quả chín đỏ và chế biến trong vòng 24 giờ.",
        },
      },
      {
        title: { en: "Washing & drying", vi: "Lên men & phơi sấy" },
        description: {
          en: "Controlled fermentation, then drying on raised beds to a stable moisture.",
          vi: "Lên men có kiểm soát, sau đó phơi trên giàn cao đến độ ẩm ổn định.",
        },
      },
      {
        title: { en: "Cupping & approval", vi: "Cupping & duyệt mẫu" },
        description: {
          en: "Each lot is cupped and scored before it is offered to buyers.",
          vi: "Mỗi lô được cupping và chấm điểm trước khi chào bán.",
        },
      },
    ],
    faqs: [
      {
        question: {
          en: "Which regions does your Arabica come from?",
          vi: "Arabica của bạn đến từ vùng nào?",
        },
        answer: {
          en: "Mainly Cau Dat (Lam Dong) and Son La, with seasonal micro-lots from other highlands.",
          vi: "Chủ yếu từ Cầu Đất (Lâm Đồng) và Sơn La, kèm các micro-lot theo mùa từ vùng cao khác.",
        },
      },
      {
        question: { en: "Do you sell specialty grade?", vi: "Bạn có bán hàng đặc sản không?" },
        answer: {
          en: "Yes, limited specialty lots are available each harvest — ask for the current offer list.",
          vi: "Có, mỗi vụ đều có một số lô đặc sản giới hạn — hãy hỏi danh sách chào hàng hiện tại.",
        },
      },
    ],
    seoTitle: "Arabica Green Coffee from Vietnam | Lean Export AI",
    seoDescription:
      "Washed Vietnamese Arabica from Lam Dong and Son La, S16–S18, with lot-level cupping reports for importers and roasters.",
    schemaServiceType: "Product",
  },
  {
    slug: "excelsa-coffee",
    name: { en: "Excelsa Coffee", vi: "Cà phê Excelsa (cà phê mít)" },
    shortDescription: {
      en: "A rare Vietnamese variety with fruity, tart notes that adds depth to blends.",
      vi: "Giống cà phê hiếm của Việt Nam với vị chua trái cây, tạo chiều sâu cho blend.",
    },
    heroTitle: {
      en: "Excelsa — Vietnam's Distinctive Bean",
      vi: "Excelsa — hạt cà phê độc đáo của Việt Nam",
    },
    heroDescription: {
      en: "Known locally as 'jackfruit coffee', Excelsa brings a tart, dried-fruit profile few origins can offer.",
      vi: "Còn gọi là cà phê mít, Excelsa mang hương vị chua nhẹ, trái cây khô mà ít vùng trồng nào có được.",
    },
    heroImageUrl: images.cherriesOnBranch,
    imageUrl: images.cherriesHandful,
    ctaImageUrl: images.greenBeans,
    imageAlt: { en: "Excelsa coffee cherries", vi: "Quả cà phê Excelsa" },
    features: [
      { en: "Green or roasted", vi: "Dạng nhân hoặc rang" },
      { en: "Natural processed", vi: "Chế biến tự nhiên" },
      { en: "Small-lot availability", vi: "Cung ứng theo lô nhỏ" },
      { en: "Great for signature blends", vi: "Phù hợp blend đặc trưng" },
    ],
    processSteps: [
      {
        title: { en: "Harvest", vi: "Thu hoạch" },
        description: {
          en: "Picked from tall Excelsa trees, mostly in Gia Lai and Kon Tum.",
          vi: "Thu hái từ cây Excelsa thân cao, chủ yếu ở Gia Lai và Kon Tum.",
        },
      },
      {
        title: { en: "Natural drying", vi: "Phơi tự nhiên" },
        description: {
          en: "Whole cherries are sun-dried to develop the signature fruity character.",
          vi: "Phơi nguyên quả dưới nắng để tạo hương trái cây đặc trưng.",
        },
      },
      {
        title: { en: "Hulling & sorting", vi: "Xát vỏ & phân loại" },
        description: {
          en: "Hulled, graded and hand-picked to remove defects before export.",
          vi: "Xát vỏ, phân cỡ và nhặt tay loại hạt lỗi trước khi xuất khẩu.",
        },
      },
    ],
    faqs: [
      {
        question: { en: "Is Excelsa available year-round?", vi: "Excelsa có quanh năm không?" },
        answer: {
          en: "Volumes are smaller than Robusta, so we recommend booking early in the harvest season.",
          vi: "Sản lượng ít hơn Robusta, nên bạn nên đặt sớm từ đầu vụ thu hoạch.",
        },
      },
    ],
    seoTitle: "Vietnamese Excelsa Coffee Beans | Lean Export AI",
    seoDescription:
      "Rare Vietnamese Excelsa coffee, green or roasted, with a fruity tart profile for signature blends.",
    schemaServiceType: "Product",
  },
  {
    slug: "roasted-coffee",
    name: { en: "Roasted Coffee", vi: "Cà phê rang xay" },
    shortDescription: {
      en: "Whole bean or ground, roasted to your profile and packed in one-way-valve bags.",
      vi: "Nguyên hạt hoặc xay sẵn, rang theo profile của bạn, đóng túi van một chiều.",
    },
    heroTitle: {
      en: "Roasted Coffee, Profiled for Your Market",
      vi: "Cà phê rang theo khẩu vị thị trường của bạn",
    },
    heroDescription: {
      en: "Light, medium or dark roasts of Robusta, Arabica and blends — roasted fresh in Vietnam and shipped ready to sell.",
      vi: "Rang sáng, vừa hoặc đậm cho Robusta, Arabica và blend — rang mới tại Việt Nam, giao sẵn sàng để bán.",
    },
    heroImageUrl: images.roaster,
    imageUrl: images.roastedBeans,
    ctaImageUrl: images.roastedPile,
    imageAlt: { en: "Freshly roasted coffee beans", vi: "Cà phê vừa rang" },
    features: [
      { en: "Custom roast profiles", vi: "Profile rang theo yêu cầu" },
      { en: "Whole bean or ground", vi: "Nguyên hạt hoặc xay" },
      { en: "250 g – 1 kg valve bags", vi: "Túi van 250 g – 1 kg" },
      { en: "Nitrogen flushing", vi: "Bơm khí nitơ bảo quản" },
    ],
    processSteps: [
      {
        title: { en: "Profile development", vi: "Xây dựng profile rang" },
        description: {
          en: "We roast test batches until the cup matches your target.",
          vi: "Rang thử nhiều mẻ đến khi hương vị đạt đúng mục tiêu của bạn.",
        },
      },
      {
        title: { en: "Production roasting", vi: "Rang sản xuất" },
        description: {
          en: "Every batch is logged and checked against the approved profile.",
          vi: "Mỗi mẻ rang được ghi nhận và đối chiếu với profile đã duyệt.",
        },
      },
      {
        title: { en: "Packing", vi: "Đóng gói" },
        description: {
          en: "Degassed, packed with one-way valves and nitrogen for shelf life.",
          vi: "Xả khí, đóng túi van một chiều và bơm nitơ để kéo dài hạn dùng.",
        },
      },
    ],
    faqs: [
      {
        question: { en: "What is the shelf life?", vi: "Hạn sử dụng là bao lâu?" },
        answer: {
          en: "Typically 12 months for nitrogen-flushed whole bean in valve bags.",
          vi: "Thông thường 12 tháng với cà phê nguyên hạt bơm nitơ trong túi van.",
        },
      },
    ],
    seoTitle: "Roasted Vietnamese Coffee for Export | Lean Export AI",
    seoDescription:
      "Custom-roasted Vietnamese Robusta, Arabica and blends, whole bean or ground, packed in valve bags for export.",
    schemaServiceType: "Product",
  },
  {
    slug: "instant-coffee",
    name: { en: "Instant Coffee", vi: "Cà phê hòa tan" },
    shortDescription: {
      en: "Spray-dried and freeze-dried instant coffee, plus 2-in-1 and 3-in-1 mixes.",
      vi: "Cà phê hòa tan sấy phun và sấy lạnh, cùng các dòng 2 trong 1, 3 trong 1.",
    },
    heroTitle: {
      en: "Instant Coffee in Bulk & Retail Packs",
      vi: "Cà phê hòa tan dạng bulk & bán lẻ",
    },
    heroDescription: {
      en: "Consistent soluble coffee made from Vietnamese Robusta for distributors and food manufacturers.",
      vi: "Cà phê hòa tan ổn định từ Robusta Việt Nam cho nhà phân phối và nhà sản xuất thực phẩm.",
    },
    heroImageUrl: images.instantPowder,
    imageUrl: images.instantMug,
    ctaImageUrl: images.cuppingPour,
    imageAlt: { en: "A cup of instant coffee", vi: "Ly cà phê hòa tan" },
    features: [
      { en: "Spray-dried & freeze-dried", vi: "Sấy phun & sấy lạnh" },
      { en: "2-in-1 / 3-in-1 mixes", vi: "Dòng 2 trong 1 / 3 trong 1" },
      { en: "Bulk cartons or sachets", vi: "Thùng bulk hoặc gói nhỏ" },
      { en: "Custom formulas", vi: "Công thức theo yêu cầu" },
    ],
    processSteps: [
      {
        title: { en: "Formula brief", vi: "Thống nhất công thức" },
        description: {
          en: "Agree on solubility, strength and mix ratios for your market.",
          vi: "Thống nhất độ hòa tan, độ đậm và tỷ lệ phối trộn cho thị trường của bạn.",
        },
      },
      {
        title: { en: "Extraction & drying", vi: "Trích ly & sấy" },
        description: {
          en: "Robusta is extracted, then spray- or freeze-dried to a fine powder or granule.",
          vi: "Robusta được trích ly rồi sấy phun hoặc sấy lạnh thành bột hoặc hạt mịn.",
        },
      },
      {
        title: { en: "Packing & QC", vi: "Đóng gói & kiểm định" },
        description: {
          en: "Packed in your chosen format with batch lab results.",
          vi: "Đóng gói theo quy cách bạn chọn, kèm kết quả kiểm nghiệm theo lô.",
        },
      },
    ],
    faqs: [
      {
        question: {
          en: "Can you match an existing product?",
          vi: "Bạn có thể làm giống sản phẩm hiện có không?",
        },
        answer: {
          en: "Send us a reference sample and we will develop a matching formula.",
          vi: "Hãy gửi mẫu tham chiếu, chúng tôi sẽ phát triển công thức tương đương.",
        },
      },
    ],
    seoTitle: "Vietnamese Instant Coffee Supplier | Lean Export AI",
    seoDescription:
      "Spray-dried and freeze-dried instant coffee and 3-in-1 mixes from Vietnamese Robusta, in bulk or retail packs.",
    schemaServiceType: "Product",
  },
  {
    slug: "oem-private-label",
    name: { en: "OEM & Private Label", vi: "OEM & gia công nhãn riêng" },
    shortDescription: {
      en: "Your brand, our coffee — sourcing, roasting, packaging design and export paperwork in one place.",
      vi: "Thương hiệu của bạn, cà phê của chúng tôi — từ nguyên liệu, rang, thiết kế bao bì đến hồ sơ xuất khẩu.",
    },
    heroTitle: { en: "OEM & Private Label Coffee", vi: "Gia công cà phê OEM & nhãn riêng" },
    heroDescription: {
      en: "Launch your own coffee line without building a factory. We handle production end to end.",
      vi: "Ra mắt dòng cà phê riêng mà không cần xây nhà máy. Chúng tôi lo trọn quy trình sản xuất.",
    },
    heroImageUrl: images.sacks,
    imageUrl: images.packagedBags,
    ctaImageUrl: images.containerStacks,
    imageAlt: { en: "Private label coffee packaging", vi: "Bao bì cà phê nhãn riêng" },
    features: [
      { en: "Low starting MOQ", vi: "MOQ khởi điểm thấp" },
      { en: "Packaging design support", vi: "Hỗ trợ thiết kế bao bì" },
      { en: "Beans, ground, capsules", vi: "Hạt, bột, viên nén" },
      { en: "Export documents included", vi: "Trọn bộ hồ sơ xuất khẩu" },
    ],
    processSteps: [
      {
        title: { en: "Product brief", vi: "Định hình sản phẩm" },
        description: {
          en: "Define the blend, roast, format and target price for your brand.",
          vi: "Xác định blend, mức rang, quy cách và giá mục tiêu cho thương hiệu.",
        },
      },
      {
        title: { en: "Samples & artwork", vi: "Mẫu & thiết kế" },
        description: {
          en: "Approve the cup and the packaging artwork before production.",
          vi: "Duyệt hương vị và thiết kế bao bì trước khi sản xuất.",
        },
      },
      {
        title: { en: "Production & export", vi: "Sản xuất & xuất khẩu" },
        description: {
          en: "We produce, pack and ship with all certificates your market requires.",
          vi: "Sản xuất, đóng gói và giao hàng kèm đầy đủ chứng từ thị trường yêu cầu.",
        },
      },
    ],
    faqs: [
      {
        question: {
          en: "Do you help with label compliance?",
          vi: "Bạn có hỗ trợ tuân thủ nhãn mác không?",
        },
        answer: {
          en: "Yes — we review labels against your market's requirements before printing.",
          vi: "Có — chúng tôi rà soát nhãn theo quy định thị trường của bạn trước khi in.",
        },
      },
    ],
    seoTitle: "OEM & Private Label Coffee from Vietnam | Lean Export AI",
    seoDescription:
      "Private label coffee manufacturing in Vietnam: sourcing, roasting, packaging and export documents for your brand.",
    schemaServiceType: "Service",
  },
];
