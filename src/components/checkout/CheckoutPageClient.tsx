"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import CheckoutAddressSelector from "@/components/checkout/CheckoutAddressSelector";
import CheckoutPaymentMethod from "@/components/checkout/CheckoutPaymentMethod";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import VoucherPicker, {
  type VoucherApplyResult,
} from "@/components/checkout/VoucherPicker";
import { checkoutOrder } from "@/services/order.service";
import { validateVoucher } from "@/services/voucher.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useToastStore } from "@/store/toast.store";
import type {
  CustomerPaymentMethod,
  PayOSPaymentLinkDto,
} from "@/types/order.type";
import type { ValidateVoucherResult } from "@/types/voucher.type";
import { formatPrice } from "@/utils/format-price";

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
  const showToast = useToastStore((state) => state.showToast);

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
  const [appliedVoucher, setAppliedVoucher] =
    useState<ValidateVoucherResult | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isVoucherPickerOpen, setIsVoucherPickerOpen] = useState(false);

  const selectedItems = useMemo(() => {
    return items.filter((item) => item.selected);
  }, [items]);

  const discountAmount = appliedVoucher?.discountAmount ?? 0;
  const totalAmount =
    (appliedVoucher?.totalAfterDiscount ?? selectedTotalPrice) + SHIPPING_FEE;

  const closeVoucherPicker = useCallback(() => {
    setIsVoucherPickerOpen(false);
  }, []);

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

  async function applyVoucher(codeValue: string): Promise<VoucherApplyResult> {
    const code = codeValue.trim().toUpperCase();

    if (!code) {
      const message = "Vui lòng nhập mã giảm giá.";
      setVoucherError(message);
      return { success: false, message };
    }

    if (!accessToken) {
      const message = "Bạn cần đăng nhập để áp dụng voucher.";
      setVoucherError(message);
      return { success: false, message };
    }

    try {
      setIsApplyingVoucher(true);
      setVoucherError(null);

      const result = await validateVoucher(
        {
          code,
          subTotal: selectedTotalPrice,
        },
        accessToken
      );

      setAppliedVoucher(result);
      setFormState((current) => ({
        ...current,
        voucherCode: result.voucher.code,
      }));
      showToast({
        type: "success",
        title: "Đã áp dụng voucher",
        message: `${result.voucher.code} giảm ${formatPrice(
          result.discountAmount
        )}.`,
      });

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Voucher chưa áp dụng được cho đơn hàng hiện tại.";

      setVoucherError(message);
      return { success: false, message };
    } finally {
      setIsApplyingVoucher(false);
    }
  }

  function removeVoucher() {
    setAppliedVoucher(null);
    setVoucherError(null);
    setFormState((current) => ({
      ...current,
      voucherCode: "",
    }));
    showToast({
      type: "info",
      message: "Đã bỏ voucher khỏi đơn hàng.",
    });
  }

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
          voucherCode: appliedVoucher?.voucher.code,
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

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={formState.voucherCode}
                onChange={(event) => {
                  const voucherCode = event.target.value.toUpperCase();

                  setFormState((current) => ({
                    ...current,
                    voucherCode,
                  }));
                  setVoucherError(null);

                  if (
                    appliedVoucher &&
                    voucherCode.trim() !== appliedVoucher.voucher.code
                  ) {
                    setAppliedVoucher(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void applyVoucher(formState.voucherCode);
                  }
                }}
                disabled={isSubmitting || isApplyingVoucher}
                placeholder="Ví dụ: SALE10"
                aria-label="Mã voucher"
                className="h-12 min-w-0 flex-1 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm font-semibold uppercase outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <button
                type="button"
                disabled={
                  isSubmitting ||
                  isApplyingVoucher ||
                  formState.voucherCode.trim().length === 0
                }
                onClick={() => void applyVoucher(formState.voucherCode)}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApplyingVoucher && !isVoucherPickerOpen
                  ? "Đang áp dụng..."
                  : "Áp dụng"}
              </button>

              <button
                type="button"
                disabled={isSubmitting || isApplyingVoucher}
                onClick={() => setIsVoucherPickerOpen(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">
                  confirmation_number
                </span>
                Chọn voucher
              </button>
            </div>

            {voucherError ? (
              <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                {voucherError}
              </p>
            ) : null}

            {appliedVoucher ? (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Voucher {appliedVoucher.voucher.code} đã áp dụng
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    Giảm {formatPrice(appliedVoucher.discountAmount)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || isApplyingVoucher}
                  onClick={removeVoucher}
                  className="text-left text-sm font-semibold text-red-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 sm:text-right"
                >
                  Bỏ voucher
                </button>
              </div>
            ) : null}
          </section>

          <button
            type="submit"
            disabled={
              isSubmitting || selectedItems.length === 0 || !selectedAddressId
              || isApplyingVoucher
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
          discountAmount={discountAmount}
          totalAmount={totalAmount}
        />
      </form>

      <VoucherPicker
        open={isVoucherPickerOpen}
        accessToken={accessToken}
        isApplying={isApplyingVoucher}
        onApply={applyVoucher}
        onClose={closeVoucherPicker}
      />
    </main>
  );
}
