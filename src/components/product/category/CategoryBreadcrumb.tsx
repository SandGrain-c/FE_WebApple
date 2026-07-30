import Link from "next/link";

type CategoryBreadcrumbProps = {
  categoryName: string;
};

// Component để hiển thị breadcrumb (đường dẫn điều hướng) cho trang danh mục sản phẩm, giúp người dùng dễ dàng nhận biết vị trí hiện tại trong cấu trúc trang web và cung cấp liên kết để quay lại trang chủ hoặc các cấp danh mục trước đó
export default function CategoryBreadcrumb({
  categoryName,
}: CategoryBreadcrumbProps) {
  return (
    <nav className="mb-4 text-label-md text-secondary">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition hover:text-primary">
            Trang chủ
          </Link>
        </li>


        <li className="text-outline">/</li>

        <li className="font-medium text-on-surface">{categoryName}</li>
      </ol>
    </nav>
  );
}