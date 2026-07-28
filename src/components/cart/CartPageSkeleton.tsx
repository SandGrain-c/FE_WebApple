import {
  SkeletonBox,
  SkeletonLine,
} from "@/components/common/loading/Skeleton";

export default function CartPageSkeleton() {
  return (
    <main className="bg-surface-container-lowest">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SkeletonLine className="h-8 w-40" />
            <SkeletonLine className="mt-3 h-4 w-80 max-w-full" />
          </div>

          <SkeletonBox className="h-10 w-32 rounded-xl" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-surface-container-high bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <SkeletonLine className="h-5 w-32" />
                <SkeletonLine className="h-4 w-36" />
              </div>
            </div>

            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3 sm:gap-4">
                  <SkeletonBox className="mt-1 h-5 w-5 shrink-0 rounded-md" />
                  <SkeletonBox className="h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-28" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <SkeletonLine className="h-5 w-4/5" />

                        <div className="mt-3 flex flex-wrap gap-2">
                          <SkeletonBox className="h-7 w-20 rounded-full" />
                          <SkeletonBox className="h-7 w-16 rounded-full" />
                          <SkeletonBox className="h-7 w-20 rounded-full" />
                        </div>

                        <SkeletonLine className="mt-3 h-4 w-32" />
                      </div>

                      <SkeletonLine className="h-5 w-14" />
                    </div>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <SkeletonLine className="h-6 w-32" />
                        <SkeletonLine className="mt-2 h-4 w-24" />
                      </div>

                      <div className="flex items-center gap-2">
                        <SkeletonBox className="h-9 w-9 rounded-lg" />
                        <SkeletonBox className="h-9 w-12 rounded-lg" />
                        <SkeletonBox className="h-9 w-9 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <SkeletonLine className="h-6 w-40" />

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <SkeletonLine className="h-4 w-36" />
                <SkeletonLine className="h-4 w-10" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <SkeletonLine className="h-4 w-40" />
                <SkeletonLine className="h-4 w-24" />
              </div>

              <div className="border-t border-outline-variant pt-4">
                <div className="flex items-center justify-between gap-4">
                  <SkeletonLine className="h-4 w-32" />
                  <SkeletonLine className="h-4 w-16" />
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <SkeletonLine className="h-5 w-20" />
                  <SkeletonLine className="h-7 w-32" />
                </div>
              </div>

              <SkeletonBox className="h-12 w-full rounded-xl" />
              <SkeletonBox className="h-12 w-full rounded-xl" />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}