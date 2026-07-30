import type { StockStatus } from "@/types/product.type";

type ProductInfoPanelProps = {
  name: string;
  price: number;
  oldPrice?: number | null;
  discountLabel?: string | null;
  installment?: string | null;
  ratingAverage?: number;
  reviewCount?: number;
  sold?: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  hasSelectedVariant: boolean;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("vi-VN")}₫`;
}

export default function ProductInfoPanel({
  name,
  price,
  oldPrice,
  discountLabel,
  installment,
  ratingAverage,
  reviewCount,
  sold,
  stockQuantity,
  stockStatus,
  hasSelectedVariant,
}: ProductInfoPanelProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold leading-tight text-on-surface sm:text-3xl">
        {name}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-secondary">
        <span>⭐ {ratingAverage ?? 0}</span>
        <span>•</span>
        <span>{reviewCount ?? 0} đánh giá</span>
        <span>•</span>
        <span>Đã bán {sold ?? 0}</span>
      </div>

      <div className="mt-5 rounded-2xl bg-surface-container-lowest p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-3xl font-bold text-primary">
            {formatPrice(price)}
          </p>

          {discountLabel ? (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary">
              {discountLabel}
            </span>
          ) : null}
        </div>

        {oldPrice ? (
          <p className="mt-1 text-sm text-secondary line-through">
            {formatPrice(oldPrice)}
          </p>
        ) : null}

        {installment ? (
          <p className="mt-2 text-sm font-medium text-primary">
            {installment}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
        <p className="font-medium text-on-surface">Tình trạng</p>

        {hasSelectedVariant ? (
          <p className="mt-1 text-sm text-secondary">
            {stockStatus === "in-stock"
              ? `Còn hàng - ${stockQuantity} sản phẩm`
              : "Phiên bản này hiện đã hết hàng"}
          </p>
        ) : (
          <p className="mt-1 text-sm text-red-500">
            Phiên bản này hiện không có sẵn
          </p>
        )}
      </div>
    </div>
  );
}