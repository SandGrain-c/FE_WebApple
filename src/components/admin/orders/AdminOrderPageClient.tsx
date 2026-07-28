"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  expirePendingPayments,
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrderStatus,
} from "@/services/admin-order.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminOrder,
  AdminOrderDetailItem,
  AdminOrderSort,
  AdminOrderStatus,
  AdminOrderStatusFilter,
} from "@/types/admin-order.type";

import { useAdminNotificationStore } from "@/store/admin-notification.store";

const DEFAULT_LIMIT = 10;

const ORDER_STATUS_OPTIONS: {
  label: string;
  value: AdminOrderStatus;
}[] = [
  { label: "Chờ thanh toán", value: "PendingPayment" },
  { label: "Chờ xác nhận", value: "PendingConfirmation" },
  { label: "Đã xác nhận", value: "Confirmed" },
  { label: "Đang xử lý", value: "Processing" },
  { label: "Đang giao", value: "Shipping" },
  { label: "Hoàn thành", value: "Completed" },
  { label: "Đã hủy", value: "Cancelled" },
];

const ORDER_SORT_OPTIONS: {
  label: string;
  value: AdminOrderSort;
}[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Tổng tiền tăng dần", value: "total_asc" },
  { label: "Tổng tiền giảm dần", value: "total_desc" },
];

/**
 * FE chỉ gợi ý trạng thái có thể chuyển.
 * BE vẫn là nơi validate cuối cùng.
 */
const NEXT_STATUS_MAP: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  PendingPayment: ["Confirmed", "Cancelled"],
  PendingConfirmation: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipping", "Cancelled"],
  Shipping: ["Completed"],
  Completed: [],
  Cancelled: [],
};

type OrderToastVariant = "success" | "error" | "info";

type OrderToast = {
  id: number;
  variant: OrderToastVariant;
  title: string;
  description?: string;
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

function getOrderCode(order: AdminOrder) {
  return order.orderCode || `DH${String(order.orderId).padStart(6, "0")}`;
}

function getStatusLabel(status: string) {
  return (
    ORDER_STATUS_OPTIONS.find((item) => item.value === status)?.label || status
  );
}

function getStatusClass(status: string) {
  if (status === "Completed") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (status === "Shipping" || status === "Processing") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "Confirmed") {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function getOrderItems(order: AdminOrder): AdminOrderDetailItem[] {
  return order.items || order.orderDetails || [];
}

function getLineTotal(item: AdminOrderDetailItem) {
  return item.lineTotal ?? item.price * item.quantity;
}

type OrderToastStackProps = {
  toasts: OrderToast[];
  onClose: (id: number) => void;
};

function OrderToastStack({ toasts, onClose }: OrderToastStackProps) {
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

type OrderDetailModalProps = {
  order: AdminOrder | null;
  isLoading: boolean;
  onClose: () => void;
  onOpenStatusModal: (order: AdminOrder) => void;
};

function OrderDetailModal({
  order,
  isLoading,
  onClose,
  onOpenStatusModal,
}: OrderDetailModalProps) {
  if (!order && !isLoading) {
    return null;
  }

  const items = order ? getOrderItems(order) : [];

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(96vw,980px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Order Detail
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              {order ? getOrderCode(order) : "Đang tải đơn hàng..."}
            </h3>

            {order ? (
              <p className="mt-1 text-sm text-secondary">
                Tạo lúc {formatDateTime(order.createdAt)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary"
            aria-label="Đóng chi tiết đơn"
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
              Đang tải chi tiết đơn hàng...
            </div>
          </div>
        ) : order ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Khách hàng
                </p>
                <p className="mt-2 font-bold text-on-surface">
                  {order.customerName}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  {order.customerPhone || "Chưa có SĐT"}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Trạng thái
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                      order.orderStatus
                    )}`}
                  >
                    {getStatusLabel(order.orderStatus)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStatusModal(order)}
                  disabled={NEXT_STATUS_MAP[order.orderStatus]?.length === 0}
                  className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-surface-container-high bg-white px-3 text-xs font-bold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    sync_alt
                  </span>
                  Đổi trạng thái
                </button>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Tổng thanh toán
                </p>
                <p className="mt-2 text-xl font-bold text-primary">
                  {formatCurrency(order.totalAmount)}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  Payment: {order.paymentMethod || "—"} /{" "}
                  {order.paymentStatus || "—"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container-high p-4">
              <p className="text-sm font-bold text-on-surface">
                Địa chỉ nhận hàng
              </p>
              <p className="mt-2 text-sm leading-6 text-secondary">
                {order.shippingAddress || "Chưa có địa chỉ nhận hàng"}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-surface-container-high">
              <div className="border-b border-surface-container-high bg-surface-container-lowest px-4 py-3">
                <h4 className="font-bold text-on-surface">Sản phẩm trong đơn</h4>
              </div>

              {items.length === 0 ? (
                <div className="p-5 text-sm text-secondary">
                  Chưa có dữ liệu sản phẩm trong đơn.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-surface-container-lowest">
                      <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                        <th className="px-4 py-3 font-bold">Sản phẩm</th>
                        <th className="px-4 py-3 font-bold">SKU</th>
                        <th className="px-4 py-3 text-right font-bold">SL</th>
                        <th className="px-4 py-3 text-right font-bold">Đơn giá</th>
                        <th className="px-4 py-3 text-right font-bold">Tổng</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => (
                        <tr
                          key={`${item.orderDetailId || index}-${item.variantId}`}
                          className="border-b border-surface-container-high last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <p className="font-bold text-on-surface">
                              {item.productName}
                            </p>
                            <p className="mt-1 text-sm text-secondary">
                              {[item.variantName, item.color, item.capacity, item.ram]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded-xl bg-surface-container-lowest px-2.5 py-1 text-xs font-bold text-secondary">
                              {item.sku || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(item.price)}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-primary">
                            {formatCurrency(getLineTotal(item))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-surface-container-high p-4">
              <h4 className="font-bold text-on-surface">Tổng tiền</h4>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-secondary">Tạm tính</span>
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(order.subTotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-secondary">Phí vận chuyển</span>
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(order.shippingFee)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-secondary">Giảm giá</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(order.discountAmount)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-t border-surface-container-high pt-2">
                  <span className="font-bold text-on-surface">Thanh toán</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {order.statusHistory && order.statusHistory.length > 0 ? (
              <div className="rounded-2xl border border-surface-container-high p-4">
                <h4 className="font-bold text-on-surface">
                  Lịch sử trạng thái
                </h4>

                <div className="mt-4 space-y-3">
                  {order.statusHistory.map((history, index) => (
                    <div
                      key={`${history.historyId || index}-${history.status}`}
                      className="flex gap-3"
                    >
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-primary" />

                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          {getStatusLabel(history.status)}
                        </p>
                        <p className="mt-0.5 text-xs text-secondary">
                          {formatDateTime(history.createdAt || history.updatedAt)}
                        </p>
                        {history.note ? (
                          <p className="mt-1 text-sm text-secondary">
                            {history.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type StatusUpdateModalProps = {
  order: AdminOrder | null;
  nextStatus: AdminOrderStatus | "";
  note: string;
  isSubmitting: boolean;
  onClose: () => void;
  onNextStatusChange: (status: AdminOrderStatus | "") => void;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
};

function StatusUpdateModal({
  order,
  nextStatus,
  note,
  isSubmitting,
  onClose,
  onNextStatusChange,
  onNoteChange,
  onConfirm,
}: StatusUpdateModalProps) {
  if (!order) {
    return null;
  }

  const nextStatuses = NEXT_STATUS_MAP[order.orderStatus] || [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(94vw,560px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="border-b border-surface-container-high p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Update Order Status
          </p>

          <h3 className="mt-1 text-xl font-bold text-on-surface">
            Đổi trạng thái đơn {getOrderCode(order)}
          </h3>

          <p className="mt-2 text-sm text-secondary">
            Hiện tại:{" "}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(
                order.orderStatus
              )}`}
            >
              {getStatusLabel(order.orderStatus)}
            </span>
          </p>
        </div>

        <div className="space-y-4 p-5">
          {nextStatuses.length === 0 ? (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
              Trạng thái hiện tại không cho phép cập nhật tiếp.
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Trạng thái mới
                </label>

                <select
                  value={nextStatus}
                  onChange={(event) =>
                    onNextStatusChange(event.target.value as AdminOrderStatus)
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
                  Ghi chú
                </label>

                <textarea
                  value={note}
                  onChange={(event) => onNoteChange(event.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  placeholder="Ví dụ: Xác nhận đơn sau khi kiểm tra thông tin khách hàng."
                  className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {nextStatus === "Cancelled" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  Khi hủy đơn, BE sẽ hoàn tồn kho và hoàn voucher nếu đơn có
                  sử dụng voucher.
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high bg-surface-container-lowest p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !nextStatus || nextStatuses.length === 0}
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
      </div>
    </div>
  );
}

export default function AdminOrderPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );
  const fetchNotificationSummary = useAdminNotificationStore(
  (state) => state.fetchSummary
  );
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminOrderStatusFilter>("all");
  const [sort, setSort] = useState<AdminOrderSort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [statusOrder, setStatusOrder] = useState<AdminOrder | null>(null);
  const [nextStatus, setNextStatus] = useState<AdminOrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isExpiringPayments, setIsExpiringPayments] = useState(false);

  const [toasts, setToasts] = useState<OrderToast[]>([]);

  const statusSummary = useMemo(() => {
    return {
      pending: orders.filter((order) =>
        ["PendingPayment", "PendingConfirmation"].includes(order.orderStatus)
      ).length,
      processing: orders.filter((order) =>
        ["Confirmed", "Processing", "Shipping"].includes(order.orderStatus)
      ).length,
      completed: orders.filter((order) => order.orderStatus === "Completed")
        .length,
      cancelled: orders.filter((order) => order.orderStatus === "Cancelled")
        .length,
    };
  }, [orders]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: OrderToastVariant,
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

  const fetchOrders = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminOrders(adminAccessToken, {
        search,
        page,
        limit,
        sort,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setOrders(data.items);
      setPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách đơn hàng.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, search, page, limit, sort, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  async function openOrderDetail(orderId: number) {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsDetailLoading(true);
      setSelectedOrder(null);

      const data = await getAdminOrderById(adminAccessToken, orderId);

      setSelectedOrder(data.order);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải chi tiết đơn.";

      showToast("error", "Tải chi tiết đơn thất bại", message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  function openStatusModal(order: AdminOrder) {
    const nextStatuses = NEXT_STATUS_MAP[order.orderStatus] || [];

    setStatusOrder(order);
    setNextStatus(nextStatuses[0] || "");
    setStatusNote("");
  }

  async function handleConfirmUpdateStatus() {
  if (!adminAccessToken || !statusOrder || !nextStatus) {
    return;
  }

  const currentOrder = statusOrder;
  const currentNextStatus = nextStatus;

  try {
    setIsUpdatingStatus(true);

    await updateAdminOrderStatus(adminAccessToken, currentOrder.orderId, {
      status: currentNextStatus,
      note: statusNote.trim() || undefined,
    });

    showToast(
      "success",
      "Cập nhật trạng thái thành công",
      currentNextStatus === "Confirmed"
        ? `Đơn ${getOrderCode(
            currentOrder
          )} đã được xác nhận. Hệ thống sẽ tự tạo vận đơn chờ xử lý.`
        : `Đơn ${getOrderCode(currentOrder)} đã chuyển sang ${getStatusLabel(
            currentNextStatus
          )}.`
    );

    setStatusOrder(null);
    setNextStatus("");
    setStatusNote("");

    /**
     * Sau khi đổi trạng thái đơn:
     * - PendingConfirmation -> Confirmed: BE tự tạo shipment Pending
     * - Badge Đơn hàng cần giảm
     * - Badge Vận chuyển cần tăng
     */
    await Promise.all([fetchOrders(), fetchNotificationSummary()]);

    /**
     * Nếu modal chi tiết đơn đang mở thì reload lại detail.
     */
    if (selectedOrder?.orderId === currentOrder.orderId) {
      const detailData = await getAdminOrderById(
        adminAccessToken,
        currentOrder.orderId
      );

      setSelectedOrder(detailData.order);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Không thể cập nhật trạng thái đơn hàng.";

    showToast("error", "Cập nhật trạng thái thất bại", message);
  } finally {
    setIsUpdatingStatus(false);
  }
}
  async function handleExpirePendingPayments() {
  if (!adminAccessToken) {
    return;
  }

  try {
    setIsExpiringPayments(true);

    const data = await expirePendingPayments(adminAccessToken, {
      expireAfterMinutes: 30,
      limit: 50,
    });

    showToast(
      data.expiredOrderCount > 0 ? "success" : "info",
      "Đã kiểm tra đơn quá hạn",
      data.expiredOrderCount > 0
        ? `Đã hủy ${data.expiredOrderCount} đơn thanh toán quá hạn: ${data.expiredOrderIds.join(
            ", "
          )}.`
        : "Không có đơn thanh toán nào quá hạn."
    );

    await Promise.all([fetchOrders(), fetchNotificationSummary()]);

    if (
      selectedOrder &&
      data.expiredOrderIds.includes(selectedOrder.orderId)
    ) {
      const detailData = await getAdminOrderById(
        adminAccessToken,
        selectedOrder.orderId
      );

      setSelectedOrder(detailData.order);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Không thể hủy đơn thanh toán quá hạn.";

    showToast("error", "Kiểm tra đơn quá hạn thất bại", message);
  } finally {
    setIsExpiringPayments(false);
  }
}
  function goToPreviousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setPage((current) => Math.min(pagination.totalPages || 1, current + 1));
  }

  return (
    <div className="space-y-6">
      <OrderToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Order
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý đơn hàng
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Theo dõi đơn hàng, xem chi tiết sản phẩm trong đơn và cập nhật
              trạng thái xử lý. Khi hủy đơn, BE sẽ xử lý hoàn tồn kho và voucher.
            </p>
          </div>

          <button
    type="button"
    onClick={handleExpirePendingPayments}
    disabled={isExpiringPayments}
    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <span
      className={`material-symbols-outlined text-xl ${
        isExpiringPayments ? "animate-spin" : ""
      }`}
    >
      {isExpiringPayments ? "progress_activity" : "timer_off"}
    </span>
    Hủy đơn quá hạn
  </button>

  <button
    type="button"
    onClick={fetchOrders}
    disabled={isFetching}
    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
              Đang chờ
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {statusSummary.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Đang xử lý/giao
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {statusSummary.processing}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Hoàn thành
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {statusSummary.completed}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Đã hủy
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {statusSummary.cancelled}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-surface-container-high bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[1fr_210px_190px_130px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>
            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm mã đơn, khách hàng, số điện thoại..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AdminOrderStatusFilter);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>

            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as AdminOrderSort);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {ORDER_SORT_OPTIONS.map((option) => (
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
              Danh sách đơn hàng
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Tổng {pagination.totalItems} đơn · Trang {pagination.page}/
              {pagination.totalPages || 1}
            </p>
          </div>
        </div>

        {fetchError ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {fetchError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">Đơn hàng</th>
                <th className="px-4 py-3 font-bold">Khách hàng</th>
                <th className="px-4 py-3 font-bold">Ngày tạo</th>
                <th className="px-4 py-3 font-bold">Thanh toán</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold">Tổng tiền</th>
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
                      Đang tải đơn hàng...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          receipt_long
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có đơn hàng phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy thử đổi bộ lọc hoặc kiểm tra dữ liệu checkout.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.orderId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-on-surface">
                        {getOrderCode(order)}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        ID #{order.orderId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        {order.customerPhone || "Chưa có SĐT"}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-secondary">
                      {formatDateTime(order.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-on-surface">
                        {order.paymentMethod || "—"}
                      </p>
                      <p className="mt-1 text-xs text-secondary">
                        {order.paymentStatus || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          order.orderStatus
                        )}`}
                      >
                        {getStatusLabel(order.orderStatus)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-bold text-primary">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(order.orderId)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          onClick={() => openStatusModal(order)}
                          disabled={NEXT_STATUS_MAP[order.orderStatus]?.length === 0}
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
            Hiển thị {orders.length} / {pagination.totalItems} đơn hàng
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousPage}
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
              onClick={goToNextPage}
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

      <OrderDetailModal
        order={selectedOrder}
        isLoading={isDetailLoading}
        onClose={() => setSelectedOrder(null)}
        onOpenStatusModal={openStatusModal}
      />

      <StatusUpdateModal
        order={statusOrder}
        nextStatus={nextStatus}
        note={statusNote}
        isSubmitting={isUpdatingStatus}
        onClose={() => {
          if (!isUpdatingStatus) {
            setStatusOrder(null);
            setNextStatus("");
            setStatusNote("");
          }
        }}
        onNextStatusChange={setNextStatus}
        onNoteChange={setStatusNote}
        onConfirm={handleConfirmUpdateStatus}
      />
    </div>
  );
}