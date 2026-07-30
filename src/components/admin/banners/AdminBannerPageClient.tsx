// src/components/admin/banners/AdminBannerPageClient.tsx

"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createAdminBanner,
  deleteAdminBanner,
  getAdminBanners,
  updateAdminBanner,
} from "@/services/admin-banner.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminBanner,
  AdminBannerStatusFilter,
} from "@/types/admin-banner.type";

type BannerFormState = {
  title: string;
  targetUrl: string;
  position: string;
  isActive: boolean;
};

type BannerFormErrors = {
  file?: string;
  title?: string;
  targetUrl?: string;
  position?: string;
};

type BannerModalMode = "create" | "edit";

type BannerToastVariant = "success" | "error" | "info";

type BannerToast = {
  id: number;
  variant: BannerToastVariant;
  title: string;
  description?: string;
};

const BANNER_POSITION_OPTIONS = [
  {
    label: "Home Hero",
    value: "home-hero",
  },
  {
    label: "Home Sale",
    value: "home-sale",
  },
  {
    label: "Category Hero",
    value: "category-hero",
  },
  {
    label: "Category Top",
    value: "category-top",
  },
  {
    label: "Shop Hero",
    value: "shop-hero",
  },
];

function getEmptyFormState(): BannerFormState {
  return {
    title: "",
    targetUrl: "",
    position: "home-hero",
    isActive: true,
  };
}

function mapBannerToFormState(banner: AdminBanner): BannerFormState {
  return {
    title: banner.title || "",
    targetUrl: banner.targetUrl || "",
    position: banner.position || "home-hero",
    isActive: banner.isActive,
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function validateBannerForm(
  formState: BannerFormState,
  selectedFile: File | null,
  mode: BannerModalMode
): BannerFormErrors {
  const errors: BannerFormErrors = {};
  const targetUrl = formState.targetUrl.trim();
  const position = formState.position.trim();

  if (mode === "create" && !selectedFile) {
    errors.file = "Vui lòng chọn ảnh banner.";
  }

  if (!position) {
    errors.position = "Vui lòng nhập hoặc chọn vị trí banner.";
  }

  /**
   * targetUrl không bắt buộc.
   * Nếu nhập thì nên là đường dẫn nội bộ hoặc URL đầy đủ.
   */
  if (
    targetUrl &&
    !targetUrl.startsWith("/") &&
    !targetUrl.startsWith("http://") &&
    !targetUrl.startsWith("https://")
  ) {
    errors.targetUrl =
      "Link điều hướng nên bắt đầu bằng /, http:// hoặc https://.";
  }

  return errors;
}

type BannerToastStackProps = {
  toasts: BannerToast[];
  onClose: (id: number) => void;
};

function BannerToastStack({ toasts, onClose }: BannerToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[9999] mx-auto flex max-w-[560px] flex-col gap-3 sm:top-6">
      {toasts.map((toast) => {
        const iconName =
          toast.variant === "success"
            ? "check"
            : toast.variant === "error"
              ? "close"
              : "info";

        const colorClass =
          toast.variant === "success"
            ? "border-green-400 bg-green-50 text-green-600"
            : toast.variant === "error"
              ? "border-red-400 bg-red-50 text-red-600"
              : "border-primary/40 bg-white text-primary";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] ${colorClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white">
                <span className="material-symbols-outlined text-xl">
                  {iconName}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-bold">{toast.title}</p>

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

type BannerFormModalProps = {
  open: boolean;
  mode: BannerModalMode;
  formState: BannerFormState;
  errors: BannerFormErrors;
  selectedFile: File | null;
  previewUrl: string | null;
  editingBanner: AdminBanner | null;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onChange: (nextFormState: BannerFormState) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function BannerFormModal({
  open,
  mode,
  formState,
  errors,
  selectedFile,
  previewUrl,
  editingBanner,
  isSubmitting,
  fileInputRef,
  onClose,
  onChange,
  onFileChange,
  onClearFile,
  onSubmit,
}: BannerFormModalProps) {
  if (!open) {
    return null;
  }

  const title = mode === "create" ? "Thêm banner mới" : "Cập nhật banner";

  const description =
    mode === "create"
      ? "Upload ảnh banner và cấu hình vị trí hiển thị."
      : `Đang sửa banner #${editingBanner?.bannerId || ""}`;

  const currentImageUrl = previewUrl || editingBanner?.imageUrl || null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(94vw,820px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Banner Form
            </p>
            <h3 className="mt-1 text-xl font-bold text-on-surface">{title}</h3>
            <p className="mt-1 text-sm text-secondary">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng form"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="bannerFile"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Ảnh banner {mode === "create" ? <span className="text-red-500">*</span> : null}
            </label>

            <input
              ref={fileInputRef}
              id="bannerFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              disabled={isSubmitting}
              className={`block w-full cursor-pointer rounded-2xl border bg-white px-4 py-3 text-sm text-secondary file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-on-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.file ? "border-red-300" : "border-surface-container-high"
              }`}
            />

            {errors.file ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {errors.file}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-secondary">
                Chỉ nên upload JPEG, PNG, WEBP. BE giới hạn khoảng 5MB/file.
              </p>
            )}
          </div>

          {currentImageUrl ? (
            <div className="overflow-hidden rounded-[22px] border border-surface-container-high bg-surface-container-lowest">
              <div className="aspect-[21/7] bg-white">
                <img
                  src={currentImageUrl}
                  alt="Preview banner"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-surface-container-high bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="truncate text-sm font-semibold text-on-surface">
                  {selectedFile
                    ? selectedFile.name
                    : "Ảnh banner hiện tại"}
                </p>

                {selectedFile ? (
                  <button
                    type="button"
                    onClick={onClearFile}
                    disabled={isSubmitting}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-surface-container-high px-3 text-xs font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Bỏ ảnh đã chọn
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="bannerTitle"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Tiêu đề
            </label>

            <input
              id="bannerTitle"
              type="text"
              value={formState.title}
              onChange={(event) =>
                onChange({
                  ...formState,
                  title: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: Sale iPhone cuối tuần"
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label
              htmlFor="bannerTargetUrl"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Link điều hướng
            </label>

            <input
              id="bannerTargetUrl"
              type="text"
              value={formState.targetUrl}
              onChange={(event) =>
                onChange({
                  ...formState,
                  targetUrl: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: /iphone hoặc https://..."
              className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                errors.targetUrl
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-surface-container-high focus:border-primary focus:ring-primary/10"
              }`}
            />

            {errors.targetUrl ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {errors.targetUrl}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="bannerPosition"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Vị trí hiển thị <span className="text-red-500">*</span>
              </label>

              <input
                id="bannerPosition"
                type="text"
                list="banner-position-options"
                value={formState.position}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    position: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="home-hero"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                  errors.position
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              <datalist id="banner-position-options">
                {BANNER_POSITION_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </datalist>

              {errors.position ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.position}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-secondary">
                  Ví dụ: home-hero, home-sale, category-hero.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Trạng thái
              </label>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  onChange({
                    ...formState,
                    isActive: !formState.isActive,
                  })
                }
                className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  formState.isActive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <span>{formState.isActive ? "Đang hiển thị" : "Đã ẩn"}</span>
                <span className="material-symbols-outlined text-xl">
                  {formState.isActive ? "toggle_on" : "toggle_off"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 rounded-2xl border border-surface-container-high px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
                  {mode === "create" ? "Thêm banner" : "Lưu thay đổi"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteBannerModalProps = {
  banner: AdminBanner | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteBannerModal({
  banner,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteBannerModalProps) {
  if (!banner) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(92vw,540px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <span className="material-symbols-outlined text-2xl">
                delete
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold leading-7 text-on-surface">
                Xóa mềm banner?
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Banner{" "}
                <span className="font-semibold text-on-surface">
                  #{banner.bannerId}
                </span>{" "}
                sẽ được chuyển sang trạng thái không hoạt động.
              </p>

              <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-lg text-yellow-700">
                    warning
                  </span>

                  <p className="min-w-0 text-sm leading-6 text-yellow-800">
                    Xóa mềm chỉ ẩn banner khỏi hiển thị. Dữ liệu banner vẫn còn
                    trong database để quản trị lịch sử.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high bg-surface-container-lowest p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                Đang xóa...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  delete
                </span>
                Xác nhận xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBannerPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [positionFilter, setPositionFilter] = useState("all");
  const [statusFilter, setStatusFilter] =
    useState<AdminBannerStatusFilter>("all");

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<BannerModalMode>("create");
  const [editingBanner, setEditingBanner] = useState<AdminBanner | null>(null);
  const [formState, setFormState] = useState<BannerFormState>(
    getEmptyFormState
  );
  const [formErrors, setFormErrors] = useState<BannerFormErrors>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingBanner, setDeletingBanner] = useState<AdminBanner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toasts, setToasts] = useState<BannerToast[]>([]);

  const activeCount = useMemo(() => {
    return banners.filter((banner) => banner.isActive).length;
  }, [banners]);

  const inactiveCount = banners.length - activeCount;

  const positionOptions = useMemo(() => {
    const positions = new Set<string>();

    banners.forEach((banner) => {
      if (banner.position) {
        positions.add(banner.position);
      }
    });

    BANNER_POSITION_OPTIONS.forEach((item) => {
      positions.add(item.value);
    });

    return Array.from(positions);
  }, [banners]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: BannerToastVariant,
    title: string,
    description?: string
  ) {
    const id = Date.now() + Math.random();

    setToasts((current) => [
      {
        id,
        variant,
        title,
        description,
      },
      ...current.slice(0, 2),
    ]);

    window.setTimeout(() => {
      closeToast(id);
    }, 3500);
  }

  const fetchBanners = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminBanners(adminAccessToken, {
        position: positionFilter === "all" ? undefined : positionFilter,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "true",
      });

      setBanners(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách banner.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, positionFilter, statusFilter]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearSelectedFile() {
    setSelectedFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFormErrors((current) => ({
      ...current,
      file: undefined,
    }));

    event.target.value = "";
  }

  function openCreateModal() {
    clearSelectedFile();
    setModalMode("create");
    setEditingBanner(null);
    setFormState(getEmptyFormState());
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(banner: AdminBanner) {
    clearSelectedFile();
    setModalMode("edit");
    setEditingBanner(banner);
    setFormState(mapBannerToFormState(banner));
    setFormErrors({});
    setModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) {
      return;
    }

    setModalOpen(false);
    setEditingBanner(null);
    setFormErrors({});
    clearSelectedFile();
  }

  async function handleSubmitBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      showToast("error", "Chưa có token Admin", "Vui lòng đăng nhập lại.");
      return;
    }

    const nextErrors = validateBannerForm(
      formState,
      selectedFile,
      modalMode
    );

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast(
        "error",
        "Dữ liệu banner chưa hợp lệ",
        "Vui lòng kiểm tra lại ảnh, vị trí hoặc link điều hướng."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        file: selectedFile || undefined,
        title: normalizeOptionalText(formState.title),
        targetUrl: normalizeOptionalText(formState.targetUrl),
        position: normalizeOptionalText(formState.position),
        isActive: formState.isActive,
      };

      if (modalMode === "create") {
        if (!selectedFile) {
          throw new Error("Vui lòng chọn ảnh banner.");
        }

        await createAdminBanner(adminAccessToken, {
          ...payload,
          file: selectedFile,
        });

        showToast(
          "success",
          "Thêm banner thành công",
          "Banner mới đã được upload và lưu vào hệ thống."
        );
      } else {
        if (!editingBanner) {
          throw new Error("Không tìm thấy banner cần cập nhật.");
        }

        await updateAdminBanner(
          adminAccessToken,
          editingBanner.bannerId,
          payload
        );

        showToast(
          "success",
          "Cập nhật banner thành công",
          "Thông tin banner đã được thay đổi."
        );
      }

      setModalOpen(false);
      setEditingBanner(null);
      clearSelectedFile();
      await fetchBanners();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu banner.";

      showToast("error", "Lưu banner thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDeleteBanner() {
    if (!adminAccessToken || !deletingBanner) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteAdminBanner(
        adminAccessToken,
        deletingBanner.bannerId,
        false
      );

      showToast(
        "success",
        "Xóa mềm banner thành công",
        "Banner đã được chuyển sang trạng thái không hoạt động."
      );

      setDeletingBanner(null);
      await fetchBanners();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa banner.";

      showToast("error", "Xóa banner thất bại", message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <BannerToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Banner
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý banner
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              Quản lý banner hiển thị ở Home, Category hoặc các khu vực bán
              hàng. Banner active sẽ được API public trả về cho giao diện khách
              hàng.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Thêm banner
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Tổng banner theo lọc
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {banners.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Đang hiển thị
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Đã ẩn
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {inactiveCount}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-surface-container-high bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[220px_180px_auto]">
          <select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả vị trí</option>

            {positionOptions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as AdminBannerStatusFilter)
            }
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang hiển thị</option>
            <option value="false">Đã ẩn</option>
          </select>

          <button
            type="button"
            onClick={fetchBanners}
            disabled={isFetching}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 md:w-fit"
          >
            <span
              className={`material-symbols-outlined text-xl ${
                isFetching ? "animate-spin" : ""
              }`}
            >
              {isFetching ? "progress_activity" : "refresh"}
            </span>
            Làm mới
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách banner
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Hiển thị {banners.length} banner theo bộ lọc hiện tại.
            </p>
          </div>
        </div>

        {fetchError ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {fetchError}
          </div>
        ) : null}

        {isFetching ? (
          <div className="flex items-center justify-center p-10">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined animate-spin text-xl text-primary">
                progress_activity
              </span>
              Đang tải banner...
            </div>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
              <span className="material-symbols-outlined text-2xl">
                panorama
              </span>
            </div>

            <p className="mt-3 font-bold text-on-surface">
              Chưa có banner phù hợp
            </p>

            <p className="mt-1 text-sm text-secondary">
              Hãy thêm banner mới hoặc đổi bộ lọc.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 xl:grid-cols-2">
            {banners.map((banner) => (
              <article
                key={banner.bannerId}
                className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm"
              >
                <div className="relative aspect-[21/7] bg-surface-container-lowest">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || `Banner #${banner.bannerId}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-4xl">
                        broken_image
                      </span>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        banner.isActive
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>

                    {banner.position ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-on-surface shadow-sm">
                        {banner.position}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      #{banner.bannerId} · {banner.title || "Chưa có tiêu đề"}
                    </p>

                    <p className="mt-1 text-sm text-secondary">
                      Target: {banner.targetUrl || "Không có link"}
                    </p>

                    {banner.cloudinaryPublicId ? (
                      <p className="mt-1 line-clamp-2 break-all text-xs leading-5 text-secondary">
                        Public ID: {banner.cloudinaryPublicId}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => openEditModal(banner)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-lg">
                        edit
                      </span>
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingBanner(banner)}
                      disabled={!banner.isActive}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                      Xóa mềm
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <BannerFormModal
        open={modalOpen}
        mode={modalMode}
        formState={formState}
        errors={formErrors}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        editingBanner={editingBanner}
        isSubmitting={isSubmitting}
        fileInputRef={fileInputRef}
        onClose={closeFormModal}
        onChange={setFormState}
        onFileChange={handleFileChange}
        onClearFile={clearSelectedFile}
        onSubmit={handleSubmitBanner}
      />

      <DeleteBannerModal
        banner={deletingBanner}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingBanner(null);
          }
        }}
        onConfirm={handleConfirmDeleteBanner}
      />
    </div>
  );
}