import type { PayOSPaymentLinkDto } from "@/types/order.type";

export type CustomerPaymentType = "Payment" | "Refund";

export type CustomerPaymentStatus =
  | "Pending"
  | "Success"
  | "Failed"
  | "Cancelled";

export type CustomerPaymentTransaction = {
  transactionId: number;
  orderId: number;
  gateway: string | null;
  transactionRef: string | null;
  amount: number;
  paymentType: CustomerPaymentType | string;
  status: CustomerPaymentStatus | string;
  gatewayResponse?: unknown;
  paidAt: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CustomerPayOSCreateLinkResponseData = {
  payment: PayOSPaymentLinkDto;
};

export type CustomerPayOSStatusResponseData = {
  orderId: number;
  orderCode?: string | null;
  orderStatus?: string | null;
  paymentStatus?: CustomerPaymentStatus | string;

  amount?: number;
  paidAt?: string | null;

  payment?: PayOSPaymentLinkDto | null;
  transaction?: CustomerPaymentTransaction | null;
};

export type CustomerPaymentTransactionListResponseData = {
  items: CustomerPaymentTransaction[];
};

export type CustomerPaymentTransactionDetailResponseData = {
  transaction: CustomerPaymentTransaction;
};

export type CustomerPaymentTransactionApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};