import type {
  ApiResponse,
  GetMeResponseData,
  LoginPayload,
  LoginResponseData,
  LogoutResponseData,
  RegisterPayload,
  RegisterResponseData,
} from "@/types/auth.type";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

export async function register(
  payload: RegisterPayload
): Promise<RegisterResponseData> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await parseApiResponse<RegisterResponseData>(response);

  return result.data;
}

export async function login(payload: LoginPayload): Promise<LoginResponseData> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await parseApiResponse<LoginResponseData>(response);

  return result.data;
}

export async function getMe(
  accessToken: string
): Promise<GetMeResponseData> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = await parseApiResponse<GetMeResponseData>(response);

  return result.data;
}

export async function logout(
  accessToken: string
): Promise<LogoutResponseData> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  await parseApiResponse<LogoutResponseData>(response);

  return null;
}