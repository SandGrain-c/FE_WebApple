"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

export default function HeaderCartBadge() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  const totalQuantity = useCartStore((state) => state.totalQuantity);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const resetCart = useCartStore((state) => state.resetCart);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      resetCart();
      return;
    }

    fetchCart();
  }, [isAuthenticated, accessToken, fetchCart, resetCart]);

  return (
    <Link
      href="/cart"
      aria-label="Giỏ hàng"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition hover:bg-surface-container-lowest hover:text-primary"
    >
      <span className="material-symbols-outlined text-2xl">
        shopping_cart
      </span>

      {totalQuantity > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none text-on-primary">
          {totalQuantity > 99 ? "99+" : totalQuantity}
        </span>
      ) : null}
    </Link>
  );
}