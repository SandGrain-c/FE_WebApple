import type { ProductFilters } from "./ProductFilterSidebar";

export type RemoveFilterPayload =
  | { type: "price" }
  | { type: "capacity"; value: string }
  | { type: "color"; value: string }
  | { type: "stockStatus" };

type ActiveFilterChipsProps = {
  filters: ProductFilters;
  totalProducts: number;
  categoryName: string;
  onRemoveFilter: (payload: RemoveFilterPayload) => void;
  onClearAll: () => void;
};

const priceRangeLabelMap: Record<string, string> = {
  "under-15": "Dưới 15 triệu",
  "15-25": "15 - 25 triệu",
  "over-25": "Trên 25 triệu",
};

const stockStatusLabelMap: Record<string, string> = {
  "in-stock": "Còn hàng",
  "out-of-stock": "Hết hàng",
};

function formatPrice(price: number | "") {
  if (price === "") return "";

  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}

function getCustomPriceLabel(minPrice: number | "", maxPrice: number | "") {
  const min = formatPrice(minPrice);
  const max = formatPrice(maxPrice);

  if (min && max) {
    return `${min} - ${max}`;
  }

  if (min) {
    return `Từ ${min}`;
  }

  if (max) {
    return `Đến ${max}`;
  }

  return "Khoảng giá tuỳ chỉnh";
}

export default function ActiveFilterChips({
  filters,
  totalProducts,
  categoryName,
  onRemoveFilter,
  onClearAll,
}: ActiveFilterChipsProps) {
  const chips: { id: string; label: string; onRemove: () => void }[] = [];

  if (filters.priceRange !== "all") {
    if (filters.priceRange === "custom") {
      chips.push({
        id: "price-custom",
        label: getCustomPriceLabel(filters.minPrice, filters.maxPrice),
        onRemove: () => onRemoveFilter({ type: "price" }),
      });
    } else {
      chips.push({
        id: "price-range",
        label: priceRangeLabelMap[filters.priceRange] ?? "Khoảng giá",
        onRemove: () => onRemoveFilter({ type: "price" }),
      });
    }
  }

  filters.capacities.forEach((capacity) => {
    chips.push({
      id: `capacity-${capacity}`,
      label: capacity,
      onRemove: () => onRemoveFilter({ type: "capacity", value: capacity }),
    });
  });

  filters.colors.forEach((color) => {
    chips.push({
      id: `color-${color}`,
      label: color,
      onRemove: () => onRemoveFilter({ type: "color", value: color }),
    });
  });

  if (filters.stockStatus !== "all") {
    chips.push({
      id: "stock-status",
      label: stockStatusLabelMap[filters.stockStatus] ?? "Tình trạng hàng",
      onRemove: () => onRemoveFilter({ type: "stockStatus" }),
    });
  }

  return (
    <div className="mb-4 rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 shadow-sm">
      {chips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 text-label-md font-semibold text-on-surface transition hover:opacity-80"
            >
              <span>{chip.label}</span>
              <span className="text-secondary">×</span>
            </button>
          ))}

          <button
            type="button"
            onClick={onClearAll}
            className="px-2 py-2 text-label-md font-bold text-primary transition hover:opacity-80"
          >
            Xóa tất cả
          </button>
        </div>
      )}

      <p className="text-body-md text-on-surface">
        Tìm thấy{" "}
        <span className="font-bold text-primary">{totalProducts}</span>{" "}
        sản phẩm trong danh mục{" "}
        <span className="font-bold">{categoryName}</span>
      </p>
    </div>
  );
}