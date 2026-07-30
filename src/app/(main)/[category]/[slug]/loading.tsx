function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-high ${className}`}
    />
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-surface-container-high ${className}`}
    />
  );
}

export default function ProductDetailLoading() {
  return (
    <main className="bg-surface-container-lowest">
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-4 w-16" />
          <SkeletonLine className="h-4 w-4" />
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 w-4" />
          <SkeletonLine className="h-4 w-40" />
        </div>

        {/* Main product card */}
        <div className="mt-5 rounded-2xl border border-surface-container-high bg-surface p-4 shadow-sm sm:p-6">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
            {/* Left gallery */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                <SkeletonBox className="aspect-square w-full rounded-xl" />

                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonBox
                      key={index}
                      className="aspect-square w-full rounded-xl"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right product info */}
            <div className="min-w-0">
              <SkeletonLine className="h-8 w-4/5" />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SkeletonLine className="h-4 w-16" />
                <SkeletonLine className="h-4 w-20" />
                <SkeletonLine className="h-4 w-24" />
              </div>

              {/* Price box */}
              <div className="mt-5 rounded-2xl bg-surface-container-lowest p-4">
                <div className="flex items-center gap-3">
                  <SkeletonLine className="h-9 w-44" />
                  <SkeletonLine className="h-6 w-20" />
                </div>

                <SkeletonLine className="mt-3 h-4 w-28" />
                <SkeletonLine className="mt-3 h-4 w-48" />
              </div>

              {/* Stock box */}
              <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                <SkeletonLine className="h-5 w-24" />
                <SkeletonLine className="mt-3 h-4 w-52" />
              </div>

              {/* Variant selector */}
              <div className="mt-5 space-y-5">
                <div>
                  <SkeletonLine className="h-5 w-28" />
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonBox key={index} className="h-12 rounded-xl" />
                    ))}
                  </div>
                </div>

                <div>
                  <SkeletonLine className="h-5 w-32" />
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <SkeletonBox key={index} className="h-12 rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Promotion */}
              <div className="mt-5 rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <SkeletonLine className="h-5 w-28" />
                    <SkeletonLine className="mt-2 h-4 w-56" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <SkeletonLine className="h-4 w-full" />
                  <SkeletonLine className="h-4 w-5/6" />
                  <SkeletonLine className="h-4 w-4/6" />
                </div>
              </div>

              {/* Trade-in */}
              <div className="mt-5 rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <SkeletonBox className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <SkeletonLine className="h-5 w-36" />
                    <SkeletonLine className="mt-3 h-4 w-full" />
                    <SkeletonLine className="mt-2 h-4 w-4/5" />
                    <SkeletonLine className="mt-4 h-4 w-40" />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SkeletonBox className="h-12 rounded-xl" />
                  <SkeletonBox className="h-12 rounded-xl" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SkeletonBox className="h-12 rounded-xl" />
                  <SkeletonBox className="h-12 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Related data small box nếu bản hiện tại còn dùng */}
          <div className="mt-8 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
            <SkeletonLine className="h-6 w-40" />
            <SkeletonLine className="mt-3 h-4 w-80 max-w-full" />
          </div>
        </div>

        {/* Bottom sections */}
        <div className="mt-8 space-y-6">
          {/* Specifications */}
          <section className="rounded-2xl border border-surface-container-high bg-surface p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <SkeletonLine className="h-7 w-48" />
                <SkeletonLine className="mt-3 h-4 w-72 max-w-full" />
              </div>

              <SkeletonLine className="hidden h-5 w-24 sm:block" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-outline-variant">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[42%_1fr] border-b border-outline-variant last:border-b-0 sm:grid-cols-[240px_1fr]"
                >
                  <div className="border-r border-outline-variant bg-surface-container-lowest px-4 py-3">
                    <SkeletonLine className="h-4 w-28" />
                  </div>

                  <div className="px-4 py-3">
                    <SkeletonLine className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          <section className="rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm sm:p-6">
            <SkeletonLine className="h-7 w-44" />
            <SkeletonLine className="mt-4 h-4 w-full" />
            <SkeletonLine className="mt-3 h-4 w-11/12" />
            <SkeletonLine className="mt-3 h-4 w-10/12" />
          </section>

          {/* Reviews */}
          <section className="rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <SkeletonLine className="h-7 w-44" />
                <SkeletonLine className="mt-3 h-4 w-72 max-w-full" />
              </div>

              <SkeletonBox className="hidden h-10 w-32 rounded-xl sm:block" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <SkeletonBox className="h-56 rounded-2xl" />

              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBox key={index} className="h-28 rounded-2xl" />
                ))}
              </div>
            </div>
          </section>

          {/* Related products */}
          <section className="rounded-2xl border border-surface-container-high bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <SkeletonLine className="h-7 w-44" />
                <SkeletonLine className="mt-3 h-4 w-72 max-w-full" />
              </div>

              <div className="hidden gap-2 sm:flex">
                <SkeletonBox className="h-10 w-10 rounded-full" />
                <SkeletonBox className="h-10 w-10 rounded-full" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBox key={index} className="h-80 rounded-2xl" />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}