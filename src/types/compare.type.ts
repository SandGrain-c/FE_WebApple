import type { CompareItem } from "@/store/compare.store";
import type { ProductDetail } from "@/types/product-detail.type";

export type CompareProductResult = {
  item: CompareItem;
  product: ProductDetail | null;
  error: string | null;
};
export type CompareSpecificationRow = {
  key: string;
  label: string;
  values: Record<number, string | null>;
};

export type CompareSpecificationGroup = {
  key: string;
  groupName: string;
  rows: CompareSpecificationRow[];
};
