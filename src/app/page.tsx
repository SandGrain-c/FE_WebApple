import Header from '@/components/layout/Header';
import TrustPoint from '@/components/layout/TrustPoint';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import Banner from '@/components/home/Banner';
import FlashSale from '@/components/home/FlashSale';
import ReviewVideo from '@/components/home/VideoReview';
import ProductShowCase from '@/components/home/Product';
import RecentlyViewedProducts from '@/components/home/RecentlyViewedProducts';
export default function Home(){
  return (
    <>
      <Header />
      <Banner />
      <FlashSale />
      <ReviewVideo />
      <ProductShowCase />
      <RecentlyViewedProducts />
      <TrustPoint />
      <Footer/>
      <BottomNav/>
      
    </>
  );
}