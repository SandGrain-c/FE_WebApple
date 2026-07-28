// src/types/admin-variant.type.ts

import type { ApiResponse } from "@/types/auth.type";

export type AdminVariant = {
  variantId: number;
  productId: number;
  variantName: string | null;
  sku: string;
  color: string | null;
  capacity: string | null;
  ram: string | null;
  country: string | null;
  price: number;
  oldPrice: number | null;
  installment: string | null;
  discountLabel: string | null;
  stockQuantity: number;
};

export type AdminVariantListResponseData = {
  variants: AdminVariant[];
};

export type AdminVariantDetailResponseData = {
  variant: AdminVariant;
};

export type CreateAdminVariantPayload = {
  variantName?: string;
  sku: string;
  color?: string;
  capacity?: string;
  ram?: string;
  country?: string;
  price: number;
  oldPrice?: number;
  installment?: string;
  discountLabel?: string;
  stockQuantity?: number;
};

export type UpdateAdminVariantPayload = Partial<CreateAdminVariantPayload>;

export type AdminVariantMutationResponseData = {
  variant: AdminVariant;
};

export type AdminVariantApiResponse<T> = ApiResponse<T>;