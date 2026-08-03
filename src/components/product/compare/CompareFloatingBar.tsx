"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCompareHydration } from "@/hooks/useCompareHydration";
import { useCompareStore } from "@/store/compare.store";
import { MAX_COMPARE_ITEMS } from "@/store/compare.store";
import { COMPARE_ROUTE } from "@/lib/compare/compare-route";

type MaterialIconProps = {
  name: string;
  className?: string;
};

function MaterialIcon({ name, className = "" }: MaterialIconProps) {
  return (
    <span
      className={["material-symbols-outlined select-none", className].join(" ")}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export default function CompareFloatingBar() {
  const [isOpen, setIsOpen] = useState(false);
  const hasHydrated = useCompareHydration();

  const items = useCompareStore((state) => state.items);
  const removeFromCompare = useCompareStore((state) => state.removeFromCompare);
  const clearCompare = useCompareStore((state) => state.clearCompare);

  const totalItems = items.length;
  const currentCategorySlug = items[0]?.categorySlug;

  if (!hasHydrated || totalItems === 0) return null;

  return (
    <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-20px)] max-w-[1180px] -translate-x-1/2">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mx-auto flex items-center gap-2 rounded-t-2xl bg-neutral-900 px-5 py-2.5 text-white shadow-xl transition hover:bg-neutral-800 md:ml-auto md:mr-0"
          aria-label="Mở thanh so sánh"
        >
          <MaterialIcon name="compare_arrows" className="text-[21px]" />

          <span className="text-base font-bold leading-none">
            So sánh ({totalItems})
          </span>

          <MaterialIcon name="keyboard_arrow_up" className="text-[26px]" />
        </button>
      )}

      {isOpen && (
        <div className="rounded-2xl bg-neutral-900/95 p-2.5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex h-[58px] min-w-0 items-center gap-2 rounded-xl bg-white px-2.5"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    <Image
                      src={item.image || "/products/iphone/iphone-15-plus.png"}
                      alt={item.name}
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold leading-5 text-neutral-900">
                      {item.name}
                    </p>
                    <p className="truncate text-xs font-medium text-neutral-500">
                      {item.categoryName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCompare(item.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-red-500"
                    aria-label={`Xóa ${item.name} khỏi danh sách so sánh`}
                  >
                    <MaterialIcon name="close" className="text-[21px]" />
                  </button>
                </div>
              ))}

              {totalItems < MAX_COMPARE_ITEMS && (
                <Link
                  href={currentCategorySlug ? `/${currentCategorySlug}` : "/"}
                  className="flex h-[58px] items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <MaterialIcon name="add" className="text-[26px]" />
                  <span>Thêm sản phẩm</span>
                </Link>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              <button
                type="button"
                onClick={clearCompare}
                className="flex h-[46px] items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold text-neutral-900 transition hover:bg-neutral-100"
              >
                <MaterialIcon name="delete" className="text-[20px]" />
                <span>Xóa tất cả</span>
              </button>

              {totalItems >= 2 ? (
                <Link
                  href={COMPARE_ROUTE}
                  className="flex h-[46px] items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-center text-sm font-bold text-white transition hover:opacity-90"
                >
                  <MaterialIcon name="compare" className="text-[20px]" />
                  <span>So sánh ngay</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex h-[46px] cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-primary/45 px-4 text-center text-sm font-bold text-white opacity-60"
                >
                  <MaterialIcon name="compare" className="text-[20px]" />
                  <span>So sánh ngay</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-white/35 text-white transition hover:bg-white/10"
                aria-label="Thu gọn thanh so sánh"
              >
                <MaterialIcon
                  name="keyboard_arrow_down"
                  className="text-[30px]"
                />
              </button>
            </div>
          </div>

          {totalItems < 2 && (
            <p className="mt-2 text-center text-xs font-semibold text-white/75">
              Chọn ít nhất 2 sản phẩm để bắt đầu so sánh.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
