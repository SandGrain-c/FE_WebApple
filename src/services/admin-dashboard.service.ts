import type {
  AdminDashboardApiResponse,
  AdminDashboardOverviewData,
  AdminDashboardQuery,
  AdminLowStockVariant,
  AdminRecentOrder,
  AdminRevenueSeriesItem,
  AdminTopProduct,
} from "@/types/admin-dashboard.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

/**
 * Parse response chung cho Admin Dashboard API.
 * Nếu BE trả lỗi thì ném Error để component xử lý.
 */
async function parseAdminDashboardResponse<T>(
  response: Response
): Promise<AdminDashboardApiResponse<T>> {
  const data = (await response.json()) as AdminDashboardApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

/**
 * Tạo query string cho Dashboard API.
 * Hỗ trợ days, dateFrom, dateTo, limit, threshold.
 */
function buildDashboardQueryString(query?: AdminDashboardQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (query.days) {
    searchParams.set("days", String(query.days));
  }

  if (query.dateFrom) {
    searchParams.set("dateFrom", query.dateFrom);
  }

  if (query.dateTo) {
    searchParams.set("dateTo", query.dateTo);
  }

  if (query.limit) {
    searchParams.set("limit", String(query.limit));
  }

  if (query.threshold) {
    searchParams.set("threshold", String(query.threshold));
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

/**
 * Lấy toàn bộ dữ liệu dashboard trong một lần gọi.
 * API: GET /api/admin/dashboard/overview
 */
export async function getAdminDashboardOverview(
  adminAccessToken: string,
  query?: AdminDashboardQuery
): Promise<AdminDashboardOverviewData> {
  const queryString = buildDashboardQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/dashboard/overview${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminDashboardResponse<AdminDashboardOverviewData>(response);

  return result.data;
}

/**
 * Các hàm dưới để sẵn cho trường hợp sau này muốn tách từng widget gọi riêng.
 */
export async function getAdminDashboardRevenue(
  adminAccessToken: string,
  query?: AdminDashboardQuery
): Promise<AdminRevenueSeriesItem[]> {
  const queryString = buildDashboardQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/dashboard/revenue${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminDashboardResponse<AdminRevenueSeriesItem[]>(response);

  return result.data;
}

export async function getAdminDashboardTopProducts(
  adminAccessToken: string,
  query?: AdminDashboardQuery
): Promise<AdminTopProduct[]> {
  const queryString = buildDashboardQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/dashboard/top-products${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminDashboardResponse<AdminTopProduct[]>(response);

  return result.data;
}

export async function getAdminDashboardLowStock(
  adminAccessToken: string,
  query?: AdminDashboardQuery
): Promise<AdminLowStockVariant[]> {
  const queryString = buildDashboardQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/dashboard/low-stock${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminDashboardResponse<AdminLowStockVariant[]>(response);

  return result.data;
}

export async function getAdminDashboardRecentOrders(
  adminAccessToken: string,
  query?: AdminDashboardQuery
): Promise<AdminRecentOrder[]> {
  const queryString = buildDashboardQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/dashboard/recent-orders${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminDashboardResponse<AdminRecentOrder[]>(response);

  return result.data;
}