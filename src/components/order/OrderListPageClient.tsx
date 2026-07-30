"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  cancelCustomerOrder,
  getCustomerOrders,
} from "@/services/order.service";
import { useAuthStore } from "@/store/auth.store";
import type {
  CustomerOrder,
  CustomerOrderSort,
  CustomerOrderStatus,
  CustomerOrderStatusFilter,
} from "@/types/order.type";

const DEFAULT_LIMIT = 10;

const ORDER_STATUS_OPTIONS: {
  label: string;
  value: CustomerOrderStatus;
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
  value: CustomerOrderSort;
}[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Tổng tiền tăng dần", value: "total_asc" },
  { label: "Tổng tiền giảm dần", value: "total_desc" },
];

function formatPrice(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString("vi-VN")}₫`;
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

function getOrderCode(order: CustomerOrder) {
  return order.orderCode || `DH${String(order.orderId).padStart(6, "0")}`;
}

function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
}

function getOrderStatusClass(status: string) {
  if (status === "Completed") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (["Confirmed", "Processing", "Shipping"].includes(status)) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function canCancelOrder(status: string) {
  return ["PendingPayment", "PendingConfirmation"].includes(status);
}

export default function OrderListPageClient() {
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [statusFilter, setStatusFilter] =
    useState<CustomerOrderStatusFilter>("all");
  const [sort, setSort] = useState<CustomerOrderSort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [cancelOrder, setCancelOrder] = useState<CustomerOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const summary = useMemo(() => {
    return {
      pendingPayment: orders.filter(
        (order) => order.orderStatus === "PendingPayment"
      ).length,
      active: orders.filter((order) =>
        ["PendingConfirmation", "Confirmed", "Processing", "Shipping"].includes(
          order.orderStatus
        )
      ).length,
      completed: orders.filter((order) => order.orderStatus === "Completed")
        .length,
      cancelled: orders.filter((order) => order.orderStatus === "Cancelled")
        .length,
    };
  }, [orders]);

  const fetchOrders = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getCustomerOrders(accessToken, {
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        limit,
        sort,
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
  }, [accessToken, statusFilter, page, limit, sort]);

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      router.replace("/login?redirect=/orders");
      return;
    }

    fetchOrders();
  }, [accessToken, isAuthenticated, fetchOrders, router]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    fetchOrders();
  }

  function handleResetFilter() {
    setStatusFilter("all");
    setSort("newest");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  async function handleConfirmCancel() {
    if (!accessToken || !cancelOrder) {
      return;
    }

    try {
      setIsCancelling(true);

      await cancelCustomerOrder(accessToken, cancelOrder.orderId);

      setCancelOrder(null);
      await fetchOrders();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể hủy đơn hàng.";

      setFetchError(message);
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-secondary">
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>{" "}
          / Đơn hàng
        </p>

        <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
          Đơn hàng của tôi
        </h1>

        <p className="mt-2 text-sm leading-6 text-secondary">
          Theo dõi lịch sử đặt hàng, thanh toán và trạng thái giao hàng.
        </p>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
            Chờ thanh toán
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-700">
            {summary.pendingPayment}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            Đang xử lý/giao
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {summary.active}
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">
            Hoàn thành
          </p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {summary.completed}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">
            Đã hủy
          </p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {summary.cancelled}
          </p>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm">
        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-3 md:grid-cols-[1fr_200px_140px_auto]"
        >
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as CustomerOrderStatusFilter);
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
              setSort(event.target.value as CustomerOrderSort);
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
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary"
            >
              Lọc
            </button>

            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {fetchError ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {fetchError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-surface-container-high bg-white shadow-sm">
        {isFetching ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">
              progress_activity
            </span>
            <p className="mt-3 font-semibold text-on-surface">
              Đang tải đơn hàng...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
              <span className="material-symbols-outlined text-3xl">
                receipt_long
              </span>
            </div>

            <p className="mt-4 font-bold text-on-surface">
              Chưa có đơn hàng phù hợp
            </p>

            <Link
              href="/iphone"
              className="mt-4 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-high">
            {orders.map((order) => (
              <article key={order.orderId} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-on-surface">
                        {getOrderCode(order)}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusClass(
                          order.orderStatus
                        )}`}
                      >
                        {getOrderStatusLabel(order.orderStatus)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-secondary">
                      Đặt lúc {formatDateTime(order.createdAt)}
                    </p>

                    <p className="mt-3 text-sm text-secondary">
                      Người nhận:{" "}
                      <span className="font-semibold text-on-surface">
                        {order.customerName || "—"}
                      </span>{" "}
                      · {order.customerPhone || "—"}
                    </p>

                    <p className="mt-1 line-clamp-2 text-sm text-secondary">
                      {order.shippingAddress || "Chưa có địa chỉ giao hàng"}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-sm text-secondary">Tổng thanh toán</p>
                    <p className="mt-1 text-xl font-bold text-primary">
                      {formatPrice(order.totalAmount)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                      <Link
                        href={`/orders/${order.orderId}`}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-surface-container-lowest"
                      >
                        Chi tiết
                      </Link>

                      {order.orderStatus === "PendingPayment" ? (
                        <Link
                          href={`/checkout/payment?orderId=${order.orderId}`}
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
                        >
                          Thanh toán ngay
                        </Link>
                      ) : null}

                      {canCancelOrder(order.orderStatus) ? (
                        <button
                          type="button"
                          onClick={() => setCancelOrder(order)}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Hủy đơn
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-surface-container-high p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">
            Hiển thị {orders.length} / {pagination.totalItems} đơn hàng
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
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
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      {cancelOrder ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-[min(92vw,520px)] rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
            <h3 className="text-xl font-bold text-on-surface">
              Hủy đơn hàng?
            </h3>

            <p className="mt-2 text-sm leading-6 text-secondary">
              Đơn {getOrderCode(cancelOrder)} sẽ được chuyển sang trạng thái đã
              hủy. BE sẽ hoàn tồn kho và voucher nếu có.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCancelOrder(null)}
                disabled={isCancelling}
                className="h-11 rounded-2xl border border-surface-container-high px-5 text-sm font-semibold text-on-surface disabled:opacity-50"
              >
                Không
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}