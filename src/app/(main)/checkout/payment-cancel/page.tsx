"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutPaymentCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <section className="rounded-[28px] border border-surface-container-high bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 text-yellow-700">
          <span className="material-symbols-outlined text-4xl">warning</span>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-on-surface">
          Thanh toán chưa hoàn tất
        </h1>

        <p className="mt-3 text-sm leading-6 text-secondary">
          Bạn đã hủy hoặc chưa hoàn thành thanh toán. Có thể quay lại trang
          thanh toán để lấy lại mã VietQR.
        </p>

        {orderId ? (
          <p className="mt-4 rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
            Order ID: #{orderId}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderId ? (
            <Link
              href={`/checkout/payment?orderId=${orderId}`}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary"
            >
              Thanh toán lại
            </Link>
          ) : null}

          <Link
            href="/orders"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary px-5 text-sm font-semibold text-primary"
          >
            Xem đơn hàng
          </Link>
        </div>
      </section>
    </main>
  );
}