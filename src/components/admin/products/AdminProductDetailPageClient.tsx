// src/components/admin/products/AdminProductDetailPageClient.tsx

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { getAdminProductById } from "@/services/admin-product.service";
import {
  createAdminVariant,
  deleteAdminVariant,
  getAdminProductVariants,
  updateAdminVariant,
} from "@/services/admin-variant.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type { AdminProduct } from "@/types/admin-product.type";
import type { AdminVariant } from "@/types/admin-variant.type";
import AdminProductImageManager from "@/components/admin/product-images/AdminProductImageManager";
type AdminProductDetailPageClientProps = {
  productId: number;
};

type VariantFormState = {
  variantName: string;
  sku: string;
  color: string;
  capacity: string;
  ram: string;
  country: string;
  price: string;
  oldPrice: string;
  installment: string;
  discountLabel: string;
  stockQuantity: string;
};

type VariantFormErrors = {
  sku?: string;
  price?: string;
  oldPrice?: string;
  stockQuantity?: string;
};

type VariantModalMode = "create" | "edit";

type VariantToastVariant = "success" | "error" | "info";

type VariantToast = {
  id: number;
  variant: VariantToastVariant;
  title: string;
  description?: string;
};

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function normalizeOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return Number(trimmedValue);
}

function getEmptyVariantFormState(): VariantFormState {
  return {
    variantName: "",
    sku: "",
    color: "",
    capacity: "",
    ram: "",
    country: "VN",
    price: "",
    oldPrice: "",
    installment: "",
    discountLabel: "",
    stockQuantity: "0",
  };
}

function mapVariantToFormState(variant: AdminVariant): VariantFormState {
  return {
    variantName: variant.variantName || "",
    sku: variant.sku,
    color: variant.color || "",
    capacity: variant.capacity || "",
    ram: variant.ram || "",
    country: variant.country || "",
    price: String(variant.price ?? ""),
    oldPrice: variant.oldPrice !== null ? String(variant.oldPrice) : "",
    installment: variant.installment || "",
    discountLabel: variant.discountLabel || "",
    stockQuantity: String(variant.stockQuantity ?? 0),
  };
}

function validateVariantForm(formState: VariantFormState): VariantFormErrors {
  const errors: VariantFormErrors = {};
  const sku = formState.sku.trim();
  const price = Number(formState.price);
  const oldPrice = normalizeOptionalNumber(formState.oldPrice);
  const stockQuantity = Number(formState.stockQuantity);

  if (!sku) {
    errors.sku = "Vui lòng nhập SKU.";
  } else if (sku.length < 3) {
    errors.sku = "SKU cần có ít nhất 3 ký tự.";
  }

  if (!formState.price.trim()) {
    errors.price = "Vui lòng nhập giá bán.";
  } else if (Number.isNaN(price)) {
    errors.price = "Giá bán phải là số.";
  } else if (price < 0) {
    errors.price = "Giá bán không được âm.";
  }

  if (typeof oldPrice === "number") {
    if (Number.isNaN(oldPrice)) {
      errors.oldPrice = "Giá cũ phải là số.";
    } else if (oldPrice < 0) {
      errors.oldPrice = "Giá cũ không được âm.";
    }
  }

  if (!formState.stockQuantity.trim()) {
    errors.stockQuantity = "Vui lòng nhập tồn kho.";
  } else if (Number.isNaN(stockQuantity)) {
    errors.stockQuantity = "Tồn kho phải là số.";
  } else if (stockQuantity < 0) {
    errors.stockQuantity = "Tồn kho không được âm.";
  }

  return errors;
}

function buildVariantPayload(formState: VariantFormState) {
  return {
    variantName: normalizeOptionalText(formState.variantName),
    sku: formState.sku.trim(),
    color: normalizeOptionalText(formState.color),
    capacity: normalizeOptionalText(formState.capacity),
    ram: normalizeOptionalText(formState.ram),
    country: normalizeOptionalText(formState.country),
    price: Number(formState.price),
    oldPrice: normalizeOptionalNumber(formState.oldPrice),
    installment: normalizeOptionalText(formState.installment),
    discountLabel: normalizeOptionalText(formState.discountLabel),
    stockQuantity: Number(formState.stockQuantity || 0),
  };
}

type VariantToastStackProps = {
  toasts: VariantToast[];
  onClose: (id: number) => void;
};

function VariantToastStack({ toasts, onClose }: VariantToastStackProps) {
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

type VariantFormModalProps = {
  open: boolean;
  mode: VariantModalMode;
  formState: VariantFormState;
  errors: VariantFormErrors;
  isSubmitting: boolean;
  editingVariant: AdminVariant | null;
  product: AdminProduct | null;
  onClose: () => void;
  onChange: (nextFormState: VariantFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function VariantFormModal({
  open,
  mode,
  formState,
  errors,
  isSubmitting,
  editingVariant,
  product,
  onClose,
  onChange,
  onSubmit,
}: VariantFormModalProps) {
  if (!open) {
    return null;
  }

  const title = mode === "create" ? "Thêm biến thể mới" : "Cập nhật biến thể";

  const description =
    mode === "create"
      ? `Tạo biến thể cho sản phẩm: ${product?.name || ""}`
      : `Đang sửa SKU: ${editingVariant?.sku || ""}`;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(94vw,860px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Variant Form
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
              htmlFor="variantName"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Tên biến thể
            </label>

            <input
              id="variantName"
              type="text"
              value={formState.variantName}
              onChange={(event) =>
                onChange({
                  ...formState,
                  variantName: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: iPhone 16 Pro Max 256GB Đen"
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label
              htmlFor="sku"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              SKU <span className="text-red-500">*</span>
            </label>

            <input
              id="sku"
              type="text"
              value={formState.sku}
              onChange={(event) =>
                onChange({
                  ...formState,
                  sku: event.target.value,
                })
              }
              disabled={isSubmitting || mode === "edit"}
              placeholder="Ví dụ: IP16PM-BLACK-256"
              className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${
                errors.sku
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-surface-container-high focus:border-primary focus:ring-primary/10"
              }`}
            />

            {mode === "edit" ? (
              <p className="mt-1.5 text-xs text-secondary">
                SKU là mã định danh quan trọng, không nên đổi sau khi đã tạo.
              </p>
            ) : null}

            {errors.sku ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {errors.sku}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label
                htmlFor="color"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Màu
              </label>

              <input
                id="color"
                type="text"
                value={formState.color}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    color: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Đen"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div>
              <label
                htmlFor="capacity"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Dung lượng
              </label>

              <input
                id="capacity"
                type="text"
                value={formState.capacity}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    capacity: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="256GB"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div>
              <label
                htmlFor="ram"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                RAM
              </label>

              <input
                id="ram"
                type="text"
                value={formState.ram}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    ram: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="8GB"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Quốc gia
              </label>

              <input
                id="country"
                type="text"
                value={formState.country}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    country: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="VN"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="price"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Giá bán <span className="text-red-500">*</span>
              </label>

              <input
                id="price"
                type="number"
                min={0}
                value={formState.price}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    price: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="34990000"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                  errors.price
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.price ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.price}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="oldPrice"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Giá cũ
              </label>

              <input
                id="oldPrice"
                type="number"
                min={0}
                value={formState.oldPrice}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    oldPrice: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="37990000"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                  errors.oldPrice
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.oldPrice ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.oldPrice}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="stockQuantity"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Tồn kho <span className="text-red-500">*</span>
              </label>

              <input
                id="stockQuantity"
                type="number"
                min={0}
                value={formState.stockQuantity}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    stockQuantity: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="12"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                  errors.stockQuantity
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.stockQuantity ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.stockQuantity}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="installment"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Trả góp
              </label>

              <input
                id="installment"
                type="text"
                value={formState.installment}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    installment: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Trả góp 0%"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div>
              <label
                htmlFor="discountLabel"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Nhãn giảm giá
              </label>

              <input
                id="discountLabel"
                type="text"
                value={formState.discountLabel}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    discountLabel: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Giảm 3 triệu"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
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
                  {mode === "create" ? "Thêm biến thể" : "Lưu thay đổi"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteVariantModalProps = {
  variant: AdminVariant | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteVariantModal({
  variant,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteVariantModalProps) {
  if (!variant) {
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
                Xóa biến thể?
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Biến thể có SKU{" "}
                <span className="font-semibold text-on-surface">
                  {variant.sku}
                </span>{" "}
                sẽ được xóa nếu chưa có dữ liệu liên quan.
              </p>

              <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-lg text-yellow-700">
                    warning
                  </span>

                  <p className="min-w-0 text-sm leading-6 text-yellow-800">
                    Nếu biến thể đã nằm trong đơn hàng, giỏ hàng, ảnh sản phẩm
                    hoặc dữ liệu kho, BE có thể chặn xóa. Khi đó nên cập nhật
                    tồn kho về 0 hoặc nâng cấp thêm isActive cho variant.
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

export default function AdminProductDetailPageClient({
  productId,
}: AdminProductDetailPageClientProps) {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  // Số ảnh thực tế lấy từ Product Image Manager
  const [imageCount, setImageCount] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<VariantModalMode>("create");
  const [editingVariant, setEditingVariant] = useState<AdminVariant | null>(
    null
  );
  const [formState, setFormState] = useState<VariantFormState>(
    getEmptyVariantFormState
  );
  const [formErrors, setFormErrors] = useState<VariantFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingVariant, setDeletingVariant] = useState<AdminVariant | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [toasts, setToasts] = useState<VariantToast[]>([]);

  const totalStock = useMemo(() => {
    return variants.reduce((total, variant) => {
      return total + Number(variant.stockQuantity || 0);
    }, 0);
  }, [variants]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: VariantToastVariant,
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

  const fetchProductDetail = useCallback(async () => {
    if (!adminAccessToken || !productId) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const [productData, variantData] = await Promise.all([
        getAdminProductById(adminAccessToken, productId),
        getAdminProductVariants(adminAccessToken, productId),
      ]);

      setProduct(productData.product);
      setVariants(variantData.variants);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết sản phẩm.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, productId]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  function openCreateModal() {
    setModalMode("create");
    setEditingVariant(null);
    setFormState(getEmptyVariantFormState());
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(variant: AdminVariant) {
    setModalMode("edit");
    setEditingVariant(variant);
    setFormState(mapVariantToFormState(variant));
    setFormErrors({});
    setModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) {
      return;
    }

    setModalOpen(false);
    setEditingVariant(null);
    setFormErrors({});
  }

  async function handleSubmitVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      showToast("error", "Chưa có token Admin", "Vui lòng đăng nhập lại.");
      return;
    }

    const nextErrors = validateVariantForm(formState);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast(
        "error",
        "Dữ liệu chưa hợp lệ",
        "Vui lòng kiểm tra lại thông tin biến thể."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = buildVariantPayload(formState);

      if (modalMode === "create") {
        await createAdminVariant(adminAccessToken, productId, payload);

        showToast(
          "success",
          "Thêm biến thể thành công",
          "Biến thể mới đã được lưu vào sản phẩm."
        );
      } else {
        if (!editingVariant) {
          throw new Error("Không tìm thấy biến thể cần cập nhật.");
        }

        await updateAdminVariant(
          adminAccessToken,
          editingVariant.variantId,
          payload
        );

        showToast(
          "success",
          "Cập nhật biến thể thành công",
          "Thông tin biến thể đã được thay đổi."
        );
      }

      setModalOpen(false);
      setEditingVariant(null);
      await fetchProductDetail();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu biến thể.";

      showToast("error", "Lưu biến thể thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDeleteVariant() {
    if (!adminAccessToken || !deletingVariant) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteAdminVariant(adminAccessToken, deletingVariant.variantId);

      showToast(
        "success",
        "Xóa biến thể thành công",
        "Biến thể đã được xóa khỏi sản phẩm."
      );

      setDeletingVariant(null);
      await fetchProductDetail();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa biến thể.";

      showToast("error", "Xóa biến thể thất bại", message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <VariantToastStack toasts={toasts} onClose={closeToast} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/products"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-surface-container-high bg-white px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
        >
          <span className="material-symbols-outlined text-xl">
            arrow_back
          </span>
          Quay lại sản phẩm
        </Link>

        <button
          type="button"
          onClick={fetchProductDetail}
          disabled={isFetching}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
        <section className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          {fetchError}
        </section>
      ) : null}

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        {isFetching && !product ? (
          <div className="flex items-center gap-3 text-sm font-semibold text-on-surface">
            <span className="material-symbols-outlined animate-spin text-xl text-primary">
              progress_activity
            </span>
            Đang tải chi tiết sản phẩm...
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Product Detail
              </p>

              <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
                {product?.name || `Sản phẩm #${productId}`}
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
                {product?.description || "Chưa có mô tả sản phẩm."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-secondary">
                  ID: #{product?.productId || productId}
                </span>

                <span className="rounded-full bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-secondary">
                  Slug: {product?.slug || "—"}
                </span>

                <span className="rounded-full bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-secondary">
                  Danh mục: {product?.categoryName || "—"}
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    product?.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {product?.isActive ? "Đang hiển thị" : "Đã ẩn"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              Thêm biến thể
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Tổng biến thể
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {variants.length}
            </p>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Tổng tồn kho
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {totalStock}
            </p>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Tổng ảnh sản phẩm
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {imageCount ?? product?.totalImages ?? 0}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-surface-container-high p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách biến thể
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Variant lưu màu, dung lượng, RAM, SKU, giá và tồn kho.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-primary bg-white px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-on-primary"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Thêm variant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">SKU</th>
                <th className="px-4 py-3 font-bold">Biến thể</th>
                <th className="px-4 py-3 font-bold">Màu</th>
                <th className="px-4 py-3 font-bold">Dung lượng</th>
                <th className="px-4 py-3 font-bold">RAM</th>
                <th className="px-4 py-3 font-bold">Giá</th>
                <th className="px-4 py-3 font-bold">Tồn kho</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined animate-spin text-xl text-primary">
                        progress_activity
                      </span>
                      Đang tải biến thể...
                    </div>
                  </td>
                </tr>
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          deployed_code
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có biến thể
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy thêm variant đầu tiên cho sản phẩm này.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                variants.map((variant) => (
                  <tr
                    key={variant.variantId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4 text-sm font-semibold text-secondary">
                      #{variant.variantId}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-xl bg-surface-container-lowest px-3 py-1.5 text-sm font-bold text-secondary">
                        {variant.sku}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        <p className="font-bold text-on-surface">
                          {variant.variantName || "Chưa đặt tên biến thể"}
                        </p>

                        <p className="mt-1 text-sm text-secondary">
                          {variant.installment || "Không có thông tin trả góp"}
                          {variant.discountLabel
                            ? ` · ${variant.discountLabel}`
                            : ""}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-on-surface">
                      {variant.color || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-on-surface">
                      {variant.capacity || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-on-surface">
                      {variant.ram || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(variant.price)}
                      </p>

                      {variant.oldPrice ? (
                        <p className="mt-1 text-xs font-medium text-secondary line-through">
                          {formatCurrency(variant.oldPrice)}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          variant.stockQuantity > 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {variant.stockQuantity}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(variant)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingVariant(variant)}
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
      </section>

      <AdminProductImageManager
        productId={productId}
        variants={variants}
        onImagesChanged={fetchProductDetail}
        onImageCountChange={setImageCount}
        
        />

      <VariantFormModal
        open={modalOpen}
        mode={modalMode}
        formState={formState}
        errors={formErrors}
        isSubmitting={isSubmitting}
        editingVariant={editingVariant}
        product={product}
        onClose={closeFormModal}
        onChange={setFormState}
        onSubmit={handleSubmitVariant}
      />

      <DeleteVariantModal
        variant={deletingVariant}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingVariant(null);
          }
        }}
        onConfirm={handleConfirmDeleteVariant}
      />
    </div>
  );
}