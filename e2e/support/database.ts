import { execFileSync } from "node:child_process";
import path from "node:path";

const backendDirectory = path.resolve(process.cwd(), "../BE");

function requiredE2EDatabaseUrl() {
  const databaseUrl = process.env.E2E_DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("E2E_DATABASE_URL is required");
  }

  return databaseUrl;
}

export function resetE2EDatabase() {
  execFileSync("npm", ["run", "e2e:db:reset"], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      E2E_DATABASE_URL: requiredE2EDatabaseUrl(),
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export type CheckoutDatabaseState = {
  order: {
    id: number;
    userId: number;
    status: string;
    voucherId: number | null;
    subTotal: number;
    discountAmount: number;
    totalAmount: number;
  };
  items: Array<{
    variantId: number;
    quantity: number;
    unitPrice: number;
  }>;
  payments: Array<{
    gateway: string | null;
    type: string;
    status: string;
    amount: number;
  }>;
  cartItemCount: number;
  stockQuantity: number;
  voucherUsedCount: number;
  voucherUsageCount: number;
};

export function readCheckoutDatabaseState(orderId: number) {
  const tsxExecutable = path.resolve(
    backendDirectory,
    "node_modules",
    ".bin",
    "tsx",
  );
  const verifier = path.resolve(
    backendDirectory,
    "tests/e2e-support/verify-checkout.ts",
  );
  const output = execFileSync(
    tsxExecutable,
    [verifier, `--order-id=${orderId}`],
    {
      cwd: backendDirectory,
      env: {
        ...process.env,
        E2E_DATABASE_URL: requiredE2EDatabaseUrl(),
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return JSON.parse(output) as CheckoutDatabaseState;
}
