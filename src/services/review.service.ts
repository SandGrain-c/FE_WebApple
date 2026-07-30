import type {
  CreateReviewPayload,
  CustomerReview,
  ProductReviewsResponseData,
  ReviewApiResponse,
  ReviewSummary,
  UpdateReviewPayload,
} from "@/types/review.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const EMPTY_REVIEW_SUMMARY: ReviewSummary = {
  totalReviews: 0,
  averageRating: 0,
  ratingCounts: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
};

function getAuthHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseReviewResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<ReviewApiResponse<T>> {
  const result = (await response.json()) as ReviewApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

function normalizeRatingCounts(value: unknown): ReviewSummary["ratingCounts"] {
  if (!value || typeof value !== "object") {
    return EMPTY_REVIEW_SUMMARY.ratingCounts;
  }

  const raw = value as Record<string, unknown>;

  return {
    1: Number(raw["1"] || 0),
    2: Number(raw["2"] || 0),
    3: Number(raw["3"] || 0),
    4: Number(raw["4"] || 0),
    5: Number(raw["5"] || 0),
  };
}

function normalizeProductReviewsData(data: unknown): ProductReviewsResponseData {
  if (!data || typeof data !== "object") {
    return {
      items: [],
      summary: EMPTY_REVIEW_SUMMARY,
    };
  }

  const raw = data as {
    items?: CustomerReview[];
    reviews?: CustomerReview[];
    summary?: Partial<ReviewSummary>;
    totalReviews?: number;
    averageRating?: number;
    ratingCounts?: unknown;
  };

  const summarySource = raw.summary || raw;

  return {
    items: Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.reviews)
        ? raw.reviews
        : [],
    summary: {
      totalReviews: Number(summarySource.totalReviews || 0),
      averageRating: Number(summarySource.averageRating || 0),
      ratingCounts: normalizeRatingCounts(summarySource.ratingCounts),
    },
  };
}

/**
 * GET /api/products/:productId/reviews
 * Public API, không cần token.
 */
export async function getProductReviews(
  productId: number
): Promise<ProductReviewsResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/products/${productId}/reviews`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result = await parseReviewResponse<unknown>(
    response,
    "Không thể lấy danh sách đánh giá."
  );

  return normalizeProductReviewsData(result.data);
}

/**
 * POST /api/reviews
 */
export async function createReview(
  payload: CreateReviewPayload,
  accessToken: string
): Promise<CustomerReview> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/reviews`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  const result = await parseReviewResponse<CustomerReview>(
    response,
    "Không thể gửi đánh giá."
  );

  return result.data;
}

/**
 * PATCH /api/reviews/:reviewId
 */
export async function updateReview(
  reviewId: number,
  payload: UpdateReviewPayload,
  accessToken: string
): Promise<CustomerReview> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/reviews/${reviewId}`, {
    method: "PATCH",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  const result = await parseReviewResponse<CustomerReview>(
    response,
    "Không thể cập nhật đánh giá."
  );

  return result.data;
}

/**
 * DELETE /api/reviews/:reviewId
 */
export async function deleteReview(
  reviewId: number,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  await parseReviewResponse<unknown>(response, "Không thể xóa đánh giá.");
}