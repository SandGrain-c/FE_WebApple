import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  // Buộc Turbopack coi thư mục fe là application root.
  // Nếu không khai báo, root đang bị suy ra thành thư mục WebApple.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
