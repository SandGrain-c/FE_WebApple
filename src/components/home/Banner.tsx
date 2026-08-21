// src/components/home/Banner.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { BANNER_POSITION_KEYS } from "@/config/banner";
import { getPublicBanners } from "@/services/banner.service";
import type { BannerDto } from "@/types/banner.type";

type SmallBannerPair = {
  id: string;
  items: BannerDto[];
};
// chia nhỏ các banner nhỏ thành cặp để hiển thị 2 banner nhỏ trên 1 hàng
function chunkSmallBanners(banners: BannerDto[]): SmallBannerPair[] {
  const pairs: SmallBannerPair[] = [];

  for (let index = 0; index < banners.length; index += 2) {
    pairs.push({
      id: `${banners[index]?.bannerId ?? index}-${banners[index + 1]?.bannerId ?? "empty"}`,
      items: banners.slice(index, index + 2),
    });
  }

  return pairs;
}
// kiểm tra xem URL có phải là URL bên ngoài hay không
function isExternalUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

type BannerLinkWrapperProps = {
  banner: BannerDto;
  children: React.ReactNode;
  className?: string;
};
// bọc banner bằng thẻ <a> hoặc <Link> tùy thuộc vào URL
function BannerLinkWrapper({
  banner,
  children,
  className,
}: BannerLinkWrapperProps) {
  if (!banner.targetUrl) {
    return <div className={className}>{children}</div>;
  }

  if (isExternalUrl(banner.targetUrl)) {
    return (
      <a
        href={banner.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={banner.targetUrl} className={className}>
      {children}
    </Link>
  );
}

type BannerImageProps = {
  banner: BannerDto;
  altPrefix: string;
  priority?: boolean;
  sizes: string;
  className?: string;
  imageClassName?: string;
};

function BannerImage({
  banner,
  altPrefix,
  priority = false,
  sizes,
  className,
  imageClassName,
}: BannerImageProps) {
  if (!banner.imageUrl) return null;

  return (
    <BannerLinkWrapper banner={banner} className={className}>
      <Image
        src={banner.imageUrl}
        alt={banner.title || altPrefix}
        fill
        sizes={sizes}
        priority={priority}
        className={imageClassName}
      />
    </BannerLinkWrapper>
  );
}

export default function Banner() {
  // trạng thái của các banner
  const [largeBanners, setLargeBanners] = useState<BannerDto[]>([]);
  const [smallBanners, setSmallBanners] = useState<BannerDto[]>([]);
  // trạng thái hiển thị của các banner
  const [bgIndex, setBgIndex] = useState(0);
  const [smallIndex, setSmallIndex] = useState(0);
  const [isHoverSmall, setIsHoverSmall] = useState(false);
  // trạng thái tải dữ liệu
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // chia nhỏ các banner nhỏ thành cặp để hiển thị 2 banner nhỏ trên 1 hàng
  const smallBannerPairs = useMemo(
    () => chunkSmallBanners(smallBanners),
    [smallBanners]
  );
 // tải dữ liệu banner khi component được mount
  useEffect(() => {
    let isMounted = true;

    async function fetchBanners() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [heroBanners, smallBannerItems] = await Promise.all([
          getPublicBanners(BANNER_POSITION_KEYS.HOME_HERO),
          getPublicBanners(BANNER_POSITION_KEYS.HOME_SMALL),
        ]);

        if (!isMounted) return;

        setLargeBanners(heroBanners.filter((banner) => !!banner.imageUrl));
        setSmallBanners(smallBannerItems.filter((banner) => !!banner.imageUrl));
        setBgIndex(0);
        setSmallIndex(0);
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải banner trang chủ";

        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBanners();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (largeBanners.length <= 1) return;

    const bgTimer = setInterval(() => {
      setBgIndex((prev) =>
        prev === largeBanners.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(bgTimer);
  }, [largeBanners.length]);

  useEffect(() => {
    if (smallBannerPairs.length <= 1) return;

    const smallTimer = setInterval(() => {
      setSmallIndex((prev) =>
        prev === smallBannerPairs.length - 1 ? 0 : prev + 1
      );
    }, 7000);

    return () => clearInterval(smallTimer);
  }, [smallBannerPairs.length]);

  const prevBg = () => {
    if (largeBanners.length <= 1) return;

    setBgIndex((prev) =>
      prev === 0 ? largeBanners.length - 1 : prev - 1
    );
  };

  const nextBg = () => {
    if (largeBanners.length <= 1) return;

    setBgIndex((prev) =>
      prev === largeBanners.length - 1 ? 0 : prev + 1
    );
  };

  const prevSmall = () => {
    if (smallBannerPairs.length <= 1) return;

    setSmallIndex((prev) =>
      prev === 0 ? smallBannerPairs.length - 1 : prev - 1
    );
  };

  const nextSmall = () => {
    if (smallBannerPairs.length <= 1) return;

    setSmallIndex((prev) =>
      prev === smallBannerPairs.length - 1 ? 0 : prev + 1
    );
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="w-full">
        <div className="relative w-full h-[220px] md:h-[320px] overflow-hidden bg-gray-50 flex items-center justify-center text-sm text-gray-500">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (largeBanners.length === 0 && smallBannerPairs.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden group/bg">
        {/* ================= LỚP 1: BANNER NỀN ================= */}
        {largeBanners.length > 0 && (
          <div
            className="absolute inset-0 flex transition-transform duration-700 ease-in-out z-0"
            style={{ transform: `translateX(-${bgIndex * 100}%)` }}
          >
            {largeBanners.map((banner, index) => (
              <div
                key={banner.bannerId}
                className="relative w-full h-full flex-shrink-0"
              >
                <BannerImage
                  banner={banner}
                  altPrefix={`Banner lớn ${index + 1}`}
                  priority={index === 0}
                  sizes="100vw"
                  className="block relative w-full h-full"
                  imageClassName="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-black/10 z-0 hover:bg-black/20 transition-colors duration-300" />

        {/* ================= LỚP 2: CẶP BANNER NHỎ ================= */}
        {smallBannerPairs.length > 0 && (
          <div
            className="absolute inset-x-0 bottom-0 z-20"
            onMouseEnter={() => setIsHoverSmall(true)}
            onMouseLeave={() => setIsHoverSmall(false)}
          >
            <div className="max-w-screen-xl mx-auto w-full px-4 md:px-6 pb-4 md:pb-6 relative group/small">
              <div className="relative w-full overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${smallIndex * 100}%)` }}
                >
                  {smallBannerPairs.map((pair) => (
                    <div
                      key={pair.id}
                      className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {pair.items.map((banner, index) => (
                        <div
                          key={banner.bannerId}
                          className="relative w-full h-[100px] md:h-[140px] rounded-xl overflow-hidden shadow-md cursor-pointer"
                        >
                          <BannerImage
                            banner={banner}
                            altPrefix={`Banner nhỏ ${index + 1}`}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="block relative w-full h-full"
                            imageClassName="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}

                      {pair.items.length === 1 && (
                        <div className="hidden md:block relative w-full h-[140px] rounded-xl overflow-hidden bg-white/20" />
                      )}
                    </div>
                  ))}
                </div>

                {smallBannerPairs.length > 1 && (
                  <>
                    <button
                      onClick={prevSmall}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover/small:opacity-100 transition-opacity duration-300 shadow-md"
                      aria-label="Banner nhỏ trước"
                    >
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={nextSmall}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover/small:opacity-100 transition-opacity duration-300 shadow-md"
                      aria-label="Banner nhỏ tiếp theo"
                    >
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= LỚP 3: BỘ ĐIỀU KHIỂN BANNER TO ================= */}
        {largeBanners.length > 1 && (
          <div
            className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${
              isHoverSmall
                ? "!opacity-0"
                : "opacity-0 group-hover/bg:opacity-100"
            }`}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-x-0 top-[35%] -translate-y-1/2 mx-auto w-full max-w-screen-xl px-4">
                <button
                  onClick={prevBg}
                  className="pointer-events-auto absolute left-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-colors"
                  aria-label="Banner lớn trước"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={nextBg}
                  className="pointer-events-auto absolute right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-colors"
                  aria-label="Banner lớn tiếp theo"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              <div className="absolute top-4 right-4 flex gap-2 w-full max-w-screen-xl mx-auto px-4 justify-end pointer-events-auto">
                {largeBanners.map((banner, index) => (
                  <button
                    key={banner.bannerId}
                    onClick={() => setBgIndex(index)}
                    aria-label={`Chuyển đến banner ${index + 1}`}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      bgIndex === index
                        ? "bg-white w-4"
                        : "bg-white/50 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
