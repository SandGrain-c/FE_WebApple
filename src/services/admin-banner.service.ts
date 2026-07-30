// src/services/admin-banner.service.ts

import type {
  AdminBanner,
  AdminBannerApiResponse,
  AdminBannerListQuery,
  AdminBannerListResponseData,
  AdminBannerMutationResponseData,
  CreateAdminBannerPayload,
  UpdateAdminBannerPayload,
} from "@/types/admin-banner.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

/**
 * Parse response chung cho Admin Banner API.
 * Nếu BE trả lỗi thì ném Error để component xử lý.
 */
async function parseAdminBannerResponse<T>(
  response: Response
): Promise<AdminBannerApiResponse<T>> {
  const data = (await response.json()) as AdminBannerApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildBannerQueryString(query?: AdminBannerListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.position) {
    searchParams.set("position", query.position);
  }

  if (typeof query.isActive === "boolean") {
    searchParams.set("isActive", String(query.isActive));
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

function appendOptionalFormValue(
  formData: FormData,
  key: string,
  value: string | number | boolean | null | undefined
) {
  if (value === undefined || value === null) {
    return;
  }

  formData.append(key, String(value));
}

function normalizeBannerListData(data: unknown): AdminBannerListResponseData {
  if (Array.isArray(data)) {
    return data as AdminBanner[];
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: AdminBanner[] }).items;
  }

  return [];
}

function normalizeBannerMutationData(
  data: unknown
): AdminBannerMutationResponseData {
  if (data && typeof data === "object" && "banner" in data) {
    return data as AdminBannerMutationResponseData;
  }

  return {
    banner: data as AdminBanner,
  };
}

/**
 * Lấy danh sách banner admin.
 * API: GET /api/admin/banners
 */
export async function getAdminBanners(
  adminAccessToken: string,
  query?: AdminBannerListQuery
): Promise<AdminBannerListResponseData> {
  const queryString = buildBannerQueryString(query);

  const response = await fetch(`${ADMIN_API_BASE_URL}/banners${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminBannerResponse<unknown>(response);

  return normalizeBannerListData(result.data);
}

/**
 * Tạo banner mới.
 * API: POST /api/admin/banners
 * Lưu ý: upload file dùng FormData, không tự set Content-Type.
 */
export async function createAdminBanner(
  adminAccessToken: string,
  payload: CreateAdminBannerPayload
): Promise<AdminBannerMutationResponseData> {
  const formData = new FormData();

  formData.append("file", payload.file);
  appendOptionalFormValue(formData, "title", payload.title);
  appendOptionalFormValue(formData, "targetUrl", payload.targetUrl);
  appendOptionalFormValue(formData, "position", payload.position);
  appendOptionalFormValue(formData, "isActive", payload.isActive);

  const response = await fetch(`${ADMIN_API_BASE_URL}/banners`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: formData,
  });

  const result = await parseAdminBannerResponse<unknown>(response);

  return normalizeBannerMutationData(result.data);
}

/**
 * Cập nhật banner.
 * API: PATCH /api/admin/banners/:bannerId
 * Có thể gửi file mới hoặc chỉ sửa metadata.
 */
export async function updateAdminBanner(
  adminAccessToken: string,
  bannerId: number,
  payload: UpdateAdminBannerPayload
): Promise<AdminBannerMutationResponseData> {
  const formData = new FormData();

  if (payload.file) {
    formData.append("file", payload.file);
  }

  appendOptionalFormValue(formData, "title", payload.title);
  appendOptionalFormValue(formData, "targetUrl", payload.targetUrl);
  appendOptionalFormValue(formData, "position", payload.position);
  appendOptionalFormValue(formData, "isActive", payload.isActive);

  const response = await fetch(`${ADMIN_API_BASE_URL}/banners/${bannerId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: formData,
  });

  const result = await parseAdminBannerResponse<unknown>(response);

  return normalizeBannerMutationData(result.data);
}

/**
 * Xóa mềm banner.
 * API: DELETE /api/admin/banners/:bannerId
 */
export async function deleteAdminBanner(
  adminAccessToken: string,
  bannerId: number,
  destroyCloudinary = false
): Promise<AdminBannerMutationResponseData> {
  const queryString = destroyCloudinary ? "?destroyCloudinary=true" : "";

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/banners/${bannerId}${queryString}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    }
  );

  const result = await parseAdminBannerResponse<unknown>(response);

  return normalizeBannerMutationData(result.data);
}