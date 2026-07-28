import type {
  CheckoutPayload,
  CheckoutResponseData,
  CustomerOrder,
  CustomerOrderApiResponse,
  CustomerOrderDetailResponseData,
  CustomerOrderListQuery,
  CustomerOrderListResponseData,
  CustomerOrderPagination,
} from "@/types/order.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseCustomerOrderResponse<T>(
  response: Response
): Promise<CustomerOrderApiResponse<T>> {
  const data = (await response.json()) as CustomerOrderApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildOrderQueryString(query?: CustomerOrderListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
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

function normalizeOrderListData(data: unknown): CustomerOrderListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as CustomerOrder[],
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
    const typedData = data as CustomerOrderListResponseData;

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

  if (
    data &&
    typeof data === "object" &&
    "orders" in data &&
    Array.isArray((data as { orders: unknown }).orders)
  ) {
    const typedData = data as {
      orders: CustomerOrder[];
      pagination?: CustomerOrderPagination;
    };

    return {
      items: typedData.orders,
      pagination:
        typedData.pagination || {
          page: 1,
          limit: typedData.orders.length,
          totalItems: typedData.orders.length,
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

function normalizeOrderDetailData(data: unknown): CustomerOrderDetailResponseData {
  if (data && typeof data === "object" && "order" in data) {
    return data as CustomerOrderDetailResponseData;
  }

  return {
    order: data as CustomerOrder,
  };
}

/**
 * POST /api/orders/checkout
 */
export async function checkoutOrder(
  payload: CheckoutPayload,
  accessToken: string
): Promise<CheckoutResponseData> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/orders/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseCustomerOrderResponse<CheckoutResponseData>(
    response
  );

  return result.data;
}

/**
 * GET /api/orders
 */
export async function getCustomerOrders(
  accessToken: string,
  query?: CustomerOrderListQuery
): Promise<CustomerOrderListResponseData> {
  const queryString = buildOrderQueryString(query);

  const response = await fetch(`${CUSTOMER_API_BASE_URL}/orders${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseCustomerOrderResponse<unknown>(response);

  return normalizeOrderListData(result.data);
}

/**
 * GET /api/orders/:orderId
 */
export async function getCustomerOrderById(
  accessToken: string,
  orderId: number
): Promise<CustomerOrderDetailResponseData> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseCustomerOrderResponse<unknown>(response);

  return normalizeOrderDetailData(result.data);
}

/**
 * PATCH /api/orders/:orderId/cancel
 */
export async function cancelCustomerOrder(
  accessToken: string,
  orderId: number
): Promise<CustomerOrderDetailResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/orders/${orderId}/cancel`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const result = await parseCustomerOrderResponse<unknown>(response);

  return normalizeOrderDetailData(result.data);
}