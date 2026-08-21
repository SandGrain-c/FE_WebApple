export type UserRole =
  | "Admin"
  | "Customer"
  | "Staff"
  | "SaleStaff"
  | "WarehouseStaff"
  | "AfterSalesStaff";

export type AuthUser = {
  id: number;
  userName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type RegisterPayload = {
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginResponseData = {
  user: AuthUser;
  accessToken: string;
};

export type RegisterResponseData = {
  user: AuthUser;
  accessToken: string;
};

export type GetMeResponseData = {
  user: AuthUser;
};

export type LogoutResponseData = null;

export type AuthMessageResponse = {
  success: boolean;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
