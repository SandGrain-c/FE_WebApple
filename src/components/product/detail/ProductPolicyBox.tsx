const policies = [
  {
    icon: "local_shipping",
    title: "Giao hàng nhanh",
    description: "Hỗ trợ giao hàng toàn quốc.",
  },
  {
    icon: "verified",
    title: "Bảo hành chính hãng",
    description: "Sản phẩm chính hãng Apple.",
  },
  {
    icon: "sync_alt",
    title: "Đổi trả 7 ngày",
    description: "Hỗ trợ đổi trả theo chính sách.",
  },
  {
    icon: "credit_card",
    title: "Trả góp linh hoạt",
    description: "Hỗ trợ trả góp 0% qua thẻ.",
  },
];

export default function ProductPolicyBox() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {policies.map((policy) => (
        <div
          key={policy.title}
          className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4"
        >
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary">
              {policy.icon}
            </span>

            <div>
              <p className="font-medium text-on-surface">{policy.title}</p>
              <p className="mt-1 text-sm text-secondary">
                {policy.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}