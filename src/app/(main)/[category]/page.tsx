import CategoryPageClient from "@/components/product/category/CategoryPageClient";

type CategoryPageProps = { //khởi tạo kiểu dữ liệu cho props của component CategoryPage
  params: Promise<{
    category: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params; //await params để lấy giá trị category từ props

  return <CategoryPageClient categorySlug={category} />; //trả về component CategoryPageClient với prop categorySlug được gán giá trị category
}