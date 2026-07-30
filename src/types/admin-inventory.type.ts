import type { ApiResponse } from "@/types/auth.type";

export type AdminInventoryStockStatus =
  | "in-stock"
  | "low-stock"
  | "out-of-stock";

export type AdminInventoryStockStatusFilter =
  | "all"
  | AdminInventoryStockStatus;

export type AdminInventorySort =
  | "newest"
  | "oldest"
  | "stock_asc"
  | "stock_desc"
  | "sku_asc"
  | "sku_desc";

export type AdminInventoryReceiptSort =
  | "newest"
  | "oldest"
  | "amount_asc"
  | "amount_desc";

export type AdminStockAdjustType = "set" | "increase" | "decrease";

export type AdminInventoryPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminInventoryVariant = {
  variantId: number;
  productId: number;
  productName: string;
  variantName: string | null;
  sku: string;
  color: string | null;
  capacity: string | null;
  ram: string | null;
  country?: string | null;
  price?: number;
  stockQuantity: number;
  stockStatus?: AdminInventoryStockStatus;
  updatedAt?: string | null;
};

export type AdminInventoryVariantListQuery = {
  search?: string;
  stockStatus?: AdminInventoryStockStatus;
  page?: number;
  limit?: number;
  sort?: AdminInventorySort;
};

export type AdminInventoryVariantListResponseData = {
  items: AdminInventoryVariant[];
  pagination: AdminInventoryPagination;
};

export type AdminInventoryReceiptItem = {
  receiptDetailId?: number;
  variantId: number;
  productName?: string;
  variantName?: string | null;
  sku?: string | null;
  color?: string | null;
  capacity?: string | null;
  ram?: string | null;
  quantity: number;
  costPrice: number;
  lineTotal?: number;
  serialNumbers?: string[];
};

export type AdminInventoryReceipt = {
  receiptId: number;
  supplierId?: number | null;
  supplierName: string | null;
  totalAmount: number;
  createdAt: string;
  createdBy?: number | null;
  createdByName?: string | null;
  items?: AdminInventoryReceiptItem[];
  details?: AdminInventoryReceiptItem[];
};

export type AdminInventoryReceiptListQuery = {
  search?: string;
  page?: number;
  limit?: number;
  sort?: AdminInventoryReceiptSort;
};

export type AdminInventoryReceiptListResponseData = {
  items: AdminInventoryReceipt[];
  pagination: AdminInventoryPagination;
};

export type AdminInventoryReceiptDetailResponseData = {
  receipt: AdminInventoryReceipt;
};

export type CreateAdminInventoryReceiptItemPayload = {
  variantId: number;
  quantity: number;
  costPrice: number;
  serialNumbers?: string[];
};

export type CreateAdminInventoryReceiptPayload = {
  supplierName: string;
  supplierId?: number;
  items: CreateAdminInventoryReceiptItemPayload[];
};

export type AdminInventoryReceiptMutationResponseData = {
  receipt: AdminInventoryReceipt;
};

export type AdjustAdminInventoryStockPayload = {
  type: AdminStockAdjustType;
  quantity: number;
  reason: string;
};

export type AdminInventoryStockMutationResponseData = {
  variant: AdminInventoryVariant;
};

export type AdminInventoryApiResponse<T> = ApiResponse<T>;