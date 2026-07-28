"use client";

import FilterCollapseGroup from "./FilterCollapseGroup";
import PriceRangeFilter from "./PriceRangeFilter";

// Định nghĩa kiểu dữ liệu cho các bộ lọc sản phẩm, bao gồm khoảng giá, dung lượng, màu sắc và tình trạng hàng, giúp quản lý trạng thái của các bộ lọc này trong component ProductFilterSidebar và đồng bộ hóa với URL hoặc các thành phần khác nếu cần thiết
export type ProductFilters = {
  priceRange: string;
  minPrice: number | "";
  maxPrice: number | "";
  capacities: string[];
  colors: string[];
  stockStatus: "all" | "in-stock" | "out-of-stock";
};

// Các hằng số để định nghĩa giá trị tối thiểu và tối đa cho khoảng giá, giúp đảm bảo rằng các giá trị này được sử dụng nhất quán trong toàn bộ component và tránh lỗi khi người dùng nhập các giá trị không hợp lệ hoặc vượt quá phạm vi được định nghĩa cho bộ lọc khoảng giá
type ProductFilterSidebarProps = {
  filters: ProductFilters;
  capacityOptions: string[];
  colorOptions: string[];
  onChange: (filters: ProductFilters) => void;
  onClear: () => void;
};

const stockOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Còn hàng", value: "in-stock" },
  { label: "Hết hàng", value: "out-of-stock" },
] as const;

export default function ProductFilterSidebar({
  filters,
  capacityOptions,
  colorOptions,
  onChange,
  onClear,
}: ProductFilterSidebarProps) {
  const toggleCapacity = (capacity: string) => { // Hàm để xử lý khi người dùng chọn hoặc bỏ chọn một tùy chọn dung lượng trong bộ lọc, bao gồm logic để kiểm tra xem tùy chọn này đã tồn tại trong danh sách dung lượng đã chọn hay chưa và cập nhật trạng thái bộ lọc tương ứng, giúp người dùng dễ dàng quản lý các tùy chọn dung lượng mà họ muốn áp dụng cho tìm kiếm sản phẩm
    const exists = filters.capacities.includes(capacity); // Kiểm tra xem tùy chọn dung lượng đã tồn tại trong danh sách dung lượng đã chọn hay chưa, giúp xác định xem người dùng đang chọn hay bỏ chọn tùy chọn này để cập nhật trạng thái bộ lọc một cách chính xác

    onChange({
      ...filters,
      capacities: exists
        ? filters.capacities.filter((item) => item !== capacity)
        : [...filters.capacities, capacity],
    });
  };

  const toggleColor = (color: string) => {
    const exists = filters.colors.includes(color);

    onChange({
      ...filters,
      colors: exists
        ? filters.colors.filter((item) => item !== color)
        : [...filters.colors, color],
    });
  };

  return (
    <aside className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-headline-md font-bold text-on-surface">
          Bộ lọc tìm kiếm
        </h2>

        <button
          type="button"
          onClick={onClear}
          className="text-label-sm font-semibold text-primary transition hover:opacity-80"
        >
          Xoá lọc
        </button>
      </div>

      <FilterCollapseGroup title="Khoảng giá" defaultOpen>
        <PriceRangeFilter
          priceRange={filters.priceRange}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onPriceRangeChange={(value) =>
            onChange({
              ...filters,
              priceRange: value,
              minPrice: "",
              maxPrice: "",
            })
          }
          onCustomPriceChange={(value) =>
            onChange({
              ...filters,
              priceRange: "custom",
              minPrice: value.minPrice,
              maxPrice: value.maxPrice,
            })
          }
        />
      </FilterCollapseGroup>

      <FilterCollapseGroup title="Dung lượng" defaultOpen>
        {capacityOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {capacityOptions.map((capacity) => {
              const active = filters.capacities.includes(capacity);

              return (
                <button
                  key={capacity}
                  type="button"
                  onClick={() => toggleCapacity(capacity)}
                  className={[
                    "rounded-lg border px-3 py-2 text-label-md font-semibold transition",
                    active
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface text-on-surface hover:border-primary hover:text-primary",
                  ].join(" ")}
                >
                  {capacity}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-label-md text-secondary">
            Chưa có tuỳ chọn dung lượng.
          </p>
        )}
      </FilterCollapseGroup>

      <FilterCollapseGroup title="Màu sắc" defaultOpen>
        {colorOptions.length > 0 ? (
          <div className="space-y-2">
            {colorOptions.map((color) => (
              <label
                key={color}
                className="flex cursor-pointer items-center gap-2 text-label-md text-secondary"
              >
                <input
                  type="checkbox"
                  checked={filters.colors.includes(color)}
                  onChange={() => toggleColor(color)}
                  className="accent-primary"
                />
                {color}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-label-md text-secondary">
            Chưa có tuỳ chọn màu sắc.
          </p>
        )}
      </FilterCollapseGroup>

      <FilterCollapseGroup title="Tình trạng hàng" defaultOpen>
        <div className="space-y-2">
          {stockOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-label-md text-secondary"
            >
              <input
                type="radio"
                name="stockStatus"
                value={option.value}
                checked={filters.stockStatus === option.value}
                onChange={() =>
                  onChange({ ...filters, stockStatus: option.value })
                }
                className="accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </FilterCollapseGroup>
    </aside>
  );
}