import { Suspense } from "react";

import RegisterPageClient from "@/components/auth/RegisterPageClient";

function RegisterPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-on-surface">
      Đang tải biểu mẫu...
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageClient />
    </Suspense>
  );
}
