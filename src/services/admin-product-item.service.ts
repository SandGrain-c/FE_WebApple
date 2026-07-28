import type {
  AdminProductItem,
  AdminProductItemApiResponse,
  AdminProductItemListParams,
  AdminProductItemListResponseData,
  CreateAdminProductItemPayload,
  DeleteAdminProductItemResponseData,
  UpdateAdminProductItemPayload,
} from "@/types/admin-product-item.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

function getAuthHeaders(adminAccessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminAccessToken}`,
  };
}

async function parseAdminProductItemResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const result = (await response.json()) as AdminProductItemApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

export async function getAdminProductItems(
  adminAccessToken: string,
  params: AdminProductItemListParams = {}
): Promise<AdminProductItemListResponseData> {
  const searchParams = new URLSearchParams();

  if (params.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.variantId) {
    searchParams.set("variantId", String(params.variantId));
  }

  searchParams.set("page", String(params.page || 1));
  searchParams.set("limit", String(params.limit || 10));

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/product-items?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseAdminProductItemResponse<AdminProductItemListResponseData>(
    response,
    "Không thể lấy danh sách serial sản phẩm."
  );
}

export async function getAdminProductItemById(
  adminAccessToken: string,
  productItemId: number
): Promise<AdminProductItem> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/product-items/${productItemId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseAdminProductItemResponse<AdminProductItem>(
    response,
    "Không thể lấy chi tiết serial sản phẩm."
  );
}

export async function createAdminProductItem(
  adminAccessToken: string,
  payload: CreateAdminProductItemPayload
): Promise<AdminProductItem> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/product-items`, {
    method: "POST",
    headers: getAuthHeaders(adminAccessToken),
    body: JSON.stringify(payload),
  });

  return parseAdminProductItemResponse<AdminProductItem>(
    response,
    "Không thể tạo serial sản phẩm."
  );
}

export async function updateAdminProductItem(
  adminAccessToken: string,
  productItemId: number,
  payload: UpdateAdminProductItemPayload
): Promise<AdminProductItem> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/product-items/${productItemId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(adminAccessToken),
      body: JSON.stringify(payload),
    }
  );

  return parseAdminProductItemResponse<AdminProductItem>(
    response,
    "Không thể cập nhật serial sản phẩm."
  );
}

export async function deleteAdminProductItem(
  adminAccessToken: string,
  productItemId: number
): Promise<DeleteAdminProductItemResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/product-items/${productItemId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    }
  );

  return parseAdminProductItemResponse<DeleteAdminProductItemResponseData>(
    response,
    "Không thể xóa serial sản phẩm."
  );
}