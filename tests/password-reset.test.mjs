import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { readFileSync } from "node:fs";

import {
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  validateForgotPasswordEmail,
  validateResetPasswordForm,
} from "../src/lib/auth/password-reset.ts";
import {
  forgotPassword,
  resetPassword,
} from "../src/services/auth.service.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("Login links Customer users to /forgot-password", () => {
  const loginSource = readFileSync(
    new URL("../src/components/auth/LoginPageClient.tsx", import.meta.url),
    "utf8",
  );

  assert.match(loginSource, /href="\/forgot-password"/);
  assert.doesNotMatch(loginSource, /handleForgotPassword/);
});

test("forgot-password validation accepts normalized email and rejects invalid input", () => {
  assert.equal(validateForgotPasswordEmail(" customer@example.com "), null);
  assert.equal(validateForgotPasswordEmail(""), "Vui lòng nhập email.");
  assert.equal(
    validateForgotPasswordEmail("not-an-email"),
    "Email không hợp lệ.",
  );
  assert.match(FORGOT_PASSWORD_SUCCESS_MESSAGE, /Nếu email tồn tại/);
});

test("reset-password validation enforces the shared minimum and confirmation", () => {
  assert.deepEqual(
    validateResetPasswordForm({
      newPassword: "12345",
      confirmPassword: "different",
    }),
    {
      newPassword: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      confirmPassword: "Xác nhận mật khẩu mới không khớp.",
    },
  );
  assert.deepEqual(
    validateResetPasswordForm({
      newPassword: "NewPassword!2026",
      confirmPassword: "NewPassword!2026",
    }),
    {},
  );
});

test("forgotPassword calls the Customer auth endpoint and returns its generic message", async () => {
  let capturedRequest;
  globalThis.fetch = async (input, init) => {
    capturedRequest = { input: String(input), init };
    return new Response(
      JSON.stringify({
        success: true,
        message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const result = await forgotPassword({ email: "customer@example.com" });

  assert.match(capturedRequest.input, /\/api\/auth\/forgot-password$/);
  assert.equal(capturedRequest.init.method, "POST");
  assert.deepEqual(JSON.parse(capturedRequest.init.body), {
    email: "customer@example.com",
  });
  assert.equal(result.message, FORGOT_PASSWORD_SUCCESS_MESSAGE);
});

test("resetPassword sends token only in the request body and surfaces API errors", async () => {
  let capturedRequest;
  globalThis.fetch = async (input, init) => {
    capturedRequest = { input: String(input), init };
    return new Response(
      JSON.stringify({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  await assert.rejects(
    resetPassword({
      token: "raw-test-token",
      newPassword: "NewPassword!2026",
      confirmPassword: "NewPassword!2026",
    }),
    /Token không hợp lệ hoặc đã hết hạn/,
  );

  assert.match(capturedRequest.input, /\/api\/auth\/reset-password$/);
  assert.doesNotMatch(capturedRequest.input, /raw-test-token/);
  assert.equal(
    JSON.parse(capturedRequest.init.body).token,
    "raw-test-token",
  );
});
