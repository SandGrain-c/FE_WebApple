import type { ApiResponse } from "@/types/auth.type";

export type AdminPaymentType = "Payment" | "Refund";

export type AdminPaymentStatus =
  | "Pending"
  | "Success"
  | "Failed"
  | "Cancelled";

export type AdminPaymentTypeFilter = "all" | AdminPaymentType;

export type AdminPaymentStatusFilter = "all" | AdminPaymentStatus;

export type AdminPaymentTransactionSort =
  | "newest"
  | "oldest"
  | "amount_asc"
  | "amount_desc";

export type AdminPaymentTransactionPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminPaymentTransaction = {
  transactionId: number;
  orderId: number;

  orderCode?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderStatus?: string | null;

  gateway: string | null;
  transactionRef: string | null;
  amount: number;
  paymentType: AdminPaymentType;
  status: AdminPaymentStatus;

  gatewayResponse?: unknown;
  paidAt: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type AdminPaymentTransactionListQuery = {
  search?: string;
  orderId?: number;
  gateway?: string;
  paymentType?: AdminPaymentType;
  status?: AdminPaymentStatus;
  page?: number;
  limit?: number;
  sort?: AdminPaymentTransactionSort;
};

export type AdminPaymentTransactionListResponseData = {
  items: AdminPaymentTransaction[];
  pagination: AdminPaymentTransactionPagination;
};

export type AdminPaymentTransactionDetailResponseData = {
  transaction: AdminPaymentTransaction;
};

export type CreateAdminPaymentTransactionPayload = {
  orderId: number;
  gateway: string;
  transactionRef?: string;
  amount: number;
  paymentType: AdminPaymentType;
  status: AdminPaymentStatus;
  gatewayResponse?: unknown;
};

export type UpdateAdminPaymentTransactionStatusPayload = {
  status: AdminPaymentStatus;
  gatewayResponse?: unknown;
};

export type AdminPaymentTransactionMutationResponseData = {
  transaction: AdminPaymentTransaction;
};

export type AdminPaymentTransactionApiResponse<T> = ApiResponse<T>;