"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminStaff,
  getAdminStaffList,
  getAdminStaffRoles,
  resetAdminStaffPassword,
  updateAdminStaff,
  updateAdminStaffRole,
  updateAdminStaffStatus,
} from "@/services/admin-staff.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminStaff,
  AdminStaffRole,
  AdminStaffStatus,
  CreateAdminStaffPayload,
} from "@/types/admin-staff.type";

const DEFAULT_LIMIT = 10;

type ToastType = "success" | "error" | "info";

type StaffFormState = {
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roleName: string;
  status: AdminStaffStatus;
  citizenId: string;
  hireDate: string;
  baseSalary: string;
  branch: string;
};

function getEmptyFormState(): StaffFormState {
  return {
    userName: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleName: "Staff",
    status: 1,
    citizenId: "",
    hireDate: "",
    baseSalary: "",
    branch: "",
  };
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toLocaleString("vi-VN")}₫`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function getStaffId(staff: AdminStaff) {
  return staff.userId || staff.id || 0;
}

export default function AdminStaffPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [roles, setRoles] = useState<AdminStaffRole[]>([]);
  const [staffList, setStaffList] = useState<AdminStaff[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminStaff | null>(null);
  const [formState, setFormState] = useState<StaffFormState>(
    getEmptyFormState
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [roleStaff, setRoleStaff] = useState<AdminStaff | null>(null);
  const [nextRoleName, setNextRoleName] = useState("Staff");
  const [isChangingRole, setIsChangingRole] = useState(false);

  const [passwordStaff, setPasswordStaff] = useState<AdminStaff | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [toast, setToast] = useState<{
    type: ToastType;
    title: string;
    description?: string;
  } | null>(null);

  const summary = useMemo(() => {
    return {
      total: staffList.length,
      active: staffList.filter((staff) => staff.status === 1).length,
      locked: staffList.filter((staff) => staff.status === 0).length,
      warehouse: staffList.filter(
        (staff) => staff.roleName === "WarehouseStaff"
      ).length,
    };
  }, [staffList]);

  function showToast(type: ToastType, title: string, description?: string) {
    setToast({
      type,
      title,
      description,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  const fetchRoles = useCallback(async () => {
    if (!adminAccessToken) return;

    try {
      const data = await getAdminStaffRoles(adminAccessToken);
      setRoles(data);
    } catch {
      setRoles([
        { roleName: "Admin" },
        { roleName: "Staff" },
        { roleName: "WarehouseStaff" },
      ]);
    }
  }, [adminAccessToken]);

  const fetchStaffList = useCallback(async () => {
    if (!adminAccessToken) return;

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminStaffList(adminAccessToken, {
        q: search,
        roleName: roleFilter === "all" ? undefined : roleFilter,
        status:
          statusFilter === "all"
            ? undefined
            : (Number(statusFilter) as AdminStaffStatus),
        page,
        limit,
      });

      setStaffList(data.items);
      setPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách nhân viên.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [
    adminAccessToken,
    search,
    roleFilter,
    statusFilter,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function handleResetFilter() {
    setSearchDraft("");
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  function openCreateForm() {
    setEditingStaff(null);
    setFormState(getEmptyFormState());
    setFormOpen(true);
  }

  function openEditForm(staff: AdminStaff) {
    setEditingStaff(staff);
    setFormState({
      userName: staff.userName || "",
      fullName: staff.fullName || "",
      email: staff.email || "",
      phone: staff.phone || "",
      password: "",
      roleName: staff.roleName || "Staff",
      status: staff.status,
      citizenId: staff.citizenId || "",
      hireDate: staff.hireDate ? staff.hireDate.slice(0, 10) : "",
      baseSalary: staff.baseSalary ? String(staff.baseSalary) : "",
      branch: staff.branch || "",
    });
    setFormOpen(true);
  }

  function buildCreatePayload(): CreateAdminStaffPayload | null {
    if (!formState.userName.trim()) {
      showToast("error", "Thiếu tên đăng nhập", "Vui lòng nhập userName.");
      return null;
    }

    if (!formState.fullName.trim()) {
      showToast("error", "Thiếu họ tên", "Vui lòng nhập họ tên nhân viên.");
      return null;
    }

    if (!formState.email.trim()) {
      showToast("error", "Thiếu email", "Vui lòng nhập email.");
      return null;
    }

    if (!editingStaff && !formState.password.trim()) {
      showToast("error", "Thiếu mật khẩu", "Vui lòng nhập mật khẩu.");
      return null;
    }

    return {
      userName: formState.userName.trim(),
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      password: formState.password.trim(),
      roleName: formState.roleName,
      status: formState.status,
      citizenId: formState.citizenId.trim() || undefined,
      hireDate: formState.hireDate || undefined,
      baseSalary: formState.baseSalary
        ? Number(formState.baseSalary)
        : undefined,
      branch: formState.branch.trim() || undefined,
    };
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) return;

    try {
      setIsSubmitting(true);

      if (editingStaff) {
        await updateAdminStaff(adminAccessToken, getStaffId(editingStaff), {
          userName: formState.userName.trim(),
          fullName: formState.fullName.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
          citizenId: formState.citizenId.trim() || undefined,
          hireDate: formState.hireDate || undefined,
          baseSalary: formState.baseSalary
            ? Number(formState.baseSalary)
            : undefined,
          branch: formState.branch.trim() || undefined,
        });

        showToast("success", "Cập nhật nhân viên thành công");
      } else {
        const payload = buildCreatePayload();

        if (!payload) {
          setIsSubmitting(false);
          return;
        }

        await createAdminStaff(adminAccessToken, payload);

        showToast("success", "Tạo nhân viên thành công");
      }

      setFormOpen(false);
      setEditingStaff(null);
      setFormState(getEmptyFormState());

      await fetchStaffList();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu nhân viên.";

      showToast("error", "Lưu thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(staff: AdminStaff) {
    if (!adminAccessToken) return;

    const nextStatus: AdminStaffStatus = staff.status === 1 ? 0 : 1;

    try {
      await updateAdminStaffStatus(adminAccessToken, getStaffId(staff), {
        status: nextStatus,
      });

      showToast(
        "success",
        nextStatus === 1 ? "Đã mở khóa nhân viên" : "Đã khóa nhân viên"
      );

      await fetchStaffList();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái nhân viên.";

      showToast("error", "Cập nhật thất bại", message);
    }
  }

  function openRoleModal(staff: AdminStaff) {
    setRoleStaff(staff);
    setNextRoleName(staff.roleName || "Staff");
  }

  async function handleConfirmChangeRole() {
    if (!adminAccessToken || !roleStaff) return;

    try {
      setIsChangingRole(true);

      await updateAdminStaffRole(adminAccessToken, getStaffId(roleStaff), {
        roleName: nextRoleName,
      });

      showToast("success", "Đổi role nhân viên thành công");

      setRoleStaff(null);
      await fetchStaffList();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể đổi role nhân viên.";

      showToast("error", "Đổi role thất bại", message);
    } finally {
      setIsChangingRole(false);
    }
  }

  function openPasswordModal(staff: AdminStaff) {
    setPasswordStaff(staff);
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleConfirmResetPassword() {
    if (!adminAccessToken || !passwordStaff) return;

    if (!newPassword.trim()) {
      showToast("error", "Thiếu mật khẩu mới");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "Xác nhận mật khẩu không khớp");
      return;
    }

    try {
      setIsResettingPassword(true);

      await resetAdminStaffPassword(
        adminAccessToken,
        getStaffId(passwordStaff),
        {
          newPassword,
          confirmPassword,
        }
      );

      showToast("success", "Reset mật khẩu thành công");

      setPasswordStaff(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể reset mật khẩu.";

      showToast("error", "Reset mật khẩu thất bại", message);
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed inset-x-4 top-5 z-9999 mx-auto max-w-xl rounded-2xl border border-surface-container-high bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,0.18)]">
          <div className="flex items-start gap-3">
            <span
              className={`material-symbols-outlined text-2xl ${
                toast.type === "success"
                  ? "text-green-600"
                  : toast.type === "error"
                    ? "text-red-600"
                    : "text-primary"
              }`}
            >
              {toast.type === "success"
                ? "check_circle"
                : toast.type === "error"
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
              Admin Staff
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý nhân viên
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Tạo tài khoản nhân viên, phân quyền, khóa/mở khóa và reset mật
              khẩu cho nhân viên quản trị hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            Thêm nhân viên
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              Tổng nhân viên
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Đang hoạt động
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {summary.active}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Bị khóa
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {summary.locked}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Nhân viên kho
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {summary.warehouse}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-surface-container-high bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[1fr_220px_180px_130px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>

            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm username, email, tên nhân viên..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả role</option>
            {roles.map((role) => (
              <option key={role.roleName} value={role.roleName}>
                {role.label || role.roleName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | "0" | "1");
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Bị khóa</option>
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
              Danh sách nhân viên
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Tổng {pagination.totalItems} nhân viên · Trang {pagination.page}/
              {pagination.totalPages || 1}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchStaffList}
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
          <table className="w-full min-w-280 text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">Nhân viên</th>
                <th className="px-4 py-3 font-bold">Liên hệ</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Chi nhánh</th>
                <th className="px-4 py-3 font-bold">Lương</th>
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
                      Đang tải nhân viên...
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="font-bold text-on-surface">
                      Chưa có nhân viên phù hợp
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      Hãy tạo tài khoản nhân viên mới.
                    </p>
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr
                    key={getStaffId(staff)}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-on-surface">
                        {staff.fullName}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        @{staff.userName} · ID #{getStaffId(staff)}
                      </p>
                      {staff.citizenId ? (
                        <p className="mt-1 text-xs text-secondary">
                          CCCD: {staff.citizenId}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-on-surface">
                        {staff.email}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        {staff.phone || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {staff.roleName}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-on-surface">
                        {staff.branch || "—"}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        Ngày vào: {formatDate(staff.hireDate)}
                      </p>
                    </td>

                    <td className="px-4 py-4 font-semibold text-on-surface">
                      {formatMoney(staff.baseSalary)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          staff.status === 1
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {staff.status === 1 ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(staff)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => openRoleModal(staff)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-blue-200 px-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            admin_panel_settings
                          </span>
                          Role
                        </button>

                        <button
                          type="button"
                          onClick={() => openPasswordModal(staff)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-yellow-200 px-3 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            password
                          </span>
                          Mật khẩu
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff)}
                          className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition ${
                            staff.status === 1
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {staff.status === 1 ? "lock" : "lock_open"}
                          </span>
                          {staff.status === 1 ? "Khóa" : "Mở"}
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

      {formOpen ? (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="max-h-[92vh] w-[min(94vw,720px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-surface-container-high p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Staff Form
                </p>
                <h3 className="mt-1 text-xl font-bold text-on-surface">
                  {editingStaff ? "Sửa nhân viên" : "Thêm nhân viên"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => !isSubmitting && setFormOpen(false)}
                disabled={isSubmitting}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={formState.userName}
                  onChange={(event) =>
                    setFormState({ ...formState, userName: event.target.value })
                  }
                  disabled={isSubmitting || !!editingStaff}
                  placeholder="userName"
                  className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                />

                <input
                  value={formState.fullName}
                  onChange={(event) =>
                    setFormState({ ...formState, fullName: event.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder="Họ tên"
                  className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                />

                <input
                  value={formState.email}
                  onChange={(event) =>
                    setFormState({ ...formState, email: event.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder="Email"
                  className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                />

                <input
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState({ ...formState, phone: event.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder="Số điện thoại"
                  className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                />

                {!editingStaff ? (
                  <input
                    type="password"
                    value={formState.password}
                    onChange={(event) =>
                      setFormState({
                        ...formState,
                        password: event.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    placeholder="Mật khẩu"
                    className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                  />
                ) : null}

                <select
                  value={formState.roleName}
                  onChange={(event) =>
                    setFormState({ ...formState, roleName: event.target.value })
                  }
                  disabled={isSubmitting || !!editingStaff}
                  className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none focus:border-primary"
                >
                  {roles.map((role) => (
                    <option key={role.roleName} value={role.roleName}>
                      {role.label || role.roleName}
                    </option>
                  ))}
                </select>

                <input
                  value={formState.citizenId}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      citizenId: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  placeholder="CCCD"
                  className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                />

                <input
                  type="date"
                  value={formState.hireDate}
                  onChange={(event) =>
                    setFormState({ ...formState, hireDate: event.target.value })
                  }
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                />

                <input
                  type="number"
                  value={formState.baseSalary}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      baseSalary: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  placeholder="Lương cơ bản"
                  className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                />

                <input
                  value={formState.branch}
                  onChange={(event) =>
                    setFormState({ ...formState, branch: event.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder="Chi nhánh"
                  className="h-12 rounded-2xl border border-surface-container-high px-4 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-surface-container-high pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={isSubmitting}
                  className="h-11 rounded-2xl border px-5 text-sm font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {roleStaff ? (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4">
          <div className="w-[min(92vw,480px)] rounded-[28px] bg-white p-5 shadow-xl">
            <h3 className="text-xl font-bold text-on-surface">Đổi role</h3>
            <p className="mt-1 text-sm text-secondary">
              Nhân viên: {roleStaff.fullName}
            </p>

            <select
              value={nextRoleName}
              onChange={(event) => setNextRoleName(event.target.value)}
              className="mt-4 h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4"
            >
              {roles.map((role) => (
                <option key={role.roleName} value={role.roleName}>
                  {role.label || role.roleName}
                </option>
              ))}
            </select>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRoleStaff(null)}
                disabled={isChangingRole}
                className="h-11 rounded-2xl border px-5 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmChangeRole}
                disabled={isChangingRole}
                className="h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary"
              >
                {isChangingRole ? "Đang đổi..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {passwordStaff ? (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4">
          <div className="w-[min(92vw,480px)] rounded-[28px] bg-white p-5 shadow-xl">
            <h3 className="text-xl font-bold text-on-surface">
              Reset mật khẩu
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Nhân viên: {passwordStaff.fullName}
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Mật khẩu mới"
                className="h-12 w-full rounded-2xl border border-surface-container-high px-4"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                className="h-12 w-full rounded-2xl border border-surface-container-high px-4"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPasswordStaff(null)}
                disabled={isResettingPassword}
                className="h-11 rounded-2xl border px-5 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmResetPassword}
                disabled={isResettingPassword}
                className="h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary"
              >
                {isResettingPassword ? "Đang reset..." : "Reset mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}