"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAdminAuthStore } from "@/store/admin-auth.store";
import { useAdminNotificationStore } from "@/store/admin-notification.store";

const ADMIN_NOTIFICATION_REFRESH_INTERVAL = 30_000;

type AdminNotificationProviderProps = {
  children: React.ReactNode;
};

export default function AdminNotificationProvider({
  children,
}: AdminNotificationProviderProps) {
  const pathname = usePathname();

  const isAdminAuthenticated = useAdminAuthStore(
    (state) => state.isAdminAuthenticated
  );
  const adminAccessToken = useAdminAuthStore((state) => state.adminAccessToken);

  const fetchSummary = useAdminNotificationStore(
    (state) => state.fetchSummary
  );
  const resetSummary = useAdminNotificationStore((state) => state.resetSummary);

  useEffect(() => {
    if (!adminAccessToken || !isAdminAuthenticated) {
      resetSummary();
      return;
    }

    fetchSummary();

    const intervalId = window.setInterval(() => {
      fetchSummary();
    }, ADMIN_NOTIFICATION_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    adminAccessToken,
    isAdminAuthenticated,
    fetchSummary,
    resetSummary,
  ]);

  /**
   * Mỗi lần chuyển trang admin thì refresh nhẹ một lần.
   * Ví dụ xử lý đơn xong quay lại sidebar sẽ cập nhật badge nhanh hơn.
   */
  useEffect(() => {
    if (!adminAccessToken || !isAdminAuthenticated) {
      return;
    }

    fetchSummary();
  }, [pathname, adminAccessToken, isAdminAuthenticated, fetchSummary]);

  return <>{children}</>;
}