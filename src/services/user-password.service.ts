import type {
  ChangeUserPasswordApiResponse,
  ChangeUserPasswordPayload,
} from "@/types/user-password.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseChangePasswordResponse(
  response: Response
): Promise<ChangeUserPasswordApiResponse> {
  const data = (await response.json()) as ChangeUserPasswordApiResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Không thể đổi mật khẩu.");
  }

  return data;
}

/**
 * PATCH /api/users/password
 */
export async function changeUserPassword(
  payload: ChangeUserPasswordPayload,
  accessToken: string
): Promise<ChangeUserPasswordApiResponse> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/users/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return parseChangePasswordResponse(response);
}