import type { ProductDetail } from "@/types/product-detail.type";
import type {
  CompareSpecificationGroup,
  CompareSpecificationRow,
} from "@/types/compare.type";

function normalizeIdentity(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi-VN");
}
function normalizeDisplayValue(value: string | null | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

export function normalizeCompareSpecifications(
  products: ProductDetail[],
): CompareSpecificationGroup[] {
  const productIds = products.map((product) => product.id);
  const groups = new Map<
    string,
    {
      key: string;
      groupName: string;
      rows: Map<string, CompareSpecificationRow>;
    }
  >();

  for (const product of products) {
    for (const group of product.specifications ?? []) {
      const groupName = group.groupName.trim() || "Thông số kỹ thuật";
      const groupKey = normalizeIdentity(groupName);
      const normalizedGroup = groups.get(groupKey) ?? {
        key: groupKey,
        groupName,
        rows: new Map<string, CompareSpecificationRow>(),
      };

      if (!groups.has(groupKey)) {
        groups.set(groupKey, normalizedGroup);
      }

      for (const specification of group.items ?? []) {
        const label = specification.label.trim();
        if (!label) continue;

        const rowKey = `${groupKey}:${normalizeIdentity(label)}`;
        const row = normalizedGroup.rows.get(rowKey) ?? {
          key: rowKey,
          label,
          values: Object.fromEntries(
            productIds.map((productId) => [productId, null]),
          ) as Record<number, string | null>,
        };

        if (!normalizedGroup.rows.has(rowKey)) {
          normalizedGroup.rows.set(rowKey, row);
        }

        row.values[product.id] = normalizeDisplayValue(specification.value);
      }
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      key: group.key,
      groupName: group.groupName,
      rows: Array.from(group.rows.values()),
    }))
    .filter((group) => group.rows.length > 0);
}
