"use client";

import Link from "next/link";
import type { CartItem } from "@/types/cart.type";

type CartItemCardProps = {
  item: CartItem;
  isSelected: boolean;
  isLoading?: boolean;

  onToggleSelect: (cartItemId: number, selected: boolean) => void;

  onDecrease: (cartItemId: number, currentQuantity: number) => void;
  onIncrease: (
    cartItemId: number,
    currentQuantity: number,
    stockQuantity: number
  ) => void;
  onRemove: (cartItemId: number) => void;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("vi-VN")}₫`;
}

function getProductHref(item: CartItem) {
  if (!item.categorySlug || !item.slug) {
    return "/";
  }

  return `/${item.categorySlug}/${item.slug}`;
}

export default function CartItemCard({
  item,
  isSelected,
  isLoading = false,
  onToggleSelect,
  onDecrease,
  onIncrease,
  onRemove,
}: CartItemCardProps) {
  const productHref = getProductHref(item);

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        isSelected
          ? "border-primary/40 ring-1 ring-primary/10"
          : "border-surface-container-high"
      }`}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) =>
              onToggleSelect(item.cartItemId, event.target.checked)
            }
            disabled={isLoading}
            className="h-5 w-5 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Chọn ${item.name}`}
          />
        </div>

        <Link
          href={productHref}
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-lowest sm:h-28 sm:w-28"
        >
          <img
            src={item.image || "/images/product-placeholder.png"}
            alt={item.name || "Sản phẩm"}
            className="h-full w-full object-contain p-2 transition duration-300 hover:scale-105"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href={productHref}
                className="line-clamp-2 font-semibold text-on-surface transition hover:text-primary"
              >
                {item.name}
              </Link>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {item.color ? (
                  <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-secondary">
                    Màu: {item.color}
                  </span>
                ) : null}

                {item.capacity ? (
                  <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-secondary">
                    {item.capacity}
                  </span>
                ) : null}

                {item.ram ? (
                  <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-secondary">
                    RAM {item.ram}
                  </span>
                ) : null}
              </div>

              {item.sku ? (
                <p className="mt-2 text-xs text-secondary">SKU: {item.sku}</p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => onRemove(item.cartItemId)}
              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">close</span>
              Xóa
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-bold text-primary">
                {formatPrice(item.price)}
              </p>

              {item.oldPrice ? (
                <p className="text-sm text-secondary line-through">
                  {formatPrice(item.oldPrice)}
                </p>
              ) : null}

              <p className="mt-1 text-xs text-secondary">
                Còn {item.stockQuantity} sản phẩm
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || item.quantity <= 1}
                onClick={() => onDecrease(item.cartItemId, item.quantity)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Giảm số lượng"
              >
                <span className="material-symbols-outlined text-lg">
                  remove
                </span>
              </button>

              <div className="flex h-9 min-w-12 items-center justify-center rounded-lg border border-outline-variant px-3 text-sm font-semibold text-on-surface">
                {item.quantity}
              </div>

              <button
                type="button"
                disabled={isLoading || item.quantity >= item.stockQuantity}
                onClick={() =>
                  onIncrease(item.cartItemId, item.quantity, item.stockQuantity)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Tăng số lượng"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}