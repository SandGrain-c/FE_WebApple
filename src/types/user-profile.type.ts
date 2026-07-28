import type { AuthUser } from "@/types/auth.type";

export type UpdateUserProfilePayload = {
  fullName: string;
  email: string;
  phone: string;
};

export type UpdateUserProfileResponseData = {
  user: AuthUser;
};

export type UserProfileApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};