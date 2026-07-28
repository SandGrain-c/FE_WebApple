export type AdminProductItemStatus =
  | "InStock"
  | "Reserved"
  | "Sold"
  | "Warranty"
  | "Returned"
  | "Inactive";

export type AdminProductItemStatusFilter = "all" | AdminProductItemStatus;

export type AdminProductItem = {
  productItemId: number;
  variantId: number;
  serialNumber: string;
  status: AdminProductItemStatus;

  // Nếu BE có include thêm variant/product thì FE vẫn nhận được
  sku?: string | null;
  productName?: string | null;
  variantName?: string | null;
  color?: string | null;
  capacity?: string | null;
  ram?: string | null;

  createdAt?: string;
  updatedAt?: string | null;
};

export type AdminProductItemPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminProductItemListParams = {
  q?: string;
  status?: AdminProductItemStatus;
  variantId?: number;
  page?: number;
  limit?: number;
};

export type AdminProductItemListResponseData = {
  items: AdminProductItem[];
  pagination: AdminProductItemPagination;
};

export type CreateAdminProductItemPayload = {
  variantId: number;
  serialNumber: string;
  status: AdminProductItemStatus;
};

export type UpdateAdminProductItemPayload = {
  serialNumber?: string;
  status?: AdminProductItemStatus;
};

export type DeleteAdminProductItemResponseData = {
  productItemId: number;
  status: AdminProductItemStatus;
};

export type AdminProductItemApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};