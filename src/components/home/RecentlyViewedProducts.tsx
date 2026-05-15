'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

export type RecentlyViewedProduct = {
  id: number | string;
  name: string;
  slug: string;
  image: string;
  oldPrice?: number;
  price: number;
  discountPercent?: number;
};

const RECENTLY_VIEWED_KEY = 'recently_viewed_products';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

export const saveRecentlyViewedProduct = (product: RecentlyViewedProduct) => {
  if (typeof window === 'undefined') return;

  try {
    const currentData = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const currentProducts: RecentlyViewedProduct[] = currentData
      ? JSON.parse(currentData)
      : [];

    const filteredProducts = currentProducts.filter(
      (item) => String(item.id) !== String(product.id),
    );

    const newProducts = [product, ...filteredProducts].slice(0, 12);

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(newProducts));
  } catch (error) {
    console.error('Lỗi khi lưu sản phẩm đã xem:', error);
  }
};

function RecentlyViewedCard({ product }: { product: RecentlyViewedProduct }) {
  return (
    <a
      href={product.slug}
      title={product.name}
      className="group/card flex h-full min-h-\[94px] items-center gap-3 rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover/card:scale-105"
          onError={(event) => {
            event.currentTarget.src = '/sale/flash-sale-1.webp';
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 min-h-\[40px] text-label-md font-semibold leading-5 text-on-surface">
          {product.name}
        </h3>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-body-md font-bold text-primary">
            {formatPrice(product.price)}
          </span>

          {product.oldPrice && (
            <span className="text-label-sm text-secondary line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}

          {product.discountPercent && (
            <span className="text-label-sm font-semibold text-primary">
              -{product.discountPercent}%
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export default function RecentlyViewedProducts() {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
  const loadRecentlyViewedProducts = () => {
    try {
      const data = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const viewedProducts: RecentlyViewedProduct[] = data
        ? JSON.parse(data)
        : [];

      setProducts(viewedProducts);
    } catch (error) {
      console.error('Lỗi khi đọc sản phẩm đã xem:', error);
      setProducts([]);
    }
  };

  loadRecentlyViewedProducts();

  window.addEventListener('pageshow', loadRecentlyViewedProducts);
  window.addEventListener('focus', loadRecentlyViewedProducts);

  return () => {
    window.removeEventListener('pageshow', loadRecentlyViewedProducts);
    window.removeEventListener('focus', loadRecentlyViewedProducts);
  };
  }, []);

  return (
    <section className="container mx-auto mt-8 px-3 md:px-5">
      <div className="group relative overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest p-3 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-headline-md md:text-headline-xl font-bold text-on-surface">
            Sản phẩm đã xem
          </h2>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation]}
            spaceBetween={12}
            slidesPerGroup={1}
            navigation={{
              prevEl: '.recently-viewed-prev',
              nextEl: '.recently-viewed-next',
            }}
            breakpoints={{
              0: {
                slidesPerView: 1.15,
                spaceBetween: 10,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 12,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 14,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 16,
              },
            }}
            className="!pb-1"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} className="h-auto">
                <RecentlyViewedCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            type="button"
            aria-label="Sản phẩm đã xem trước"
            className="recently-viewed-prev pointer-events-none absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-surface-container-high bg-white/95 text-on-surface opacity-0 shadow-md transition-all duration-300 hover:scale-105 hover:bg-white group-hover:pointer-events-auto group-hover:opacity-100 disabled:opacity-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Sản phẩm đã xem sau"
            className="recently-viewed-next pointer-events-none absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-surface-container-high bg-white/95 text-on-surface opacity-0 shadow-md transition-all duration-300 hover:scale-105 hover:bg-white group-hover:pointer-events-auto group-hover:opacity-100 disabled:opacity-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}