"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import PasswordResetShell from "@/components/auth/PasswordResetShell";
import {
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  validateForgotPasswordEmail,
} from "@/lib/auth/password-reset";
import { forgotPassword } from "@/services/auth.service";

export default function ForgotPasswordPageClient() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForgotPasswordEmail(email);
    setEmailError(validationError);
    setRequestError(null);

    if (validationError) return;

    try {
      setIsSubmitting(true);
      await forgotPassword({ email: email.trim().toLowerCase() });
      setIsSubmitted(true);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Không thể gửi hướng dẫn đặt lại mật khẩu."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PasswordResetShell
      icon="mark_email_read"
      eyebrow="Khôi phục tài khoản"
      title="Quên mật khẩu?"
      description="Nhập email đã đăng ký. Nếu tài khoản tồn tại, chúng tôi sẽ gửi một liên kết đặt lại mật khẩu."
    >
      {isSubmitted ? (
        <div
          role="status"
          className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-800"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-green-600">
              check_circle
            </span>
            <div>
              <p className="font-semibold">Yêu cầu đã được tiếp nhận</p>
              <p className="mt-1">{FORGOT_PASSWORD_SUCCESS_MESSAGE}</p>
              <p className="mt-2 text-green-700">
                Vui lòng kiểm tra cả thư mục spam hoặc thư rác.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="forgot-password-email"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Email
            </label>
            <div
              className={`flex items-center gap-3 rounded-2xl border bg-surface-container-lowest px-4 transition focus-within:bg-white focus-within:ring-4 ${
                emailError
                  ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-100"
                  : "border-surface-container-high focus-within:border-primary focus-within:ring-primary/10"
              }`}
            >
              <span className="material-symbols-outlined text-xl text-secondary">
                alternate_email
              </span>
              <input
                id="forgot-password-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError(null);
                  setRequestError(null);
                }}
                onBlur={() => setEmailError(validateForgotPasswordEmail(email))}
                disabled={isSubmitting}
                placeholder="customer@example.com"
                autoComplete="email"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "forgot-email-error" : undefined}
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary disabled:cursor-not-allowed"
              />
            </div>
            {emailError ? (
              <p
                id="forgot-email-error"
                className="mt-1.5 text-xs font-medium text-red-600"
              >
                {emailError}
              </p>
            ) : null}
          </div>

          {requestError ? (
            <p
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {requestError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-xl ${
                isSubmitting ? "animate-spin" : ""
              }`}
            >
              {isSubmitting ? "progress_activity" : "outgoing_mail"}
            </span>
            {isSubmitting
              ? "Đang gửi hướng dẫn..."
              : "Gửi liên kết đặt lại mật khẩu"}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-surface-container-lowest"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Quay lại đăng nhập
      </Link>
    </PasswordResetShell>
  );
}
