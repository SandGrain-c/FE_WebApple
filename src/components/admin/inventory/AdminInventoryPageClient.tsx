"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  adjustAdminInventoryStock,
  createAdminInventoryReceipt,
  getAdminInventoryReceiptById,
  getAdminInventoryReceipts,
  getAdminInventoryVariants,
} from "@/services/admin-inventory.service";
import { getAdminSuppliers } from "@/services/admin-supplier.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminInventoryReceipt,
  AdminInventoryReceiptItem,
  AdminInventoryReceiptSort,
  AdminInventoryStockStatusFilter,
  AdminInventoryVariant,
  AdminInventorySort,
  AdminStockAdjustType,
  CreateAdminInventoryReceiptItemPayload,
} from "@/types/admin-inventory.type";
import type { AdminSupplier } from "@/types/admin-supplier.type";

const DEFAULT_LIMIT = 10;

type InventoryTab = "variants" | "receipts";

type InventoryToastVariant = "success" | "error" | "info";

type InventoryToast = {
  id: number;
  variant: InventoryToastVariant;
  title: string;
  description?: string;
};

type ReceiptFormItem = {
  id: string;
  variantId: string;
  quantity: string;
  costPrice: string;
  serialNumbersText: string;
};

type ReceiptFormState = {
  supplierId: string;
  supplierName: string;
  items: ReceiptFormItem[];
};

type StockAdjustFormState = {
  type: AdminStockAdjustType;
  quantity: string;
  reason: string;
};

const STOCK_STATUS_OPTIONS: {
  label: string;
  value: AdminInventoryStockStatusFilter;
}[] = [
  { label: "Tất cả tồn kho", value: "all" },
  { label: "Còn hàng", value: "in-stock" },
  { label: "Tồn thấp", value: "low-stock" },
  { label: "Hết hàng", value: "out-of-stock" },
];

const INVENTORY_SORT_OPTIONS: {
  label: string;
  value: AdminInventorySort;
}[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Tồn tăng dần", value: "stock_asc" },
  { label: "Tồn giảm dần", value: "stock_desc" },
  { label: "SKU A-Z", value: "sku_asc" },
  { label: "SKU Z-A", value: "sku_desc" },
];

const RECEIPT_SORT_OPTIONS: {
  label: string;
  value: AdminInventoryReceiptSort;
}[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Tổng tiền tăng dần", value: "amount_asc" },
  { label: "Tổng tiền giảm dần", value: "amount_desc" },
];

const STOCK_ADJUST_OPTIONS: {
  label: string;
  value: AdminStockAdjustType;
  description: string;
}[] = [
  {
    label: "Đặt lại tồn kho",
    value: "set",
    description: "Set tồn kho về đúng số lượng nhập.",
  },
  {
    label: "Tăng tồn kho",
    value: "increase",
    description: "Cộng thêm số lượng vào tồn kho hiện tại.",
  },
  {
    label: "Giảm tồn kho",
    value: "decrease",
    description: "Trừ số lượng khỏi tồn kho hiện tại.",
  },
];

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getVariantLabel(variant: AdminInventoryVariant) {
  const attributes = [variant.color, variant.capacity, variant.ram]
    .filter(Boolean)
    .join(" - ");

  return `${variant.productName} ${
    attributes ? `(${attributes})` : ""
  } · ${variant.sku}`;
}

function getStockStatus(variant: AdminInventoryVariant) {
  if (variant.stockStatus) {
    return variant.stockStatus;
  }

  if (variant.stockQuantity <= 0) {
    return "out-of-stock";
  }

  if (variant.stockQuantity <= 5) {
    return "low-stock";
  }

  return "in-stock";
}

function getStockStatusLabel(status: string) {
  const statusMap: Record<string, string> = {
    "in-stock": "Còn hàng",
    "low-stock": "Tồn thấp",
    "out-of-stock": "Hết hàng",
  };

  return statusMap[status] || status;
}

function getStockStatusClass(status: string) {
  if (status === "in-stock") {
    return "bg-green-50 text-green-700";
  }

  if (status === "low-stock") {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-red-50 text-red-700";
}

function getReceiptItems(receipt: AdminInventoryReceipt): AdminInventoryReceiptItem[] {
  return receipt.items || receipt.details || [];
}

function getReceiptCode(receipt: AdminInventoryReceipt) {
  return `PN${String(receipt.receiptId).padStart(6, "0")}`;
}

function getReceiptItemLineTotal(item: AdminInventoryReceiptItem) {
  return item.lineTotal ?? item.quantity * item.costPrice;
}

function createEmptyReceiptItem(): ReceiptFormItem {
  return {
    id: `${Date.now()}-${Math.random()}`,
    variantId: "",
    quantity: "1",
    costPrice: "",
    serialNumbersText: "",
  };
}

function parseSerialNumbers(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

type InventoryToastStackProps = {
  toasts: InventoryToast[];
  onClose: (id: number) => void;
};

function InventoryToastStack({ toasts, onClose }: InventoryToastStackProps) {
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

type StockAdjustModalProps = {
  variant: AdminInventoryVariant | null;
  formState: StockAdjustFormState;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: StockAdjustFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function StockAdjustModal({
  variant,
  formState,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: StockAdjustModalProps) {
  if (!variant) {
    return null;
  }

  const selectedOption = STOCK_ADJUST_OPTIONS.find(
    (option) => option.value === formState.type
  );

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-[min(94vw,620px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between gap-4 border-b border-surface-container-high p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Adjust Stock
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              Điều chỉnh tồn kho
            </h3>

            <p className="mt-1 text-sm text-secondary">
              {getVariantLabel(variant)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-sm text-secondary">Tồn kho hiện tại</p>
            <p className="mt-1 text-2xl font-bold text-on-surface">
              {formatNumber(variant.stockQuantity)}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Loại điều chỉnh
            </label>

            <select
              value={formState.type}
              onChange={(event) =>
                onChange({
                  ...formState,
                  type: event.target.value as AdminStockAdjustType,
                })
              }
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {STOCK_ADJUST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {selectedOption ? (
              <p className="mt-1.5 text-xs text-secondary">
                {selectedOption.description}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Số lượng <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              min={0}
              value={formState.quantity}
              onChange={(event) =>
                onChange({
                  ...formState,
                  quantity: event.target.value,
                })
              }
              disabled={isSubmitting}
              placeholder="Ví dụ: 20"
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Lý do điều chỉnh <span className="text-red-500">*</span>
            </label>

            <textarea
              value={formState.reason}
              onChange={(event) =>
                onChange({
                  ...formState,
                  reason: event.target.value,
                })
              }
              disabled={isSubmitting}
              rows={4}
              placeholder="Ví dụ: Kiểm kê thực tế cuối ngày"
              className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
            Thao tác điều chỉnh tồn kho sẽ được BE ghi audit log action{" "}
            <span className="font-bold">ADJUST_STOCK</span>.
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
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    tune
                  </span>
                  Cập nhật tồn kho
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ReceiptCreateModalProps = {
  open: boolean;
  formState: ReceiptFormState;
  variants: AdminInventoryVariant[];
  suppliers: AdminSupplier[];
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: ReceiptFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ReceiptCreateModal({
  open,
  formState,
  variants,
  suppliers,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: ReceiptCreateModalProps) {
  if (!open) {
    return null;
  }

  const estimatedTotal = formState.items.reduce((total, item) => {
    const quantity = Number(item.quantity || 0);
    const costPrice = Number(item.costPrice || 0);

    return total + quantity * costPrice;
  }, 0);

  function updateItem(itemId: string, nextItem: Partial<ReceiptFormItem>) {
    onChange({
      ...formState,
      items: formState.items.map((item) =>
        item.id === itemId ? { ...item, ...nextItem } : item
      ),
    });
  }

  function removeItem(itemId: string) {
    if (formState.items.length <= 1) {
      return;
    }

    onChange({
      ...formState,
      items: formState.items.filter((item) => item.id !== itemId),
    });
  }

  function handleSupplierChange(supplierId: string) {
    const supplier = suppliers.find(
      (item) => String(item.supplierId) === supplierId
    );

    onChange({
      ...formState,
      supplierId,
      supplierName: supplier?.supplierName || formState.supplierName,
    });
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(96vw,1040px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Inventory Receipt
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              Tạo phiếu nhập kho
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Khi tạo phiếu nhập, BE sẽ tăng tồn kho của các variant tương ứng.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Chọn nhà cung cấp
              </label>

              <select
                value={formState.supplierId}
                onChange={(event) => handleSupplierChange(event.target.value)}
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Chọn từ danh sách supplier</option>

                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.supplierName}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-xs text-secondary">
                FE sẽ dùng tên supplier để gửi phiếu nhập, đảm bảo tương thích
                với API hiện tại.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={formState.supplierName}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    supplierName: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Ví dụ: Apple Việt Nam"
                className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-surface-container-high">
            <div className="flex flex-col gap-3 border-b border-surface-container-high bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-bold text-on-surface">
                  Sản phẩm nhập kho
                </h4>

                <p className="mt-1 text-sm text-secondary">
                  Có thể nhập nhiều variant trong một phiếu.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...formState,
                    items: [...formState.items, createEmptyReceiptItem()],
                  })
                }
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-primary bg-white px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                Thêm dòng
              </button>
            </div>

            <div className="space-y-4 p-4">
              {formState.items.map((item, index) => {
                const selectedVariant = variants.find(
                  (variant) => String(variant.variantId) === item.variantId
                );
                const serialNumbers = parseSerialNumbers(item.serialNumbersText);

                return (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-surface-container-high bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-bold text-on-surface">
                        Dòng nhập #{index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={isSubmitting || formState.items.length <= 1}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">
                          delete
                        </span>
                        Xóa
                      </button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.6fr_120px_160px]">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                          Variant <span className="text-red-500">*</span>
                        </label>

                        <select
                          value={item.variantId}
                          onChange={(event) =>
                            updateItem(item.id, {
                              variantId: event.target.value,
                            })
                          }
                          disabled={isSubmitting}
                          className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Chọn variant nhập kho</option>

                          {variants.map((variant) => (
                            <option
                              key={variant.variantId}
                              value={variant.variantId}
                            >
                              {getVariantLabel(variant)}
                            </option>
                          ))}
                        </select>

                        {selectedVariant ? (
                          <p className="mt-1.5 text-xs text-secondary">
                            Tồn hiện tại:{" "}
                            <span className="font-bold">
                              {formatNumber(selectedVariant.stockQuantity)}
                            </span>
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                          Số lượng
                        </label>

                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.id, {
                              quantity: event.target.value,
                            })
                          }
                          disabled={isSubmitting}
                          className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                          Giá nhập
                        </label>

                        <input
                          type="number"
                          min={0}
                          value={item.costPrice}
                          onChange={(event) =>
                            updateItem(item.id, {
                              costPrice: event.target.value,
                            })
                          }
                          disabled={isSubmitting}
                          placeholder="30000000"
                          className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                        Serial numbers
                      </label>

                      <textarea
                        value={item.serialNumbersText}
                        onChange={(event) =>
                          updateItem(item.id, {
                            serialNumbersText: event.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        rows={3}
                        placeholder="Mỗi serial một dòng hoặc cách nhau bằng dấu phẩy. Có thể bỏ trống nếu chưa quản lý serial."
                        className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                      />

                      <p className="mt-1.5 text-xs text-secondary">
                        Đã nhập {serialNumbers.length} serial. Nếu nhập serial,
                        số serial nên khớp với số lượng.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-on-surface">
                Tổng tiền nhập dự kiến
              </p>

              <p className="text-xl font-bold text-primary">
                {formatCurrency(estimatedTotal)}
              </p>
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
                  Đang tạo phiếu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    add_business
                  </span>
                  Tạo phiếu nhập
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ReceiptDetailModalProps = {
  receipt: AdminInventoryReceipt | null;
  isLoading: boolean;
  onClose: () => void;
};

function ReceiptDetailModal({
  receipt,
  isLoading,
  onClose,
}: ReceiptDetailModalProps) {
  if (!receipt && !isLoading) {
    return null;
  }

  const items = receipt ? getReceiptItems(receipt) : [];

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(96vw,980px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Receipt Detail
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              {receipt ? getReceiptCode(receipt) : "Đang tải phiếu nhập..."}
            </h3>

            {receipt ? (
              <p className="mt-1 text-sm text-secondary">
                Tạo lúc {formatDateTime(receipt.createdAt)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary"
            aria-label="Đóng chi tiết phiếu nhập"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined animate-spin text-xl text-primary">
                progress_activity
              </span>
              Đang tải chi tiết phiếu nhập...
            </div>
          </div>
        ) : receipt ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Nhà cung cấp
                </p>
                <p className="mt-2 font-bold text-on-surface">
                  {receipt.supplierName || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Người tạo
                </p>
                <p className="mt-2 font-bold text-on-surface">
                  {receipt.createdByName || receipt.createdBy || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Tổng tiền
                </p>
                <p className="mt-2 text-xl font-bold text-primary">
                  {formatCurrency(receipt.totalAmount)}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-surface-container-high">
              <div className="border-b border-surface-container-high bg-surface-container-lowest px-4 py-3">
                <h4 className="font-bold text-on-surface">
                  Chi tiết hàng nhập
                </h4>
              </div>

              {items.length === 0 ? (
                <div className="p-5 text-sm text-secondary">
                  Chưa có dữ liệu chi tiết phiếu nhập.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left">
                    <thead className="bg-surface-container-lowest">
                      <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                        <th className="px-4 py-3 font-bold">Sản phẩm</th>
                        <th className="px-4 py-3 font-bold">SKU</th>
                        <th className="px-4 py-3 text-right font-bold">SL</th>
                        <th className="px-4 py-3 text-right font-bold">
                          Giá nhập
                        </th>
                        <th className="px-4 py-3 text-right font-bold">Tổng</th>
                        <th className="px-4 py-3 font-bold">Serial</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => (
                        <tr
                          key={`${item.receiptDetailId || index}-${item.variantId}`}
                          className="border-b border-surface-container-high last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <p className="font-bold text-on-surface">
                              {item.productName || "—"}
                            </p>
                            <p className="mt-1 text-sm text-secondary">
                              {[item.variantName, item.color, item.capacity, item.ram]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded-xl bg-surface-container-lowest px-2.5 py-1 text-xs font-bold text-secondary">
                              {item.sku || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">
                            {formatNumber(item.quantity)}
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(item.costPrice)}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-primary">
                            {formatCurrency(getReceiptItemLineTotal(item))}
                          </td>

                          <td className="px-4 py-3">
                            <p className="line-clamp-2 max-w-[220px] text-xs leading-5 text-secondary">
                              {item.serialNumbers && item.serialNumbers.length > 0
                                ? item.serialNumbers.join(", ")
                                : "Không có"}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminInventoryPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [activeTab, setActiveTab] = useState<InventoryTab>("variants");

  const [variants, setVariants] = useState<AdminInventoryVariant[]>([]);
  const [variantPagination, setVariantPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [variantSearchDraft, setVariantSearchDraft] = useState("");
  const [variantSearch, setVariantSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] =
    useState<AdminInventoryStockStatusFilter>("all");
  const [variantSort, setVariantSort] = useState<AdminInventorySort>("newest");
  const [variantPage, setVariantPage] = useState(1);
  const [variantLimit, setVariantLimit] = useState(DEFAULT_LIMIT);

  const [receipts, setReceipts] = useState<AdminInventoryReceipt[]>([]);
  const [receiptPagination, setReceiptPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [receiptSearchDraft, setReceiptSearchDraft] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [receiptSort, setReceiptSort] =
    useState<AdminInventoryReceiptSort>("newest");
  const [receiptPage, setReceiptPage] = useState(1);
  const [receiptLimit, setReceiptLimit] = useState(DEFAULT_LIMIT);

  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);

  const [isFetchingVariants, setIsFetchingVariants] = useState(false);
  const [isFetchingReceipts, setIsFetchingReceipts] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [stockAdjustVariant, setStockAdjustVariant] =
    useState<AdminInventoryVariant | null>(null);
  const [stockAdjustForm, setStockAdjustForm] =
    useState<StockAdjustFormState>({
      type: "set",
      quantity: "",
      reason: "",
    });
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  const [receiptCreateOpen, setReceiptCreateOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState<ReceiptFormState>({
    supplierId: "",
    supplierName: "",
    items: [createEmptyReceiptItem()],
  });
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);

  const [selectedReceipt, setSelectedReceipt] =
    useState<AdminInventoryReceipt | null>(null);
  const [isReceiptDetailLoading, setIsReceiptDetailLoading] = useState(false);

  const [toasts, setToasts] = useState<InventoryToast[]>([]);

  const stockSummary = useMemo(() => {
    return {
      total: variants.length,
      inStock: variants.filter(
        (variant) => getStockStatus(variant) === "in-stock"
      ).length,
      lowStock: variants.filter(
        (variant) => getStockStatus(variant) === "low-stock"
      ).length,
      outOfStock: variants.filter(
        (variant) => getStockStatus(variant) === "out-of-stock"
      ).length,
    };
  }, [variants]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: InventoryToastVariant,
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

  const fetchVariants = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetchingVariants(true);
      setFetchError(null);

      const data = await getAdminInventoryVariants(adminAccessToken, {
        search: variantSearch,
        page: variantPage,
        limit: variantLimit,
        sort: variantSort,
        stockStatus:
          stockStatusFilter === "all" ? undefined : stockStatusFilter,
      });

      setVariants(data.items);
      setVariantPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách tồn kho.";

      setFetchError(message);
    } finally {
      setIsFetchingVariants(false);
    }
  }, [
    adminAccessToken,
    variantSearch,
    variantPage,
    variantLimit,
    variantSort,
    stockStatusFilter,
  ]);

  const fetchReceipts = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetchingReceipts(true);
      setFetchError(null);

      const data = await getAdminInventoryReceipts(adminAccessToken, {
        search: receiptSearch,
        page: receiptPage,
        limit: receiptLimit,
        sort: receiptSort,
      });

      setReceipts(data.items);
      setReceiptPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách phiếu nhập.";

      setFetchError(message);
    } finally {
      setIsFetchingReceipts(false);
    }
  }, [
    adminAccessToken,
    receiptSearch,
    receiptPage,
    receiptLimit,
    receiptSort,
  ]);

  const fetchSuppliers = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      const data = await getAdminSuppliers(adminAccessToken, {
        page: 1,
        limit: 100,
        status: "Active",
        sort: "name_asc",
      });

      setSuppliers(data.items);
    } catch {
      setSuppliers([]);
    }
  }, [adminAccessToken]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  function handleVariantSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVariantPage(1);
    setVariantSearch(variantSearchDraft.trim());
  }

  function handleReceiptSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReceiptPage(1);
    setReceiptSearch(receiptSearchDraft.trim());
  }

  function openStockAdjustModal(variant: AdminInventoryVariant) {
    setStockAdjustVariant(variant);
    setStockAdjustForm({
      type: "set",
      quantity: String(variant.stockQuantity),
      reason: "",
    });
  }

  async function handleSubmitStockAdjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken || !stockAdjustVariant) {
      return;
    }

    const quantity = Number(stockAdjustForm.quantity);

    if (Number.isNaN(quantity) || quantity < 0) {
      showToast("error", "Số lượng không hợp lệ", "Số lượng phải là số không âm.");
      return;
    }

    if (!stockAdjustForm.reason.trim()) {
      showToast("error", "Thiếu lý do", "Vui lòng nhập lý do điều chỉnh tồn kho.");
      return;
    }

    try {
      setIsAdjustingStock(true);

      await adjustAdminInventoryStock(
        adminAccessToken,
        stockAdjustVariant.variantId,
        {
          type: stockAdjustForm.type,
          quantity,
          reason: stockAdjustForm.reason.trim(),
        }
      );

      showToast(
        "success",
        "Cập nhật tồn kho thành công",
        `Đã điều chỉnh SKU ${stockAdjustVariant.sku}.`
      );

      setStockAdjustVariant(null);
      await fetchVariants();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể cập nhật tồn kho.";

      showToast("error", "Cập nhật tồn kho thất bại", message);
    } finally {
      setIsAdjustingStock(false);
    }
  }

  function openReceiptCreateModal() {
    setReceiptForm({
      supplierId: "",
      supplierName: "",
      items: [createEmptyReceiptItem()],
    });
    setReceiptCreateOpen(true);
  }

  async function handleSubmitCreateReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      return;
    }

    const supplierName = receiptForm.supplierName.trim();

    if (!supplierName) {
      showToast("error", "Thiếu nhà cung cấp", "Vui lòng nhập tên nhà cung cấp.");
      return;
    }

    const payloadItems: CreateAdminInventoryReceiptItemPayload[] = [];

    for (const item of receiptForm.items) {
      const variantId = Number(item.variantId);
      const quantity = Number(item.quantity);
      const costPrice = Number(item.costPrice);
      const serialNumbers = parseSerialNumbers(item.serialNumbersText);

      if (!variantId) {
        showToast("error", "Thiếu variant", "Vui lòng chọn đầy đủ variant nhập kho.");
        return;
      }

      if (Number.isNaN(quantity) || quantity <= 0) {
        showToast("error", "Số lượng không hợp lệ", "Số lượng nhập phải lớn hơn 0.");
        return;
      }

      if (Number.isNaN(costPrice) || costPrice < 0) {
        showToast("error", "Giá nhập không hợp lệ", "Giá nhập không được âm.");
        return;
      }

      if (serialNumbers.length > 0 && serialNumbers.length !== quantity) {
        showToast(
          "error",
          "Serial chưa khớp số lượng",
          "Nếu nhập serial, số serial nên bằng số lượng nhập."
        );
        return;
      }

      payloadItems.push({
        variantId,
        quantity,
        costPrice,
        serialNumbers: serialNumbers.length > 0 ? serialNumbers : undefined,
      });
    }

    try {
      setIsCreatingReceipt(true);

      await createAdminInventoryReceipt(adminAccessToken, {
        supplierName,
        supplierId: receiptForm.supplierId
          ? Number(receiptForm.supplierId)
          : undefined,
        items: payloadItems,
      });

      showToast(
        "success",
        "Tạo phiếu nhập thành công",
        "Tồn kho variant đã được cập nhật."
      );

      setReceiptCreateOpen(false);
      await Promise.all([fetchVariants(), fetchReceipts()]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tạo phiếu nhập.";

      showToast("error", "Tạo phiếu nhập thất bại", message);
    } finally {
      setIsCreatingReceipt(false);
    }
  }

  async function openReceiptDetail(receiptId: number) {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsReceiptDetailLoading(true);
      setSelectedReceipt(null);

      const data = await getAdminInventoryReceiptById(
        adminAccessToken,
        receiptId
      );

      setSelectedReceipt(data.receipt);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết phiếu nhập.";

      showToast("error", "Tải chi tiết thất bại", message);
    } finally {
      setIsReceiptDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <InventoryToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Inventory
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý kho hàng
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Theo dõi tồn kho theo variant, tạo phiếu nhập kho và điều chỉnh
              tồn kho thủ công. Các thao tác nhập kho và chỉnh tồn đều được BE
              ghi audit log.
            </p>
          </div>

          <button
            type="button"
            onClick={openReceiptCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">
              add_business
            </span>
            Tạo phiếu nhập
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              Tổng variant theo lọc
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {formatNumber(stockSummary.total)}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Còn hàng
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {formatNumber(stockSummary.inStock)}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
              Tồn thấp
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {formatNumber(stockSummary.lowStock)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Hết hàng
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {formatNumber(stockSummary.outOfStock)}
            </p>
          </div>
        </div>
      </section>

      {fetchError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {fetchError}
        </section>
      ) : null}

      <section className="rounded-[24px] border border-surface-container-high bg-white p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("variants")}
            className={`h-12 rounded-2xl text-sm font-bold transition ${
              activeTab === "variants"
                ? "bg-primary text-on-primary"
                : "text-on-surface hover:bg-surface-container-lowest"
            }`}
          >
            Tồn kho theo variant
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("receipts")}
            className={`h-12 rounded-2xl text-sm font-bold transition ${
              activeTab === "receipts"
                ? "bg-primary text-on-primary"
                : "text-on-surface hover:bg-surface-container-lowest"
            }`}
          >
            Phiếu nhập kho
          </button>
        </div>
      </section>

      {activeTab === "variants" ? (
        <section className="space-y-4">
          <div className="rounded-[24px] border border-surface-container-high bg-white p-4 shadow-sm">
            <form
              onSubmit={handleVariantSearchSubmit}
              className="grid gap-3 xl:grid-cols-[1fr_190px_180px_130px_auto]"
            >
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
                <span className="material-symbols-outlined text-xl text-secondary">
                  search
                </span>

                <input
                  type="text"
                  value={variantSearchDraft}
                  onChange={(event) => setVariantSearchDraft(event.target.value)}
                  placeholder="Tìm SKU, tên sản phẩm, tên variant..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
                />
              </div>

              <select
                value={stockStatusFilter}
                onChange={(event) => {
                  setStockStatusFilter(
                    event.target.value as AdminInventoryStockStatusFilter
                  );
                  setVariantPage(1);
                }}
                className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {STOCK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={variantSort}
                onChange={(event) => {
                  setVariantSort(event.target.value as AdminInventorySort);
                  setVariantPage(1);
                }}
                className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {INVENTORY_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={variantLimit}
                onChange={(event) => {
                  setVariantLimit(Number(event.target.value));
                  setVariantPage(1);
                }}
                className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value={5}>5/trang</option>
                <option value={10}>10/trang</option>
                <option value={20}>20/trang</option>
              </select>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
              >
                <span className="material-symbols-outlined text-xl">search</span>
                Tìm
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-container-high p-4">
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Danh sách tồn kho
                </h3>

                <p className="mt-1 text-sm text-secondary">
                  Tổng {variantPagination.totalItems} variant · Trang{" "}
                  {variantPagination.page}/{variantPagination.totalPages || 1}
                </p>
              </div>

              <button
                type="button"
                onClick={fetchVariants}
                disabled={isFetchingVariants}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-xl ${
                    isFetchingVariants ? "animate-spin" : ""
                  }`}
                >
                  {isFetchingVariants ? "progress_activity" : "refresh"}
                </span>
                Làm mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-surface-container-lowest">
                  <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                    <th className="px-4 py-3 font-bold">Sản phẩm</th>
                    <th className="px-4 py-3 font-bold">SKU</th>
                    <th className="px-4 py-3 font-bold">Variant</th>
                    <th className="px-4 py-3 text-right font-bold">Giá bán</th>
                    <th className="px-4 py-3 text-right font-bold">Tồn kho</th>
                    <th className="px-4 py-3 font-bold">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-bold">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {isFetchingVariants ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                          <span className="material-symbols-outlined animate-spin text-xl text-primary">
                            progress_activity
                          </span>
                          Đang tải tồn kho...
                        </div>
                      </td>
                    </tr>
                  ) : variants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                            <span className="material-symbols-outlined text-2xl">
                              inventory
                            </span>
                          </div>

                          <p className="mt-3 font-bold text-on-surface">
                            Chưa có variant phù hợp
                          </p>

                          <p className="mt-1 text-sm text-secondary">
                            Hãy tạo variant sản phẩm hoặc đổi bộ lọc.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    variants.map((variant) => {
                      const stockStatus = getStockStatus(variant);

                      return (
                        <tr
                          key={variant.variantId}
                          className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                        >
                          <td className="px-4 py-4">
                            <p className="font-bold text-on-surface">
                              {variant.productName}
                            </p>
                            <p className="mt-1 text-sm text-secondary">
                              Product #{variant.productId}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-xl bg-surface-container-lowest px-2.5 py-1 text-xs font-bold text-secondary">
                              {variant.sku}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-secondary">
                            <p className="font-semibold text-on-surface">
                              {variant.variantName || "—"}
                            </p>
                            <p className="mt-1">
                              {[variant.color, variant.capacity, variant.ram]
                                .filter(Boolean)
                                .join(" - ") || "—"}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-right font-semibold text-on-surface">
                            {formatCurrency(variant.price)}
                          </td>

                          <td className="px-4 py-4 text-right text-lg font-bold text-on-surface">
                            {formatNumber(variant.stockQuantity)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStockStatusClass(
                                stockStatus
                              )}`}
                            >
                              {getStockStatusLabel(stockStatus)}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => openStockAdjustModal(variant)}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-primary/30 px-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-on-primary"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  tune
                                </span>
                                Điều chỉnh
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-surface-container-high p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secondary">
                Hiển thị {variants.length} / {variantPagination.totalItems} variant
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVariantPage((current) => Math.max(1, current - 1))
                  }
                  disabled={variantPage <= 1 || isFetchingVariants}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_left
                  </span>
                  Trước
                </button>

                <span className="rounded-2xl bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface">
                  {variantPagination.page || variantPage}/
                  {variantPagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setVariantPage((current) =>
                      Math.min(variantPagination.totalPages || 1, current + 1)
                    )
                  }
                  disabled={
                    variantPage >= variantPagination.totalPages ||
                    isFetchingVariants ||
                    variantPagination.totalPages === 0
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
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-[24px] border border-surface-container-high bg-white p-4 shadow-sm">
            <form
              onSubmit={handleReceiptSearchSubmit}
              className="grid gap-3 xl:grid-cols-[1fr_220px_130px_auto]"
            >
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
                <span className="material-symbols-outlined text-xl text-secondary">
                  search
                </span>

                <input
                  type="text"
                  value={receiptSearchDraft}
                  onChange={(event) => setReceiptSearchDraft(event.target.value)}
                  placeholder="Tìm nhà cung cấp, mã phiếu nhập..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
                />
              </div>

              <select
                value={receiptSort}
                onChange={(event) => {
                  setReceiptSort(
                    event.target.value as AdminInventoryReceiptSort
                  );
                  setReceiptPage(1);
                }}
                className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {RECEIPT_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={receiptLimit}
                onChange={(event) => {
                  setReceiptLimit(Number(event.target.value));
                  setReceiptPage(1);
                }}
                className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value={5}>5/trang</option>
                <option value={10}>10/trang</option>
                <option value={20}>20/trang</option>
              </select>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
              >
                <span className="material-symbols-outlined text-xl">search</span>
                Tìm
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-container-high p-4">
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Danh sách phiếu nhập
                </h3>

                <p className="mt-1 text-sm text-secondary">
                  Tổng {receiptPagination.totalItems} phiếu · Trang{" "}
                  {receiptPagination.page}/{receiptPagination.totalPages || 1}
                </p>
              </div>

              <button
                type="button"
                onClick={openReceiptCreateModal}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
              >
                <span className="material-symbols-outlined text-xl">
                  add_business
                </span>
                Tạo phiếu
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-surface-container-lowest">
                  <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                    <th className="px-4 py-3 font-bold">Phiếu nhập</th>
                    <th className="px-4 py-3 font-bold">Nhà cung cấp</th>
                    <th className="px-4 py-3 font-bold">Ngày tạo</th>
                    <th className="px-4 py-3 font-bold">Người tạo</th>
                    <th className="px-4 py-3 text-right font-bold">Tổng tiền</th>
                    <th className="px-4 py-3 text-right font-bold">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {isFetchingReceipts ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                          <span className="material-symbols-outlined animate-spin text-xl text-primary">
                            progress_activity
                          </span>
                          Đang tải phiếu nhập...
                        </div>
                      </td>
                    </tr>
                  ) : receipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                            <span className="material-symbols-outlined text-2xl">
                              receipt_long
                            </span>
                          </div>

                          <p className="mt-3 font-bold text-on-surface">
                            Chưa có phiếu nhập phù hợp
                          </p>

                          <p className="mt-1 text-sm text-secondary">
                            Hãy tạo phiếu nhập kho đầu tiên.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    receipts.map((receipt) => (
                      <tr
                        key={receipt.receiptId}
                        className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                      >
                        <td className="px-4 py-4">
                          <p className="font-bold text-on-surface">
                            {getReceiptCode(receipt)}
                          </p>
                          <p className="mt-1 text-sm text-secondary">
                            ID #{receipt.receiptId}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-on-surface">
                            {receipt.supplierName || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-secondary">
                          {formatDateTime(receipt.createdAt)}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-secondary">
                          {receipt.createdByName || receipt.createdBy || "—"}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-primary">
                          {formatCurrency(receipt.totalAmount)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                openReceiptDetail(receipt.receiptId)
                              }
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-lg">
                                visibility
                              </span>
                              Chi tiết
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
                Hiển thị {receipts.length} / {receiptPagination.totalItems} phiếu
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setReceiptPage((current) => Math.max(1, current - 1))
                  }
                  disabled={receiptPage <= 1 || isFetchingReceipts}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_left
                  </span>
                  Trước
                </button>

                <span className="rounded-2xl bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface">
                  {receiptPagination.page || receiptPage}/
                  {receiptPagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setReceiptPage((current) =>
                      Math.min(receiptPagination.totalPages || 1, current + 1)
                    )
                  }
                  disabled={
                    receiptPage >= receiptPagination.totalPages ||
                    isFetchingReceipts ||
                    receiptPagination.totalPages === 0
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
          </div>
        </section>
      )}

      <StockAdjustModal
        variant={stockAdjustVariant}
        formState={stockAdjustForm}
        isSubmitting={isAdjustingStock}
        onClose={() => {
          if (!isAdjustingStock) {
            setStockAdjustVariant(null);
          }
        }}
        onChange={setStockAdjustForm}
        onSubmit={handleSubmitStockAdjust}
      />

      <ReceiptCreateModal
        open={receiptCreateOpen}
        formState={receiptForm}
        variants={variants}
        suppliers={suppliers}
        isSubmitting={isCreatingReceipt}
        onClose={() => {
          if (!isCreatingReceipt) {
            setReceiptCreateOpen(false);
          }
        }}
        onChange={setReceiptForm}
        onSubmit={handleSubmitCreateReceipt}
      />

      <ReceiptDetailModal
        receipt={selectedReceipt}
        isLoading={isReceiptDetailLoading}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}