import type {
  AdminReview,
  AdminReviewApiResponse,
  AdminReviewDetailResponseData,
  AdminReviewListQuery,
  AdminReviewListResponseData,
  AdminReviewMutationResponseData,
  UpdateAdminReviewVisibilityPayload,
} from "@/types/admin-review.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

async function parseAdminReviewResponse<T>(
  response: Response
): Promise<AdminReviewApiResponse<T>> {
  const data = (await response.json()) as AdminReviewApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildReviewQueryString(query?: AdminReviewListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.productId) {
    searchParams.set("productId", String(query.productId));
  }

  if (query.userId) {
    searchParams.set("userId", String(query.userId));
  }

  if (query.rating) {
    searchParams.set("rating", String(query.rating));
  }

  if (typeof query.isActive === "boolean") {
    searchParams.set("isActive", String(query.isActive));
  }

  if (query.page) {
    searchParams.set("page", String(query.page));
  }

  if (query.limit) {
    searchParams.set("limit", String(query.limit));
  }

  if (query.sort) {
    searchParams.set("sort", query.sort);
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

function normalizeReviewListData(data: unknown): AdminReviewListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as AdminReview[],
      pagination: {
        page: 1,
        limit: data.length,
        totalItems: data.length,
        totalPages: 1,
      },
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    const typedData = data as AdminReviewListResponseData;

    return {
      items: typedData.items,
      pagination:
        typedData.pagination || {
          page: 1,
          limit: typedData.items.length,
          totalItems: typedData.items.length,
          totalPages: 1,
        },
    };
  }

  return {
    items: [],
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    },
  };
}

function normalizeReviewDetailData(data: unknown): AdminReviewDetailResponseData {
  if (data && typeof data === "object" && "review" in data) {
    return data as AdminReviewDetailResponseData;
  }

  return {
    review: data as AdminReview,
  };
}

function normalizeReviewMutationData(
  data: unknown
): AdminReviewMutationResponseData {
  if (data && typeof data === "object" && "review" in data) {
    return data as AdminReviewMutationResponseData;
  }

  return {
    review: data as AdminReview,
  };
}

/**
 * GET /api/admin/reviews
 */
export async function getAdminReviews(
  adminAccessToken: string,
  query?: AdminReviewListQuery
): Promise<AdminReviewListResponseData> {
  const queryString = buildReviewQueryString(query);

  const response = await fetch(`${ADMIN_API_BASE_URL}/reviews${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminReviewResponse<unknown>(response);

  return normalizeReviewListData(result.data);
}

/**
 * GET /api/admin/reviews/:reviewId
 */
export async function getAdminReviewById(
  adminAccessToken: string,
  reviewId: number
): Promise<AdminReviewDetailResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/reviews/${reviewId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminReviewResponse<unknown>(response);

  return normalizeReviewDetailData(result.data);
}

/**
 * PATCH /api/admin/reviews/:reviewId/visibility
 */
export async function updateAdminReviewVisibility(
  adminAccessToken: string,
  reviewId: number,
  payload: UpdateAdminReviewVisibilityPayload
): Promise<AdminReviewMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/reviews/${reviewId}/visibility`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseAdminReviewResponse<unknown>(response);

  return normalizeReviewMutationData(result.data);
}

/**
 * DELETE /api/admin/reviews/:reviewId
 * BE xử lý xóa mềm: is_active = false.
 */
export async function deleteAdminReview(
  adminAccessToken: string,
  reviewId: number
): Promise<AdminReviewMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
  });

  const result = await parseAdminReviewResponse<unknown>(response);

  return normalizeReviewMutationData(result.data);
}