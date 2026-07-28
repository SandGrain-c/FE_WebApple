import type { GetProductsResponse } from "@/types/product.type";
import type { ProductDetailResponse } from "@/types/product-detail.type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type GetProductsParams = {
  category?: string;
  color?: string;
  capacity?: string;
  ram?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

export async function getProducts(params: GetProductsParams) {
  const searchParams = new URLSearchParams();

  if (params.category) searchParams.set("category", params.category);
  if (params.color) searchParams.set("color", params.color);
  if (params.capacity) searchParams.set("capacity", params.capacity);
  if (params.ram) searchParams.set("ram", params.ram);
  if (params.minPrice !== undefined) searchParams.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) searchParams.set("maxPrice", String(params.maxPrice));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/products?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể lấy danh sách sản phẩm");
  }

  const json: GetProductsResponse = await res.json();
  

  return json.data;
}

export async function getProductDetail(
  categorySlug: string,
  productSlug: string
): Promise<ProductDetailResponse | null> {
  const res = await fetch(
    `${API_URL}/products/${categorySlug}/${productSlug}`,
    {
      cache: "no-store",
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