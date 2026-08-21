export type ServiceFeatureItem = {
  title: string;
  description?: string;
  icon: string;
};

export type ServiceFeatureSection = {
  eyebrow: string;
  title: string;
  description?: string;
  items: readonly ServiceFeatureItem[];
};

export type ServicePageContent = {
  slug: string;
  navLabel: string;
  title: string;
  metadataDescription: string;
  heroIcon: string;
  heroDescription: string;
  featureSections: readonly ServiceFeatureSection[];
  process: {
    title: string;
    description: string;
    steps: readonly string[];
  };
  notice: {
    title: string;
    description?: string;
    items: readonly string[];
  };
  faqs: readonly {
    question: string;
    answer: string;
  }[];
};

export const SERVICE_PAGES = {
  repair: {
    slug: "dich-vu-sua-chua",
    navLabel: "Dịch vụ sửa chữa",
    title: "Dịch vụ sửa chữa",
    metadataDescription:
      "Thông tin kiểm tra, tư vấn và hỗ trợ xử lý các vấn đề thường gặp trên thiết bị Apple tại Đức Bách Hoá.",
    heroIcon: "build",
    heroDescription:
      "Kiểm tra, tư vấn và hỗ trợ xử lý các vấn đề thường gặp trên thiết bị Apple.",
    featureSections: [
      {
        eyebrow: "Thiết bị",
        title: "Thiết bị có thể tiếp nhận kiểm tra",
        description:
          "Khả năng hỗ trợ cụ thể được xác nhận sau khi cửa hàng kiểm tra dòng máy và tình trạng thực tế.",
        items: [
          {
            title: "iPhone",
            description: "Kiểm tra pin, màn hình, camera, cổng sạc và phần mềm.",
            icon: "phone_iphone",
          },
          {
            title: "MacBook",
            description: "Kiểm tra nguồn, pin, bàn phím, màn hình và hệ điều hành.",
            icon: "laptop_mac",
          },
          {
            title: "iPad",
            description: "Kiểm tra màn hình, pin, cổng kết nối và các chức năng chính.",
            icon: "tablet_mac",
          },
          {
            title: "Apple Watch",
            description: "Kiểm tra nguồn, pin, màn hình và khả năng kết nối.",
            icon: "watch",
          },
          {
            title: "iMac",
            description: "Kiểm tra phần cứng và phần mềm theo tình trạng thiết bị.",
            icon: "desktop_mac",
          },
          {
            title: "Phụ kiện",
            description: "Kiểm tra kết nối và chức năng cơ bản của phụ kiện phù hợp.",
            icon: "cable",
          },
        ],
      },
      {
        eyebrow: "Hạng mục phổ biến",
        title: "Các nhu cầu thường được hỗ trợ",
        description:
          "Danh sách mang tính tham khảo. Phương án xử lý chỉ được đề xuất sau khi kiểm tra thiết bị.",
        items: [
          {
            title: "Kiểm tra tình trạng",
            description: "Ghi nhận dấu hiệu và kiểm tra các chức năng liên quan.",
            icon: "fact_check",
          },
          {
            title: "Kiểm tra pin",
            description: "Đánh giá tình trạng pin và tư vấn phương án phù hợp.",
            icon: "battery_charging_full",
          },
          {
            title: "Kiểm tra màn hình",
            description: "Kiểm tra hiển thị và thao tác cảm ứng nếu thiết bị hỗ trợ.",
            icon: "smartphone",
          },
          {
            title: "Kiểm tra cổng sạc",
            description: "Kiểm tra khả năng nhận sạc và kết nối cơ bản.",
            icon: "power",
          },
          {
            title: "Kiểm tra camera",
            description: "Kiểm tra camera và các dấu hiệu bất thường liên quan.",
            icon: "photo_camera",
          },
          {
            title: "Lỗi phần mềm",
            description: "Hỗ trợ xác định và xử lý một số lỗi phần mềm thường gặp.",
            icon: "settings",
          },
          {
            title: "Vệ sinh thiết bị",
            description: "Tư vấn vệ sinh phù hợp theo loại và tình trạng thiết bị.",
            icon: "cleaning_services",
          },
        ],
      },
    ],
    process: {
      title: "Quy trình tiếp nhận tham khảo",
      description:
        "Mỗi bước giúp khách hàng nắm rõ tình trạng và xác nhận phương án trước khi thực hiện.",
      steps: [
        "Tiếp nhận thiết bị",
        "Kiểm tra tình trạng",
        "Tư vấn phương án xử lý",
        "Xác nhận trước khi thực hiện",
        "Bàn giao và kiểm tra lại",
      ],
    },
    notice: {
      title: "Lưu ý trước khi gửi thiết bị",
      items: [
        "Thời gian xử lý phụ thuộc tình trạng thực tế của thiết bị.",
        "Chi phí được thông báo để khách hàng xác nhận trước khi thực hiện.",
        "Nên sao lưu dữ liệu quan trọng trước khi gửi thiết bị.",
      ],
    },
    faqs: [
      {
        question: "Có thể biết chi phí trước khi kiểm tra không?",
        answer:
          "Chi phí phụ thuộc dòng máy, tình trạng và phương án xử lý. Cửa hàng cần kiểm tra thực tế trước khi tư vấn.",
      },
      {
        question: "Tôi nên chuẩn bị gì trước khi mang thiết bị đến?",
        answer:
          "Bạn nên sao lưu dữ liệu quan trọng và mang theo các phụ kiện có liên quan đến lỗi nếu cần đối chiếu.",
      },
    ],
  },
  warranty: {
    slug: "bao-hanh-chinh-hang",
    navLabel: "Bảo hành chính hãng",
    title: "Bảo hành chính hãng",
    metadataDescription:
      "Hướng dẫn chuẩn bị thông tin và kiểm tra điều kiện bảo hành sản phẩm tại Đức Bách Hoá.",
    heroIcon: "verified_user",
    heroDescription:
      "Hướng dẫn chuẩn bị thông tin và kiểm tra điều kiện bảo hành phù hợp cho sản phẩm.",
    featureSections: [
      {
        eyebrow: "Chuẩn bị thông tin",
        title: "Thông tin cần có khi kiểm tra bảo hành",
        description:
          "Thông tin đầy đủ giúp việc đối chiếu tình trạng bảo hành thuận tiện hơn.",
        items: [
          {
            title: "Thông tin sản phẩm",
            description: "Tên sản phẩm, dòng máy và thông tin mua hàng liên quan.",
            icon: "inventory_2",
          },
          {
            title: "Thời gian mua hàng",
            description: "Thời điểm mua hoặc chứng từ mua hàng nếu đang có.",
            icon: "event",
          },
          {
            title: "Serial thiết bị",
            description: "Số serial rõ ràng để phục vụ việc kiểm tra và đối chiếu.",
            icon: "pin",
          },
          {
            title: "Tình trạng thiết bị",
            description: "Mô tả dấu hiệu, lỗi và tình trạng ngoại hình hiện tại.",
            icon: "search_check",
          },
        ],
      },
    ],
    process: {
      title: "Quy trình hỗ trợ bảo hành",
      description:
        "Phương án cuối cùng phụ thuộc kết quả kiểm tra và điều kiện áp dụng tại thời điểm tiếp nhận.",
      steps: [
        "Cung cấp thông tin sản phẩm",
        "Kiểm tra tình trạng bảo hành",
        "Tiếp nhận thiết bị nếu cần",
        "Hướng dẫn phương án bảo hành phù hợp",
      ],
    },
    notice: {
      title: "Các trường hợp cần lưu ý",
      description:
        "Những yếu tố dưới đây có thể ảnh hưởng đến kết quả kiểm tra điều kiện bảo hành.",
      items: [
        "Thiết bị có dấu hiệu hư hỏng vật lý.",
        "Thiết bị đã được can thiệp hoặc sửa chữa trước đó.",
        "Thông tin serial không hợp lệ hoặc không thể đối chiếu.",
        "Sản phẩm đã ngoài thời gian bảo hành áp dụng.",
      ],
    },
    faqs: [
      {
        question: "Trang này có thay thế chính sách bảo hành chính thức không?",
        answer:
          "Không. Nội dung mang tính hướng dẫn; điều kiện thực tế cần được kiểm tra theo sản phẩm và thông tin tại thời điểm tiếp nhận.",
      },
      {
        question: "Thiếu chứng từ mua hàng có kiểm tra được không?",
        answer:
          "Bạn có thể cung cấp serial và thông tin đang có để cửa hàng hỗ trợ kiểm tra trước. Khả năng xử lý phụ thuộc kết quả đối chiếu thực tế.",
      },
    ],
  },
  tradeIn: {
    slug: "thu-cu-doi-moi",
    navLabel: "Thu cũ đổi mới",
    title: "Thu cũ đổi mới",
    metadataDescription:
      "Thông tin quy trình kiểm tra thiết bị cũ và nâng cấp sản phẩm tại Đức Bách Hoá.",
    heroIcon: "published_with_changes",
    heroDescription:
      "Đổi thiết bị cũ và nâng cấp lên sản phẩm phù hợp hơn. Giá thu phụ thuộc tình trạng thực tế của thiết bị.",
    featureSections: [
      {
        eyebrow: "Định giá thiết bị",
        title: "Yếu tố ảnh hưởng đến mức định giá",
        description:
          "Thiết bị được kiểm tra trực tiếp trước khi đưa ra mức thu cuối cùng.",
        items: [
          {
            title: "Model",
            description: "Dòng máy và phiên bản cụ thể của thiết bị.",
            icon: "devices",
          },
          {
            title: "Dung lượng",
            description: "Dung lượng lưu trữ theo thông tin trên thiết bị.",
            icon: "memory",
          },
          {
            title: "Ngoại hình",
            description: "Tình trạng vỏ, khung, mặt kính và dấu hiệu va chạm.",
            icon: "palette",
          },
          {
            title: "Màn hình",
            description: "Khả năng hiển thị và thao tác cảm ứng.",
            icon: "screenshot_monitor",
          },
          {
            title: "Pin",
            description: "Tình trạng pin và khả năng sử dụng thực tế.",
            icon: "battery_status_good",
          },
          {
            title: "Camera",
            description: "Khả năng hoạt động của camera và các tính năng liên quan.",
            icon: "photo_camera",
          },
          {
            title: "Chức năng chính",
            description: "Kết nối, âm thanh, phím bấm và các chức năng cơ bản.",
            icon: "fact_check",
          },
          {
            title: "Tài khoản thiết bị",
            description: "Tình trạng tài khoản cá nhân và khóa kích hoạt.",
            icon: "lock_open_right",
          },
          {
            title: "Phụ kiện đi kèm",
            description: "Phụ kiện được mang theo để kiểm tra cùng thiết bị.",
            icon: "cable",
          },
        ],
      },
    ],
    process: {
      title: "Quy trình thu cũ đổi mới",
      description:
        "Quy trình dưới đây giúp bạn hình dung các bước từ kiểm tra máy cũ đến chọn sản phẩm mới.",
      steps: [
        "Mang thiết bị cần định giá",
        "Kiểm tra ngoại hình và chức năng",
        "Nhận mức định giá",
        "Chọn sản phẩm mới",
        "Thanh toán phần chênh lệch",
      ],
    },
    notice: {
      title: "Lưu ý trước khi bàn giao",
      items: [
        "Sao lưu dữ liệu quan trọng trước khi bàn giao thiết bị.",
        "Đăng xuất tài khoản cá nhân khi hoàn tất giao dịch.",
        "Mức thu cuối cùng được xác định sau khi kiểm tra thực tế.",
      ],
    },
    faqs: [
      {
        question: "Có thể định giá chính xác chỉ từ thông tin model không?",
        answer:
          "Không. Model chỉ là một yếu tố; ngoại hình, pin, màn hình và chức năng thực tế đều ảnh hưởng đến mức định giá.",
      },
      {
        question: "Tôi có cần xóa dữ liệu trước khi mang máy đến không?",
        answer:
          "Bạn nên sao lưu trước. Việc đăng xuất tài khoản và bàn giao thiết bị chỉ nên hoàn tất sau khi hai bên xác nhận giao dịch.",
      },
    ],
  },
  installment: {
    slug: "tra-gop",
    navLabel: "Trả góp 0%",
    title: "Trả góp 0%",
    metadataDescription:
      "Thông tin tham khảo về lựa chọn thanh toán trả góp và điều kiện áp dụng tại Đức Bách Hoá.",
    heroIcon: "payments",
    heroDescription:
      "Các lựa chọn thanh toán trả góp giúp chia nhỏ chi phí mua sản phẩm. Điều kiện áp dụng phụ thuộc chương trình và phương thức thanh toán tại thời điểm mua.",
    featureSections: [
      {
        eyebrow: "Trước khi lựa chọn",
        title: "Thông tin cần kiểm tra",
        description:
          "Hãy đối chiếu đầy đủ điều kiện của chương trình đang áp dụng trước khi xác nhận đơn hàng.",
        items: [
          {
            title: "Giá trị đơn hàng tối thiểu",
            description: "Kiểm tra ngưỡng áp dụng của chương trình tại thời điểm mua.",
            icon: "price_check",
          },
          {
            title: "Kỳ hạn",
            description: "Xem các kỳ hạn đang được hỗ trợ và lựa chọn phù hợp.",
            icon: "calendar_month",
          },
          {
            title: "Phương thức thanh toán",
            description: "Xác nhận phương thức phù hợp với chương trình hiện hành.",
            icon: "credit_card",
          },
          {
            title: "Điều kiện chương trình",
            description: "Đọc và xác nhận các điều kiện áp dụng cụ thể.",
            icon: "checklist",
          },
          {
            title: "Phí phát sinh nếu có",
            description: "Kiểm tra tổng số tiền và các khoản phí trước khi hoàn tất.",
            icon: "receipt_long",
          },
        ],
      },
    ],
    process: {
      title: "Quy trình tham khảo",
      description:
        "Các bước thực tế có thể thay đổi theo phương thức thanh toán và chương trình tại thời điểm mua.",
      steps: [
        "Chọn sản phẩm",
        "Chọn phương thức trả góp phù hợp",
        "Kiểm tra điều kiện áp dụng",
        "Hoàn tất thông tin",
        "Xác nhận đơn hàng",
      ],
    },
    notice: {
      title: "Thông tin quan trọng",
      description:
        "Thông tin trên trang mang tính giới thiệu. Điều kiện thực tế phụ thuộc chương trình đang áp dụng.",
      items: [
        "Không phải mọi sản phẩm hoặc mọi khách hàng đều mặc định đủ điều kiện áp dụng mức 0%.",
        "Kỳ hạn, phương thức thanh toán và chi phí liên quan cần được xác nhận tại thời điểm mua.",
      ],
    },
    faqs: [
      {
        question: "Mọi sản phẩm đều được áp dụng trả góp 0% phải không?",
        answer:
          "Không mặc định. Khả năng áp dụng phụ thuộc sản phẩm, giá trị đơn hàng, phương thức thanh toán và chương trình tại thời điểm mua.",
      },
      {
        question: "Làm sao biết tổng chi phí cần thanh toán?",
        answer:
          "Bạn cần kiểm tra kỳ hạn, số tiền thanh toán và phí phát sinh nếu có trước khi xác nhận đơn hàng.",
      },
    ],
  },
  installation: {
    slug: "lap-dat-tan-noi",
    navLabel: "Lắp đặt tận nơi",
    title: "Lắp đặt tận nơi",
    metadataDescription:
      "Thông tin giao, lắp đặt và thiết lập cơ bản cho một số sản phẩm phù hợp tại Đức Bách Hoá.",
    heroIcon: "home_repair_service",
    heroDescription:
      "Hỗ trợ giao và lắp đặt một số sản phẩm phù hợp tại địa chỉ khách hàng.",
    featureSections: [
      {
        eyebrow: "Phạm vi hỗ trợ",
        title: "Sản phẩm và dịch vụ có thể hỗ trợ",
        description:
          "Khả năng hỗ trợ phụ thuộc loại sản phẩm, yêu cầu thực tế và khu vực giao nhận.",
        items: [
          {
            title: "Thiết bị để bàn",
            description: "Hỗ trợ bố trí và thiết lập cơ bản với thiết bị phù hợp.",
            icon: "desktop_windows",
          },
          {
            title: "Phụ kiện",
            description: "Hỗ trợ kết nối một số phụ kiện tương thích với thiết bị.",
            icon: "cable",
          },
          {
            title: "Thiết bị âm thanh",
            description: "Hỗ trợ kết nối và kiểm tra hoạt động cơ bản.",
            icon: "speaker",
          },
          {
            title: "Thiết lập ban đầu",
            description: "Hỗ trợ các bước khởi tạo cơ bản cho thiết bị phù hợp.",
            icon: "settings_suggest",
          },
        ],
      },
    ],
    process: {
      title: "Quy trình hỗ trợ tận nơi",
      description:
        "Cửa hàng xác nhận khả năng hỗ trợ và lịch hẹn trước khi giao sản phẩm.",
      steps: [
        "Xác nhận đơn hàng",
        "Kiểm tra khu vực hỗ trợ",
        "Hẹn thời gian",
        "Giao sản phẩm",
        "Lắp đặt hoặc thiết lập cơ bản",
        "Khách hàng kiểm tra",
      ],
    },
    notice: {
      title: "Lưu ý khi đăng ký hỗ trợ",
      items: [
        "Khả năng hỗ trợ phụ thuộc loại sản phẩm và khu vực.",
        "Một số yêu cầu lắp đặt đặc biệt có thể cần xác nhận trước.",
        "Phạm vi công việc được thống nhất trước khi thực hiện tại địa chỉ khách hàng.",
      ],
    },
    faqs: [
      {
        question: "Tất cả sản phẩm đều được lắp đặt tận nơi không?",
        answer:
          "Không. Cửa hàng cần kiểm tra loại sản phẩm, yêu cầu thiết lập và khu vực trước khi xác nhận hỗ trợ.",
      },
      {
        question: "Có thể yêu cầu lắp đặt đặc biệt không?",
        answer:
          "Bạn có thể mô tả nhu cầu để cửa hàng kiểm tra khả năng đáp ứng. Các yêu cầu đặc biệt cần được xác nhận trước.",
      },
    ],
  },
} as const satisfies Record<string, ServicePageContent>;

export const SERVICE_PAGE_NAV_ITEMS = [
  {
    label: SERVICE_PAGES.repair.navLabel,
    href: `/${SERVICE_PAGES.repair.slug}`,
  },
  {
    label: SERVICE_PAGES.warranty.navLabel,
    href: `/${SERVICE_PAGES.warranty.slug}`,
  },
  {
    label: SERVICE_PAGES.tradeIn.navLabel,
    href: `/${SERVICE_PAGES.tradeIn.slug}`,
  },
  {
    label: SERVICE_PAGES.installment.navLabel,
    href: `/${SERVICE_PAGES.installment.slug}`,
  },
  {
    label: SERVICE_PAGES.installation.navLabel,
    href: `/${SERVICE_PAGES.installation.slug}`,
  },
] as const;
