import type {
  AdminVoucher,
  AdminVoucherApiResponse,
  AdminVoucherDetailResponseData,
  AdminVoucherListQuery,
  AdminVoucherListResponseData,
  AdminVoucherMutationResponseData,
  CreateAdminVoucherPayload,
  UpdateAdminVoucherPayload,
} from "@/types/admin-voucher.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

async function parseAdminVoucherResponse<T>(
  response: Response
): Promise<AdminVoucherApiResponse<T>> {
  const data = (await response.json()) as AdminVoucherApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildVoucherQueryString(query?: AdminVoucherListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.discountType) {
    searchParams.set("discountType", query.discountType);
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

function normalizeVoucherListData(data: unknown): AdminVoucherListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as AdminVoucher[],
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
    const typedData = data as AdminVoucherListResponseData;

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

function normalizeVoucherDetailData(
  data: unknown
): AdminVoucherDetailResponseData {
  if (data && typeof data === "object" && "voucher" in data) {
    return data as AdminVoucherDetailResponseData;
  }

  return {
    voucher: data as AdminVoucher,
  };
}

function normalizeVoucherMutationData(
  data: unknown
): AdminVoucherMutationResponseData {
  if (data && typeof data === "object" && "voucher" in data) {
    return data as AdminVoucherMutationResponseData;
  }

  return {
    voucher: data as AdminVoucher,
  };
}

/**
 * GET /api/admin/vouchers
 */
export async function getAdminVouchers(
  adminAccessToken: string,
  query?: AdminVoucherListQuery
): Promise<AdminVoucherListResponseData> {
  const queryString = buildVoucherQueryString(query);

  const response = await fetch(`${ADMIN_API_BASE_URL}/vouchers${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminVoucherResponse<unknown>(response);

  return normalizeVoucherListData(result.data);
}

/**
 * GET /api/admin/vouchers/:voucherId
 */
export async function getAdminVoucherById(
  adminAccessToken: string,
  voucherId: number
): Promise<AdminVoucherDetailResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/vouchers/${voucherId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminVoucherResponse<unknown>(response);

  return normalizeVoucherDetailData(result.data);
}

/**
 * POST /api/admin/vouchers
 */
export async function createAdminVoucher(
  adminAccessToken: string,
  payload: CreateAdminVoucherPayload
): Promise<AdminVoucherMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/vouchers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseAdminVoucherResponse<unknown>(response);

  return normalizeVoucherMutationData(result.data);
}

/**
 * PATCH /api/admin/vouchers/:voucherId
 */
export async function updateAdminVoucher(
  adminAccessToken: string,
  voucherId: number,
  payload: UpdateAdminVoucherPayload
): Promise<AdminVoucherMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/vouchers/${voucherId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseAdminVoucherResponse<unknown>(response);

  return normalizeVoucherMutationData(result.data);
}

/**
 * DELETE /api/admin/vouchers/:voucherId
 * BE xử lý xóa mềm: is_active = false.
 */
export async function deleteAdminVoucher(
  adminAccessToken: string,
  voucherId: number
): Promise<AdminVoucherMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/vouchers/${voucherId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
  });

  const result = await parseAdminVoucherResponse<unknown>(response);

  return normalizeVoucherMutationData(result.data);
}