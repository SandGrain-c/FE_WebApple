"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getAdminDashboardOverview } from "@/services/admin-dashboard.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminDashboardOverviewData,
  AdminRecentOrder,
  AdminTopProduct,
} from "@/types/admin-dashboard.type";

const DEFAULT_DASHBOARD_DATA: AdminDashboardOverviewData = {
  summary: {
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalReviews: 0,
    lowStockVariants: 0,
  },
  revenueSeries: [],
  topProducts: [],
  lowStockVariants: [],
  recentOrders: [],
};

const DASHBOARD_DAY_OPTIONS = [
  {
    label: "7 ngày",
    value: 7,
  },
  {
    label: "30 ngày",
    value: 30,
  },
  {
    label: "90 ngày",
    value: 90,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getOrderStatusLabel(status: string) {
  const statusMap: Record<string, string> = {
    PendingPayment: "Chờ thanh toán",
    PendingConfirmation: "Chờ xác nhận",
    Confirmed: "Đã xác nhận",
    Processing: "Đang xử lý",
    Shipping: "Đang giao",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };

  return statusMap[status] || status;
}

function getOrderStatusClass(status: string) {
  if (status === "Completed") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (status === "Shipping" || status === "Processing") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function getTopProductSold(product: AdminTopProduct) {
  return product.soldQuantity ?? product.totalSold ?? 0;
}

function getTopProductRevenue(product: AdminTopProduct) {
  return product.revenue ?? product.totalRevenue ?? 0;
}

function getRecentOrderCode(order: AdminRecentOrder) {
  return order.orderCode || `DH${String(order.orderId).padStart(6, "0")}`;
}

export default function AdminDashboardPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );
  const adminUser = useAdminAuthStore((state) => state.adminUser);

  const [dashboardData, setDashboardData] =
    useState<AdminDashboardOverviewData>(DEFAULT_DASHBOARD_DATA);
  const [days, setDays] = useState(7);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const summary = dashboardData.summary;

  const maxRevenue = useMemo(() => {
    return Math.max(
      ...dashboardData.revenueSeries.map((item) => item.revenue || 0),
      1
    );
  }, [dashboardData.revenueSeries]);

  const maxTopProductSold = useMemo(() => {
    return Math.max(
      ...dashboardData.topProducts.map((product) =>
        getTopProductSold(product)
      ),
      1
    );
  }, [dashboardData.topProducts]);

  const fetchDashboard = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      /**
       * FE gọi overview để lấy đủ summary, doanh thu, top sản phẩm,
       * tồn kho thấp và đơn gần đây trong một request.
       */
      const data = await getAdminDashboardOverview(adminAccessToken, {
        days,
        limit: 5,
        threshold: 5,
      });

      setDashboardData({
        summary: data.summary || DEFAULT_DASHBOARD_DATA.summary,
        revenueSeries: data.revenueSeries || [],
        topProducts: data.topProducts || [],
        lowStockVariants: data.lowStockVariants || [],
        recentOrders: data.recentOrders || [],
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu dashboard.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, days]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Xin chào, {adminUser?.fullName || adminUser?.userName || "Admin"}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Dashboard tổng quan
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Theo dõi doanh thu, đơn hàng, khách hàng, sản phẩm bán chạy và
              tồn kho thấp. Doanh thu chỉ tính từ đơn hàng đã hoàn thành.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="h-11 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-semibold text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              {DASHBOARD_DAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchDashboard}
              disabled={isFetching}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>

        {fetchError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {fetchError}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-surface-container-high bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                Tổng doanh thu
              </p>
              <p className="mt-3 text-2xl font-bold text-on-surface">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <span className="material-symbols-outlined text-2xl">
                payments
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-surface-container-high bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                Tổng đơn hàng
              </p>
              <p className="mt-3 text-2xl font-bold text-on-surface">
                {formatNumber(summary.totalOrders)}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <span className="material-symbols-outlined text-2xl">
                receipt_long
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-surface-container-high bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                Khách hàng
              </p>
              <p className="mt-3 text-2xl font-bold text-on-surface">
                {formatNumber(summary.totalCustomers)}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <span className="material-symbols-outlined text-2xl">
                group
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-surface-container-high bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                Tồn kho thấp
              </p>
              <p className="mt-3 text-2xl font-bold text-on-surface">
                {formatNumber(summary.lowStockVariants)}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <span className="material-symbols-outlined text-2xl">
                inventory
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">
            Đơn hoàn thành
          </p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {formatNumber(summary.completedOrders)}
          </p>
        </div>

        <div className="rounded-[22px] border border-yellow-100 bg-yellow-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
            Đơn đang chờ
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-700">
            {formatNumber(summary.pendingOrders)}
          </p>
        </div>

        <div className="rounded-[22px] border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">
            Đơn đã hủy
          </p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {formatNumber(summary.cancelledOrders)}
          </p>
        </div>

        <div className="rounded-[22px] border border-surface-container-high bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">
            Sản phẩm / Review
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {formatNumber(summary.totalProducts)} /{" "}
            {formatNumber(summary.totalReviews)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[28px] border border-surface-container-high bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                Doanh thu {days} ngày
              </h3>
              <p className="mt-1 text-sm text-secondary">
                Biểu đồ đơn giản theo dữ liệu revenueSeries.
              </p>
            </div>
          </div>

          {isFetching ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                <span className="material-symbols-outlined animate-spin text-xl text-primary">
                  progress_activity
                </span>
                Đang tải doanh thu...
              </div>
            </div>
          ) : dashboardData.revenueSeries.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                  <span className="material-symbols-outlined text-2xl">
                    monitoring
                  </span>
                </div>
                <p className="mt-3 font-bold text-on-surface">
                  Chưa có dữ liệu doanh thu
                </p>
                <p className="mt-1 text-sm text-secondary">
                  Doanh thu chỉ được tính từ đơn Completed.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex h-[300px] items-end gap-3 overflow-x-auto pb-2">
              {dashboardData.revenueSeries.map((item) => {
                const heightPercent = Math.max(
                  8,
                  Math.round(((item.revenue || 0) / maxRevenue) * 100)
                );

                return (
                  <div
                    key={item.date}
                    className="flex min-w-[72px] flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="text-center">
                      <p className="text-xs font-bold text-on-surface">
                        {formatCurrency(item.revenue)}
                      </p>
                      {typeof item.orders === "number" ? (
                        <p className="text-[11px] text-secondary">
                          {item.orders} đơn
                        </p>
                      ) : null}
                    </div>

                    <div className="flex h-[190px] w-full items-end rounded-2xl bg-surface-container-lowest p-1">
                      <div
                        className="w-full rounded-xl bg-primary"
                        style={{
                          height: `${heightPercent}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs font-semibold text-secondary">
                      {formatDate(item.date)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-surface-container-high bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                Top sản phẩm
              </h3>
              <p className="mt-1 text-sm text-secondary">
                Sản phẩm bán chạy theo khoảng thời gian.
              </p>
            </div>

            <Link
              href="/admin/products"
              className="rounded-2xl border border-surface-container-high px-3 py-2 text-xs font-bold text-on-surface transition hover:border-primary hover:text-primary"
            >
              Xem sản phẩm
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {dashboardData.topProducts.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-lowest p-5 text-center text-sm text-secondary">
                Chưa có dữ liệu top sản phẩm.
              </div>
            ) : (
              dashboardData.topProducts.map((product, index) => {
                const sold = getTopProductSold(product);
                const revenue = getTopProductRevenue(product);
                const widthPercent = Math.max(
                  8,
                  Math.round((sold / maxTopProductSold) * 100)
                );

                return (
                  <div key={`${product.productId}-${index}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-on-surface">
                          #{index + 1} {product.name}
                        </p>
                        <p className="mt-1 text-xs text-secondary">
                          {product.categoryName || "Chưa rõ danh mục"} ·{" "}
                          {formatNumber(sold)} đã bán
                        </p>
                      </div>

                      <p className="shrink-0 text-xs font-bold text-primary">
                        {formatCurrency(revenue)}
                      </p>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-lowest">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${widthPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-surface-container-high bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                Biến thể tồn kho thấp
              </h3>
              <p className="mt-1 text-sm text-secondary">
                Ngưỡng hiện tại: dưới hoặc bằng 5 sản phẩm.
              </p>
            </div>

            <Link
              href="/admin/products"
              className="rounded-2xl border border-surface-container-high px-3 py-2 text-xs font-bold text-on-surface transition hover:border-primary hover:text-primary"
            >
              Quản lý kho
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-surface-container-high">
            {dashboardData.lowStockVariants.length === 0 ? (
              <div className="p-6 text-center text-sm text-secondary">
                Chưa có biến thể tồn kho thấp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-surface-container-lowest">
                    <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                      <th className="px-4 py-3 font-bold">Sản phẩm</th>
                      <th className="px-4 py-3 font-bold">SKU</th>
                      <th className="px-4 py-3 font-bold">Variant</th>
                      <th className="px-4 py-3 text-right font-bold">Tồn</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboardData.lowStockVariants.map((variant) => (
                      <tr
                        key={variant.variantId}
                        className="border-b border-surface-container-high last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-on-surface">
                            {variant.productName}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-xl bg-surface-container-lowest px-2.5 py-1 text-xs font-bold text-secondary">
                            {variant.sku}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm text-secondary">
                          {[variant.color, variant.capacity, variant.ram]
                            .filter(Boolean)
                            .join(" - ") || variant.variantName || "—"}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                            {variant.stockQuantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-surface-container-high bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                Đơn hàng gần đây
              </h3>
              <p className="mt-1 text-sm text-secondary">
                5 đơn mới nhất trong hệ thống.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="rounded-2xl border border-surface-container-high px-3 py-2 text-xs font-bold text-on-surface transition hover:border-primary hover:text-primary"
            >
              Xem đơn
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {dashboardData.recentOrders.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-lowest p-5 text-center text-sm text-secondary">
                Chưa có đơn hàng gần đây.
              </div>
            ) : (
              dashboardData.recentOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="rounded-2xl border border-surface-container-high p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface">
                        {getRecentOrderCode(order)}
                      </p>

                      <p className="mt-1 truncate text-sm text-secondary">
                        {order.customerName} ·{" "}
                        {order.customerPhone || "Chưa có SĐT"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusClass(
                        order.orderStatus
                      )}`}
                    >
                      {getOrderStatusLabel(order.orderStatus)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-secondary">
                      {formatDate(order.createdAt)}
                    </p>

                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}