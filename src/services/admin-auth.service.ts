// src/services/admin-auth.service.ts

import type {
  AdminAuthApiResponse,
  AdminGetMeResponseData,
  AdminLoginPayload,
  AdminLoginResponseData,
} from "@/types/admin-auth.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

/**
 * Parse response chung cho Admin API.
 * Nếu BE trả lỗi hoặc success=false thì ném Error để store xử lý.
 */
async function parseAdminApiResponse<T>(
  response: Response
): Promise<AdminAuthApiResponse<T>> {
  const data = (await response.json()) as AdminAuthApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

/**
 * Đăng nhập trang quản trị.
 * API: POST /api/admin/auth/login
 */
export async function adminLogin(
  payload: AdminLoginPayload
): Promise<AdminLoginResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await parseAdminApiResponse<AdminLoginResponseData>(response);

  return result.data;
}

/**
 * Lấy thông tin admin hiện tại từ token.
 * API: GET /api/admin/auth/me
 */
export async function adminGetMe(
  adminAccessToken: string
): Promise<AdminGetMeResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
  });

  const result = await parseAdminApiResponse<AdminGetMeResponseData>(response);

  return result.data;
}