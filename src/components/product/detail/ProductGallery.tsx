"use client";

import { useEffect, useRef } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

type GalleryImage = {
  imageId: number;
  imageUrl: string;
  altText: string | null;
  isThumbnail: boolean;
  sortOrder: number;
};

type ProductGalleryProps = {
  productName: string;
  images: GalleryImage[];
  selectedImageUrl: string;
  onSelectImage: (imageUrl: string) => void;
};

export default function ProductGallery({
  productName,
  images,
  selectedImageUrl,
  onSelectImage,
}: ProductGalleryProps) {
  const swiperRef = useRef<SwiperType | null>(null);

  const currentImageIndex = images.findIndex(
    (image) => image.imageUrl === selectedImageUrl
  );

  const safeCurrentImageIndex = currentImageIndex >= 0 ? currentImageIndex : 0;

  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (!swiperRef.current) return;

    swiperRef.current.slideTo(safeCurrentImageIndex);
  }, [safeCurrentImageIndex]);

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex aspect-square items-center justify-center rounded-xl bg-surface text-sm text-secondary">
          Chưa có ảnh sản phẩm
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="group relative overflow-hidden rounded-xl bg-surface">
        <Swiper
          modules={[Navigation]}
          slidesPerView={1}
          spaceBetween={12}
          allowTouchMove
          navigation={{
            prevEl: ".product-gallery-prev",
            nextEl: ".product-gallery-next",
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            const activeImage = images[swiper.activeIndex];

            if (activeImage) {
              onSelectImage(activeImage.imageUrl);
            }
          }}
          className="aspect-square"
        >
          {images.map((image) => (
            <SwiperSlide key={image.imageId}>
              <div className="flex h-full w-full items-center justify-center">
                <img
                  src={image.imageUrl}
                  alt={image.altText ?? productName}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              aria-label="Xem ảnh trước"
              className="product-gallery-prev absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface/90 text-on-surface opacity-0 shadow-md transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary group-hover:opacity-100"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              type="button"
              aria-label="Xem ảnh tiếp theo"
              className="product-gallery-next absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface/90 text-on-surface opacity-0 shadow-md transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary group-hover:opacity-100"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>

            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-secondary opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
              {safeCurrentImageIndex + 1} / {images.length}
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
        {images.map((image, index) => {
          const isActive = selectedImageUrl === image.imageUrl;

          return (
            <button
              key={image.imageId}
              type="button"
              onClick={() => {
                onSelectImage(image.imageUrl);
                swiperRef.current?.slideTo(index);
              }}
              aria-label={`Xem ảnh ${index + 1} của ${productName}`}
              className={`rounded-xl border bg-surface p-2 transition hover:border-primary ${
                isActive
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-outline-variant"
              }`}
            >
              <img
                src={image.imageUrl}
                alt={image.altText ?? productName}
                className="aspect-square w-full object-contain"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}