"use client";

import { useEffect, useRef, useState } from "react";

import { getAvailableVouchers } from "@/services/voucher.service";
import type { CustomerVoucher } from "@/types/voucher.type";
import { formatPrice } from "@/utils/format-price";

export type VoucherApplyResult = {
  success: boolean;
  message?: string;
};

type VoucherPickerProps = {
  open: boolean;
  accessToken: string;
  isApplying: boolean;
  onApply: (code: string) => Promise<VoucherApplyResult>;
  onClose: () => void;
};

function formatDiscount(voucher: CustomerVoucher) {
  const discountType = voucher.discountType.toLowerCase();

  if (["percent", "percentage"].includes(discountType)) {
    return `Giảm ${new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 2,
    }).format(voucher.discountValue)}%`;
  }

  if (["fixed", "amount"].includes(discountType)) {
    return `Giảm ${formatPrice(voucher.discountValue)}`;
  }

  return `Ưu đãi ${formatPrice(voucher.discountValue)}`;
}

function formatExpiryDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function VoucherPicker({
  open,
  accessToken,
  isApplying,
  onApply,
  onClose,
}: VoucherPickerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [failedCode, setFailedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCancelled = false;

    async function loadVouchers() {
      try {
        setIsLoading(true);
        setLoadError(null);
        setApplyError(null);
        setFailedCode(null);

        const data = await getAvailableVouchers(accessToken);

        if (!isCancelled) {
          setVouchers(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setVouchers([]);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách voucher."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadVouchers();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement;
    const originalOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [open, onClose]);

  async function handleApply(code: string) {
    setApplyingCode(code);
    setApplyError(null);
    setFailedCode(null);

    try {
      const result = await onApply(code);

      if (result.success) {
        onClose();
        return;
      }

      setFailedCode(code);
      setApplyError(
        result.message || "Voucher chưa áp dụng được cho đơn hàng hiện tại."
      );
    } catch {
      setFailedCode(code);
      setApplyError("Voucher chưa áp dụng được cho đơn hàng hiện tại.");
    } finally {
      setApplyingCode(null);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-120 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-picker-title"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2
              id="voucher-picker-title"
              className="text-xl font-bold text-on-surface"
            >
              Chọn voucher
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Voucher sẽ được Backend kiểm tra với giỏ hàng hiện tại khi áp dụng.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-secondary transition hover:bg-surface-container-low"
            aria-label="Đóng danh sách voucher"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-52 flex-col items-center justify-center text-center text-secondary">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                progress_activity
              </span>
              <p className="mt-3 text-sm font-medium">Đang tải voucher...</p>
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p className="font-semibold">{loadError}</p>
              <p className="mt-1">
                Bạn vẫn có thể đóng danh sách và nhập mã thủ công.
              </p>
            </div>
          ) : null}

          {!isLoading && !loadError && vouchers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant px-5 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-secondary">
                confirmation_number
              </span>
              <p className="mt-3 font-semibold text-on-surface">
                Hiện chưa có voucher khả dụng.
              </p>
            </div>
          ) : null}

          {!isLoading && !loadError && vouchers.length > 0 ? (
            <div className="space-y-4">
              {vouchers.map((voucher) => {
                const expiryDate = voucher.endDate
                  ? formatExpiryDate(voucher.endDate)
                  : null;
                const isCurrentVoucherApplying = applyingCode === voucher.code;

                return (
                  <article
                    key={voucher.voucherId}
                    className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-sm font-bold text-primary">
                            {voucher.code}
                          </span>
                          <span className="font-bold text-on-surface">
                            {formatDiscount(voucher)}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-secondary">
                          {voucher.minOrderValue !== null ? (
                            <p>
                              Đơn tối thiểu {formatPrice(voucher.minOrderValue)}
                            </p>
                          ) : null}

                          {voucher.maxDiscountAmount !== null ? (
                            <p>
                              Giảm tối đa {formatPrice(voucher.maxDiscountAmount)}
                            </p>
                          ) : null}

                          {expiryDate ? <p>Hạn đến {expiryDate}</p> : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isApplying || !voucher.isActive}
                        onClick={() => handleApply(voucher.code)}
                        className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCurrentVoucherApplying ? "Đang áp dụng..." : "Áp dụng"}
                      </button>
                    </div>

                    {applyError && failedCode === voucher.code ? (
                      <p
                        className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
                        role="alert"
                      >
                        {applyError}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
