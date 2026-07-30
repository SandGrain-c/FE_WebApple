import Link from "next/link";

export default function CartLoginRequired() {
  return (
    <div className="rounded-2xl border border-surface-container-high bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-4xl">lock</span>
      </div>

      <h1 className="mt-5 text-2xl font-bold text-on-surface">
        Vui lòng đăng nhập
      </h1>

      <p className="mt-2 text-sm text-secondary">
        Bạn cần đăng nhập để xem và quản lý giỏ hàng.
      </p>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-on-primary transition hover:opacity-90"
      >
        Đăng nhập
      </Link>
    </div>
  );
}