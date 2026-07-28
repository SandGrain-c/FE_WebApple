// src/types/banner.type.ts
export type BannerDto = {
  bannerId: number;
  title: string | null;
  imageUrl: string | null;
  cloudinaryPublicId?: string | null;
  targetUrl: string | null;
  position: string | null;
  isActive: boolean;
};