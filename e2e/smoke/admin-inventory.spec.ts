import { test, expect } from "../support/test";
import { loginAdmin, readPersistedToken } from "../support/auth";

const adminApiUrl = `http://localhost:${process.env.E2E_ADMIN_API_PORT || "5002"}/api/admin`;

type InventoryVariant = {
  variantId: number;
  sku: string;
  stockQuantity: number;
};

test("E2E-ADM-003 — Create receipt selects variants and updates inventory", async ({
  page,
  request,
}) => {
  await loginAdmin(page);
  const accessToken = await readPersistedToken(page, "admin-auth-storage");
  expect(accessToken).toBeTruthy();
  const authorization = { Authorization: `Bearer ${accessToken}` };

  const supplierResponse = await request.post(`${adminApiUrl}/suppliers`, {
    headers: authorization,
    data: {
      supplierName: "E2E Inventory Supplier",
      status: "Active",
    },
  });
  expect(supplierResponse.status()).toBe(201);
  const supplier = (await supplierResponse.json()).data as {
    supplierId: number;
    supplierName: string;
  };

  const variantsResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/inventory/variants?") &&
      response.request().method() === "GET",
  );
  await page.goto("/admin/inventory");
  const variantsResponse = await variantsResponsePromise;
  expect(variantsResponse.status()).toBe(200);
  expect(variantsResponse.request().url()).toContain("sort=newest");
  const variants = (await variantsResponse.json()).data
    .items as InventoryVariant[];
  expect(variants.length).toBeGreaterThanOrEqual(2);

  const firstVariant = variants[0];
  const secondVariant = variants[1];
  await page.getByRole("button", { name: /Tạo phiếu nhập$/ }).click();

  const receiptForm = page.locator("form").filter({
    has: page.getByRole("button", { name: /Tạo phiếu nhập$/ }),
  });
  await expect(receiptForm).toBeVisible();

  const comboboxes = receiptForm.getByRole("combobox");
  await comboboxes.nth(0).selectOption(String(supplier.supplierId));
  await expect(receiptForm.getByRole("textbox").first()).toHaveValue(
    supplier.supplierName,
  );

  await receiptForm
    .getByRole("button", { name: /Tạo phiếu nhập$/ })
    .click();
  await expect(page.getByText("Thiếu variant", { exact: true })).toBeVisible();

  await comboboxes.nth(1).selectOption(String(firstVariant.variantId));
  const numberInputs = receiptForm.locator('input[type="number"]');
  await numberInputs.nth(0).fill("2");
  await numberInputs.nth(1).fill("12000000");
  await expect(comboboxes.nth(1)).toHaveValue(String(firstVariant.variantId));

  await receiptForm.getByRole("button", { name: "Thêm dòng" }).click();
  await receiptForm
    .getByRole("combobox")
    .nth(2)
    .selectOption(String(secondVariant.variantId));
  await receiptForm.locator('input[type="number"]').nth(2).fill("1");
  await receiptForm.locator('input[type="number"]').nth(3).fill("9000000");
  await expect(comboboxes.nth(1)).toHaveValue(String(firstVariant.variantId));
  await expect(receiptForm.getByRole("combobox").nth(2)).toHaveValue(
    String(secondVariant.variantId),
  );

  const serialInputs = receiptForm.locator("textarea");
  if (firstVariant.stockQuantity === 0) {
    await serialInputs
      .nth(0)
      .fill("E2E-RECEIPT-SERIAL-001\nE2E-RECEIPT-SERIAL-002");
  }
  if (secondVariant.stockQuantity === 0) {
    await serialInputs.nth(1).fill("E2E-RECEIPT-SERIAL-003");
  }

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/inventory/receipts") &&
      response.request().method() === "POST",
  );
  await receiptForm
    .getByRole("button", { name: /Tạo phiếu nhập$/ })
    .click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const createdReceipt = (await createResponse.json()).data as {
    receiptId: number;
    supplierId: number;
    items: Array<{ variantId: number; quantity: number; costPrice: number }>;
  };
  expect(createdReceipt.supplierId).toBe(supplier.supplierId);
  expect(createdReceipt.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        variantId: firstVariant.variantId,
        quantity: 2,
        costPrice: 12_000_000,
      }),
      expect.objectContaining({
        variantId: secondVariant.variantId,
        quantity: 1,
        costPrice: 9_000_000,
      }),
    ]),
  );
  await expect(
    page.getByText("Tạo phiếu nhập thành công", { exact: true }),
  ).toBeVisible();

  const detailResponse = await request.get(
    `${adminApiUrl}/inventory/receipts/${createdReceipt.receiptId}`,
    { headers: authorization },
  );
  expect(detailResponse.status()).toBe(200);
  expect((await detailResponse.json()).data.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        variantId: firstVariant.variantId,
        quantity: 2,
      }),
      expect.objectContaining({
        variantId: secondVariant.variantId,
        quantity: 1,
      }),
    ]),
  );

  for (const [variant, increment] of [
    [firstVariant, 2],
    [secondVariant, 1],
  ] as const) {
    const stockResponse = await request.get(
      `${adminApiUrl}/inventory/variants?search=${encodeURIComponent(variant.sku)}&limit=100&sort=newest`,
      { headers: authorization },
    );
    expect(stockResponse.status()).toBe(200);
    const updatedVariant = (await stockResponse.json()).data
      .items[0] as InventoryVariant;
    expect(updatedVariant.variantId).toBe(variant.variantId);
    expect(updatedVariant.stockQuantity).toBe(
      variant.stockQuantity + increment,
    );
  }
});
