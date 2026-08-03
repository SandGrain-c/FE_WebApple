import CompareProductHeader from "./CompareProductHeader";

import {
  getRepresentativeVariant,
  getRepresentativeVariantLabel,
} from "@/lib/compare/product-display";
import { formatPrice } from "@/utils/format-price";
import type { CompareProductResult } from "@/types/compare.type";
import type { CompareSpecificationGroup } from "@/types/compare.type";

type CompareSpecificationTableProps = {
  results: CompareProductResult[];
  specificationGroups: CompareSpecificationGroup[];
  onRemove: (productId: number, productName: string) => void;
};

const MISSING_VALUE = "—";

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return MISSING_VALUE;
  }

  return String(value);
}
export default function CompareSpecificationTable({
  results,
  specificationGroups,
  onRemove,
}: CompareSpecificationTableProps) {
  return (
    <div
      className="overflow-x-auto rounded-2xl border border-surface-container-high bg-white shadow-sm"
      data-testid="compare-table-scroll"
    >
      <table className="min-w-[820px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="align-top">
            <th className="sticky left-0 z-20 w-52 min-w-52 border-b border-r border-outline-variant bg-surface-container-lowest p-4 text-left text-base font-semibold text-on-surface">
              Sản phẩm
            </th>
            {results.map((result) => (
              <th
                key={result.item.id}
                className="w-68 min-w-68 border-b border-r border-outline-variant bg-white p-0 font-normal last:border-r-0"
              >
                <CompareProductHeader result={result} onRemove={onRemove} />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr>
            <th
              colSpan={results.length + 1}
              className="border-b border-outline-variant bg-surface-container px-4 py-3 text-left text-base font-semibold text-on-surface"
            >
              Thông tin phiên bản đại diện
            </th>
          </tr>

          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-outline-variant bg-surface-container-lowest px-4 py-3 text-left font-semibold text-secondary">
              Giá bán
            </th>
            {results.map(({ item, product }) => {
              const variant = product ? getRepresentativeVariant(product) : null;
              const price = variant?.price ?? product?.price;

              return (
                <td
                  key={item.id}
                  className="border-b border-r border-outline-variant px-4 py-3 font-semibold text-primary last:border-r-0"
                >
                  {price !== undefined ? formatPrice(price) : MISSING_VALUE}
                </td>
              );
            })}
          </tr>

          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-outline-variant bg-surface-container-lowest px-4 py-3 text-left font-semibold text-secondary">
              Phiên bản
            </th>
            {results.map(({ item, product }) => (
              <td
                key={item.id}
                className="border-b border-r border-outline-variant px-4 py-3 text-on-surface last:border-r-0"
              >
                {product
                  ? displayValue(getRepresentativeVariantLabel(product))
                  : MISSING_VALUE}
              </td>
            ))}
          </tr>

          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-outline-variant bg-surface-container-lowest px-4 py-3 text-left font-semibold text-secondary">
              SKU
            </th>
            {results.map(({ item, product }) => (
              <td
                key={item.id}
                className="border-b border-r border-outline-variant px-4 py-3 text-on-surface last:border-r-0"
              >
                {displayValue(
                  product ? getRepresentativeVariant(product)?.sku : null,
                )}
              </td>
            ))}
          </tr>

          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-outline-variant bg-surface-container-lowest px-4 py-3 text-left font-semibold text-secondary">
              Tình trạng
            </th>
            {results.map(({ item, product }) => {
              const variant = product ? getRepresentativeVariant(product) : null;
              const stockStatus = variant?.stockStatus ?? product?.stockStatus;

              return (
                <td
                  key={item.id}
                  className="border-b border-r border-outline-variant px-4 py-3 last:border-r-0"
                >
                  {stockStatus ? (
                    <span
                      className={
                        stockStatus === "in-stock"
                          ? "font-semibold text-green-700"
                          : "font-semibold text-error"
                      }
                    >
                      {stockStatus === "in-stock" ? "Còn hàng" : "Hết hàng"}
                    </span>
                  ) : (
                    MISSING_VALUE
                  )}
                </td>
              );
            })}
          </tr>

          {specificationGroups.map((group) => (
            <CompareSpecificationGroupRows
              key={group.key}
              group={group}
              results={results}
            />
          ))}

          {specificationGroups.length === 0 ? (
            <tr>
              <td
                colSpan={results.length + 1}
                className="px-5 py-8 text-center text-secondary"
              >
                Các sản phẩm này chưa có thông số kỹ thuật từ API.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function CompareSpecificationGroupRows({
  group,
  results,
}: {
  group: CompareSpecificationGroup;
  results: CompareProductResult[];
}) {
  return (
    <>
      <tr>
        <th
          colSpan={results.length + 1}
          className="border-b border-outline-variant bg-surface-container px-4 py-3 text-left text-base font-semibold text-on-surface"
        >
          {group.groupName}
        </th>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.key}>
          <th className="sticky left-0 z-10 border-b border-r border-outline-variant bg-surface-container-lowest px-4 py-3 text-left font-semibold text-secondary">
            {row.label}
          </th>
          {results.map(({ item, product }) => (
            <td
              key={item.id}
              className="border-b border-r border-outline-variant px-4 py-3 leading-6 text-on-surface last:border-r-0"
            >
              {product
                ? displayValue(row.values[product.id])
                : MISSING_VALUE}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
