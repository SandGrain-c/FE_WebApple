import { test, expect } from "../support/test";
import { E2E } from "../support/constants";

test("E2E-USR-002 — Catalog and product detail", async ({ page }) => {
  await page.goto(`/${E2E.category.slug}`);
  await expect(
    page.getByRole("link", { name: new RegExp(E2E.product.name) }).first(),
  ).toBeVisible();

  await page
    .getByRole("radio", { name: E2E.inStockVariant.color, exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === `/${E2E.category.slug}` &&
      url.searchParams.get("color") === E2E.inStockVariant.color,
  );
  await expect(
    page.getByRole("link", { name: new RegExp(E2E.product.name) }).first(),
  ).toBeVisible();

  await page
    .getByRole("link", { name: new RegExp(E2E.product.name) })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: E2E.product.name }),
  ).toBeVisible();
  await expect(
    page.getByText(E2E.inStockVariant.priceText, { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Còn hàng - 10 sản phẩm")).toBeVisible();

  await page
    .getByRole("button", { name: E2E.outOfStockVariant.color, exact: true })
    .click();
  await page
    .getByRole("button", { name: E2E.outOfStockVariant.capacity, exact: true })
    .click();
  await expect(
    page.getByText(E2E.outOfStockVariant.priceText, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Phiên bản này hiện đã hết hàng"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Thêm vào giỏ hàng", exact: true }),
  ).toBeDisabled();
});
