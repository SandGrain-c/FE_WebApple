import { expect, test } from "@playwright/test";

const SERVICE_PAGES = [
  {
    label: "Dịch vụ sửa chữa",
    path: "/dich-vu-sua-chua",
    title: "Dịch vụ sửa chữa | Đức Bách Hoá",
  },
  {
    label: "Bảo hành chính hãng",
    path: "/bao-hanh-chinh-hang",
    title: "Bảo hành chính hãng | Đức Bách Hoá",
  },
  {
    label: "Thu cũ đổi mới",
    path: "/thu-cu-doi-moi",
    title: "Thu cũ đổi mới | Đức Bách Hoá",
  },
  {
    label: "Trả góp 0%",
    path: "/tra-gop",
    title: "Trả góp 0% | Đức Bách Hoá",
  },
  {
    label: "Lắp đặt tận nơi",
    path: "/lap-dat-tan-noi",
    title: "Lắp đặt tận nơi | Đức Bách Hoá",
  },
] as const;

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
