"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

function getSafeRedirectPath(redirect: string | null) {
  if (!redirect) {
    return "/";
  }

  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/";
  }

  if (redirect.startsWith("/login")) {
    return "/";
  }

  return redirect;
}

type LoginFormErrors = {
  identifier?: string;
  password?: string;
};

type LoginToastVariant = "error" | "success" | "info";

type LoginToast = {
  id: number;
  title: string;
  description?: string;
  variant: LoginToastVariant;
};

type LoginToastStackProps = {
  toasts: LoginToast[];
  onClose: (id: number) => void;
};

function LoginToastStack({ toasts, onClose }: LoginToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[9999] mx-auto flex max-w-[560px] flex-col gap-3 sm:top-6">
      {toasts.map((toast) => {
        const isError = toast.variant === "error";
        const isSuccess = toast.variant === "success";

        const iconName = isError ? "close" : isSuccess ? "check" : "info";

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
            className={`pointer-events-auto w-full rounded-2xl border p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur [animation:login-toast-down_220ms_ease-out_both] ${colorClass}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white ${iconClass}`}
              >
                <span className="material-symbols-outlined text-xl">
                  {iconName}
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
                <span className="material-symbols-outlined text-xl">
                  close
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = useMemo(() => {
    return getSafeRedirectPath(searchParams.get("redirect"));
  }, [searchParams]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState({
    identifier: false,
    password: false,
  });

  const [toasts, setToasts] = useState<LoginToast[]>([]);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
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
    variant: LoginToastVariant,
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

  function validateForm(values: {
    identifier: string;
    password: string;
  }): LoginFormErrors {
    const nextErrors: LoginFormErrors = {};
    const trimmedIdentifier = values.identifier.trim();

    if (!trimmedIdentifier) {
      nextErrors.identifier =
        "Vui lòng nhập tên đăng nhập, email hoặc số điện thoại.";
    } else if (trimmedIdentifier.length < 3) {
      nextErrors.identifier = "Tài khoản cần có ít nhất 3 ký tự.";
    }

    if (!values.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (values.password.length < 6) {
      nextErrors.password = "Mật khẩu cần có ít nhất 6 ký tự.";
    }

    return nextErrors;
  }

  function handleIdentifierChange(value: string) {
    setIdentifier(value);
    clearError();

    if (touched.identifier) {
      setErrors(
        validateForm({
          identifier: value,
          password,
        })
      );
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    clearError();

    if (touched.password) {
      setErrors(
        validateForm({
          identifier,
          password: value,
        })
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm({
      identifier,
      password,
    });

    setTouched({
      identifier: true,
      password: true,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstError = nextErrors.identifier || nextErrors.password;

      showToast(
        "error",
        "Thông tin đăng nhập chưa hợp lệ",
        firstError || "Vui lòng kiểm tra lại tài khoản và mật khẩu."
      );

      return;
    }

    const result = await login(identifier.trim(), password);

    if (!result.success) {
      showToast(
        "error",
        "Đăng nhập thất bại",
        result.message || "Tài khoản hoặc mật khẩu không chính xác."
      );

      return;
    }

    showToast("success", "Đăng nhập thành công", "Đang đồng bộ giỏ hàng.");

    try {
      await fetchCart();
    } catch {
      resetCart();
    }

    router.replace(redirectPath);
  }

  function handleUseTestAccount() {
    setIdentifier("user01");
    setPassword("123456");
    setErrors({});
    setTouched({
      identifier: false,
      password: false,
    });
    clearError();

    showToast(
      "info",
      "Đã điền tài khoản test",
      "Bạn có thể bấm Đăng nhập để kiểm tra luồng xác thực."
    );
  }

  function handleSocialLogin(provider: "Google" | "Zalo") {
    showToast(
      "info",
      `Đăng nhập bằng ${provider}`,
      "Tính năng này hiện mới là UI demo, chưa nối API Back-end."
    );
  }

  const identifierError = touched.identifier ? errors.identifier : undefined;
  const passwordError = touched.password ? errors.password : undefined;
  const passwordResetSucceeded =
    searchParams.get("passwordReset") === "success";

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#f6f6f7]">
      <LoginToastStack toasts={toasts} onClose={closeToast} />

      <section className="mx-auto flex h-full w-full max-w-7xl p-3 sm:p-4 lg:p-5">
        <div className="grid h-full min-h-0 w-full overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_0.95fr]">
          {/* LEFT PANEL */}
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
                Đức Bách Hoá
              </div>
            </div>

            <div className="relative z-10 flex flex-1 items-center">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-on-surface xl:text-5xl 2xl:text-6xl">
                Đăng nhập thành viên Đức Bách Hoá
              </h1>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex min-h-0 items-center justify-center overflow-hidden p-3 sm:p-4 lg:p-6">
            <div className="w-full max-w-[460px] rounded-[24px] border border-surface-container-high bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] [animation:auth-fade-up_500ms_ease-out_both] sm:p-6">
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
                    person
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Đức Bách Hoá Member
                </p>

                <h2 className="mt-1 text-2xl font-bold text-on-surface">
                  Đăng nhập
                </h2>

                <p className="mt-1 text-sm leading-5 text-secondary [@media(max-height:700px)]:hidden">
                  Nhập tài khoản để tiếp tục mua sắm và quản lý giỏ hàng.
                </p>
              </div>

              {passwordResetSucceeded ? (
                <div
                  role="status"
                  className="mt-4 flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                >
                  <span className="material-symbols-outlined text-lg">
                    check_circle
                  </span>
                  <span>Mật khẩu đã được đặt lại. Vui lòng đăng nhập.</span>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <div>
                  <label
                    htmlFor="identifier"
                    className="mb-1.5 block text-sm font-semibold text-on-surface"
                  >
                    Tài khoản
                  </label>

                  <div
                    className={`flex items-center gap-3 rounded-2xl border bg-surface-container-lowest px-4 transition duration-300 focus-within:bg-white focus-within:ring-4 ${
                      identifierError
                        ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-100"
                        : "border-surface-container-high focus-within:border-primary focus-within:ring-primary/10"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-xl ${
                        identifierError ? "text-red-500" : "text-secondary"
                      }`}
                    >
                      alternate_email
                    </span>

                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(event) =>
                        handleIdentifierChange(event.target.value)
                      }
                      onBlur={() => {
                        setTouched((current) => ({
                          ...current,
                          identifier: true,
                        }));
                        setErrors(
                          validateForm({
                            identifier,
                            password,
                          })
                        );
                      }}
                      disabled={isLoading}
                      placeholder="Ví dụ: user01"
                      className="h-12 min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary disabled:cursor-not-allowed"
                      autoComplete="username"
                    />
                  </div>

                  {identifierError ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                      <span className="material-symbols-outlined text-base">
                        error
                      </span>
                      {identifierError}
                    </p>
                  ) : null}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-on-surface"
                    >
                      Mật khẩu
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-sm font-semibold text-primary transition hover:opacity-80"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <div
                    className={`flex items-center gap-3 rounded-2xl border bg-surface-container-lowest px-4 transition duration-300 focus-within:bg-white focus-within:ring-4 ${
                      passwordError
                        ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-100"
                        : "border-surface-container-high focus-within:border-primary focus-within:ring-primary/10"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-xl ${
                        passwordError ? "text-red-500" : "text-secondary"
                      }`}
                    >
                      lock
                    </span>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) =>
                        handlePasswordChange(event.target.value)
                      }
                      onBlur={() => {
                        setTouched((current) => ({
                          ...current,
                          password: true,
                        }));
                        setErrors(
                          validateForm({
                            identifier,
                            password,
                          })
                        );
                      }}
                      disabled={isLoading}
                      placeholder="Nhập mật khẩu"
                      className="h-12 min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary disabled:cursor-not-allowed"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isLoading}
                      className="text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>

                  {passwordError ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                      <span className="material-symbols-outlined text-base">
                        error
                      </span>
                      {passwordError}
                    </p>
                  ) : null}
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
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">
                        login
                      </span>
                      Đăng nhập
                    </>
                  )}
                </button>
              </form>

              <div className="my-4 flex items-center gap-4 [@media(max-height:700px)]:hidden">
                <div className="h-px flex-1 bg-surface-container-high" />
                <span className="text-xs text-secondary">
                  Hoặc đăng nhập bằng
                </span>
                <div className="h-px flex-1 bg-surface-container-high" />
              </div>

              <div className="grid grid-cols-2 gap-3 [@media(max-height:700px)]:hidden">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white text-sm font-semibold text-on-surface shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-bold text-[#4285F4]">
                    G
                  </span>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("Zalo")}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white text-sm font-semibold text-on-surface shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0068ff] text-xs font-bold text-white">
                    Z
                  </span>
                  Zalo
                </button>
              </div>

              {/* <div className="mt-4 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                      Tài khoản test
                    </p>
                    <p className="mt-0.5 text-xs text-secondary [@media(max-height:760px)]:hidden">
                      Dùng nhanh để test login.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleUseTestAccount}
                    disabled={isLoading}
                    className="shrink-0 rounded-xl border border-primary px-3 py-2 text-xs font-semibold text-primary transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Điền nhanh
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white px-3 py-2">
                    <span className="block text-secondary">Identifier</span>
                    <span className="font-semibold text-on-surface">user01</span>
                  </div>

                  <div className="rounded-xl bg-white px-3 py-2">
                    <span className="block text-secondary">Password</span>
                    <span className="font-semibold text-on-surface">123456</span>
                  </div>
                </div>
              </div> */}

              <p className="mt-4 text-center text-sm text-secondary">
                Chưa có tài khoản?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary transition hover:opacity-80"
                >
                  Đăng ký ngay
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

        @keyframes login-toast-down {
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
