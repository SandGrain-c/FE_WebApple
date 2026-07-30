export type AdminRoleName = "Admin" | "Staff" | "WarehouseStaff" | string;

export type AdminMenuKey =
  | "dashboard"
  | "staff"
  | "users"
  | "categories"
  | "products"
  | "variants"
  | "images"
  | "banners"
  | "orders"
  | "shipments"
  | "payments"
  | "vouchers"
  | "reviews"
  | "inventory"
  | "suppliers"
  | "productItems"
  | "auditLogs";

const ROLE_MENU_MATRIX: Record<string, AdminMenuKey[]> = {
  Admin: [
    "dashboard",
    "staff",
    "users",
    "categories",
    "products",
    "variants",
    "images",
    "banners",
    "orders",
    "shipments",
    "payments",
    "vouchers",
    "reviews",
    "inventory",
    "suppliers",
    "productItems",
    "auditLogs",
  ],

  Staff: [
    "dashboard",
    "products",
    "variants",
    "images",
    "banners",
    "orders",
    "shipments",
    "payments",
    "vouchers",
    "reviews",
  ],

  WarehouseStaff: [
    "dashboard",
    "inventory",
    "suppliers",
    "productItems",
    "shipments",
    "products",
    "variants",
  ],
};

export function canAccessAdminMenu(
  roleName: AdminRoleName | null | undefined,
  menuKey: AdminMenuKey
) {
  if (!roleName) {
    return false;
  }

  const allowedMenus = ROLE_MENU_MATRIX[roleName];

  if (!allowedMenus) {
    return false;
  }

  return allowedMenus.includes(menuKey);
}

export function filterAdminMenuByRole<T extends { menuKey: AdminMenuKey }>(
  roleName: AdminRoleName | null | undefined,
  menuItems: T[]
) {
  return menuItems.filter((item) => canAccessAdminMenu(roleName, item.menuKey));
}