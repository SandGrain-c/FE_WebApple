"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/store/auth.store";
import { useFavoriteStore } from "@/store/favorite.store";
import type { FavoriteProductItem } from "@/types/favorite.type";

function formatPrice(price: number | null) {
  if (price === null) {
    return "Liên hệ";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

function getProductHref(item: FavoriteProductItem) {
  return `/${item.categorySlug}/${item.slug}`;
}

function getStockLabel(item: FavoriteProductItem) {
  if (item.stockStatus === "out-of-stock" || item.stockQuantity <= 0) {
    return "Hết hàng";
  }

  return `Còn ${item.stockQuantity} sản phẩm`;
}

function getStockClass(item: FavoriteProductItem) {
  if (item.stockStatus === "out-of-stock" || item.stockQuantity <= 0) {
    return "bg-red-50 text-red-600";
  }

  return "bg-green-50 text-green-700";
}

type FavoriteProductCardProps = {
  item: FavoriteProductItem;
  isRemoving: boolean;
  onRemove: (productId: number) => void;
};

function FavoriteProductCard({
  item,
  isRemoving,
  onRemove,
}: FavoriteProductCardProps) {
  const productHref = getProductHref(item);
  const productImage = item.image || "/sale/flash-sale-1.webp";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-surface-container-high bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {item.discountLabel ? (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">
          {item.discountLabel}
        </div>
      ) : null}

      <Link href={productHref} className="block">
        <div className="aspect-square bg-surface-container-lowest p-5">
          <img
            src={productImage}
            alt={item.name}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = "/sale/flash-sale-1.webp";
            }}
          />
        </div>
      </Link>

      <div className="p-4">
        <Link
          href={productHref}
          title={item.name}
          className="line-clamp-2 min-h-11 font-semibold text-on-surface transition hover:text-primary"
        >
          {item.name}
        </Link>

        <p className="mt-1 text-sm text-secondary">{item.categoryName}</p>

        <div className="mt-3 min-h-12">
          {item.oldPrice ? (
            <p className="text-sm text-secondary line-through">
              {formatPrice(item.oldPrice)}
            </p>
          ) : null}

          <p className="text-lg font-bold text-primary">
            {formatPrice(item.price)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStockClass(
              item
            )}`}
          >
            {getStockLabel(item)}
          </span>

          {item.installment ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {item.installment}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={productHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            Xem chi tiết
          </Link>

          <button
            type="button"
            disabled={isRemoving}
            onClick={() => onRemove(item.productId)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRemoving ? (
              <span className="material-symbols-outlined animate-spin text-lg">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-lg">
                favorite
              </span>
            )}
            Bỏ
          </button>
        </div>
      </div>
    </article>
  );
}

export default function FavoritePageClient() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const items = useFavoriteStore((state) => state.items);
  const isFetching = useFavoriteStore((state) => state.isFetching);
  const error = useFavoriteStore((state) => state.error);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);
  const removeFavorite = useFavoriteStore((state) => state.removeFavorite);
  const resetFavorites = useFavoriteStore((state) => state.resetFavorites);

  const [message, setMessage] = useState<string | null>(null);
  const [removingProductId, setRemovingProductId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!isAuthenticated) {
      resetFavorites();
      return;
    }

    fetchFavorites(true);
  }, [isAuthenticated, fetchFavorites, resetFavorites]);

  async function handleRefresh() {
    setMessage(null);
    await fetchFavorites(true);
  }

  async function handleRemoveFavorite(productId: number) {
    try {
      setRemovingProductId(productId);
      setMessage(null);

      const result = await removeFavorite(productId);

      setMessage(result.message);
    } finally {
      setRemovingProductId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="bg-surface-container-lowest">
        <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-surface-container-high bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-4xl">
                favorite
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-on-surface">
              Bạn cần đăng nhập
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-secondary">
              Đăng nhập để xem và quản lý danh sách sản phẩm yêu thích của bạn.
            </p>

            <Link
              href="/login?redirect=/favorites"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-surface-container-lowest">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-secondary">
              <Link href="/" className="hover:text-primary">
                Trang chủ
              </Link>{" "}
              / Sản phẩm yêu thích
            </p>

            <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Sản phẩm yêu thích
            </h1>

            <p className="mt-2 text-sm leading-6 text-secondary">
              Danh sách các sản phẩm bạn đã lưu để xem lại hoặc mua sau.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-xl ${
                isFetching ? "animate-spin" : ""
              }`}
            >
              {isFetching ? "progress_activity" : "refresh"}
            </span>
            Làm mới
          </button>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <p className="text-sm text-secondary">Tổng yêu thích</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {items.length}
            </p>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <p className="text-sm text-secondary">Còn hàng</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                items.filter(
                  (item) =>
                    item.stockStatus === "in-stock" && item.stockQuantity > 0
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <p className="text-sm text-secondary">Hết hàng</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {
                items.filter(
                  (item) =>
                    item.stockStatus === "out-of-stock" ||
                    item.stockQuantity <= 0
                ).length
              }
            </p>
          </div>
        </div>

        {message ? (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isFetching && items.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[28px] border border-surface-container-high bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest text-secondary">
              <span className="material-symbols-outlined text-4xl">
                heart_broken
              </span>
            </div>

            <h2 className="mt-5 text-xl font-bold text-on-surface">
              Chưa có sản phẩm yêu thích
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-secondary">
              Hãy bấm biểu tượng trái tim ở sản phẩm bạn quan tâm để lưu lại vào
              danh sách yêu thích.
            </p>

            <Link
              href="/iphone"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <FavoriteProductCard
                key={item.favoriteId || item.productId}
                item={item}
                isRemoving={removingProductId === item.productId}
                onRemove={handleRemoveFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}