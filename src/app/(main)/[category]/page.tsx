import { Suspense } from "react";

import CategoryPageClient from "@/components/product/category/CategoryPageClient";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

function CategoryPageFallback() {
  return (
    <main className="container mx-auto mt-8 w-[80%] px-0 md:px-5">
      <div className="rounded-xl border border-surface-container-high bg-surface p-8 text-center text-body-md text-on-surface-variant">
        Đang tải sản phẩm...
      </div>
    </main>
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;

  return (
    <Suspense fallback={<CategoryPageFallback />}>
      <CategoryPageClient categorySlug={category} />
    </Suspense>
  );
}
