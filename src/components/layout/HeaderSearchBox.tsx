"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getProductSearchSuggest } from "@/services/product-search.service";
import type { SearchSuggestItem } from "@/types/search.type";

const SEARCH_DEBOUNCE_TIME = 300;
const SEARCH_LIMIT = 5;

function formatPrice(price: number) {
  return `${price.toLocaleString("vi-VN")}₫`;
}

function getProductHref(item: SearchSuggestItem) {
  return `/${item.categorySlug}/${item.slug}`;
}

export default function HeaderSearchBox() {
  const router = useRouter();

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<SearchSuggestItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedKeyword = keyword.trim();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) {
        return;
      }

      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (trimmedKeyword.length < 2) {
      setItems([]);
      setIsLoading(false);
      setHasSearched(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await getProductSearchSuggest(
          trimmedKeyword,
          SEARCH_LIMIT,
          controller.signal
        );

        setItems(result.items);
        setHasSearched(true);
        setIsOpen(true);
      } catch (searchError) {
        if (
          searchError instanceof DOMException &&
          searchError.name === "AbortError"
        ) {
          return;
        }

        const message =
          searchError instanceof Error
            ? searchError.message
            : "Không thể tìm kiếm sản phẩm.";

        setItems([]);
        setHasSearched(true);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_TIME);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [trimmedKeyword]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length > 0) {
      const firstItem = items[0];
      router.push(getProductHref(firstItem));
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
  }

  function handleClearSearch() {
    setKeyword("");
    setItems([]);
    setIsOpen(false);
    setHasSearched(false);
    setError(null);
  }

  const shouldShowDropdown =
    isOpen && trimmedKeyword.length >= 2 && (isLoading || hasSearched || error);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 transition-all focus-within:border-[#FF1A3D] focus-within:bg-white focus-within:shadow-md"
      >
        <span className="material-symbols-outlined text-gray-400">search</span>

        <input
          type="text"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (trimmedKeyword.length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder="Tìm kiếm sản phẩm..."
          className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />

        {isLoading ? (
          <span className="material-symbols-outlined animate-spin text-lg text-gray-400">
            progress_activity
          </span>
        ) : keyword ? (
          <button
            type="button"
            onClick={handleClearSearch}
            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-[#FF1A3D]"
            aria-label="Xóa tìm kiếm"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        ) : null}
      </form>

      {shouldShowDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.16)]">
          {isLoading ? (
            <div className="p-5 text-center text-sm text-gray-500">
              Đang tìm kiếm...
            </div>
          ) : error ? (
            <div className="p-5 text-sm text-red-600">{error}</div>
          ) : items.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Gợi ý sản phẩm
              </div>

              {items.map((item) => (
                <Link
                  key={item.id}
                  href={getProductHref(item)}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                    <Image
                      src={item.image || "/images/product-placeholder.png"}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-contain p-1.5"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-gray-800">
                      {item.name}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#FF1A3D]">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <span className="material-symbols-outlined text-lg text-gray-300">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center text-sm text-gray-500">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}