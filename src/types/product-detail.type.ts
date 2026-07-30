import type {
  ProductCardItem,
  ProductVariant,
  StockStatus,
} from "@/types/product.type";

export type ProductDetailImage = {
  imageId: number;
  productId: number;
  variantId?: number | null;

  color: string;
  imageUrl: string;
  altText: string | null;

  isThumbnail: boolean;
  sortOrder: number;
};

export type ProductSpecificationItem = {
  label: string;
  value: string;
};

export type ProductSpecificationGroup = {
  groupName: string;
  items: ProductSpecificationItem[];
};

export type ProductDetail = {
  id: number;
  name: string;
  slug: string;
  productId: number;
  description: string | null;
  shortDescription?: string;

  categoryId: number;
  categorySlug: string;
  categoryName: string;

  price: number;
  oldPrice?: number | null;
  discountLabel?: string | null;
  installment?: string | null;
  promotions?: string[];

  images: ProductDetailImage[];
  variants: ProductVariant[];
  specifications: ProductSpecificationGroup[];

  colors: string[];
  capacities: string[];
  ramOptions?: string[];

  stockQuantity: number;
  stockStatus: StockStatus;

  sold?: number;
  ratingAverage?: number;
  reviewCount?: number;

  isActive: boolean;
  createdAt: string;
};

export type ProductDetailResponse = {
  product: ProductDetail;
  relatedProducts: ProductCardItem[];
};