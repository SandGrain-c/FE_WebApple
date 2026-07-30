import { test, expect } from "../support/test";
import {
  loginCustomer,
  readPersistedToken,
} from "../support/auth";
import { E2E } from "../support/constants";

test("E2E-USR-001 — Customer authentication", async ({ page, request }) => {
  await loginCustomer(page);
  await page.reload();
  await expect(
    page.getByText(E2E.customer.fullName, { exact: true }).first(),
  ).toBeVisible();

  const accessToken = await readPersistedToken(page, "auth-storage");
  expect(accessToken).toBeTruthy();

  const meResponse = await request.get(
    "http://localhost:5001/api/auth/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  expect(meResponse.ok()).toBeTruthy();
  expect((await meResponse.json()).data.user.email).toBe(E2E.customer.email);

  await page
    .getByText(E2E.customer.fullName, { exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Đăng xuất$/ }).click();
  await expect
    .poll(() => readPersistedToken(page, "auth-storage"))
    .toBeNull();
  await page.waitForURL((url) => url.pathname === "/");

  await page.goto("/orders");
  await page.waitForURL(
    (url) =>
      url.pathname === "/login" && url.searchParams.get("redirect") === "/orders",
  );
});
