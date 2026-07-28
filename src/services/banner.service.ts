import type { BannerDto } from "@/types/banner.type";

const CUSTOMER_API_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/api";


type BannerApiResponse = {
  success: boolean;
  message: string;
  data: BannerDto[];
};

/**
 * getPublicBanners:
 * Gọi Customer API để lấy banner public.
 */
export async function getPublicBanners(position?: string): Promise<BannerDto[]> {
  const url = new URL(`${CUSTOMER_API_URL}/banners`);

  if (position) {
    url.searchParams.set("position", position);
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  const result = (await response.json()) as BannerApiResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Không thể lấy danh sách banner");
  }

  return Array.isArray(result.data) ? result.data : [];
}