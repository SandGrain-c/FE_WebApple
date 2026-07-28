"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminVoucher,
  deleteAdminVoucher,
  getAdminVouchers,
  updateAdminVoucher,
} from "@/services/admin-voucher.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminVoucher,
  AdminVoucherDiscountType,
  AdminVoucherDiscountTypeFilter,
  AdminVoucherSort,
  AdminVoucherStatusFilter,
} from "@/types/admin-voucher.type";

const DEFAULT_LIMIT = 10;

const VOUCHER_DISCOUNT_TYPE_OPTIONS: {
  label: string;
  value: AdminVoucherDiscountType;
}[] = [
  {
    label: "Giảm theo %",
    value: "Percent",
  },
  {
    label: "Giảm cố định",
    value: "Fixed",
  },
];

const VOUCHER_SORT_OPTIONS: {
  label: string;
  value: AdminVoucherSort;
}[] = [
  {
    label: "Mới nhất",
    value: "newest",
  },
  {
    label: "Cũ nhất",
    value: "oldest",
  },
  {
    label: "Mã A-Z",
    value: "code_asc",
  },
  {
    label: "Mã Z-A",
    value: "code_desc",
  },
  {
    label: "Giá trị tăng dần",
    value: "value_asc",
  },
  {
    label: "Giá trị giảm dần",
    value: "value_desc",
  },
];

type VoucherFormState = {
  code: string;
  discountType: AdminVoucherDiscountType;
  discountValue: string;
  minOrderValue: string;
  maxDiscountAmount: string;
  usageLimit: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type VoucherFormErrors = {
  code?: string;
  discountValue?: string;
  minOrderValue?: string;
  maxDiscountAmount?: string;
  usageLimit?: string;
  startDate?: string;
  endDate?: string;
};

type VoucherModalMode = "create" | "edit";

type VoucherToastVariant = "success" | "error" | "info";

type VoucherToast = {
  id: number;
  variant: VoucherToastVariant;
  title: string;
  description?: string;
};

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function toIsoStringFromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

function getDefaultStartDate() {
  return toDateTimeLocalValue(new Date());
}

function getDefaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);

  return toDateTimeLocalValue(date);
}

function getEmptyVoucherFormState(): VoucherFormState {
  return {
    code: "",
    discountType: "Percent",
    discountValue: "10",
    minOrderValue: "0",
    maxDiscountAmount: "",
    usageLimit: "",
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    isActive: true,
  };
}

function mapVoucherToFormState(voucher: AdminVoucher): VoucherFormState {
  return {
    code: voucher.code || "",
    discountType: voucher.discountType || "Percent",
    discountValue: String(voucher.discountValue ?? ""),
    minOrderValue: String(voucher.minOrderValue ?? 0),
    maxDiscountAmount:
      voucher.maxDiscountAmount === null || voucher.maxDiscountAmount === undefined
        ? ""
        : String(voucher.maxDiscountAmount),
    usageLimit:
      voucher.usageLimit === null || voucher.usageLimit === undefined
        ? ""
        : String(voucher.usageLimit),
    startDate: voucher.startDate
      ? toDateTimeLocalValue(new Date(voucher.startDate))
      : getDefaultStartDate(),
    endDate: voucher.endDate
      ? toDateTimeLocalValue(new Date(voucher.endDate))
      : getDefaultEndDate(),
    isActive: voucher.isActive,
  };
}

function normalizeOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return Number(trimmedValue);
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDiscountValueText(voucher: AdminVoucher) {
  if (voucher.discountType === "Percent") {
    return `${voucher.discountValue}%`;
  }

  return formatCurrency(voucher.discountValue);
}

function isVoucherExpired(voucher: AdminVoucher) {
  return new Date(voucher.endDate).getTime() < Date.now();
}

function getVoucherStatusLabel(voucher: AdminVoucher) {
  if (!voucher.isActive) {
    return "Đã ẩn";
  }

  if (isVoucherExpired(voucher)) {
    return "Hết hạn";
  }

  return "Đang hoạt động";
}

function getVoucherStatusClass(voucher: AdminVoucher) {
  if (!voucher.isActive) {
    return "bg-red-50 text-red-700";
  }

  if (isVoucherExpired(voucher)) {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-green-50 text-green-700";
}

function getDiscountTypeLabel(type: AdminVoucherDiscountType) {
  return type === "Percent" ? "Theo %" : "Cố định";
}

function validateVoucherForm(formState: VoucherFormState): VoucherFormErrors {
  const errors: VoucherFormErrors = {};
  const code = formState.code.trim();
  const discountValue = Number(formState.discountValue);
  const minOrderValue = normalizeOptionalNumber(formState.minOrderValue);
  const maxDiscountAmount = normalizeOptionalNumber(formState.maxDiscountAmount);
  const usageLimit = normalizeOptionalNumber(formState.usageLimit);

  if (!code) {
    errors.code = "Vui lòng nhập mã voucher.";
  } else if (!/^[A-Za-z0-9_-]{3,30}$/.test(code)) {
    errors.code =
      "Mã voucher nên dài 3-30 ký tự, chỉ gồm chữ, số, dấu _ hoặc -.";
  }

  if (Number.isNaN(discountValue) || discountValue <= 0) {
    errors.discountValue = "Giá trị giảm phải lớn hơn 0.";
  }

  if (formState.discountType === "Percent" && discountValue > 100) {
    errors.discountValue = "Voucher Percent không được lớn hơn 100%.";
  }

  if (
    minOrderValue !== undefined &&
    (Number.isNaN(minOrderValue) || minOrderValue < 0)
  ) {
    errors.minOrderValue = "Giá trị đơn tối thiểu không được âm.";
  }

  if (
    maxDiscountAmount !== undefined &&
    (Number.isNaN(maxDiscountAmount) || maxDiscountAmount < 0)
  ) {
    errors.maxDiscountAmount = "Mức giảm tối đa không được âm.";
  }

  if (
    usageLimit !== undefined &&
    (!Number.isInteger(usageLimit) || usageLimit <= 0)
  ) {
    errors.usageLimit = "Giới hạn lượt dùng phải là số nguyên lớn hơn 0.";
  }

  if (!formState.startDate) {
    errors.startDate = "Vui lòng chọn ngày bắt đầu.";
  }

  if (!formState.endDate) {
    errors.endDate = "Vui lòng chọn ngày kết thúc.";
  }

  if (formState.startDate && formState.endDate) {
    const startTime = new Date(formState.startDate).getTime();
    const endTime = new Date(formState.endDate).getTime();

    if (startTime > endTime) {
      errors.endDate = "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.";
    }
  }

  return errors;
}

type VoucherToastStackProps = {
  toasts: VoucherToast[];
  onClose: (id: number) => void;
};

function VoucherToastStack({ toasts, onClose }: VoucherToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[9999] mx-auto flex max-w-[560px] flex-col gap-3 sm:top-6">
      {toasts.map((toast) => {
        const iconName =
          toast.variant === "success"
            ? "check"
            : toast.variant === "error"
              ? "close"
              : "info";

        const colorClass =
          toast.variant === "success"
            ? "border-green-400 bg-green-50 text-green-600"
            : toast.variant === "error"
              ? "border-red-400 bg-red-50 text-red-600"
              : "border-primary/40 bg-white text-primary";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] ${colorClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white">
                <span className="material-symbols-outlined text-xl">
                  {iconName}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-bold">{toast.title}</p>

                {toast.description ? (
                  <p className="mt-1 break-words text-sm leading-5 text-on-surface">
                    {toast.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface transition hover:bg-white hover:text-primary"
                aria-label="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type VoucherFormModalProps = {
  open: boolean;
  mode: VoucherModalMode;
  formState: VoucherFormState;
  errors: VoucherFormErrors;
  editingVoucher: AdminVoucher | null;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: VoucherFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function VoucherFormModal({
  open,
  mode,
  formState,
  errors,
  editingVoucher,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: VoucherFormModalProps) {
  if (!open) {
    return null;
  }

  const title = mode === "create" ? "Thêm voucher" : "Cập nhật voucher";

  const description =
    mode === "create"
      ? "Tạo mã giảm giá cho khách hàng sử dụng khi checkout."
      : `Đang sửa voucher #${editingVoucher?.voucherId || ""}`;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(96vw,860px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Voucher Form
            </p>
            <h3 className="mt-1 text-xl font-bold text-on-surface">{title}</h3>
            <p className="mt-1 text-sm text-secondary">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng form"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-[1.2fr_220px]">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Mã voucher <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={formState.code}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    code: event.target.value.toUpperCase(),
                  })
                }
                disabled={isSubmitting}
                placeholder="Ví dụ: SALE10"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm font-bold uppercase outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.code
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.code ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.code}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-secondary">
                  BE cũng sẽ chuẩn hóa mã voucher thành chữ hoa.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Loại giảm giá
              </label>

              <select
                value={formState.discountType}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    discountType: event.target.value as AdminVoucherDiscountType,
                    maxDiscountAmount:
                      event.target.value === "Fixed"
                        ? ""
                        : formState.maxDiscountAmount,
                  })
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {VOUCHER_DISCOUNT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Giá trị giảm <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min={0}
                value={formState.discountValue}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    discountValue: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder={formState.discountType === "Percent" ? "10" : "500000"}
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.discountValue
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.discountValue ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.discountValue}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-secondary">
                  {formState.discountType === "Percent"
                    ? "Nhập phần trăm giảm, tối đa 100."
                    : "Nhập số tiền giảm cố định."}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Đơn tối thiểu
              </label>

              <input
                type="number"
                min={0}
                value={formState.minOrderValue}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    minOrderValue: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="0"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.minOrderValue
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.minOrderValue ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.minOrderValue}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Giảm tối đa
              </label>

              <input
                type="number"
                min={0}
                value={formState.maxDiscountAmount}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    maxDiscountAmount: event.target.value,
                  })
                }
                disabled={isSubmitting || formState.discountType === "Fixed"}
                placeholder={
                  formState.discountType === "Percent" ? "1000000" : "Không cần"
                }
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.maxDiscountAmount
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.maxDiscountAmount ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.maxDiscountAmount}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-secondary">
                  Thường dùng cho voucher Percent.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Giới hạn lượt dùng
              </label>

              <input
                type="number"
                min={1}
                value={formState.usageLimit}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    usageLimit: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Ví dụ: 100"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.usageLimit
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.usageLimit ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.usageLimit}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-secondary">
                  Bỏ trống nếu không giới hạn.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>

              <input
                type="datetime-local"
                value={formState.startDate}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    startDate: event.target.value,
                  })
                }
                disabled={isSubmitting}
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.startDate
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.startDate ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.startDate}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>

              <input
                type="datetime-local"
                value={formState.endDate}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    endDate: event.target.value,
                  })
                }
                disabled={isSubmitting}
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.endDate
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.endDate ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.endDate}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Trạng thái
            </label>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                onChange({
                  ...formState,
                  isActive: !formState.isActive,
                })
              }
              className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                formState.isActive
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span>{formState.isActive ? "Đang bật" : "Đã ẩn"}</span>
              <span className="material-symbols-outlined text-xl">
                {formState.isActive ? "toggle_on" : "toggle_off"}
              </span>
            </button>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-2xl border border-surface-container-high px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">
                    progress_activity
                  </span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    save
                  </span>
                  {mode === "create" ? "Thêm voucher" : "Lưu thay đổi"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteVoucherModalProps = {
  voucher: AdminVoucher | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteVoucherModal({
  voucher,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteVoucherModalProps) {
  if (!voucher) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(92vw,540px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <span className="material-symbols-outlined text-2xl">
                delete
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold leading-7 text-on-surface">
                Xóa mềm voucher?
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Voucher{" "}
                <span className="font-semibold text-on-surface">
                  {voucher.code}
                </span>{" "}
                sẽ được chuyển sang trạng thái không hoạt động.
              </p>

              <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                <p className="text-sm leading-6 text-yellow-800">
                  Xóa mềm không mất dữ liệu lịch sử. Voucher đã dùng trong đơn
                  hàng vẫn giữ được thông tin đối soát.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high bg-surface-container-lowest p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                Đang xóa...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  delete
                </span>
                Xác nhận xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVoucherPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] =
    useState<AdminVoucherDiscountTypeFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<AdminVoucherStatusFilter>("all");
  const [sort, setSort] = useState<AdminVoucherSort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<VoucherModalMode>("create");
  const [editingVoucher, setEditingVoucher] =
    useState<AdminVoucher | null>(null);
  const [formState, setFormState] = useState<VoucherFormState>(
    getEmptyVoucherFormState
  );
  const [formErrors, setFormErrors] = useState<VoucherFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingVoucher, setDeletingVoucher] =
    useState<AdminVoucher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toasts, setToasts] = useState<VoucherToast[]>([]);

  const summary = useMemo(() => {
    return {
      active: vouchers.filter(
        (voucher) => voucher.isActive && !isVoucherExpired(voucher)
      ).length,
      inactive: vouchers.filter((voucher) => !voucher.isActive).length,
      expired: vouchers.filter(
        (voucher) => voucher.isActive && isVoucherExpired(voucher)
      ).length,
      used: vouchers.reduce(
        (total, voucher) => total + Number(voucher.usedCount || 0),
        0
      ),
    };
  }, [vouchers]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: VoucherToastVariant,
    title: string,
    description?: string
  ) {
    const id = Date.now() + Math.random();

    setToasts((current) => [
      {
        id,
        variant,
        title,
        description,
      },
      ...current.slice(0, 2),
    ]);

    window.setTimeout(() => {
      closeToast(id);
    }, 3500);
  }

  const fetchVouchers = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminVouchers(adminAccessToken, {
        search,
        page,
        limit,
        sort,
        discountType:
          discountTypeFilter === "all" ? undefined : discountTypeFilter,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "true",
      });

      setVouchers(data.items);
      setPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách voucher.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [
    adminAccessToken,
    search,
    page,
    limit,
    sort,
    discountTypeFilter,
    statusFilter,
  ]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function handleResetFilter() {
    setSearchDraft("");
    setSearch("");
    setDiscountTypeFilter("all");
    setStatusFilter("all");
    setSort("newest");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingVoucher(null);
    setFormState(getEmptyVoucherFormState());
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(voucher: AdminVoucher) {
    setModalMode("edit");
    setEditingVoucher(voucher);
    setFormState(mapVoucherToFormState(voucher));
    setFormErrors({});
    setModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) {
      return;
    }

    setModalOpen(false);
    setEditingVoucher(null);
    setFormErrors({});
  }

  async function handleSubmitVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      showToast("error", "Chưa có token Admin", "Vui lòng đăng nhập lại.");
      return;
    }

    const nextErrors = validateVoucherForm(formState);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast(
        "error",
        "Dữ liệu voucher chưa hợp lệ",
        "Vui lòng kiểm tra mã, giá trị giảm và thời gian hiệu lực."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        code: formState.code.trim().toUpperCase(),
        discountType: formState.discountType,
        discountValue: Number(formState.discountValue),
        minOrderValue: normalizeOptionalNumber(formState.minOrderValue),
        maxDiscountAmount:
          formState.discountType === "Fixed"
            ? undefined
            : normalizeOptionalNumber(formState.maxDiscountAmount),
        usageLimit: normalizeOptionalNumber(formState.usageLimit),
        startDate: toIsoStringFromDateTimeLocal(formState.startDate),
        endDate: toIsoStringFromDateTimeLocal(formState.endDate),
        isActive: formState.isActive,
      };

      if (modalMode === "create") {
        await createAdminVoucher(adminAccessToken, payload);

        showToast(
          "success",
          "Thêm voucher thành công",
          "Mã giảm giá mới đã được lưu vào hệ thống."
        );
      } else {
        if (!editingVoucher) {
          throw new Error("Không tìm thấy voucher cần cập nhật.");
        }

        await updateAdminVoucher(
          adminAccessToken,
          editingVoucher.voucherId,
          payload
        );

        showToast(
          "success",
          "Cập nhật voucher thành công",
          "Thông tin voucher đã được thay đổi."
        );
      }

      setModalOpen(false);
      setEditingVoucher(null);
      await fetchVouchers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu voucher.";

      showToast("error", "Lưu voucher thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDeleteVoucher() {
    if (!adminAccessToken || !deletingVoucher) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteAdminVoucher(adminAccessToken, deletingVoucher.voucherId);

      showToast(
        "success",
        "Xóa mềm voucher thành công",
        "Voucher đã được chuyển sang trạng thái không hoạt động."
      );

      setDeletingVoucher(null);
      await fetchVouchers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa voucher.";

      showToast("error", "Xóa voucher thất bại", message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <VoucherToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Voucher
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý voucher
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Quản lý mã giảm giá, điều kiện đơn tối thiểu, giới hạn lượt dùng
              và thời gian hiệu lực. Voucher xóa sẽ được xóa mềm để giữ lịch sử
              đơn hàng đã áp dụng.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Thêm voucher
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Đang hoạt động
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {formatNumber(summary.active)}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
              Hết hạn
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {formatNumber(summary.expired)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Đã ẩn
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {formatNumber(summary.inactive)}
            </p>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              Lượt dùng theo trang
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {formatNumber(summary.used)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-surface-container-high bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[1fr_180px_180px_200px_130px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>

            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm mã voucher..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <select
            value={discountTypeFilter}
            onChange={(event) => {
              setDiscountTypeFilter(
                event.target.value as AdminVoucherDiscountTypeFilter
              );
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả loại</option>
            <option value="Percent">Theo %</option>
            <option value="Fixed">Cố định</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AdminVoucherStatusFilter);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang bật</option>
            <option value="false">Đã ẩn</option>
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as AdminVoucherSort);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {VOUCHER_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value={5}>5/trang</option>
            <option value={10}>10/trang</option>
            <option value={20}>20/trang</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              <span className="material-symbols-outlined text-xl">search</span>
              Tìm
            </button>

            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
              aria-label="Reset bộ lọc"
            >
              <span className="material-symbols-outlined text-xl">
                restart_alt
              </span>
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách voucher
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Tổng {pagination.totalItems} voucher · Trang {pagination.page}/
              {pagination.totalPages || 1}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchVouchers}
            disabled={isFetching}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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

        {fetchError ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {fetchError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">Mã voucher</th>
                <th className="px-4 py-3 font-bold">Giảm giá</th>
                <th className="px-4 py-3 text-right font-bold">Đơn tối thiểu</th>
                <th className="px-4 py-3 text-right font-bold">Giảm tối đa</th>
                <th className="px-4 py-3 text-right font-bold">Lượt dùng</th>
                <th className="px-4 py-3 font-bold">Thời gian</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined animate-spin text-xl text-primary">
                        progress_activity
                      </span>
                      Đang tải voucher...
                    </div>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          confirmation_number
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có voucher phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy thêm voucher mới hoặc đổi bộ lọc.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr
                    key={voucher.voucherId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-on-surface">
                        {voucher.code}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        ID #{voucher.voucherId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-primary">
                        {getDiscountValueText(voucher)}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        {getDiscountTypeLabel(voucher.discountType)}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-on-surface">
                      {formatCurrency(voucher.minOrderValue)}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-on-surface">
                      {voucher.maxDiscountAmount
                        ? formatCurrency(voucher.maxDiscountAmount)
                        : "—"}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <p className="font-bold text-on-surface">
                        {formatNumber(voucher.usedCount)}
                        {voucher.usageLimit
                          ? ` / ${formatNumber(voucher.usageLimit)}`
                          : ""}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-secondary">
                      <p>Bắt đầu: {formatDateTime(voucher.startDate)}</p>
                      <p className="mt-1">Kết thúc: {formatDateTime(voucher.endDate)}</p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getVoucherStatusClass(
                          voucher
                        )}`}
                      >
                        {getVoucherStatusLabel(voucher)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(voucher)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingVoucher(voucher)}
                          disabled={!voucher.isActive}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                          Xóa mềm
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-surface-container-high p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">
            Hiển thị {vouchers.length} / {pagination.totalItems} voucher
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
              Trước
            </button>

            <span className="rounded-2xl bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface">
              {pagination.page || page}/{pagination.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages || 1, current + 1)
                )
              }
              disabled={
                page >= pagination.totalPages ||
                isFetching ||
                pagination.totalPages === 0
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
              <span className="material-symbols-outlined text-lg">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </section>

      <VoucherFormModal
        open={modalOpen}
        mode={modalMode}
        formState={formState}
        errors={formErrors}
        editingVoucher={editingVoucher}
        isSubmitting={isSubmitting}
        onClose={closeFormModal}
        onChange={setFormState}
        onSubmit={handleSubmitVoucher}
      />

      <DeleteVoucherModal
        voucher={deletingVoucher}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingVoucher(null);
          }
        }}
        onConfirm={handleConfirmDeleteVoucher}
      />
    </div>
  );
}