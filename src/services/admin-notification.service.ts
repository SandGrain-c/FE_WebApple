import type {
  AdminNotificationApiResponse,
  AdminNotificationSummary,
} from "@/types/admin-notification.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

async function parseAdminNotificationResponse<T>(
  response: Response
): Promise<AdminNotificationApiResponse<T>> {
  const data = (await response.json()) as AdminNotificationApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra khi lấy thông báo admin.");
  }

  return data;
}

/**
 * GET /api/admin/notifications/summary
 */
export async function getAdminNotificationSummary(
  adminAccessToken: string
): Promise<AdminNotificationSummary> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/notifications/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result =
    await parseAdminNotificationResponse<AdminNotificationSummary>(response);

  return result.data;
}