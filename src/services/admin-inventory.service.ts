import type {
  AdjustAdminInventoryStockPayload,
  AdminInventoryApiResponse,
  AdminInventoryReceipt,
  AdminInventoryReceiptDetailResponseData,
  AdminInventoryReceiptListQuery,
  AdminInventoryReceiptListResponseData,
  AdminInventoryReceiptMutationResponseData,
  AdminInventoryStockMutationResponseData,
  AdminInventoryVariant,
  AdminInventoryVariantListQuery,
  AdminInventoryVariantListResponseData,
  CreateAdminInventoryReceiptPayload,
} from "@/types/admin-inventory.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

async function parseAdminInventoryResponse<T>(
  response: Response
): Promise<AdminInventoryApiResponse<T>> {
  const data = (await response.json()) as AdminInventoryApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildQueryString(query?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

function normalizeVariantListData(
  data: unknown
): AdminInventoryVariantListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as AdminInventoryVariant[],
      pagination: {
        page: 1,
        limit: data.length,
        totalItems: data.length,
        totalPages: 1,
      },
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    const typedData = data as AdminInventoryVariantListResponseData;

    return {
      items: typedData.items,
      pagination:
        typedData.pagination || {
          page: 1,
          limit: typedData.items.length,
          totalItems: typedData.items.length,
          totalPages: 1,
        },
    };
  }

  return {
    items: [],
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    },
  };
}

function normalizeReceiptListData(
  data: unknown
): AdminInventoryReceiptListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as AdminInventoryReceipt[],
      pagination: {
        page: 1,
        limit: data.length,
        totalItems: data.length,
        totalPages: 1,
      },
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    const typedData = data as AdminInventoryReceiptListResponseData;

    return {
      items: typedData.items,
      pagination:
        typedData.pagination || {
          page: 1,
          limit: typedData.items.length,
          totalItems: typedData.items.length,
          totalPages: 1,
        },
    };
  }

  return {
    items: [],
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    },
  };
}

function normalizeReceiptDetailData(
  data: unknown
): AdminInventoryReceiptDetailResponseData {
  if (data && typeof data === "object" && "receipt" in data) {
    return data as AdminInventoryReceiptDetailResponseData;
  }

  return {
    receipt: data as AdminInventoryReceipt,
  };
}

function normalizeReceiptMutationData(
  data: unknown
): AdminInventoryReceiptMutationResponseData {
  if (data && typeof data === "object" && "receipt" in data) {
    return data as AdminInventoryReceiptMutationResponseData;
  }

  return {
    receipt: data as AdminInventoryReceipt,
  };
}

function normalizeStockMutationData(
  data: unknown
): AdminInventoryStockMutationResponseData {
  if (data && typeof data === "object" && "variant" in data) {
    return data as AdminInventoryStockMutationResponseData;
  }

  return {
    variant: data as AdminInventoryVariant,
  };
}

/**
 * GET /api/admin/inventory/variants
 */
export async function getAdminInventoryVariants(
  adminAccessToken: string,
  query?: AdminInventoryVariantListQuery
): Promise<AdminInventoryVariantListResponseData> {
  const queryString = buildQueryString({
    search: query?.search,
    stockStatus: query?.stockStatus,
    page: query?.page,
    limit: query?.limit,
    sort: query?.sort,
  });

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/inventory/variants${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminInventoryResponse<unknown>(response);

  return normalizeVariantListData(result.data);
}

/**
 * GET /api/admin/inventory/receipts
 */
export async function getAdminInventoryReceipts(
  adminAccessToken: string,
  query?: AdminInventoryReceiptListQuery
): Promise<AdminInventoryReceiptListResponseData> {
  const queryString = buildQueryString({
    search: query?.search,
    page: query?.page,
    limit: query?.limit,
    sort: query?.sort,
  });

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/inventory/receipts${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminInventoryResponse<unknown>(response);

  return normalizeReceiptListData(result.data);
}

/**
 * GET /api/admin/inventory/receipts/:receiptId
 */
export async function getAdminInventoryReceiptById(
  adminAccessToken: string,
  receiptId: number
): Promise<AdminInventoryReceiptDetailResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/inventory/receipts/${receiptId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminInventoryResponse<unknown>(response);

  return normalizeReceiptDetailData(result.data);
}

/**
 * POST /api/admin/inventory/receipts
 */
export async function createAdminInventoryReceipt(
  adminAccessToken: string,
  payload: CreateAdminInventoryReceiptPayload
): Promise<AdminInventoryReceiptMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/inventory/receipts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseAdminInventoryResponse<unknown>(response);

  return normalizeReceiptMutationData(result.data);
}

/**
 * PATCH /api/admin/inventory/variants/:variantId/stock
 */
export async function adjustAdminInventoryStock(
  adminAccessToken: string,
  variantId: number,
  payload: AdjustAdminInventoryStockPayload
): Promise<AdminInventoryStockMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/inventory/variants/${variantId}/stock`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseAdminInventoryResponse<unknown>(response);

  return normalizeStockMutationData(result.data);
}