import type {
  CreateUserAddressPayload,
  UpdateUserAddressPayload,
  UserAddress,
  UserAddressApiResponse,
  UserAddressDetailResponseData,
  UserAddressListResponseData,
} from "@/types/user-address.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseUserAddressResponse<T>(
  response: Response
): Promise<UserAddressApiResponse<T>> {
  const data = (await response.json()) as UserAddressApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function normalizeAddressListData(data: unknown): UserAddressListResponseData {
  if (Array.isArray(data)) {
    return {
      addresses: data as UserAddress[],
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "addresses" in data &&
    Array.isArray((data as { addresses: unknown }).addresses)
  ) {
    return {
      addresses: (data as { addresses: UserAddress[] }).addresses,
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return {
      addresses: (data as { items: UserAddress[] }).items,
    };
  }

  return {
    addresses: [],
  };
}

function normalizeAddressDetailData(data: unknown): UserAddressDetailResponseData {
  if (data && typeof data === "object" && "address" in data) {
    return data as UserAddressDetailResponseData;
  }

  return {
    address: data as UserAddress,
  };
}

/**
 * GET /api/user/addresses
 */
export async function getUserAddresses(
  accessToken: string
): Promise<UserAddressListResponseData> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/user/addresses`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseUserAddressResponse<unknown>(response);

  return normalizeAddressListData(result.data);
}

/**
 * POST /api/user/addresses
 */
export async function createUserAddress(
  payload: CreateUserAddressPayload,
  accessToken: string
): Promise<UserAddressDetailResponseData> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/user/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseUserAddressResponse<unknown>(response);

  return normalizeAddressDetailData(result.data);
}

/**
 * GET /api/user/addresses/:addressId
 */
export async function getUserAddressById(
  addressId: number,
  accessToken: string
): Promise<UserAddressDetailResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/user/addresses/${addressId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseUserAddressResponse<unknown>(response);

  return normalizeAddressDetailData(result.data);
}

/**
 * PATCH /api/user/addresses/:addressId
 */
export async function updateUserAddress(
  addressId: number,
  payload: UpdateUserAddressPayload,
  accessToken: string
): Promise<UserAddressDetailResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/user/addresses/${addressId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseUserAddressResponse<unknown>(response);

  return normalizeAddressDetailData(result.data);
}

/**
 * PATCH /api/user/addresses/:addressId/default
 */
export async function setDefaultUserAddress(
  addressId: number,
  accessToken: string
): Promise<UserAddressDetailResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/user/addresses/${addressId}/default`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const result = await parseUserAddressResponse<unknown>(response);

  return normalizeAddressDetailData(result.data);
}

/**
 * DELETE /api/user/addresses/:addressId
 */
export async function deleteUserAddress(
  addressId: number,
  accessToken: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/user/addresses/${addressId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const result = await parseUserAddressResponse<unknown>(response);

  return {
    success: result.success,
    message: result.message,
  };
}