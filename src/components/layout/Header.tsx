// src/components/layout/Header.tsx

import Link from "next/link";

import HeaderCartBadge from "@/components/cart/HeaderCartBadge";
import HeaderAuthMenu from "@/components/auth/HeaderAuthMenu";
import HeaderSearchBox from "@/components/layout/HeaderSearchBox";
import ServiceCategoryMenu from "@/components/layout/ServiceCategoryMenu";
import { MAIN_CATEGORIES } from "@/config/navigation";
import { SITE_CONFIG } from "@/config/site";

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
      {/* TẦNG TRÊN: Logo + Search + Cart + User */}
      <div className="mx-auto flex h-16 w-[80%] max-w-325 items-center justify-between gap-6 lg:gap-10">
        {/* 1. Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined text-gray-600">
              menu
            </span>
          </button>

          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 transition-all duration-300 active:scale-95"
          >
            <span className="material-symbols-outlined text-[#FF1A3D] transition-transform duration-300 group-hover:rotate-12">
              storefront
            </span>

            <span className="inline-block whitespace-nowrap text-lg font-bold tracking-tighter text-[#FF1A3D] transition-transform duration-300 ease-in-out group-hover:scale-110 active:scale-95 md:text-2xl">
              {SITE_CONFIG.name}
            </span>
          </Link>
        </div>

        {/* 2. Search */}
        <div className="hidden flex-1 items-center md:flex">
            <HeaderSearchBox />
        </div>

        {/* 3. Cart + User */}
        <div className="flex shrink-0 items-center justify-end gap-3">
          <HeaderCartBadge />
          <HeaderAuthMenu />
        </div>
      </div>

      {/* TẦNG DƯỚI: Danh mục + Navigation */}
      <div className="hidden border-t border-gray-100 md:block">
        <div className="mx-auto flex h-12 w-[80%] max-w-325 items-center gap-6 lg:gap-10">
          {/* Category Button */}
          <ServiceCategoryMenu />

          {/* Navigation */}
          <nav className="flex flex-1 items-center overflow-x-auto">
            <div className="flex w-full items-center justify-between">
              {MAIN_CATEGORIES.map((category) => (
                <Link
                  key={category.slug}
                  href={`/${category.slug}`}
                  className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#FF1A3D]"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
