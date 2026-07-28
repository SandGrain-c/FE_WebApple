"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { changeUserPassword } from "@/services/user-password.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

type ChangePasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ChangePasswordFormErrors = Partial<
  Record<keyof ChangePasswordFormState, string>
>;

function getEmptyFormState(): ChangePasswordFormState {
  return {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

function validateChangePasswordForm(formState: ChangePasswordFormState) {
  const errors: ChangePasswordFormErrors = {};

  if (!formState.currentPassword.trim()) {
    errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
  }

  if (!formState.newPassword.trim()) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (formState.newPassword.length < 6) {
    errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự.";
  }

  if (!formState.confirmPassword.trim()) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
  } else if (formState.confirmPassword !== formState.newPassword) {
    errors.confirmPassword = "Xác nhận mật khẩu mới không khớp.";
  }

  if (
    formState.currentPassword &&
    formState.newPassword &&
    formState.currentPassword === formState.newPassword
  ) {
    errors.newPassword = "Mật khẩu mới không được trùng mật khẩu hiện tại.";
  }

  return errors;
}

export default function ChangePasswordPageClient() {
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const resetCart = useCartStore((state) => state.resetCart);

  const [formState, setFormState] = useState<ChangePasswordFormState>(
    getEmptyFormState
  );
  const [formErrors, setFormErrors] = useState<ChangePasswordFormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      router.replace("/login?redirect=/account/change-password");
    }
  }, [accessToken, isAuthenticated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      router.replace("/login?redirect=/account/change-password");
      return;
    }

    const nextErrors = validateChangePasswordForm(formState);
    setFormErrors(nextErrors);
    setMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await changeUserPassword(
        {
          currentPassword: formState.currentPassword,
          newPassword: formState.newPassword,
          confirmPassword: formState.confirmPassword,
        },
        accessToken
      );

      setMessageType("success");
      setMessage(`${result.message}. Vui lòng đăng nhập lại bằng mật khẩu mới.`);

      setFormState(getEmptyFormState());

      window.setTimeout(async () => {
        await logout();
        resetCart();
        router.replace("/login");
      }, 1200);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể đổi mật khẩu.";

      setMessageType("error");
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!accessToken || !isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-surface-container-high bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-on-surface">
            Bạn cần đăng nhập để đổi mật khẩu.
          </p>

          <Link
            href="/login?redirect=/account/change-password"
            className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary"
          >
            Đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-secondary">
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>{" "}
          / Tài khoản / Đổi mật khẩu
        </p>

        <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
          Đổi mật khẩu
        </h1>

        <p className="mt-2 text-sm leading-6 text-secondary">
          Sau khi đổi mật khẩu thành công, bạn sẽ được đăng xuất và cần đăng
          nhập lại bằng mật khẩu mới.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface">
            Thông tin mật khẩu
          </h2>

          {message ? (
            <div
              className={`mt-4 rounded-2xl border p-4 text-sm ${
                messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>

              <input
                type="password"
                value={formState.currentPassword}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    currentPassword: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Nhập mật khẩu hiện tại"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  formErrors.currentPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {formErrors.currentPassword ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {formErrors.currentPassword}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>

              <input
                type="password"
                value={formState.newPassword}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    newPassword: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Nhập mật khẩu mới"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  formErrors.newPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {formErrors.newPassword ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {formErrors.newPassword}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-secondary">
                  Mật khẩu mới nên có ít nhất 6 ký tự.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>

              <input
                type="password"
                value={formState.confirmPassword}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    confirmPassword: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Nhập lại mật khẩu mới"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  formErrors.confirmPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {formErrors.confirmPassword ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {formErrors.confirmPassword}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">
                    progress_activity
                  </span>
                  Đang đổi mật khẩu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    lock_reset
                  </span>
                  Đổi mật khẩu
                </>
              )}
            </button>
          </form>
        </section>

        <aside className="h-fit rounded-[28px] border border-surface-container-high bg-white p-6 shadow-sm lg:sticky lg:top-36">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-3xl">
              shield_lock
            </span>
          </div>

          <h2 className="mt-4 text-lg font-bold text-on-surface">
            Lưu ý bảo mật
          </h2>

          <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary">
            <li>Không dùng lại mật khẩu cũ.</li>
            <li>Không chia sẻ mật khẩu cho người khác.</li>
            <li>Sau khi đổi mật khẩu, hãy đăng nhập lại để tiếp tục mua hàng.</li>
          </ul>

          <Link
            href="/account/profile"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-surface-container-lowest"
          >
            Cập nhật thông tin cá nhân
          </Link>
        </aside>
      </div>
    </main>
  );
}