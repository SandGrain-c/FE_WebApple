"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  cancelAdminShipment,
  createAdminShipment,
  getAdminShipmentById,
  getAdminShipments,
  updateAdminShipment,
  updateAdminShipmentStatus,
} from "@/services/admin-shipment.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import { useAdminNotificationStore } from "@/store/admin-notification.store";
import type {
  AdminShipment,
  AdminShipmentHistory,
  AdminShipmentSort,
  AdminShipmentStatus,
  AdminShipmentStatusFilter,
} from "@/types/admin-shipment.type";

const DEFAULT_LIMIT = 10;

const SHIPMENT_STATUS_OPTIONS: {
  label: string;
  value: AdminShipmentStatus;
}[] = [
  { label: "Chờ tạo vận chuyển", value: "Pending" },
  { label: "Đang chuẩn bị giao", value: "Preparing" },
  { label: "Đã bàn giao vận chuyển", value: "Shipped" },
  { label: "Đang vận chuyển", value: "InTransit" },
  { label: "Đã giao thành công", value: "Delivered" },
  { label: "Giao thất bại", value: "Failed" },
  { label: "Đã hủy vận chuyển", value: "Cancelled" },
];

const SHIPMENT_SORT_OPTIONS: {
  label: string;
  value: AdminShipmentSort;
}[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Trạng thái A-Z", value: "status_asc" },
  { label: "Trạng thái Z-A", value: "status_desc" },
];

/**
 * FE chỉ gợi ý trạng thái tiếp theo.
 * BE vẫn validate cuối cùng theo nghiệp vụ.
 */
const NEXT_SHIPMENT_STATUS_MAP: Record<
  AdminShipmentStatus,
  AdminShipmentStatus[]
> = {
  Pending: ["Preparing", "Cancelled"],
  Preparing: ["Shipped", "Cancelled"],
  Shipped: ["InTransit", "Failed"],
  InTransit: ["Delivered", "Failed"],
  Failed: [],
  Delivered: [],
  Cancelled: [],
};
type ShipmentToastVariant = "success" | "error" | "info";

type ShipmentToast = {
  id: number;
  variant: ShipmentToastVariant;
  title: string;
  description?: string;
};

type CreateShipmentFormState = {
  orderId: string;
  shippingProvider: string;
  trackingCode: string;
  status: AdminShipmentStatus;
  location: string;
  note: string;
};

type EditShipmentFormState = {
  shippingProvider: string;
  trackingCode: string;
};

type ShipmentStatusFormState = {
  status: AdminShipmentStatus | "";
  location: string;
  note: string;
};

function getEmptyCreateFormState(): CreateShipmentFormState {
  return {
    orderId: "",
    shippingProvider: "",
    trackingCode: "",
    status: "Pending",
    location: "",
    note: "",
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
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

function getShipmentCode(shipment: AdminShipment) {
  return `VC${String(shipment.shipmentId).padStart(6, "0")}`;
}

function getOrderCode(shipment: AdminShipment) {
  return shipment.orderCode || `DH${String(shipment.orderId).padStart(6, "0")}`;
}

function getStatusLabel(status: string) {
  return (
    SHIPMENT_STATUS_OPTIONS.find((item) => item.value === status)?.label ||
    status
  );
}

function getStatusClass(status: string) {
  if (status === "Delivered") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Cancelled" || status === "Failed") {
    return "bg-red-50 text-red-700";
  }

  if (status === "Shipped" || status === "InTransit") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "Preparing") {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function getShipmentHistory(shipment: AdminShipment): AdminShipmentHistory[] {
  return shipment.statusHistory || shipment.history || [];
}

type ShipmentToastStackProps = {
  toasts: ShipmentToast[];
  onClose: (id: number) => void;
};

function ShipmentToastStack({ toasts, onClose }: ShipmentToastStackProps) {
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

type CreateShipmentModalProps = {
  open: boolean;
  formState: CreateShipmentFormState;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: CreateShipmentFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CreateShipmentModal({
  open,
  formState,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: CreateShipmentModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(94vw,760px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Shipment Form
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              Tạo vận chuyển
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Chỉ tạo shipment cho đơn đã được xác nhận. Nếu đơn đang Confirmed,
              BE có thể chuyển order sang Processing khi tạo shipment.
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

            <p className="mt-1.5 text-xs text-secondary">
              Có thể lấy Order ID ở trang Quản lý đơn hàng.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Đơn vị vận chuyển
              </label>

              <input
                type="text"
                value={formState.shippingProvider}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    shippingProvider: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Ví dụ: Giao hàng nhanh"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Mã vận đơn
              </label>

              <input
                type="text"
                value={formState.trackingCode}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    trackingCode: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Ví dụ: GHN-IP16-0001"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Trạng thái ban đầu
            </label>

            <select
              value={formState.status}
              onChange={(event) =>
                onChange({
                  ...formState,
                  status: event.target.value as AdminShipmentStatus,
                })
              }
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Pending">Chờ tạo vận chuyển</option>
              <option value="Preparing">Đang chuẩn bị giao</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Vị trí
            </label>

            <input
              type="text"
              value={formState.location}
              onChange={(event) =>
                onChange({
                  ...formState,
                  location: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: Kho Quảng Ninh"
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Ghi chú
            </label>

            <textarea
              value={formState.note}
              onChange={(event) =>
                onChange({
                  ...formState,
                  note: event.target.value,
                })
              }
              disabled={isSubmitting}
              rows={4}
              placeholder="Ví dụ: Tạo vận đơn cho đơn hàng"
              className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
            BE sẽ chặn tạo shipment nếu đơn còn PendingPayment,
            PendingConfirmation, đã Cancelled hoặc Completed.
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
                    local_shipping
                  </span>
                  Tạo vận chuyển
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type EditShipmentModalProps = {
  shipment: AdminShipment | null;
  formState: EditShipmentFormState;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: EditShipmentFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function EditShipmentModal({
  shipment,
  formState,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: EditShipmentModalProps) {
  if (!shipment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-[min(94vw,620px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between gap-4 border-b border-surface-container-high p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Edit Shipment
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              Sửa {getShipmentCode(shipment)}
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Chỉ sửa thông tin đơn vị vận chuyển và mã vận đơn.
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
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Đơn vị vận chuyển
            </label>

            <input
              type="text"
              value={formState.shippingProvider}
              onChange={(event) =>
                onChange({
                  ...formState,
                  shippingProvider: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: Viettel Post"
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Mã vận đơn
            </label>

            <input
              type="text"
              value={formState.trackingCode}
              onChange={(event) =>
                onChange({
                  ...formState,
                  trackingCode: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: VTP-IP16-0001"
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
            BE sẽ không cho sửa shipment đã Delivered hoặc Cancelled.
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
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ShipmentStatusModalProps = {
  shipment: AdminShipment | null;
  formState: ShipmentStatusFormState;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: ShipmentStatusFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ShipmentStatusModal({
  shipment,
  formState,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: ShipmentStatusModalProps) {
  if (!shipment) {
    return null;
  }

  const nextStatuses = NEXT_SHIPMENT_STATUS_MAP[shipment.status] || [];

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(94vw,620px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="border-b border-surface-container-high p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Shipment Status
          </p>

          <h3 className="mt-1 text-xl font-bold text-on-surface">
            Cập nhật {getShipmentCode(shipment)}
          </h3>

          <p className="mt-2 text-sm text-secondary">
            Hiện tại:{" "}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(
                shipment.status
              )}`}
            >
              {getStatusLabel(shipment.status)}
            </span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {nextStatuses.length === 0 ? (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
              Shipment đã ở trạng thái cuối, không thể cập nhật tiếp.
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
                      status: event.target.value as AdminShipmentStatus,
                    })
                  }
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Chọn trạng thái mới</option>

                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Vị trí
                </label>

                <input
                  type="text"
                  value={formState.location}
                  onChange={(event) =>
                    onChange({
                      ...formState,
                      location: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  placeholder="Ví dụ: Kho Quảng Ninh, Trung tâm phân loại, Đông Triều..."
                  className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Ghi chú
                </label>

                <textarea
                  value={formState.note}
                  onChange={(event) =>
                    onChange({
                      ...formState,
                      note: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  rows={4}
                  placeholder="Ví dụ: Đơn hàng đã bàn giao cho đơn vị vận chuyển."
                  className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {formState.status === "Delivered" ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                    Khi chuyển Delivered sẽ đồng bộ đơn hàng sang Completed. Nếu là đơn COD,
                    payment transaction cũng sẽ chuyển sang Success và ghi nhận thời gian thanh
                    toán.
                </div>
              ) : null}

              {formState.status === "Cancelled" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  Thao tác này sẽ hủy vận chuyển sẽ ghi lịch sử shipment.
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

type ShipmentDetailModalProps = {
  shipment: AdminShipment | null;
  isLoading: boolean;
  onClose: () => void;
  onOpenStatusModal: (shipment: AdminShipment) => void;
};

function ShipmentDetailModal({
  shipment,
  isLoading,
  onClose,
  onOpenStatusModal,
}: ShipmentDetailModalProps) {
  if (!shipment && !isLoading) {
    return null;
  }

  const history = shipment ? getShipmentHistory(shipment) : [];

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(96vw,900px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Shipment Detail
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              {shipment ? getShipmentCode(shipment) : "Đang tải vận chuyển..."}
            </h3>

            {shipment ? (
              <p className="mt-1 text-sm text-secondary">
                Tạo lúc {formatDateTime(shipment.createdAt)}
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
              Đang tải chi tiết vận chuyển...
            </div>
          </div>
        ) : shipment ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Đơn hàng
                </p>
                <p className="mt-2 font-bold text-on-surface">
                  {getOrderCode(shipment)}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  Order ID #{shipment.orderId}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Khách hàng
                </p>
                <p className="mt-2 font-bold text-on-surface">
                  {shipment.customerName || "—"}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  {shipment.customerPhone || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Trạng thái
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                      shipment.status
                    )}`}
                  >
                    {getStatusLabel(shipment.status)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStatusModal(shipment)}
                  disabled={
                    NEXT_SHIPMENT_STATUS_MAP[shipment.status]?.length === 0
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
                Thông tin vận chuyển
              </h4>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                    Đơn vị vận chuyển
                  </p>
                  <p className="mt-1 font-semibold text-on-surface">
                    {shipment.shippingProvider || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                    Mã vận đơn
                  </p>
                  <p className="mt-1 font-semibold text-on-surface">
                    {shipment.trackingCode || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container-high p-4">
              <h4 className="font-bold text-on-surface">
                Lịch sử vận chuyển
              </h4>

              {history.length === 0 ? (
                <p className="mt-3 text-sm text-secondary">
                  Chưa có lịch sử trạng thái.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {history.map((item, index) => (
                    <div
                      key={`${item.shipmentHistoryId || item.historyId || index}-${item.status}`}
                      className="flex gap-3"
                    >
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-primary" />

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface">
                          {getStatusLabel(item.status)}
                        </p>

                        <p className="mt-0.5 text-xs text-secondary">
                          {formatDateTime(item.updatedAt || item.createdAt)}
                        </p>

                        {item.location ? (
                          <p className="mt-1 text-sm font-semibold text-on-surface">
                            {item.location}
                          </p>
                        ) : null}

                        {item.note ? (
                          <p className="mt-1 text-sm leading-6 text-secondary">
                            {item.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type CancelShipmentModalProps = {
  shipment: AdminShipment | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function CancelShipmentModal({
  shipment,
  isSubmitting,
  onClose,
  onConfirm,
}: CancelShipmentModalProps) {
  if (!shipment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(92vw,540px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <span className="material-symbols-outlined text-2xl">
                cancel
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold leading-7 text-on-surface">
                Hủy vận chuyển?
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Shipment{" "}
                <span className="font-semibold text-on-surface">
                  {getShipmentCode(shipment)}
                </span>{" "}
                sẽ được chuyển sang trạng thái Cancelled nếu BE cho phép.
              </p>

              <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                <p className="text-sm leading-6 text-yellow-800">
                  Không thể hủy shipment đã Delivered hoặc đã Cancelled.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high bg-surface-container-lowest p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Không
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                Đang hủy...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  cancel
                </span>
                Xác nhận hủy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShipmentPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );
  const fetchNotificationSummary = useAdminNotificationStore(
  (state) => state.fetchSummary
  );
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminShipmentStatusFilter>("all");
  const [sort, setSort] = useState<AdminShipmentSort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateShipmentFormState>(
    getEmptyCreateFormState
  );
  const [isCreating, setIsCreating] = useState(false);

  const [editingShipment, setEditingShipment] =
    useState<AdminShipment | null>(null);
  const [editForm, setEditForm] = useState<EditShipmentFormState>({
    shippingProvider: "",
    trackingCode: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const [statusShipment, setStatusShipment] =
    useState<AdminShipment | null>(null);
  const [statusForm, setStatusForm] = useState<ShipmentStatusFormState>({
    status: "",
    location: "",
    note: "",
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [selectedShipment, setSelectedShipment] =
    useState<AdminShipment | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [cancelShipment, setCancelShipment] =
    useState<AdminShipment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [toasts, setToasts] = useState<ShipmentToast[]>([]);

  const statusSummary = useMemo(() => {
    return {
      pending: shipments.filter((item) => item.status === "Pending").length,
      active: shipments.filter((item) =>
        ["Preparing", "Shipped", "InTransit"].includes(item.status)
      ).length,
      delivered: shipments.filter((item) => item.status === "Delivered").length,
      failedOrCancelled: shipments.filter((item) =>
        ["Failed", "Cancelled"].includes(item.status)
      ).length,
    };
  }, [shipments]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: ShipmentToastVariant,
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

  const fetchShipments = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminShipments(adminAccessToken, {
        search,
        page,
        limit,
        sort,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setShipments(data.items);
      setPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách vận chuyển.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, search, page, limit, sort, statusFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function handleResetFilter() {
    setSearchDraft("");
    setSearch("");
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

    if (!orderId || Number.isNaN(orderId)) {
      showToast("error", "Thiếu Order ID", "Vui lòng nhập Order ID hợp lệ.");
      return;
    }

    try {
      setIsCreating(true);

      await createAdminShipment(adminAccessToken, {
        orderId,
        shippingProvider: normalizeOptionalText(createForm.shippingProvider),
        trackingCode: normalizeOptionalText(createForm.trackingCode),
        status: createForm.status,
        location: normalizeOptionalText(createForm.location),
        note: normalizeOptionalText(createForm.note),
      });

      showToast(
        "success",
        "Tạo vận chuyển thành công",
        "Shipment mới đã được tạo và ghi lịch sử vận chuyển."
      );

      setCreateOpen(false);

      await Promise.all([
            fetchShipments(),
            fetchNotificationSummary(),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tạo vận chuyển.";

      showToast("error", "Tạo vận chuyển thất bại", message);
    } finally {
      setIsCreating(false);
    }
  }

  function openEditModal(shipment: AdminShipment) {
    setEditingShipment(shipment);
    setEditForm({
      shippingProvider: shipment.shippingProvider || "",
      trackingCode: shipment.trackingCode || "",
    });
  }

  async function handleSubmitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken || !editingShipment) {
      return;
    }

    try {
      setIsEditing(true);

      await updateAdminShipment(adminAccessToken, editingShipment.shipmentId, {
        shippingProvider: normalizeOptionalText(editForm.shippingProvider),
        trackingCode: normalizeOptionalText(editForm.trackingCode),
      });

      showToast(
        "success",
        "Cập nhật vận chuyển thành công",
        "Thông tin vận chuyển đã được thay đổi."
      );

      const currentShipment = editingShipment;

setEditingShipment(null);

await Promise.all([
  fetchShipments(),
  fetchNotificationSummary(),
]);

if (selectedShipment?.shipmentId === currentShipment.shipmentId) {
  const detail = await getAdminShipmentById(
    adminAccessToken,
    currentShipment.shipmentId
  );

  setSelectedShipment(detail.shipment);
}
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể cập nhật vận chuyển.";

      showToast("error", "Cập nhật thất bại", message);
    } finally {
      setIsEditing(false);
    }
  }

  function openStatusModal(shipment: AdminShipment) {
    const nextStatuses = NEXT_SHIPMENT_STATUS_MAP[shipment.status] || [];

    setStatusShipment(shipment);
    setStatusForm({
      status: nextStatuses[0] || "",
      location: "",
      note: "",
    });
  }

  async function handleSubmitStatus(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!adminAccessToken || !statusShipment || !statusForm.status) {
    return;
  }

  const currentShipment = statusShipment;
  const nextStatus = statusForm.status;

  try {
    setIsUpdatingStatus(true);

    await updateAdminShipmentStatus(
      adminAccessToken,
      currentShipment.shipmentId,
      {
        status: nextStatus,
        location: normalizeOptionalText(statusForm.location),
        note: normalizeOptionalText(statusForm.note),
      }
    );

    showToast(
      "success",
      "Cập nhật trạng thái thành công",
      nextStatus === "Delivered"
        ? `${getShipmentCode(
            currentShipment
          )} đã giao thành công. BE đã đồng bộ đơn hàng sang Completed và thanh toán COD sang Success nếu có.`
        : `${getShipmentCode(currentShipment)} đã chuyển sang ${getStatusLabel(
            nextStatus
          )}.`
    );

    setStatusShipment(null);
    setStatusForm({
      status: "",
      location: "",
      note: "",
    });

    /**
     * Sau khi cập nhật shipment:
     * - Pending/Preparing/Shipped/InTransit thay đổi badge vận chuyển
     * - Delivered có thể làm giảm badge thanh toán COD pending
     * - Delivered đồng bộ order Completed
     */
    await Promise.all([
      fetchShipments(),
      fetchNotificationSummary(),
    ]);

    /**
     * Nếu modal chi tiết đang mở, reload lại detail để thấy history mới.
     */
    if (selectedShipment?.shipmentId === currentShipment.shipmentId) {
      const detail = await getAdminShipmentById(
        adminAccessToken,
        currentShipment.shipmentId
      );

      setSelectedShipment(detail.shipment);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Không thể cập nhật trạng thái vận chuyển.";

    showToast("error", "Cập nhật trạng thái thất bại", message);
  } finally {
    setIsUpdatingStatus(false);
  }
}

  async function openDetail(shipmentId: number) {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsDetailLoading(true);
      setSelectedShipment(null);

      const data = await getAdminShipmentById(adminAccessToken, shipmentId);

      setSelectedShipment(data.shipment);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải chi tiết.";

      showToast("error", "Tải chi tiết thất bại", message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleConfirmCancel() {
    if (!adminAccessToken || !cancelShipment) {
      return;
    }

    try {
      setIsCancelling(true);

      await cancelAdminShipment(adminAccessToken, cancelShipment.shipmentId);

      showToast(
        "success",
        "Hủy vận chuyển thành công",
        "Shipment đã được chuyển sang trạng thái Cancelled."
      );

      setCancelShipment(null);

      await Promise.all([
            fetchShipments(),
            fetchNotificationSummary(),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể hủy vận chuyển.";

      showToast("error", "Hủy vận chuyển thất bại", message);
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <ShipmentToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Shipment
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý vận chuyển
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Quản lý mã vận đơn, đơn vị giao hàng và trạng thái vận chuyển.
              Khi giao thành công, BE đồng bộ trạng thái đơn hàng sang Completed.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">
              local_shipping
            </span>
            Tạo vận chuyển
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
              Chờ xử lý
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {statusSummary.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Đang giao
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {statusSummary.active}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Đã giao
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {statusSummary.delivered}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Lỗi / Hủy
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {statusSummary.failedOrCancelled}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-surface-container-high bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[1fr_220px_190px_130px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>

            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm mã vận đơn, đơn vị giao, mã đơn, khách hàng..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AdminShipmentStatusFilter);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>

            {SHIPMENT_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as AdminShipmentSort);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {SHIPMENT_SORT_OPTIONS.map((option) => (
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
              Danh sách vận chuyển
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Tổng {pagination.totalItems} shipment · Trang {pagination.page}/
              {pagination.totalPages || 1}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchShipments}
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
          <table className="w-full min-w-280 text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">Shipment</th>
                <th className="px-4 py-3 font-bold">Đơn hàng</th>
                <th className="px-4 py-3 font-bold">Khách hàng</th>
                <th className="px-4 py-3 font-bold">Vận chuyển</th>
                <th className="px-4 py-3 font-bold">Ngày tạo</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined animate-spin text-xl text-primary">
                        progress_activity
                      </span>
                      Đang tải vận chuyển...
                    </div>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          local_shipping
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có vận chuyển phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy tạo shipment cho đơn hàng đã xác nhận.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => (
                  <tr
                    key={shipment.shipmentId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-on-surface">
                        {getShipmentCode(shipment)}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        ID #{shipment.shipmentId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">
                        {getOrderCode(shipment)}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        Order #{shipment.orderId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">
                        {shipment.customerName || "—"}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        {shipment.customerPhone || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">
                        {shipment.shippingProvider || "—"}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        {shipment.trackingCode || "Chưa có mã vận đơn"}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-secondary">
                      {formatDateTime(shipment.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          shipment.status
                        )}`}
                      >
                        {getStatusLabel(shipment.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(shipment.shipmentId)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(shipment)}
                          disabled={["Delivered", "Cancelled"].includes(
                            shipment.status
                          )}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => openStatusModal(shipment)}
                          disabled={
                            NEXT_SHIPMENT_STATUS_MAP[shipment.status]?.length ===
                            0
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-primary/30 px-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            sync_alt
                          </span>
                          Trạng thái
                        </button>

                        <button
                          type="button"
                          onClick={() => setCancelShipment(shipment)}
                          disabled={["Delivered", "Cancelled"].includes(
                            shipment.status
                          )}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            cancel
                          </span>
                          Hủy
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
            Hiển thị {shipments.length} / {pagination.totalItems} shipment
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

      <CreateShipmentModal
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

      <EditShipmentModal
        shipment={editingShipment}
        formState={editForm}
        isSubmitting={isEditing}
        onClose={() => {
          if (!isEditing) {
            setEditingShipment(null);
          }
        }}
        onChange={setEditForm}
        onSubmit={handleSubmitEdit}
      />

      <ShipmentStatusModal
        shipment={statusShipment}
        formState={statusForm}
        isSubmitting={isUpdatingStatus}
        onClose={() => {
          if (!isUpdatingStatus) {
            setStatusShipment(null);
          }
        }}
        onChange={setStatusForm}
        onSubmit={handleSubmitStatus}
      />

      <ShipmentDetailModal
        shipment={selectedShipment}
        isLoading={isDetailLoading}
        onClose={() => setSelectedShipment(null)}
        onOpenStatusModal={openStatusModal}
      />

      <CancelShipmentModal
        shipment={cancelShipment}
        isSubmitting={isCancelling}
        onClose={() => {
          if (!isCancelling) {
            setCancelShipment(null);
          }
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}