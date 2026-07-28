import type { CustomerPaymentMethod } from "@/types/order.type";

type CheckoutPaymentMethodProps = {
  value: CustomerPaymentMethod;
  onChange: (value: CustomerPaymentMethod) => void;
  disabled?: boolean;
};

export default function CheckoutPaymentMethod({
  value,
  onChange,
  disabled = false,
}: CheckoutPaymentMethodProps) {
  return (
    <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-on-surface">
        Phương thức thanh toán
      </h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("COD")}
          className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            value === "COD"
              ? "border-primary bg-primary/5"
              : "border-surface-container-high hover:border-primary"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-primary">
              payments
            </span>

            <div>
              <p className="font-semibold text-on-surface">
                Thanh toán khi nhận hàng
              </p>
              <p className="mt-1 text-sm leading-6 text-secondary">
                Đơn hàng sẽ chờ xác nhận. Khách thanh toán khi nhận sản phẩm.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("OnlineBanking")}
          className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            value === "OnlineBanking"
              ? "border-primary bg-primary/5"
              : "border-surface-container-high hover:border-primary"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-primary">
              qr_code_2
            </span>

            <div>
              <p className="font-semibold text-on-surface">
                Online Banking / VietQR
              </p>
              <p className="mt-1 text-sm leading-6 text-secondary">
                Đơn hàng sẽ chờ thanh toán và BE trả link PayOS/VietQR.
              </p>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}