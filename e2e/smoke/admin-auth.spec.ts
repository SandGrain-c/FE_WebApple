import { test, expect } from "../support/test";
import { loginAdmin, readPersistedToken } from "../support/auth";
import { E2E } from "../support/constants";

test("E2E-ADM-001 — Admin authentication and guard", async ({ page }) => {
  await loginAdmin(page);
  await expect(
    page.getByText("Quản trị hệ thống bán hàng", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(E2E.admin.fullName, { exact: true }),
  ).toBeVisible();
  expect(await readPersistedToken(page, "admin-auth-storage")).toBeTruthy();

  await expect(page.getByRole("link", { name: /Nhân viên/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Danh mục/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sản phẩm/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Kho hàng/ })).toBeVisible();

  await page.getByRole("button", { name: /Đăng xuất$/ }).click();
  await page.waitForURL((url) => url.pathname === "/admin/login");
  await expect
    .poll(() => readPersistedToken(page, "admin-auth-storage"))
    .toBeNull();

  await page.goto("/admin/categories");
  await page.waitForURL(
    (url) =>
      url.pathname === "/admin/login" &&
      url.searchParams.get("redirect") === "/admin/categories",
  );
});
