import { expect, test } from "@playwright/test";

import { SITE_CONFIG } from "../../src/config/site";

const SERVICE_PAGES = [
  {
    label: "Dịch vụ sửa chữa",
    path: "/dich-vu-sua-chua",
    title: `Dịch vụ sửa chữa | ${SITE_CONFIG.name}`,
  },
  {
    label: "Bảo hành chính hãng",
    path: "/bao-hanh-chinh-hang",
    title: `Bảo hành chính hãng | ${SITE_CONFIG.name}`,
  },
  {
    label: "Thu cũ đổi mới",
    path: "/thu-cu-doi-moi",
    title: `Thu cũ đổi mới | ${SITE_CONFIG.name}`,
  },
  {
    label: "Trả góp 0%",
    path: "/tra-gop",
    title: `Trả góp 0% | ${SITE_CONFIG.name}`,
  },
  {
    label: "Lắp đặt tận nơi",
    path: "/lap-dat-tan-noi",
    title: `Lắp đặt tận nơi | ${SITE_CONFIG.name}`,
  },
] as const;

test("Shared Customer layout renders the configured brand and support email", async ({
  page,
}) => {
  const response = await page.goto("/dich-vu-sua-chua");
  expect(response?.ok()).toBeTruthy();

  await expect(page.locator("header")).toContainText(SITE_CONFIG.name);
  await expect(page.locator("footer")).toContainText(SITE_CONFIG.name);
  await expect(page.locator("footer")).toContainText(
    SITE_CONFIG.supportEmail,
  );
});

const AUTH_PAGES = [
  { path: "/login", text: `Đăng nhập thành viên ${SITE_CONFIG.name}` },
  { path: "/register", text: `Đăng ký thành viên ${SITE_CONFIG.name}` },
  {
    path: "/forgot-password",
    text: `Bảo vệ tài khoản ${SITE_CONFIG.name} của bạn`,
  },
  {
    path: "/reset-password",
    text: `Bảo vệ tài khoản ${SITE_CONFIG.name} của bạn`,
  },
  {
    path: "/admin/login",
    text: `Quản trị hệ thống ${SITE_CONFIG.name}`,
  },
] as const;

for (const authPage of AUTH_PAGES) {
  test(`${authPage.path} renders the configured brand`, async ({ page }) => {
    const response = await page.goto(authPage.path);
    expect(response?.ok(), `${authPage.path} should render`).toBeTruthy();
    await expect(page).toHaveTitle(SITE_CONFIG.name);
    await expect(page.locator("body")).toContainText(authPage.text);
  });
}

for (const [index, servicePage] of SERVICE_PAGES.entries()) {
  test(`Header navigates to ${servicePage.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const startPage = SERVICE_PAGES[(index + 1) % SERVICE_PAGES.length];
    const response = await page.goto(startPage.path);
    expect(response?.ok()).toBeTruthy();

    const categoryButton = page.getByRole("button", {
      name: "Mở danh mục dịch vụ",
    });
    await categoryButton.hover();

    const serviceLink = page.getByRole("link", {
      name: servicePage.label,
      exact: true,
    });
    await expect(serviceLink).toBeVisible();
    await serviceLink.click();

    await expect(page).toHaveURL((url) => url.pathname === servicePage.path);
    await expect(
      page.getByRole("heading", { level: 1, name: servicePage.label }),
    ).toBeVisible();
    await expect(page).toHaveTitle(servicePage.title);
    await expect(page.locator("body")).not.toContainText(
      "This page could not be found",
    );
  });
}

test("Service dropdown is reachable with the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dich-vu-sua-chua");

  const categoryButton = page.getByRole("button", {
    name: "Mở danh mục dịch vụ",
  });
  await categoryButton.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");

  await expect(
    page.getByRole("link", { name: "Dịch vụ sửa chữa", exact: true }),
  ).toBeFocused();
});

test("Shared service layout remains readable without horizontal overflow", async ({
  page,
}) => {
  test.setTimeout(90_000);

  const viewports = [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 820, height: 1180 },
    { name: "desktop", width: 1440, height: 1000 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const servicePage of SERVICE_PAGES) {
      const response = await page.goto(servicePage.path);
      expect(response?.ok(), `${servicePage.path} should render`).toBeTruthy();
      await expect(
        page.getByRole("heading", { level: 1, name: servicePage.label }),
      ).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(
        hasHorizontalOverflow,
        `${servicePage.path} overflows at ${viewport.name}`,
      ).toBe(false);
    }
  }
});
