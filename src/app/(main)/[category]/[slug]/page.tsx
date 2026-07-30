import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetailClient from "@/components/product/detail/ProductDetailClient";
import { getProductDetail } from "@/services/product.service";
import ProductJsonLd from "@/components/product/detail/ProductJsonLd";

type ProductDetailPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

const SITE_NAME = "Đức Bách Hoá";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function formatPrice(price: number) {
  return `${price.toLocaleString("vi-VN")}₫`;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { category, slug } = await params;

  const productDetailResponse = await getProductDetail(category, slug);

  if (!productDetailResponse?.product) {
    return {
      title: `Không tìm thấy sản phẩm | ${SITE_NAME}`,
      description:
        "Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã ngừng kinh doanh.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const product = productDetailResponse.product;

  const title = `${product.name} giá ${formatPrice(product.price)} | ${SITE_NAME}`;

  const description =
    product.shortDescription ||
    product.description ||
    `Mua ${product.name} chính hãng tại ${SITE_NAME}. Giá ${formatPrice(
      product.price
    )}, nhiều ưu đãi, hỗ trợ tư vấn và giao hàng nhanh.`;

  const imageUrl =
    product.images.find((image) => image.isThumbnail)?.imageUrl ||
    product.images[0]?.imageUrl ||
    "/products/product-placeholder.png";

  const productUrl = `${SITE_URL}/${product.categorySlug}/${product.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { category, slug } = await params;

  const productDetailResponse = await getProductDetail(category, slug);

  if (!productDetailResponse?.product) {
    notFound();
  }

  return (
    <>
      <ProductJsonLd product={productDetailResponse.product} />

      <ProductDetailClient
      product={productDetailResponse.product}
      relatedProducts={productDetailResponse.relatedProducts}
      />
    </>
  );
}