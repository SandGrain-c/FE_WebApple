import type { PayOSPaymentLinkDto } from "@/types/order.type";
import type {
  CustomerPaymentTransaction,
  CustomerPaymentTransactionApiResponse,
  CustomerPaymentTransactionDetailResponseData,
  CustomerPaymentTransactionListResponseData,
  CustomerPayOSCreateLinkResponseData,
  CustomerPayOSStatusResponseData,
} from "@/types/customer-payment-transaction.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseCustomerPaymentResponse<T>(
  response: Response
): Promise<CustomerPaymentTransactionApiResponse<T>> {
  const data =
    (await response.json()) as CustomerPaymentTransactionApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function normalizePayOSCreateLinkData(
  data: unknown
): CustomerPayOSCreateLinkResponseData {
  if (data && typeof data === "object" && "payment" in data) {
    return data as CustomerPayOSCreateLinkResponseData;
  }

  return {
    payment: data as PayOSPaymentLinkDto,
  };
}

function normalizePayOSStatusData(
  data: unknown
): CustomerPayOSStatusResponseData {
  if (!data || typeof data !== "object") {
    return {
      orderId: 0,
      paymentStatus: "Pending",
      payment: null,
      transaction: null,
    };
  }

  const rawData = data as Record<string, unknown>;

  return {
  orderId: Number(rawData.orderId || 0),

  orderCode:
    typeof rawData.orderCode === "string" ? rawData.orderCode : null,

  orderStatus:
    typeof rawData.orderStatus === "string" ? rawData.orderStatus : null,

  paymentStatus:
    typeof rawData.paymentStatus === "string"
      ? rawData.paymentStatus
      : typeof rawData.status === "string"
        ? rawData.status
        : "Pending",

  amount:
    typeof rawData.amount === "number"
      ? rawData.amount
      : Number(rawData.amount || 0),

  paidAt:
    typeof rawData.paidAt === "string" ? rawData.paidAt : null,

  payment:
    rawData.payment && typeof rawData.payment === "object"
      ? (rawData.payment as PayOSPaymentLinkDto)
      : null,

  transaction:
    rawData.transaction && typeof rawData.transaction === "object"
      ? (rawData.transaction as CustomerPaymentTransaction)
      : null,
};
}

function normalizePaymentTransactionListData(
  data: unknown
): CustomerPaymentTransactionListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as CustomerPaymentTransaction[],
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return {
      items: (data as { items: CustomerPaymentTransaction[] }).items,
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "transactions" in data &&
    Array.isArray((data as { transactions: unknown }).transactions)
  ) {
    return {
      items: (data as { transactions: CustomerPaymentTransaction[] })
        .transactions,
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "transaction" in data &&
    (data as { transaction: unknown }).transaction
  ) {
    return {
      items: [
        (data as { transaction: CustomerPaymentTransaction }).transaction,
      ],
    };
  }

  return {
    items: [],
  };
}

function normalizePaymentTransactionDetailData(
  data: unknown
): CustomerPaymentTransactionDetailResponseData {
  if (data && typeof data === "object" && "transaction" in data) {
    return data as CustomerPaymentTransactionDetailResponseData;
  }

  return {
    transaction: data as CustomerPaymentTransaction,
  };
}

/**
 * POST /api/payment-transactions/payos/orders/:orderId/create-link
 */
export async function createCustomerPayOSPaymentLink(
  orderId: number,
  accessToken: string
): Promise<CustomerPayOSCreateLinkResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/payment-transactions/payos/orders/${orderId}/create-link`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const result = await parseCustomerPaymentResponse<unknown>(response);

  return normalizePayOSCreateLinkData(result.data);
}

/**
 * GET /api/payment-transactions/payos/orders/:orderId/status
 */
export async function getCustomerPayOSPaymentStatus(
  orderId: number,
  accessToken: string
): Promise<CustomerPayOSStatusResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/payment-transactions/payos/orders/${orderId}/status`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseCustomerPaymentResponse<unknown>(response);

  return normalizePayOSStatusData(result.data);
}

/**
 * GET /api/payment-transactions/orders/:orderId
 */
export async function getCustomerPaymentTransactionsByOrder(
  orderId: number,
  accessToken: string
): Promise<CustomerPaymentTransactionListResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/payment-transactions/orders/${orderId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseCustomerPaymentResponse<unknown>(response);

  return normalizePaymentTransactionListData(result.data);
}

/**
 * GET /api/payment-transactions/:transactionId
 */
export async function getCustomerPaymentTransactionById(
  transactionId: number,
  accessToken: string
): Promise<CustomerPaymentTransactionDetailResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/payment-transactions/${transactionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseCustomerPaymentResponse<unknown>(response);

  return normalizePaymentTransactionDetailData(result.data);
}