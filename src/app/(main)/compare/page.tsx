import type { Metadata } from "next";

import ComparePageClient from "@/components/product/compare/ComparePageClient";

export const metadata: Metadata = {
  title: "So sánh sản phẩm | Đức Bách Hoá",
  description: "So sánh giá, phiên bản và thông số kỹ thuật sản phẩm.",
};

export default function ComparePage() {
  return <ComparePageClient />;
}
