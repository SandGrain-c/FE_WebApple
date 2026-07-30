"use client";

import FilterCollapseGroup from "./FilterCollapseGroup";
import PriceRangeFilter from "./PriceRangeFilter";

export type PriceRangeValue =
  | "all"
  | "under-15"
  | "15-25"
  | "over-25"
  | "custom";

export type ProductFilters = {
  priceRange: PriceRangeValue;
  minPrice: number | "";
  maxPrice: number | "";
  capacity: string;
  color: string;
  ram: string;
};

type ProductFilterSidebarProps = {
  filters: ProductFilters;
  capacityOptions: string[];
  colorOptions: string[];
  ramOptions: string[];
  onChange: (filters: ProductFilters) => void;
  onClear: () => void;
};

function getPresetPrices(priceRange: PriceRangeValue) {
  switch (priceRange) {
    case "under-15":
      return { minPrice: "", maxPrice: 15_000_000 } as const;

    case "15-25":
      return { minPrice: 15_000_000, maxPrice: 25_000_000 } as const;

    case "over-25":
      return { minPrice: 25_000_000, maxPrice: "" } as const;

    case "all":
    case "custom":
    default:
      return { minPrice: "", maxPrice: "" } as const;
  }
}

type SingleValueFilterProps = {
  name: string;
  options: string[];
  value: string;
  emptyMessage: string;
  onChange: (value: string) => void;
};

function SingleValueFilter({
  name,
  options,
  value,
  emptyMessage,
  onChange,
}: SingleValueFilterProps) {
  if (options.length === 0) {
    return <p className="text-label-md text-secondary">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center gap-2 text-label-md text-secondary">
        <input
          type="radio"
          name={name}
          value=""
          checked={!value}
          onChange={() => onChange("")}
          className="accent-primary"
        />
        Tất cả
      </label>

      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 text-label-md text-secondary"
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="accent-primary"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

export default function ProductFilterSidebar({
  filters,
  capacityOptions,
  colorOptions,
  ramOptions,
  onChange,
  onClear,
}: ProductFilterSidebarProps) {
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
          onPriceRangeChange={(priceRange) =>
            onChange({
              ...filters,
              priceRange,
              ...getPresetPrices(priceRange),
            })
          }
          onCustomPriceChange={({ minPrice, maxPrice }) =>
            onChange({
              ...filters,
              priceRange: "custom",
              minPrice,
              maxPrice,
            })
          }
        />
      </FilterCollapseGroup>

      <FilterCollapseGroup title="Dung lượng" defaultOpen>
        <SingleValueFilter
          name="catalog-capacity"
          options={capacityOptions}
          value={filters.capacity}
          emptyMessage="Chưa có tuỳ chọn dung lượng."
          onChange={(capacity) => onChange({ ...filters, capacity })}
        />
      </FilterCollapseGroup>

      <FilterCollapseGroup title="Màu sắc" defaultOpen>
        <SingleValueFilter
          name="catalog-color"
          options={colorOptions}
          value={filters.color}
          emptyMessage="Chưa có tuỳ chọn màu sắc."
          onChange={(color) => onChange({ ...filters, color })}
        />
      </FilterCollapseGroup>

      <FilterCollapseGroup title="RAM" defaultOpen>
        <SingleValueFilter
          name="catalog-ram"
          options={ramOptions}
          value={filters.ram}
          emptyMessage="Chưa có tuỳ chọn RAM."
          onChange={(ram) => onChange({ ...filters, ram })}
        />
      </FilterCollapseGroup>
    </aside>
  );
}
