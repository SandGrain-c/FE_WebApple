export type SearchSuggestItem = {
  id: number;
  name: string;
  slug: string;
  categorySlug: string;
  image: string | null;
  price: number;
};

export type SearchSuggestResponseData = {
  items: SearchSuggestItem[];
};

export type SearchSuggestApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};