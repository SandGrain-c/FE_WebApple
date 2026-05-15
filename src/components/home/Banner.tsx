'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Import component Image của Next.js

export default function Banner() {
  // Thay đổi đường dẫn URL thành đường dẫn tương đối từ thư mục public/
  const largeBanners = [
    '/banners/banner-to-1.jpg', // Đảm bảo bạn có file này trong public/banners/
    '/banners/banner-to-2.jpg',
    '/banners/banner-to-3.jpg',
  ];

  const smallBannerPairs = [
    {
      id: 1,
      small1: '/banners/banner-nho-1.jpg',
      small2: '/banners/banner-nho-2.jpg',
    },
    {
      id: 2,
      small1: '/banners/banner-nho-2a.jpg',
      small2: '/banners/banner-nho-2b.jpg',
    },
    {
      id: 3,
      small1: '/banners/banner-nho-3a.jpg',
      small2: '/banners/banner-nho-3b.jpg',
    },
  ];

  const [bgIndex, setBgIndex] = useState(0); 
  const [smallIndex, setSmallIndex] = useState(0); 
  const [isHoverSmall, setIsHoverSmall] = useState(false);

  useEffect(() => {
    const bgTimer = setInterval(() => {
      setBgIndex((prev) => (prev === largeBanners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(bgTimer);
  }, [largeBanners.length]);

  useEffect(() => {
    const smallTimer = setInterval(() => {
      setSmallIndex((prev) => (prev === smallBannerPairs.length - 1 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(smallTimer);
  }, [smallBannerPairs.length]);

  const prevBg = () => setBgIndex((prev) => (prev === 0 ? largeBanners.length - 1 : prev - 1));
  const nextBg = () => setBgIndex((prev) => (prev === largeBanners.length - 1 ? 0 : prev + 1));
  
  const prevSmall = () => setSmallIndex((prev) => (prev === 0 ? smallBannerPairs.length - 1 : prev - 1));
  const nextSmall = () => setSmallIndex((prev) => (prev === smallBannerPairs.length - 1 ? 0 : prev + 1));

  return (
    // main container
    <div className="w-full">
      <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden group/bg">
        
        {/* ================= LỚP 1: BANNER NỀN ================= */}
        <div 
          className="absolute inset-0 flex transition-transform duration-700 ease-in-out z-0"
          style={{ transform: `translateX(-${bgIndex * 100}%)` }}
        >
          {largeBanners.map((bgSrc, index) => (
            <div key={index} className="relative w-full h-full flex-shrink-0">
              <Image 
                src={bgSrc} 
                alt={`Background ${index + 1}`} 
                fill // Quan trọng: thay thế cho w-full h-full khi dùng Next/Image
                sizes="100vw" // Gợi ý cho trình duyệt tải ảnh đúng kích thước màn hình
                priority={index === 0} // Ưu tiên tải ngay banner đầu tiên để tối ưu LCP
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-black/10 z-0 hover:bg-black/20 transition-colors duration-300"></div>

        {/* ================= LỚP 2: CẶP BANNER NHỎ ================= */}
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
                  <div key={pair.id} className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative w-full h-[100px] md:h-[140px] rounded-xl overflow-hidden shadow-md cursor-pointer group-hover/smallItem:shadow-lg">
                       <Image 
                        src={pair.small1} 
                        alt="Small A" 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <div className="relative w-full h-[100px] md:h-[140px] rounded-xl overflow-hidden shadow-md cursor-pointer group-hover/smallItem:shadow-lg">
                      <Image 
                        src={pair.small2} 
                        alt="Small B" 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút chuyển TRÁI - Banner Nhỏ */}
              <button 
                onClick={prevSmall}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover/small:opacity-100 transition-opacity duration-300 shadow-md"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>

              {/* Nút chuyển PHẢI - Banner Nhỏ */}
              <button 
                onClick={nextSmall}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover/small:opacity-100 transition-opacity duration-300 shadow-md"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ================= LỚP 3: BỘ ĐIỀU KHIỂN BANNER TO ================= */}
        <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${isHoverSmall ? '!opacity-0' : 'opacity-0 group-hover/bg:opacity-100'}`}>
          <div className="relative w-full h-full">
            {/* Cụm Nút Trái Phải */}
            <div className="absolute inset-x-0 top-[35%] -translate-y-1/2 mx-auto w-full max-w-screen-xl px-4">
              <button 
                onClick={prevBg}
                className="pointer-events-auto absolute left-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <button 
                onClick={nextBg}
                className="pointer-events-auto absolute right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Cụm Chấm Tròn */}
            <div className="absolute top-4 right-4 flex gap-2 w-full max-w-screen-xl mx-auto px-4 justify-end pointer-events-auto">
              {largeBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setBgIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    bgIndex === index ? 'bg-white w-4' : 'bg-white/50 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}