// src/components/admin/layout/AdminHeader.tsx

"use client";

import { useRouter } from "next/navigation";

import AdminNotificationBadge from "@/components/admin/notifications/AdminNotificationBadge";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import { useAdminNotificationStore } from "@/store/admin-notification.store";

type AdminHeaderProps = {
  onOpenSidebar: () => void;
};

export default function AdminHeader({ onOpenSidebar }: AdminHeaderProps) {
  const router = useRouter();

  const adminUser = useAdminAuthStore((state) => state.adminUser);
  const logout = useAdminAuthStore((state) => state.logout);

  const notificationSummary = useAdminNotificationStore(
    (state) => state.summary
  );
  const fetchNotificationSummary = useAdminNotificationStore(
    (state) => state.fetchSummary
  );
  const resetNotificationSummary = useAdminNotificationStore(
    (state) => state.resetSummary
  );
  const isNotificationLoading = useAdminNotificationStore(
    (state) => state.isLoading
  );

  async function handleLogout() {
    resetNotificationSummary();
    await logout();
    router.replace("/admin/login");
  }

  async function handleRefreshNotifications() {
    await fetchNotificationSummary();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-surface-container-high bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white text-on-surface transition hover:border-primary hover:text-primary lg:hidden"
            aria-label="Mở menu quản trị"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Dashboard
            </p>

            <h1 className="truncate text-lg font-bold text-on-surface sm:text-xl">
              Quản trị hệ thống bán hàng
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefreshNotifications}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white text-on-surface transition hover:border-primary hover:text-primary"
            aria-label="Làm mới thông báo admin"
            title="Làm mới thông báo"
          >
            <span
              className={`material-symbols-outlined text-xl ${
                isNotificationLoading ? "animate-spin" : ""
              }`}
            >
              {isNotificationLoading ? "progress_activity" : "notifications"}
            </span>

            <span className="absolute -right-1 -top-1">
              <AdminNotificationBadge
                value={notificationSummary?.totalBadge || 0}
                size="md"
              />
            </span>
          </button>

          <div className="hidden text-right sm:block">
            <p className="max-w-[220px] truncate text-sm font-bold text-on-surface">
              {adminUser?.fullName || adminUser?.userName || "Admin"}
            </p>

            <p className="text-xs text-secondary">
              {adminUser?.role || "Admin"}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary">
            <span className="material-symbols-outlined text-xl">
              account_circle
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden h-11 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary sm:inline-flex"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}