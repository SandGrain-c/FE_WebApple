"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  cancelCustomerOrder,
  getCustomerOrderById,
} from "@/services/order.service";
import { getCustomerPaymentTransactionsByOrder } from "@/services/customer-payment-transaction.service";
import { getCustomerShipmentsByOrder } from "@/services/customer-shipment.service";
import { useAuthStore } from "@/store/auth.store";
import type {
  CustomerOrder,
  CustomerOrderItem,
  CustomerOrderStatusHistory,
} from "@/types/order.type";
import type { CustomerPaymentTransaction } from "@/types/customer-payment-transaction.type";
import type {
  CustomerShipment,
  CustomerShipmentHistory,
} from "@/types/customer-shipment.type";

const ORDER_STATUS_OPTIONS = [
  { label: "Chờ thanh toán", value: "PendingPayment" },
  { label: "Chờ xác nhận", value: "PendingConfirmation" },
  { label: "Đã xác nhận", value: "Confirmed" },
  { label: "Đang xử lý", value: "Processing" },
  { label: "Đang giao", value: "Shipping" },
  { label: "Hoàn thành", value: "Completed" },
  { label: "Đã hủy", value: "Cancelled" },
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

function getPaymentStatusClass(status: string) {
  if (status === "Success") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Failed" || status === "Cancelled") {
    return "bg-red-50 text-red-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function getPaymentStatusLabel(status: string) {
  const map: Record<string, string> = {
    Pending: "Đang chờ",
    Success: "Thành công",
    Failed: "Thất bại",
    Cancelled: "Đã hủy",
  };

  return map[status] || status;
}

function getShipmentStatusClass(status: string) {
  if (status === "Delivered") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Failed" || status === "Cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (["Shipped", "InTransit"].includes(status)) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function getShipmentStatusLabel(status: string) {
  const map: Record<string, string> = {
    Pending: "Chờ tạo vận chuyển",
    Preparing: "Đang chuẩn bị giao",
    Shipped: "Đã bàn giao vận chuyển",
    InTransit: "Đang vận chuyển",
    Delivered: "Đã giao thành công",
    Failed: "Giao thất bại",
    Cancelled: "Đã hủy vận chuyển",
  };

  return map[status] || status;
}

function canCancelOrder(status: string) {
  return ["PendingPayment", "PendingConfirmation"].includes(status);
}

function getOrderItems(order: CustomerOrder): CustomerOrderItem[] {
  return order.items || order.details || order.orderDetails || [];
}

function getOrderHistory(order: CustomerOrder): CustomerOrderStatusHistory[] {
  return order.statusHistory || order.history || order.orderStatusHistory || [];
}

function getShipmentHistory(shipment: CustomerShipment): CustomerShipmentHistory[] {
  return shipment.statusHistory || shipment.history || [];
}

export default function OrderDetailPageClient() {
  const router = useRouter();
  const params = useParams();

  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const orderId = useMemo(() => {
    const rawOrderId = params?.orderId;

    if (Array.isArray(rawOrderId)) {
      return Number(rawOrderId[0] || 0);
    }

    return Number(rawOrderId || 0);
  }, [params]);

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [transactions, setTransactions] = useState<CustomerPaymentTransaction[]>(
    []
  );
  const [shipments, setShipments] = useState<CustomerShipment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderItems = order ? getOrderItems(order) : [];
  const orderHistory = order ? getOrderHistory(order) : [];

  const fetchOrderDetail = useCallback(async () => {
    if (!accessToken || !orderId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [orderData, paymentData, shipmentData] = await Promise.allSettled([
        getCustomerOrderById(accessToken, orderId),
        getCustomerPaymentTransactionsByOrder(orderId, accessToken),
        getCustomerShipmentsByOrder(orderId, accessToken),
      ]);

      if (orderData.status === "fulfilled") {
        setOrder(orderData.value.order);
      } else {
        throw orderData.reason;
      }

      if (paymentData.status === "fulfilled") {
        setTransactions(paymentData.value.items);
      } else {
        setTransactions([]);
      }

      if (shipmentData.status === "fulfilled") {
        setShipments(shipmentData.value.items);
      } else {
        setShipments([]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải chi tiết đơn hàng.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, orderId]);

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      router.replace(`/login?redirect=/orders/${orderId || ""}`);
      return;
    }

    if (!orderId) {
      router.replace("/orders");
      return;
    }

    fetchOrderDetail();
  }, [accessToken, isAuthenticated, orderId, router, fetchOrderDetail]);

  async function handleCancelOrder() {
    if (!accessToken || !order) {
      return;
    }

    try {
      setIsCancelling(true);
      setError(null);

      const data = await cancelCustomerOrder(accessToken, order.orderId);

      setOrder(data.order);
      await fetchOrderDetail();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể hủy đơn hàng.";

      setError(message);
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-surface-container-high bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">
            progress_activity
          </span>
          <p className="mt-3 font-semibold text-on-surface">
            Đang tải chi tiết đơn hàng...
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error || "Không tìm thấy đơn hàng."}
        </div>

        <Link
          href="/orders"
          className="mt-4 inline-flex rounded-2xl border border-primary px-5 py-3 text-sm font-semibold text-primary"
        >
          Quay lại đơn hàng
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-secondary">
          <Link href="/orders" className="hover:text-primary">
            Đơn hàng
          </Link>{" "}
          / {getOrderCode(order)}
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">
              {getOrderCode(order)}
            </h1>

            <p className="mt-1 text-sm text-secondary">
              Đặt lúc {formatDateTime(order.createdAt)}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getOrderStatusClass(
              order.orderStatus
            )}`}
          >
            {getOrderStatusLabel(order.orderStatus)}
          </span>
        </div>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface">
              Sản phẩm trong đơn
            </h2>

            <div className="mt-4 divide-y divide-surface-container-high">
              {orderItems.length === 0 ? (
                <p className="py-4 text-sm text-secondary">
                  Chưa có dữ liệu sản phẩm trong đơn.
                </p>
              ) : (
                orderItems.map((item, index) => (
                  <div
                    key={`${item.orderDetailId || item.detailId || index}-${item.variantId}`}
                    className="flex gap-4 py-4"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName || item.name || "Sản phẩm"}
                          className="h-full w-full object-contain"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-on-surface">
                        {item.productName || item.name || `Product #${item.productId}`}
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        {[item.color, item.capacity, item.ram]
                          .filter(Boolean)
                          .join(" · ") || item.sku || "—"}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-secondary">
                          {formatPrice(item.price)} x {item.quantity}
                        </span>

                        <span className="font-bold text-primary">
                          {formatPrice(
                            item.lineTotal ||
                              item.totalPrice ||
                              Number(item.price || 0) * Number(item.quantity || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface">
              Thông tin thanh toán
            </h2>

            {transactions.length === 0 ? (
              <p className="mt-4 text-sm text-secondary">
                Chưa có giao dịch thanh toán.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.transactionId}
                    className="rounded-2xl border border-surface-container-high p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold text-on-surface">
                          {transaction.gateway || "Payment"}
                        </p>

                        <p className="mt-1 text-sm text-secondary">
                          Ref: {transaction.transactionRef || "—"}
                        </p>

                        <p className="mt-1 text-sm text-secondary">
                          Paid at: {formatDateTime(transaction.paidAt)}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="font-bold text-primary">
                          {formatPrice(transaction.amount)}
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusClass(
                            transaction.status
                          )}`}
                        >
                          {getPaymentStatusLabel(transaction.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface">
              Thông tin vận chuyển
            </h2>

            {shipments.length === 0 ? (
              <p className="mt-4 text-sm text-secondary">
                Đơn hàng chưa có thông tin vận chuyển.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {shipments.map((shipment) => {
                  const history = getShipmentHistory(shipment);

                  return (
                    <div
                      key={shipment.shipmentId}
                      className="rounded-2xl border border-surface-container-high p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-on-surface">
                            {shipment.shippingProvider || "Đơn vị vận chuyển"}
                          </p>

                          <p className="mt-1 text-sm text-secondary">
                            Mã vận đơn: {shipment.trackingCode || "—"}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${getShipmentStatusClass(
                            shipment.status
                          )}`}
                        >
                          {getShipmentStatusLabel(shipment.status)}
                        </span>
                      </div>

                      {history.length > 0 ? (
                        <div className="mt-4 space-y-4 border-t border-outline-variant pt-4">
                          {history.map((item, index) => (
                            <div
                              key={`${item.shipmentHistoryId || item.historyId || index}-${item.status}`}
                              className="flex gap-3"
                            >
                              <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-primary" />

                              <div>
                                <p className="text-sm font-bold text-on-surface">
                                  {getShipmentStatusLabel(item.status)}
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
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface">
              Lịch sử trạng thái đơn
            </h2>

            {orderHistory.length === 0 ? (
              <p className="mt-4 text-sm text-secondary">
                Chưa có lịch sử trạng thái.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {orderHistory.map((item, index) => (
                  <div
                    key={`${item.orderStatusHistoryId || item.historyId || index}-${item.status}`}
                    className="flex gap-3"
                  >
                    <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-primary" />

                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {getOrderStatusLabel(item.status)}
                      </p>

                      <p className="mt-0.5 text-xs text-secondary">
                        {formatDateTime(item.createdAt || item.updatedAt)}
                      </p>

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
          </section>
        </div>

        <aside className="h-fit space-y-5 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface">
              Tóm tắt đơn hàng
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-secondary">Tạm tính</span>
                <span className="font-semibold text-on-surface">
                  {formatPrice(order.subTotal ?? order.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-secondary">Phí vận chuyển</span>
                <span className="font-semibold text-on-surface">
                  {formatPrice(order.shippingFee)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-secondary">Giảm giá</span>
                <span className="font-semibold text-on-surface">
                  -{formatPrice(order.discountAmount)}
                </span>
              </div>

              {order.voucherCode ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-secondary">Voucher</span>
                  <span className="font-semibold text-primary">
                    {order.voucherCode}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 border-t border-outline-variant pt-3">
                <span className="font-bold text-on-surface">Tổng tiền</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {order.orderStatus === "PendingPayment" ? (
                <Link
                  href={`/checkout/payment?orderId=${order.orderId}`}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary"
                >
                  Thanh toán ngay
                </Link>
              ) : null}

              {canCancelOrder(order.orderStatus) ? (
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                </button>
              ) : null}

              <Link
                href="/orders"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary px-5 text-sm font-semibold text-primary"
              >
                Quay lại danh sách
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface">
              Thông tin nhận hàng
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-secondary">Người nhận</p>
                <p className="mt-1 font-semibold text-on-surface">
                  {order.customerName || "—"}
                </p>
              </div>

              <div>
                <p className="text-secondary">Số điện thoại</p>
                <p className="mt-1 font-semibold text-on-surface">
                  {order.customerPhone || "—"}
                </p>
              </div>

              <div>
                <p className="text-secondary">Địa chỉ</p>
                <p className="mt-1 leading-6 font-semibold text-on-surface">
                  {order.shippingAddress || "—"}
                </p>
              </div>

              <div>
                <p className="text-secondary">Phương thức thanh toán</p>
                <p className="mt-1 font-semibold text-on-surface">
                  {order.paymentMethod || "—"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}