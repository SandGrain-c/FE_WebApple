"use client";

import { useEffect } from "react";

type CartConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function CartConfirmModal({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isLoading = false,
  onConfirm,
  onClose,
}: CartConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-130 shrink-0 rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-4xl">delete</span>
        </div>

        <h2 className="mx-auto mt-5 w-full text-center text-2xl font-bold leading-8 text-on-surface">
          {title}
        </h2>

        <div className="mt-3 w-full">
          <p className="mx-auto block w-full max-w-110 whitespace-normal text-center text-sm leading-6 text-secondary sm:text-base sm:leading-7">
            {description}
          </p>
        </div>

        <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="h-12 rounded-xl border border-outline-variant px-4 text-sm font-medium text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="h-12 rounded-xl bg-primary px-4 text-sm font-medium text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}