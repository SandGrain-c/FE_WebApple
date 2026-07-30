import type { ApiResponse } from "@/types/auth.type";

export type AdminDashboardQuery = {
  days?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  threshold?: number;
};

export type AdminDashboardSummary = {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalReviews: number;
  lowStockVariants: number;
};

export type AdminRevenueSeriesItem = {
  date: string;
  revenue: number;
  orders?: number;
};

export type AdminTopProduct = {
  productId: number;
  name: string;
  slug?: string;
  categoryName?: string;
  image?: string | null;

  /**
   * BE có thể đặt tên field khác nhau.
   * FE sẽ đọc linh hoạt ở component.
   */
  soldQuantity?: number;
  totalSold?: number;
  revenue?: number;
  totalRevenue?: number;
};

export type AdminLowStockVariant = {
  variantId: number;
  productId?: number;
  productName: string;
  variantName?: string | null;
  sku: string;
  color?: string | null;
  capacity?: string | null;
  ram?: string | null;
  stockQuantity: number;
};

export type AdminRecentOrder = {
  orderId: number;
  orderCode?: string | null;
  customerName: string;
  customerPhone?: string | null;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
};

export type AdminDashboardOverviewData = {
  summary: AdminDashboardSummary;
  revenueSeries: AdminRevenueSeriesItem[];
  topProducts: AdminTopProduct[];
  lowStockVariants: AdminLowStockVariant[];
  recentOrders: AdminRecentOrder[];
};

export type AdminDashboardApiResponse<T> = ApiResponse<T>;