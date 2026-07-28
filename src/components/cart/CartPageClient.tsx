"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useGlobalLoadingStore } from "@/store/global-loading.store";
import { useToastStore } from "@/store/toast.store";

import CartConfirmModal from "@/components/cart/CartConfirmModal";
import CartEmptyState from "@/components/cart/CartEmptyState";
import CartItemCard from "@/components/cart/CartItemCard";
import CartLoginRequired from "@/components/cart/CartLoginRequired";
import CartPageSkeleton from "@/components/cart/CartPageSkeleton";
import CartSummary from "@/components/cart/CartSummary";

export default function CartPageClient() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const items = useCartStore((state) => state.items);
  const totalQuantity = useCartStore((state) => state.totalQuantity);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const selectedQuantity = useCartStore((state) => state.selectedQuantity);
  const selectedTotalPrice = useCartStore(
    (state) => state.selectedTotalPrice
  );

  const isLoading = useCartStore((state) => state.isLoading);
  const error = useCartStore((state) => state.error);

  const fetchCart = useCartStore((state) => state.fetchCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateSelected = useCartStore((state) => state.updateSelected);
  const selectAll = useCartStore((state) => state.selectAll);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const resetCart = useCartStore((state) => state.resetCart);

  const showToast = useToastStore((state) => state.showToast);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);

  const [pendingRemoveItemId, setPendingRemoveItemId] = useState<number | null>(
    null
  );
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);

  const selectedItemCount = useMemo(() => {
    return items.filter((item) => item.selected).length;
  }, [items]);

  const isAllSelected =
    items.length > 0 && items.every((item) => item.selected);

  const isSomeSelected =
    items.length > 0 && items.some((item) => item.selected) && !isAllSelected;

  useEffect(() => {
    if (!selectAllCheckboxRef.current) {
      return;
    }

    selectAllCheckboxRef.current.indeterminate = isSomeSelected;
  }, [isSomeSelected]);

  useEffect(() => {
    if (!isAuthenticated) {
      resetCart();
      return;
    }

    fetchCart();
  }, [isAuthenticated, fetchCart, resetCart]);

  async function handleToggleSelectItem(
    cartItemId: number,
    selected: boolean
  ) {
    showLoading({
      title: "Chờ một xíu nhaaa...",
      description: selected
        ? "Đang chọn sản phẩm."
        : "Đang bỏ chọn sản phẩm.",
    });

    try {
      const result = await updateSelected(cartItemId, selected);

      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch {
      showToast({
        type: "error",
        message: "Không thể cập nhật trạng thái chọn sản phẩm.",
      });
    } finally {
      hideLoading();
    }
  }

  async function handleToggleSelectAll() {
    const nextSelected = !isAllSelected;

    showLoading({
      title: "Chờ một xíu nhaaa...",
      description: nextSelected
        ? "Đang chọn tất cả sản phẩm."
        : "Đang bỏ chọn tất cả sản phẩm.",
    });

    try {
      const result = await selectAll(nextSelected);

      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch {
      showToast({
        type: "error",
        message: "Không thể cập nhật trạng thái chọn tất cả.",
      });
    } finally {
      hideLoading();
    }
  }

  async function handleDecrease(cartItemId: number, currentQuantity: number) {
    if (currentQuantity <= 1) return;

    showLoading({
      title: "Chờ một xíu nhaaa...",
      description: "Đang cập nhật số lượng sản phẩm.",
    });

    try {
      const result = await updateQuantity(cartItemId, currentQuantity - 1);

      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch {
      showToast({
        type: "error",
        message: "Không thể cập nhật số lượng sản phẩm.",
      });
    } finally {
      hideLoading();
    }
  }

  async function handleIncrease(
    cartItemId: number,
    currentQuantity: number,
    stockQuantity: number
  ) {
    if (currentQuantity >= stockQuantity) {
      showToast({
        type: "warning",
        message: `Chỉ còn ${stockQuantity} sản phẩm trong kho.`,
      });
      return;
    }

    showLoading({
      title: "Chờ một xíu nhaaa...",
      description: "Đang cập nhật số lượng sản phẩm.",
    });

    try {
      const result = await updateQuantity(cartItemId, currentQuantity + 1);

      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch {
      showToast({
        type: "error",
        message: "Không thể cập nhật số lượng sản phẩm.",
      });
    } finally {
      hideLoading();
    }
  }

  function handleRemove(cartItemId: number) {
    setPendingRemoveItemId(cartItemId);
  }

  function handleClearCart() {
    setIsClearCartModalOpen(true);
  }

  async function handleConfirmRemoveItem() {
    if (!pendingRemoveItemId) return;

    showLoading({
      title: "Chờ một xíu nhaaa...",
      description: "Đang xóa sản phẩm khỏi giỏ hàng.",
    });

    try {
      const result = await removeItem(pendingRemoveItemId);

      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
      });

      if (result.success) {
        setPendingRemoveItemId(null);
      }
    } catch {
      showToast({
        type: "error",
        message: "Không thể xóa sản phẩm khỏi giỏ hàng.",
      });
    } finally {
      hideLoading();
    }
  }

  async function handleConfirmClearCart() {
    showLoading({
      title: "Chờ một xíu nhaaa...",
      description: "Đang xóa toàn bộ giỏ hàng.",
    });

    try {
      const result = await clearCart();

      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
      });

      if (result.success) {
        setIsClearCartModalOpen(false);
      }
    } catch {
      showToast({
        type: "error",
        message: "Không thể xóa toàn bộ giỏ hàng.",
      });
    } finally {
      hideLoading();
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="bg-surface-container-lowest">
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <CartLoginRequired />
        </section>
      </main>
    );
  }

  if (isLoading && items.length === 0) {
    return <CartPageSkeleton />;
  }

  return (
    <>
      <main className="bg-surface-container-lowest">
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">
                Giỏ hàng
              </h1>

              <p className="mt-1 text-sm text-secondary">
                Kiểm tra sản phẩm, số lượng và tổng tiền trước khi thanh toán.
              </p>
            </div>

            {items.length > 0 ? (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleClearCart}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">
                  delete
                </span>
                Xóa toàn bộ
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {items.length === 0 ? (
            <CartEmptyState />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-surface-container-high bg-white px-4 py-3 shadow-sm">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-on-surface">
                    <input
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                      checked={isAllSelected}
                      disabled={isLoading}
                      onChange={handleToggleSelectAll}
                      className="h-5 w-5 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    Chọn tất cả
                  </label>

                  <span className="text-sm text-secondary">
                    {selectedItemCount}/{items.length} sản phẩm đã chọn
                  </span>
                </div>

                {items.map((item) => (
                  <CartItemCard
                    key={item.cartItemId}
                    item={item}
                    isSelected={item.selected}
                    isLoading={isLoading}
                    onToggleSelect={handleToggleSelectItem}
                    onDecrease={handleDecrease}
                    onIncrease={handleIncrease}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              <CartSummary
                totalQuantity={totalQuantity}
                totalPrice={totalPrice}
                selectedQuantity={selectedQuantity}
                selectedTotalPrice={selectedTotalPrice}
                isLoading={isLoading}
              />
            </div>
          )}
        </section>
      </main>

      <CartConfirmModal
        open={pendingRemoveItemId !== null}
        title="Xóa sản phẩm?"
        description="Sản phẩm này sẽ được xóa khỏi giỏ hàng của bạn."
        confirmText="Xóa sản phẩm"
        isLoading={isLoading}
        onClose={() => setPendingRemoveItemId(null)}
        onConfirm={handleConfirmRemoveItem}
      />

      <CartConfirmModal
        open={isClearCartModalOpen}
        title="Xóa toàn bộ giỏ hàng?"
        description="Tất cả sản phẩm trong giỏ hàng sẽ bị xóa. Thao tác này không thể hoàn tác."
        confirmText="Xóa toàn bộ"
        isLoading={isLoading}
        onClose={() => setIsClearCartModalOpen(false)}
        onConfirm={handleConfirmClearCart}
      />
    </>
  );
}