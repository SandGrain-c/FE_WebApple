// Định nghĩa kiểu cho các props của component phân trang danh mục sản phẩm, bao gồm trang hiện tại, tổng số trang và hàm callback để xử lý khi người dùng thay đổi trang
type CategoryPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

// Định nghĩa kiểu cho các mục phân trang, có thể là một số trang cụ thể hoặc dấu ba chấm để biểu thị khoảng cách giữa các trang khi có quá nhiều trang để hiển thị trực tiếp
type PaginationItem = number | "left-ellipsis" | "right-ellipsis";

// Hàm để tính toán các mục phân trang cần hiển thị dựa trên trang hiện tại và tổng số trang, đảm bảo rằng người dùng có thể dễ dàng điều hướng giữa các trang mà không bị quá tải với quá nhiều lựa chọn khi có nhiều trang
function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] { // Nếu tổng số trang nhỏ hơn hoặc bằng 7, hiển thị tất cả các trang
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1); // Tạo một mảng từ 1 đến totalPages để hiển thị tất cả các trang
  }

  if (currentPage <= 4) { // Nếu trang hiện tại nhỏ hơn hoặc bằng 4, hiển thị các trang đầu tiên và dấu ba chấm ở cuối
    return [1, 2, 3, 4, 5, "right-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) { // Nếu trang hiện tại lớn hơn hoặc bằng tổng số trang trừ 3, hiển thị các trang cuối cùng và dấu ba chấm ở đầu
    return [
      1,
      "left-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [ // Nếu trang hiện tại ở giữa, hiển thị trang đầu tiên, dấu ba chấm, trang trước, trang hiện tại, trang sau và dấu ba chấm ở cuối
    1,
    "left-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "right-ellipsis",
    totalPages,
  ];
}

// Component để hiển thị phân trang cho trang danh mục sản phẩm, sử dụng hàm getPaginationItems để xác định các mục phân trang cần hiển thị và cung cấp các nút để người dùng có thể chuyển đổi giữa các trang một cách dễ dàng
export default function CategoryPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CategoryPaginationProps) {
  if (totalPages <= 1) return null; // Nếu chỉ có một trang hoặc không có trang nào, không hiển thị phân trang

  const paginationItems = getPaginationItems(currentPage, totalPages); // Tính toán các mục phân trang cần hiển thị dựa trên trang hiện tại và tổng số trang

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-label-md text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Trước
      </button>

      {paginationItems.map((item) => {
        if (item === "left-ellipsis" || item === "right-ellipsis") {
          return (
            <span
              key={item}
              className="flex h-10 w-10 items-center justify-center text-label-md text-secondary"
            >
              ...
            </span>
          );
        }

        const active = item === currentPage;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={[
              "h-10 w-10 rounded-full border text-label-md transition",
              active
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:text-primary",
            ].join(" ")}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-label-md text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sau
      </button>
    </nav>
  );
}