"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminProductItem,
  deleteAdminProductItem,
  getAdminProductItems,
  updateAdminProductItem,
} from "@/services/admin-product-item.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminProductItem,
  AdminProductItemStatus,
  AdminProductItemStatusFilter,
} from "@/types/admin-product-item.type";

const DEFAULT_LIMIT = 10;

const PRODUCT_ITEM_STATUS_OPTIONS: {
  label: string;
  value: AdminProductItemStatus;
}[] = [
  { label: "Còn trong kho", value: "InStock" },
  { label: "Đang giữ hàng", value: "Reserved" },
  { label: "Đã bán", value: "Sold" },
  { label: "Bảo hành", value: "Warranty" },
  { label: "Đã trả hàng", value: "Returned" },
  { label: "Ngừng sử dụng", value: "Inactive" },
];

type ToastVariant = "success" | "error" | "info";

type ToastState = {
  variant: ToastVariant;
  title: string;
  description?: string;
} | null;

type ProductItemFormState = {
  variantId: string;
  serialNumber: string;
  status: AdminProductItemStatus;
};

function getEmptyFormState(): ProductItemFormState {
  return {
    variantId: "",
    serialNumber: "",
    status: "InStock",
  };
}

function getStatusLabel(status: string) {
  return (
    PRODUCT_ITEM_STATUS_OPTIONS.find((item) => item.value === status)?.label ||
    status
  );
}

function getStatusClass(status: string) {
  if (status === "InStock") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Reserved") {
    return "bg-yellow-50 text-yellow-700";
  }

  if (status === "Sold") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "Warranty") {
    return "bg-purple-50 text-purple-700";
  }

  if (status === "Returned") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-red-50 text-red-700";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

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

export default function AdminProductItemPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [items, setItems] = useState<AdminProductItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [variantIdDraft, setVariantIdDraft] = useState("");
  const [variantId, setVariantId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] =
    useState<AdminProductItemStatusFilter>("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminProductItem | null>(null);
  const [formState, setFormState] =
    useState<ProductItemFormState>(getEmptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingItem, setDeletingItem] = useState<AdminProductItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  const summary = useMemo(() => {
    return {
      inStock: items.filter((item) => item.status === "InStock").length,
      reserved: items.filter((item) => item.status === "Reserved").length,
      sold: items.filter((item) => item.status === "Sold").length,
      inactive: items.filter((item) => item.status === "Inactive").length,
    };
  }, [items]);

  function showToast(
    variant: ToastVariant,
    title: string,
    description?: string
  ) {
    setToast({
      variant,
      title,
      description,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  const fetchProductItems = useCallback(async () => {
    if (!adminAccessToken) return;

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminProductItems(adminAccessToken, {
        q: search,
        status: statusFilter === "all" ? undefined : statusFilter,
        variantId,
        page,
        limit,
      });

      setItems(data.items);
      setPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách serial sản phẩm.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, search, statusFilter, variantId, page, limit]);

  useEffect(() => {
    fetchProductItems();
  }, [fetchProductItems]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextVariantId = variantIdDraft.trim()
      ? Number(variantIdDraft.trim())
      : undefined;

    if (
      variantIdDraft.trim() &&
      (!nextVariantId || Number.isNaN(nextVariantId))
    ) {
      showToast("error", "Variant ID không hợp lệ", "Vui lòng nhập số hợp lệ.");
      return;
    }

    setPage(1);
    setSearch(searchDraft.trim());
    setVariantId(nextVariantId);
  }

  function handleResetFilter() {
    setSearchDraft("");
    setSearch("");
    setVariantIdDraft("");
    setVariantId(undefined);
    setStatusFilter("all");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  function openCreateForm() {
    setEditingItem(null);
    setFormState(getEmptyFormState());
    setFormOpen(true);
  }

  function openEditForm(item: AdminProductItem) {
    setEditingItem(item);
    setFormState({
      variantId: String(item.variantId),
      serialNumber: item.serialNumber,
      status: item.status,
    });
    setFormOpen(true);
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) return;

    const variantIdNumber = Number(formState.variantId);

    if (!variantIdNumber || Number.isNaN(variantIdNumber)) {
      showToast("error", "Thiếu Variant ID", "Vui lòng nhập Variant ID hợp lệ.");
      return;
    }

    if (!formState.serialNumber.trim()) {
      showToast("error", "Thiếu Serial", "Vui lòng nhập serial sản phẩm.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingItem) {
        await updateAdminProductItem(
          adminAccessToken,
          editingItem.productItemId,
          {
            serialNumber: formState.serialNumber.trim(),
            status: formState.status,
          }
        );

        showToast(
          "success",
          "Cập nhật serial thành công",
          "Thông tin serial sản phẩm đã được thay đổi."
        );
      } else {
        await createAdminProductItem(adminAccessToken, {
          variantId: variantIdNumber,
          serialNumber: formState.serialNumber.trim(),
          status: formState.status,
        });

        showToast(
          "success",
          "Tạo serial thành công",
          "Serial sản phẩm mới đã được thêm vào hệ thống."
        );
      }

      setFormOpen(false);
      setEditingItem(null);
      setFormState(getEmptyFormState());

      await fetchProductItems();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể lưu serial sản phẩm.";

      showToast("error", "Lưu thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!adminAccessToken || !deletingItem) return;

    try {
      setIsDeleting(true);

      await deleteAdminProductItem(
        adminAccessToken,
        deletingItem.productItemId
      );

      showToast(
        "success",
        "Đã ngừng sử dụng serial",
        `${deletingItem.serialNumber} đã được chuyển sang trạng thái Inactive.`
      );

      setDeletingItem(null);
      await fetchProductItems();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể xóa mềm serial sản phẩm.";

      showToast("error", "Xóa mềm thất bại", message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed inset-x-4 top-5 z-9999 mx-auto max-w-xl rounded-2xl border border-surface-container-high bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,0.18)]">
          <div className="flex items-start gap-3">
            <span
              className={`material-symbols-outlined text-2xl ${
                toast.variant === "success"
                  ? "text-green-600"
                  : toast.variant === "error"
                    ? "text-red-600"
                    : "text-primary"
              }`}
            >
              {toast.variant === "success"
                ? "check_circle"
                : toast.variant === "error"
                  ? "error"
                  : "info"}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-on-surface">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm leading-6 text-secondary">
                  {toast.description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-secondary hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Serial
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý serial sản phẩm
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Quản lý serial từng sản phẩm vật lý theo variant. Mỗi serial có
              trạng thái riêng như còn hàng, đã bán, bảo hành hoặc ngừng sử dụng.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Thêm serial
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Còn hàng
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {summary.inStock}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
              Đang giữ
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {summary.reserved}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Đã bán
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {summary.sold}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Ngừng sử dụng
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {summary.inactive}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-surface-container-high bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[1fr_180px_220px_130px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>

            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm serial, SKU, tên sản phẩm..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <input
            type="number"
            min={1}
            value={variantIdDraft}
            onChange={(event) => setVariantIdDraft(event.target.value)}
            placeholder="Variant ID"
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as AdminProductItemStatusFilter
              );
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>

            {PRODUCT_ITEM_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
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
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
              aria-label="Reset bộ lọc"
            >
              <span className="material-symbols-outlined text-xl">
                restart_alt
              </span>
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-surface-container-high bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách serial
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Tổng {pagination.totalItems} serial · Trang {pagination.page}/
              {pagination.totalPages || 1}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProductItems}
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
          <table className="w-full min-w-240 text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">Serial</th>
                <th className="px-4 py-3 font-bold">Variant</th>
                <th className="px-4 py-3 font-bold">Sản phẩm</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 font-bold">Ngày tạo</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined animate-spin text-xl text-primary">
                        progress_activity
                      </span>
                      Đang tải serial...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          qr_code_2
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có serial phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy tạo serial cho variant sản phẩm đang có trong kho.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.productItemId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-on-surface">
                        {item.serialNumber}
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Item #{item.productItemId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">
                        Variant #{item.variantId}
                      </p>

                      {item.sku ? (
                        <p className="mt-1 text-sm text-secondary">
                          SKU: {item.sku}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">
                        {item.productName || item.variantName || "—"}
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        {[item.color, item.capacity, item.ram]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-secondary">
                      {formatDateTime(item.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          disabled={item.status === "Inactive"}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          disabled={item.status === "Inactive"}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                          Ngừng dùng
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
            Hiển thị {items.length} / {pagination.totalItems} serial
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
              Trước
            </button>

            <span className="rounded-2xl bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface">
              {pagination.page || page}/{pagination.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages || 1, current + 1)
                )
              }
              disabled={
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

      {formOpen ? (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-[min(94vw,620px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-surface-container-high p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Product Item
                </p>

                <h3 className="mt-1 text-xl font-bold text-on-surface">
                  {editingItem ? "Sửa serial sản phẩm" : "Thêm serial sản phẩm"}
                </h3>

                <p className="mt-1 text-sm text-secondary">
                  Serial gắn với một variant cụ thể của sản phẩm.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) {
                    setFormOpen(false);
                  }
                }}
                disabled={isSubmitting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Variant ID <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  min={1}
                  value={formState.variantId}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      variantId: event.target.value,
                    })
                  }
                  disabled={isSubmitting || !!editingItem}
                  placeholder="Ví dụ: 1"
                  className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                />

                {editingItem ? (
                  <p className="mt-1.5 text-xs text-secondary">
                    Không sửa Variant ID ở chế độ chỉnh sửa.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Serial Number <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={formState.serialNumber}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      serialNumber: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  placeholder="Ví dụ: APL-IP15PM-000001"
                  className="h-12 w-full rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Trạng thái
                </label>

                <select
                  value={formState.status}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      status: event.target.value as AdminProductItemStatus,
                    })
                  }
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {PRODUCT_ITEM_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
                Schema hiện tại chỉ có serialNumber, chưa có IMEI. Vì vậy FE
                không gửi trường IMEI.
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!isSubmitting) {
                      setFormOpen(false);
                    }
                  }}
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
                      {editingItem ? "Lưu thay đổi" : "Tạo serial"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingItem ? (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4 py-6">
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
                    Ngừng sử dụng serial?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-secondary">
                    Serial{" "}
                    <span className="font-semibold text-on-surface">
                      {deletingItem.serialNumber}
                    </span>{" "}
                    sẽ được chuyển sang trạng thái Inactive, không bị xóa khỏi
                    database.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high bg-surface-container-lowest p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) {
                    setDeletingItem(null);
                  }
                }}
                disabled={isDeleting}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">
                      progress_activity
                    </span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">
                      block
                    </span>
                    Ngừng sử dụng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}