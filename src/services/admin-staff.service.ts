import type {
  AdminStaff,
  AdminStaffApiResponse,
  AdminStaffListParams,
  AdminStaffListResponseData,
  AdminStaffRole,
  CreateAdminStaffPayload,
  ResetAdminStaffPasswordPayload,
  UpdateAdminStaffPayload,
  UpdateAdminStaffRolePayload,
  UpdateAdminStaffStatusPayload,
} from "@/types/admin-staff.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

function getAuthHeaders(adminAccessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminAccessToken}`,
  };
}

async function parseAdminStaffResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<AdminStaffApiResponse<T>> {
  const result = (await response.json()) as AdminStaffApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}

function normalizeStaff(raw: any): AdminStaff {
  return {
    userId: raw.userId ?? raw.user_id ?? raw.id,
    id: raw.id ?? raw.userId ?? raw.user_id,

    userName: raw.userName ?? raw.user_name ?? "",
    fullName: raw.fullName ?? raw.full_name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? null,

    roleName: raw.roleName ?? raw.role_name ?? raw.role?.roleName ?? "",
    status: Number(raw.status ?? 1) as 0 | 1,

    citizenId: raw.citizenId ?? raw.citizen_id ?? null,
    hireDate: raw.hireDate ?? raw.hire_date ?? null,
    baseSalary:
      raw.baseSalary !== undefined
        ? Number(raw.baseSalary)
        : raw.base_salary !== undefined
          ? Number(raw.base_salary)
          : null,
    branch: raw.branch ?? null,

    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  };
}

function normalizeStaffListData(data: any): AdminStaffListResponseData {
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.staff)
      ? data.staff
      : Array.isArray(data)
        ? data
        : [];

  const pagination = data?.pagination || {
    page: 1,
    limit: items.length,
    totalItems: items.length,
    totalPages: 1,
  };

  return {
    items: items.map(normalizeStaff),
    pagination: {
      page: Number(pagination.page || 1),
      limit: Number(pagination.limit || 10),
      totalItems: Number(pagination.totalItems || pagination.total || 0),
      totalPages: Number(pagination.totalPages || 1),
    },
  };
}

function normalizeRolesData(data: any): AdminStaffRole[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.roles)) {
    return data.roles;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

export async function getAdminStaffRoles(
  adminAccessToken: string
): Promise<AdminStaffRole[]> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/staff/roles`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    cache: "no-store",
  });

  const result = await parseAdminStaffResponse<unknown>(
    response,
    "Không thể lấy danh sách role nhân viên."
  );

  return normalizeRolesData(result.data);
}

export async function getAdminStaffList(
  adminAccessToken: string,
  params: AdminStaffListParams = {}
): Promise<AdminStaffListResponseData> {
  const searchParams = new URLSearchParams();

  if (params.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.roleName) {
    searchParams.set("roleName", params.roleName);
  }

  if (params.status !== undefined) {
    searchParams.set("status", String(params.status));
  }

  searchParams.set("page", String(params.page || 1));
  searchParams.set("limit", String(params.limit || 10));

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/staff?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseAdminStaffResponse<unknown>(
    response,
    "Không thể lấy danh sách nhân viên."
  );

  return normalizeStaffListData(result.data);
}

export async function createAdminStaff(
  adminAccessToken: string,
  payload: CreateAdminStaffPayload
): Promise<AdminStaff> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/staff`, {
    method: "POST",
    headers: getAuthHeaders(adminAccessToken),
    body: JSON.stringify(payload),
  });

  const result = await parseAdminStaffResponse<unknown>(
    response,
    "Không thể tạo nhân viên."
  );

  return normalizeStaff(result.data);
}

export async function updateAdminStaff(
  adminAccessToken: string,
  staffId: number,
  payload: UpdateAdminStaffPayload
): Promise<AdminStaff> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/staff/${staffId}`, {
    method: "PATCH",
    headers: getAuthHeaders(adminAccessToken),
    body: JSON.stringify(payload),
  });

  const result = await parseAdminStaffResponse<unknown>(
    response,
    "Không thể cập nhật nhân viên."
  );

  return normalizeStaff(result.data);
}

export async function updateAdminStaffStatus(
  adminAccessToken: string,
  staffId: number,
  payload: UpdateAdminStaffStatusPayload
): Promise<AdminStaff> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/staff/${staffId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(adminAccessToken),
    body: JSON.stringify(payload),
  });

  const result = await parseAdminStaffResponse<unknown>(
    response,
    "Không thể cập nhật trạng thái nhân viên."
  );

  return normalizeStaff(result.data);
}

export async function updateAdminStaffRole(
  adminAccessToken: string,
  staffId: number,
  payload: UpdateAdminStaffRolePayload
): Promise<AdminStaff> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/staff/${staffId}/role`, {
    method: "PATCH",
    headers: getAuthHeaders(adminAccessToken),
    body: JSON.stringify(payload),
  });

  const result = await parseAdminStaffResponse<unknown>(
    response,
    "Không thể đổi role nhân viên."
  );

  return normalizeStaff(result.data);
}

export async function resetAdminStaffPassword(
  adminAccessToken: string,
  staffId: number,
  payload: ResetAdminStaffPasswordPayload
): Promise<void> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/staff/${staffId}/password`,
    {
      method: "PATCH",
      headers: getAuthHeaders(adminAccessToken),
      body: JSON.stringify(payload),
    }
  );

  await parseAdminStaffResponse<unknown>(
    response,
    "Không thể reset mật khẩu nhân viên."
  );
}