// src/types/admin-product-image.type.ts

import type { ApiResponse } from "@/types/auth.type";

export type AdminProductImage = {
  imageId: number;
  productId: number;
  variantId: number | null;
  color: string;
  imageUrl: string;
  altText: string | null;
  isThumbnail: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  cloudinaryPublicId: string | null;
};

export type AdminProductImageListQuery = {
  includeInactive?: boolean;
  color?: string;
  variantId?: number;
};

export type AdminProductImageListResponseData = AdminProductImage[];

export type UploadAdminProductImagePayload = {
  file: File;
  variantId?: number;
  color?: string;
  altText?: string;
  isThumbnail?: boolean;
  sortOrder?: number;
  isActive?: boolean;
};

export type BulkUploadAdminProductImagePayload = {
  files: File[];
  variantId?: number;
  color?: string;
  altText?: string;
  thumbnailIndex?: number;
  sortOrderStart?: number;
  isActive?: boolean;
};

export type UpdateAdminProductImagePayload = {
  file?: File;
  variantId?: number | null;
  color?: string;
  altText?: string;
  isThumbnail?: boolean;
  sortOrder?: number;
  isActive?: boolean;
};

export type AdminProductImageMutationResponseData = {
  image: AdminProductImage;
};

export type AdminProductImageBulkResponseData = {
  images: AdminProductImage[];
};

export type AdminProductImageApiResponse<T> = ApiResponse<T>;