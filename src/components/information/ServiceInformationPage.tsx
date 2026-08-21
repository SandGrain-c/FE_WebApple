import Link from "next/link";

import type {
  ServiceFeatureSection,
  ServicePageContent,
} from "@/config/service-pages";

type ServiceInformationPageProps = {
  content: ServicePageContent;
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: Pick<ServiceFeatureSection, "eyebrow" | "title" | "description">) {
  return (
    <div className="max-w-3xl">
      <p className="text-label-sm font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-body-md leading-7 text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FeatureSection({ section }: { section: ServiceFeatureSection }) {
  return (
    <section>
      <SectionHeading {...section} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {section.items.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-outline-variant/45 bg-surface-container-lowest p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined flex size-11 items-center justify-center rounded-xl bg-primary-fixed text-primary"
            >
              {item.icon}
            </span>
            <h3 className="mt-4 text-lg font-bold text-on-surface">
              {item.title}
            </h3>
            {item.description ? (
              <p className="mt-2 text-sm leading-6 text-secondary">
                {item.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ServiceInformationPage({
  content,
}: ServiceInformationPageProps) {
  return (
    <main className="overflow-hidden">
      <section className="border-b border-outline-variant/35 bg-gradient-to-br from-surface-container-lowest via-surface to-primary-fixed/45">
        <div className="mx-auto w-[90%] max-w-325 py-8 sm:w-[86%] md:w-[80%] md:py-12 lg:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-secondary">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="rounded-sm transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  Trang chủ
                </Link>
              </li>
              <li aria-hidden="true" className="text-outline">
                /
              </li>
              <li aria-current="page" className="font-semibold text-on-surface">
                {content.title}
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
            <div>
              <p className="inline-flex items-center rounded-full border border-primary/15 bg-surface-container-lowest px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm">
                Thông tin &amp; hỗ trợ
              </p>
              <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-on-surface sm:text-4xl lg:text-5xl">
                {content.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-secondary sm:text-lg sm:leading-8">
                {content.heroDescription}
              </p>
              <a
                href="#quy-trinh"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                Xem quy trình
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  arrow_downward
                </span>
              </a>
            </div>

            <div className="mx-auto flex size-48 items-center justify-center rounded-[2rem] border border-primary/10 bg-surface-container-lowest shadow-lg shadow-primary/10 sm:size-56 lg:size-64">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[88px] text-primary sm:text-[104px]"
              >
                {content.heroIcon}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-[90%] max-w-325 gap-14 py-12 sm:w-[86%] md:w-[80%] md:gap-18 md:py-16">
        {content.featureSections.map((section) => (
          <FeatureSection key={section.title} section={section} />
        ))}

        <section id="quy-trinh" aria-labelledby="process-heading" className="scroll-mt-32">
          <div className="rounded-3xl bg-inverse-surface px-5 py-8 text-inverse-on-surface shadow-xl sm:px-8 md:px-10 md:py-10">
            <p className="text-label-sm font-bold uppercase tracking-[0.18em] text-inverse-primary">
              Từng bước rõ ràng
            </p>
            <h2 id="process-heading" className="mt-2 text-2xl font-bold md:text-3xl">
              {content.process.title}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-inverse-on-surface/75">
              {content.process.description}
            </p>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.process.steps.map((step, index) => (
                <li
                  key={step}
                  className="flex min-w-0 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                    {index + 1}
                  </span>
                  <span className="pt-1.5 text-sm font-semibold leading-5 sm:text-base">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="notice-heading">
          <div className="grid gap-6 rounded-3xl border border-primary/15 bg-primary-fixed/55 p-6 md:grid-cols-[220px_minmax(0,1fr)] md:p-8">
            <div>
              <span
                aria-hidden="true"
                className="material-symbols-outlined flex size-12 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-sm"
              >
                info
              </span>
              <h2
                id="notice-heading"
                className="mt-4 text-xl font-bold text-on-primary-fixed"
              >
                {content.notice.title}
              </h2>
              {content.notice.description ? (
                <p className="mt-2 text-sm leading-6 text-on-primary-fixed-variant">
                  {content.notice.description}
                </p>
              ) : null}
            </div>

            <ul className="grid content-start gap-3">
              {content.notice.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl bg-surface-container-lowest/80 p-4 text-sm leading-6 text-on-surface shadow-sm"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined mt-0.5 shrink-0 text-lg text-primary"
                  >
                    check_circle
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {content.faqs.length > 0 ? (
          <section>
            <SectionHeading
              eyebrow="Câu hỏi thường gặp"
              title="Thông tin bạn có thể cần"
              description="Các câu trả lời dưới đây mang tính hướng dẫn và có thể cần xác nhận thêm theo trường hợp thực tế."
            />
            <div className="mt-6 grid gap-3">
              {content.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-outline-variant/45 bg-surface-container-lowest p-5 shadow-sm open:border-primary/25"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-on-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                    <span>{faq.question}</span>
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined shrink-0 text-primary transition-transform group-open:rotate-180"
                    >
                      expand_more
                    </span>
                  </summary>
                  <p className="mt-4 border-t border-outline-variant/35 pt-4 text-sm leading-6 text-secondary">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section
          aria-labelledby="support-cta-heading"
          className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest px-6 py-9 text-center shadow-lg sm:px-10"
        >
          <p className="text-label-sm font-bold uppercase tracking-[0.18em] text-primary">
            Đức Bách Hoá
          </p>
          <h2
            id="support-cta-heading"
            className="mt-2 text-2xl font-bold text-on-surface md:text-3xl"
          >
            Cần hỗ trợ thêm?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-secondary">
            Liên hệ cửa hàng để xác nhận thông tin hoặc xem sản phẩm phù hợp với nhu cầu của bạn.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Về trang chủ
            </Link>
            <Link
              href="/iphone"
              className="inline-flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/35 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Xem sản phẩm
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
