"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { SITE_CONFIG } from "@/config/site";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

function getSafeRedirectPath(redirect: string | null) {
  if (!redirect) return "/";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/";
  if (redirect.startsWith("/login") || redirect.startsWith("/register")) {
    return "/";
  }
  return redirect;
}

type RegisterForm = {
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type RegisterFormErrors = Partial<Record<keyof RegisterForm, string>>;

type RegisterToastVariant = "error" | "success" | "info";

type RegisterToast = {
  id: number;
  title: string;
  description?: string;
  variant: RegisterToastVariant;
};

function RegisterToastStack({
  toasts,
  onClose,
}: {
  toasts: RegisterToast[];
  onClose: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[9999] mx-auto flex max-w-[560px] flex-col gap-3 sm:top-6">
      {toasts.map((toast) => {
        const isError = toast.variant === "error";
        const isSuccess = toast.variant === "success";

        const colorClass = isError
          ? "border-red-400 bg-red-50 text-red-600"
          : isSuccess
            ? "border-green-400 bg-green-50 text-green-600"
            : "border-primary/40 bg-white text-primary";

        const iconClass = isError
          ? "border-red-500 text-red-500"
          : isSuccess
            ? "border-green-500 text-green-500"
            : "border-primary text-primary";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full rounded-2xl border p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur [animation:auth-toast-down_220ms_ease-out_both] ${colorClass}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white ${iconClass}`}
              >
                <span className="material-symbols-outlined text-xl">
                  {isError ? "close" : isSuccess ? "check" : "info"}
                </span>
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="break-words text-base font-bold leading-6">
                  {toast.title}
                </p>

                {toast.description ? (
                  <p className="mt-1 break-words text-sm leading-5 text-on-surface">
                    {toast.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface transition hover:bg-white hover:text-primary"
                aria-label="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const initialForm: RegisterForm = {
  userName: "",
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = useMemo(() => {
    return getSafeRedirectPath(searchParams.get("redirect"));
  }, [searchParams]);

  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof RegisterForm, boolean>>
  >({});
  const [showPassword, setShowPassword] = useState(false);
  const [toasts, setToasts] = useState<RegisterToast[]>([]);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const register = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);

  const fetchCart = useCartStore((state) => state.fetchCart);
  const resetCart = useCartStore((state) => state.resetCart);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, redirectPath, router]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: RegisterToastVariant,
    title: string,
    description?: string
  ) {
    const id = Date.now() + Math.random();

    setToasts((current) => [
      {
        id,
        title,
        description,
        variant,
      },
      ...current.slice(0, 2),
    ]);

    window.setTimeout(() => {
      closeToast(id);
    }, 3500);
  }

  function validateForm(values: RegisterForm): RegisterFormErrors {
    const nextErrors: RegisterFormErrors = {};

    if (!values.userName.trim()) {
      nextErrors.userName = "Vui lòng nhập tên đăng nhập.";
    } else if (values.userName.trim().length < 3) {
      nextErrors.userName = "Tên đăng nhập cần có ít nhất 3 ký tự.";
    }

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Email không hợp lệ.";
    }

    if (!values.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!/^(0|\+84)[0-9]{9,10}$/.test(values.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ.";
    }

    if (!values.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (values.password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Mật khẩu nhập lại không khớp.";
    }

    return nextErrors;
  }

  function handleChange(field: keyof RegisterForm, value: string) {
    const nextForm = {
      ...form,
      [field]: value,
    };

    setForm(nextForm);
    clearError();

    if (touched[field]) {
      setErrors(validateForm(nextForm));
    }
  }

  function handleBlur(field: keyof RegisterForm) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    setErrors(validateForm(form));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);

    setTouched({
      userName: true,
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstError = Object.values(nextErrors)[0];

      showToast(
        "error",
        "Thông tin đăng ký chưa hợp lệ",
        firstError || "Vui lòng kiểm tra lại thông tin đăng ký."
      );

      return;
    }

    const result = await register({
      userName: form.userName.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    });

    if (!result.success) {
      showToast(
        "error",
        "Đăng ký thất bại",
        result.message || "Không thể đăng ký tài khoản."
      );

      return;
    }

    showToast("success", "Đăng ký thành công", "Đang đồng bộ tài khoản.");

    try {
      await fetchCart();
    } catch {
      resetCart();
    }

    router.replace(redirectPath);
  }

  function getFieldError(field: keyof RegisterForm) {
    return touched[field] ? errors[field] : undefined;
  }

  function fillTestAccount() {
    const suffix = Date.now().toString().slice(-4);

    setForm({
      userName: `user${suffix}`,
      fullName: `Người dùng test ${suffix}`,
      email: `user${suffix}@gmail.com`,
      phone: `09000${suffix}`,
      password: "123456",
      confirmPassword: "123456",
    });

    setErrors({});
    setTouched({});

    showToast(
      "info",
      "Đã điền tài khoản test",
      "Bạn có thể bấm Đăng ký để kiểm tra API."
    );
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#f6f6f7]">
      <RegisterToastStack toasts={toasts} onClose={closeToast} />

      <section className="mx-auto flex h-full w-full max-w-7xl p-3 sm:p-4 lg:p-5">
        <div className="grid h-full min-h-0 w-full overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_0.95fr]">
          <div className="relative hidden min-h-0 overflow-hidden bg-gradient-to-br from-white via-[#fff7f8] to-[#f8f8f9] p-8 lg:flex lg:flex-col xl:p-12">
            <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-8 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary transition hover:gap-3"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                Về trang chủ
              </Link>

              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-5 py-2.5 text-sm font-bold text-primary shadow-sm backdrop-blur">
                <span className="material-symbols-outlined text-lg">
                  storefront
                </span>
                {SITE_CONFIG.name}
              </div>
            </div>

            <div className="relative z-10 flex flex-1 items-center">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-on-surface xl:text-5xl 2xl:text-6xl">
                Đăng ký thành viên {SITE_CONFIG.name}
              </h1>
            </div>
          </div>

          <div className="flex min-h-0 items-center justify-center overflow-hidden p-3 sm:p-4 lg:p-6">
            <div className="w-full max-w-[500px] rounded-[24px] border border-surface-container-high bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] [animation:auth-fade-up_500ms_ease-out_both] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary lg:hidden"
                >
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  Trang chủ
                </Link>

                <div className="ml-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-xl">
                    person_add
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {SITE_CONFIG.name} Member
                </p>

                <h2 className="mt-1 text-2xl font-bold text-on-surface">
                  Đăng ký
                </h2>

                <p className="mt-1 text-sm leading-5 text-secondary [@media(max-height:760px)]:hidden">
                  Tạo tài khoản để mua sắm và đồng bộ giỏ hàng.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <RegisterInput
                    label="Tên đăng nhập"
                    icon="alternate_email"
                    value={form.userName}
                    error={getFieldError("userName")}
                    placeholder="user02"
                    onChange={(value) => handleChange("userName", value)}
                    onBlur={() => handleBlur("userName")}
                    disabled={isLoading}
                  />

                  <RegisterInput
                    label="Họ và tên"
                    icon="badge"
                    value={form.fullName}
                    error={getFieldError("fullName")}
                    placeholder="Người dùng test"
                    onChange={(value) => handleChange("fullName", value)}
                    onBlur={() => handleBlur("fullName")}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <RegisterInput
                    label="Email"
                    icon="mail"
                    type="email"
                    value={form.email}
                    error={getFieldError("email")}
                    placeholder="user02@gmail.com"
                    onChange={(value) => handleChange("email", value)}
                    onBlur={() => handleBlur("email")}
                    disabled={isLoading}
                  />

                  <RegisterInput
                    label="Số điện thoại"
                    icon="call"
                    value={form.phone}
                    error={getFieldError("phone")}
                    placeholder="0900000002"
                    onChange={(value) => handleChange("phone", value)}
                    onBlur={() => handleBlur("phone")}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <RegisterInput
                    label="Mật khẩu"
                    icon="lock"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    error={getFieldError("password")}
                    placeholder="123456"
                    onChange={(value) => handleChange("password", value)}
                    onBlur={() => handleBlur("password")}
                    disabled={isLoading}
                    rightAction={
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="text-secondary transition hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    }
                  />

                  <RegisterInput
                    label="Nhập lại mật khẩu"
                    icon="lock_reset"
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    error={getFieldError("confirmPassword")}
                    placeholder="Nhập lại"
                    onChange={(value) =>
                      handleChange("confirmPassword", value)
                    }
                    onBlur={() => handleBlur("confirmPassword")}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition duration-300 hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl">
                        progress_activity
                      </span>
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">
                        person_add
                      </span>
                      Đăng ký
                    </>
                  )}
                </button>
              </form>

              {/* <div className="mt-4 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                      Tài khoản test
                    </p>
                    <p className="mt-0.5 text-xs text-secondary [@media(max-height:760px)]:hidden">
                      Tự sinh thông tin để test API đăng ký.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fillTestAccount}
                    disabled={isLoading}
                    className="shrink-0 rounded-xl border border-primary px-3 py-2 text-xs font-semibold text-primary transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Điền nhanh
                  </button>
                </div>
              </div> */}

              <p className="mt-4 text-center text-sm text-secondary">
                Đã có tài khoản?{" "}
                <Link
                  href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
                  className="font-semibold text-primary transition hover:opacity-80"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes auth-fade-up {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes auth-toast-down {
          from {
            opacity: 0;
            transform: translateY(-18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}

type RegisterInputProps = {
  label: string;
  icon: string;
  value: string;
  error?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  rightAction?: React.ReactNode;
  onChange: (value: string) => void;
  onBlur: () => void;
};

function RegisterInput({
  label,
  icon,
  value,
  error,
  placeholder,
  type = "text",
  disabled,
  rightAction,
  onChange,
  onBlur,
}: RegisterInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-on-surface">
        {label}
      </label>

      <div
        className={`flex items-center gap-2 rounded-2xl border bg-surface-container-lowest px-3 transition duration-300 focus-within:bg-white focus-within:ring-4 ${
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-100"
            : "border-surface-container-high focus-within:border-primary focus-within:ring-primary/10"
        }`}
      >
        <span
          className={`material-symbols-outlined text-lg ${
            error ? "text-red-500" : "text-secondary"
          }`}
        >
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary disabled:cursor-not-allowed"
        />

        {rightAction}
      </div>

      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}
