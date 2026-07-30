export type RecentlyViewedProduct = {
  id: number | string;
  name: string;
  slug: string;
  image: string;

  categorySlug: string;

  price: number;
  oldPrice?: number | null;
  discountPercent?: number;
};