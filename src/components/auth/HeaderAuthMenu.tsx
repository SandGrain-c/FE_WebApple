// src/components/auth/HeaderAuthMenu.tsx

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useFavoriteStore } from "@/store/favorite.store";

export default function HeaderAuthMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [hasMounted, setHasMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getMe = useAuthStore((state) => state.getMe);
  const logout = useAuthStore((state) => state.logout);

  const resetCart = useCartStore((state) => state.resetCart);
  const resetFavorites = useFavoriteStore((state) => state.resetFavorites);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !isAuthenticated || !accessToken) {
      return;
    }

    async function verifyUser() {
      const result = await getMe();

      if (!result.success) {
        resetCart();
        resetFavorites();
      }
    }

    verifyUser();
  }, [
    hasMounted,
    isAuthenticated,
    accessToken,
    getMe,
    resetCart,
    resetFavorites,
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    await logout();

    resetCart();
    resetFavorites();

    setIsOpen(false);
    router.push("/");
  }

  const redirectPath = pathname
    ? `/login?redirect=${encodeURIComponent(pathname)}`
    : "/login";

  if (!hasMounted) {
    return (
      <div className="hidden h-10 w-24 animate-pulse rounded-xl bg-surface-container-high sm:block" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        href={redirectPath}
        className="hidden items-center gap-2 rounded-xl border border-outline-variant px-3 py-2 text-sm font-medium text-on-surface transition hover:border-primary hover:text-primary sm:inline-flex"
      >
        <span className="material-symbols-outlined text-xl">person</span>
        Đăng nhập
      </Link>
    );
  }

  const displayName = user.fullName || user.userName || "Tài khoản";
  const avatarText = displayName.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex max-w-[190px] items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
          isOpen
            ? "border-primary text-primary shadow-sm"
            : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
        }`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
          {avatarText}
        </span>

        <span className="truncate">{displayName}</span>

        <span className="material-symbols-outlined text-lg">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-surface-container-high bg-white shadow-[0_20px_70px_rgba(15,23,42,0.14)]">
          <div className="border-b border-outline-variant p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-on-primary">
                {avatarText}
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-bold text-on-surface">
                  {displayName}
                </p>

                <p className="truncate text-sm text-secondary">
                  {user.email || user.phone || user.userName}
                </p>
              </div>
            </div>

            <div className="mt-3 inline-flex rounded-full bg-surface-container-lowest px-3 py-1 text-xs font-medium text-secondary">
              {user.role}
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-lowest hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">
                shopping_cart
              </span>
              Giỏ hàng của tôi
            </Link>

            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-lowest hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">
                receipt_long
              </span>
              Đơn hàng của tôi
            </Link>

            <Link
              href="/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-lowest hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">
                favorite
              </span>
              Sản phẩm yêu thích
            </Link>

            <Link
              href="/account/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-lowest hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">
                manage_accounts
              </span>
              Cập nhật thông tin
            </Link>

            <Link
              href="/account/change-password"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-lowest hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">
                lock_reset
              </span>
              Đổi mật khẩu
            </Link>

            <div className="my-2 border-t border-outline-variant" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Đăng xuất
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}