import { Suspense } from "react";

import CheckoutPaymentPageClient from "@/components/checkout/CheckoutPaymentPageClient";

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border border-surface-container-high bg-white p-8 text-center shadow-sm">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">
              progress_activity
            </span>
            <p className="mt-3 font-semibold text-on-surface">
              Đang tải trang thanh toán...
            </p>
          </div>
        </main>
      }
    >
      <CheckoutPaymentPageClient />
    </Suspense>
  );
}