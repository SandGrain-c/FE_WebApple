import type {
  SearchSuggestApiResponse,
  SearchSuggestResponseData,
} from "@/types/search.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseSearchSuggestResponse<T>(
  response: Response
): Promise<SearchSuggestApiResponse<T>> {
  const data = (await response.json()) as SearchSuggestApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Không thể lấy gợi ý tìm kiếm.");
  }

  return data;
}

/**
 * GET /api/products/search-suggest?q=iphone&limit=5
 * Public API, không cần token.
 */
export async function getProductSearchSuggest(
  keyword: string,
  limit = 5,
  signal?: AbortSignal
): Promise<SearchSuggestResponseData> {
  const searchParams = new URLSearchParams();

  searchParams.set("q", keyword);
  searchParams.set("limit", String(limit));

  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/products/search-suggest?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    }
  );

  const result =
    await parseSearchSuggestResponse<SearchSuggestResponseData>(response);

  return result.data;
}