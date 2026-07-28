// src/types/admin-banner.type.ts

import type { ApiResponse } from "@/types/auth.type";

export type AdminBannerStatusFilter = "all" | "true" | "false";

export type AdminBanner = {
  bannerId: number;
  title: string | null;
  imageUrl: string | null;
  cloudinaryPublicId: string | null;
  targetUrl: string | null;
  position: string | null;
  isActive: boolean;
};

export type AdminBannerListQuery = {
  position?: string;
  isActive?: boolean;
};

export type AdminBannerListResponseData = AdminBanner[];

export type CreateAdminBannerPayload = {
  file: File;
  title?: string;
  targetUrl?: string;
  position?: string;
  isActive?: boolean;
};

export type UpdateAdminBannerPayload = {
  file?: File;
  title?: string;
  targetUrl?: string;
  position?: string;
  isActive?: boolean;
};

export type AdminBannerMutationResponseData = {
  banner: AdminBanner;
};

export type AdminBannerApiResponse<T> = ApiResponse<T>;