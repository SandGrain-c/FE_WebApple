"use client";

import type { ProductCardItem, ProductVariant } from "@/types/product.type";
import type { ProductDetail } from "@/types/product-detail.type";

import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useCompareStore } from "@/store/compare.store";
import { useToastStore } from "@/store/toast.store";
import { useGlobalLoadingStore } from "@/store/global-loading.store";

type ProductActionButtonsProps = {
  product: ProductDetail;
  selectedVariant: ProductVariant | null;
};

function mapProductDetailToCompareItem(
  product: ProductDetail,
  selectedVariant: ProductVariant | null
): ProductCardItem {
  const fallbackImage =
    selectedVariant?.images?.[0]?.imageUrl ??
    product.images?.find((image) => image.isThumbnail)?.imageUrl ??
    product.images?.[0]?.imageUrl ??
    "";

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: fallbackImage,

    price: selectedVariant?.price ?? product.price,
    oldPrice: product.oldPrice,
    discountLabel: product.discountLabel,
    installment: product.installment,
    promotions: product.promotions,

    categorySlug: product.categorySlug,
    categoryName: product.categoryName,

    colors: product.colors,
    capacities: product.capacities,
    ramOptions: product.ramOptions,

    stockQuantity: selectedVariant?.stockQuantity ?? product.stockQuantity,
    stockStatus: selectedVariant?.stockStatus ?? product.stockStatus,

    sold: product.sold,
    createdAt: product.createdAt,

    variants: product.variants,
  };
}

export default function ProductActionButtons({
  product,
  selectedVariant,
}: ProductActionButtonsProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const addToCart = useCartStore((state) => state.addToCart);
  const isCartLoading = useCartStore((state) => state.isLoading);

  const addToCompare = useCompareStore((state) => state.addToCompare);

  const showToast = useToastStore((state) => state.showToast);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  const isPurchaseDisabled =
    !selectedVariant || selectedVariant.stockStatus === "out-of-stock";

  async function handleAddToCart() {
    if (!selectedVariant) {
      showToast({
        type: "warning",
        message: "Vui lòng chọn phiên bản sản phẩm.",
      });
      return;
    }

    if (selectedVariant.stockStatus === "out-of-stock") {
      showToast({
        type: "warning",
        message: "Phiên bản này hiện đã hết hàng.",
      });
      return;
    }

    if (!isAuthenticated) {
      showToast({
        type: "warning",
        message: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.",
      });
      return;
    }

    showLoading({
      title: "Chờ một xíu nhaaa...",
      description: "Đang thêm sản phẩm vào giỏ hàng.",
    });

    try {
      const result = await addToCart({
        productId: product.id,
        variantId: selectedVariant.variantId,
        quantity: 1,
      });

      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch {
      showToast({
        type: "error",
        message: "Không thể thêm sản phẩm vào giỏ hàng.",
      });
    } finally {
      hideLoading();
    }
  }

  async function handleBuyNow() {
    if (!selectedVariant) {
      showToast({
        type: "warning",
        message: "Vui lòng chọn phiên bản sản phẩm.",
      });
      return;
    }

    if (selectedVariant.stockStatus === "out-of-stock") {
      showToast({
        type: "warning",
        message: "Phiên bản này hiện đã hết hàng.",
      });
      return;
    }

    if (!isAuthenticated) {
      showToast({
        type: "warning",
        message: "Bạn cần đăng nhập để mua sản phẩm.",
      });
      return;
    }

    showLoading({
      title: "Chờ một xíu nhaaa...",
      description: "Đang chuẩn bị đơn hàng của bạn.",
    });

    try {
      const result = await addToCart({
        productId: product.id,
        variantId: selectedVariant.variantId,
        quantity: 1,
      });

      if (!result.success) {
        showToast({
          type: "error",
          message: result.message,
        });
        return;
      }

      showToast({
        type: "success",
        message:
          "Đã thêm sản phẩm vào giỏ hàng. Sau này sẽ chuyển sang trang thanh toán.",
      });

      // Sau này khi có checkout page thì mở dòng này:
      // router.push("/checkout");
    } catch {
      showToast({
        type: "error",
        message: "Không thể thực hiện mua ngay.",
      });
    } finally {
      hideLoading();
    }
  }

  function handleAddToCompare() {
    const compareItem = mapProductDetailToCompareItem(product, selectedVariant);

    const result = addToCompare(compareItem);

    if (typeof result === "object" && result !== null && "message" in result) {
      showToast({
        type: result.success ? "success" : "warning",
        message: String(result.message),
      });
      return;
    }

    showToast({
      type: "success",
      message: "Đã thêm sản phẩm vào so sánh.",
    });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isPurchaseDisabled || isCartLoading}
          onClick={handleAddToCart}
          className="rounded-xl bg-primary px-5 py-3 font-medium text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCartLoading ? "Đang thêm..." : "Thêm vào giỏ hàng"}
        </button>

        <button
          type="button"
          disabled={isPurchaseDisabled || isCartLoading}
          onClick={handleBuyNow}
          className="rounded-xl border border-primary px-5 py-3 font-medium text-primary transition hover:bg-surface-container-lowest disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mua ngay
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="rounded-xl border border-outline-variant px-5 py-3 font-medium text-on-surface transition hover:border-primary hover:text-primary"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">
              favorite
            </span>
            Yêu thích
          </span>
        </button>

        <button
          type="button"
          onClick={handleAddToCompare}
          className="rounded-xl border border-outline-variant px-5 py-3 font-medium text-on-surface transition hover:border-primary hover:text-primary"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">
              compare_arrows
            </span>
            Thêm vào so sánh
          </span>
        </button>
      </div>
    </div>
  );
}