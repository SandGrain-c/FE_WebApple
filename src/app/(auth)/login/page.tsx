import { Suspense } from "react";

import LoginPageClient from "@/components/auth/LoginPageClient";

function LoginPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-on-surface">
      Đang tải biểu mẫu...
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}
