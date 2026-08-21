import assert from "node:assert/strict";
import test from "node:test";

import {
  BANNER_POSITIONS,
  DEFAULT_BANNER_POSITION,
  getBannerFormPositionOptions,
} from "../src/config/banner.ts";

test("Admin Create exposes every active Customer banner position", () => {
  const options = getBannerFormPositionOptions(DEFAULT_BANNER_POSITION);

  assert.deepEqual(
    options.map((option) => option.value),
    ["home-hero", "home-small"],
  );
  assert.deepEqual(
    BANNER_POSITIONS.map((option) => option.label),
    ["Trang chủ - Banner chính", "Trang chủ - Banner nhỏ"],
  );
});

test("Admin Edit preserves a stored legacy position without making it canonical", () => {
  const options = getBannerFormPositionOptions("category-hero");

  assert.deepEqual(options[0], {
    value: "category-hero",
    label: "category-hero (giá trị cũ)",
  });
  assert.deepEqual(
    options.slice(1).map((option) => option.value),
    ["home-hero", "home-small"],
  );
  assert.equal(
    BANNER_POSITIONS.some((option) => option.value === "category-hero"),
    false,
  );
});
