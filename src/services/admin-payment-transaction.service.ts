import type {
  AdminPaymentTransaction,
  AdminPaymentTransactionApiResponse,
  AdminPaymentTransactionDetailResponseData,
  AdminPaymentTransactionListQuery,
  AdminPaymentTransactionListResponseData,
  AdminPaymentTransactionMutationResponseData,
  CreateAdminPaymentTransactionPayload,
  UpdateAdminPaymentTransactionStatusPayload,
} from "@/types/admin-payment-transaction.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

async function parseAdminPaymentTransactionResponse<T>(
  response: Response
): Promise<AdminPaymentTransactionApiResponse<T>> {
  const data =
    (await response.json()) as AdminPaymentTransactionApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildPaymentTransactionQueryString(
  query?: AdminPaymentTransactionListQuery
) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.orderId) {
    searchParams.set("orderId", String(query.orderId));
  }

  if (query.gateway) {
    searchParams.set("gateway", query.gateway);
  }

  if (query.paymentType) {
    searchParams.set("paymentType", query.paymentType);
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

function normalizePaymentTransactionListData(
  data: unknown
): AdminPaymentTransactionListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as AdminPaymentTransaction[],
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
    const typedData = data as AdminPaymentTransactionListResponseData;

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

function normalizePaymentTransactionDetailData(
  data: unknown
): AdminPaymentTransactionDetailResponseData {
  if (data && typeof data === "object" && "transaction" in data) {
    return data as AdminPaymentTransactionDetailResponseData;
  }

  return {
    transaction: data as AdminPaymentTransaction,
  };
}

function normalizePaymentTransactionMutationData(
  data: unknown
): AdminPaymentTransactionMutationResponseData {
  if (data && typeof data === "object" && "transaction" in data) {
    return data as AdminPaymentTransactionMutationResponseData;
  }

  return {
    transaction: data as AdminPaymentTransaction,
  };
}

/**
 * GET /api/admin/payment-transactions
 */
export async function getAdminPaymentTransactions(
  adminAccessToken: string,
  query?: AdminPaymentTransactionListQuery
): Promise<AdminPaymentTransactionListResponseData> {
  const queryString = buildPaymentTransactionQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/payment-transactions${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminPaymentTransactionResponse<unknown>(response);

  return normalizePaymentTransactionListData(result.data);
}

/**
 * GET /api/admin/payment-transactions/:transactionId
 */
export async function getAdminPaymentTransactionById(
  adminAccessToken: string,
  transactionId: number
): Promise<AdminPaymentTransactionDetailResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/payment-transactions/${transactionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminPaymentTransactionResponse<unknown>(response);

  return normalizePaymentTransactionDetailData(result.data);
}

/**
 * POST /api/admin/payment-transactions
 */
export async function createAdminPaymentTransaction(
  adminAccessToken: string,
  payload: CreateAdminPaymentTransactionPayload
): Promise<AdminPaymentTransactionMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/payment-transactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result =
    await parseAdminPaymentTransactionResponse<unknown>(response);

  return normalizePaymentTransactionMutationData(result.data);
}

/**
 * PATCH /api/admin/payment-transactions/:transactionId/status
 */
export async function updateAdminPaymentTransactionStatus(
  adminAccessToken: string,
  transactionId: number,
  payload: UpdateAdminPaymentTransactionStatusPayload
): Promise<AdminPaymentTransactionMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/payment-transactions/${transactionId}/status`,
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
    await parseAdminPaymentTransactionResponse<unknown>(response);

  return normalizePaymentTransactionMutationData(result.data);
}