export const PASSWORD_MIN_LENGTH = 6;
export const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateForgotPasswordEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return "Vui lòng nhập email.";
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return "Email không hợp lệ.";
  }

  return null;
}

export type ResetPasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

export type ResetPasswordFormErrors = Partial<
  Record<keyof ResetPasswordForm, string>
>;

export function validateResetPasswordForm(
  form: ResetPasswordForm
): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {};

  if (!form.newPassword.trim()) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (form.newPassword.trim().length < PASSWORD_MIN_LENGTH) {
    errors.newPassword = `Mật khẩu mới phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`;
  }

  if (!form.confirmPassword.trim()) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
  } else if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = "Xác nhận mật khẩu mới không khớp.";
  }

  return errors;
}
