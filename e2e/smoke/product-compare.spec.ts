import type { APIRequestContext, Page } from "@playwright/test";

import { test, expect } from "../support/test";
import { COMPARE_CREATED, E2E } from "../support/constants";
import { resetE2EDatabase } from "../support/database";

type CompareStorageItem = {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  categorySlug: string;
  categoryName: string;
};

test.afterEach(() => {
  resetE2EDatabase();
});

async function seedSecondCompareProduct(request: APIRequestContext) {
  const loginResponse = await request.post(
    "http://localhost:5002/api/admin/auth/login",
    {
      data: {
        identifier: E2E.admin.email,
        password: E2E.accountPassword,
      },
    },
  );
  expect(loginResponse.ok()).toBeTruthy();
  const loginBody = (await loginResponse.json()) as {
    data: { accessToken: string };
  };
  const authorization = `Bearer ${loginBody.data.accessToken}`;

  const categoriesResponse = await request.get(
    "http://localhost:5002/api/admin/categories?limit=100",
    { headers: { Authorization: authorization } },
  );
  expect(categoriesResponse.ok()).toBeTruthy();
  const categoriesBody = (await categoriesResponse.json()) as {
    data: { items: Array<{ categoryId: number; slug: string }> };
  };
  const category = categoriesBody.data.items.find(
    (item) => item.slug === E2E.category.slug,
  );
  expect(category).toBeTruthy();

  const productResponse = await request.post(
    "http://localhost:5002/api/admin/products",
    {
      headers: { Authorization: authorization },
      data: {
        categoryId: category?.categoryId,
        name: COMPARE_CREATED.productName,
        slug: COMPARE_CREATED.productSlug,
        description: "Sản phẩm thứ hai cho E2E compare.",
        isActive: true,
      },
    },
  );
  expect(productResponse.ok()).toBeTruthy();
  const productBody = (await productResponse.json()) as {
    data: { productId: number };
  };

  const variantResponse = await request.post(
    `http://localhost:5002/api/admin/products/${productBody.data.productId}/variants`,
    {
      headers: { Authorization: authorization },
      data: {
        variantName: COMPARE_CREATED.variantName,
        sku: COMPARE_CREATED.variantSku,
        color: "Xanh E2E",
        capacity: "256GB",
        ram: "8GB",
        country: "VN",
        price: 21_000_000,
        oldPrice: 23_000_000,
        stockQuantity: 5,
      },
    },
  );
  expect(variantResponse.ok()).toBeTruthy();
}

function productCard(page: Page, productName: string) {
  return page.getByRole("article").filter({ hasText: productName });
}

test("E2E-USR-005 — compare products persists and stays synchronized", async ({
  page,
  request,
}) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await seedSecondCompareProduct(request);
  await page.goto(`/${E2E.category.slug}`);

  const firstProductCard = productCard(page, E2E.product.name);
  const secondProductCard = productCard(page, COMPARE_CREATED.productName);
  await expect(firstProductCard).toBeVisible();
  await expect(secondProductCard).toBeVisible();

  await firstProductCard
    .getByRole("button", { name: "Thêm vào so sánh" })
    .click();
  await secondProductCard
    .getByRole("button", { name: "Thêm vào so sánh" })
    .click();

  await page.getByRole("button", { name: "Mở thanh so sánh" }).click();
  await page.getByRole("link", { name: "So sánh ngay" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/compare");

  await expect(
    page.getByRole("heading", { name: E2E.product.name }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: COMPARE_CREATED.productName }),
  ).toBeVisible();
  await expect(page.getByText("Đen E2E · 128GB · 8GB")).toBeVisible();

  await page
    .getByRole("button", {
      name: `Xóa ${COMPARE_CREATED.productName} khỏi trang so sánh`,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: COMPARE_CREATED.productName }),
  ).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: E2E.product.name }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: COMPARE_CREATED.productName }),
  ).toHaveCount(0);

  await page.goto(`/${E2E.category.slug}`);
  await expect(
    productCard(page, E2E.product.name).getByRole("button", {
      name: "Đã thêm so sánh",
    }),
  ).toBeVisible();
  await expect(
    productCard(page, COMPARE_CREATED.productName).getByRole("button", {
      name: "Thêm vào so sánh",
    }),
  ).toBeVisible();

  await page.goto("/compare");
  await page.getByRole("button", { name: "Xóa tất cả" }).click();
  await expect(
    page.getByRole("heading", { name: "Chưa có sản phẩm để so sánh" }),
  ).toBeVisible();
  const persistedItems = await page.evaluate(() => {
    const persistedValue = window.localStorage.getItem("apple-store-compare");
    if (!persistedValue) return [];

    return (
      JSON.parse(persistedValue) as {
        state?: { items?: unknown[] };
      }
    ).state?.items ?? [];
  });
  expect(persistedItems).toHaveLength(0);
  expect(hydrationErrors).toEqual([]);
});

test("E2E-USR-006 — stale product does not break compare on mobile", async ({
  page,
  request,
}) => {
  const productResponse = await request.get(
    `http://localhost:5001/api/products/${E2E.category.slug}/${E2E.product.slug}`,
  );
  expect(productResponse.ok()).toBeTruthy();
  const productBody = (await productResponse.json()) as {
    data: {
      product: {
        id: number;
        name: string;
        slug: string;
        price: number;
        categorySlug: string;
        categoryName: string;
        images: Array<{ imageUrl: string }>;
      };
    };
  };
  const product = productBody.data.product;
  const items: CompareStorageItem[] = [
    {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.imageUrl ?? "/sale/flash-sale-1.webp",
      price: product.price,
      categorySlug: product.categorySlug,
      categoryName: product.categoryName,
    },
    {
      id: 999_999,
      name: "Sản phẩm không còn tồn tại",
      slug: "missing-product",
      image: "/sale/flash-sale-1.webp",
      price: 0,
      categorySlug: product.categorySlug,
      categoryName: product.categoryName,
    },
  ];

  await page.addInitScript((storedItems: CompareStorageItem[]) => {
    window.localStorage.setItem(
      "apple-store-compare",
      JSON.stringify({
        state: {
          categorySlug: storedItems[0]?.categorySlug ?? null,
          items: storedItems,
        },
        version: 0,
      }),
    );
  }, items);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/compare");

  await expect(
    page.getByRole("heading", { name: E2E.product.name }),
  ).toBeVisible();
  await expect(
    page.getByText("Sản phẩm không còn tồn tại hoặc đã ngừng bán."),
  ).toBeVisible();
  await expect(
    page.getByText("Các sản phẩm này chưa có thông số kỹ thuật từ API."),
  ).toBeVisible();

  const isHorizontallyScrollable = await page
    .getByTestId("compare-table-scroll")
    .evaluate((element) => element.scrollWidth > element.clientWidth);
  expect(isHorizontallyScrollable).toBeTruthy();

  await page
    .getByRole("button", {
      name: "Xóa Sản phẩm không còn tồn tại khỏi trang so sánh",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: E2E.product.name }),
  ).toBeVisible();
});

test("E2E-USR-007 — specification rows align differing API data", async ({
  page,
}) => {
  const items: CompareStorageItem[] = [
    {
      id: 101,
      name: "Compare Spec A",
      slug: "compare-spec-a",
      image: "/products/iphone/iphone-15-plus.png",
      price: 10_000_000,
      categorySlug: "spec-test",
      categoryName: "Spec Test",
    },
    {
      id: 102,
      name: "Compare Spec B",
      slug: "compare-spec-b",
      image: "/products/iphone/iphone-15-plus.png",
      price: 12_000_000,
      categorySlug: "spec-test",
      categoryName: "Spec Test",
    },
  ];

  await page.route("**/api/products/spec-test/**", async (route) => {
    const isProductA = route.request().url().endsWith("compare-spec-a");
    const item = isProductA ? items[0] : items[1];
    const specifications = isProductA
      ? [
          {
            groupName: "Cấu hình",
            items: [
              { label: "RAM", value: "8GB" },
              { label: "Chip", value: "A Test" },
            ],
          },
        ]
      : [
          {
            groupName: "Cấu hình",
            items: [
              { label: "RAM", value: "16GB" },
              { label: "Pin", value: "10 giờ" },
            ],
          },
        ];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: {
        success: true,
        message: "OK",
        data: {
          product: {
            id: item.id,
            productId: item.id,
            name: item.name,
            slug: item.slug,
            description: null,
            categoryId: 1,
            categorySlug: item.categorySlug,
            categoryName: item.categoryName,
            price: item.price,
            images: [],
            variants: [],
            specifications,
            colors: [],
            capacities: [],
            ramOptions: [],
            stockQuantity: 0,
            stockStatus: "out-of-stock",
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          relatedProducts: [],
        },
      },
    });
  });
  await page.addInitScript((storedItems: CompareStorageItem[]) => {
    window.localStorage.setItem(
      "apple-store-compare",
      JSON.stringify({
        state: { categorySlug: "spec-test", items: storedItems },
        version: 0,
      }),
    );
  }, items);
  await page.goto("/compare");

  const ramRow = page.getByRole("row").filter({ hasText: "RAM" });
  await expect(ramRow).toContainText("8GB");
  await expect(ramRow).toContainText("16GB");

  const chipRow = page.getByRole("row").filter({ hasText: "Chip" });
  await expect(chipRow).toContainText("A Test");
  await expect(chipRow.getByRole("cell")).toHaveText(["A Test", "—"]);

  const batteryRow = page.getByRole("row").filter({ hasText: "Pin" });
  await expect(batteryRow.getByRole("cell")).toHaveText(["—", "10 giờ"]);
});
