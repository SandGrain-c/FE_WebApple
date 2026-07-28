import Link from "next/link";

type CartSummaryProps = {
  totalQuantity: number;
  totalPrice: number;
  selectedQuantity: number;
  selectedTotalPrice: number;
  isLoading?: boolean;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("vi-VN")}₫`;
}

export default function CartSummary({
  totalQuantity,
  totalPrice,
  selectedQuantity,
  selectedTotalPrice,
  isLoading = false,
}: CartSummaryProps) {
  const canCheckout = selectedQuantity > 0 && !isLoading;

  return (
    <aside className="h-fit rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-on-surface">
        Tóm tắt đơn hàng
      </h2>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-secondary">Tổng sản phẩm trong giỏ</span>
          <span className="font-medium text-on-surface">{totalQuantity}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-secondary">Tổng giá trị giỏ hàng</span>
          <span className="font-medium text-on-surface">
            {formatPrice(totalPrice)}
          </span>
        </div>

        <div className="border-t border-outline-variant pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-secondary">Sản phẩm đã chọn</span>
            <span className="font-medium text-on-surface">
              {selectedQuantity}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="font-semibold text-on-surface">
              Tạm tính sản phẩm đã chọn
            </span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(selectedTotalPrice)}
            </span>
          </div>
        </div>
      </div>

      {canCheckout ? (
        <Link
          href="/checkout"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-medium text-on-primary transition hover:opacity-90"
        >
          Tiến hành thanh toán
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 w-full rounded-xl bg-primary px-5 py-3 font-medium text-on-primary opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang cập nhật..." : "Tiến hành thanh toán"}
        </button>
      )}

      {!canCheckout && !isLoading ? (
        <p className="mt-2 text-center text-xs text-secondary">
          Vui lòng chọn ít nhất một sản phẩm để thanh toán.
        </p>
      ) : null}

      <Link
        href="/iphone"
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-primary px-5 py-3 text-sm font-medium text-primary transition hover:bg-surface-container-lowest"
      >
        Tiếp tục mua sắm
      </Link>
    </aside>
  );
}