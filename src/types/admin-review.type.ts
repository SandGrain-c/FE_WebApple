import type { ApiResponse } from "@/types/auth.type";

export type AdminReviewStatusFilter = "all" | "true" | "false";

export type AdminReviewRatingFilter = "all" | "1" | "2" | "3" | "4" | "5";

export type AdminReviewSort =
  | "newest"
  | "oldest"
  | "rating_asc"
  | "rating_desc";

export type AdminReview = {
  reviewId: number;
  productId: number;
  userId: number;

  productName?: string | null;
  productSlug?: string | null;
  productImage?: string | null;

  userName?: string | null;
  fullName?: string | null;
  customerName?: string | null;
  email?: string | null;
  phone?: string | null;

  rating: number;
  comment: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type AdminReviewPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminReviewListQuery = {
  search?: string;
  productId?: number;
  userId?: number;
  rating?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: AdminReviewSort;
};

export type AdminReviewListResponseData = {
  items: AdminReview[];
  pagination: AdminReviewPagination;
};

export type AdminReviewDetailResponseData = {
  review: AdminReview;
};

export type UpdateAdminReviewVisibilityPayload = {
  isActive: boolean;
};

export type AdminReviewMutationResponseData = {
  review: AdminReview;
};

export type AdminReviewApiResponse<T> = ApiResponse<T>;