import { expect, type Page } from "@playwright/test";
import { E2E } from "./constants";

export function productDetailPath() {
  return `/${E2E.category.slug}/${E2E.product.slug}`;
}

export async function addSeedProductToCart(page: Page) {
  await page.goto(productDetailPath());
  await expect(
    page.getByRole("heading", { level: 1, name: E2E.product.name }),
  ).toBeVisible();

  const addResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/cart/items") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  const addResponse = await addResponsePromise;

  expect(addResponse.ok()).toBeTruthy();
}
