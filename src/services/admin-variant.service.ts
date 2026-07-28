// src/services/admin-variant.service.ts

import type {
  AdminVariant,
  AdminVariantApiResponse,
  AdminVariantDetailResponseData,
  AdminVariantListResponseData,
  AdminVariantMutationResponseData,
  CreateAdminVariantPayload,
  UpdateAdminVariantPayload,
} from "@/types/admin-variant.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

/**
 * Parse response chung cho Admin Variant API.
 * Nếu BE trả lỗi thì ném Error để component xử lý.
 */
async function parseAdminVariantResponse<T>(
  response: Response
): Promise<AdminVariantApiResponse<T>> {
  const data = (await response.json()) as AdminVariantApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

/**
 * Chuẩn hóa response list variant.
 * Viết linh hoạt để tránh lỗi nếu BE trả data là array hoặc { variants }.
 */
function normalizeVariantListData(data: unknown): AdminVariantListResponseData {
  if (Array.isArray(data)) {
    return {
      variants: data as AdminVariant[],
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "variants" in data &&
    Array.isArray((data as { variants: unknown }).variants)
  ) {
    return data as AdminVariantListResponseData;
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return {
      variants: (data as { items: AdminVariant[] }).items,
    };
  }

  return {
    variants: [],
  };
}

/**
 * Chuẩn hóa response mutation variant.
 * BE có thể trả { variant } hoặc trả thẳng object variant.
 */
function normalizeVariantMutationData(
  data: unknown
): AdminVariantMutationResponseData {
  if (
    data &&
    typeof data === "object" &&
    "variant" in data
  ) {
    return data as AdminVariantMutationResponseData;
  }

  return {
    variant: data as AdminVariant,
  };
}

/**
 * Lấy danh sách variant theo product.
 * API: GET /api/admin/products/:productId/variants
 */
export async function getAdminProductVariants(
  adminAccessToken: string,
  productId: number
): Promise<AdminVariantListResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/products/${productId}/variants`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminVariantResponse<unknown>(response);

  return normalizeVariantListData(result.data);
}

/**
 * Lấy chi tiết 1 variant.
 * API: GET /api/admin/variants/:variantId
 */
export async function getAdminVariantById(
  adminAccessToken: string,
  variantId: number
): Promise<AdminVariantDetailResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/variants/${variantId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminVariantResponse<unknown>(response);

  return normalizeVariantMutationData(result.data);
}

/**
 * Tạo variant cho product.
 * API: POST /api/admin/products/:productId/variants
 */
export async function createAdminVariant(
  adminAccessToken: string,
  productId: number,
  payload: CreateAdminVariantPayload
): Promise<AdminVariantMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/products/${productId}/variants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseAdminVariantResponse<unknown>(response);

  return normalizeVariantMutationData(result.data);
}

/**
 * Cập nhật variant.
 * API: PATCH /api/admin/variants/:variantId
 */
export async function updateAdminVariant(
  adminAccessToken: string,
  variantId: number,
  payload: UpdateAdminVariantPayload
): Promise<AdminVariantMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/variants/${variantId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseAdminVariantResponse<unknown>(response);

  return normalizeVariantMutationData(result.data);
}

/**
 * Xóa variant.
 * BE sẽ chặn nếu variant đã có dữ liệu liên quan như cart/order/image.
 * API: DELETE /api/admin/variants/:variantId
 */
export async function deleteAdminVariant(
  adminAccessToken: string,
  variantId: number
): Promise<AdminVariantMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/variants/${variantId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
  });

  const result = await parseAdminVariantResponse<unknown>(response);

  return normalizeVariantMutationData(result.data);
}