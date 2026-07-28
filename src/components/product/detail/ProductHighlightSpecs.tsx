import type { ProductSpecificationGroup } from "@/types/product-detail.type";

type ProductHighlightSpecsProps = {
  specifications: ProductSpecificationGroup[];
  onViewAll?: () => void;
};

function findSpecValue(
  specifications: ProductSpecificationGroup[],
  labels: string[]
) {
  for (const group of specifications) {
    for (const item of group.items) {
      const isMatched = labels.some((label) =>
        item.label.toLowerCase().includes(label.toLowerCase())
      );

      if (isMatched) {
        return item.value;
      }
    }
  }

  return "Đang cập nhật";
}

export default function ProductHighlightSpecs({
  specifications,
  onViewAll,
}: ProductHighlightSpecsProps) {
  const highlightSpecs = [
    {
      icon: "smartphone",
      label: "Màn hình",
      value: findSpecValue(specifications, ["kích thước màn hình"]),
    },
    {
      icon: "memory",
      label: "Chip",
      value: findSpecValue(specifications, ["chip xử lý", "chip"]),
    },
    {
      icon: "battery_full",
      label: "Pin",
      value: findSpecValue(specifications, ["thời lượng", "pin"]),
    },
    {
      icon: "photo_camera",
      label: "Camera",
      value: findSpecValue(specifications, ["camera sau"]),
    },
  ];

  return (
    <section className="rounded-2xl border border-surface-container-high  p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-semibold text-on-surface">Thông số nổi bật</h2>

        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:opacity-80"
          >
            Xem tất cả thông số
            <span className="material-symbols-outlined text-lg">
              chevron_right
            </span>
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {highlightSpecs.map((spec) => (
          <div
            key={spec.label}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
          >
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-primary">
                {spec.icon}
              </span>

              <div>
                <p className="text-xs text-secondary">{spec.label}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-on-surface">
                  {spec.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}