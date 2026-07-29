"use client";

import type { PriceRangeValue } from "./ProductFilterSidebar";

// Component để hiển thị bộ lọc khoảng giá cho trang danh mục sản phẩm, cho phép người dùng chọn các khoảng giá phổ biến hoặc nhập khoảng giá tùy chỉnh, cũng như sử dụng thanh trượt để điều chỉnh khoảng giá một cách trực quan, giúp cải thiện trải nghiệm tìm kiếm sản phẩm theo giá cả phù hợp với nhu cầu của người dùng
type PriceRangeFilterProps = {
  priceRange: PriceRangeValue;
  minPrice: number | "";
  maxPrice: number | "";
  onPriceRangeChange: (value: PriceRangeValue) => void;
  onCustomPriceChange: (value: {
    minPrice: number | "";
    maxPrice: number | "";
  }) => void; // Hàm callback để xử lý khi người dùng thay đổi khoảng giá tùy chỉnh, nhận vào một đối tượng chứa giá trị minPrice và maxPrice mới, giúp cập nhật trạng thái của bộ lọc khoảng giá trong component cha và đồng bộ hóa với URL hoặc các thành phần khác nếu cần thiết
};

const MIN_PRICE = 0;
const MAX_PRICE = 65_000_000;
const STEP_PRICE = 500_000;

const priceOptions: { label: string; value: PriceRangeValue }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Dưới 15 triệu", value: "under-15" },
  { label: "15 - 25 triệu", value: "15-25" },
  { label: "Trên 25 triệu", value: "over-25" },
];

// Hàm để định dạng giá trị số thành chuỗi có định dạng tiền tệ Việt Nam, giúp hiển thị giá cả một cách dễ đọc và thân thiện với người dùng khi họ nhập khoảng giá tùy chỉnh hoặc xem giá trên thanh trượt, đảm bảo rằng các giá trị này được hiển thị với dấu phân cách hàng nghìn và đơn vị tiền tệ phù hợp
function formatInputPrice(value: number | "") {
  if (value === "") return "";

  return new Intl.NumberFormat("vi-VN").format(value);
} 

// Hàm để phân tích giá trị đầu vào từ người dùng, loại bỏ tất cả các ký tự không phải là số và trả về một số hợp lệ hoặc chuỗi rỗng nếu không có số nào được nhập, giúp đảm bảo rằng người dùng chỉ có thể nhập các giá trị số hợp lệ cho khoảng giá tùy chỉnh và tránh lỗi khi xử lý giá trị này trong logic của component
function parsePriceInput(value: string): number | "" {
  const onlyNumber = value.replace(/\D/g, "");

  if (!onlyNumber) return "";

  return Number(onlyNumber);
} 

// Hàm để giới hạn giá trị khoảng giá tùy chỉnh trong phạm vi cho phép, đảm bảo rằng giá trị này không nhỏ hơn MIN_PRICE và không lớn hơn MAX_PRICE, giúp tránh lỗi khi người dùng nhập các giá trị không hợp lệ hoặc vượt quá phạm vi được định nghĩa cho bộ lọc khoảng giá
function clampPrice(value: number) {
  return Math.min(Math.max(value, MIN_PRICE), MAX_PRICE);
}

// Component chính để hiển thị bộ lọc khoảng giá, bao gồm các tùy chọn khoảng giá phổ biến, trường nhập cho khoảng giá tùy chỉnh và thanh trượt để điều chỉnh khoảng giá một cách trực quan, giúp người dùng dễ dàng tìm kiếm sản phẩm theo mức giá phù hợp với nhu cầu của họ
export default function PriceRangeFilter({
  priceRange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  onCustomPriceChange,
}: PriceRangeFilterProps) {
  const safeMinPrice = minPrice === "" ? MIN_PRICE : minPrice;
  const safeMaxPrice = maxPrice === "" ? MAX_PRICE : maxPrice;

  const handleMinInputChange = (value: string) => { // Hàm để xử lý khi người dùng thay đổi giá trị khoảng giá tối thiểu trong trường nhập, bao gồm logic để phân tích giá trị đầu vào, giới hạn giá trị này trong phạm vi cho phép và đảm bảo rằng nếu giá trị tối thiểu mới lớn hơn giá trị tối đa hiện tại, thì giá trị tối đa cũng sẽ được điều chỉnh để không nhỏ hơn giá trị tối thiểu mới, giúp duy trì tính hợp lệ của khoảng giá tùy chỉnh và tránh lỗi khi người dùng nhập các giá trị không hợp lệ
    const parsedMin = parsePriceInput(value);

    if (parsedMin === "") {
      onCustomPriceChange({
        minPrice: "",
        maxPrice,
      });
      return;
    }

    const nextMin = clampPrice(parsedMin);
    const nextMax = maxPrice !== "" && nextMin > maxPrice ? nextMin : maxPrice;

    onCustomPriceChange({
      minPrice: nextMin,
      maxPrice: nextMax,
    });
  };

  // Hàm để xử lý khi người dùng thay đổi giá trị khoảng giá tối đa trong trường nhập, bao gồm logic để phân tích giá trị đầu vào, giới hạn giá trị này trong phạm vi cho phép và đảm bảo rằng nếu giá trị tối đa mới nhỏ hơn giá trị tối thiểu hiện tại, thì giá trị tối thiểu cũng sẽ được điều chỉnh để không lớn hơn giá trị tối đa mới, giúp duy trì tính hợp lệ của khoảng giá tùy chỉnh và tránh lỗi khi người dùng nhập các giá trị không hợp lệ
  const handleMaxInputChange = (value: string) => {
    const parsedMax = parsePriceInput(value);

    if (parsedMax === "") {
      onCustomPriceChange({
        minPrice,
        maxPrice: "",
      });
      return;
    }

    const nextMax = clampPrice(parsedMax);
    const nextMin = minPrice !== "" && nextMax < minPrice ? nextMax : minPrice;

    onCustomPriceChange({
      minPrice: nextMin,
      maxPrice: nextMax,
    });
  };

  // Hàm để xử lý khi người dùng thay đổi giá trị khoảng giá tối thiểu bằng thanh trượt, bao gồm logic để đảm bảo rằng giá trị này không vượt quá giá trị tối đa hiện tại, giúp duy trì tính hợp lệ của khoảng giá tùy chỉnh và tránh lỗi khi người dùng điều chỉnh thanh trượt đến các giá trị không hợp lệ
  const handleMinRangeChange = (value: string) => {
    const nextMin = Math.min(Number(value), safeMaxPrice);

    onCustomPriceChange({
      minPrice: nextMin,
      maxPrice: safeMaxPrice,
    });
  };

  // Hàm để xử lý khi người dùng thay đổi giá trị khoảng giá tối đa bằng thanh trượt, bao gồm logic để đảm bảo rằng giá trị này không nhỏ hơn giá trị tối thiểu hiện tại, giúp duy trì tính hợp lệ của khoảng giá tùy chỉnh và tránh lỗi khi người dùng điều chỉnh thanh trượt đến các giá trị không hợp lệ
  const handleMaxRangeChange = (value: string) => {
    const nextMax = Math.max(Number(value), safeMinPrice);

    onCustomPriceChange({
      minPrice: safeMinPrice,
      maxPrice: nextMax,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {priceOptions.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 text-label-md text-secondary"
          >
            <input
              type="radio"
              name="priceRange"
              value={option.value}
              checked={priceRange === option.value}
              onChange={() => onPriceRangeChange(option.value)}
              className="accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>

      <div>
        <p className="mb-3 text-label-md font-semibold text-on-surface">
          Hoặc nhập khoảng giá phù hợp:
        </p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <input
            inputMode="numeric"
            value={formatInputPrice(minPrice)}
            onChange={(event) => handleMinInputChange(event.target.value)}
            placeholder="Từ"
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right text-label-md text-on-surface outline-none transition focus:border-primary"
          />

          <span className="text-secondary">~</span>

          <input
            inputMode="numeric"
            value={formatInputPrice(maxPrice)}
            onChange={(event) => handleMaxInputChange(event.target.value)}
            placeholder="Đến"
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right text-label-md text-on-surface outline-none transition focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={STEP_PRICE}
          value={safeMinPrice}
          onChange={(event) => handleMinRangeChange(event.target.value)}
          className="w-full accent-primary"
        />

        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={STEP_PRICE}
          value={safeMaxPrice}
          onChange={(event) => handleMaxRangeChange(event.target.value)}
          className="w-full accent-primary"
        />

        <div className="flex items-center justify-between text-label-sm text-secondary">
          <span>{formatInputPrice(safeMinPrice)}đ</span>
          <span>{formatInputPrice(safeMaxPrice)}đ</span>
        </div>
      </div>
    </div>
  );
}
