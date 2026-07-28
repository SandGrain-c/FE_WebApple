import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AdminAllowedRole,
  AdminUser,
} from "@/types/admin-auth.type";
import {
  adminGetMe as adminGetMeRequest,
  adminLogin as adminLoginRequest,
} from "@/services/admin-auth.service";

const ADMIN_ALLOWED_ROLES: AdminAllowedRole[] = [
  "Admin",
  "Staff",
  "SaleStaff",
  "WarehouseStaff",
  "AfterSalesStaff",
];

type AdminAuthState = {
  adminUser: AdminUser | null;
  adminAccessToken: string | null;
  isAdminAuthenticated: boolean;

  isLoading: boolean;
  error: string | null;

  /**
   * Dùng để biết Zustand đã load localStorage xong chưa.
   * Tránh redirect sai khi vừa F5 trang Admin.
   */
  hasHydrated: boolean;

  login: (
    identifier: string,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;

  logout: () => Promise<{
    success: boolean;
    message: string;
  }>;

  getMe: () => Promise<{
    success: boolean;
    message: string;
  }>;

  clearError: () => void;
  setHasHydrated: (value: boolean) => void;
};

function isAllowedAdminRole(role: string) {
  return ADMIN_ALLOWED_ROLES.includes(role as AdminAllowedRole);
}

function clearAdminAuthState() {
  return {
    adminUser: null,
    adminAccessToken: null,
    isAdminAuthenticated: false,
    isLoading: false,
    error: null,
  };
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      adminUser: null,
      adminAccessToken: null,
      isAdminAuthenticated: false,

      isLoading: false,
      error: null,
      hasHydrated: false,

      login: async (identifier, password) => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const data = await adminLoginRequest({
            identifier,
            password,
          });

          /**
           * FE kiểm tra thêm role để an toàn.
           * BE đã chặn Customer, nhưng FE vẫn nên có lớp bảo vệ phụ.
           */
          if (!isAllowedAdminRole(data.user.role)) {
            throw new Error("Tài khoản không có quyền truy cập trang quản trị.");
          }

          set({
            adminUser: data.user,
            adminAccessToken: data.accessToken,
            isAdminAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            message: "Đăng nhập quản trị thành công.",
          };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Đăng nhập quản trị thất bại.";

          set({
            ...clearAdminAuthState(),
            error: message,
          });

          return {
            success: false,
            message,
          };
        }
      },

      logout: async () => {
        /**
         * Admin API hiện chưa có logout riêng.
         * JWT đang stateless, nên FE chỉ cần xóa token khỏi localStorage.
         */
        set(clearAdminAuthState());

        return {
          success: true,
          message: "Đăng xuất quản trị thành công.",
        };
      },

      getMe: async () => {
        const adminAccessToken = get().adminAccessToken;

        if (!adminAccessToken) {
          set(clearAdminAuthState());

          return {
            success: false,
            message: "Bạn chưa đăng nhập trang quản trị.",
          };
        }

        try {
          set({
            isLoading: true,
            error: null,
          });

          const data = await adminGetMeRequest(adminAccessToken);

          if (!isAllowedAdminRole(data.user.role)) {
            throw new Error("Tài khoản không có quyền truy cập trang quản trị.");
          }

          set({
            adminUser: data.user,
            isAdminAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            message: "Lấy thông tin quản trị viên thành công.",
          };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Không thể lấy thông tin quản trị viên.";

          set({
            ...clearAdminAuthState(),
            error: message,
          });

          return {
            success: false,
            message,
          };
        }
      },

      clearError: () => {
        set({
          error: null,
        });
      },

      setHasHydrated: (value) => {
        set({
          hasHydrated: value,
        });
      },
    }),
    {
      name: "admin-auth-storage",
      partialize: (state) => ({
        adminUser: state.adminUser,
        adminAccessToken: state.adminAccessToken,
        isAdminAuthenticated: state.isAdminAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);