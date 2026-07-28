// src/services/admin-product.service.ts

import type {
  AdminProductApiResponse,
  AdminProductDetailResponseData,
  AdminProductListQuery,
  AdminProductListResponseData,
  AdminProductMutationResponseData,
  CreateAdminProductPayload,
  UpdateAdminProductPayload,
} from "@/types/admin-product.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

/**
 * Parse response chung cho Admin Product API.
 * Nếu BE trả lỗi thì ném Error để component xử lý.
 */
async function parseAdminProductResponse<T>(
  response: Response
): Promise<AdminProductApiResponse<T>> {
  const data = (await response.json()) as AdminProductApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

/**
 * Tạo query string cho danh sách product.
 */
function buildProductQueryString(query?: AdminProductListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.categoryId) {
    searchParams.set("categoryId", String(query.categoryId));
  }

  if (query.categorySlug) {
    searchParams.set("categorySlug", query.categorySlug);
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
 * Lấy danh sách product admin.
 * API: GET /api/admin/products
 */
export async function getAdminProducts(
  adminAccessToken: string,
  query?: AdminProductListQuery
): Promise<AdminProductListResponseData> {
  const queryString = buildProductQueryString(query);

  const response = await fetch(`${ADMIN_API_BASE_URL}/products${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result =
    await parseAdminProductResponse<AdminProductListResponseData>(response);

  return result.data;
}

/**
 * Lấy chi tiết product.
 * API: GET /api/admin/products/:productId
 */
export async function getAdminProductById(
  adminAccessToken: string,
  productId: number
): Promise<AdminProductDetailResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/products/${productId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result =
    await parseAdminProductResponse<AdminProductDetailResponseData>(response);

  return result.data;
}

/**
 * Tạo product cha.
 * API: POST /api/admin/products
 */
export async function createAdminProduct(
  adminAccessToken: string,
  payload: CreateAdminProductPayload
): Promise<AdminProductMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result =
    await parseAdminProductResponse<AdminProductMutationResponseData>(response);

  return result.data;
}

/**
 * Cập nhật product cha.
 * API: PATCH /api/admin/products/:productId
 */
export async function updateAdminProduct(
  adminAccessToken: string,
  productId: number,
  payload: UpdateAdminProductPayload
): Promise<AdminProductMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result =
    await parseAdminProductResponse<AdminProductMutationResponseData>(response);

  return result.data;
}

/**
 * Xóa mềm product.
 * API: DELETE /api/admin/products/:productId
 */
export async function deleteAdminProduct(
  adminAccessToken: string,
  productId: number
): Promise<AdminProductMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/products/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
  });

  const result =
    await parseAdminProductResponse<AdminProductMutationResponseData>(response);

  return result.data;
}