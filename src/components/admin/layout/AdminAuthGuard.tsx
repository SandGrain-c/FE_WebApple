// src/components/admin/layout/AdminAuthGuard.tsx

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAdminAuthStore } from "@/store/admin-auth.store";

type AdminAuthGuardProps = {
  children: React.ReactNode;
};

/**
 * AdminAuthGuard bảo vệ các trang /admin cần đăng nhập.
 * Nếu chưa có admin token, chuyển về /admin/login.
 */
export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const adminAccessToken = useAdminAuthStore((state) => state.adminAccessToken);
  const isAdminAuthenticated = useAdminAuthStore(
    (state) => state.isAdminAuthenticated
  );
  const hasHydrated = useAdminAuthStore((state) => state.hasHydrated);
  const getMe = useAdminAuthStore((state) => state.getMe);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAdminAuthenticated || !adminAccessToken) {
      const redirectPath = pathname || "/admin";

      router.replace(
        `/admin/login?redirect=${encodeURIComponent(redirectPath)}`
      );
      return;
    }

    let isMounted = true;

    async function verifyAdminSession() {
      const result = await getMe();

      if (!isMounted) {
        return;
      }

      if (!result.success) {
        const redirectPath = pathname || "/admin";

        router.replace(
          `/admin/login?redirect=${encodeURIComponent(redirectPath)}`
        );
        return;
      }

      setIsCheckingAuth(false);
    }

    verifyAdminSession();

    return () => {
      isMounted = false;
    };
  }, [
    hasHydrated,
    isAdminAuthenticated,
    adminAccessToken,
    pathname,
    router,
    getMe,
  ]);

  if (!hasHydrated || isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7]">
        <div className="flex items-center gap-3 rounded-2xl border border-surface-container-high bg-white px-5 py-4 text-sm font-semibold text-on-surface shadow-sm">
          <span className="material-symbols-outlined animate-spin text-xl text-primary">
            progress_activity
          </span>
          Đang kiểm tra phiên đăng nhập Admin...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}