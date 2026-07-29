// src/components/product/ProductCard.tsx
"use client";

import type { MouseEvent } from "react";
import Link from "next/link";

import FavoriteButton from "@/components/favorite/FavoriteButton";
import { useCompareStore } from "@/store/compare.store";
import type { ProductCardItem } from "@/types/product.type";

type ProductCardProps = {
  product: ProductCardItem;
  showOptions?: boolean;
  showCompare?: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

const colorClassMap: Record<string, string> = {
  Đen: "bg-inverse-surface",
  Trắng: "bg-surface-container-lowest",
  Xanh: "bg-tertiary-container",
  Hồng: "bg-primary-fixed",
  Tím: "bg-primary-fixed-dim",
  Vàng: "bg-tertiary-fixed-dim",
  "Titan Tự Nhiên": "bg-secondary-container",
  "Titan Xanh": "bg-tertiary-container",
  "Titan Đen": "bg-inverse-surface",
  Midnight: "bg-inverse-surface",
  Starlight: "bg-secondary-container",
  Silver: "bg-surface-container-high",

  black: "bg-inverse-surface",
  white: "bg-surface-container-lowest",
  blue: "bg-tertiary-container",
  pink: "bg-primary-fixed",
  purple: "bg-primary-fixed-dim",
  yellow: "bg-tertiary-fixed-dim",
  natural: "bg-secondary-container",
};

function getColorClass(color: string) {
  return colorClassMap[color] ?? "bg-surface-container-high";
}

export default function ProductCard({
  product,
  showOptions = false,
  showCompare = false,
}: ProductCardProps) {
  const addToCompare = useCompareStore((state) => state.addToCompare);
  const removeFromCompare = useCompareStore((state) => state.removeFromCompare);
  const isCompared = useCompareStore((state) => state.isCompared(product.id));

  const productImage = product.image || "/sale/flash-sale-1.webp";
  const productHref = `/${product.categorySlug}/${product.slug}`;

  function handleCompareClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isCompared) {
      removeFromCompare(product.id);
      return;
    }

    addToCompare({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: productImage,
      price: product.price,
      categorySlug: product.categorySlug,
      categoryName: product.categoryName,
    });
  }

  return (
    <article className="group/product relative h-full rounded-xl border border-surface-container-high bg-surface-container-lowest transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      {product.discountLabel ? (
        <div
          title={product.discountLabel}
          className="absolute -left-0.8 -top-3 z-30 flex h-8.5 w-21.5 items-center justify-center bg-contain bg-center bg-no-repeat text-[10px] font-semibold text-white drop-shadow-sm"
          style={{
            backgroundImage:
              "url('/products/discount/discount-badge-ui-2025.webp')",
          }}
        >
          <span className="max-w-15.5 truncate">
            {product.discountLabel}
          </span>
        </div>
      ) : null}

      {product.installment ? (
        <div
          title={product.installment}
          className="absolute -right-1 top-0 z-30 flex h-8.5 w-21.5 items-center justify-center bg-contain bg-center bg-no-repeat text-[10px] font-semibold text-sky-500 drop-shadow-sm"
          style={{
            backgroundImage:
              "url('/products/discount/zero-ins-badge-ui-2025.webp')",
          }}
        >
          <span className="max-w-15.5 truncate">{product.installment}</span>
        </div>
      ) : null}

      <Link
        href={productHref}
        title={product.name}
        className="flex h-full flex-col"
      >
        <div className="relative p-4 pt-9">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-white">
            <img
              src={productImage}
              alt={product.name}
              className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover/product:scale-105"
              onError={(event) => {
                event.currentTarget.src = "/sale/flash-sale-1.webp";
              }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3 pb-12">
          <h3
            title={product.name}
            className="line-clamp-2 min-h-11 text-label-md font-semibold text-on-surface md:text-body-md"
          >
            {product.name}
          </h3>

          <div className="mt-2 min-h-11">
            {product.oldPrice ? (
              <p className="text-label-sm text-secondary line-through">
                {formatPrice(product.oldPrice)}
              </p>
            ) : null}

            <p className="text-body-md font-bold text-primary">
              {formatPrice(product.price)}
            </p>
            <p className="mt-1 text-xs font-medium text-secondary">
              Đã bán: {product.sold ?? 0}
            </p>
            <p
              className={[
                "mt-1 text-xs font-semibold",
                product.stockStatus === "in-stock"
                  ? "text-green-700"
                  : "text-error",
              ].join(" ")}
            >
              {product.stockStatus === "in-stock" ? "Còn hàng" : "Hết hàng"}
            </p>
          </div>

          {showOptions ? (
            <div className="mt-3 space-y-3 border-t border-surface-container-high pt-3">
              {product.colors.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {product.colors.slice(0, 5).map((color) => (
                    <span
                      key={color}
                      title={color}
                      className={[
                        "h-4 w-4 rounded-full border border-outline-variant shadow-sm",
                        getColorClass(color),
                      ].join(" ")}
                    />
                  ))}
                </div>
              ) : null}

              {product.capacities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.capacities.slice(0, 4).map((capacity, index) => {
                    const active = index === 0;

                    return (
                      <span
                        key={capacity}
                        className={[
                          "rounded-lg border px-2.5 py-1 text-[11px] font-semibold",
                          active
                            ? "border-primary bg-primary-fixed text-primary"
                            : "border-outline-variant bg-surface text-on-surface",
                        ].join(" ")}
                      >
                        {capacity}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 min-h-21 space-y-1">
            {product.promotions?.slice(0, 3).map((promotion, index) => (
              <p
                key={`${product.id}-promotion-${index}`}
                title={promotion}
                className={[
                  "h-6 truncate rounded-md px-2 py-1 text-[11px] font-medium leading-4",
                  index === 0
                    ? "bg-blue-100 text-blue-700"
                    : index === 1
                      ? "bg-violet-100 text-violet-700"
                      : "bg-surface-container text-on-surface",
                ].join(" ")}
              >
                {promotion}
              </p>
            ))}
          </div>

          {showCompare ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleCompareClick}
                className={[
                  "inline-flex items-center gap-1 text-label-md font-semibold transition hover:opacity-80",
                  isCompared ? "text-primary" : "text-blue-600",
                ].join(" ")}
              >
                <span>{isCompared ? "✓" : "+"}</span>
                <span>
                  {isCompared ? "Đã thêm so sánh" : "Thêm vào so sánh"}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </Link>

      <FavoriteButton
        productId={product.id}
        productName={product.name}
        className="absolute bottom-3 right-3 z-20"
      />
    </article>
  );
}
