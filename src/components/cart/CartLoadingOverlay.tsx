"use client";

type CartLoadingOverlayProps = {
  open: boolean;
  title?: string;
  description?: string;
};

export default function CartLoadingOverlay({
  open,
  title = "Chờ một xíu nhaaa...",
  description = "Đang cập nhật giỏ hàng của bạn",
}: CartLoadingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-115 grid place-items-center bg-black/45 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-[min(calc(100vw-32px),360px)] shrink-0 rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <div className="relative">
            <span className="material-symbols-outlined text-5xl">
              shopping_cart
            </span>

            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md">
              <span className="material-symbols-outlined animate-spin text-xl text-primary">
                progress_activity
              </span>
            </span>
          </div>
        </div>

        <h3 className="mt-5 text-lg font-bold leading-7 text-on-surface">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-xs whitespace-normal text-sm leading-6 text-secondary">
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