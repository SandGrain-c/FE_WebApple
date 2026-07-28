"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminSupplier,
  deactivateAdminSupplier,
  getAdminSuppliers,
  updateAdminSupplier,
} from "@/services/admin-supplier.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminSupplier,
  AdminSupplierSort,
  AdminSupplierStatus,
  AdminSupplierStatusFilter,
} from "@/types/admin-supplier.type";

const DEFAULT_LIMIT = 10;

const SUPPLIER_STATUS_OPTIONS: {
  label: string;
  value: AdminSupplierStatus;
}[] = [
  {
    label: "Đang hoạt động",
    value: "Active",
  },
  {
    label: "Ngừng hoạt động",
    value: "Inactive",
  },
];

const SUPPLIER_SORT_OPTIONS: {
  label: string;
  value: AdminSupplierSort;
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

type SupplierFormState = {
  supplierName: string;
  phone: string;
  email: string;
  address: string;
  status: AdminSupplierStatus;
};

type SupplierFormErrors = {
  supplierName?: string;
  phone?: string;
  email?: string;
  status?: string;
};

type SupplierModalMode = "create" | "edit";

type SupplierToastVariant = "success" | "error" | "info";

type SupplierToast = {
  id: number;
  variant: SupplierToastVariant;
  title: string;
  description?: string;
};

function getEmptySupplierFormState(): SupplierFormState {
  return {
    supplierName: "",
    phone: "",
    email: "",
    address: "",
    status: "Active",
  };
}

function mapSupplierToFormState(supplier: AdminSupplier): SupplierFormState {
  return {
    supplierName: supplier.supplierName || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    address: supplier.address || "",
    status: supplier.status || "Active",
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function validateSupplierForm(
  formState: SupplierFormState
): SupplierFormErrors {
  const errors: SupplierFormErrors = {};
  const supplierName = formState.supplierName.trim();
  const email = formState.email.trim();
  const phone = formState.phone.trim();

  if (!supplierName) {
    errors.supplierName = "Vui lòng nhập tên nhà cung cấp.";
  } else if (supplierName.length < 2) {
    errors.supplierName = "Tên nhà cung cấp cần có ít nhất 2 ký tự.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Email chưa đúng định dạng.";
  }

  if (phone && !/^[0-9+\-\s()]{8,20}$/.test(phone)) {
    errors.phone = "Số điện thoại chưa hợp lệ.";
  }

  if (!["Active", "Inactive"].includes(formState.status)) {
    errors.status = "Trạng thái không hợp lệ.";
  }

  return errors;
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

function getStatusLabel(status: AdminSupplierStatus | string) {
  return status === "Active" ? "Đang hoạt động" : "Ngừng hoạt động";
}

function getStatusClass(status: AdminSupplierStatus | string) {
  return status === "Active"
    ? "bg-green-50 text-green-700"
    : "bg-red-50 text-red-700";
}

type SupplierToastStackProps = {
  toasts: SupplierToast[];
  onClose: (id: number) => void;
};

function SupplierToastStack({ toasts, onClose }: SupplierToastStackProps) {
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

type SupplierFormModalProps = {
  open: boolean;
  mode: SupplierModalMode;
  formState: SupplierFormState;
  errors: SupplierFormErrors;
  editingSupplier: AdminSupplier | null;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (nextFormState: SupplierFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function SupplierFormModal({
  open,
  mode,
  formState,
  errors,
  editingSupplier,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: SupplierFormModalProps) {
  if (!open) {
    return null;
  }

  const title =
    mode === "create" ? "Thêm nhà cung cấp" : "Cập nhật nhà cung cấp";

  const description =
    mode === "create"
      ? "Tạo nhà cung cấp để phục vụ nghiệp vụ nhập kho."
      : `Đang sửa nhà cung cấp #${editingSupplier?.supplierId || ""}`;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(94vw,760px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Supplier Form
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
              htmlFor="supplierName"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Tên nhà cung cấp <span className="text-red-500">*</span>
            </label>

            <input
              id="supplierName"
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
              className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.supplierName
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-surface-container-high focus:border-primary focus:ring-primary/10"
              }`}
            />

            {errors.supplierName ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {errors.supplierName}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="supplierPhone"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Số điện thoại
              </label>

              <input
                id="supplierPhone"
                type="text"
                value={formState.phone}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    phone: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="0900000000"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.phone
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.phone ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.phone}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="supplierEmail"
                className="mb-1.5 block text-sm font-semibold text-on-surface"
              >
                Email
              </label>

              <input
                id="supplierEmail"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  onChange({
                    ...formState,
                    email: event.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="contact@apple-vietnam.vn"
                className={`h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-surface-container-high focus:border-primary focus:ring-primary/10"
                }`}
              />

              {errors.email ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.email}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="supplierAddress"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Địa chỉ
            </label>

            <textarea
              id="supplierAddress"
              value={formState.address}
              onChange={(event) =>
                onChange({
                  ...formState,
                  address: event.target.value,
                })
              }
              disabled={isSubmitting}
              rows={4}
              placeholder="Ví dụ: Hà Nội, Việt Nam"
              className="w-full resize-none rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                  status:
                    formState.status === "Active" ? "Inactive" : "Active",
                })
              }
              className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                formState.status === "Active"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span>{getStatusLabel(formState.status)}</span>
              <span className="material-symbols-outlined text-xl">
                {formState.status === "Active" ? "toggle_on" : "toggle_off"}
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
                  {mode === "create" ? "Thêm nhà cung cấp" : "Lưu thay đổi"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeactivateSupplierModalProps = {
  supplier: AdminSupplier | null;
  isDeactivating: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeactivateSupplierModal({
  supplier,
  isDeactivating,
  onClose,
  onConfirm,
}: DeactivateSupplierModalProps) {
  if (!supplier) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(92vw,540px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <span className="material-symbols-outlined text-2xl">
                block
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold leading-7 text-on-surface">
                Ngừng hoạt động nhà cung cấp?
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Nhà cung cấp{" "}
                <span className="font-semibold text-on-surface">
                  {supplier.supplierName}
                </span>{" "}
                sẽ được chuyển sang trạng thái Inactive.
              </p>

              <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-lg text-yellow-700">
                    warning
                  </span>

                  <p className="min-w-0 text-sm leading-6 text-yellow-800">
                    Thao tác này không xóa cứng dữ liệu. Supplier cần được giữ
                    lại vì có thể đã liên kết với lịch sử phiếu nhập kho.
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
            disabled={isDeactivating}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeactivating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeactivating ? (
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
                Xác nhận ngừng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSupplierPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminSupplierStatusFilter>("all");
  const [sort, setSort] = useState<AdminSupplierSort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SupplierModalMode>("create");
  const [editingSupplier, setEditingSupplier] =
    useState<AdminSupplier | null>(null);
  const [formState, setFormState] = useState<SupplierFormState>(
    getEmptySupplierFormState
  );
  const [formErrors, setFormErrors] = useState<SupplierFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deactivatingSupplier, setDeactivatingSupplier] =
    useState<AdminSupplier | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [toasts, setToasts] = useState<SupplierToast[]>([]);

  const activeCount = useMemo(() => {
    return suppliers.filter((supplier) => supplier.status === "Active").length;
  }, [suppliers]);

  const inactiveCount = suppliers.length - activeCount;

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: SupplierToastVariant,
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

  const fetchSuppliers = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminSuppliers(adminAccessToken, {
        search,
        page,
        limit,
        sort,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setSuppliers(data.items);
      setPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách nhà cung cấp.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, search, page, limit, sort, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function handleResetFilter() {
    setSearchDraft("");
    setSearch("");
    setStatusFilter("all");
    setSort("newest");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingSupplier(null);
    setFormState(getEmptySupplierFormState());
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(supplier: AdminSupplier) {
    setModalMode("edit");
    setEditingSupplier(supplier);
    setFormState(mapSupplierToFormState(supplier));
    setFormErrors({});
    setModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) {
      return;
    }

    setModalOpen(false);
    setEditingSupplier(null);
    setFormErrors({});
  }

  async function handleSubmitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      showToast("error", "Chưa có token Admin", "Vui lòng đăng nhập lại.");
      return;
    }

    const nextErrors = validateSupplierForm(formState);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast(
        "error",
        "Dữ liệu chưa hợp lệ",
        "Vui lòng kiểm tra lại tên, email hoặc số điện thoại."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        supplierName: formState.supplierName.trim(),
        phone: normalizeOptionalText(formState.phone),
        email: normalizeOptionalText(formState.email),
        address: normalizeOptionalText(formState.address),
        status: formState.status,
      };

      if (modalMode === "create") {
        await createAdminSupplier(adminAccessToken, payload);

        showToast(
          "success",
          "Thêm nhà cung cấp thành công",
          "Nhà cung cấp mới đã được lưu vào hệ thống."
        );
      } else {
        if (!editingSupplier) {
          throw new Error("Không tìm thấy nhà cung cấp cần cập nhật.");
        }

        await updateAdminSupplier(
          adminAccessToken,
          editingSupplier.supplierId,
          payload
        );

        showToast(
          "success",
          "Cập nhật nhà cung cấp thành công",
          "Thông tin nhà cung cấp đã được thay đổi."
        );
      }

      setModalOpen(false);
      setEditingSupplier(null);
      await fetchSuppliers();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể lưu nhà cung cấp.";

      showToast("error", "Lưu nhà cung cấp thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDeactivateSupplier() {
    if (!adminAccessToken || !deactivatingSupplier) {
      return;
    }

    try {
      setIsDeactivating(true);

      await deactivateAdminSupplier(
        adminAccessToken,
        deactivatingSupplier.supplierId
      );

      showToast(
        "success",
        "Ngừng hoạt động thành công",
        "Nhà cung cấp đã được chuyển sang trạng thái Inactive."
      );

      setDeactivatingSupplier(null);
      await fetchSuppliers();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể ngừng hoạt động nhà cung cấp.";

      showToast("error", "Thao tác thất bại", message);
    } finally {
      setIsDeactivating(false);
    }
  }

  function goToPreviousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setPage((current) => Math.min(pagination.totalPages || 1, current + 1));
  }

  return (
    <div className="space-y-6">
      <SupplierToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Supplier
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý nhà cung cấp
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Quản lý thông tin nhà cung cấp phục vụ nhập kho. Nhà cung cấp
              không bị xóa cứng, chỉ chuyển sang trạng thái ngừng hoạt động để
              giữ lịch sử phiếu nhập.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Thêm nhà cung cấp
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              Tổng theo bộ lọc
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {suppliers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Đang hoạt động
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Ngừng hoạt động
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
          className="grid gap-3 xl:grid-cols-[1fr_190px_180px_130px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>

            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm tên, số điện thoại, email nhà cung cấp..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AdminSupplierStatusFilter);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>

            {SUPPLIER_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as AdminSupplierSort);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {SUPPLIER_SORT_OPTIONS.map((option) => (
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

      <section className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách nhà cung cấp
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Tổng {pagination.totalItems} nhà cung cấp · Trang{" "}
              {pagination.page}/{pagination.totalPages || 1}
            </p>
          </div>
        </div>

        {fetchError ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {fetchError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">Nhà cung cấp</th>
                <th className="px-4 py-3 font-bold">Liên hệ</th>
                <th className="px-4 py-3 font-bold">Địa chỉ</th>
                <th className="px-4 py-3 font-bold">Ngày tạo</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
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
                      Đang tải nhà cung cấp...
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          warehouse
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có nhà cung cấp phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy thêm nhà cung cấp mới hoặc đổi bộ lọc.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.supplierId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-on-surface">
                        {supplier.supplierName}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        ID #{supplier.supplierId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-on-surface">
                        {supplier.phone || "Chưa có SĐT"}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        {supplier.email || "Chưa có email"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="line-clamp-2 max-w-[280px] text-sm leading-6 text-secondary">
                        {supplier.address || "Chưa có địa chỉ"}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-secondary">
                      {formatDateTime(supplier.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          supplier.status
                        )}`}
                      >
                        {getStatusLabel(supplier.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(supplier)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeactivatingSupplier(supplier)}
                          disabled={supplier.status === "Inactive"}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            block
                          </span>
                          Ngừng
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
            Hiển thị {suppliers.length} / {pagination.totalItems} nhà cung cấp
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousPage}
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
              onClick={goToNextPage}
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

      <SupplierFormModal
        open={modalOpen}
        mode={modalMode}
        formState={formState}
        errors={formErrors}
        editingSupplier={editingSupplier}
        isSubmitting={isSubmitting}
        onClose={closeFormModal}
        onChange={setFormState}
        onSubmit={handleSubmitSupplier}
      />

      <DeactivateSupplierModal
        supplier={deactivatingSupplier}
        isDeactivating={isDeactivating}
        onClose={() => {
          if (!isDeactivating) {
            setDeactivatingSupplier(null);
          }
        }}
        onConfirm={handleConfirmDeactivateSupplier}
      />
    </div>
  );
}