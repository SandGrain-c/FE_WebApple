const policies = [
  {
    icon: "workspace_premium",
    text: "Hàng chính hãng Apple",
  },
  {
    icon: "support_agent",
    text: "Tư vấn chọn đúng phiên bản",
  },
  {
    icon: "inventory_2",
    text: "Kiểm tra tồn kho trước khi giao",
  },
  {
    icon: "receipt_long",
    text: "Xuất hóa đơn theo yêu cầu",
  },
];

export default function ProductMiniPolicy() {
  return (
    <section className="rounded-2xl border border-surface-container-high  p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-semibold text-on-surface">Chính sách sản phẩm</h2>

        <button
          type="button"
          className="text-sm font-medium text-primary transition hover:opacity-80"
        >
          Tìm hiểu thêm
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {policies.map((policy) => (
          <div key={policy.text} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-primary">
              {policy.icon}
            </span>
            <span className="text-sm text-on-surface">{policy.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}