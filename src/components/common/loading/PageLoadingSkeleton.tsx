import {
  SkeletonBox,
  SkeletonLine,
} from "@/components/common/loading/Skeleton";

export default function PageLoadingSkeleton() {
  return (
    <main className="bg-surface-container-lowest">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <SkeletonLine className="h-8 w-56" />
          <SkeletonLine className="mt-3 h-4 w-80 max-w-full" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm lg:block">
            <SkeletonLine className="h-6 w-32" />

            <div className="mt-5 space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <SkeletonBox key={index} className="h-10 rounded-xl" />
              ))}
            </div>
          </aside>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <SkeletonLine className="h-6 w-40" />
              <SkeletonBox className="h-10 w-32 rounded-xl" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBox key={index} className="h-80 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}