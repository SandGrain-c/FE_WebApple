type ProductVariantSelectorProps = {
  colors: string[];
  capacities: string[];
  ramOptions?: string[];

  selectedColor: string;
  selectedCapacity: string;
  selectedRam: string;

  onSelectColor: (color: string) => void;
  onSelectCapacity: (capacity: string) => void;
  onSelectRam: (ram: string) => void;
};

export default function ProductVariantSelector({
  colors,
  capacities,
  ramOptions,

  selectedColor,
  selectedCapacity,
  selectedRam,

  onSelectColor,
  onSelectCapacity,
  onSelectRam,
}: ProductVariantSelectorProps) {
  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-on-surface">Màu sắc</p>

        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              className={`rounded-xl border px-4 py-2 text-sm transition ${
                selectedColor === color
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant bg-surface text-on-surface hover:border-primary"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-on-surface">Dung lượng</p>

        <div className="flex flex-wrap gap-2">
          {capacities.map((capacity) => (
            <button
              key={capacity}
              type="button"
              onClick={() => onSelectCapacity(capacity)}
              className={`rounded-xl border px-4 py-2 text-sm transition ${
                selectedCapacity === capacity
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant bg-surface text-on-surface hover:border-primary"
              }`}
            >
              {capacity}
            </button>
          ))}
        </div>
      </div>

      {ramOptions && ramOptions.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-on-surface">RAM</p>

          <div className="flex flex-wrap gap-2">
            {ramOptions.map((ram) => (
              <button
                key={ram}
                type="button"
                onClick={() => onSelectRam(ram)}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  selectedRam === ram
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-surface text-on-surface hover:border-primary"
                }`}
              >
                {ram}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}