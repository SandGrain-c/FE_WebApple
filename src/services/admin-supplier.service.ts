import type {
  AdminSupplier,
  AdminSupplierApiResponse,
  AdminSupplierDetailResponseData,
  AdminSupplierListQuery,
  AdminSupplierListResponseData,
  AdminSupplierMutationResponseData,
  CreateAdminSupplierPayload,
  UpdateAdminSupplierPayload,
} from "@/types/admin-supplier.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

async function parseAdminSupplierResponse<T>(
  response: Response
): Promise<AdminSupplierApiResponse<T>> {
  const data = (await response.json()) as AdminSupplierApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildSupplierQueryString(query?: AdminSupplierListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.status) {
    searchParams.set("status", query.status);
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

function normalizeSupplierListData(data: unknown): AdminSupplierListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as AdminSupplier[],
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
    const typedData = data as AdminSupplierListResponseData;

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

function normalizeSupplierDetailData(
  data: unknown
): AdminSupplierDetailResponseData {
  if (data && typeof data === "object" && "supplier" in data) {
    return data as AdminSupplierDetailResponseData;
  }

  return {
    supplier: data as AdminSupplier,
  };
}

function normalizeSupplierMutationData(
  data: unknown
): AdminSupplierMutationResponseData {
  if (data && typeof data === "object" && "supplier" in data) {
    return data as AdminSupplierMutationResponseData;
  }

  return {
    supplier: data as AdminSupplier,
  };
}

/**
 * GET /api/admin/suppliers
 */
export async function getAdminSuppliers(
  adminAccessToken: string,
  query?: AdminSupplierListQuery
): Promise<AdminSupplierListResponseData> {
  const queryString = buildSupplierQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/suppliers${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminSupplierResponse<unknown>(response);

  return normalizeSupplierListData(result.data);
}

/**
 * GET /api/admin/suppliers/:supplierId
 */
export async function getAdminSupplierById(
  adminAccessToken: string,
  supplierId: number
): Promise<AdminSupplierDetailResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/suppliers/${supplierId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminSupplierResponse<unknown>(response);

  return normalizeSupplierDetailData(result.data);
}

/**
 * POST /api/admin/suppliers
 */
export async function createAdminSupplier(
  adminAccessToken: string,
  payload: CreateAdminSupplierPayload
): Promise<AdminSupplierMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/suppliers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseAdminSupplierResponse<unknown>(response);

  return normalizeSupplierMutationData(result.data);
}

/**
 * PATCH /api/admin/suppliers/:supplierId
 */
export async function updateAdminSupplier(
  adminAccessToken: string,
  supplierId: number,
  payload: UpdateAdminSupplierPayload
): Promise<AdminSupplierMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/suppliers/${supplierId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseAdminSupplierResponse<unknown>(response);

  return normalizeSupplierMutationData(result.data);
}

/**
 * DELETE /api/admin/suppliers/:supplierId
 * BE xử lý thành ngừng hoạt động: status = Inactive.
 */
export async function deactivateAdminSupplier(
  adminAccessToken: string,
  supplierId: number
): Promise<AdminSupplierMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/suppliers/${supplierId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    }
  );

  const result = await parseAdminSupplierResponse<unknown>(response);

  return normalizeSupplierMutationData(result.data);
}