export type AdminStaffRoleName = "Admin" | "Staff" | "WarehouseStaff";

export type AdminStaffStatus = 0 | 1;

export type AdminStaffRole = {
  roleName: AdminStaffRoleName | string;
  label?: string;
  permissions?: string[];
};

export type AdminStaff = {
  userId: number;
  id?: number;

  userName: string;
  fullName: string;
  email: string;
  phone: string | null;

  roleName: AdminStaffRoleName | string;
  status: AdminStaffStatus;

  citizenId?: string | null;
  hireDate?: string | null;
  baseSalary?: number | null;
  branch?: string | null;

  createdAt?: string;
  updatedAt?: string | null;
};

export type AdminStaffPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminStaffListParams = {
  q?: string;
  roleName?: string;
  status?: AdminStaffStatus;
  page?: number;
  limit?: number;
};

export type AdminStaffListResponseData = {
  items: AdminStaff[];
  pagination: AdminStaffPagination;
};

export type CreateAdminStaffPayload = {
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roleName: AdminStaffRoleName | string;
  status: AdminStaffStatus;
  citizenId?: string;
  hireDate?: string;
  baseSalary?: number;
  branch?: string;
};

export type UpdateAdminStaffPayload = Partial<{
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  citizenId: string;
  hireDate: string;
  baseSalary: number;
  branch: string;
}>;

export type UpdateAdminStaffStatusPayload = {
  status: AdminStaffStatus;
};

export type UpdateAdminStaffRolePayload = {
  roleName: AdminStaffRoleName | string;
};

export type ResetAdminStaffPasswordPayload = {
  newPassword: string;
  confirmPassword: string;
};

export type AdminStaffApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};