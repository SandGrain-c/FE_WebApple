import { test, expect } from "../support/test";
import { loginCustomer } from "../support/auth";
import { E2E } from "../support/constants";
import {
  readCheckoutDatabaseState,
  resetE2EDatabase,
} from "../support/database";
import { addSeedProductToCart } from "../support/shop";

test.describe.configure({ timeout: 90_000 });

test.afterEach(() => {
  resetE2EDatabase();
});

test("E2E-USR-004 — Checkout COD", async ({ page }) => {
  await loginCustomer(page);
  await addSeedProductToCart(page);
  await page.goto("/checkout");

  await expect(page.getByText("Đang chọn:")).toBeVisible();
  await expect(
    page.getByText(/E2E Customer - 0901000001/),
  ).toBeVisible();
  await page.getByPlaceholder("Ví dụ: SALE10").fill(E2E.voucherCode);
  const validateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/vouchers/validate") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Áp dụng", exact: true })
    .click();
  expect((await validateResponsePromise).ok()).toBeTruthy();
  await expect(
    page.getByText(`Voucher ${E2E.voucherCode} đã áp dụng`),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Thanh toán khi nhận hàng/ })
    .click();

  let checkoutRequestCount = 0;
  page.on("request", (request) => {
    if (
      request.url().endsWith("/api/orders/checkout") &&
      request.method() === "POST"
    ) {
      checkoutRequestCount += 1;
    }
  });

  const checkoutResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/orders/checkout") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Đặt hàng$/ }).click();
  const checkoutResponse = await checkoutResponsePromise;

  expect(checkoutResponse.ok()).toBeTruthy();
  await page.waitForURL((url) => url.pathname === "/checkout/success");
  await expect(
    page.getByRole("heading", { name: "Đặt hàng thành công" }),
  ).toBeVisible();
  expect(checkoutRequestCount).toBe(1);

  const orderId = Number(new URL(page.url()).searchParams.get("orderId"));
  expect(orderId).toBeGreaterThan(0);

  await page.getByRole("link", { name: "Xem đơn hàng" }).click();
  await page.waitForURL((url) => url.pathname === "/orders");
  await expect(page.getByText("18.000.000₫", { exact: true })).toBeVisible();

  await page.goto(`/orders/${orderId}`);
  await expect(
    page.getByRole("heading", { name: /ORD-/ }),
  ).toBeVisible();
  await expect(
    page.getByText(E2E.product.name, { exact: true }).first(),
  ).toBeVisible();

  const databaseState = readCheckoutDatabaseState(orderId);
  expect(databaseState.order.status).toBe("PendingConfirmation");
  expect(databaseState.order.subTotal).toBe(20_000_000);
  expect(databaseState.order.discountAmount).toBe(2_000_000);
  expect(databaseState.order.totalAmount).toBe(18_000_000);
  expect(databaseState.items).toHaveLength(1);
  expect(databaseState.items[0]).toMatchObject({
    quantity: 1,
    unitPrice: 20_000_000,
  });
  expect(databaseState.payments).toEqual([
    {
      gateway: "COD",
      type: "Payment",
      status: "Pending",
      amount: 18_000_000,
    },
  ]);
  expect(databaseState.cartItemCount).toBe(0);
  expect(databaseState.stockQuantity).toBe(
    E2E.inStockVariant.initialStock - 1,
  );
  expect(databaseState.voucherUsedCount).toBe(1);
  expect(databaseState.voucherUsageCount).toBe(1);
});
