import type { ProductDetail } from "@/types/product-detail.type";

type ProductJsonLdProps = {
  product: ProductDetail;
};

const SITE_NAME = "Đức Bách Hoá";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PRICE_CURRENCY = "VND";
const BRAND_NAME = "Apple";

function toAbsoluteUrl(url: string) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function getDescription(product: ProductDetail) {
  return (
    product.shortDescription ||
    product.description ||
    `Mua ${product.name} chính hãng tại ${SITE_NAME}.`
  );
}

function getImageUrls(product: ProductDetail) {
  const productImages = product.images.map((image) => image.imageUrl);

  const variantImages = product.variants.flatMap((variant) =>
    variant.images.map((image) => image.imageUrl)
  );

  const uniqueImages = Array.from(
    new Set([...productImages, ...variantImages])
  );

  return uniqueImages
    .map(toAbsoluteUrl)
    .filter((imageUrl) => Boolean(imageUrl));
}

function getPriceRange(product: ProductDetail) {
  const prices = product.variants
    .map((variant) => variant.price)
    .filter((price) => typeof price === "number" && price > 0);

  if (prices.length === 0) {
    return {
      lowPrice: product.price,
      highPrice: product.price,
      offerCount: 1,
    };
  }

  return {
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    offerCount: prices.length,
  };
}

function getAvailability(product: ProductDetail) {
  return product.stockStatus === "in-stock"
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

export default function ProductJsonLd({ product }: ProductJsonLdProps) {
  const productUrl = `${SITE_URL}/${product.categorySlug}/${product.slug}`;
  const images = getImageUrls(product);
  const description = getDescription(product);
  const { lowPrice, highPrice, offerCount } = getPriceRange(product);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: images,
    brand: {
      "@type": "Brand",
      name: BRAND_NAME,
    },
    category: product.categoryName,
    url: productUrl,
    sku: product.variants[0]?.sku ?? String(product.id),
    offers: {
      "@type": "AggregateOffer",
      url: productUrl,
      priceCurrency: PRICE_CURRENCY,
      lowPrice,
      highPrice,
      offerCount,
      availability: getAvailability(product),
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };

  if (product.ratingAverage && product.reviewCount && product.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratingAverage,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}