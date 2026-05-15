'use client';
'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

type Product = {
  id: number;
  name: string;
  slug: string;
  image: string;
  oldPrice?: number;
  price: number;
  installment?: string;
  discountLabel?: string;
  promotions?: string[];
};

type ProductCategory = {
  id: string;
  title: string;
  description: string;
  viewAllHref: string;
  products: Product[];
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

const productCategories: ProductCategory[] = [
  {
    id: 'iphone',
    title: 'iPhone',
    description: 'Các mẫu iPhone chính hãng, giá tốt',
    viewAllHref: '/iphone',
    products: [
      {
        id: 1,
        name: 'iPhone 15 Pro Max 256GB',
        slug: '/iphone/iphone-15-pro-max-256gb',
        image: '/products/iphone/iphone-15-pro-max_5.webp',
        oldPrice: 34990000,
        price: 29990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giảm 5%',
        promotions: [
          'Smember giảm đến 120.000đ',
          'S-Student giảm thêm 300.000đ',
          'Tặng gói AppleCare ưu đãi và 5 km khác',
        ],
      },
      {
        id: 2,
        name: 'iPhone 15 128GB',
        slug: '/iphone/iphone-15-128gb',
        image: '/products/iphone/iphone-15-plus.png',
        oldPrice: 22990000,
        price: 18990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giảm 4%',
        promotions: [
          'Smember giảm đến 100.000đ',
          'S-Student giảm thêm 250.000đ',
          'Tặng ốp lưng trong suốt khi mua kèm phụ kiện',
        ],
      },
      {
        id: 3,
        name: 'iPhone 14 Pro Max 128GB',
        slug: '/iphone/iphone-14-pro-max-128gb',
        image: '/products/iphone/iphone-14-pro-max.png',
        oldPrice: 27990000,
        price: 23990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giá tốt',
        promotions: [
          'Smember giảm đến 150.000đ',
          'Thu cũ đổi mới trợ giá thêm 1.000.000đ',
          'Tặng gói bảo hành mở rộng ưu đãi',
        ],
      },
      {
        id: 4,
        name: 'iPhone 13 128GB',
        slug: '/iphone/iphone-13-128gb',
        image: '/products/iphone-13.webp',
        oldPrice: 17990000,
        price: 13990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Bán chạy',
        promotions: [
          'Smember giảm đến 80.000đ',
          'S-Student giảm thêm 200.000đ',
          'Tặng voucher mua phụ kiện',
        ],
      },
      {
        id: 5,
        name: 'iPhone 12 64GB',
        slug: '/iphone/iphone-12-64gb',
        image: '/products/iphone-12.webp',
        oldPrice: 13990000,
        price: 10990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giá sốc',
        promotions: [
          'Smember giảm đến 70.000đ',
          'Trả góp 0% qua thẻ tín dụng',
          'Tặng sim data khi mua online',
        ],
      },
      {
        id: 6,
        name: 'iPhone 11 64GB',
        slug: '/iphone/iphone-11-64gb',
        image: '/products/iphone-11.webp',
        oldPrice: 10990000,
        price: 8490000,
        installment: 'Trả góp 0%',
        discountLabel: 'Tiết kiệm',
        promotions: [
          'Smember giảm đến 50.000đ',
          'Ưu đãi thêm khi thanh toán online',
          'Tặng voucher mua sạc cáp',
        ],
      },
    ],
  },
  {
    id: 'ipad',
    title: 'iPad',
    description: 'iPad học tập, làm việc và giải trí',
    viewAllHref: '/ipad',
    products: [
      {
        id: 7,
        name: 'iPad Gen 10 WiFi 64GB',
        slug: '/ipad/ipad-gen-10-wifi-64gb',
        image: '/products/ipad-gen-10.webp',
        oldPrice: 11990000,
        price: 9490000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giảm 2.500.000đ',
        promotions: [
          'Smember giảm đến 100.000đ',
          'S-Student giảm thêm 300.000đ',
          'Tặng gói học tập online ưu đãi',
        ],
      },
      {
        id: 8,
        name: 'iPad Air 5 M1 WiFi 64GB',
        slug: '/ipad/ipad-air-5-m1-wifi-64gb',
        image: '/products/ipad-air-5.webp',
        oldPrice: 16990000,
        price: 13990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giá tốt',
        promotions: [
          'Smember giảm đến 120.000đ',
          'S-Student giảm thêm 350.000đ',
          'Ưu đãi Apple Pencil khi mua kèm',
        ],
      },
      {
        id: 9,
        name: 'iPad Pro M2 11 inch 128GB',
        slug: '/ipad/ipad-pro-m2-11-128gb',
        image: '/products/ipad-pro-m2.webp',
        oldPrice: 23990000,
        price: 20990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Cao cấp',
        promotions: [
          'Smember giảm đến 200.000đ',
          'Thu cũ đổi mới trợ giá thêm',
          'Tặng voucher mua bàn phím iPad',
        ],
      },
      {
        id: 10,
        name: 'iPad Mini 6 WiFi 64GB',
        slug: '/ipad/ipad-mini-6-wifi-64gb',
        image: '/products/ipad-mini-6.webp',
        oldPrice: 14990000,
        price: 11990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Nhỏ gọn',
        promotions: [
          'Smember giảm đến 90.000đ',
          'S-Student giảm thêm 250.000đ',
          'Tặng voucher phụ kiện iPad',
        ],
      },
      {
        id: 11,
        name: 'iPad Gen 9 WiFi 64GB',
        slug: '/ipad/ipad-gen-9-wifi-64gb',
        image: '/products/ipad-gen-9.webp',
        oldPrice: 8990000,
        price: 6990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Học tập',
        promotions: [
          'Smember giảm đến 70.000đ',
          'Ưu đãi học sinh sinh viên',
          'Tặng gói bảo hành ưu đãi',
        ],
      },
    ],
  },
  {
    id: 'macbook',
    title: 'MacBook',
    description: 'MacBook Air, MacBook Pro hiệu năng cao',
    viewAllHref: '/macbook',
    products: [
      {
        id: 12,
        name: 'MacBook Air M2 13 inch 8GB 256GB',
        slug: '/macbook/macbook-air-m2-13-256gb',
        image: '/products/macbook-air-m2.webp',
        oldPrice: 28990000,
        price: 22990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giảm mạnh',
        promotions: [
          'Smember giảm đến 300.000đ',
          'S-Student giảm thêm 500.000đ',
          'Tặng Microsoft 365 ưu đãi khi mua kèm',
        ],
      },
      {
        id: 13,
        name: 'MacBook Air M3 13 inch 8GB 256GB',
        slug: '/macbook/macbook-air-m3-13-256gb',
        image: '/products/macbook-air-m3.webp',
        oldPrice: 32990000,
        price: 27990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Mới',
        promotions: [
          'Smember giảm đến 350.000đ',
          'S-Student giảm thêm 600.000đ',
          'Ưu đãi mua kèm Magic Mouse',
        ],
      },
      {
        id: 14,
        name: 'MacBook Pro M3 14 inch 8GB 512GB',
        slug: '/macbook/macbook-pro-m3-14-512gb',
        image: '/products/macbook-pro-m3.webp',
        oldPrice: 42990000,
        price: 38990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Pro',
        promotions: [
          'Smember giảm đến 500.000đ',
          'Thu cũ đổi mới trợ giá thêm',
          'Tặng voucher mua phụ kiện MacBook',
        ],
      },
      {
        id: 15,
        name: 'MacBook Pro M3 Pro 14 inch 18GB 512GB',
        slug: '/macbook/macbook-pro-m3-pro-14-512gb',
        image: '/products/macbook-pro-m3-pro.webp',
        oldPrice: 52990000,
        price: 48990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Hiệu năng cao',
        promotions: [
          'Smember giảm đến 700.000đ',
          'Ưu đãi doanh nghiệp khi mua số lượng',
          'Tặng gói bảo hành mở rộng',
        ],
      },
      {
        id: 16,
        name: 'MacBook Air M1 13 inch 8GB 256GB',
        slug: '/macbook/macbook-air-m1-13-256gb',
        image: '/products/macbook-air-m1.webp',
        oldPrice: 22990000,
        price: 17990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Sinh viên',
        promotions: [
          'Smember giảm đến 250.000đ',
          'S-Student giảm thêm 500.000đ',
          'Tặng voucher mua balo laptop',
        ],
      },
    ],
  },
  {
    id: 'accessory',
    title: 'Phụ kiện',
    description: 'Sạc, cáp, ốp lưng, bàn phím, chuột',
    viewAllHref: '/phu-kien',
    products: [
      {
        id: 17,
        name: 'Củ sạc Apple USB-C 20W',
        slug: '/phu-kien/cu-sac-apple-usb-c-20w',
        image: '/products/apple-20w.webp',
        oldPrice: 690000,
        price: 490000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giá tốt',
        promotions: [
          'Smember giảm đến 20.000đ',
          'Mua kèm cáp giảm thêm 50.000đ',
          'Bảo hành chính hãng 12 tháng',
        ],
      },
      {
        id: 18,
        name: 'Cáp Apple USB-C to Lightning 1m',
        slug: '/phu-kien/cap-apple-usb-c-lightning-1m',
        image: '/products/cap-lightning.webp',
        oldPrice: 590000,
        price: 390000,
        installment: 'Trả góp 0%',
        discountLabel: 'Bán chạy',
        promotions: [
          'Smember giảm đến 20.000đ',
          'Mua 2 giảm thêm 5%',
          'Bảo hành chính hãng',
        ],
      },
      {
        id: 19,
        name: 'Magic Mouse 2',
        slug: '/phu-kien/magic-mouse-2',
        image: '/products/magic-mouse.webp',
        oldPrice: 2490000,
        price: 1990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Apple',
        promotions: [
          'Smember giảm đến 50.000đ',
          'Ưu đãi khi mua kèm MacBook',
          'Hỗ trợ trả góp qua thẻ',
        ],
      },
      {
        id: 20,
        name: 'Magic Keyboard',
        slug: '/phu-kien/magic-keyboard',
        image: '/products/magic-keyboard.webp',
        oldPrice: 3290000,
        price: 2790000,
        installment: 'Trả góp 0%',
        discountLabel: 'Chính hãng',
        promotions: [
          'Smember giảm đến 70.000đ',
          'Mua kèm MacBook giảm thêm',
          'Bảo hành chính hãng Apple',
        ],
      },
      {
        id: 21,
        name: 'Ốp lưng MagSafe iPhone 15 Pro Max',
        slug: '/phu-kien/op-lung-magsafe-iphone-15-pro-max',
        image: '/products/op-lung-magsafe.webp',
        oldPrice: 1290000,
        price: 890000,
        installment: 'Trả góp 0%',
        discountLabel: 'MagSafe',
        promotions: [
          'Smember giảm đến 30.000đ',
          'Mua kèm iPhone giảm thêm',
          'Nhiều màu sắc lựa chọn',
        ],
      },
    ],
  },
  {
    id: 'camera',
    title: 'Camera',
    description: 'Camera an ninh, camera gia đình',
    viewAllHref: '/camera',
    products: [
      {
        id: 22,
        name: 'Camera WiFi 360 độ Full HD',
        slug: '/camera/camera-wifi-360-full-hd',
        image: '/products/camera-wifi-360.webp',
        oldPrice: 990000,
        price: 690000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giảm 300.000đ',
        promotions: [
          'Smember giảm đến 30.000đ',
          'Miễn phí lưu trữ thử nghiệm',
          'Hỗ trợ cài đặt nhanh',
        ],
      },
      {
        id: 23,
        name: 'Camera ngoài trời chống nước',
        slug: '/camera/camera-ngoai-troi-chong-nuoc',
        image: '/products/camera-outdoor.webp',
        oldPrice: 1490000,
        price: 1190000,
        installment: 'Trả góp 0%',
        discountLabel: 'Chống nước',
        promotions: [
          'Smember giảm đến 50.000đ',
          'Chuẩn chống nước IP66',
          'Tặng thẻ nhớ khi mua kèm',
        ],
      },
      {
        id: 24,
        name: 'Camera trong nhà AI Tracking',
        slug: '/camera/camera-ai-tracking',
        image: '/products/camera-ai.webp',
        oldPrice: 1290000,
        price: 990000,
        installment: 'Trả góp 0%',
        discountLabel: 'AI',
        promotions: [
          'Smember giảm đến 40.000đ',
          'Theo dõi chuyển động thông minh',
          'Hỗ trợ đàm thoại 2 chiều',
        ],
      },
      {
        id: 25,
        name: 'Camera pin sạc không dây',
        slug: '/camera/camera-pin-sac-khong-day',
        image: '/products/camera-wireless.webp',
        oldPrice: 1990000,
        price: 1590000,
        installment: 'Trả góp 0%',
        discountLabel: 'Không dây',
        promotions: [
          'Smember giảm đến 70.000đ',
          'Pin dùng lâu, dễ lắp đặt',
          'Tặng gói cloud ưu đãi',
        ],
      },
      {
        id: 26,
        name: 'Camera an ninh 2K góc rộng',
        slug: '/camera/camera-an-ninh-2k-goc-rong',
        image: '/products/camera-2k.webp',
        oldPrice: 1790000,
        price: 1390000,
        installment: 'Trả góp 0%',
        discountLabel: '2K',
        promotions: [
          'Smember giảm đến 60.000đ',
          'Hình ảnh sắc nét 2K',
          'Hỗ trợ xem từ xa qua điện thoại',
        ],
      },
    ],
  },
  {
    id: 'audio',
    title: 'Âm thanh',
    description: 'Tai nghe, loa bluetooth, AirPods',
    viewAllHref: '/am-thanh',
    products: [
      {
        id: 27,
        name: 'AirPods Pro 2 USB-C',
        slug: '/am-thanh/airpods-pro-2-usb-c',
        image: '/products/airpods-pro-2.webp',
        oldPrice: 6490000,
        price: 5290000,
        installment: 'Trả góp 0%',
        discountLabel: 'Giảm 1.200.000đ',
        promotions: [
          'Smember giảm đến 120.000đ',
          'S-Student giảm thêm 200.000đ',
          'Tặng gói bảo hành rơi vỡ ưu đãi',
        ],
      },
      {
        id: 28,
        name: 'AirPods 3',
        slug: '/am-thanh/airpods-3',
        image: '/products/airpods-3.webp',
        oldPrice: 4990000,
        price: 3990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Apple',
        promotions: [
          'Smember giảm đến 90.000đ',
          'Mua kèm iPhone giảm thêm',
          'Hỗ trợ trả góp 0%',
        ],
      },
      {
        id: 29,
        name: 'Loa Bluetooth JBL Go 4',
        slug: '/am-thanh/jbl-go-4',
        image: '/products/jbl-go-4.webp',
        oldPrice: 1190000,
        price: 890000,
        installment: 'Trả góp 0%',
        discountLabel: 'Nhỏ gọn',
        promotions: [
          'Smember giảm đến 40.000đ',
          'Chống nước, dễ mang theo',
          'Tặng voucher phụ kiện âm thanh',
        ],
      },
      {
        id: 30,
        name: 'Tai nghe Sony WH-CH520',
        slug: '/am-thanh/sony-wh-ch520',
        image: '/products/sony-wh-ch520.webp',
        oldPrice: 1490000,
        price: 1190000,
        installment: 'Trả góp 0%',
        discountLabel: 'Pin lâu',
        promotions: [
          'Smember giảm đến 50.000đ',
          'Pin nghe nhạc lên đến 50 giờ',
          'Ưu đãi khi thanh toán online',
        ],
      },
      {
        id: 31,
        name: 'Loa Bluetooth Marshall Emberton II',
        slug: '/am-thanh/marshall-emberton-ii',
        image: '/products/marshall-emberton-ii.webp',
        oldPrice: 4990000,
        price: 3990000,
        installment: 'Trả góp 0%',
        discountLabel: 'Cao cấp',
        promotions: [
          'Smember giảm đến 100.000đ',
          'Âm thanh mạnh mẽ, thiết kế cổ điển',
          'Tặng voucher mua phụ kiện',
        ],
      },
    ],
  },
];

function ProductCard({ product }: { product: Product }) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <article className="group/product relative h-full rounded-xl bg-surface-container-lowest border border-surface-container-high  transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      {product.discountLabel && (
        <div
          title={product.discountLabel}
          className="absolute -left-0.8 -top-3 z-30 flex h-[34px] w-[86px] items-center justify-center bg-contain bg-center bg-no-repeat text-[10px] font-semibold text-white drop-shadow-sm"
          
          style={{
            backgroundImage:
              // "url('https://cdn2.cellphones.com.vn/x/media/wysiwyg/discount-badge-ui-2025.png')",
                // '/sale/discount-badge-ui-2025.png',
              "url('/products/discount/discount-badge-ui-2025.webp')",
          }}
        >
          <span className="max-w-[62px] truncate">
            {product.discountLabel}
          </span>
        </div> 
      )}
      {product.installment && (
        <div
          title={product.installment}
          className="absolute -right-1 top-0 z-30 flex h-[34px] w-[86px] items-center justify-center bg-contain bg-center bg-no-repeat text-[10px] font-semibold text-sky-500 drop-shadow-sm"
          style={{
            backgroundImage:
              // "url('https://cdn2.cellphones.com.vn/x/media/wysiwyg/installment-badge-ui-2025.png')",
              // '/sale/installment-badge-ui-2025.png',
              "url('/products/discount/zero-ins-badge-ui-2025.webp')",
          }}
        >
          <span className="max-w-[62px] truncate">
            {product.installment}
          </span>
        </div>
      )}

      <a href={product.slug} title={product.name} className="flex h-full flex-col">
        <div className="relative  p-4 pt-9">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-white">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover/product:scale-105"
              onError={(event) => {
                event.currentTarget.src = '/sale/flash-sale-1.webp';
              }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3 pb-12">
          {/* {product.installment && (
            <div className="mb-2 h-6">
              <span
                title={product.installment}
                className="inline-block max-w-full truncate rounded-full border border-outline-variant bg-surface-container-low px-2 py-[2px] text-label-sm font-medium text-secondary"
              >
                {product.installment}
              </span>
            </div>
          )} */}

          <h3
            title={product.name}
            className="min-h-[44px] text-label-md md:text-body-md font-semibold text-on-surface line-clamp-2"
          >
            {product.name}
          </h3>

          <div className="mt-2 min-h-[44px]">
            {product.oldPrice && (
              <p className="text-label-sm text-secondary line-through">
                {formatPrice(product.oldPrice)}
              </p>
            )}

            <p className="text-body-md font-bold text-primary">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="mt-3 min-h-[84px] space-y-1">
            {product.promotions?.slice(0, 3).map((promotion, index) => (
              <p
                key={`${product.id}-${promotion}`}
                title={promotion}
                className={[
                  'h-6 truncate rounded-md px-2 py-1 text-[11px] font-medium leading-4',
                  index === 0
                    ? 'bg-blue-100 text-blue-700'
                    : index === 1
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-surface-container text-on-surface',
                ].join(' ')}
              >
                {promotion}
              </p>
            ))}
          </div>
        </div>
      </a>

      <button
        type="button"
        aria-label={`Thêm ${product.name} vào yêu thích`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsFavorite((current) => !current);
        }}
        className={[
          'absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition-all duration-300',
          isFavorite
            ? 'border-primary bg-primary text-on-primary'
            : 'border-outline-variant bg-white/95 text-secondary hover:border-primary hover:text-primary',
        ].join(' ')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill={isFavorite ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={[
            'h-4 w-4 transition-all duration-300',
            isFavorite
              ? 'scale-110 text-on-primary'
              : 'text-secondary group-hover/product:text-primary',
          ].join(' ')}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.536 0-2.898.722-3.75 1.838C11.71 4.472 10.348 3.75 8.812 3.75 6.223 3.75 4.125 5.765 4.125 8.25c0 7.22 8.437 11.25 8.437 11.25S21 15.47 21 8.25Z"
          />
        </svg>

        <span>Yêu thích</span>
      </button>
    </article>
  );
}

function ProductCategorySection({ category }: { category: ProductCategory }) {
  const prevClass = `product-prev-${category.id}`;
  const nextClass = `product-next-${category.id}`;

  return (
    <section className="container mx-auto px-3 md:px-5 mt-8">
      <div className="group relative  rounded-2xl border border-surface-container-high bg-surface-container-lowest p-3 shadow-sm md:p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-headline-md md:text-headline-xl font-bold text-on-surface">
              {category.title}
            </h2>
            <p className="mt-1 text-label-md md:text-body-md text-secondary">
              {category.description}
            </p>
          </div>

          <a
            href={category.viewAllHref}
            className="hidden shrink-0 rounded-full border border-outline-variant px-4 py-2 text-label-md font-semibold text-primary transition-colors hover:bg-primary hover:text-on-primary md:inline-flex"
          >
            Xem tất cả
          </a>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation]}
            spaceBetween={12}
            slidesPerGroup={1}
            navigation={{
              prevEl: `.${prevClass}`,
              nextEl: `.${nextClass}`,
            }}
            breakpoints={{
              0: {
                slidesPerView: 2.05,
                spaceBetween: 8,
              },
              640: {
                slidesPerView: 3,
                spaceBetween: 12,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 14,
              },
              1280: {
                slidesPerView: 5,
                spaceBetween: 16,
              },
            }}
            className="!pb-2 !pt-4 !px-1"
            
          >
            {category.products.map((product) => (
              <SwiperSlide key={product.id} className="h-auto">
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            type="button"
            aria-label={`Sản phẩm trước trong ${category.title}`}
            className={`${prevClass} absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-surface-container-high bg-white/95 text-on-surface opacity-0 pointer-events-none shadow-md transition-all duration-300 hover:scale-105 hover:bg-white group-hover:opacity-100 group-hover:pointer-events-auto disabled:opacity-0`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            type="button"
            aria-label={`Sản phẩm sau trong ${category.title}`}
            className={`${nextClass} absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-surface-container-high bg-white/95 text-on-surface opacity-0 pointer-events-none shadow-md transition-all duration-300 hover:scale-105 hover:bg-white group-hover:opacity-100 group-hover:pointer-events-auto disabled:opacity-0`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <a
          href={category.viewAllHref}
          className="mt-4 flex w-full items-center justify-center rounded-full border border-outline-variant px-4 py-2 text-label-md font-semibold text-primary transition-colors hover:bg-primary hover:text-on-primary md:hidden"
        >
          Xem tất cả {category.title}
        </a>
      </div>
    </section>
  );
}

export default function ProductShowcase() {
  return (
    <div>
      {productCategories.map((category) => (
        <ProductCategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}