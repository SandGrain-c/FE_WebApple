"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import CompareEmptyState from "./CompareEmptyState";
import CompareSpecificationTable from "./CompareSpecificationTable";

import { useCompareHydration } from "@/hooks/useCompareHydration";
import { normalizeCompareSpecifications } from "@/lib/compare/normalize-specifications";
import { getProductDetail } from "@/services/product.service";
import { useCompareStore } from "@/store/compare.store";
import { useToastStore } from "@/store/toast.store";
import type { CompareProductResult } from "@/types/compare.type";

type CompareLoadState = {
  selectionKey: string;
  results: CompareProductResult[];
};

function buildSelectionKey(items: Array<{ id: number; slug: string }>) {
  return items.map((item) => `${item.id}:${item.slug}`).join("|");
}

export default function ComparePageClient() {
  const hasHydrated = useCompareHydration();
  const items = useCompareStore((state) => state.items);
  const removeFromCompare = useCompareStore((state) => state.removeFromCompare);
  const clearCompare = useCompareStore((state) => state.clearCompare);
  const showToast = useToastStore((state) => state.showToast);

  const selectionKey = buildSelectionKey(items);
  const [loadState, setLoadState] = useState<CompareLoadState>({
    selectionKey: "",
    results: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      await Promise.resolve();

      if (!hasHydrated || controller.signal.aborted) return;

      if (items.length === 0) {
        setLoadState({ selectionKey, results: [] });
        return;
      }

      const settledProducts = await Promise.allSettled(
        items.map(async (item) => {
          const response = await getProductDetail(
            item.categorySlug,
            item.slug,
            { signal: controller.signal },
          );

          if (!response?.product || response.product.id !== item.id) {
            throw new Error("Sản phẩm không còn tồn tại hoặc đã ngừng bán.");
          }

          return response.product;
        }),
      );

      if (controller.signal.aborted) return;

      const results = settledProducts.map<CompareProductResult>(
        (settledProduct, index) => {
          const item = items[index];

          if (settledProduct.status === "fulfilled") {
            return {
              item,
              product: settledProduct.value,
              error: null,
            };
          }

          return {
            item,
            product: null,
            error:
              settledProduct.reason instanceof Error
                ? settledProduct.reason.message
                : "Không thể tải dữ liệu sản phẩm.",
          };
        },
      );

      setLoadState({ selectionKey, results });
    }

    void loadProducts();

    return () => controller.abort();
  }, [hasHydrated, items, selectionKey]);

  const isLoading =
    !hasHydrated ||
    (items.length > 0 && loadState.selectionKey !== selectionKey);
  const results = useMemo(
    () =>
      loadState.selectionKey === selectionKey ? loadState.results : [],
    [loadState.results, loadState.selectionKey, selectionKey],
  );
  const specificationGroups = useMemo(
    () =>
      normalizeCompareSpecifications(
        results.flatMap((result) =>
          result.product ? [result.product] : [],
        ),
      ),
    [results],
  );

  function handleRemove(productId: number, productName: string) {
    removeFromCompare(productId);
    showToast({
      type: "success",
      message: `Đã xóa ${productName} khỏi danh sách so sánh.`,
    });
  }

  function handleClear() {
    clearCompare();
    showToast({
      type: "success",
      message: "Đã xóa toàn bộ danh sách so sánh.",
    });
  }

  return (
    <main className="bg-surface py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-secondary">
          <Link href="/" className="transition hover:text-primary">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-on-surface">So sánh sản phẩm</span>
        </nav>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">
              So sánh sản phẩm
            </h1>
            <p className="mt-2 text-sm text-secondary">
              {items.length > 0
                ? `${items.length} sản phẩm cùng danh mục đang được so sánh.`
                : "Chọn sản phẩm để xem thông tin cạnh nhau."}
            </p>
          </div>

          {hasHydrated && items.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-error/40 px-4 py-2.5 text-sm font-semibold text-error transition hover:bg-error/5"
            >
              <span className="material-symbols-outlined text-xl">delete</span>
              Xóa tất cả
            </button>
          ) : null}
        </div>

        <div className="mt-7">
          {isLoading ? <ComparePageSkeleton /> : null}
          {!isLoading && items.length === 0 ? <CompareEmptyState /> : null}
          {!isLoading && items.length > 0 && results.length > 0 ? (
            <CompareSpecificationTable
              results={results}
              specificationGroups={specificationGroups}
              onRemove={handleRemove}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function ComparePageSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm"
      aria-label="Đang tải dữ liệu so sánh"
    >
      <div className="grid min-w-180 grid-cols-[208px_repeat(2,272px)] gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-xl bg-surface-container"
          />
        ))}
      </div>
    </div>
  );
}
