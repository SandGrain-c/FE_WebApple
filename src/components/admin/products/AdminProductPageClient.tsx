// src/components/admin/products/AdminProductPageClient.tsx

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { getAdminCategories } from "@/services/admin-category.service";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
} from "@/services/admin-product.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type { AdminCategory } from "@/types/admin-category.type";
import type {
  AdminProduct,
  AdminProductListResponseData,
  AdminProductSort,
  AdminProductStatusFilter,
} from "@/types/admin-product.type";

type ProductFormState = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

type ProductFormErrors = {
  categoryId?: string;
  name?: string;
  slug?: string;
};

type ProductModalMode = "create" | "edit";

type ProductToastVariant = "success" | "error" | "info";

type ProductToast = {
  id: number;
  variant: ProductToastVariant;
  title: string;
  description?: string;
};

const DEFAULT_LIMIT = 10;

const SORT_OPTIONS: {
  label: string;
  value: AdminProductSort;
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
];

function getEmptyFormState(): ProductFormState {
  return {
    categoryId: "",
    name: "",
    slug: "",
    description: "",
    isActive: true,
  };
}

function mapProductToFormState(product: AdminProduct): ProductFormState {
  return {
    categoryId: String(product.categoryId),
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    isActive: product.isActive,
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function validateProductForm(formState: ProductFormState): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const categoryId = Number(formState.categoryId);
  const name = formState.name.trim();
  const slug = formState.slug.trim();

  if (!categoryId || Number.isNaN(categoryId)) {
    errors.categoryId = "Vui lòng chọn danh mục.";
  }

  if (!name) {
    errors.name = "Vui lòng nhập tên sản phẩm.";
  } else if (name.length < 2) {
    errors.name = "Tên sản phẩm cần có ít nhất 2 ký tự.";
  }

  /**
   * Slug không bắt buộc vì BE có thể tự tạo.
   * Nếu admin nhập thủ công thì kiểm tra định dạng cơ bản.
   */
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      "Slug chỉ nên gồm chữ thường, số và dấu gạch ngang. Ví dụ: iphone-16-pro-max.";
  }

  return errors;
}

function buildProductPayload(formState: ProductFormState) {
  return {
    categoryId: Number(formState.categoryId),
    name: formState.name.trim(),
    slug: normalizeOptionalText(formState.slug),
    description: normalizeOptionalText(formState.description),
    isActive: formState.isActive,
  };
}

type ProductToastStackProps = {
  toasts: ProductToast[];
  onClose: (id: number) => void;
};

function ProductToastStack({ toasts, onClose }: ProductToastStackProps) {
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

type ProductFormModalProps = {
  open: boolean;
  mode: ProductModalMode;
  formState: ProductFormState;
  errors: ProductFormErrors;
  categories: AdminCategory[];
  isSubmitting: boolean;
  editingProduct: AdminProduct | null;
  onClose: () => void;
  onChange: (nextFormState: ProductFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ProductFormModal({
  open,
  mode,
  formState,
  errors,
  categories,
  isSubmitting,
  editingProduct,
  onClose,
  onChange,
  onSubmit,
}: ProductFormModalProps) {
  if (!open) {
    return null;
  }

  const title = mode === "create" ? "Thêm sản phẩm mới" : "Cập nhật sản phẩm";

  const description =
    mode === "create"
      ? "Tạo product cha trước, sau đó mới quản lý variant và ảnh."
      : `Đang sửa: ${editingProduct?.name || ""}`;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(94vw,760px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Product Form
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
              htmlFor="productCategoryId"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Danh mục <span className="text-red-500">*</span>
            </label>

            <select
              id="productCategoryId"
              value={formState.categoryId}
              onChange={(event) =>
                onChange({
                  ...formState,
                  categoryId: event.target.value,
                })
              }
              disabled={isSubmitting}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition focus:ring-4 ${
                errors.categoryId
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-surface-container-high focus:border-primary focus:ring-primary/10"
              }`}
            >
              <option value="">Chọn danh mục</option>

              {categories.map((category) => (
                <option
                  key={category.categoryId}
                  value={category.categoryId}
                  disabled={!category.isActive}
                >
                  {category.categoryName}
                  {!category.isActive ? " (đã ẩn)" : ""}
                </option>
              ))}
            </select>

            {errors.categoryId ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {errors.categoryId}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="productName"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>

            <input
              id="productName"
              type="text"
              value={formState.name}
              onChange={(event) =>
                onChange({
                  ...formState,
                  name: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: iPhone 16 Pro Max"
              className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                errors.name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-surface-container-high focus:border-primary focus:ring-primary/10"
              }`}
            />

            {errors.name ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="productSlug"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Slug
            </label>

            <input
              id="productSlug"
              type="text"
              value={formState.slug}
              onChange={(event) =>
                onChange({
                  ...formState,
                  slug: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Bỏ trống để BE tự tạo, ví dụ: iphone-16-pro-max"
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
                Slug dùng cho URL sản phẩm. Ví dụ:{" "}
                <span className="font-semibold">iphone-16-pro-max</span>.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="productDescription"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Mô tả
            </label>

            <textarea
              id="productDescription"
              value={formState.description}
              onChange={(event) =>
                onChange({
                  ...formState,
                  description: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Mô tả chung về sản phẩm..."
              rows={5}
              className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
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
                  {mode === "create" ? "Thêm sản phẩm" : "Lưu thay đổi"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteProductModalProps = {
  product: AdminProduct | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteProductModal({
  product,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteProductModalProps) {
  if (!product) {
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
                Xóa mềm sản phẩm?
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Sản phẩm{" "}
                <span className="font-semibold text-on-surface">
                  {product.name}
                </span>{" "}
                sẽ được chuyển sang trạng thái không hoạt động.
              </p>

              {(product.totalVariants > 0 || product.totalImages > 0) && (
                <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-lg text-yellow-700">
                      warning
                    </span>

                    <p className="min-w-0 text-sm leading-6 text-yellow-800">
                      Sản phẩm này có{" "}
                      <span className="font-bold">
                        {product.totalVariants}
                      </span>{" "}
                      biến thể và{" "}
                      <span className="font-bold">{product.totalImages}</span>{" "}
                      ảnh. BE sẽ xóa mềm để tránh mất lịch sử dữ liệu.
                    </p>
                  </div>
                </div>
              )}
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

export default function AdminProductPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [productData, setProductData] =
    useState<AdminProductListResponseData | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [categoryIdFilter, setCategoryIdFilter] = useState("all");
  const [statusFilter, setStatusFilter] =
    useState<AdminProductStatusFilter>("all");
  const [sort, setSort] = useState<AdminProductSort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [categoryFetchError, setCategoryFetchError] = useState<string | null>(
    null
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ProductModalMode>("create");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null
  );
  const [formState, setFormState] =
    useState<ProductFormState>(getEmptyFormState);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [toasts, setToasts] = useState<ProductToast[]>([]);

  const products = productData?.items || [];
  const pagination = productData?.pagination;

  const activeCount = useMemo(() => {
    return products.filter((product) => product.isActive).length;
  }, [products]);

  const inactiveCount = products.length - activeCount;

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: ProductToastVariant,
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

  const fetchProducts = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminProducts(adminAccessToken, {
        search,
        page,
        limit,
        sort,
        categoryId:
          categoryIdFilter === "all" ? undefined : Number(categoryIdFilter),
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "true",
      });

      setProductData(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách sản phẩm.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [
    adminAccessToken,
    search,
    page,
    limit,
    sort,
    categoryIdFilter,
    statusFilter,
  ]);

  const fetchCategories = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setCategoryFetchError(null);

      const data = await getAdminCategories(adminAccessToken, {
        page: 1,
        limit: 100,
        sort: "display_order_asc",
      });

      setCategories(data.items);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh mục sản phẩm.";

      setCategoryFetchError(message);
    }
  }, [adminAccessToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    setCategoryIdFilter("all");
    setStatusFilter("all");
    setSort("newest");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingProduct(null);
    setFormState(getEmptyFormState());
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(product: AdminProduct) {
    setModalMode("edit");
    setEditingProduct(product);
    setFormState(mapProductToFormState(product));
    setFormErrors({});
    setModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) {
      return;
    }

    setModalOpen(false);
    setEditingProduct(null);
    setFormErrors({});
  }

  async function handleSubmitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      showToast("error", "Chưa có token Admin", "Vui lòng đăng nhập lại.");
      return;
    }

    const nextErrors = validateProductForm(formState);
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

      const payload = buildProductPayload(formState);

      if (modalMode === "create") {
        await createAdminProduct(adminAccessToken, payload);

        showToast(
          "success",
          "Thêm sản phẩm thành công",
          "Product cha đã được tạo. Bước tiếp theo là thêm variant."
        );
      } else {
        if (!editingProduct) {
          throw new Error("Không tìm thấy sản phẩm cần cập nhật.");
        }

        await updateAdminProduct(
          adminAccessToken,
          editingProduct.productId,
          payload
        );

        showToast(
          "success",
          "Cập nhật sản phẩm thành công",
          "Thông tin product cha đã được thay đổi."
        );
      }

      setModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu sản phẩm.";

      showToast("error", "Lưu sản phẩm thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!adminAccessToken || !deletingProduct) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteAdminProduct(adminAccessToken, deletingProduct.productId);

      showToast(
        "success",
        "Xóa mềm sản phẩm thành công",
        "Sản phẩm đã được chuyển sang trạng thái không hoạt động."
      );

      setDeletingProduct(null);
      await fetchProducts();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa sản phẩm.";

      showToast("error", "Xóa sản phẩm thất bại", message);
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
      <ProductToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Product
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý sản phẩm
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              Quản lý product cha như iPhone 16 Pro Max, MacBook Air M3. Giá,
              màu, dung lượng và tồn kho sẽ được quản lý ở bước Variant.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Thêm sản phẩm
          </button>
        </div>

        {categoryFetchError ? (
          <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
            Không tải được danh mục để chọn khi thêm/sửa sản phẩm:{" "}
            {categoryFetchError}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Tổng bản ghi trang này
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {products.length}
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
          className="grid gap-3 xl:grid-cols-[1fr_180px_170px_160px_120px_auto]"
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
            value={categoryIdFilter}
            onChange={(event) => {
              setCategoryIdFilter(event.target.value);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả danh mục</option>

            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.categoryName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AdminProductStatusFilter);
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
              setSort(event.target.value as AdminProductSort);
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
              aria-label="Reset bộ lọc"
            >
              <span className="material-symbols-outlined text-xl">
                restart_alt
              </span>
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách sản phẩm
            </h3>

            {pagination ? (
              <p className="mt-1 text-sm text-secondary">
                Tổng {pagination.totalItems} sản phẩm · Trang {pagination.page}/
                {pagination.totalPages || 1}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={fetchProducts}
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
          <table className="w-full min-w-[1080px] text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">Sản phẩm</th>
                <th className="px-4 py-3 font-bold">Danh mục</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Variant</th>
                <th className="px-4 py-3 font-bold">Ảnh</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined animate-spin text-xl text-primary">
                        progress_activity
                      </span>
                      Đang tải sản phẩm...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          inventory_2
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có sản phẩm phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy thử đổi bộ lọc hoặc thêm product cha mới.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.productId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4 text-sm font-semibold text-secondary">
                      #{product.productId}
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        <p className="font-bold text-on-surface">
                          {product.name}
                        </p>

                        <p className="mt-1 max-w-[360px] text-sm leading-5 text-secondary">
                          {product.description || "Chưa có mô tả"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-xl bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-secondary">
                        {product.categoryName}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-xl bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-secondary">
                        {product.slug}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-on-surface">
                      {product.totalVariants}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-on-surface">
                      {product.totalImages}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          product.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {product.isActive ? "Đang hiển thị" : "Đã ẩn"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.productId}`}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                          Chi tiết
                        </Link>

                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingProduct(product)}
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
              ? `Hiển thị ${products.length} / ${pagination.totalItems} sản phẩm`
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

      <ProductFormModal
        open={modalOpen}
        mode={modalMode}
        formState={formState}
        errors={formErrors}
        categories={categories}
        isSubmitting={isSubmitting}
        editingProduct={editingProduct}
        onClose={closeFormModal}
        onChange={setFormState}
        onSubmit={handleSubmitProduct}
      />

      <DeleteProductModal
        product={deletingProduct}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingProduct(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}