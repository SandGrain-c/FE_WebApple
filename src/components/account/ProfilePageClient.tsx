"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { updateUserProfile } from "@/services/user-profile.service";
import { useAuthStore } from "@/store/auth.store";

type ProfileFormState = {
  fullName: string;
  email: string;
  phone: string;
};

type ProfileFormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
};

function validateProfileForm(formState: ProfileFormState): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (!formState.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ tên.";
  }

  if (!formState.email.trim()) {
    errors.email = "Vui lòng nhập email.";
  } else if (!/^\S+@\S+\.\S+$/.test(formState.email.trim())) {
    errors.email = "Email chưa hợp lệ.";
  }

  if (!formState.phone.trim()) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!/^[0-9+\-\s()]{8,20}$/.test(formState.phone.trim())) {
    errors.phone = "Số điện thoại chưa hợp lệ.";
  }

  return errors;
}

export default function ProfilePageClient() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getMe = useAuthStore((state) => state.getMe);

  const [formState, setFormState] = useState<ProfileFormState>({
    fullName: "",
    email: "",
    phone: "",
  });

  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      router.replace("/login?redirect=/account/profile");
      return;
    }

    getMe();
  }, [accessToken, isAuthenticated, getMe, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormState({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      router.replace("/login?redirect=/account/profile");
      return;
    }

    const nextErrors = validateProfileForm(formState);
    setFormErrors(nextErrors);
    setMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      await updateUserProfile(
        {
          fullName: formState.fullName.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
        },
        accessToken
      );

      /**
       * Gọi lại getMe để cập nhật auth.store.user.
       * HeaderAuthMenu sẽ tự đổi tên/email ngay sau khi store update.
       */
      await getMe();

      setMessageType("success");
      setMessage("Cập nhật thông tin cá nhân thành công.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật thông tin cá nhân.";

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
            Bạn cần đăng nhập để cập nhật thông tin.
          </p>

          <Link
            href="/login?redirect=/account/profile"
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
          / Tài khoản / Cập nhật thông tin
        </p>

        <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
          Cập nhật thông tin cá nhân
        </h1>

        <p className="mt-2 text-sm leading-6 text-secondary">
          Quản lý họ tên, email và số điện thoại dùng cho tài khoản mua hàng.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface">
            Thông tin tài khoản
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
                Tên đăng nhập
              </label>

              <input
                type="text"
                value={user?.userName || ""}
                readOnly
                className="h-12 w-full cursor-not-allowed rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm text-secondary outline-none"
              />

              <p className="mt-1.5 text-xs text-secondary">
                Tên đăng nhập không thể thay đổi.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Họ tên <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={formState.fullName}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    fullName: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Nguyễn Văn A"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  formErrors.fullName
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {formErrors.fullName ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {formErrors.fullName}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Email <span className="text-red-500">*</span>
              </label>

              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    email: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="email@gmail.com"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  formErrors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {formErrors.email ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {formErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Số điện thoại <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={formState.phone}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    phone: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="0900000001"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  formErrors.phone
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {formErrors.phone ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {formErrors.phone}
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
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    save
                  </span>
                  Lưu thay đổi
                </>
              )}
            </button>
          </form>
        </section>

        <aside className="h-fit rounded-[28px] border border-surface-container-high bg-white p-6 shadow-sm lg:sticky lg:top-36">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-on-primary">
              {(user?.fullName || user?.userName || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-on-surface">
                {user?.fullName || user?.userName}
              </p>

              <p className="truncate text-sm text-secondary">
                {user?.email || user?.phone}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-secondary">Vai trò</span>
              <span className="font-semibold text-on-surface">
                {user?.role || "Customer"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-secondary">User ID</span>
              <span className="font-semibold text-on-surface">
                #{user?.id}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <Link
              href="/orders"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-surface-container-lowest"
            >
              Đơn hàng của tôi
            </Link>

            <Link
              href="/cart"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
            >
              Giỏ hàng của tôi
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}