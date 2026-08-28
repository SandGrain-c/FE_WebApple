import assert from "node:assert/strict";
import test from "node:test";

import { SITE_CONFIG } from "../src/config/site.ts";

test("site config exposes normalized display-brand values", () => {
  assert.equal(SITE_CONFIG.name, SITE_CONFIG.name.trim());
  assert.ok(SITE_CONFIG.name.length > 0);
  assert.ok(SITE_CONFIG.description.length > 0);
  assert.match(SITE_CONFIG.supportEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
});
