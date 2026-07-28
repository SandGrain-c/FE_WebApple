// src/components/admin/categories/AdminCategoryPageClient.tsx

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "@/services/admin-category.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminCategory,
  AdminCategoryListResponseData,
  AdminCategorySort,
  AdminCategoryStatusFilter,
} from "@/types/admin-category.type";

type CategoryFormState = {
  categoryName: string;
  slug: string;
  description: string;
  displayOrder: string;
  isActive: boolean;
};

type CategoryFormErrors = {
  categoryName?: string;
  slug?: string;
  displayOrder?: string;
};

type CategoryModalMode = "create" | "edit";

type CategoryToastVariant = "success" | "error" | "info";

type CategoryToast = {
  id: number;
  variant: CategoryToastVariant;
  title: string;
  description?: string;
};

const DEFAULT_LIMIT = 10;

const SORT_OPTIONS: {
  label: string;
  value: AdminCategorySort;
}[] = [
  {
    label: "Mới nhất",
    value: "newest",
  },
  {
    label: "Cũ nhất",
    value: "oldest",
  },
  {
    label: "Tên A-Z",
    value: "name_asc",
  },
  {
    label: "Tên Z-A",
    value: "name_desc",
  },
  {
    label: "Thứ tự tăng dần",
    value: "display_order_asc",
  },
  {
    label: "Thứ tự giảm dần",
    value: "display_order_desc",
  },
];

function getEmptyFormState(): CategoryFormState {
  return {
    categoryName: "",
    slug: "",
    description: "",
    displayOrder: "0",
    isActive: true,
  };
}

function mapCategoryToFormState(category: AdminCategory): CategoryFormState {
  return {
    categoryName: category.categoryName,
    slug: category.slug,
    description: category.description || "",
    displayOrder: String(category.displayOrder ?? 0),
    isActive: category.isActive,
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function validateCategoryForm(
  formState: CategoryFormState
): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  const categoryName = formState.categoryName.trim();
  const slug = formState.slug.trim();
  const displayOrder = Number(formState.displayOrder);

  if (!categoryName) {
    errors.categoryName = "Vui lòng nhập tên danh mục.";
  } else if (categoryName.length < 2) {
    errors.categoryName = "Tên danh mục cần có ít nhất 2 ký tự.";
  }

  /**
   * Slug không bắt buộc vì BE có thể tự tạo từ categoryName.
   * Nếu nhập slug thủ công thì kiểm tra cơ bản để tránh ký tự lạ.
   */
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      "Slug chỉ nên gồm chữ thường, số và dấu gạch ngang. Ví dụ: macbook-pro.";
  }

  if (Number.isNaN(displayOrder)) {
    errors.displayOrder = "Thứ tự hiển thị phải là số.";
  } else if (displayOrder < 0) {
    errors.displayOrder = "Thứ tự hiển thị không được âm.";
  }

  return errors;
}

function buildCategoryPayload(formState: CategoryFormState) {
  return {
    categoryName: formState.categoryName.trim(),
    slug: normalizeOptionalText(formState.slug),
    description: normalizeOptionalText(formState.description),
    displayOrder: Number(formState.displayOrder || 0),
    isActive: formState.isActive,
  };
}

type CategoryToastStackProps = {
  toasts: CategoryToast[];
  onClose: (id: number) => void;
};

function CategoryToastStack({ toasts, onClose }: CategoryToastStackProps) {
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

type CategoryFormModalProps = {
  open: boolean;
  mode: CategoryModalMode;
  formState: CategoryFormState;
  errors: CategoryFormErrors;
  isSubmitting: boolean;
  editingCategory: AdminCategory | null;
  onClose: () => void;
  onChange: (nextFormState: CategoryFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CategoryFormModal({
  open,
  mode,
  formState,
  errors,
  isSubmitting,
  editingCategory,
  onClose,
  onChange,
  onSubmit,
}: CategoryFormModalProps) {
  if (!open) {
    return null;
  }

  const title =
    mode === "create" ? "Thêm danh mục mới" : "Cập nhật danh mục";

  const description =
    mode === "create"
      ? "Tạo danh mục để dùng khi thêm sản phẩm cha."
      : `Đang sửa: ${editingCategory?.categoryName || ""}`;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/35 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.2)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Category Form
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
              htmlFor="categoryName"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Tên danh mục <span className="text-red-500">*</span>
            </label>

            <input
              id="categoryName"
              type="text"
              value={formState.categoryName}
              onChange={(event) =>
                onChange({
                  ...formState,
                  categoryName: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: iPhone"
              className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                errors.categoryName
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-surface-container-high focus:border-primary focus:ring-primary/10"
              }`}
            />

            {errors.categoryName ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {errors.categoryName}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="slug"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Slug
            </label>

            <input
              id="slug"
              type="text"
              value={formState.slug}
              onChange={(event) =>
                onChange({
                  ...formState,
                  slug: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Bỏ trống để BE tự tạo, ví dụ: iphone"
              className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                errors.slug
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-surface-container-high focus:border-primary focus:ring-primary/10"
              }`}
            />

            {errors.slug ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {errors.slug}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-secondary">
                Slug là đường dẫn thân thiện. Ví dụ:{" "}
                <span className="font-semibold">macbook-pro</span>.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Mô tả
            </label>

            <textarea
              id="description"
              value={formState.description}
              onChange={(event) =>
                onChange({
                  ...formState,
                  description: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Mô tả ngắn về danh mục..."
              rows={4}
              className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="displayOrder"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Thứ tự hiển thị
              </label>

              <input
                id="displayOrder"
                type="number"
                min={0}
                value={formState.displayOrder}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    displayOrder: event.target.value,
                  })
                }
                disabled={isSubmitting}
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                  errors.displayOrder
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.displayOrder ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.displayOrder}
                </p>
              ) : null}
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
                  {mode === "create" ? "Thêm danh mục" : "Lưu thay đổi"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteConfirmModalProps = {
  category: AdminCategory | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteConfirmModal({
  category,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!category) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/45 px-4 py-6">
      {/* Modal xác nhận xóa mềm danh mục */}
      <div className="w-[min(92vw,520px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <span className="material-symbols-outlined text-2xl">
                delete
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold leading-7 text-on-surface">
                Xóa mềm danh mục?
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Danh mục{" "}
                <span className="font-semibold text-on-surface">
                  {category.categoryName}
                </span>{" "}
                sẽ được chuyển sang trạng thái không hoạt động.
              </p>

              {category.totalProducts > 0 ? (
                <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-lg text-yellow-700">
                      warning
                    </span>

                    <p className="min-w-0 text-sm leading-6 text-yellow-800">
                      Danh mục này đang có{" "}
                      <span className="font-bold">
                        {category.totalProducts}
                      </span>{" "}
                      sản phẩm liên quan. BE sẽ xóa mềm để tránh mất lịch sử dữ
                      liệu.
                    </p>
                  </div>
                </div>
              ) : null}
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

export default function AdminCategoryPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [categoryData, setCategoryData] =
    useState<AdminCategoryListResponseData | null>(null);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminCategoryStatusFilter>("all");
  const [sort, setSort] = useState<AdminCategorySort>("display_order_asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<CategoryModalMode>("create");
  const [editingCategory, setEditingCategory] =
    useState<AdminCategory | null>(null);
  const [formState, setFormState] =
    useState<CategoryFormState>(getEmptyFormState);
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingCategory, setDeletingCategory] =
    useState<AdminCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toasts, setToasts] = useState<CategoryToast[]>([]);

  const categories = categoryData?.items || [];
  const pagination = categoryData?.pagination;

  const activeCount = useMemo(() => {
    return categories.filter((category) => category.isActive).length;
  }, [categories]);

  const inactiveCount = categories.length - activeCount;

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: CategoryToastVariant,
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

  const fetchCategories = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminCategories(adminAccessToken, {
        search,
        page,
        limit,
        sort,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "true",
      });

      setCategoryData(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách danh mục.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, search, page, limit, sort, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function handleResetFilter() {
    setSearchDraft("");
    setSearch("");
    setStatusFilter("all");
    setSort("display_order_asc");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingCategory(null);
    setFormState(getEmptyFormState());
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(category: AdminCategory) {
    setModalMode("edit");
    setEditingCategory(category);
    setFormState(mapCategoryToFormState(category));
    setFormErrors({});
    setModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) {
      return;
    }

    setModalOpen(false);
    setEditingCategory(null);
    setFormErrors({});
  }

  async function handleSubmitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      showToast("error", "Chưa có token Admin", "Vui lòng đăng nhập lại.");
      return;
    }

    const nextErrors = validateCategoryForm(formState);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast(
        "error",
        "Dữ liệu chưa hợp lệ",
        "Vui lòng kiểm tra lại các trường trong form."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = buildCategoryPayload(formState);

      if (modalMode === "create") {
        await createAdminCategory(adminAccessToken, payload);

        showToast(
          "success",
          "Thêm danh mục thành công",
          "Danh mục mới đã được lưu vào hệ thống."
        );
      } else {
        if (!editingCategory) {
          throw new Error("Không tìm thấy danh mục cần cập nhật.");
        }

        await updateAdminCategory(
          adminAccessToken,
          editingCategory.categoryId,
          payload
        );

        showToast(
          "success",
          "Cập nhật danh mục thành công",
          "Thông tin danh mục đã được thay đổi."
        );
      }

      setModalOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu danh mục.";

      showToast("error", "Lưu danh mục thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!adminAccessToken || !deletingCategory) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteAdminCategory(adminAccessToken, deletingCategory.categoryId);

      showToast(
        "success",
        "Xóa mềm danh mục thành công",
        "Danh mục đã được chuyển sang trạng thái không hoạt động."
      );

      setDeletingCategory(null);
      await fetchCategories();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa danh mục.";

      showToast("error", "Xóa danh mục thất bại", message);
    } finally {
      setIsDeleting(false);
    }
  }

  function goToPreviousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    if (!pagination) {
      return;
    }

    setPage((current) => Math.min(pagination.totalPages, current + 1));
  }

  return (
    <div className="space-y-6">
      <CategoryToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Category
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý danh mục
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              Quản lý nhóm sản phẩm như iPhone, iPad, MacBook, Apple Watch,
              AirPods. Danh mục là dữ liệu nền để tạo sản phẩm.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Thêm danh mục
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Tổng bản ghi trang này
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {categories.length}
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
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 lg:grid-cols-[1fr_170px_220px_120px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>
            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm theo tên hoặc slug..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AdminCategoryStatusFilter);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang hiển thị</option>
            <option value="false">Đã ẩn</option>
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as AdminCategorySort);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value={5}>5/trang</option>
            <option value={10}>10/trang</option>
            <option value={20}>20/trang</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              <span className="material-symbols-outlined text-xl">search</span>
              Tìm
            </button>

            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">restart_alt</span>
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách danh mục
            </h3>

            {pagination ? (
              <p className="mt-1 text-sm text-secondary">
                Tổng {pagination.totalItems} danh mục · Trang {pagination.page}/
                {pagination.totalPages || 1}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={fetchCategories}
            disabled={isFetching}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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

        {fetchError ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {fetchError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">Danh mục</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Thứ tự</th>
                <th className="px-4 py-3 font-bold">Sản phẩm</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined animate-spin text-xl text-primary">
                        progress_activity
                      </span>
                      Đang tải danh mục...
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          category
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có danh mục phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy thử đổi bộ lọc hoặc thêm danh mục mới.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.categoryId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4 text-sm font-semibold text-secondary">
                      #{category.categoryId}
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        <p className="font-bold text-on-surface">
                          {category.categoryName}
                        </p>

                        <p className="mt-1 line-clamp-2 max-w-[320px] text-sm leading-5 text-secondary">
                          {category.description || "Chưa có mô tả"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-xl bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-secondary">
                        {category.slug}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-on-surface">
                      {category.displayOrder}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-on-surface">
                      {category.totalProducts}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          category.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {category.isActive ? "Đang hiển thị" : "Đã ẩn"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingCategory(category)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-surface-container-high p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">
            {pagination
              ? `Hiển thị ${categories.length} / ${pagination.totalItems} danh mục`
              : "Chưa có dữ liệu phân trang"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={!pagination || page <= 1 || isFetching}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
              Trước
            </button>

            <span className="rounded-2xl bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface">
              {pagination?.page || page}/{pagination?.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={
                !pagination ||
                page >= pagination.totalPages ||
                isFetching ||
                pagination.totalPages === 0
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
              <span className="material-symbols-outlined text-lg">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </section>

      <CategoryFormModal
        open={modalOpen}
        mode={modalMode}
        formState={formState}
        errors={formErrors}
        isSubmitting={isSubmitting}
        editingCategory={editingCategory}
        onClose={closeFormModal}
        onChange={setFormState}
        onSubmit={handleSubmitCategory}
      />

      <DeleteConfirmModal
        category={deletingCategory}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingCategory(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}