import type { ProductCatalogSort } from "@/types/product.type";

type CategorySortBarProps = {
  totalProducts: number;
  sortValue: ProductCatalogSort;
  onSortChange: (value: ProductCatalogSort) => void;
  onOpenMobileFilter?: () => void;
};

const sortOptions: { label: string; value: ProductCatalogSort }[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Giá thấp đến cao", value: "price_asc" },
  { label: "Giá cao đến thấp", value: "price_desc" },
  { label: "Tên A–Z", value: "name_asc" },
  { label: "Tên Z–A", value: "name_desc" },
  { label: "Bán chạy nhất", value: "best_selling" },
];

function isProductCatalogSort(value: string): value is ProductCatalogSort {
  return sortOptions.some((option) => option.value === value);
}

export default function CategorySortBar({
  totalProducts,
  sortValue,
  onSortChange,
  onOpenMobileFilter,
}: CategorySortBarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label-md text-secondary">
          Hiển thị{" "}
          <span className="font-semibold text-on-surface">{totalProducts}</span>{" "}
          sản phẩm
        </p>

        <button
          type="button"
          onClick={onOpenMobileFilter}
          className="rounded-full border border-outline-variant px-4 py-2 text-label-sm text-on-surface md:hidden"
        >
          Bộ lọc
        </button>
      </div>

      <label className="flex items-center gap-2 text-label-md text-secondary">
        <span>Sắp xếp:</span>

        <select
          value={sortValue}
          onChange={(event) => {
            if (isProductCatalogSort(event.target.value)) {
              onSortChange(event.target.value);
            }
          }}
          className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-label-md text-on-surface outline-none transition focus:border-primary"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
