import { expect, type Page } from "@playwright/test";
import { E2E } from "./constants";

export async function loginCustomer(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Tài khoản").fill(E2E.customer.email);
  await page.getByPlaceholder("Nhập mật khẩu").fill(E2E.accountPassword);
  await page.getByRole("button", { name: /Đăng nhập$/ }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(
    page.getByText(E2E.customer.fullName, { exact: true }).first(),
  ).toBeVisible();
}

export async function loginAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Tài khoản quản trị").fill(E2E.admin.email);
  await page.getByPlaceholder("Nhập mật khẩu").fill(E2E.accountPassword);
  await page
    .getByRole("button", { name: /Đăng nhập Admin$/ })
    .click();
  await page.waitForURL((url) => url.pathname === "/admin");
  await expect(
    page.getByText(E2E.admin.fullName, { exact: true }),
  ).toBeVisible();
}

export async function readPersistedToken(
  page: Page,
  storageKey: "auth-storage" | "admin-auth-storage",
) {
  return page.evaluate((key) => {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const persisted = JSON.parse(rawValue) as {
      state?: {
        accessToken?: string | null;
        adminAccessToken?: string | null;
      };
    };

    return (
      persisted.state?.accessToken ??
      persisted.state?.adminAccessToken ??
      null
    );
  }, storageKey);
}
