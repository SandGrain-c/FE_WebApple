"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import CheckoutAddressSelector from "@/components/checkout/CheckoutAddressSelector";
import CheckoutPaymentMethod from "@/components/checkout/CheckoutPaymentMethod";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import { checkoutOrder } from "@/services/order.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import type {
  CustomerPaymentMethod,
  PayOSPaymentLinkDto,
} from "@/types/order.type";

type CheckoutFormState = {
  voucherCode: string;
  paymentMethod: CustomerPaymentMethod;
};

type CheckoutFormErrors = {
  addressId?: string;
};

const SHIPPING_FEE = 0;

function getEmptyFormState(): CheckoutFormState {
  return {
    voucherCode: "",
    paymentMethod: "COD",
  };
}

function validateCheckoutForm(selectedAddressId: number | null) {
  const errors: CheckoutFormErrors = {};

  if (!selectedAddressId) {
    errors.addressId = "Vui lòng chọn địa chỉ nhận hàng.";
  }

  return errors;
}

function storePayOSPaymentToSession(
  orderId: number,
  payment: PayOSPaymentLinkDto | null
) {
  if (!payment) {
    return;
  }

  sessionStorage.setItem(
    `checkout-payment-${orderId}`,
    JSON.stringify(payment)
  );
}

export default function CheckoutPageClient() {
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const items = useCartStore((state) => state.items);
  const selectedTotalPrice = useCartStore((state) => state.selectedTotalPrice);
  const selectedQuantity = useCartStore((state) => state.selectedQuantity);
  const isCartLoading = useCartStore((state) => state.isLoading);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [formState, setFormState] = useState<CheckoutFormState>(
    getEmptyFormState
  );
  const [formErrors, setFormErrors] = useState<CheckoutFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  const selectedItems = useMemo(() => {
    return items.filter((item) => item.selected);
  }, [items]);

  const totalAmount = selectedTotalPrice + SHIPPING_FEE;

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      router.replace("/login?redirect=/checkout");
      return;
    }

    async function loadCart() {
      const result = await fetchCart();

      setHasLoadedCart(true);

      if (!result.success) {
        setSubmitError(result.message);
      }
    }

    loadCart();
  }, [accessToken, isAuthenticated, fetchCart, router]);

  useEffect(() => {
    if (!hasLoadedCart || isCartLoading) {
      return;
    }

    if (selectedQuantity <= 0 || selectedItems.length === 0) {
      router.replace("/cart");
    }
  }, [
    hasLoadedCart,
    isCartLoading,
    selectedQuantity,
    selectedItems.length,
    router,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      router.replace("/login?redirect=/checkout");
      return;
    }

    const nextErrors = validateCheckoutForm(selectedAddressId);
    setFormErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await checkoutOrder(
        {
          addressId: selectedAddressId as number,
          shippingFee: SHIPPING_FEE,
          voucherCode: formState.voucherCode.trim() || undefined,
          paymentMethod: formState.paymentMethod,
        },
        accessToken
      );

      await fetchCart();

      const orderId = result.order.orderId;

      if (formState.paymentMethod === "OnlineBanking") {
        storePayOSPaymentToSession(orderId, result.payment);
        router.replace(`/checkout/payment?orderId=${orderId}`);
        return;
      }

      router.replace(`/checkout/success?orderId=${orderId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể đặt hàng.";

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!accessToken || !isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-surface-container-high bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-on-surface">
            Bạn cần đăng nhập để thanh toán.
          </p>

          <Link
            href="/login?redirect=/checkout"
            className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary"
          >
            Đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  if (!hasLoadedCart || isCartLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-surface-container-high bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">
            progress_activity
          </span>
          <p className="mt-3 font-semibold text-on-surface">
            Đang tải thông tin thanh toán...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-secondary">
          <Link href="/cart" className="hover:text-primary">
            Giỏ hàng
          </Link>{" "}
          / Thanh toán
        </p>

        <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
          Thanh toán
        </h1>
      </div>

      {submitError ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[1fr_390px]"
      >
        <div className="space-y-5">
          <CheckoutAddressSelector
            accessToken={accessToken}
            selectedAddressId={selectedAddressId}
            onChange={(addressId) => {
              setSelectedAddressId(addressId);
              setFormErrors((current) => ({
                ...current,
                addressId: undefined,
              }));
            }}
            disabled={isSubmitting}
          />

          {formErrors.addressId ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {formErrors.addressId}
            </div>
          ) : null}

          <CheckoutPaymentMethod
            value={formState.paymentMethod}
            onChange={(paymentMethod) =>
              setFormState({
                ...formState,
                paymentMethod,
              })
            }
            disabled={isSubmitting}
          />

          <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface">
              Mã giảm giá
            </h2>

            <input
              type="text"
              value={formState.voucherCode}
              onChange={(event) =>
                setFormState({
                  ...formState,
                  voucherCode: event.target.value.toUpperCase(),
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: SALE10"
              className="mt-4 h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm font-semibold uppercase outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <p className="mt-2 text-xs text-secondary">
              Bước này gửi voucherCode cho BE xử lý, kiểm tra voucher riêng
              sẽ bổ sung sau.
            </p>
          </section>

          <button
            type="submit"
            disabled={
              isSubmitting || selectedItems.length === 0 || !selectedAddressId
            }
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                Đang đặt hàng...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  shopping_bag
                </span>
                Đặt hàng
              </>
            )}
          </button>
        </div>

        <CheckoutSummary
          items={selectedItems}
          subTotal={selectedTotalPrice}
          shippingFee={SHIPPING_FEE}
          totalAmount={totalAmount}
        />
      </form>
    </main>
  );
}