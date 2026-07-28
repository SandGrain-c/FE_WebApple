// src/types/admin-category.type.ts


import type { ApiResponse } from "@/types/auth.type";

export type AdminCategorySort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "display_order_asc"
  | "display_order_desc";

export type AdminCategoryStatusFilter = "all" | "true" | "false";

export type AdminCategory = {
  categoryId: number;
  categoryName: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  totalProducts: number;
};

export type AdminCategoryPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminCategoryListQuery = {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: AdminCategorySort;
};

export type AdminCategoryListResponseData = {
  items: AdminCategory[];
  pagination: AdminCategoryPagination;
};

export type AdminCategoryDetailResponseData = {
  category: AdminCategory;
};

export type CreateAdminCategoryPayload = {
  categoryName: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
};

export type UpdateAdminCategoryPayload = Partial<CreateAdminCategoryPayload>;

export type AdminCategoryMutationResponseData = {
  category: AdminCategory;
};

export type AdminCategoryApiResponse<T> = ApiResponse<T>;