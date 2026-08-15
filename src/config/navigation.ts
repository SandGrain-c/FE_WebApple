export const MAIN_CATEGORIES = [
  { name: "iPhone", slug: "iphone" },
  { name: "MacBook", slug: "macbook" },
  { name: "iPad", slug: "ipad" },
  { name: "Apple Watch", slug: "apple-watch" },
  { name: "Camera", slug: "camera" },
  { name: "Âm thanh", slug: "am-thanh" },
  { name: "iMac", slug: "imac" },
  { name: "Phụ kiện", slug: "phu-kien" },
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];
