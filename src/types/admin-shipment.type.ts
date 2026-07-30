import type { ApiResponse } from "@/types/auth.type";

export type AdminShipmentStatus =
  | "Pending"
  | "Preparing"
  | "Shipped"
  | "InTransit"
  | "Delivered"
  | "Failed"
  | "Cancelled";

export type AdminShipmentStatusFilter = "all" | AdminShipmentStatus;

export type AdminShipmentSort =
  | "newest"
  | "oldest"
  | "status_asc"
  | "status_desc";

export type AdminShipmentPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminShipmentHistory = {
  shipmentHistoryId?: number;
  historyId?: number;
  shipmentId?: number;
  status: AdminShipmentStatus | string;
  location?: string | null;
  note?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

export type AdminShipment = {
  shipmentId: number;
  orderId: number;

  orderCode?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderStatus?: string | null;

  shippingProvider: string | null;
  trackingCode: string | null;
  status: AdminShipmentStatus;
  createdAt: string;

  history?: AdminShipmentHistory[];
  statusHistory?: AdminShipmentHistory[];
};

export type AdminShipmentListQuery = {
  search?: string;
  status?: AdminShipmentStatus;
  orderId?: number;
  page?: number;
  limit?: number;
  sort?: AdminShipmentSort;
};

export type AdminShipmentListResponseData = {
  items: AdminShipment[];
  pagination: AdminShipmentPagination;
};

export type AdminShipmentDetailResponseData = {
  shipment: AdminShipment;
};

export type CreateAdminShipmentPayload = {
  orderId: number;
  shippingProvider?: string;
  trackingCode?: string;
  status?: AdminShipmentStatus;
  location?: string;
  note?: string;
};

export type UpdateAdminShipmentPayload = {
  shippingProvider?: string;
  trackingCode?: string;
};

export type UpdateAdminShipmentStatusPayload = {
  status: AdminShipmentStatus;
  location?: string;
  note?: string;
};

export type AdminShipmentMutationResponseData = {
  shipment: AdminShipment;
};

export type AdminShipmentApiResponse<T> = ApiResponse<T>;