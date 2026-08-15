// src/components/home/Product.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import ProductCard from "@/components/product/ProductCard";
import {
  SkeletonBox,
  SkeletonLine,
} from "@/components/common/loading/Skeleton";
import {
  MAIN_CATEGORIES,
  type MainCategory,
} from "@/config/navigation";
import { getProducts } from "@/services/product.service";

import type { ProductCardItem } from "@/types/product.type";

import "swiper/css";
import "swiper/css/navigation";

// đinh nghĩa cấu hình cho từng danh mục sản phẩm trên trang chủ
type HomeProductCategoryConfig = {
  id: string;
  title: string;
  description: string;
  categorySlug: string;
  viewAllHref: string;
  limit: number;
};
// đinh nghĩa cấu trúc dữ liệu cho từng danh mục sản phẩm trên trang chủ
type HomeProductSection = HomeProductCategoryConfig & {
  products: ProductCardItem[];
};
const HOME_CATEGORY_DESCRIPTIONS: Record<MainCategory["slug"], string> = {
  iphone: "Các mẫu iPhone chính hãng, giá tốt",
  macbook: "MacBook Air, MacBook Pro hiệu năng cao",
  ipad: "iPad học tập, làm việc và giải trí",
  "apple-watch": "Đồng hồ Apple Watch chính hãng",
  camera: "Camera và thiết bị ghi hình chính hãng",
  "am-thanh": "Thiết bị âm thanh chất lượng cao",
  imac: "iMac mạnh mẽ cho công việc và sáng tạo",
  "phu-kien": "Phụ kiện chính hãng cho các sản phẩm Apple",
};

const HOME_PRODUCT_CATEGORIES: HomeProductCategoryConfig[] =
  MAIN_CATEGORIES.map((category) => ({
    id: category.slug,
    title: category.name,
    description: HOME_CATEGORY_DESCRIPTIONS[category.slug],
    categorySlug: category.slug,
    viewAllHref: `/${category.slug}`,
    limit: 8,
  }));

function ProductSectionsSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div
          key={sectionIndex}
          className="mb-6 rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <SkeletonLine className="h-7 w-32" />
              <SkeletonLine className="mt-2 h-4 w-56 max-w-full" />
            </div>

            <SkeletonBox className="h-9 w-24 rounded-full" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-surface-container-high bg-white p-3"
              >
                <SkeletonBox className="aspect-square w-full rounded-xl" />
                <SkeletonLine className="mt-4 h-5 w-4/5" />
                <SkeletonLine className="mt-2 h-4 w-2/3" />
                <SkeletonLine className="mt-3 h-6 w-28" />
                <SkeletonBox className="mt-4 h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Product() {
  const [sections, setSections] = useState<HomeProductSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeProducts() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const results = await Promise.allSettled(
          HOME_PRODUCT_CATEGORIES.map(async (category) => {
            const data = await getProducts(
              {
                categorySlug: category.categorySlug,
                page: 1,
                limit: category.limit,
                sort: "newest",
              },
              { signal: controller.signal },
            );

            return {
              ...category,
              products: data.items,
            };
          }),
        );

        if (controller.signal.aborted) return;

        const successfulSections = results.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );

        setSections(
          successfulSections.filter((section) => section.products.length > 0),
        );

        if (successfulSections.length === 0) {
          setErrorMessage("Không thể tải sản phẩm trang chủ.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải sản phẩm trang chủ."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadHomeProducts();

    return () => {
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return <ProductSectionsSkeleton />;
  }

  if (errorMessage) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {errorMessage}
        </div>
      </section>
    );
  }

  if (sections.length === 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-surface-container-high bg-white px-5 py-6 text-center text-sm text-secondary shadow-sm">
          Chưa có sản phẩm để hiển thị.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-[80%]  px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="overflow-hidden rounded-2xl border border-surface-container-high bg-white shadow-sm"
          >
            <div className="flex items-center justify-between gap-4 border-b border-surface-container-high px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-on-surface sm:text-2xl">
                  {section.title}
                </h2>

                <p className="mt-1 line-clamp-1 text-sm text-secondary">
                  {section.description}
                </p>
              </div>

              <Link
                href={section.viewAllHref}
                className="shrink-0 rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-on-primary"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={16}
                slidesPerView={1.15}
                breakpoints={{
                  480: {
                    slidesPerView: 1.6,
                  },
                  640: {
                    slidesPerView: 2.2,
                  },
                  768: {
                    slidesPerView: 3,
                  },
                  1024: {
                    slidesPerView: 4,
                  },
                }}
                className="overflow-visible!"
              >
                {section.products.map((product) => (
                  <SwiperSlide key={product.id} className="h-auto!">
                    <div className="h-full">
                      <ProductCard product={product} showCompare />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
