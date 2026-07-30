import { test, expect } from "../support/test";
import { loginCustomer } from "../support/auth";
import { E2E } from "../support/constants";
import { addSeedProductToCart } from "../support/shop";

test("E2E-USR-003 — Cart lifecycle", async ({ page }) => {
  await loginCustomer(page);
  await addSeedProductToCart(page);
  await page.goto("/cart");

  const productArticle = page
    .getByRole("article")
    .filter({ hasText: E2E.product.name });
  await expect(productArticle).toBeVisible();

  const increaseResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/cart/items/") &&
      response.request().method() === "PATCH",
  );
  await productArticle.getByRole("button", { name: "Tăng số lượng" }).click();
  expect((await increaseResponse).ok()).toBeTruthy();
  await expect(productArticle.getByText("2", { exact: true })).toBeVisible();
  await expect(
    page.getByText("40.000.000₫", { exact: true }).first(),
  ).toBeVisible();

  const decreaseResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/cart/items/") &&
      response.request().method() === "PATCH",
  );
  await productArticle.getByRole("button", { name: "Giảm số lượng" }).click();
  expect((await decreaseResponse).ok()).toBeTruthy();
  await expect(productArticle.getByText("1", { exact: true })).toBeVisible();

  await productArticle
    .getByRole("checkbox", { name: `Chọn ${E2E.product.name}` })
    .click();
  await expect(page.getByText("0/1 sản phẩm đã chọn")).toBeVisible();
  await productArticle
    .getByRole("checkbox", { name: `Chọn ${E2E.product.name}` })
    .click();
  await expect(page.getByText("1/1 sản phẩm đã chọn")).toBeVisible();

  await productArticle
    .getByRole("button", { name: /Xóa$/ })
    .click();
  await page
    .getByRole("button", { name: /Xóa sản phẩm$/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng đang trống" }),
  ).toBeVisible();
});
