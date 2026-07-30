"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { RecentlyViewedProduct } from "@/types/recently-viewed.type";
import { getRecentlyViewedProducts } from "@/utils/recently-viewed-products";

import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

type RecentlyViewedProductsProps = {
  title?: string;
  className?: string;
  currentProductId?: number | string;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("vi-VN")}₫`;
}

function RecentlyViewedCard({ product }: { product: RecentlyViewedProduct }) {
  return (
    <Link
      href={`/${product.categorySlug}/${product.slug}`}
      className="group flex h-full min-h-24 items-center gap-3 rounded-2xl border border-surface-container-high bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-lowest">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain p-1.5 transition duration-300 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.src =
              "https://placehold.co/200x200/png?text=No+Image";
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-on-surface">
          {product.name}
        </h3>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-bold text-primary">
            {formatPrice(product.price)}
          </span>

          {product.oldPrice ? (
            <span className="text-xs text-secondary line-through">
              {formatPrice(product.oldPrice)}
            </span>
          ) : null}

          {product.discountPercent ? (
            <span className="text-xs font-semibold text-primary">
              -{product.discountPercent}%
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function RecentlyViewedProducts({
  title = "Sản phẩm đã xem",
  className = "",
  currentProductId,
}: RecentlyViewedProductsProps) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    function loadProducts() {
      setProducts(getRecentlyViewedProducts());
    }

    loadProducts();

    window.addEventListener("pageshow", loadProducts);
    window.addEventListener("focus", loadProducts);
    window.addEventListener("recently-viewed-products-updated", loadProducts);

    return () => {
      window.removeEventListener("pageshow", loadProducts);
      window.removeEventListener("focus", loadProducts);
      window.removeEventListener(
        "recently-viewed-products-updated",
        loadProducts
      );
    };
  }, []);

  const displayedProducts = useMemo(() => {
    if (!currentProductId) {
      return products;
    }

    return products.filter(
      (product) => String(product.id) !== String(currentProductId)
    );
  }, [products, currentProductId]);

  if (displayedProducts.length === 0) {
    return null;
  }

  return (
    <section
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="group rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
            <p className="mt-1 text-sm text-secondary">
              Những sản phẩm bạn đã xem gần đây.
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Xem sản phẩm trước"
              className="recently-viewed-prev flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface transition hover:border-primary hover:bg-primary hover:text-on-primary"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              type="button"
              aria-label="Xem sản phẩm tiếp theo"
              className="recently-viewed-next flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface transition hover:border-primary hover:bg-primary hover:text-on-primary"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <Swiper
          modules={[Navigation]}
          spaceBetween={12}
          navigation={{
            prevEl: ".recently-viewed-prev",
            nextEl: ".recently-viewed-next",
          }}
          className="py-1!"
          breakpoints={{
            0: {
              slidesPerView: 1.15,
            },
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
            1280: {
              slidesPerView: 4,
            },
          }}
        >
          {displayedProducts.map((product) => (
            <SwiperSlide key={product.id} className="h-auto">
              <div className="h-full">
                <RecentlyViewedCard product={product} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}