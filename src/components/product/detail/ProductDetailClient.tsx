"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductCardItem, ProductVariant } from "@/types/product.type";
import type { ProductDetail } from "@/types/product-detail.type";

import ProductDetailBreadcrumb from "@/components/product/detail/ProductDetailBreadcrumb";
import ProductGallery from "@/components/product/detail/ProductGallery";
import ProductInfoPanel from "@/components/product/detail/ProductInfoPanel";
import ProductVariantSelector from "@/components/product/detail/ProductVariantSelector";
import ProductActionButtons from "@/components/product/detail/ProductActionButtons";
import ProductSpecifications from "@/components/product/detail/ProductSpecifications";
import ProductDescription from "@/components/product/detail/ProductDescription";
import ProductHighlightSpecs from "@/components/product/detail/ProductHighlightSpecs";
import ProductMiniPolicy from "@/components/product/detail/ProductMiniPolicy";
// import ProductReviews from "@/components/product/detail/ProductReviews";
import ProductReviewSection from "@/components/product/detail/ProductReviewSection";
import ProductPromotionBox from "@/components/product/detail/ProductPromotionBox";
import ProductTradeInBox from "@/components/product/detail/ProductTradeInBox";
import RelatedProducts from "@/components/product/detail/RelatedProducts";

import {
  mapProductDetailToRecentlyViewed,
  saveRecentlyViewedProduct,
} from "@/utils/recently-viewed-products";
type ProductDetailClientProps = {
  product: ProductDetail;
  relatedProducts: ProductCardItem[];
};


export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const defaultVariant = product.variants[0] ?? null;

  const [selectedColor, setSelectedColor] = useState<string>(
    defaultVariant?.color ?? product.colors[0] ?? ""
  );

  const [selectedCapacity, setSelectedCapacity] = useState<string>(
    defaultVariant?.capacity ?? product.capacities[0] ?? ""
  );

  const [selectedRam, setSelectedRam] = useState<string>(
    defaultVariant?.ram ?? product.ramOptions?.[0] ?? ""
  );

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    const matchedVariant = product.variants.find((variant) => {
      const isSameColor = variant.color === selectedColor;
      const isSameCapacity = variant.capacity === selectedCapacity;
      const isSameRam = variant.ram === selectedRam;

      return isSameColor && isSameCapacity && isSameRam;
    });

    return matchedVariant ?? null;
  }, [product.variants, selectedColor, selectedCapacity, selectedRam]);

  const galleryImages = useMemo(() => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }

    return product.images;
  }, [product.images, selectedVariant]);

  const firstGalleryImageUrl =
    galleryImages[0]?.imageUrl ?? product.images[0]?.imageUrl ?? "";

  const [selectedImageUrl, setSelectedImageUrl] =
    useState<string>(firstGalleryImageUrl);

  useEffect(() => {
    setSelectedImageUrl(firstGalleryImageUrl);
  }, [firstGalleryImageUrl]);

  const displayPrice = selectedVariant?.price ?? product.price;

  const displayStockQuantity =
    selectedVariant?.stockQuantity ?? product.stockQuantity;

  const displayStockStatus =
    selectedVariant?.stockStatus ?? product.stockStatus;
  useEffect(() => {
  saveRecentlyViewedProduct(mapProductDetailToRecentlyViewed(product));
  }, [product]);
  const reviewProductId = Number(
  product.productId ?? product.id
);

console.log("PRODUCT DETAIL REVIEW ID:", {
  productId: product.productId,

  id: product.id,
  reviewProductId,
  product,
});
  return (
  <main className="bg-white">
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ProductDetailBreadcrumb
        categoryName={product.categoryName}
        categorySlug={product.categorySlug}
        productName={product.name}
      />

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            productName={product.name}
            images={galleryImages}
            selectedImageUrl={selectedImageUrl}
            onSelectImage={setSelectedImageUrl}
          />

          <ProductHighlightSpecs specifications={product.specifications} />

          <ProductMiniPolicy />
        </div>

        <div className="min-w-0 space-y-5">
          <ProductInfoPanel
            name={product.name}
            price={displayPrice}
            oldPrice={product.oldPrice}
            discountLabel={product.discountLabel}
            installment={product.installment}
            ratingAverage={product.ratingAverage}
            reviewCount={product.reviewCount}
            sold={product.sold}
            stockQuantity={displayStockQuantity}
            stockStatus={displayStockStatus}
            hasSelectedVariant={Boolean(selectedVariant)}
          />

          <ProductVariantSelector
            colors={product.colors}
            capacities={product.capacities}
            ramOptions={product.ramOptions}
            selectedColor={selectedColor}
            selectedCapacity={selectedCapacity}
            selectedRam={selectedRam}
            onSelectColor={setSelectedColor}
            onSelectCapacity={setSelectedCapacity}
            onSelectRam={setSelectedRam}
          />
          <ProductPromotionBox promotions={product.promotions} />

          <ProductTradeInBox />
          <ProductActionButtons
            product={product}
            selectedVariant={selectedVariant}
          />
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <ProductSpecifications
          specifications={product.specifications}
          previewLimit={6}
        />

        <ProductDescription
          shortDescription={product.shortDescription}
          description={product.description}
        />
        {reviewProductId > 0 ? (
        <ProductReviewSection
          productId={reviewProductId}
          productName={product.name}
        />
        ) : null}
        <RelatedProducts products={relatedProducts} />
      </div>
    </section>
  </main>
);
}