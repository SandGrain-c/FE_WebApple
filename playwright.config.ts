import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;

if (!e2eDatabaseUrl) {
  throw new Error("E2E_DATABASE_URL is required to run Full-stack E2E tests");
}

const frontendDirectory = process.cwd();
const backendDirectory = path.resolve(frontendDirectory, "../BE");
const frontendPort = process.env.E2E_FRONTEND_PORT || "3000";
const customerApiPort = process.env.E2E_CUSTOMER_API_PORT || "5001";
const adminApiPort = process.env.E2E_ADMIN_API_PORT || "5002";
const frontendUrl = `http://localhost:${frontendPort}`;
const customerApiUrl = `http://localhost:${customerApiPort}`;
const adminApiUrl = `http://localhost:${adminApiPort}`;
const sharedBackendEnvironment = {
  DATABASE_URL: e2eDatabaseUrl,
  JWT_SECRET:
    process.env.E2E_JWT_SECRET ||
    "webapple-e2e-jwt-secret-change-for-shared-environments",
  E2E_ACCOUNT_PASSWORD:
    process.env.E2E_ACCOUNT_PASSWORD || "WebAppleE2E!2026",
  CLIENT_URL: frontendUrl,
  ADMIN_CLIENT_URL: frontendUrl,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  globalSetup: "./e2e/global-setup.ts",
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: frontendUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev:customer",
      cwd: backendDirectory,
      env: {
        ...sharedBackendEnvironment,
        CUSTOMER_API_PORT: customerApiPort,
      },
      url: `${customerApiUrl}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev:admin",
      cwd: backendDirectory,
      env: {
        ...sharedBackendEnvironment,
        ADMIN_API_PORT: adminApiPort,
      },
      url: `${adminApiUrl}/api/admin/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- -p ${frontendPort}`,
      cwd: frontendDirectory,
      env: {
        PORT: frontendPort,
        NEXT_DIST_DIR: ".next-e2e",
        NEXT_PUBLIC_API_URL: `${customerApiUrl}/api`,
        NEXT_PUBLIC_ADMIN_API_URL: `${adminApiUrl}/api/admin`,
      },
      url: frontendUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
