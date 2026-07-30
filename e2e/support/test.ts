import { test as base } from "@playwright/test";
import { resetE2EDatabase } from "./database";

export const test = base.extend<{ deterministicDatabase: void }>({
  deterministicDatabase: [
    async ({}, use) => {
      resetE2EDatabase();
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
