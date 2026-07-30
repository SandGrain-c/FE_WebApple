import type { ProductDetail } from "@/types/product-detail.type";
import type { ProductCardItem } from "@/types/product.type";
import type { RecentlyViewedProduct } from "@/types/recently-viewed.type";

const RECENTLY_VIEWED_KEY = "recently_viewed_products";
const MAX_RECENTLY_VIEWED = 12;

export function getRecentlyViewedProducts(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const data = localStorage.getItem(RECENTLY_VIEWED_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as RecentlyViewedProduct[];
  } catch (error) {
    console.error("Lỗi khi đọc sản phẩm đã xem:", error);
    return [];
  }
}

export function saveRecentlyViewedProduct(product: RecentlyViewedProduct) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const currentProducts = getRecentlyViewedProducts();

    const filteredProducts = currentProducts.filter(
      (item) => String(item.id) !== String(product.id)
    );

    const nextProducts = [product, ...filteredProducts].slice(
      0,
      MAX_RECENTLY_VIEWED
    );

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(nextProducts));

    window.dispatchEvent(new Event("recently-viewed-products-updated"));
  } catch (error) {
    console.error("Lỗi khi lưu sản phẩm đã xem:", error);
  }
}

export function mapProductDetailToRecentlyViewed(
  product: ProductDetail
): RecentlyViewedProduct {
  const image =
    product.images?.find((item) => item.isThumbnail)?.imageUrl ??
    product.images?.[0]?.imageUrl ??
    "";

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image,
    categorySlug: product.categorySlug,
    price: product.price,
    oldPrice: product.oldPrice,
  };
}

export function mapProductCardToRecentlyViewed(
  product: ProductCardItem
): RecentlyViewedProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: product.image,
    categorySlug: product.categorySlug,
    price: product.price,
    oldPrice: product.oldPrice,
  };
}