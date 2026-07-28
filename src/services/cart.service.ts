import type {
  AddToCartPayload,
  CartApiResponse,
  CartResponse,
  SelectAllCartItemsPayload,
  UpdateCartItemPayload,
  UpdateCartItemSelectedPayload,
} from "@/types/cart.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getAuthHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseCartResponse(
  response: Response,
  fallbackMessage: string
): Promise<CartResponse> {
  const result = (await response.json()) as CartApiResponse<CartResponse>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

/**
 * GET /api/cart
 */
export async function getCart(accessToken: string): Promise<CartResponse> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/cart`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseCartResponse(response, "Không thể lấy giỏ hàng.");
}

/**
 * POST /api/cart/items
 */
export async function addToCart(
  payload: AddToCartPayload,
  accessToken: string
): Promise<CartResponse> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/cart/items`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      productId: payload.productId,
      variantId: payload.variantId,
      quantity: payload.quantity ?? 1,
    }),
  });

  return parseCartResponse(response, "Không thể thêm sản phẩm vào giỏ hàng.");
}

/**
 * PATCH /api/cart/items/:cartItemId
 */
export async function updateCartItem(
  cartItemId: number,
  quantity: number,
  accessToken: string
): Promise<CartResponse> {
  const payload: UpdateCartItemPayload = {
    quantity,
  };

  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/cart/items/${cartItemId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }
  );

  return parseCartResponse(response, "Không thể cập nhật số lượng sản phẩm.");
}

/**
 * PATCH /api/cart/items/:cartItemId/selected
 */
export async function updateCartItemSelected(
  cartItemId: number,
  selected: boolean,
  accessToken: string
): Promise<CartResponse> {
  const payload: UpdateCartItemSelectedPayload = {
    selected,
  };

  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/cart/items/${cartItemId}/selected`,
    {
      method: "PATCH",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }
  );

  return parseCartResponse(
    response,
    "Không thể cập nhật trạng thái chọn sản phẩm."
  );
}

/**
 * PATCH /api/cart/select-all
 */
export async function selectAllCartItems(
  selected: boolean,
  accessToken: string
): Promise<CartResponse> {
  const payload: SelectAllCartItemsPayload = {
    selected,
  };

  const response = await fetch(`${CUSTOMER_API_BASE_URL}/cart/select-all`, {
    method: "PATCH",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  return parseCartResponse(
    response,
    selected
      ? "Không thể chọn tất cả sản phẩm."
      : "Không thể bỏ chọn tất cả sản phẩm."
  );
}

/**
 * DELETE /api/cart/items/:cartItemId
 */
export async function removeCartItem(
  cartItemId: number,
  accessToken: string
): Promise<CartResponse> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/cart/items/${cartItemId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseCartResponse(response, "Không thể xóa sản phẩm khỏi giỏ hàng.");
}

/**
 * DELETE /api/cart
 */
export async function clearCart(accessToken: string): Promise<CartResponse> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/cart`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseCartResponse(response, "Không thể xóa toàn bộ giỏ hàng.");
}