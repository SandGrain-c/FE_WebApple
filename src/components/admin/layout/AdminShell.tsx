// src/components/admin/layout/AdminShell.tsx

"use client";

import { useState } from "react";

import AdminAuthGuard from "@/components/admin/layout/AdminAuthGuard";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";

type AdminShellProps = {
  children: React.ReactNode;
};

/**
 * AdminShell là khung giao diện chung của trang quản trị:
 * Sidebar bên trái, Header phía trên, Content ở giữa.
 */


export default function AdminShell({ children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AdminAuthGuard>
      <div className="fixed inset-0 flex overflow-hidden bg-surface-container-lowest">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface-container-lowest">
            <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}