import { Suspense } from "react";

import CheckoutPaymentSuccessClient from "./CheckoutPaymentSuccessClient";

function CheckoutPaymentSuccessFallback() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[28px] border border-surface-container-high bg-white p-8 text-center text-on-surface shadow-sm">
        Đang xử lý thông tin thanh toán...
      </div>
    </main>
  );
}

export default function CheckoutPaymentSuccessPage() {
  return (
    <Suspense fallback={<CheckoutPaymentSuccessFallback />}>
      <CheckoutPaymentSuccessClient />
    </Suspense>
  );
}
