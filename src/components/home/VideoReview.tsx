'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

type ReviewVideo = {
  id: number;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
};

const reviewVideos: ReviewVideo[] = [
  {
    id: 1,
    title: 'Đánh giá iPhone 15 Pro Max',
    description: 'Thiết kế titanium, camera tốt, hiệu năng mạnh.',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    // thumbnail: '/sale/flash-sale-1.webp',
  },
  {
    id: 2,
    title: 'Trải nghiệm MacBook Air M2',
    description: 'Mỏng nhẹ, pin tốt, phù hợp học tập và văn phòng.',
    url: '/videos/review-macbook-air.mp4',
    thumbnail: '/sale/flash-sale-1.webp',
  },
  {
    id: 3,
    title: 'iPad Gen 10 có đáng mua?',
    description: 'Màn hình lớn, hiệu năng ổn, phù hợp học online.',
    url: '/videos/review-ipad-gen-10.mp4',
    thumbnail: '/sale/flash-sale-1.webp',
  },
  {
    id: 4,
    title: 'Apple Watch Series 9',
    description: 'Theo dõi sức khỏe tốt, thiết kế đẹp.',
    url: '/videos/review-apple-watch.mp4',
    thumbnail: '/sale/flash-sale-1.webp',
  },
  {
    id: 5,
    title: 'So sánh iPhone 14 và iPhone 15',
    description: 'Nên mua bản nào trong tầm giá hiện tại?',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: '/sale/flash-sale-1.webp',
  },
  {
    id: 6,
    title: 'MacBook Pro M3 cho lập trình',
    description: 'Hiệu năng cao, màn đẹp, phù hợp làm việc nặng.',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: '/sale/flash-sale-1.webp',
  },
];

const getYoutubeEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtube.com')) {
      const videoId = parsedUrl.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }

    if (parsedUrl.hostname.includes('youtu.be')) {
      const videoId = parsedUrl.pathname.replace('/', '');
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }

    return url;
  } catch {
    return url;
  }
};

const isLocalVideo = (url: string) => {
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
};

export default function VideoReview() {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

  const selectedVideo =
    selectedVideoIndex !== null ? reviewVideos[selectedVideoIndex] : null;

  const closeModal = () => {
    setSelectedVideoIndex(null);
  };

  const goToPrevVideo = () => {
    setSelectedVideoIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;
      return currentIndex === 0 ? reviewVideos.length - 1 : currentIndex - 1;
    });
  };

  const goToNextVideo = () => {
    setSelectedVideoIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;
      return currentIndex === reviewVideos.length - 1 ? 0 : currentIndex + 1;
    });
  };

  return (
    <>
      <section className="container mx-auto px-3 md:px-5 mt-8">
        <div className="group relative bg-surface-container-lowest border border-surface-container-high rounded-2xl p-3 md:p-5 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-headline-md md:text-headline-xl text-on-surface font-bold">
                Review sản phẩm
              </h2>
              <p className="text-label-md md:text-body-md text-secondary mt-1">
                Video đánh giá thực tế iPhone, iPad, MacBook và phụ kiện Apple
              </p>
            </div>
          </div>

          <div className="relative">
            <Swiper
              modules={[Navigation]}
              spaceBetween={14}
              slidesPerGroup={1}
              navigation={{
                nextEl: '.video-review-next',
                prevEl: '.video-review-prev',
              }}
              breakpoints={{
                0: {
                  slidesPerView: 2.1,
                  spaceBetween: 12,
                },
                640: {
                  slidesPerView: 3,
                  spaceBetween: 14,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 16,
                },
              }}
              className="pb-1!"
            >
              {reviewVideos.map((video, index) => (
                <SwiperSlide key={video.id} className="h-auto">
                  <article
                    onClick={() => setSelectedVideoIndex(index)}
                    className="h-full cursor-pointer bg-surface border border-surface-container-high rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-9/16 bg-surface-container overflow-hidden">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : isLocalVideo(video.url) ? (
                        <video
                          src={video.url}
                          preload="metadata"
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high" />
                      )}

                      <div className="absolute inset-0 bg-black/25" />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-7 h-7 ml-1"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>

                      <div className="absolute left-0 right-0 bottom-0 p-3 bg-linear-to-t from-black/75 via-black/25 to-transparent">
                        <h3 className="text-white text-label-md md:text-body-md font-bold line-clamp-2">
                          {video.title}
                        </h3>
                      </div>
                    </div>

                    {video.description && (
                      <div className="p-3">
                        <p className="text-label-sm md:text-label-md text-secondary line-clamp-2">
                          {video.description}
                        </p>
                      </div>
                    )}
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              className="video-review-prev absolute left-2 top-1/2 z-10 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-on-surface shadow-md border border-surface-container-high flex items-center justify-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 hover:bg-white hover:scale-105 disabled:opacity-0"
              aria-label="Video trước"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <button
              className="video-review-next absolute right-2 top-1/2 z-10 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-on-surface shadow-md border border-surface-container-high flex items-center justify-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 hover:bg-white hover:scale-105 disabled:opacity-0"
              aria-label="Video sau"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-3 py-4 md:px-6 md:py-6"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-105 md:max-w-120 max-h-[92dvh] bg-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-3 top-3 z-30 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Đóng video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={goToPrevVideo}
              className="absolute left-3 top-1/2 z-30 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
              aria-label="Video trước"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            <button
              onClick={goToNextVideo}
              className="absolute right-3 top-1/2 z-30 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
              aria-label="Video sau"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <div className="bg-black flex items-center justify-center max-h-[calc(92dvh-104px)]">
              <div className="aspect-9/16 w-full max-h-[calc(92dvh-104px)]">
                {isLocalVideo(selectedVideo.url) ? (
                  <video
                    key={selectedVideo.url}
                    src={selectedVideo.url}
                    poster={selectedVideo.thumbnail}
                    controls
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <iframe
                    key={selectedVideo.url}
                    src={getYoutubeEmbedUrl(selectedVideo.url)}
                    title={selectedVideo.title}
                    className="w-full h-full bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            </div>

            <div className="shrink-0 p-4 bg-surface">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-body-md md:text-headline-md font-bold text-on-surface line-clamp-2">
                    {selectedVideo.title}
                  </h3>

                  {selectedVideo.description && (
                    <p className="text-label-md text-secondary mt-1 line-clamp-2">
                      {selectedVideo.description}
                    </p>
                  )}
                </div>

                <span className="shrink-0 text-label-sm text-secondary bg-surface-container px-2 py-1 rounded-full">
                  {selectedVideoIndex! + 1}/{reviewVideos.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}