import type { CartItem } from "@/types/cart.type";

type CheckoutSummaryProps = {
  items: CartItem[];
  subTotal: number;
  shippingFee: number;
  totalAmount: number;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("vi-VN")}₫`;
}

export default function CheckoutSummary({
  items,
  subTotal,
  shippingFee,
  totalAmount,
}: CheckoutSummaryProps) {
  return (
    <aside className="h-fit rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-on-surface">
        Đơn hàng của bạn
      </h2>

      <div className="mt-4 max-h-[360px] space-y-4 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-on-surface">
                {item.name}
              </p>

              <p className="mt-1 text-xs text-secondary">
                {[item.color, item.capacity, item.ram].filter(Boolean).join(" · ")}
              </p>

              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-secondary">x{item.quantity}</span>
                <span className="text-sm font-bold text-primary">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3 border-t border-outline-variant pt-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-secondary">Tạm tính</span>
          <span className="font-semibold text-on-surface">
            {formatPrice(subTotal)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-secondary">Phí vận chuyển</span>
          <span className="font-semibold text-on-surface">
            {formatPrice(shippingFee)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-outline-variant pt-3">
          <span className="font-semibold text-on-surface">Tổng thanh toán</span>
          <span className="text-xl font-bold text-primary">
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>
    </aside>
  );
}