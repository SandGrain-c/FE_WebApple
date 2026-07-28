export type CustomerShipmentStatus =
  | "Pending"
  | "Preparing"
  | "Shipped"
  | "InTransit"
  | "Delivered"
  | "Failed"
  | "Cancelled";

export type CustomerShipmentHistory = {
  shipmentHistoryId?: number;
  historyId?: number;
  shipmentId?: number;
  status: CustomerShipmentStatus | string;
  location?: string | null;
  note?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

export type CustomerShipment = {
  shipmentId: number;
  orderId: number;

  shippingProvider: string | null;
  trackingCode: string | null;
  status: CustomerShipmentStatus | string;
  createdAt: string;

  history?: CustomerShipmentHistory[];
  statusHistory?: CustomerShipmentHistory[];
};

export type CustomerShipmentListResponseData = {
  items: CustomerShipment[];
};

export type CustomerShipmentDetailResponseData = {
  shipment: CustomerShipment;
};

export type CustomerShipmentApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};