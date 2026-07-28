export type CustomerPaymentMethod = "COD" | "OnlineBanking";

export type CustomerOrderStatus =
  | "PendingPayment"
  | "PendingConfirmation"
  | "Confirmed"
  | "Processing"
  | "Shipping"
  | "Completed"
  | "Cancelled";

export type CustomerOrderStatusFilter = "all" | CustomerOrderStatus;

export type CustomerOrderSort = "newest" | "oldest" | "total_asc" | "total_desc";

export type CustomerOrderItem = {
  orderDetailId?: number;
  detailId?: number;

  productId: number;
  variantId: number;

  productName?: string | null;
  name?: string | null;
  productSlug?: string | null;
  categorySlug?: string | null;
  image?: string | null;

  variantName?: string | null;
  sku?: string | null;
  color?: string | null;
  capacity?: string | null;
  ram?: string | null;

  price: number;
  quantity: number;
  lineTotal?: number;
  totalPrice?: number;
};

export type CustomerOrderStatusHistory = {
  historyId?: number;
  orderStatusHistoryId?: number;
  orderId?: number;
  status: CustomerOrderStatus | string;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerOrder = {
  orderId: number;
  orderCode?: string | null;

  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;

  subTotal?: number;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount?: number;

  voucherCode?: string | null;
  paymentMethod?: CustomerPaymentMethod | string | null;
  orderStatus: CustomerOrderStatus | string;

  createdAt?: string;
  updatedAt?: string | null;

  items?: CustomerOrderItem[];
  details?: CustomerOrderItem[];
  orderDetails?: CustomerOrderItem[];

  statusHistory?: CustomerOrderStatusHistory[];
  history?: CustomerOrderStatusHistory[];
  orderStatusHistory?: CustomerOrderStatusHistory[];
};

export type CustomerOrderPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type CustomerOrderListQuery = {
  status?: CustomerOrderStatus;
  page?: number;
  limit?: number;
  sort?: CustomerOrderSort;
};

export type CustomerOrderListResponseData = {
  items: CustomerOrder[];
  pagination: CustomerOrderPagination;
};

export type CustomerOrderDetailResponseData = {
  order: CustomerOrder;
};

export type PayOSPaymentLinkDto = {
  orderId: number;
  orderCode?: string | null;
  amount: number;
  paymentLinkId?: string | null;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  status: string;
};

export type CheckoutPayload = {
  addressId: number;
  shippingFee: number;
  voucherCode?: string;
  paymentMethod: CustomerPaymentMethod;
};

export type CheckoutResponseData = {
  order: CustomerOrder;
  payment: PayOSPaymentLinkDto | null;
};

export type CustomerOrderApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};