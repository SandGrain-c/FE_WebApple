import type {
  AdminShipment,
  AdminShipmentApiResponse,
  AdminShipmentDetailResponseData,
  AdminShipmentListQuery,
  AdminShipmentListResponseData,
  AdminShipmentMutationResponseData,
  CreateAdminShipmentPayload,
  UpdateAdminShipmentPayload,
  UpdateAdminShipmentStatusPayload,
} from "@/types/admin-shipment.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

async function parseAdminShipmentResponse<T>(
  response: Response
): Promise<AdminShipmentApiResponse<T>> {
  const data = (await response.json()) as AdminShipmentApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildShipmentQueryString(query?: AdminShipmentListQuery) {
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

  if (query.orderId) {
    searchParams.set("orderId", String(query.orderId));
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

function normalizeShipmentListData(data: unknown): AdminShipmentListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as AdminShipment[],
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
    const typedData = data as AdminShipmentListResponseData;

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

function normalizeShipmentDetailData(
  data: unknown
): AdminShipmentDetailResponseData {
  if (data && typeof data === "object" && "shipment" in data) {
    return data as AdminShipmentDetailResponseData;
  }

  return {
    shipment: data as AdminShipment,
  };
}

function normalizeShipmentMutationData(
  data: unknown
): AdminShipmentMutationResponseData {
  if (data && typeof data === "object" && "shipment" in data) {
    return data as AdminShipmentMutationResponseData;
  }

  return {
    shipment: data as AdminShipment,
  };
}

/**
 * GET /api/admin/shipments
 */
export async function getAdminShipments(
  adminAccessToken: string,
  query?: AdminShipmentListQuery
): Promise<AdminShipmentListResponseData> {
  const queryString = buildShipmentQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/shipments${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminShipmentResponse<unknown>(response);

  return normalizeShipmentListData(result.data);
}

/**
 * GET /api/admin/shipments/:shipmentId
 */
export async function getAdminShipmentById(
  adminAccessToken: string,
  shipmentId: number
): Promise<AdminShipmentDetailResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/shipments/${shipmentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminShipmentResponse<unknown>(response);

  return normalizeShipmentDetailData(result.data);
}

/**
 * POST /api/admin/shipments
 */
export async function createAdminShipment(
  adminAccessToken: string,
  payload: CreateAdminShipmentPayload
): Promise<AdminShipmentMutationResponseData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/shipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseAdminShipmentResponse<unknown>(response);

  return normalizeShipmentMutationData(result.data);
}

/**
 * PATCH /api/admin/shipments/:shipmentId
 */
export async function updateAdminShipment(
  adminAccessToken: string,
  shipmentId: number,
  payload: UpdateAdminShipmentPayload
): Promise<AdminShipmentMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/shipments/${shipmentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseAdminShipmentResponse<unknown>(response);

  return normalizeShipmentMutationData(result.data);
}

/**
 * PATCH /api/admin/shipments/:shipmentId/status
 */
export async function updateAdminShipmentStatus(
  adminAccessToken: string,
  shipmentId: number,
  payload: UpdateAdminShipmentStatusPayload
): Promise<AdminShipmentMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/shipments/${shipmentId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseAdminShipmentResponse<unknown>(response);

  return normalizeShipmentMutationData(result.data);
}

/**
 * DELETE /api/admin/shipments/:shipmentId
 * BE không xóa cứng, chuyển shipment sang Cancelled.
 */
export async function cancelAdminShipment(
  adminAccessToken: string,
  shipmentId: number
): Promise<AdminShipmentMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/shipments/${shipmentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    }
  );

  const result = await parseAdminShipmentResponse<unknown>(response);

  return normalizeShipmentMutationData(result.data);
}