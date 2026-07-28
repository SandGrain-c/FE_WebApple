// src/app/(main)/page.tsx
import Banner from "@/components/home/Banner";
// import FlashSale from "@/components/home/FlashSale";
import Product from "@/components/home/Product";
// import RecentlyViewedProducts from "@/components/home/RecentlyViewedProducts";
// import VideoReview from "@/components/home/VideoReview";
// import TrustPoint from "@/components/layout/TrustPoint";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <>
      <Banner />
   
      <Product />
      
    </>
  );
}