"use client";

import type { ProductCardItem } from "@/types/product.type";
import ProductCard from "@/components/product/ProductCard";

import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

type RelatedProductsProps = {
  products: ProductCardItem[];
};

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">
            Sản phẩm liên quan
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Một số sản phẩm cùng danh mục có thể bạn quan tâm.
          </p>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            className="related-products-prev flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface transition hover:border-primary hover:bg-primary hover:text-on-primary"
            aria-label="Xem sản phẩm trước"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <button
            type="button"
            className="related-products-next flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface transition hover:border-primary hover:bg-primary hover:text-on-primary"
            aria-label="Xem sản phẩm tiếp theo"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        spaceBetween={16}
        navigation={{
          prevEl: ".related-products-prev",
          nextEl: ".related-products-next",
        }}
        className="pt-4! pb-2!"
        breakpoints={{
          0: {
            slidesPerView: 1.15,
          },
          640: {
            slidesPerView: 2.1,
          },
          1024: {
            slidesPerView: 3,
          },
          1280: {
            slidesPerView: 4,
          },
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="h-auto">
            <div className="h-full pb-1">
              <ProductCard
                product={product}
                showOptions
                showCompare
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}