import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProductCardItem } from "@/types/product.type";

export type CompareItem = Pick<
  ProductCardItem,
  | "id"
  | "name"
  | "slug"
  | "image"
  | "price"
  | "categorySlug"
  | "categoryName"
>;

type CompareResult = {
  success: boolean;
  message: string;
};

type CompareState = {
  categorySlug: string | null;
  items: CompareItem[];
  addToCompare: (product: CompareItem) => CompareResult;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
  isCompared: (productId: number) => boolean;
  canCompare: (product: CompareItem) => CompareResult;
};

export const MAX_COMPARE_ITEMS = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      categorySlug: null,
      items: [],

      canCompare: (product) => {
        const { categorySlug, items } = get();

        const existed = items.some((item) => item.id === product.id);

        if (existed) {
          return {
            success: false,
            message: "Sản phẩm đã có trong danh sách so sánh.",
          };
        }

        if (categorySlug && categorySlug !== product.categorySlug) {
          return {
            success: false,
            message: "Chỉ có thể so sánh sản phẩm cùng danh mục.",
          };
        }

        if (items.length >= MAX_COMPARE_ITEMS) {
          return {
            success: false,
            message: `Chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm.`,
          };
        }

        return {
          success: true,
          message: "Có thể thêm vào so sánh.",
        };
      },

      addToCompare: (product) => {
        const validation = get().canCompare(product);

        if (!validation.success) {
          return validation;
        }

        const { categorySlug, items } = get();

        const compareItem: CompareItem = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          price: product.price,
          categorySlug: product.categorySlug,
          categoryName: product.categoryName,
        };

        set({
          categorySlug: categorySlug ?? product.categorySlug,
          items: [...items, compareItem],
        });

        return {
          success: true,
          message: "Đã thêm vào so sánh.",
        };
      },

      removeFromCompare: (productId) => {
        const nextItems = get().items.filter((item) => item.id !== productId);

        set({
          items: nextItems,
          categorySlug: nextItems.length > 0 ? nextItems[0].categorySlug : null,
        });
      },

      clearCompare: () => {
        set({
          categorySlug: null,
          items: [],
        });
      },

      isCompared: (productId) => {
        return get().items.some((item) => item.id === productId);
      },
    }),
    {
      name: "apple-store-compare",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categorySlug: state.categorySlug,
        items: state.items,
      }),
    },
  ),
);