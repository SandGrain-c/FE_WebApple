export type ChangeUserPasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangeUserPasswordApiResponse = {
  success: boolean;
  message: string;
};