import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { readFileSync } from "node:fs";

import {
  getAvailableVouchers,
  validateVoucher,
} from "../src/services/voucher.service.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("Checkout exposes manual apply, voucher picker, and remove controls", () => {
  const source = readFileSync(
    new URL(
      "../src/components/checkout/CheckoutPageClient.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /Chọn voucher/);
  assert.match(source, /applyVoucher\(formState\.voucherCode\)/);
  assert.match(source, /onApply=\{applyVoucher\}/);
  assert.match(source, /Bỏ voucher/);
  assert.match(source, /voucherCode: appliedVoucher\?\.voucher\.code/);
});

test("getAvailableVouchers calls the authenticated Customer endpoint", async () => {
  let capturedRequest;
  const vouchers = [
    {
      voucherId: 1,
      code: "DEMO10",
      discountType: "Percent",
      discountValue: 10,
      minOrderValue: 500_000,
      maxDiscountAmount: 200_000,
      usageLimit: 100,
      usedCount: 0,
      startDate: null,
      endDate: "2030-12-31T23:59:59.000Z",
      isActive: true,
    },
  ];

  globalThis.fetch = async (input, init) => {
    capturedRequest = { input: String(input), init };
    return new Response(
      JSON.stringify({
        success: true,
        message: "ok",
        data: vouchers,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  assert.deepEqual(await getAvailableVouchers("customer-token"), vouchers);
  assert.match(capturedRequest.input, /\/api\/vouchers\/available$/);
  assert.equal(capturedRequest.init.method, "GET");
  assert.equal(
    capturedRequest.init.headers.Authorization,
    "Bearer customer-token",
  );
  assert.equal(capturedRequest.init.cache, "no-store");
});

test("validateVoucher sends current subtotal and returns Backend discount", async () => {
  let capturedRequest;
  const validationResult = {
    voucher: {
      voucherId: 1,
      code: "DEMO10",
      discountType: "Percent",
      discountValue: 10,
      minOrderValue: 500_000,
      maxDiscountAmount: 200_000,
      usageLimit: 100,
      usedCount: 0,
      startDate: null,
      endDate: null,
      isActive: true,
    },
    subTotal: 2_000_000,
    discountAmount: 200_000,
    totalAfterDiscount: 1_800_000,
  };

  globalThis.fetch = async (input, init) => {
    capturedRequest = { input: String(input), init };
    return new Response(
      JSON.stringify({
        success: true,
        message: "ok",
        data: validationResult,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  assert.deepEqual(
    await validateVoucher(
      { code: "DEMO10", subTotal: 2_000_000 },
      "customer-token",
    ),
    validationResult,
  );
  assert.match(capturedRequest.input, /\/api\/vouchers\/validate$/);
  assert.equal(capturedRequest.init.method, "POST");
  assert.deepEqual(JSON.parse(capturedRequest.init.body), {
    code: "DEMO10",
    subTotal: 2_000_000,
  });
});

test("voucher services surface safe API messages and normalize invalid JSON", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        message: "Đơn hàng chưa đạt giá trị tối thiểu 5000000",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );

  await assert.rejects(
    validateVoucher(
      { code: "BIGORDER", subTotal: 1_000_000 },
      "customer-token",
    ),
    /Đơn hàng chưa đạt giá trị tối thiểu/,
  );

  globalThis.fetch = async () =>
    new Response("upstream failure", { status: 500 });

  await assert.rejects(
    getAvailableVouchers("customer-token"),
    /Không thể tải danh sách voucher/,
  );
});
