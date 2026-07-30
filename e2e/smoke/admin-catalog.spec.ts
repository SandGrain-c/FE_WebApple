import { test, expect } from "../support/test";
import { loginAdmin } from "../support/auth";
import { ADMIN_CREATED } from "../support/constants";

test("E2E-ADM-002 — Category → Product → Variant", async ({
  page,
  request,
}) => {
  await loginAdmin(page);
  await page.goto("/admin/categories");
  await page
    .getByRole("button", { name: /Thêm danh mục$/ })
    .first()
    .click();
  await page.getByLabel(/Tên danh mục/).fill(ADMIN_CREATED.categoryName);
  await page.getByLabel("Slug").fill(ADMIN_CREATED.categorySlug);

  const categoryResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/categories") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: /Thêm danh mục$/ })
    .last()
    .click();
  expect((await categoryResponsePromise).ok()).toBeTruthy();
  await expect(
    page.getByText(ADMIN_CREATED.categoryName, { exact: true }),
  ).toBeVisible();

  await page.goto("/admin/products");
  await page
    .getByRole("button", { name: /Thêm sản phẩm$/ })
    .first()
    .click();
  await page
    .getByLabel(/Danh mục/)
    .selectOption({ label: ADMIN_CREATED.categoryName });
  await page.getByLabel(/Tên sản phẩm/).fill(ADMIN_CREATED.productName);
  await page.getByLabel("Slug").fill(ADMIN_CREATED.productSlug);
  await page
    .getByLabel("Mô tả")
    .fill("Product được tạo qua Playwright Full-stack E2E.");

  const productResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/products") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: /Thêm sản phẩm$/ })
    .last()
    .click();
  expect((await productResponsePromise).ok()).toBeTruthy();

  const productRow = page
    .getByRole("row")
    .filter({ hasText: ADMIN_CREATED.productName });
  await expect(productRow).toBeVisible();
  await productRow.getByRole("link", { name: "Chi tiết" }).click();

  await expect(
    page.getByText(ADMIN_CREATED.productName, { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Thêm variant$/ })
    .click();
  await page.getByLabel("Tên biến thể").fill(ADMIN_CREATED.variantName);
  await page.getByLabel(/SKU/).fill(ADMIN_CREATED.variantSku);
  await page.getByPlaceholder("Đen", { exact: true }).fill("Xanh E2E");
  await page.getByLabel("Dung lượng").fill("64GB");
  await page.getByLabel("RAM").fill("8GB");
  await page.getByLabel(/Giá bán/).fill("15000000");
  await page.getByLabel(/Tồn kho/).fill("3");

  const variantResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/products/") &&
      response.url().endsWith("/variants") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: /Thêm biến thể$/ })
    .last()
    .click();
  expect((await variantResponsePromise).ok()).toBeTruthy();
  await expect(
    page.getByText(ADMIN_CREATED.variantSku, { exact: true }),
  ).toBeVisible();

  const publicCatalogResponse = await request.get(
    `http://localhost:5001/api/products?categorySlug=${ADMIN_CREATED.categorySlug}`,
  );
  expect(publicCatalogResponse.ok()).toBeTruthy();
  const publicCatalog = await publicCatalogResponse.json();
  expect(
    publicCatalog.data.items.some(
      (item: { name: string; slug: string }) =>
        item.name === ADMIN_CREATED.productName &&
        item.slug === ADMIN_CREATED.productSlug,
    ),
  ).toBeTruthy();
});
