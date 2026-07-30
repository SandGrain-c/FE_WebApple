"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ProductSpecificationGroup,
  ProductSpecificationItem,
} from "@/types/product-detail.type";

type ProductSpecificationsProps = {
  specifications: ProductSpecificationGroup[];
  previewLimit?: number;
};

type FlattenSpecificationItem = ProductSpecificationItem & {
  groupName: string;
};

export default function ProductSpecifications({
  specifications,
  previewLimit = 6,
}: ProductSpecificationsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const flatSpecifications = useMemo<FlattenSpecificationItem[]>(() => {
    return specifications.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupName: group.groupName,
      }))
    );
  }, [specifications]);

  const previewItems = flatSpecifications.slice(0, previewLimit);
  const canOpenModal = flatSpecifications.length > previewLimit;

  useEffect(() => {
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  if (!specifications || specifications.length === 0) {
    return null;
  }

  return (
    <>
      <section className="rounded-2xl border border-surface-container-high  p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-on-surface">
              Thông số kỹ thuật
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Các thông tin cấu hình chính của sản phẩm.
            </p>
          </div>

          {canOpenModal ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition hover:opacity-80"
            >
              Xem tất cả
              <span className="material-symbols-outlined text-xl">
                chevron_right
              </span>
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-outline-variant">
          <div className="divide-y divide-outline-variant">
            {previewItems.map((item) => (
              <div
                key={`${item.groupName}-${item.label}`}
                className="grid grid-cols-[42%_1fr] text-sm sm:grid-cols-[240px_1fr]"
              >
                <div className="border-r border-outline-variant bg-surface-container-lowest px-4 py-3 font-medium text-secondary">
                  {item.label}
                </div>

                <div className="px-4 py-3 text-on-surface">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Thông số kỹ thuật đầy đủ"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
              <h2 className="text-xl font-semibold text-on-surface">
                Thông số kỹ thuật
              </h2>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Đóng thông số kỹ thuật"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface transition hover:bg-primary hover:text-on-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5">
              <div className="space-y-6">
                {specifications.map((group) => (
                  <section key={group.groupName}>
                    <h3 className="mb-3 text-lg font-semibold text-on-surface">
                      {group.groupName}
                    </h3>

                    <div className="overflow-hidden rounded-2xl border border-outline-variant">
                      <div className="divide-y divide-outline-variant">
                        {group.items.map((item) => (
                          <div
                            key={`${group.groupName}-${item.label}`}
                            className="grid grid-cols-[42%_1fr] text-sm sm:grid-cols-[240px_1fr]"
                          >
                            <div className="border-r border-outline-variant bg-surface-container-lowest px-4 py-3 font-medium text-secondary">
                              {item.label}
                            </div>

                            <div className="px-4 py-3 leading-6 text-on-surface">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}