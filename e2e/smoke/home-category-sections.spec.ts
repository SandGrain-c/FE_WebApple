import type { APIRequestContext } from "@playwright/test";

import { test, expect } from "../support/test";
import { E2E } from "../support/constants";

const CUSTOMER_API_URL = "http://localhost:5001/api";
const ADMIN_API_URL = "http://localhost:5002/api/admin";

const MAIN_CATEGORY_SLUGS = [
  "iphone",
  "macbook",
  "ipad",
  "apple-watch",
  "camera",
  "am-thanh",
  "imac",
  "phu-kien",
];

type PublicProductFixture = {
  categoryName: string;
  categorySlug: string;
  productName: string;
  productSlug: string;
  sku: string;
};

const IPHONE_FIXTURE: PublicProductFixture = {
  categoryName: "iPhone",
  categorySlug: "iphone",
  productName: "E2E Home iPhone",
  productSlug: "e2e-home-iphone",
  sku: "E2E-HOME-IP-128",
};

const ACCESSORY_FIXTURE: PublicProductFixture = {
  categoryName: "Phụ kiện",
  categorySlug: "phu-kien",
  productName: "E2E Home Phụ kiện",
  productSlug: "e2e-home-phu-kien",
  sku: "E2E-HOME-PK-001",
};

const MACBOOK_FIXTURE: PublicProductFixture = {
  categoryName: "MacBook",
  categorySlug: "macbook",
  productName: "E2E Home MacBook",
  productSlug: "e2e-home-macbook",
  sku: "E2E-HOME-MB-256",
};

async function adminAuthorization(request: APIRequestContext) {
  const response = await request.post(`${ADMIN_API_URL}/auth/login`, {
    data: {
      identifier: E2E.admin.email,
      password: E2E.accountPassword,
    },
  });
  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as {
    data: { accessToken: string };
  };

  return `Bearer ${body.data.accessToken}`;
}

async function createPublicProduct(
  request: APIRequestContext,
  authorization: string,
  fixture: PublicProductFixture,
) {
  const categoryResponse = await request.post(`${ADMIN_API_URL}/categories`, {
    headers: { Authorization: authorization },
    data: {
      categoryName: fixture.categoryName,
      slug: fixture.categorySlug,
      isActive: true,
    },
  });
  expect(categoryResponse.ok()).toBeTruthy();
  const category = (await categoryResponse.json()) as {
    data: { categoryId: number };
  };

  const productResponse = await request.post(`${ADMIN_API_URL}/products`, {
    headers: { Authorization: authorization },
    data: {
      categoryId: category.data.categoryId,
      name: fixture.productName,
      slug: fixture.productSlug,
      description: "Sản phẩm public cho Home category E2E.",
      isActive: true,
    },
  });
  expect(productResponse.ok()).toBeTruthy();
  const product = (await productResponse.json()) as {
    data: { productId: number };
  };

  const variantResponse = await request.post(
    `${ADMIN_API_URL}/products/${product.data.productId}/variants`,
    {
      headers: { Authorization: authorization },
      data: {
        variantName: `${fixture.productName} Variant`,
        sku: fixture.sku,
        color: "Đen E2E",
        capacity: "128GB",
        ram: "8GB",
        country: "VN",
        price: 12_000_000,
        oldPrice: 13_000_000,
        stockQuantity: 5,
      },
    },
  );
  expect(variantResponse.ok()).toBeTruthy();
}

test("Home renders public main-category sections and keeps card actions", async ({
  page,
  request,
}) => {
  const authorization = await adminAuthorization(request);
  await createPublicProduct(request, authorization, IPHONE_FIXTURE);
  await createPublicProduct(request, authorization, ACCESSORY_FIXTURE);

  const publicCatalogResponse = await request.get(
    `${CUSTOMER_API_URL}/products?category=phu-kien&page=1&limit=8&sort=newest`,
  );
  expect(publicCatalogResponse.ok()).toBeTruthy();
  const publicCatalog = (await publicCatalogResponse.json()) as {
    success: boolean;
    data: { items: Array<{ name: string }> };
  };
  expect(publicCatalog.success).toBe(true);
  expect(publicCatalog.data.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: ACCESSORY_FIXTURE.productName }),
    ]),
  );

  const requestedCategorySlugs = new Set<string>();
  page.on("request", (outgoingRequest) => {
    const url = new URL(outgoingRequest.url());
    if (
      url.origin !== "http://localhost:5001" ||
      url.pathname !== "/api/products"
    ) {
      return;
    }

    const categorySlug =
      url.searchParams.get("category") ??
      url.searchParams.get("categorySlug");
    if (categorySlug) requestedCategorySlugs.add(categorySlug);
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect([...requestedCategorySlugs]).toEqual(MAIN_CATEGORY_SLUGS);
  await expect(
    page.getByRole("heading", { name: "iPhone", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Phụ kiện", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "MacBook", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(ACCESSORY_FIXTURE.productName)).toBeVisible();

  const accessoryCard = page
    .getByRole("article")
    .filter({ hasText: ACCESSORY_FIXTURE.productName });
  await accessoryCard
    .getByRole("button", { name: "Thêm vào so sánh" })
    .click();
  await expect(
    accessoryCard.getByRole("button", { name: "Đã thêm so sánh" }),
  ).toBeVisible();

  const accessorySectionHeader = page
    .getByRole("heading", { name: "Phụ kiện", exact: true })
    .locator("../..");
  await accessorySectionHeader
    .getByRole("link", { name: "Xem tất cả" })
    .click();
  await expect(page).toHaveURL((url) => url.pathname === "/phu-kien");
});

test("Home reveals a section after its first public product is added", async ({
  page,
  request,
}) => {
  const authorization = await adminAuthorization(request);
  await createPublicProduct(request, authorization, IPHONE_FIXTURE);

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "iPhone", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "MacBook", exact: true }),
  ).toHaveCount(0);

  await createPublicProduct(request, authorization, MACBOOK_FIXTURE);
  await page.reload();

  await expect(
    page.getByRole("heading", { name: "MacBook", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(MACBOOK_FIXTURE.productName)).toBeVisible();
});

test("Home keeps successful sections when one category request fails", async ({
  page,
  request,
}) => {
  const authorization = await adminAuthorization(request);
  await createPublicProduct(request, authorization, IPHONE_FIXTURE);
  await createPublicProduct(request, authorization, ACCESSORY_FIXTURE);

  await page.route("http://localhost:5001/api/products?*", async (route) => {
    const url = new URL(route.request().url());
    const categorySlug =
      url.searchParams.get("category") ??
      url.searchParams.get("categorySlug");

    if (categorySlug === "ipad") {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "E2E category failure",
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "iPhone", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Phụ kiện", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("E2E category failure")).toHaveCount(0);
});
