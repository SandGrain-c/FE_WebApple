import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import CompareFloatingBar from "@/components/product/compare/CompareFloatingBar";
import ScrollToTopButton from "@/components/layout/ScrollToTopButton";
import RecentlyViewedProducts from "@/components/common/RecentlyViewedProducts";
type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <RecentlyViewedProducts className="my-8" />
      <Footer />
      <BottomNav />
      <CompareFloatingBar />
      <ScrollToTopButton />
      
    </>
  );
}