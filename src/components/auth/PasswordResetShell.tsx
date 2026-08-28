import Link from "next/link";
import type { ReactNode } from "react";

import { SITE_CONFIG } from "@/config/site";

type PasswordResetShellProps = {
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function PasswordResetShell({
  icon,
  eyebrow,
  title,
  description,
  children,
}: PasswordResetShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f6f7] px-4 py-8 sm:py-12">
      <section className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-5xl overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-white via-[#fff7f8] to-[#f8f8f9] p-10 lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-8 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <Link
            href="/"
            className="relative z-10 inline-flex w-fit items-center gap-2 text-sm font-medium text-primary transition hover:gap-3"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Về trang chủ
          </Link>

          <div className="relative z-10 my-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-on-surface">
              Bảo vệ tài khoản {SITE_CONFIG.name} của bạn
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-secondary">
              Liên kết đặt lại mật khẩu có thời hạn ngắn và chỉ sử dụng được
              một lần.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
          <div className="w-full max-w-[480px]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  {description}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary lg:hidden">
                <span className="material-symbols-outlined text-2xl">
                  {icon}
                </span>
              </div>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
