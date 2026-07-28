// Import các thành phần và kiểu dữ liệu cần thiết để hiển thị lưới sản phẩm trong trang danh mục, bao gồm cả trạng thái tải và xử lý khi không tìm thấy sản phẩm nào
import ProductCard from "@/components/product/ProductCard";
import type { ProductCardItem } from "@/types/product.type";

type CategoryProductGridProps = {
  products: ProductCardItem[];
  isLoading?: boolean; // Tham số tùy chọn để chỉ định trạng thái tải, nếu true sẽ hiển thị các placeholder thay vì sản phẩm thực tế
};

export default function CategoryProductGrid({
  products,
  isLoading = false,
}: CategoryProductGridProps) {
  if (isLoading) { // Nếu đang trong trạng thái tải, hiển thị các placeholder để người dùng biết rằng nội dung đang được tải về, thay vì hiển thị một lưới trống hoặc không có phản hồi nào
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-90 animate-pulse rounded-xl border border-surface-container-high bg-surface-container-lowest"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) { // Nếu không tìm thấy sản phẩm nào, hiển thị một thông báo thân thiện để người dùng biết rằng không có sản phẩm nào phù hợp với các bộ lọc hoặc tìm kiếm hiện tại, thay vì hiển thị một lưới trống hoặc không có phản hồi nào
    return (
      <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 text-center shadow-sm">
        <h3 className="text-headline-md text-on-surface">
          Không tìm thấy sản phẩm
        </h3>
        <p className="mt-2 text-body-md text-secondary">
          Hãy thử xoá bớt bộ lọc hoặc chọn khoảng giá khác.
        </p>
      </div>
    );
  }

  return ( // Nếu có sản phẩm để hiển thị, hiển thị chúng trong một lưới với các cột responsive, đảm bảo rằng giao diện người dùng vẫn đẹp mắt và dễ sử dụng trên nhiều
    <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showOptions
          showCompare
        />
      ))}
    </div>
  );
}