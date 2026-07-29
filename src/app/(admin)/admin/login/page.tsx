// src/app/(admin)/admin/login/page.tsx

import { Suspense } from "react";

import AdminLoginPageClient from "@/components/admin/auth/AdminLoginPageClient";

function AdminLoginPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-on-surface">
      Đang tải biểu mẫu...
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginPageFallback />}>
      <AdminLoginPageClient />
    </Suspense>
  );
}
