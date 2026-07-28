import Link from "next/link";

type ProductDetailBreadcrumbProps = {
  categoryName: string;
  categorySlug: string;
  productName: string;
};

export default function ProductDetailBreadcrumb({
  categoryName,
  categorySlug,
  productName,
}: ProductDetailBreadcrumbProps) {
  return (
    <nav className="text-sm text-secondary">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition hover:text-primary">
            Trang chủ
          </Link>
        </li>

        <li>/</li>

        <li>
          <Link
            href={`/${categorySlug}`}
            className="transition hover:text-primary"
          >
            {categoryName}
          </Link>
        </li>

        <li>/</li>

        <li className="line-clamp-1 text-on-surface">{productName}</li>
      </ol>
    </nav>
  );
}