"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useToastStore, type ToastType } from "@/store/toast.store";

function getToastStyle(type: ToastType) {
  switch (type) {
    case "success":
      return {
        icon: "check_circle",
        wrapperClassName: "border-green-200 bg-green-50 text-green-700",
        iconClassName: "text-green-600",
      };

    case "error":
      return {
        icon: "error",
        wrapperClassName: "border-red-200 bg-red-50 text-red-700",
        iconClassName: "text-red-600",
      };

    case "warning":
      return {
        icon: "warning",
        wrapperClassName: "border-yellow-200 bg-yellow-50 text-yellow-700",
        iconClassName: "text-yellow-600",
      };

    default:
      return {
        icon: "info",
        wrapperClassName: "border-blue-200 bg-blue-50 text-blue-700",
        iconClassName: "text-blue-600",
      };
  }
}

export default function ToastContainer() {
  const [isMounted, setIsMounted] = useState(false);

  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className="fixed right-4 top-4 z-220 flex flex-col gap-3 sm:right-6 sm:top-6"
      style={{
        width: "min(420px, calc(100vw - 32px))",
      }}
    >
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);

        return (
          <div
            key={toast.id}
            className={[
              "flex w-full items-start gap-3 rounded-2xl border p-4 shadow-xl",
              "backdrop-blur-sm transition-all duration-200",
              style.wrapperClassName,
            ].join(" ")}
            style={{
              width: "100%",
              minWidth: 0,
              wordBreak: "normal",
              overflowWrap: "normal",
            }}
          >
            <span
              className={[
                "material-symbols-outlined mt-0.5 shrink-0 text-2xl",
                style.iconClassName,
              ].join(" ")}
            >
              {style.icon}
            </span>

            <div
              className="min-w-0 flex-1"
              style={{
                minWidth: 0,
                width: "100%",
              }}
            >
              {toast.title ? (
                <p
                  className="font-semibold leading-5"
                  style={{
                    width: "100%",
                    wordBreak: "normal",
                    overflowWrap: "normal",
                  }}
                >
                  {toast.title}
                </p>
              ) : null}

              <p
                className="mt-0.5 text-sm leading-5"
                style={{
                  width: "100%",
                  wordBreak: "normal",
                  overflowWrap: "normal",
                }}
              >
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5"
              aria-label="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}