// src/types/admin-auth.type.ts

import type { ApiResponse, AuthUser, LoginPayload, UserRole } from "@/types/auth.type";

export type AdminAllowedRole = Exclude<UserRole, "Customer">;

export type AdminUser = AuthUser;

export type AdminLoginPayload = LoginPayload;

export type AdminLoginResponseData = {
  user: AdminUser;
  accessToken: string;
};

export type AdminGetMeResponseData = {
  user: AdminUser;
};

export type AdminAuthApiResponse<T> = ApiResponse<T>;