import type { Metadata } from "next";
import "swiper/css";
import "swiper/css/navigation";
import "./globals.css";
import ToastContainer from "@/components/ui/ToastContainer";
import AppLoadingOverlay from "@/components/common/loading/AppLoadingOverlay";
export const metadata: Metadata = {
  title: "Đức Bách Hoá",
  description: "Chuyên sản phẩm Apple chính hãng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
                    rel="stylesheet"
                />
      </head>
      <body className="bg-surface text-black pt-16 md:pt-28">
        <ToastContainer />
        <AppLoadingOverlay />
        {children}
      </body>
    </html>
  );
}
