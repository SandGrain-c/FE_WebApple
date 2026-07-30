// src/types/admin-product.type.ts

import type { ApiResponse } from "@/types/auth.type";

export type AdminProductSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc";

export type AdminProductStatusFilter = "all" | "true" | "false";

export type AdminProduct = {
  productId: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  variants: unknown[];
  totalVariants: number;
  totalImages: number;
};

export type AdminProductPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminProductListQuery = {
  search?: string;
  categoryId?: number;
  categorySlug?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: AdminProductSort;
};

export type AdminProductListResponseData = {
  items: AdminProduct[];
  pagination: AdminProductPagination;
};

export type AdminProductDetailResponseData = {
  product: AdminProduct;
};

export type CreateAdminProductPayload = {
  categoryId: number;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateAdminProductPayload = Partial<CreateAdminProductPayload>;

export type AdminProductMutationResponseData = {
  product: AdminProduct;
};

export type AdminProductApiResponse<T> = ApiResponse<T>;