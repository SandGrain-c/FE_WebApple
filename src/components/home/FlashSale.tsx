'use client';

import React, { useState } from 'react';
import Image from 'next/image';
// 1. Import Swiper React components và modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

// 2. Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

// MOCK DATA: Sản phẩm (Giữ nguyên)
const mockProducts = [
  { id: 1, name: 'Laptop Asus Zenbook 14 OLED UX3407QA...', image: '/sale/flash-sale-1.webp', salePrice: '27.830.000đ', originalPrice: '31.990.000đ', discount: '-13%', stock: 'Còn 5/5 suất' },
  { id: 2, name: 'Laptop Acer Gaming Nitro ProPanel...', image: '/sale/flash-sale-1.webp', salePrice: '23.990.000đ', originalPrice: '30.990.000đ', discount: '-23%', stock: 'Còn 5/5 suất' },
  { id: 3, name: 'Laptop Acer', image: '/sale/flash-sale-1.webp', salePrice: '31.990.000đ', originalPrice: '41.990.000đ', discount: '-24%', stock: 'Còn 5/5 suất' },
  { id: 4, name: 'Laptop MSI Gaming Cyborg 15 i5 13420H Siêu mạnh mẽ', image: '/sale/flash-sale-1.webp', salePrice: '31.990.000đ', originalPrice: '37.490.000đ', discount: '-15%', stock: 'Còn 5/5 suất' },
  { id: 5, name: 'Laptop Asus Vivobook S14...', image: '/sale/flash-sale-1.webp', salePrice: '22.454.000đ', originalPrice: '25.990.000đ', discount: '-14%', stock: 'Còn 5/5 suất' }
];

const FlashSale = () => {
  const [activeTab, setActiveTab] = useState<'flash-sale' | 'best-seller'>('flash-sale');

  return (
    <div className="container mx-auto px-0 md:px-5 mt-8">
      <div className="bg-primary rounded-2xl pt-2 pb-2">
        
        {/* BANNER */}
        <div className="relative overflow-hidden px-2 md:px-0">
          <div className="hidden md:block relative w-full h-[120px]">
            <Image src="/sale/flash-sale-1.webp" alt="Flash Sale" fill priority className="object-contain" />
          </div>
        </div>

        {/* KHUNG NỘI DUNG */}
        <div className="bg-surface mx-2 md:mx-4 mt-2 rounded-xl overflow-hidden pb-3">
          
          {/* TABS */}
          <div className="flex border-b border-surface-container-high">
            <button
              onClick={() => setActiveTab('flash-sale')}
              className={`flex-1 py-3 md:py-4 flex flex-col items-center transition-colors relative cursor-pointer ${activeTab === 'flash-sale' ? 'bg-surface' : 'bg-surface-container-low hover:bg-surface-container'}`}
            >
              <span className={`text-label-md md:text-body-lg font-bold ${activeTab === 'flash-sale' ? 'text-primary' : 'text-secondary'}`}>⚡ Flash Sale</span>
              {activeTab === 'flash-sale' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
            </button>
            <button
              onClick={() => setActiveTab('best-seller')}
              className={`flex-1 py-3 md:py-4 flex flex-col items-center transition-colors relative cursor-pointer ${activeTab === 'best-seller' ? 'bg-surface' : 'bg-surface-container-low hover:bg-surface-container'}`}
            >
              <span className={`text-label-md md:text-body-lg font-bold ${activeTab === 'best-seller' ? 'text-primary' : 'text-secondary'}`}>🔥 Sản phẩm bán chạy</span>
              {activeTab === 'best-seller' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
            </button>
          </div>

          {/* DANH SÁCH SẢN PHẨM & NÚT ĐIỀU HƯỚNG */}
          <div className="relative group/carousel p-3">
            
            <Swiper
              modules={[Navigation]}
              spaceBetween={12} // Tương đương gap-3
              slidesPerView="auto" // Cho phép slide có kích thước tự do theo class Tailwind
              navigation={{
                nextEl: '.swiper-btn-next',
                prevEl: '.swiper-btn-prev',
              }}
              className="!pb-2" // Đệm dưới một chút để không bị cắt mất shadow khi hover
            >
              {mockProducts.map((product) => (
                <SwiperSlide key={product.id} className="!w-[180px] md:!w-[200px] h-auto">
                  {/* PRODUCT CARD: Ép h-full để giãn đều theo SwiperSlide */}
                  <div className="bg-surface border border-surface-container-high rounded-xl p-2.5 flex flex-col hover:shadow-md transition-shadow h-full">
                    
                    <div className="relative w-full aspect-square mb-3 flex-shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-contain" />
                      <div className="absolute -bottom-2 left-0 right-0 mx-auto w-[85%] bg-gradient-to-r from-[#ff4e00] to-[#fec800] text-white text-[10px] font-bold py-0.5 px-1 rounded-full flex items-center justify-center border border-white">
                        <span className="mr-1">⚡</span> {product.stock}
                      </div>
                    </div>

                    <div className="flex items-end mt-1 h-[24px] flex-shrink-0">
                      <div className="bg-primary text-on-primary text-label-md md:text-body-md font-bold px-1.5 py-0.5 flex-1 text-center rounded-l-sm truncate">
                        {product.salePrice}
                      </div>
                      <div className="bg-[#ffc107] text-on-surface text-[10px] font-bold px-1.5 py-0.5 rounded-r-sm whitespace-nowrap">
                        {product.discount}
                      </div>
                    </div>

                    <div className="text-secondary text-[11px] line-through mt-1 h-[16px] flex-shrink-0">
                      {product.originalPrice}
                    </div>

                    <h3 className="text-label-md text-on-surface font-medium line-clamp-2 mt-1.5 mb-2 leading-tight h-[36px] flex-shrink-0">
                      {product.name}
                    </h3>

                    <button className="w-full mt-auto bg-primary text-on-primary text-label-sm font-bold py-1.5 rounded-full hover:bg-primary-container transition-colors flex-shrink-0">
                      Mua ngay
                    </button>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* NÚT BẤM TRÁI (Custom cho Swiper) */}
            <button 
              className="swiper-btn-prev absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 border border-gray-200 text-gray-800 rounded-full hidden md:flex items-center justify-center shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 hover:bg-gray-50 disabled:opacity-0 disabled:cursor-not-allowed"
              aria-label="Cuộn trái"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* NÚT BẤM PHẢI (Custom cho Swiper) */}
            <button 
              className="swiper-btn-next absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 border border-gray-200 text-gray-800 rounded-full hidden md:flex items-center justify-center shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 hover:bg-gray-50 disabled:opacity-0 disabled:cursor-not-allowed"
              aria-label="Cuộn phải"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashSale;