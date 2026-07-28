// src/app/(admin)/admin/login/page.tsx

import { Suspense } from "react";

import AdminLoginPageClient from "@/components/admin/auth/AdminLoginPageClient";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginPageClient />
    </Suspense>
  );
}