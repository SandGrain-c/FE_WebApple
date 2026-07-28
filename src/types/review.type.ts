export type CustomerReview = {
  reviewId: number;
  productId: number;
  userId: number;
  rating: number;
  comment: string | null;
  isActive?: boolean;

  userName?: string | null;
  fullName?: string | null;
  customerName?: string | null;

  createdAt: string;
  updatedAt?: string | null;
};

export type ReviewSummary = {
  totalReviews: number;
  averageRating: number;
  ratingCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

export type ProductReviewsResponseData = {
  items: CustomerReview[];
  summary: ReviewSummary;
};

export type CreateReviewPayload = {
  productId: number;
  rating: number;
  comment: string;
};

export type UpdateReviewPayload = {
  rating?: number;
  comment?: string;
};

export type ReviewApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};