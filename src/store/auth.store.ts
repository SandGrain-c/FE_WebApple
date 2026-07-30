import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthUser, RegisterPayload } from "@/types/auth.type";
import {
  getMe as getMeRequest,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "@/services/auth.service";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  isLoading: boolean;
  error: string | null;

  register: (payload: RegisterPayload) => Promise<{
    success: boolean;
    message: string;
  }>;

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
};

function clearAuthState() {
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      isLoading: false,
      error: null,

      register: async (payload) => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const data = await registerRequest(payload);

          set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            message: "Đăng ký tài khoản thành công.",
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Đăng ký thất bại.";

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });

          return {
            success: false,
            message,
          };
        }
      },

      login: async (identifier, password) => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const data = await loginRequest({
            identifier,
            password,
          });

          set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            message: "Đăng nhập thành công.",
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Đăng nhập thất bại.";

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });

          return {
            success: false,
            message,
          };
        }
      },

      logout: async () => {
        const accessToken = get().accessToken;

        try {
          set({
            isLoading: true,
            error: null,
          });

          if (accessToken) {
            await logoutRequest(accessToken);
          }

          set(clearAuthState());

          return {
            success: true,
            message: "Đăng xuất thành công.",
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Đăng xuất thất bại.";

          /**
           * BE logout hiện là stateless JWT, nên dù API logout lỗi,
           * FE vẫn nên xóa user/token để người dùng thoát tài khoản.
           */
          set(clearAuthState());

          return {
            success: false,
            message,
          };
        }
      },

      getMe: async () => {
        const accessToken = get().accessToken;

        if (!accessToken) {
          set(clearAuthState());

          return {
            success: false,
            message: "Bạn chưa đăng nhập.",
          };
        }

        try {
          set({
            isLoading: true,
            error: null,
          });

          const data = await getMeRequest(accessToken);

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            message: "Lấy thông tin người dùng thành công.",
          };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Không thể lấy thông tin người dùng.";

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
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
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);