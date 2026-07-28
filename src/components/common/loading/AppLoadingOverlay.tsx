"use client";

import { useEffect } from "react";
import { useGlobalLoadingStore } from "@/store/global-loading.store";

export default function AppLoadingOverlay() {
  const isOpen = useGlobalLoadingStore((state) => state.isOpen);
  const title = useGlobalLoadingStore((state) => state.title);
  const description = useGlobalLoadingStore((state) => state.description);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-[380px] rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-7">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <div className="relative">
            <span className="material-symbols-outlined text-5xl">
              shopping_bag
            </span>

            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md">
              <span className="material-symbols-outlined animate-spin text-xl text-primary">
                progress_activity
              </span>
            </span>
          </div>
        </div>

        <h3 className="mx-auto mt-5 w-full text-center text-lg font-bold leading-7 text-on-surface">
          {title}
        </h3>

        <p className="mx-auto mt-2 w-full max-w-[300px] text-center text-sm leading-6 text-secondary">
          {description}
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}