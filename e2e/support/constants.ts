export const E2E = {
  accountPassword: process.env.E2E_ACCOUNT_PASSWORD || "WebAppleE2E!2026",
  customer: {
    email: "customer@webapple.e2e",
    fullName: "E2E Customer",
  },
  admin: {
    email: "admin@webapple.e2e",
    fullName: "E2E Admin",
  },
  category: {
    name: "E2E iPhone",
    slug: "e2e-iphone",
  },
  product: {
    name: "E2E iPhone Smoke",
    slug: "e2e-iphone-smoke",
  },
  inStockVariant: {
    color: "Đen E2E",
    capacity: "128GB",
    sku: "E2E-IP-SMOKE-BLK-128",
    priceText: "20.000.000₫",
    initialStock: 10,
  },
  outOfStockVariant: {
    color: "Trắng E2E",
    capacity: "256GB",
    priceText: "25.000.000₫",
  },
  voucherCode: "E2ECOD10",
} as const;

export const ADMIN_CREATED = {
  categoryName: "E2E Admin Category",
  categorySlug: "e2e-admin-category",
  productName: "E2E Admin Product",
  productSlug: "e2e-admin-product",
  variantName: "E2E Admin Product 64GB Xanh",
  variantSku: "E2E-ADMIN-PRODUCT-64-GRN",
} as const;
