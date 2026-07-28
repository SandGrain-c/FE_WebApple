// src/types/product.type.ts
export type StockStatus = "in-stock" | "out-of-stock";

export type ProductVariantImage = {
  imageId: number;
  imageUrl: string;
  altText: string | null;
  isThumbnail: boolean;
  sortOrder: number;
};

export type ProductVariant = {
  variantId: number;
  sku: string;
  color: string;
  capacity: string;
  ram: string;
  country: string | null;
  price: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  images: ProductVariantImage[];
};

export type ProductCardItem = {
  id: number;
  name: string;
  slug: string;
  image: string;

  price: number;
  oldPrice?: number | null;
  discountLabel?: string | null;
  installment?: string | null;
  promotions?: string[];

  categorySlug: string;
  categoryName: string;

  colors: string[];
  capacities: string[];
  ramOptions?: string[];

  stockQuantity: number;
  stockStatus: StockStatus;

  sold?: number;
  createdAt: string;

  variants?: ProductVariant[];
};

export type ProductFilters = {
  colors: string[];
  capacities: string[];
  ramOptions: string[];
  priceRange: {
    min: number;
    max: number;
  };
};

export type ProductPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type GetProductsResponse = {
  success: boolean;
  message: string;
  data: {
    items: ProductCardItem[];
    pagination: ProductPagination;
    filters: ProductFilters;
  };
};