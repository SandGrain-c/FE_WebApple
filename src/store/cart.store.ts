// src/store/cart.store.ts

import { create } from "zustand";

import type {
  AddToCartPayload,
  CartItem,
  CartResponse,
} from "@/types/cart.type";

import {
  addToCart as addToCartService,
  clearCart as clearCartService,
  getCart,
  removeCartItem,
  selectAllCartItems,
  updateCartItem,
  updateCartItemSelected,
} from "@/services/cart.service";

import { useAuthStore } from "@/store/auth.store";

type CartActionResult = {
  success: boolean;
  message: string;
};

type CartState = {
  items: CartItem[];

  totalQuantity: number;
  totalPrice: number;

  selectedQuantity: number;
  selectedTotalPrice: number;

  isLoading: boolean;
  error: string | null;

  fetchCart: () => Promise<CartActionResult>;

  addToCart: (payload: AddToCartPayload) => Promise<CartActionResult>;

  updateQuantity: (
    cartItemId: number,
    quantity: number
  ) => Promise<CartActionResult>;

  updateSelected: (
    cartItemId: number,
    selected: boolean
  ) => Promise<CartActionResult>;

  selectAll: (selected: boolean) => Promise<CartActionResult>;

  removeItem: (cartItemId: number) => Promise<CartActionResult>;

  clearCart: () => Promise<CartActionResult>;

  resetCart: () => void;
  clearError: () => void;
};

const emptyCart: CartResponse = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
  selectedQuantity: 0,
  selectedTotalPrice: 0,
};

function getAccessTokenOrThrow() {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error("Bạn cần đăng nhập để sử dụng giỏ hàng.");
  }

  return accessToken;
}

function applyCartData(data: CartResponse) {
  return {
    items: data.items,
    totalQuantity: data.totalQuantity,
    totalPrice: data.totalPrice,
    selectedQuantity: data.selectedQuantity,
    selectedTotalPrice: data.selectedTotalPrice,
  };
}

function handleCartError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Có lỗi xảy ra với giỏ hàng.";

  const shouldLogout =
    message.includes("chưa đăng nhập") ||
    message.includes("Unauthorized") ||
    message.includes("401") ||
    message.includes("403");

  if (shouldLogout) {
    useAuthStore.getState().logout();
  }

  return message;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  totalQuantity: 0,
  totalPrice: 0,

  selectedQuantity: 0,
  selectedTotalPrice: 0,

  isLoading: false,
  error: null,

  fetchCart: async () => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();
      const data = await getCart(accessToken);

      set({
        ...applyCartData(data),
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: "Lấy giỏ hàng thành công.",
      };
    } catch (error) {
      const message = handleCartError(error);

      set({
        ...applyCartData(emptyCart),
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  addToCart: async (payload) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();
      const data = await addToCartService(payload, accessToken);

      set({
        ...applyCartData(data),
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: "Đã thêm sản phẩm vào giỏ hàng.",
      };
    } catch (error) {
      const message = handleCartError(error);

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  updateQuantity: async (cartItemId, quantity) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();
      const data = await updateCartItem(cartItemId, quantity, accessToken);

      set({
        ...applyCartData(data),
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: "Đã cập nhật số lượng sản phẩm.",
      };
    } catch (error) {
      const message = handleCartError(error);

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  updateSelected: async (cartItemId, selected) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();

      const data = await updateCartItemSelected(
        cartItemId,
        selected,
        accessToken
      );

      set({
        ...applyCartData(data),
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: selected
          ? "Đã chọn sản phẩm."
          : "Đã bỏ chọn sản phẩm.",
      };
    } catch (error) {
      const message = handleCartError(error);

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  selectAll: async (selected) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();
      const data = await selectAllCartItems(selected, accessToken);

      set({
        ...applyCartData(data),
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: selected
          ? "Đã chọn tất cả sản phẩm."
          : "Đã bỏ chọn tất cả sản phẩm.",
      };
    } catch (error) {
      const message = handleCartError(error);

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  removeItem: async (cartItemId) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();
      const data = await removeCartItem(cartItemId, accessToken);

      set({
        ...applyCartData(data),
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: "Đã xóa sản phẩm khỏi giỏ hàng.",
      };
    } catch (error) {
      const message = handleCartError(error);

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  clearCart: async () => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();
      const data = await clearCartService(accessToken);

      set({
        ...applyCartData(data),
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: "Đã xóa toàn bộ giỏ hàng.",
      };
    } catch (error) {
      const message = handleCartError(error);

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  resetCart: () => {
    set({
      ...applyCartData(emptyCart),
      isLoading: false,
      error: null,
    });
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));