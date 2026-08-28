import type { Metadata } from "next";

import ComparePageClient from "@/components/product/compare/ComparePageClient";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: `So sánh sản phẩm | ${SITE_CONFIG.name}`,
  description: "So sánh giá, phiên bản và thông số kỹ thuật sản phẩm.",
};

export default function ComparePage() {
  return <ComparePageClient />;
}
