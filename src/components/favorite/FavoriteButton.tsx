"use client";

import { MouseEvent, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth.store";
import { useFavoriteStore } from "@/store/favorite.store";

type FavoriteButtonProps = {
  productId: number;
  productName: string;
  className?: string;
  showText?: boolean;
};

export default function FavoriteButton({
  productId,
  productName,
  className = "",
  showText = true,
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const favoriteProductIds = useFavoriteStore(
    (state) => state.favoriteProductIds
  );
  const isUpdating = useFavoriteStore((state) => state.isUpdating);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);

  const isFavorite = favoriteProductIds.includes(productId);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated, fetchFavorites]);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    await toggleFavorite(productId);
  }

  return (
    <button
      type="button"
      aria-label={
        isFavorite
          ? `Bỏ ${productName} khỏi yêu thích`
          : `Thêm ${productName} vào yêu thích`
      }
      onClick={handleClick}
      disabled={isUpdating}
      className={[
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        isFavorite
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant bg-white/95 text-secondary hover:border-primary hover:text-primary",
        className,
      ].join(" ")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isFavorite ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={[
          "h-4 w-4 transition-all duration-300",
          isFavorite
            ? "scale-110 text-on-primary"
            : "text-secondary group-hover/product:text-primary",
        ].join(" ")}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.536 0-2.898.722-3.75 1.838C11.71 4.472 10.348 3.75 8.812 3.75 6.223 3.75 4.125 5.765 4.125 8.25c0 7.22 8.437 11.25 8.437 11.25S21 15.47 21 8.25Z"
        />
      </svg>

      {showText ? <span>Yêu thích</span> : null}
    </button>
  );
}