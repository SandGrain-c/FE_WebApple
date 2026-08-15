import Link from "next/link";

export default function CompareEmptyState() {
  return (
    <section className="rounded-2xl border border-surface-container-high bg-white px-5 py-14 text-center shadow-sm">
      <span
        className="material-symbols-outlined text-5xl text-secondary"
        aria-hidden="true"
      >
        compare_arrows
      </span>
      <h2 className="mt-4 text-xl font-semibold text-on-surface">
        Chưa có sản phẩm để so sánh
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-secondary">
        Hãy chọn ít nhất hai sản phẩm cùng danh mục để xem điểm giống và khác
        nhau.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Khám phá sản phẩm
      </Link>
    </section>
  );
}
