export default function ProductTradeInBox() {
  return (
    <section className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary">
          published_with_changes
        </span>

        <div className="flex-1">
          <h2 className="font-semibold text-on-surface">Thu cũ đổi mới</h2>

          <p className="mt-1 text-sm leading-6 text-secondary">
            Hỗ trợ định giá máy cũ và lên đời sản phẩm mới với chi phí tối ưu
            hơn.
          </p>

          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:opacity-80"
          >
            Kiểm tra giá thu máy cũ
            <span className="material-symbols-outlined text-lg">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}