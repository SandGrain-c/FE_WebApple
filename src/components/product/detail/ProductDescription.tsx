type ProductDescriptionProps = {
  shortDescription?: string;
  description: string | null;
};

export default function ProductDescription({
  shortDescription,
  description,
}: ProductDescriptionProps) {
  if (!shortDescription && !description) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">
          article
        </span>

        <div>
          <h2 className="text-xl font-semibold text-on-surface">
            Mô tả sản phẩm
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Tổng quan và điểm nổi bật của sản phẩm.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-7 text-secondary sm:text-base">
        {shortDescription ? (
          <p className="rounded-2xl bg-surface-container-lowest p-4 font-medium text-on-surface">
            {shortDescription}
          </p>
        ) : null}

        {description ? <p>{description}</p> : null}
      </div>
    </section>
  );
}