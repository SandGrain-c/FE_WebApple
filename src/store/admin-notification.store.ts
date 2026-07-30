import { create } from "zustand";

import { getAdminNotificationSummary } from "@/services/admin-notification.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type { AdminNotificationSummary } from "@/types/admin-notification.type";

type AdminNotificationState = {
  summary: AdminNotificationSummary | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: string | null;

  fetchSummary: () => Promise<{
    success: boolean;
    message: string;
  }>;

  resetSummary: () => void;
  clearError: () => void;
};

function getEmptySummary(): AdminNotificationSummary {
  return {
    orders: {
      pendingPayment: 0,
      pendingConfirmation: 0,
      confirmed: 0,
      processing: 0,
      shipping: 0,
      newOrders: 0,
    },
    payments: {
      pending: 0,
      pendingCOD: 0,
      pendingOnlineBanking: 0,
      successToday: 0,
    },
    shipments: {
      pending: 0,
      preparing: 0,
      shipped: 0,
      inTransit: 0,
      failed: 0,
      needAction: 0,
    },
    reviews: {
      hidden: 0,
    },
    totalBadge: 0,
  };
}

function getAdminAccessTokenOrThrow() {
  const adminAccessToken = useAdminAuthStore.getState().adminAccessToken;

  if (!adminAccessToken) {
    throw new Error("Bạn cần đăng nhập Admin.");
  }

  return adminAccessToken;
}

function handleAdminNotificationError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Không thể lấy thông báo admin.";

  const shouldLogout =
    message.includes("Unauthorized") ||
    message.includes("401") ||
    message.includes("403");

  if (shouldLogout) {
    useAdminAuthStore.getState().logout();
  }

  return message;
}

export const useAdminNotificationStore = create<AdminNotificationState>(
  (set) => ({
    summary: getEmptySummary(),
    isLoading: false,
    error: null,
    lastFetchedAt: null,

    fetchSummary: async () => {
      try {
        set({
          isLoading: true,
          error: null,
        });

        const adminAccessToken = getAdminAccessTokenOrThrow();
        const summary = await getAdminNotificationSummary(adminAccessToken);
        
        set({
          summary,
          isLoading: false,
          error: null,
          lastFetchedAt: new Date().toISOString(),
        });

        return {
          success: true,
          message: "Lấy thông báo admin thành công.",
        };
      } catch (error) {
        const message = handleAdminNotificationError(error);

        set({
          isLoading: false,
          error: message,
        });

        return {
          success: false,
          message,
        };
      }
    },
    

    resetSummary: () => {
      set({
        summary: getEmptySummary(),
        isLoading: false,
        error: null,
        lastFetchedAt: null,
      });
    },

    clearError: () => {
      set({
        error: null,
      });
    },
  })
);