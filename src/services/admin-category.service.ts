// src/services/admin-category.service.ts

import type {
  AdminCategoryApiResponse,
  AdminCategoryDetailResponseData,
  AdminCategoryListQuery,
  AdminCategoryListResponseData,
  AdminCategoryMutationResponseData,
  CreateAdminCategoryPayload,
  UpdateAdminCategoryPayload,
} from "@/types/admin-category.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

/**
 * Parse response chung cho Admin Category API.
 * Nếu BE trả lỗi thì ném Error để component xử lý.
 */
async function parseAdminCategoryResponse<T>(
  response: Response
): Promise<AdminCategoryApiResponse<T>> {
  const data = (await response.json()) as AdminCategoryApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

/**
 * Tạo query string cho API danh sách category.
 * Ví dụ: ?search=iphone&page=1&limit=10
 */
function buildCategoryQueryString(query?: AdminCategoryListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (typeof query.isActive === "boolean") {
    searchParams.set("isActive", String(query.isActive));
  }

  if (query.page) {
    searchParams.set("page", String(query.page));
  }

  if (query.limit) {
    searchParams.set("limit", String(query.limit));
  }

  if (query.sort) {
    searchParams.set("sort", query.sort);
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

/**
 * Lấy danh sách danh mục Admin.
 * API: GET /api/admin/categories
 */
export async function getAdminCategories(
  adminAccessToken: string,
  query?: AdminCategoryListQuery
): Promise<AdminCategoryListResponseData> {
  const queryString = buildCategoryQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/categories${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminCategoryResponse<AdminCategoryListResponseData>(response);

  return result.data;
}

/**
 * Lấy chi tiết 1 danh mục.
 * API: GET /api/admin/categories/:categoryId
 */
export async function getAdminCategoryById(
  adminAccessToken: string,
  categoryId: number
): Promise<AdminCategoryDetailResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/categories/${categoryId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminCategoryResponse<AdminCategoryDetailResponseData>(response);

  return result.data;
}

/**
 * Tạo danh mục mới.
 * API: POST /api/admin/categories
 */
export async function createAdminCategory(
  adminAccessToken: string,
  payload: CreateAdminCategoryPayload
): Promise<AdminCategoryMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result =
    await parseAdminCategoryResponse<AdminCategoryMutationResponseData>(
      response
    );

  return result.data;
}

/**
 * Cập nhật danh mục.
 * API: PATCH /api/admin/categories/:categoryId
 */
export async function updateAdminCategory(
  adminAccessToken: string,
  categoryId: number,
  payload: UpdateAdminCategoryPayload
): Promise<AdminCategoryMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/categories/${categoryId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result =
    await parseAdminCategoryResponse<AdminCategoryMutationResponseData>(
      response
    );

  return result.data;
}

/**
 * Xóa mềm danh mục.
 * API: DELETE /api/admin/categories/:categoryId
 */
export async function deleteAdminCategory(
  adminAccessToken: string,
  categoryId: number
): Promise<AdminCategoryMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/categories/${categoryId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    }
  );

  const result =
    await parseAdminCategoryResponse<AdminCategoryMutationResponseData>(
      response
    );

  return result.data;
}