export type FavoriteStockStatus = "in-stock" | "out-of-stock";

export type FavoriteProductItem = {
  favoriteId: number;
  productId: number;
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  image: string | null;
  price: number | null;
  oldPrice: number | null;
  discountLabel: string | null;
  installment: string | null;
  stockQuantity: number;
  stockStatus: FavoriteStockStatus;
  createdAt: string;
};

export type FavoriteListResponseData = {
  items: FavoriteProductItem[];
};

export type FavoriteCheckResponseData = {
  isFavorite?: boolean;
  favorite?: boolean;
  exists?: boolean;
  favoriteId?: number | null;
};

export type FavoriteApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};