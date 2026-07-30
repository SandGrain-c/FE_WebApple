import Link from "next/link";

export default function CartEmptyState() {
  return (
    <div className="rounded-2xl border border-surface-container-high bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest text-primary">
        <span className="material-symbols-outlined text-4xl">
          shopping_cart_off
        </span>
      </div>

      <h2 className="mt-5 text-xl font-semibold text-on-surface">
        Giỏ hàng đang trống
      </h2>

      <p className="mt-2 text-sm text-secondary">
        Hãy chọn sản phẩm yêu thích và thêm vào giỏ hàng.
      </p>

      <Link
        href="/iphone"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-on-primary transition hover:opacity-90"
      >
        Tiếp tục mua sắm
      </Link>
    </div>
  );
}