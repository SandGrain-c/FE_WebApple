import type { ProductDetail } from "@/types/product-detail.type";

export function getRepresentativeVariant(product: ProductDetail) {
  return product.variants[0] ?? null;
}

export function getCompareProductImage(
  product: ProductDetail,
  fallbackImage?: string,
) {
  const representativeVariant = getRepresentativeVariant(product);

  return (
    representativeVariant?.images[0]?.imageUrl ??
    product.images.find((image) => image.isThumbnail)?.imageUrl ??
    product.images[0]?.imageUrl ??
    (fallbackImage || "/sale/flash-sale-1.webp")
  );
}

export function getRepresentativeVariantLabel(product: ProductDetail) {
  const representativeVariant = getRepresentativeVariant(product);
  if (!representativeVariant) return null;

  const attributes = [
    representativeVariant.color,
    representativeVariant.capacity,
    representativeVariant.ram,
  ].filter((value) => value?.trim());

  return attributes.length > 0 ? attributes.join(" · ") : null;
}
