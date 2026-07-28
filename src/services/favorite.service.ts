import type {
  FavoriteApiResponse,
  FavoriteCheckResponseData,
  FavoriteProductItem,
} from "@/types/favorite.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getAuthHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseFavoriteResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<FavoriteApiResponse<T>> {
  const result = (await response.json()) as FavoriteApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

function normalizeFavoriteItems(data: unknown): FavoriteProductItem[] {
  if (Array.isArray(data)) {
    return data as FavoriteProductItem[];
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: FavoriteProductItem[] }).items;
  }

  return [];
}

function normalizeFavoriteCheck(data: unknown) {
  if (!data || typeof data !== "object") {
    return false;
  }

  const checkData = data as FavoriteCheckResponseData;

  return Boolean(
    checkData.isFavorite ??
      checkData.favorite ??
      checkData.exists ??
      checkData.favoriteId
  );
}

export async function getFavoriteProducts(
  accessToken: string
): Promise<FavoriteProductItem[]> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/favorites`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseFavoriteResponse<unknown>(
    response,
    "Không thể lấy danh sách sản phẩm yêu thích."
  );

  return normalizeFavoriteItems(result.data);
}

export async function addFavoriteProduct(
  productId: number,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/favorites/${productId}`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });

  await parseFavoriteResponse<unknown>(
    response,
    "Không thể thêm sản phẩm vào yêu thích."
  );
}

export async function removeFavoriteProduct(
  productId: number,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/favorites/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  await parseFavoriteResponse<unknown>(
    response,
    "Không thể bỏ sản phẩm khỏi yêu thích."
  );
}

export async function checkFavoriteProduct(
  productId: number,
  accessToken: string
): Promise<boolean> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/favorites/check/${productId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseFavoriteResponse<unknown>(
    response,
    "Không thể kiểm tra sản phẩm yêu thích."
  );

  return normalizeFavoriteCheck(result.data);
}