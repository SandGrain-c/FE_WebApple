import Link from "next/link";

export default function ProductDetailNotFound() {
  return (
    <main className="bg-surface-container-lowest">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-surface-container-high bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-4xl">
                search_off
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-on-surface sm:text-3xl">
              Không tìm thấy sản phẩm
            </h1>

            {/* <p className="mt-3 w-full max-w-xl text-sm leading-6 text-secondary sm:text-base">
              Sản phẩm bạn đang tìm kiếm có thể đã ngừng kinh doanh, thay đổi
              đường dẫn hoặc không còn tồn tại trong hệ thống.
            </p> */}

            <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-on-primary transition hover:opacity-90"
              >
                Về trang chủ
              </Link>

              <Link
                href="/iphone"
                className="inline-flex items-center justify-center rounded-xl border border-primary px-5 py-3 text-sm font-medium text-primary transition hover:bg-surface-container-lowest"
              >
                Xem danh mục iPhone
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-surface-container-lowest p-4">
            <p className="text-sm font-semibold text-on-surface">
              Bạn có thể thử:
            </p>

            <div className="mt-3 grid gap-3 text-sm text-secondary sm:grid-cols-3">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-base text-primary">
                  check_circle
                </span>
                <span>Kiểm tra lại đường dẫn sản phẩm.</span>
              </div>

              <div className="flex gap-2">
                <span className="material-symbols-outlined text-base text-primary">
                  category
                </span>
                <span>Quay lại danh mục để xem sản phẩm tương tự.</span>
              </div>

              <div className="flex gap-2">
                <span className="material-symbols-outlined text-base text-primary">
                  search
                </span>
                <span>Sử dụng thanh tìm kiếm theo tên sản phẩm.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}