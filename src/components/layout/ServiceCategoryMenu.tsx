"use client";

import { useState, type FocusEvent, type KeyboardEvent } from "react";
import Link from "next/link";

import { SERVICE_PAGE_NAV_ITEMS } from "@/config/service-pages";

export default function ServiceCategoryMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;

    setIsOpen(false);
    event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus();
  };

  return (
    <div
      className="group relative h-full shrink-0"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="flex h-full items-center gap-2 px-2 text-sm font-semibold text-gray-700 hover:text-[#FF1A3D] focus-visible:text-[#FF1A3D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF1A3D]"
        aria-controls="customer-service-menu"
        aria-expanded={isOpen}
        aria-label="Mở danh mục dịch vụ"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span className="material-symbols-outlined text-[18px]">menu</span>
        <span>Danh mục</span>
        <span className="material-symbols-outlined text-[18px]">
          expand_more
        </span>
      </button>

      <div
        id="customer-service-menu"
        className={`absolute left-0 top-full z-50 mt-0 min-w-62.5 rounded-b-xl border border-t-0 border-gray-100 bg-white shadow-lg transition-all duration-150 ease-out group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100 ${
          isOpen
            ? "visible pointer-events-auto opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
      >
        <div className="py-2">
          {SERVICE_PAGE_NAV_ITEMS.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="flex w-full items-center gap-2 px-5 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-[#FF1A3D] focus-visible:bg-gray-50 focus-visible:text-[#FF1A3D] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF1A3D]"
              onClick={() => setIsOpen(false)}
            >
              <span>{category.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
