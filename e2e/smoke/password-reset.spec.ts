import { test, expect } from "@playwright/test";

const GENERIC_MESSAGE =
  "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.";

test("Customer Login links to the Forgot Password page", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Quên mật khẩu?" }).click();

  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(
    page.getByRole("heading", { name: "Quên mật khẩu?" }),
  ).toBeVisible();
});

test("Forgot Password submits with loading and always renders the generic success", async ({
  page,
}) => {
  let releaseRequest: () => void = () => undefined;
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.route("**/api/auth/forgot-password", async (route) => {
    await requestGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: GENERIC_MESSAGE }),
    });
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("customer@example.com");
  await page
    .getByRole("button", { name: "Gửi liên kết đặt lại mật khẩu" })
    .click();

  await expect(
    page.getByRole("button", { name: "Đang gửi hướng dẫn..." }),
  ).toBeDisabled();
  releaseRequest();

  await expect(page.getByRole("status")).toContainText(
    "Nếu email tồn tại trong hệ thống",
  );
});

test("Forgot Password displays a safe API failure", async ({ page }) => {
  await page.route("**/api/auth/forgot-password", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Không thể gửi hướng dẫn lúc này.",
      }),
    });
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("customer@example.com");
  await page
    .getByRole("button", { name: "Gửi liên kết đặt lại mật khẩu" })
    .click();

  await expect(
    page.getByText("Không thể gửi hướng dẫn lúc này.", { exact: true }),
  ).toBeVisible();
});

test("Reset Password handles a missing token and local password validation", async ({
  page,
}) => {
  await page.goto("/reset-password");
  await expect(
    page.getByText("Link đặt lại mật khẩu không hợp lệ.", { exact: true }),
  ).toBeVisible();

  await page.goto("/reset-password?token=test-token");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("12345");
  await page
    .getByLabel("Xác nhận mật khẩu mới", { exact: true })
    .fill("different");
  await page.getByRole("button", { name: "Đặt lại mật khẩu" }).click();

  await expect(page.getByText("Mật khẩu mới phải có ít nhất 6 ký tự.")).toBeVisible();
  await expect(
    page.getByText("Xác nhận mật khẩu mới không khớp."),
  ).toBeVisible();
});

test("Reset Password submits successfully and redirects to Login without persisting the token", async ({
  page,
}) => {
  let requestBody: Record<string, string> | null = null;
  await page.route("**/api/auth/reset-password", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Mật khẩu đã được đặt lại thành công",
      }),
    });
  });

  await page.goto("/reset-password?token=test-raw-token");
  await page
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill("NewPassword!2026");
  await page
    .getByLabel("Xác nhận mật khẩu mới", { exact: true })
    .fill("NewPassword!2026");
  await page.getByRole("button", { name: "Đặt lại mật khẩu" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Mật khẩu được cập nhật thành công.",
  );
  expect(requestBody).toEqual({
    token: "test-raw-token",
    newPassword: "NewPassword!2026",
    confirmPassword: "NewPassword!2026",
  });
  await expect(page).toHaveURL(/\/login\?passwordReset=success$/);
  await expect(page.getByRole("status")).toContainText(
    "Mật khẩu đã được đặt lại. Vui lòng đăng nhập.",
  );

  expect(
    await page.evaluate(() => window.localStorage.getItem("resetToken")),
  ).toBeNull();
});

test("Reset Password displays invalid or expired token errors from the API", async ({
  page,
}) => {
  await page.route("**/api/auth/reset-password", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      }),
    });
  });

  await page.goto("/reset-password?token=expired-token");
  await page
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill("NewPassword!2026");
  await page
    .getByLabel("Xác nhận mật khẩu mới", { exact: true })
    .fill("NewPassword!2026");
  await page.getByRole("button", { name: "Đặt lại mật khẩu" }).click();

  await expect(
    page.getByText("Token không hợp lệ hoặc đã hết hạn", { exact: true }),
  ).toBeVisible();
});
