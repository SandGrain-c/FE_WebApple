import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/smoke",
  testMatch: "service-information-pages.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: "test-results/service-pages",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    env: {
      NEXT_PUBLIC_API_URL: "http://localhost:5001/api",
    },
    url: "http://localhost:3000/dich-vu-sua-chua",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
