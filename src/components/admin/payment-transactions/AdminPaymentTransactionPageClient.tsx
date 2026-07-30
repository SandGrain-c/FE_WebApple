"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminPaymentTransaction,
  getAdminPaymentTransactionById,
  getAdminPaymentTransactions,
  updateAdminPaymentTransactionStatus,
} from "@/services/admin-payment-transaction.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminPaymentStatus,
  AdminPaymentStatusFilter,
  AdminPaymentTransaction,
  AdminPaymentTransactionSort,
  AdminPaymentType,
  AdminPaymentTypeFilter,
} from "@/types/admin-payment-transaction.type";

const DEFAULT_LIMIT = 10;

const PAYMENT_STATUS_OPTIONS: {
  label: string;
  value: AdminPaymentStatus;
}[] = [
  { label: "Đang chờ", value: "Pending" },
  { label: "Thành công", value: "Success" },
  { label: "Thất bại", value: "Failed" },
  { label: "Đã hủy", value: "Cancelled" },
];

const PAYMENT_TYPE_OPTIONS: {
  label: string;
  value: AdminPaymentType;
}[] = [
  { label: "Thanh toán", value: "Payment" },
  { label: "Hoàn tiền", value: "Refund" },
];

const PAYMENT_SORT_OPTIONS: {
  label: string;
  value: AdminPaymentTransactionSort;
}[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Số tiền tăng dần", value: "amount_asc" },
  { label: "Số tiền giảm dần", value: "amount_desc" },
];

const GATEWAY_OPTIONS = [
  "COD",
  "BankTransfer",
  "Manual",
  "payOS",
  "VNPay",
  "MoMo",
];

const NEXT_PAYMENT_STATUS_MAP: Record<AdminPaymentStatus, AdminPaymentStatus[]> =
  {
    Pending: ["Success", "Failed", "Cancelled"],
    Failed: ["Success", "Cancelled"],
    Success: [],
    Cancelled: [],
  };

type PaymentToastVariant = "success" | "error" | "info";

type PaymentToast = {
  id: number;
  variant: PaymentToastVariant;
  title: string;
  description?: string;
};

type PaymentCreateFormState = {
  orderId: string;
  gateway: string;
  transactionRef: string;
  amount: string;
  paymentType: AdminPaymentType;
  status: AdminPaymentStatus;
  gatewayResponseText: string;
};

type PaymentStatusFormState = {
  status: AdminPaymentStatus | "";
  gatewayResponseText: string;
};

function getEmptyCreateFormState(): PaymentCreateFormState {
  return {
    orderId: "",
    gateway: "COD",
    transactionRef: "",
    amount: "",
    paymentType: "Payment",
    status: "Pending",
    gatewayResponseText: "",
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function buildGatewayResponse(value: string): unknown | undefined {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch {
    return {
      note: trimmedValue,
    };
  }
}

function formatGatewayResponse(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
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

function getTransactionCode(transaction: AdminPaymentTransaction) {
  return `GD${String(transaction.transactionId).padStart(6, "0")}`;
}

function getOrderCode(transaction: AdminPaymentTransaction) {
  return (
    transaction.orderCode ||
    `DH${String(transaction.orderId).padStart(6, "0")}`
  );
}

function getPaymentStatusLabel(status: string) {
  return PAYMENT_STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
}

function getPaymentTypeLabel(type: string) {
  return PAYMENT_TYPE_OPTIONS.find((item) => item.value === type)?.label || type;
}

function getPaymentStatusClass(status: string) {
  if (status === "Success") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Failed" || status === "Cancelled") {
    return "bg-red-50 text-red-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function getPaymentTypeClass(type: string) {
  return type === "Refund"
    ? "bg-purple-50 text-purple-700"
    : "bg-blue-50 text-blue-700";
}

type PaymentToastStackProps = {
  toasts: PaymentToast[];
  onClose: (id: number) => void;
};

function PaymentToastStack({ toasts, onClose }: PaymentToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-9999 mx-auto flex max-w-140 flex-col gap-3 sm:top-6">
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
                <p className="wrap-break-word text-sm font-bold">{toast.title}</p>

                {toast.description ? (
                  <p className="mt-1 wrap-break-word text-sm leading-5 text-on-surface">
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

type CreatePaymentModalProps = {
  open: boolean;
  formState: PaymentCreateFormState;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: PaymentCreateFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CreatePaymentModal({
  open,
  formState,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: CreatePaymentModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(94vw,780px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Payment Transaction Form
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              Tạo giao dịch thủ công
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Dùng cho COD, chuyển khoản thủ công hoặc hoàn tiền.
            </p>
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
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Order ID <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min={1}
                value={formState.orderId}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    orderId: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Ví dụ: 15"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Số tiền <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min={1}
                value={formState.amount}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    amount: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="34990000"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Gateway <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                list="payment-gateway-options"
                value={formState.gateway}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    gateway: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="COD, BankTransfer, Manual..."
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <datalist id="payment-gateway-options">
                {GATEWAY_OPTIONS.map((gateway) => (
                  <option key={gateway} value={gateway} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Mã tham chiếu
              </label>

              <input
                type="text"
                value={formState.transactionRef}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    transactionRef: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Ví dụ: BANK-ORDER-1-0001"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Loại giao dịch
              </label>

              <select
                value={formState.paymentType}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    paymentType: event.target.value as AdminPaymentType,
                  })
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PAYMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Trạng thái
              </label>

              <select
                value={formState.status}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    status: event.target.value as AdminPaymentStatus,
                  })
                }
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Gateway response / Ghi chú
            </label>

            <textarea
              value={formState.gatewayResponseText}
              onChange={(event) =>
                onChange({
                  ...formState,
                  gatewayResponseText: event.target.value,
                })
              }
              disabled={isSubmitting}
              rows={5}
              placeholder='Có thể nhập JSON: {"bank":"VCB","content":"Thanh toán đơn hàng"} hoặc nhập ghi chú thường.'
              className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 font-mono text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
            Nếu tạo giao dịch <span className="font-bold">Payment + Success</span>{" "}
            cho đơn đang PendingPayment, BE sẽ tự chuyển đơn sang
            PendingConfirmation.
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
                  Đang tạo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    add_card
                  </span>
                  Tạo giao dịch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type PaymentStatusModalProps = {
  transaction: AdminPaymentTransaction | null;
  formState: PaymentStatusFormState;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: PaymentStatusFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function PaymentStatusModal({
  transaction,
  formState,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: PaymentStatusModalProps) {
  if (!transaction) {
    return null;
  }

  const nextStatuses = NEXT_PAYMENT_STATUS_MAP[transaction.status] || [];

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(94vw,620px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="border-b border-surface-container-high p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Payment Status
          </p>

          <h3 className="mt-1 text-xl font-bold text-on-surface">
            Cập nhật {getTransactionCode(transaction)}
          </h3>

          <p className="mt-2 text-sm text-secondary">
            Hiện tại:{" "}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${getPaymentStatusClass(
                transaction.status
              )}`}
            >
              {getPaymentStatusLabel(transaction.status)}
            </span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {nextStatuses.length === 0 ? (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
              Giao dịch đã Success hoặc Cancelled nên BE không cho cập nhật tiếp.
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Trạng thái mới <span className="text-red-500">*</span>
                </label>

                <select
                  value={formState.status}
                  onChange={(event) =>
                    onChange({
                      ...formState,
                      status: event.target.value as AdminPaymentStatus,
                    })
                  }
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Chọn trạng thái mới</option>

                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getPaymentStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Gateway response / Ghi chú
                </label>

                <textarea
                  value={formState.gatewayResponseText}
                  onChange={(event) =>
                    onChange({
                      ...formState,
                      gatewayResponseText: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  rows={5}
                  placeholder='Ví dụ: {"note":"Khách đã thanh toán khi nhận hàng"}'
                  className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 font-mono text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {formState.status === "Success" ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                  Nếu giao dịch là Payment và đơn đang PendingPayment, BE sẽ tự
                  chuyển đơn sang PendingConfirmation.
                </div>
              ) : null}
            </>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting || !formState.status || nextStatuses.length === 0
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">
                    progress_activity
                  </span>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    sync_alt
                  </span>
                  Cập nhật trạng thái
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type PaymentDetailModalProps = {
  transaction: AdminPaymentTransaction | null;
  isLoading: boolean;
  onClose: () => void;
  onOpenStatusModal: (transaction: AdminPaymentTransaction) => void;
};

function PaymentDetailModal({
  transaction,
  isLoading,
  onClose,
  onOpenStatusModal,
}: PaymentDetailModalProps) {
  if (!transaction && !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(96vw,900px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Payment Detail
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              {transaction
                ? getTransactionCode(transaction)
                : "Đang tải giao dịch..."}
            </h3>

            {transaction ? (
              <p className="mt-1 text-sm text-secondary">
                Tạo lúc {formatDateTime(transaction.createdAt)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary"
            aria-label="Đóng chi tiết"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined animate-spin text-xl text-primary">
                progress_activity
              </span>
              Đang tải chi tiết giao dịch...
            </div>
          </div>
        ) : transaction ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Đơn hàng
                </p>
                <p className="mt-2 font-bold text-on-surface">
                  {getOrderCode(transaction)}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  Order ID #{transaction.orderId}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Khách hàng
                </p>
                <p className="mt-2 font-bold text-on-surface">
                  {transaction.customerName || "—"}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  {transaction.customerPhone || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Số tiền
                </p>
                <p className="mt-2 text-xl font-bold text-primary">
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-surface-container-high p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Gateway
                </p>
                <p className="mt-2 font-bold text-on-surface">
                  {transaction.gateway || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Loại giao dịch
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPaymentTypeClass(
                      transaction.paymentType
                    )}`}
                  >
                    {getPaymentTypeLabel(transaction.paymentType)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-surface-container-high p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Trạng thái
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusClass(
                      transaction.status
                    )}`}
                  >
                    {getPaymentStatusLabel(transaction.status)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStatusModal(transaction)}
                  disabled={
                    NEXT_PAYMENT_STATUS_MAP[transaction.status]?.length === 0
                  }
                  className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-surface-container-high bg-white px-3 text-xs font-bold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    sync_alt
                  </span>
                  Đổi trạng thái
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container-high p-4">
              <h4 className="font-bold text-on-surface">
                Thông tin tham chiếu
              </h4>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                    Transaction Ref
                  </p>
                  <p className="mt-1 break-all font-semibold text-on-surface">
                    {transaction.transactionRef || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                    Paid At
                  </p>
                  <p className="mt-1 font-semibold text-on-surface">
                    {formatDateTime(transaction.paidAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container-high p-4">
              <h4 className="font-bold text-on-surface">Gateway Response</h4>

              {formatGatewayResponse(transaction.gatewayResponse) ? (
                <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-surface-container-lowest p-4 text-xs leading-6 text-on-surface">
                  {formatGatewayResponse(transaction.gatewayResponse)}
                </pre>
              ) : (
                <p className="mt-3 text-sm text-secondary">
                  Chưa có gateway response.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminPaymentTransactionPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [transactions, setTransactions] = useState<AdminPaymentTransaction[]>(
    []
  );
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] =
    useState<AdminPaymentTypeFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<AdminPaymentStatusFilter>("all");
  const [sort, setSort] =
    useState<AdminPaymentTransactionSort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PaymentCreateFormState>(
    getEmptyCreateFormState
  );
  const [isCreating, setIsCreating] = useState(false);

  const [statusTransaction, setStatusTransaction] =
    useState<AdminPaymentTransaction | null>(null);
  const [statusForm, setStatusForm] = useState<PaymentStatusFormState>({
    status: "",
    gatewayResponseText: "",
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState<AdminPaymentTransaction | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [toasts, setToasts] = useState<PaymentToast[]>([]);

  const statusSummary = useMemo(() => {
    return {
      pending: transactions.filter((item) => item.status === "Pending").length,
      success: transactions.filter((item) => item.status === "Success").length,
      failed: transactions.filter((item) => item.status === "Failed").length,
      cancelled: transactions.filter((item) => item.status === "Cancelled")
        .length,
    };
  }, [transactions]);

  const amountSummary = useMemo(() => {
    return {
      successPayment: transactions
        .filter(
          (item) =>
            item.status === "Success" && item.paymentType === "Payment"
        )
        .reduce((total, item) => total + Number(item.amount || 0), 0),
      successRefund: transactions
        .filter(
          (item) =>
            item.status === "Success" && item.paymentType === "Refund"
        )
        .reduce((total, item) => total + Number(item.amount || 0), 0),
    };
  }, [transactions]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: PaymentToastVariant,
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

  const fetchTransactions = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminPaymentTransactions(adminAccessToken, {
        search,
        page,
        limit,
        sort,
        gateway: gatewayFilter === "all" ? undefined : gatewayFilter,
        paymentType:
          paymentTypeFilter === "all" ? undefined : paymentTypeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setTransactions(data.items);
      setPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách giao dịch.";

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
    gatewayFilter,
    paymentTypeFilter,
    statusFilter,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function handleResetFilter() {
    setSearchDraft("");
    setSearch("");
    setGatewayFilter("all");
    setPaymentTypeFilter("all");
    setStatusFilter("all");
    setSort("newest");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  function openCreateModal() {
    setCreateForm(getEmptyCreateFormState());
    setCreateOpen(true);
  }

  async function handleSubmitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      return;
    }

    const orderId = Number(createForm.orderId);
    const amount = Number(createForm.amount);
    const gateway = createForm.gateway.trim();

    if (!orderId || Number.isNaN(orderId)) {
      showToast("error", "Thiếu Order ID", "Vui lòng nhập Order ID hợp lệ.");
      return;
    }

    if (!gateway) {
      showToast("error", "Thiếu gateway", "Vui lòng nhập gateway thanh toán.");
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      showToast("error", "Số tiền không hợp lệ", "Số tiền phải lớn hơn 0.");
      return;
    }

    try {
      setIsCreating(true);

      await createAdminPaymentTransaction(adminAccessToken, {
        orderId,
        gateway,
        transactionRef: normalizeOptionalText(createForm.transactionRef),
        amount,
        paymentType: createForm.paymentType,
        status: createForm.status,
        gatewayResponse: buildGatewayResponse(
          createForm.gatewayResponseText
        ),
      });

      showToast(
        "success",
        "Tạo giao dịch thành công",
        "Giao dịch thanh toán đã được lưu vào hệ thống."
      );

      setCreateOpen(false);
      await fetchTransactions();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tạo giao dịch.";

      showToast("error", "Tạo giao dịch thất bại", message);
    } finally {
      setIsCreating(false);
    }
  }

  function openStatusModal(transaction: AdminPaymentTransaction) {
    const nextStatuses = NEXT_PAYMENT_STATUS_MAP[transaction.status] || [];

    setStatusTransaction(transaction);
    setStatusForm({
      status: nextStatuses[0] || "",
      gatewayResponseText: "",
    });
  }

  async function handleSubmitStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken || !statusTransaction || !statusForm.status) {
      return;
    }

    try {
      setIsUpdatingStatus(true);

      await updateAdminPaymentTransactionStatus(
        adminAccessToken,
        statusTransaction.transactionId,
        {
          status: statusForm.status,
          gatewayResponse: buildGatewayResponse(
            statusForm.gatewayResponseText
          ),
        }
      );

      showToast(
        "success",
        "Cập nhật trạng thái thành công",
        `${getTransactionCode(
          statusTransaction
        )} đã chuyển sang ${getPaymentStatusLabel(statusForm.status)}.`
      );

      setStatusTransaction(null);
      await fetchTransactions();

      if (
        selectedTransaction?.transactionId ===
        statusTransaction.transactionId
      ) {
        const detail = await getAdminPaymentTransactionById(
          adminAccessToken,
          statusTransaction.transactionId
        );

        setSelectedTransaction(detail.transaction);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái giao dịch.";

      showToast("error", "Cập nhật thất bại", message);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function openDetail(transactionId: number) {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsDetailLoading(true);
      setSelectedTransaction(null);

      const data = await getAdminPaymentTransactionById(
        adminAccessToken,
        transactionId
      );

      setSelectedTransaction(data.transaction);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải chi tiết.";

      showToast("error", "Tải chi tiết thất bại", message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PaymentToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Payment
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý giao dịch thanh toán
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Theo dõi COD, chuyển khoản, payOS và hoàn tiền. Giao dịch thanh
              toán không xóa để đảm bảo minh bạch lịch sử.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">add_card</span>
            Tạo giao dịch
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
              Đang chờ
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {statusSummary.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Thành công
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {statusSummary.success}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Thất bại
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {statusSummary.failed}
            </p>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              Đã hủy
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {statusSummary.cancelled}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Tiền thu thành công theo trang
            </p>
            <p className="mt-2 text-xl font-bold text-green-700">
              {formatCurrency(amountSummary.successPayment)}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
              Hoàn tiền thành công theo trang
            </p>
            <p className="mt-2 text-xl font-bold text-purple-700">
              {formatCurrency(amountSummary.successRefund)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-surface-container-high bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 2xl:grid-cols-[1fr_160px_160px_170px_200px_130px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>

            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm mã giao dịch, gateway, mã đơn, khách hàng..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <select
            value={gatewayFilter}
            onChange={(event) => {
              setGatewayFilter(event.target.value);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả gateway</option>
            {GATEWAY_OPTIONS.map((gateway) => (
              <option key={gateway} value={gateway}>
                {gateway}
              </option>
            ))}
          </select>

          <select
            value={paymentTypeFilter}
            onChange={(event) => {
              setPaymentTypeFilter(
                event.target.value as AdminPaymentTypeFilter
              );
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả loại</option>
            {PAYMENT_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as AdminPaymentStatusFilter
              );
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>
            {PAYMENT_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as AdminPaymentTransactionSort);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {PAYMENT_SORT_OPTIONS.map((option) => (
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

      <section className="overflow-hidden rounded-3xl border border-surface-container-high bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách giao dịch
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Tổng {pagination.totalItems} giao dịch · Trang {pagination.page}/
              {pagination.totalPages || 1}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchTransactions}
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
          <table className="w-full min-w-295 text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">Giao dịch</th>
                <th className="px-4 py-3 font-bold">Đơn hàng</th>
                <th className="px-4 py-3 font-bold">Khách hàng</th>
                <th className="px-4 py-3 font-bold">Gateway</th>
                <th className="px-4 py-3 font-bold">Loại</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold">Số tiền</th>
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
                      Đang tải giao dịch...
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          payments
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có giao dịch phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy thử đổi bộ lọc hoặc tạo giao dịch thủ công.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.transactionId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-on-surface">
                        {getTransactionCode(transaction)}
                      </p>
                      <p className="mt-1 max-w-55 truncate text-sm text-secondary">
                        {transaction.transactionRef || "Chưa có ref"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">
                        {getOrderCode(transaction)}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        Order #{transaction.orderId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">
                        {transaction.customerName || "—"}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        {transaction.customerPhone || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-xl bg-surface-container-lowest px-2.5 py-1 text-xs font-bold text-secondary">
                        {transaction.gateway || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPaymentTypeClass(
                          transaction.paymentType
                        )}`}
                      >
                        {getPaymentTypeLabel(transaction.paymentType)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusClass(
                          transaction.status
                        )}`}
                      >
                        {getPaymentStatusLabel(transaction.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-primary">
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(transaction.transactionId)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          onClick={() => openStatusModal(transaction)}
                          disabled={
                            NEXT_PAYMENT_STATUS_MAP[transaction.status]
                              ?.length === 0
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-primary/30 px-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            sync_alt
                          </span>
                          Trạng thái
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
            Hiển thị {transactions.length} / {pagination.totalItems} giao dịch
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

      <CreatePaymentModal
        open={createOpen}
        formState={createForm}
        isSubmitting={isCreating}
        onClose={() => {
          if (!isCreating) {
            setCreateOpen(false);
          }
        }}
        onChange={setCreateForm}
        onSubmit={handleSubmitCreate}
      />

      <PaymentStatusModal
        transaction={statusTransaction}
        formState={statusForm}
        isSubmitting={isUpdatingStatus}
        onClose={() => {
          if (!isUpdatingStatus) {
            setStatusTransaction(null);
          }
        }}
        onChange={setStatusForm}
        onSubmit={handleSubmitStatus}
      />

      <PaymentDetailModal
        transaction={selectedTransaction}
        isLoading={isDetailLoading}
        onClose={() => setSelectedTransaction(null)}
        onOpenStatusModal={openStatusModal}
      />
    </div>
  );
}