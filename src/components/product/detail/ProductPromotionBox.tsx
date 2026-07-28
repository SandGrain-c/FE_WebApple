type ProductPromotionBoxProps = {
  promotions?: string[];
};

export default function ProductPromotionBox({
  promotions,
}: ProductPromotionBoxProps) {
  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">
          local_offer
        </span>

        <div>
          <h2 className="font-semibold text-on-surface">Khuyến mãi</h2>
          <p className="mt-1 text-sm text-secondary">
            Ưu đãi áp dụng khi mua sản phẩm này.
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-sm text-secondary">
        {promotions.map((promotion) => (
          <li key={promotion} className="flex gap-2">
            <span className="material-symbols-outlined mt-0.5 text-base text-primary">
              check_circle
            </span>
            <span>{promotion}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}