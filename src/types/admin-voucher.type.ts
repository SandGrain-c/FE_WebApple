import type { ApiResponse } from "@/types/auth.type";

export type AdminVoucherDiscountType = "Percent" | "Fixed";

export type AdminVoucherStatusFilter = "all" | "true" | "false";

export type AdminVoucherDiscountTypeFilter =
  | "all"
  | AdminVoucherDiscountType;

export type AdminVoucherSort =
  | "newest"
  | "oldest"
  | "code_asc"
  | "code_desc"
  | "value_asc"
  | "value_desc";

export type AdminVoucher = {
  voucherId: number;
  code: string;
  discountType: AdminVoucherDiscountType;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
};

export type AdminVoucherPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminVoucherListQuery = {
  search?: string;
  discountType?: AdminVoucherDiscountType;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: AdminVoucherSort;
};

export type AdminVoucherListResponseData = {
  items: AdminVoucher[];
  pagination: AdminVoucherPagination;
};

export type AdminVoucherDetailResponseData = {
  voucher: AdminVoucher;
};

export type CreateAdminVoucherPayload = {
  code: string;
  discountType: AdminVoucherDiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
};

export type UpdateAdminVoucherPayload =
  Partial<CreateAdminVoucherPayload>;

export type AdminVoucherMutationResponseData = {
  voucher: AdminVoucher;
};

export type AdminVoucherApiResponse<T> = ApiResponse<T>;