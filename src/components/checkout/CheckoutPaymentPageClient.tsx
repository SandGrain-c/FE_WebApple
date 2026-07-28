"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  createCustomerPayOSPaymentLink,
  getCustomerPayOSPaymentStatus,
} from "@/services/customer-payment-transaction.service";
import { useAuthStore } from "@/store/auth.store";
import type { CustomerPayOSStatusResponseData } from "@/types/customer-payment-transaction.type";
import type { PayOSPaymentLinkDto } from "@/types/order.type";

const PAYMENT_POLLING_INTERVAL = 5000;

function formatPrice(price: number) {
  return `${Number(price || 0).toLocaleString("vi-VN")}₫`;
}

function getPaymentSessionKey(orderId: number) {
  return `checkout-payment-${orderId}`;
}

function readPaymentFromSession(orderId: number) {
  const rawPayment = sessionStorage.getItem(getPaymentSessionKey(orderId));

  if (!rawPayment) {
    return null;
  }

  try {
    return JSON.parse(rawPayment) as PayOSPaymentLinkDto;
  } catch {
    return null;
  }
}

function savePaymentToSession(orderId: number, payment: PayOSPaymentLinkDto) {
  sessionStorage.setItem(getPaymentSessionKey(orderId), JSON.stringify(payment));
}
function removePaymentFromSession(orderId: number) {
  sessionStorage.removeItem(getPaymentSessionKey(orderId));
}
function isFinalPaymentStatus(status: string | null | undefined) {
  return ["Success", "Failed", "Cancelled"].includes(status || "");
}

function getStatusLabel(status: string | null | undefined) {
  const statusMap: Record<string, string> = {
    Pending: "Đang chờ thanh toán",
    Success: "Thanh toán thành công",
    Failed: "Thanh toán thất bại",
    Cancelled: "Đã hủy thanh toán",
  };

  return statusMap[status || ""] || status || "Đang kiểm tra";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "Success") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Failed" || status === "Cancelled") {
    return "bg-red-50 text-red-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function getQrImageSrc(qrCode: string) {
  if (qrCode.startsWith("data:image") || qrCode.startsWith("http")) {
    return qrCode;
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    qrCode
  )}`;
}

export default function CheckoutPaymentPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const orderIdParam = searchParams.get("orderId");
  const orderId = useMemo(() => Number(orderIdParam || 0), [orderIdParam]);

  const redirectTimeoutRef = useRef<number | null>(null);

  const [payment, setPayment] = useState<PayOSPaymentLinkDto | null>(null);
  const [paymentStatusData, setPaymentStatusData] =
    useState<CustomerPayOSStatusResponseData | null>(null);

  const [isLoadingLink, setIsLoadingLink] = useState(true);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [copiedQr, setCopiedQr] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const currentPaymentStatus =
    paymentStatusData?.paymentStatus ||
    paymentStatusData?.transaction?.status ||
    payment?.status ||
    "Pending";
  const currentOrderStatus = paymentStatusData?.orderStatus || null;

const isPaymentSuccess = currentPaymentStatus === "Success";

const isPaymentCancelled =
  currentPaymentStatus === "Cancelled" || currentOrderStatus === "Cancelled";

const isPaymentFailed = currentPaymentStatus === "Failed";

const canPay =
  !isPaymentSuccess && !isPaymentCancelled && !isPaymentFailed;

  const transaction = paymentStatusData?.transaction || null;

  const amount =
    payment?.amount ||
    transaction?.amount ||
    paymentStatusData?.payment?.amount ||
    0;

  const checkoutUrl =
    payment?.checkoutUrl || paymentStatusData?.payment?.checkoutUrl || null;

  const qrCode = payment?.qrCode || paymentStatusData?.payment?.qrCode || null;

  const handlePaymentSuccess = useCallback(() => {
    if (redirectTimeoutRef.current) {
      return;
    }

    setShowSuccessModal(true);

    redirectTimeoutRef.current = window.setTimeout(() => {
      router.replace(`/checkout/payment-success?orderId=${orderId}`);
    }, 1500);
  }, [orderId, router]);

  const loadPaymentLink = useCallback(
  async (mode: "initial" | "manual" = "initial") => {
    if (!accessToken || !orderId) {
      return;
    }

    try {
      if (mode === "manual") {
        setIsCreatingLink(true);
      } else {
        setIsLoadingLink(true);
      }

      setError(null);

      const statusData = await getCustomerPayOSPaymentStatus(
        orderId,
        accessToken
      );

      setPaymentStatusData(statusData);

      const nextStatus =
        statusData.paymentStatus ||
        statusData.transaction?.status ||
        statusData.payment?.status;

      if (nextStatus === "Success") {
        handlePaymentSuccess();
        return;
      }

      if (
        nextStatus === "Cancelled" ||
        nextStatus === "Failed" ||
        statusData.orderStatus === "Cancelled"
      ) {
        removePaymentFromSession(orderId);
        setPayment(null);
        return;
      }

      const sessionPayment = readPaymentFromSession(orderId);

      if (sessionPayment) {
        setPayment(sessionPayment);
      }

      const data = await createCustomerPayOSPaymentLink(orderId, accessToken);

      setPayment(data.payment);
      savePaymentToSession(orderId, data.payment);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể lấy link thanh toán.";

      setError(message);
    } finally {
      setIsLoadingLink(false);
      setIsCreatingLink(false);
    }
  },
  [accessToken, orderId, handlePaymentSuccess]
);

  const checkPaymentStatus = useCallback(
    async (silent = false) => {
      if (!accessToken || !orderId) {
        return null;
      }

      try {
        if (!silent) {
          setIsCheckingStatus(true);
        }

        const data = await getCustomerPayOSPaymentStatus(orderId, accessToken);

        setPaymentStatusData(data);

        if (data.payment) {
          setPayment(data.payment);
          savePaymentToSession(orderId, data.payment);
        }

        const nextStatus =
          data.paymentStatus || data.transaction?.status || data.payment?.status;

        if (nextStatus === "Success") {
          handlePaymentSuccess();
        }
        if (
  nextStatus === "Cancelled" ||
  nextStatus === "Failed" ||
  data.orderStatus === "Cancelled"
) {
  removePaymentFromSession(orderId);
}
        return nextStatus || null;
      } catch (error) {
        if (!silent) {
          const message =
            error instanceof Error
              ? error.message
              : "Không thể kiểm tra trạng thái thanh toán.";

          setError(message);
        }

        return null;
      } finally {
        if (!silent) {
          setIsCheckingStatus(false);
        }
      }
    },
    [accessToken, orderId, handlePaymentSuccess]
  );

  async function handleCopyQrCode() {
    if (!qrCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(qrCode);
      setCopiedQr(true);

      window.setTimeout(() => {
        setCopiedQr(false);
      }, 2000);
    } catch {
      setCopiedQr(false);
    }
  }

  useEffect(() => {
    if (!orderId) {
      router.replace("/cart");
      return;
    }

    if (!accessToken || !isAuthenticated) {
      router.replace(`/login?redirect=/checkout/payment?orderId=${orderId}`);
      return;
    }

    loadPaymentLink("initial");
  }, [accessToken, isAuthenticated, loadPaymentLink, orderId, router]);

  useEffect(() => {
    if (!accessToken || !orderId) {
      return;
    }

    checkPaymentStatus(true);
  }, [accessToken, orderId, checkPaymentStatus]);

  useEffect(() => {
    if (
  !accessToken ||
  !orderId ||
  isFinalPaymentStatus(currentPaymentStatus) ||
  currentOrderStatus === "Cancelled"
) {
  return;
}

    const intervalId = window.setInterval(() => {
      checkPaymentStatus(true);
    }, PAYMENT_POLLING_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [accessToken, orderId, currentPaymentStatus, checkPaymentStatus]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  if (!orderId) {
    return null;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {showSuccessModal ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-[min(92vw,520px)] rounded-[28px] border border-green-200 bg-white p-6 text-center shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
              <span className="material-symbols-outlined text-4xl">check</span>
            </div>

            <h2 className="mt-5 text-2xl font-bold text-on-surface">
              Thanh toán thành công
            </h2>

            <p className="mt-3 text-sm leading-6 text-secondary">
              Đơn hàng của bạn đang chờ xác nhận. Hệ thống sẽ chuyển sang trang
              thành công trong giây lát.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              <span className="material-symbols-outlined animate-spin text-lg">
                progress_activity
              </span>
              Đang chuyển trang...
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <p className="text-sm text-secondary">
          <Link href="/cart" className="hover:text-primary">
            Giỏ hàng
          </Link>{" "}
          /{" "}
          <Link href="/checkout" className="hover:text-primary">
            Thanh toán
          </Link>{" "}
          / Online Banking
        </p>

        <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
          Thanh toán Online Banking
        </h1>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}
      {isPaymentCancelled ? (
  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
    <p className="font-bold">Đơn hàng đã bị hủy</p>
    <p className="mt-1">
      Đơn Online Banking này đã bị hủy do quá thời gian thanh toán hoặc do hệ
      thống xác nhận thanh toán đã bị hủy. Vui lòng đặt hàng lại nếu bạn vẫn
      muốn mua sản phẩm.
    </p>
  </div>
) : null}

{isPaymentFailed ? (
  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
    <p className="font-bold">Thanh toán thất bại</p>
    <p className="mt-1">
      Giao dịch không thành công. Bạn có thể kiểm tra lại đơn hàng hoặc đặt lại
      đơn mới.
    </p>
  </div>
) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  PayOS / VietQR
                </p>

                <h2 className="mt-2 text-xl font-bold text-on-surface">
                  Quét mã để thanh toán
                </h2>

                <p className="mt-2 text-sm leading-6 text-secondary">
                  Sau khi thanh toán thành công, hệ thống sẽ tự kiểm tra mỗi 5
                  giây và chuyển bạn sang trang thành công.
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                  currentPaymentStatus
                )}`}
              >
                {getStatusLabel(currentPaymentStatus)}
              </span>
            </div>

            <div className="mt-6 flex flex-col items-center rounded-3xl border border-surface-container-high bg-surface-container-lowest p-5">
              {isLoadingLink ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                    progress_activity
                  </span>
                  <p className="mt-3 font-semibold text-on-surface">
                    Đang lấy mã thanh toán...
                  </p>
                </div>
              ) : !canPay ? (
  <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
    <span className="material-symbols-outlined text-5xl text-red-500">
      timer_off
    </span>
    <p className="mt-3 font-semibold text-on-surface">
      Mã thanh toán không còn hiệu lực
    </p>
    <p className="mt-1 max-w-md text-sm leading-6 text-secondary">
      Đơn hàng đã kết thúc hoặc bị hủy. Vui lòng kiểm tra lại trong mục đơn hàng
      hoặc đặt hàng lại.
    </p>
  </div>
) : qrCode ? (
                <>
                  <div className="rounded-3xl border border-surface-container-high bg-white p-4">
                    <img
                      src={getQrImageSrc(qrCode)}
                      alt="QR thanh toán PayOS"
                      className="h-[260px] w-[260px] object-contain"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyQrCode}
                    className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-lg">
                      content_copy
                    </span>
                    {copiedQr ? "Đã copy mã QR" : "Copy dữ liệu QR"}
                  </button>
                </>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-5xl text-secondary">
                    qr_code_2
                  </span>
                  <p className="mt-3 font-semibold text-on-surface">
                    Chưa có dữ liệu QR
                  </p>
                  <p className="mt-1 text-sm text-secondary">
                    Bấm “Lấy lại mã thanh toán” để thử lại.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {checkoutUrl && canPay ? (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-xl">
                    open_in_new
                  </span>
                  Mở trang thanh toán
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => checkPaymentStatus(false)}
                disabled={isCheckingStatus}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-surface-container-lowest disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCheckingStatus ? (
                  <span className="material-symbols-outlined animate-spin text-xl">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-xl">
                    refresh
                  </span>
                )}
                Kiểm tra thanh toán
              </button>
              {canPay ? (
              <button
                type="button"
                onClick={() => loadPaymentLink("manual")}
                disabled={isCreatingLink}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingLink ? (
                  <span className="material-symbols-outlined animate-spin text-xl">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-xl">
                    qr_code
                  </span>
                )}
                Lấy lại mã
              </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
            Không đóng trang này trong lúc thanh toán. Nếu đã thanh toán nhưng
            trạng thái chưa đổi ngay, hệ thống sẽ tự kiểm tra lại mỗi 5 giây.
          </div>
        </div>

        <aside className="h-fit rounded-[28px] border border-surface-container-high bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-on-surface">
            Thông tin đơn hàng
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-secondary">Order ID</span>
              <span className="font-bold text-on-surface">#{orderId}</span>
            </div>

            {payment?.orderCode || paymentStatusData?.orderCode ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-secondary">Mã đơn</span>
                <span className="font-bold text-on-surface">
                  {payment?.orderCode || paymentStatusData?.orderCode}
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-4">
              <span className="text-secondary">Số tiền</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(amount)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-secondary">Trạng thái thanh toán</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                  currentPaymentStatus
                )}`}
              >
                {getStatusLabel(currentPaymentStatus)}
              </span>
            </div>

            {paymentStatusData?.orderStatus ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-secondary">Trạng thái đơn</span>
                <span className="font-semibold text-on-surface">
                  {paymentStatusData.orderStatus}
                </span>
              </div>
            ) : null}

            {transaction?.transactionRef ? (
              <div className="border-t border-outline-variant pt-4">
                <p className="text-secondary">Mã giao dịch</p>
                <p className="mt-1 break-all font-semibold text-on-surface">
                  {transaction.transactionRef}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3">
            <Link
              href="/orders"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-surface-container-lowest"
            >
              Xem đơn hàng
            </Link>

            <Link
              href="/iphone"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}