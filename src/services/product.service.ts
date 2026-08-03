import type {
  GetProductsResponse,
  ProductCatalogQuery,
} from "@/types/product.type";
import type { ProductDetailResponse } from "@/types/product-detail.type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type GetProductsOptions = {
  signal?: AbortSignal;
};

type GetProductDetailOptions = {
  signal?: AbortSignal;
};

function appendTextParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | undefined,
) {
  const normalizedValue = value?.trim();

  if (normalizedValue) {
    searchParams.set(key, normalizedValue);
  }
}

function appendPriceParam(
  searchParams: URLSearchParams,
  key: string,
  value: number | undefined,
) {
  if (value !== undefined && Number.isFinite(value) && value >= 0) {
    searchParams.set(key, String(value));
  }
}

function appendPositiveIntegerParam(
  searchParams: URLSearchParams,
  key: string,
  value: number | undefined,
) {
  if (value !== undefined && Number.isSafeInteger(value) && value > 0) {
    searchParams.set(key, String(value));
  }
}

export async function getProducts(
  query: ProductCatalogQuery,
  options: GetProductsOptions = {},
) {
  if (
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice
  ) {
    throw new Error("Khoảng giá không hợp lệ");
  }

  const searchParams = new URLSearchParams();

  appendTextParam(searchParams, "categorySlug", query.categorySlug);
  appendTextParam(searchParams, "search", query.search);
  appendTextParam(searchParams, "color", query.color);
  appendTextParam(searchParams, "capacity", query.capacity);
  appendTextParam(searchParams, "ram", query.ram);
  appendPriceParam(searchParams, "minPrice", query.minPrice);
  appendPriceParam(searchParams, "maxPrice", query.maxPrice);
  appendTextParam(searchParams, "sort", query.sort);
  appendPositiveIntegerParam(searchParams, "page", query.page);
  appendPositiveIntegerParam(searchParams, "limit", query.limit);

  const queryString = searchParams.toString();
  const url = `${API_URL}/products${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    cache: "no-store",
    signal: options.signal,
  });

  if (!res.ok) {
    throw new Error("Không thể lấy danh sách sản phẩm");
  }

  const json: GetProductsResponse = await res.json();

  return json.data;
}

export async function getProductDetail(
  categorySlug: string,
  productSlug: string,
  options: GetProductDetailOptions = {},
): Promise<ProductDetailResponse | null> {
  const res = await fetch(
    `${API_URL}/products/${categorySlug}/${productSlug}`,
    {
      cache: "no-store",
      signal: options.signal,
    }
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Không thể lấy chi tiết sản phẩm");
  }

  const json: {
    success: boolean;
    message: string;
    data: ProductDetailResponse;
  } = await res.json();

  return json.data;
}
