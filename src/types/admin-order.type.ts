import type { ApiResponse } from "@/types/auth.type";

export type AdminOrderStatus =
  | "PendingPayment"
  | "PendingConfirmation"
  | "Confirmed"
  | "Processing"
  | "Shipping"
  | "Completed"
  | "Cancelled";

export type AdminOrderSort = "newest" | "oldest" | "total_asc" | "total_desc";

export type AdminOrderStatusFilter = "all" | AdminOrderStatus;

export type AdminOrderPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminOrderDetailItem = {
  orderDetailId?: number;
  productId?: number;
  variantId?: number;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  image?: string | null;
  color?: string | null;
  capacity?: string | null;
  ram?: string | null;
  quantity: number;
  price: number;
  lineTotal?: number;
};

export type AdminOrderStatusHistory = {
  historyId?: number;
  status: AdminOrderStatus | string;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminOrder = {
  orderId: number;
  orderCode?: string | null;
  userId?: number | null;

  customerName: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;

  subTotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount: number;

  voucherCode?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;

  orderStatus: AdminOrderStatus;
  createdAt: string;
  updatedAt?: string | null;

  items?: AdminOrderDetailItem[];
  orderDetails?: AdminOrderDetailItem[];
  statusHistory?: AdminOrderStatusHistory[];
};

export type AdminOrderListQuery = {
  search?: string;
  status?: AdminOrderStatus;
  page?: number;
  limit?: number;
  sort?: AdminOrderSort;
};

export type AdminOrderListResponseData = {
  items: AdminOrder[];
  pagination: AdminOrderPagination;
};

export type AdminOrderDetailResponseData = {
  order: AdminOrder;
};

export type UpdateAdminOrderStatusPayload = {
  status: AdminOrderStatus;
  note?: string;
};

export type AdminOrderStatusMutationResponseData = {
  order: AdminOrder;
};

export type AdminOrderApiResponse<T> = ApiResponse<T>;