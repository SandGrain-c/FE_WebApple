// Component để hiển thị thanh công cụ sắp xếp và bộ lọc cho trang danh mục sản phẩm, giúp người dùng dễ dàng chọn cách sắp xếp sản phẩm và mở bộ lọc trên thiết bị di động để tìm kiếm sản phẩm một cách nhanh chóng và hiệu quả

export type ProductSortValue = // Các giá trị sắp xếp sản phẩm, bao gồm mặc định, giá thấp đến cao, giá cao đến thấp, bán chạy và mới nhất, giúp người dùng có thể lựa chọn cách hiển thị sản phẩm phù hợp với nhu cầu của họ
  | "default"
  | "price-asc"
  | "price-desc"
  | "best-selling"
  | "newest";

type CategorySortBarProps = { // Các props cho component CategorySortBar, bao gồm tổng số sản phẩm, giá trị sắp xếp hiện tại, hàm để xử lý thay đổi sắp xếp và tùy chọn để mở bộ lọc trên thiết bị di động
  totalProducts: number;
  sortValue: ProductSortValue;
  onSortChange: (value: ProductSortValue) => void;
  onOpenMobileFilter?: () => void;
};

const sortOptions: { label: string; value: ProductSortValue }[] = [ // Các tùy chọn sắp xếp sản phẩm được định nghĩa dưới dạng một mảng các đối tượng, mỗi đối tượng chứa nhãn hiển thị và giá trị sắp xếp tương ứng, giúp dễ dàng hiển thị trong dropdown và xử lý logic sắp xếp khi người dùng chọn một tùy chọn
  { label: "Mặc định", value: "default" },
  { label: "Giá thấp đến cao", value: "price-asc" },
  { label: "Giá cao đến thấp", value: "price-desc" },
  { label: "Bán chạy", value: "best-selling" },
  { label: "Mới nhất", value: "newest" },
];

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
          <span className="font-semibold text-on-surface">
            {totalProducts}
          </span>{" "}
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
          onChange={(event) =>
            onSortChange(event.target.value as ProductSortValue)
          }
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