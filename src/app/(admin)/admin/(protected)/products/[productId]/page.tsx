import AdminProductDetailPageClient from "@/components/admin/products/AdminProductDetailPageClient";

type AdminProductDetailPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function AdminProductDetailPage({
  params,
}: AdminProductDetailPageProps) {
  const { productId } = await params;
  const numericProductId = Number(productId);

  return <AdminProductDetailPageClient productId={numericProductId} />;
}