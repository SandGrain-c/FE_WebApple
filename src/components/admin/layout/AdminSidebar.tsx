// src/components/admin/layout/AdminSidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import AdminNotificationBadge from "@/components/admin/notifications/AdminNotificationBadge";
import { SITE_CONFIG } from "@/config/site";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import { useAdminNotificationStore } from "@/store/admin-notification.store";
import type { AdminNotificationSummary } from "@/types/admin-notification.type";
import {
  filterAdminMenuByRole,
  type AdminMenuKey,
} from "@/utils/admin-permission.util";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  description: string;
  menuKey: AdminMenuKey;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: "Tổng quan",
    href: "/admin",
    icon: "dashboard",
    description: "Dashboard",
    menuKey: "dashboard",
  },
  {
    label: "Nhân viên",
    href: "/admin/staff",
    icon: "badge",
    description: "Staff Management",
    menuKey: "staff",
  },
  {
    label: "Danh mục",
    href: "/admin/categories",
    icon: "category",
    description: "Category CRUD",
    menuKey: "categories",
  },
  {
    label: "Sản phẩm",
    href: "/admin/products",
    icon: "inventory_2",
    description: "Product & Variant",
    menuKey: "products",
  },
  {
    label: "Serial sản phẩm",
    href: "/admin/product-items",
    icon: "qr_code_2",
    description: "Product Item Management",
    menuKey: "productItems",
  },
  {
    label: "Đơn hàng",
    href: "/admin/orders",
    icon: "receipt_long",
    description: "Order Management",
    menuKey: "orders",
  },
  {
    label: "Thanh toán",
    href: "/admin/payment-transactions",
    icon: "payments",
    description: "Payment",
    menuKey: "payments",
  },
  {
    label: "Vận chuyển",
    href: "/admin/shipments",
    icon: "local_shipping",
    description: "Shipment",
    menuKey: "shipments",
  },
  {
    label: "Voucher",
    href: "/admin/vouchers",
    icon: "confirmation_number",
    description: "Voucher",
    menuKey: "vouchers",
  },
  {
    label: "Đánh giá",
    href: "/admin/reviews",
    icon: "rate_review",
    description: "Review",
    menuKey: "reviews",
  },
  {
    label: "Nhà cung cấp",
    href: "/admin/suppliers",
    icon: "warehouse",
    description: "Supplier Management",
    menuKey: "suppliers",
  },
  {
    label: "Kho hàng",
    href: "/admin/inventory",
    icon: "inventory",
    description: "Inventory",
    menuKey: "inventory",
  },
  {
    label: "Banner",
    href: "/admin/banners",
    icon: "panorama",
    description: "Banner quản trị",
    menuKey: "banners",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

function getAdminMenuBadge(
  href: string,
  summary: AdminNotificationSummary | null
) {
  if (!summary) {
    return 0;
  }

  const badgeMap: Record<string, number> = {
    "/admin/orders": summary.orders.newOrders,
    "/admin/payment-transactions": summary.payments.pending,
    "/admin/shipments": summary.shipments.needAction,
    "/admin/reviews": summary.reviews.hidden,
  };

  return badgeMap[href] || 0;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const notificationSummary = useAdminNotificationStore(
    (state) => state.summary
  );

  const adminUser = useAdminAuthStore((state) => state.adminUser);

  const roleName = adminUser?.role;

  const visibleMenuItems = filterAdminMenuByRole(roleName, ADMIN_NAV_ITEMS);

  return (
    <>
      <button
        type="button"
        aria-label="Đóng menu quản trị"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-surface-container-high bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-surface-container-high px-5">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-xl">
                admin_panel_settings
              </span>
            </div>

            <div>
              <p className="text-sm font-bold leading-5 text-on-surface">
                {SITE_CONFIG.name}
              </p>
              <p className="text-xs font-medium text-secondary">
                Admin Panel
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary lg:hidden"
            aria-label="Đóng sidebar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {visibleMenuItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);
            const badgeValue = getAdminMenuBadge(
              item.href,
              notificationSummary
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  isActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface hover:bg-surface-container-lowest hover:text-primary"
                }`}
              >
                <span
                  className={`material-symbols-outlined shrink-0 text-xl ${
                    isActive
                      ? "text-on-primary"
                      : "text-secondary group-hover:text-primary"
                  }`}
                >
                  {item.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">
                      {item.label}
                    </span>

                    <AdminNotificationBadge value={badgeValue} />
                  </div>

                  <span
                    className={`mt-0.5 block truncate text-xs ${
                      isActive ? "text-on-primary/80" : "text-secondary"
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-container-high p-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl border border-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-xl">storefront</span>
            Về trang bán hàng
          </Link>
        </div>
      </aside>
    </>
  );
}
