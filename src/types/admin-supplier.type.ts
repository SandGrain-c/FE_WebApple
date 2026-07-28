import type { ApiResponse } from "@/types/auth.type";

export type AdminSupplierStatus = "Active" | "Inactive";

export type AdminSupplierStatusFilter = "all" | AdminSupplierStatus;

export type AdminSupplierSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc";

export type AdminSupplier = {
  supplierId: number;
  supplierName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: AdminSupplierStatus;
  createdAt: string;

  /**
   * Có thể BE chưa trả field này.
   * Để optional để sau này nếu BE bổ sung số phiếu nhập thì FE dùng luôn.
   */
  totalReceipts?: number;
};

export type AdminSupplierPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminSupplierListQuery = {
  search?: string;
  status?: AdminSupplierStatus;
  page?: number;
  limit?: number;
  sort?: AdminSupplierSort;
};

export type AdminSupplierListResponseData = {
  items: AdminSupplier[];
  pagination: AdminSupplierPagination;
};

export type AdminSupplierDetailResponseData = {
  supplier: AdminSupplier;
};

export type CreateAdminSupplierPayload = {
  supplierName: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: AdminSupplierStatus;
};

export type UpdateAdminSupplierPayload = Partial<CreateAdminSupplierPayload>;

export type AdminSupplierMutationResponseData = {
  supplier: AdminSupplier;
};

export type AdminSupplierApiResponse<T> = ApiResponse<T>;