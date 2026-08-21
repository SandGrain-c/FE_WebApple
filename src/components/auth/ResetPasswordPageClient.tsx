"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import PasswordResetShell from "@/components/auth/PasswordResetShell";
import {
  type ResetPasswordForm,
  type ResetPasswordFormErrors,
  validateResetPasswordForm,
} from "@/lib/auth/password-reset";
import { resetPassword } from "@/services/auth.service";

type ResetPasswordPageClientProps = {
  token: string | null;
};

const emptyForm: ResetPasswordForm = {
  newPassword: "",
  confirmPassword: "",
};

export default function ResetPasswordPageClient({
  token,
}: ResetPasswordPageClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<ResetPasswordForm>(emptyForm);
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isCompleted) return;

    const redirectTimer = window.setTimeout(() => {
      router.replace("/login?passwordReset=success");
    }, 1500);

    return () => window.clearTimeout(redirectTimer);
  }, [isCompleted, router]);

  function updateField(field: keyof ResetPasswordForm, value: string) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setErrors(validateResetPasswordForm(nextForm));
    setRequestError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateResetPasswordForm(form);
    setErrors(nextErrors);
    setRequestError(null);

    if (!token || Object.keys(nextErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      await resetPassword({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setForm(emptyForm);
      setIsCompleted(true);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Token không hợp lệ hoặc đã hết hạn."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PasswordResetShell
      icon="lock_reset"
      eyebrow="Khôi phục tài khoản"
      title="Đặt mật khẩu mới"
      description="Mật khẩu mới phải tuân theo cùng chính sách với đăng ký và đổi mật khẩu."
    >
      {!token ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
        >
          <p className="font-semibold">Link đặt lại mật khẩu không hợp lệ.</p>
          <p className="mt-1">
            Hãy yêu cầu một liên kết mới để tiếp tục khôi phục tài khoản.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-flex font-semibold text-primary hover:underline"
          >
            Yêu cầu liên kết mới
          </Link>
        </div>
      ) : isCompleted ? (
        <div
          role="status"
          className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-800"
        >
          <p className="font-semibold">Mật khẩu được cập nhật thành công.</p>
          <p className="mt-1">Đang chuyển bạn về trang đăng nhập...</p>
          <Link
            href="/login?passwordReset=success"
            className="mt-4 inline-flex font-semibold text-primary hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="new-password"
            label="Mật khẩu mới"
            value={form.newPassword}
            error={errors.newPassword}
            isVisible={showPassword}
            isSubmitting={isSubmitting}
            autoComplete="new-password"
            onChange={(value) => updateField("newPassword", value)}
            onToggleVisibility={() => setShowPassword((current) => !current)}
          />

          <PasswordField
            id="confirm-password"
            label="Xác nhận mật khẩu mới"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            isVisible={showPassword}
            isSubmitting={isSubmitting}
            autoComplete="new-password"
            onChange={(value) => updateField("confirmPassword", value)}
            onToggleVisibility={() => setShowPassword((current) => !current)}
          />

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
              {isSubmitting ? "progress_activity" : "lock_reset"}
            </span>
            {isSubmitting ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-primary transition hover:opacity-80"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Quay lại đăng nhập
      </Link>
    </PasswordResetShell>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  isVisible: boolean;
  isSubmitting: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

function PasswordField({
  id,
  label,
  value,
  error,
  isVisible,
  isSubmitting,
  autoComplete,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-on-surface"
      >
        {label}
      </label>
      <div
        className={`flex items-center gap-3 rounded-2xl border bg-surface-container-lowest px-4 transition focus-within:bg-white focus-within:ring-4 ${
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-100"
            : "border-surface-container-high focus-within:border-primary focus-within:ring-primary/10"
        }`}
      >
        <span className="material-symbols-outlined text-xl text-secondary">
          lock
        </span>
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isSubmitting}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={isSubmitting}
          aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-xl">
            {isVisible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : id === "new-password" ? (
        <p className="mt-1.5 text-xs text-secondary">
          Sử dụng ít nhất 6 ký tự.
        </p>
      ) : null}
    </div>
  );
}
