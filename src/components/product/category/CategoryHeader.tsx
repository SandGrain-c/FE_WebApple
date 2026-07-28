type CategoryHeaderProps = {
  name: string;
  description: string;
  totalProducts: number;
};

export default function CategoryHeader({
  name,
  description,
  totalProducts,
}: CategoryHeaderProps) {
  return (
    <section className="mb-6 rounded-xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-xl text-on-surface">{name}</h1>
          <p className="mt-2 max-w-2xl text-body-md text-secondary">
            {description}
          </p>
        </div>

        <p className="text-label-md text-secondary">
          <span className="font-semibold text-primary">{totalProducts}</span>{" "}
          sản phẩm
        </p>
      </div>
    </section>
  );
}