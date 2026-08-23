import { test, expect } from "../support/test";
import { loginCustomer } from "../support/auth";
import { E2E } from "../support/constants";
import { addSeedProductToCart } from "../support/shop";

test.describe.configure({ timeout: 90_000 });

async function openCheckoutWithProduct(page: Parameters<typeof loginCustomer>[0]) {
  await loginCustomer(page);
  await addSeedProductToCart(page);
  await page.goto("/checkout");
  await expect(page.getByText("Đang chọn:")).toBeVisible();
}

test("Voucher picker loads, applies, updates total, and removes a voucher", async ({
  page,
}) => {
  await openCheckoutWithProduct(page);

  await page.getByRole("button", { name: "Chọn voucher" }).click();
  const dialog = page.getByRole("dialog", { name: "Chọn voucher" });

  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(E2E.voucherCode, { exact: true })).toBeVisible();
  await expect(dialog.getByText("Giảm 10%", { exact: true })).toBeVisible();

  const validateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/vouchers/validate") &&
      response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Áp dụng" }).click();
  expect((await validateResponsePromise).ok()).toBeTruthy();

  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText(`Voucher ${E2E.voucherCode} đã áp dụng`),
  ).toBeVisible();
  await expect(page.getByText("-2.000.000₫", { exact: true })).toBeVisible();
  await expect(page.getByText("18.000.000₫", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Bỏ voucher" }).click();
  await expect(
    page.getByText(`Voucher ${E2E.voucherCode} đã áp dụng`),
  ).not.toBeVisible();
  await expect(
    page
      .getByRole("complementary")
      .getByText("20.000.000₫", { exact: true })
      .last(),
  ).toBeVisible();
});

test("Picker renders multiple vouchers and keeps an ineligible failure unapplied", async ({
  page,
}) => {
  await openCheckoutWithProduct(page);

  await page.route("**/api/vouchers/available", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "ok",
        data: [
          {
            voucherId: 101,
            code: "DEMO10",
            discountType: "Percent",
            discountValue: 10,
            minOrderValue: 1_000_000,
            maxDiscountAmount: 2_000_000,
            usageLimit: 100,
            usedCount: 0,
            startDate: null,
            endDate: "2030-12-31T23:59:59.000Z",
            isActive: true,
          },
          {
            voucherId: 102,
            code: "BIGORDER",
            discountType: "Fixed",
            discountValue: 100_000,
            minOrderValue: 50_000_000,
            maxDiscountAmount: null,
            usageLimit: 100,
            usedCount: 0,
            startDate: null,
            endDate: null,
            isActive: true,
          },
        ],
      }),
    });
  });
  await page.route("**/api/vouchers/validate", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Đơn hàng chưa đạt giá trị tối thiểu 50000000",
      }),
    });
  });

  await page.getByRole("button", { name: "Chọn voucher" }).click();
  const dialog = page.getByRole("dialog", { name: "Chọn voucher" });

  await expect(dialog.getByText("DEMO10", { exact: true })).toBeVisible();
  const ineligibleVoucher = dialog.getByRole("article").filter({
    hasText: "BIGORDER",
  });
  await expect(ineligibleVoucher.getByText("Giảm 100.000₫")).toBeVisible();
  await ineligibleVoucher.getByRole("button", { name: "Áp dụng" }).click();

  await expect(
    ineligibleVoucher.getByText(/Đơn hàng chưa đạt giá trị tối thiểu/),
  ).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(
    page
      .getByRole("complementary")
      .getByText("20.000.000₫", { exact: true })
      .last(),
  ).toBeVisible();
});

test("Available API failure keeps manual voucher entry usable", async ({ page }) => {
  await openCheckoutWithProduct(page);

  await page.route("**/api/vouchers/available", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Không thể tải danh sách voucher.",
      }),
    });
  });

  await page.getByRole("button", { name: "Chọn voucher" }).click();
  const dialog = page.getByRole("dialog", { name: "Chọn voucher" });

  await expect(
    dialog.getByText("Không thể tải danh sách voucher.", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText(/Bạn vẫn có thể đóng danh sách và nhập mã thủ công/),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Đóng danh sách voucher" }).click();
  await page.getByLabel("Mã voucher").fill(E2E.voucherCode);
  await page
    .getByRole("button", { name: "Áp dụng", exact: true })
    .click();
  await expect(
    page.getByText(`Voucher ${E2E.voucherCode} đã áp dụng`),
  ).toBeVisible();
});

test("Picker shows an empty state", async ({ page }) => {
  await openCheckoutWithProduct(page);

  await page.route("**/api/vouchers/available", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "ok", data: [] }),
    });
  });

  await page.getByRole("button", { name: "Chọn voucher" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Chọn voucher" })
      .getByText("Hiện chưa có voucher khả dụng."),
  ).toBeVisible();
});
