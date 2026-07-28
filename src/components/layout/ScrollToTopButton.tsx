"use client";

import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 300;

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleScrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Cuộn lên đầu trang"
      className={`fixed right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface shadow-lg transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary sm:right-6 ${
        isVisible
          ? "bottom-24 translate-y-0 opacity-100"
          : "bottom-20 translate-y-4 pointer-events-none opacity-0"
      }`}
    >
      <span className="material-symbols-outlined text-2xl">
        keyboard_arrow_up
      </span>
    </button>
  );
}