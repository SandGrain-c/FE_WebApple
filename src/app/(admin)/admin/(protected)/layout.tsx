import AdminAuthGuard from "@/components/admin/layout/AdminAuthGuard";
import AdminShell from "@/components/admin/layout/AdminShell";
import AdminNotificationProvider from "@/components/admin/notifications/AdminNotificationProvider";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminNotificationProvider>
      <AdminShell>{children}</AdminShell>
    </AdminNotificationProvider>
  );
}