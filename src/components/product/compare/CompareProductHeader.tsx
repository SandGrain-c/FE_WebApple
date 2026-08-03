import Image from "next/image";
import Link from "next/link";

import {
  getCompareProductImage,
  getRepresentativeVariant,
} from "@/lib/compare/product-display";
import { formatPrice } from "@/utils/format-price";
import type { CompareProductResult } from "@/types/compare.type";

type CompareProductHeaderProps = {
  result: CompareProductResult;
  onRemove: (productId: number, productName: string) => void;
};

export default function CompareProductHeader({
  result,
  onRemove,
}: CompareProductHeaderProps) {
  const { item, product, error } = result;
  const productHref = `/${item.categorySlug}/${item.slug}`;
  const representativeVariant = product
    ? getRepresentativeVariant(product)
    : null;
  const displayPrice = representativeVariant?.price ?? product?.price;

  return (
    <div className="flex h-full min-h-96 flex-col p-4 text-left">
      <button
        type="button"
        onClick={() => onRemove(item.id, item.name)}
        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-secondary transition hover:bg-red-50 hover:text-error"
        aria-label={`Xóa ${item.name} khỏi trang so sánh`}
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>

      <div className="relative mx-auto mt-1 aspect-square w-36 overflow-hidden rounded-xl bg-white sm:w-40">
        <Image
          src={
            product
              ? getCompareProductImage(product, item.image)
              : item.image || "/sale/flash-sale-1.webp"
          }
          alt={item.name}
          fill
          sizes="160px"
          className="object-contain p-2"
        />
      </div>

      <h2 className="mt-3 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-on-surface">
        {product?.name ?? item.name}
      </h2>

      {error ? (
        <div className="mt-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm font-normal leading-5 text-error">
          {error}
        </div>
      ) : (
        <>
          <p className="mt-3 text-lg font-bold text-primary">
            {displayPrice !== undefined ? formatPrice(displayPrice) : "—"}
          </p>
          {product?.oldPrice ? (
            <p className="mt-1 text-sm font-normal text-secondary line-through">
              {formatPrice(product.oldPrice)}
            </p>
          ) : null}
        </>
      )}

      <div className="mt-auto pt-4">
        {product ? (
          <Link
            href={productHref}
            className="inline-flex w-full items-center justify-center rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Xem chi tiết
          </Link>
        ) : null}
      </div>
    </div>
  );
}
