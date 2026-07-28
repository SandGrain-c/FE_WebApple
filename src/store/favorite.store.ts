import { create } from "zustand";

import {
  addFavoriteProduct,
  checkFavoriteProduct,
  getFavoriteProducts,
  removeFavoriteProduct,
} from "@/services/favorite.service";
import { useAuthStore } from "@/store/auth.store";
import type { FavoriteProductItem } from "@/types/favorite.type";

type FavoriteActionResult = {
  success: boolean;
  message: string;
};

type FavoriteState = {
  items: FavoriteProductItem[];
  favoriteProductIds: number[];

  isFetching: boolean;
  isUpdating: boolean;
  hasLoaded: boolean;
  error: string | null;

  fetchFavorites: (force?: boolean) => Promise<FavoriteActionResult>;
  checkFavorite: (productId: number) => Promise<boolean>;
  toggleFavorite: (productId: number) => Promise<FavoriteActionResult>;
  addFavorite: (productId: number) => Promise<FavoriteActionResult>;
  removeFavorite: (productId: number) => Promise<FavoriteActionResult>;

  isFavorite: (productId: number) => boolean;
  resetFavorites: () => void;
  clearError: () => void;
};

function getAccessTokenOrThrow() {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error("Bạn cần đăng nhập để sử dụng yêu thích.");
  }

  return accessToken;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra với sản phẩm yêu thích.";
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  items: [],
  favoriteProductIds: [],

  isFetching: false,
  isUpdating: false,
  hasLoaded: false,
  error: null,

  fetchFavorites: async (force = false) => {
  const currentState = get();

  if (currentState.isFetching) {
    return {
      success: true,
      message: "Đang tải danh sách yêu thích.",
    };
  }

  if (currentState.hasLoaded && !force) {
    return {
      success: true,
      message: "Danh sách yêu thích đã được tải.",
    };
  }

  try {
    set({
      isFetching: true,
      error: null,
    });

    const accessToken = getAccessTokenOrThrow();
    const items = await getFavoriteProducts(accessToken);

    set({
      items,
      favoriteProductIds: items.map((item) => item.productId),
      isFetching: false,
      hasLoaded: true,
      error: null,
    });

    return {
      success: true,
      message: "Lấy danh sách yêu thích thành công.",
    };
  } catch (error) {
    const message = getErrorMessage(error);

    set({
      isFetching: false,
      error: message,
    });

    return {
      success: false,
      message,
    };
  }
},

  checkFavorite: async (productId) => {
    try {
      const accessToken = getAccessTokenOrThrow();
      const isFavorite = await checkFavoriteProduct(productId, accessToken);

      set((state) => {
        const existed = state.favoriteProductIds.includes(productId);

        if (isFavorite && !existed) {
          return {
            favoriteProductIds: [...state.favoriteProductIds, productId],
          };
        }

        if (!isFavorite && existed) {
          return {
            favoriteProductIds: state.favoriteProductIds.filter(
              (id) => id !== productId
            ),
          };
        }

        return state;
      });

      return isFavorite;
    } catch {
      return false;
    }
  },

  addFavorite: async (productId) => {
    try {
      set({
        isUpdating: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();

      await addFavoriteProduct(productId, accessToken);

      set((state) => ({
  favoriteProductIds: state.favoriteProductIds.includes(productId)
    ? state.favoriteProductIds
    : [...state.favoriteProductIds, productId],
  isUpdating: false,
  hasLoaded: false,
  error: null,
}));

      return {
        success: true,
        message: "Đã thêm sản phẩm vào yêu thích.",
      };
    } catch (error) {
      const message = getErrorMessage(error);

      set({
        isUpdating: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  removeFavorite: async (productId) => {
    try {
      set({
        isUpdating: true,
        error: null,
      });

      const accessToken = getAccessTokenOrThrow();

      await removeFavoriteProduct(productId, accessToken);

      set((state) => ({
        favoriteProductIds: state.favoriteProductIds.filter(
          (id) => id !== productId
        ),
        items: state.items.filter((item) => item.productId !== productId),
        isUpdating: false,
        error: null,
      }));

      return {
        success: true,
        message: "Đã bỏ sản phẩm khỏi yêu thích.",
      };
    } catch (error) {
      const message = getErrorMessage(error);

      set({
        isUpdating: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  toggleFavorite: async (productId) => {
    const isFavorite = get().favoriteProductIds.includes(productId);

    if (isFavorite) {
      return get().removeFavorite(productId);
    }

    return get().addFavorite(productId);
  },

  isFavorite: (productId) => {
    return get().favoriteProductIds.includes(productId);
  },

  resetFavorites: () => {
    set({
      items: [],
      favoriteProductIds: [],
      isFetching: false,
      isUpdating: false,
      hasLoaded: false,
      error: null,
    });
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));