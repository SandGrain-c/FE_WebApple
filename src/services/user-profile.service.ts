import type {
  UpdateUserProfilePayload,
  UpdateUserProfileResponseData,
  UserProfileApiResponse,
} from "@/types/user-profile.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseUserProfileResponse<T>(
  response: Response
): Promise<UserProfileApiResponse<T>> {
  const data = (await response.json()) as UserProfileApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

/**
 * PATCH /api/users/profile
 */
export async function updateUserProfile(
  payload: UpdateUserProfilePayload,
  accessToken: string
): Promise<UpdateUserProfileResponseData> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/users/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result =
    await parseUserProfileResponse<UpdateUserProfileResponseData>(response);

  return result.data;
}