// src/components/admin/common/AdminPlaceholderPage.tsx

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
  icon: string;
  nextSteps: string[];
};

/**
 * Component tạm cho các module Admin chưa code CRUD.
 * Sau này sẽ thay bằng List/Form thật.
 */
export default function AdminPlaceholderPage({
  title,
  description,
  icon,
  nextSteps,
}: AdminPlaceholderPageProps) {
  return (
    <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Module quản trị
          </p>

          <h2 className="mt-2 text-2xl font-bold text-on-surface">{title}</h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
            {description}
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-bold text-on-surface">
              Các bước sẽ làm tiếp:
            </p>

            <ol className="mt-3 space-y-2">
              {nextSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3 text-sm leading-6 text-secondary"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}