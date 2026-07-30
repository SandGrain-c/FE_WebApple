"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <section className="rounded-[28px] border border-surface-container-high bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
          <span className="material-symbols-outlined text-4xl">check</span>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-on-surface">
          Đặt hàng thành công
        </h1>

        <p className="mt-3 text-sm leading-6 text-secondary">
          Đơn hàng của bạn đã được ghi nhận và đang chờ xác nhận.
        </p>

        {orderId ? (
          <p className="mt-4 rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface">
            Mã đơn tạm thời: #{orderId}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/orders"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary"
          >
            Xem đơn hàng
          </Link>

          <Link
            href="/iphone"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary px-5 text-sm font-semibold text-primary"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </section>
    </main>
  );
}
