import type {
  AdminOrder,
  AdminOrderApiResponse,
  AdminOrderDetailResponseData,
  AdminOrderListQuery,
  AdminOrderListResponseData,
  AdminOrderStatusMutationResponseData,
  UpdateAdminOrderStatusPayload,
} from "@/types/admin-order.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

/**
 * Parse response chung cho Admin Order API.
 */
async function parseAdminOrderResponse<T>(
  response: Response
): Promise<AdminOrderApiResponse<T>> {
  const data = (await response.json()) as AdminOrderApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildOrderQueryString(query?: AdminOrderListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.status) {
    searchParams.set("status", query.status);
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
 * Chuẩn hóa list response để tránh lỗi nếu BE trả array hoặc { items, pagination }.
 */
function normalizeOrderListData(data: unknown): AdminOrderListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as AdminOrder[],
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
    const typedData = data as AdminOrderListResponseData;

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

function normalizeOrderDetailData(data: unknown): AdminOrderDetailResponseData {
  if (data && typeof data === "object" && "order" in data) {
    return data as AdminOrderDetailResponseData;
  }

  return {
    order: data as AdminOrder,
  };
}

/**
 * Lấy danh sách đơn hàng.
 * API: GET /api/admin/orders
 */
export async function getAdminOrders(
  adminAccessToken: string,
  query?: AdminOrderListQuery
): Promise<AdminOrderListResponseData> {
  const queryString = buildOrderQueryString(query);

  const response = await fetch(`${ADMIN_API_BASE_URL}/orders${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminOrderResponse<unknown>(response);

  return normalizeOrderListData(result.data);
}

/**
 * Lấy chi tiết một đơn hàng.
 * API: GET /api/admin/orders/:orderId
 */
export async function getAdminOrderById(
  adminAccessToken: string,
  orderId: number
): Promise<AdminOrderDetailResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminOrderResponse<unknown>(response);

  return normalizeOrderDetailData(result.data);
}

/**
 * Cập nhật trạng thái đơn hàng.
 * API: PATCH /api/admin/orders/:orderId/status
 */
export async function updateAdminOrderStatus(
  adminAccessToken: string,
  orderId: number,
  payload: UpdateAdminOrderStatusPayload
): Promise<AdminOrderStatusMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/orders/${orderId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseAdminOrderResponse<unknown>(response);

  if (result.data && typeof result.data === "object" && "order" in result.data) {
    return result.data as AdminOrderStatusMutationResponseData;
  }

  return {
    order: result.data as AdminOrder,
  };
}
export type ExpirePendingPaymentsPayload = {
  expireAfterMinutes?: number;
  limit?: number;
};

export type ExpirePendingPaymentsResponseData = {
  expireAfterMinutes: number;
  expiredOrderCount: number;
  expiredOrderIds: number[];
};

export async function expirePendingPayments(
  adminAccessToken: string,
  payload: ExpirePendingPaymentsPayload = {}
): Promise<ExpirePendingPaymentsResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/orders/expire-pending-payments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        expireAfterMinutes: payload.expireAfterMinutes ?? 30,
        limit: payload.limit ?? 50,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Không thể hủy đơn thanh toán quá hạn."
    );
  }

  return result.data;
}