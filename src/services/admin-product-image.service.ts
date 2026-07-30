// src/services/admin-product-image.service.ts

import type {
  AdminProductImage,
  AdminProductImageApiResponse,
  AdminProductImageBulkResponseData,
  AdminProductImageListQuery,
  AdminProductImageListResponseData,
  AdminProductImageMutationResponseData,
  BulkUploadAdminProductImagePayload,
  UpdateAdminProductImagePayload,
  UploadAdminProductImagePayload,
} from "@/types/admin-product-image.type";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5002/api/admin";

/**
 * Parse response chung cho Admin Product Image API.
 */
async function parseAdminProductImageResponse<T>(
  response: Response
): Promise<AdminProductImageApiResponse<T>> {
  const data = (await response.json()) as AdminProductImageApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function buildProductImageQueryString(query?: AdminProductImageListQuery) {
  const searchParams = new URLSearchParams();

  if (!query) {
    return "";
  }

  if (typeof query.includeInactive === "boolean") {
    searchParams.set("includeInactive", String(query.includeInactive));
  }

  if (query.color) {
    searchParams.set("color", query.color);
  }

  if (query.variantId) {
    searchParams.set("variantId", String(query.variantId));
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

function appendOptionalFormValue(
  formData: FormData,
  key: string,
  value: string | number | boolean | null | undefined
) {
  if (value === undefined || value === null) {
    return;
  }

  formData.append(key, String(value));
}

function normalizeImageMutationData(
  data: unknown
): AdminProductImageMutationResponseData {
  if (data && typeof data === "object" && "image" in data) {
    return data as AdminProductImageMutationResponseData;
  }

  return {
    image: data as AdminProductImage,
  };
}

function normalizeBulkImageData(data: unknown): AdminProductImageBulkResponseData {
  if (Array.isArray(data)) {
    return {
      images: data as AdminProductImage[],
    };
  }

  if (data && typeof data === "object" && "images" in data) {
    return data as AdminProductImageBulkResponseData;
  }

  return {
    images: [],
  };
}

/**
 * Lấy danh sách ảnh sản phẩm.
 * API: GET /api/admin/products/:productId/images
 */
export async function getAdminProductImages(
  adminAccessToken: string,
  productId: number,
  query?: AdminProductImageListQuery
): Promise<AdminProductImageListResponseData> {
  const queryString = buildProductImageQueryString(query);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/products/${productId}/images${queryString}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      cache: "no-store",
    }
  );

  const result =
    await parseAdminProductImageResponse<AdminProductImageListResponseData>(
      response
    );

  return result.data;
}

/**
 * Upload 1 ảnh sản phẩm.
 * API: POST /api/admin/products/:productId/images
 * Field file phải là "file".
 */
export async function uploadAdminProductImage(
  adminAccessToken: string,
  productId: number,
  payload: UploadAdminProductImagePayload
): Promise<AdminProductImageMutationResponseData> {
  const formData = new FormData();

  formData.append("file", payload.file);
  appendOptionalFormValue(formData, "variantId", payload.variantId);
  appendOptionalFormValue(formData, "color", payload.color);
  appendOptionalFormValue(formData, "altText", payload.altText);
  appendOptionalFormValue(formData, "isThumbnail", payload.isThumbnail);
  appendOptionalFormValue(formData, "sortOrder", payload.sortOrder);
  appendOptionalFormValue(formData, "isActive", payload.isActive);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/products/${productId}/images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: formData,
    }
  );

  const result = await parseAdminProductImageResponse<unknown>(response);

  return normalizeImageMutationData(result.data);
}

/**
 * Upload nhiều ảnh sản phẩm.
 * API: POST /api/admin/products/:productId/images/bulk
 * Field nhiều file phải là "files".
 */
export async function bulkUploadAdminProductImages(
  adminAccessToken: string,
  productId: number,
  payload: BulkUploadAdminProductImagePayload
): Promise<AdminProductImageBulkResponseData> {
  const formData = new FormData();

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  appendOptionalFormValue(formData, "variantId", payload.variantId);
  appendOptionalFormValue(formData, "color", payload.color);
  appendOptionalFormValue(formData, "altText", payload.altText);
  appendOptionalFormValue(formData, "thumbnailIndex", payload.thumbnailIndex);
  appendOptionalFormValue(formData, "sortOrderStart", payload.sortOrderStart);
  appendOptionalFormValue(formData, "isActive", payload.isActive);

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/products/${productId}/images/bulk`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: formData,
    }
  );

  const result = await parseAdminProductImageResponse<unknown>(response);

  return normalizeBulkImageData(result.data);
}

/**
 * Cập nhật metadata hoặc thay file ảnh.
 * API: PATCH /api/admin/product-images/:imageId
 */
export async function updateAdminProductImage(
  adminAccessToken: string,
  imageId: number,
  payload: UpdateAdminProductImagePayload
): Promise<AdminProductImageMutationResponseData> {
  const formData = new FormData();

  if (payload.file) {
    formData.append("file", payload.file);
  }

  appendOptionalFormValue(formData, "variantId", payload.variantId);
  appendOptionalFormValue(formData, "color", payload.color);
  appendOptionalFormValue(formData, "altText", payload.altText);
  appendOptionalFormValue(formData, "isThumbnail", payload.isThumbnail);
  appendOptionalFormValue(formData, "sortOrder", payload.sortOrder);
  appendOptionalFormValue(formData, "isActive", payload.isActive);

  const response = await fetch(`${ADMIN_API_BASE_URL}/product-images/${imageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: formData,
  });

  const result = await parseAdminProductImageResponse<unknown>(response);

  return normalizeImageMutationData(result.data);
}

/**
 * Đặt ảnh làm thumbnail.
 * API: PATCH /api/admin/product-images/:imageId/thumbnail
 */
export async function setAdminProductImageThumbnail(
  adminAccessToken: string,
  imageId: number
): Promise<AdminProductImageMutationResponseData> {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/product-images/${imageId}/thumbnail`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    }
  );

  const result = await parseAdminProductImageResponse<unknown>(response);

  return normalizeImageMutationData(result.data);
}

/**
 * Xóa mềm ảnh sản phẩm.
 * Nếu destroyCloudinary=true thì BE có thể xóa luôn file trên Cloudinary.
 */
export async function deleteAdminProductImage(
  adminAccessToken: string,
  imageId: number,
  destroyCloudinary = false
): Promise<AdminProductImageMutationResponseData> {
  const queryString = destroyCloudinary ? "?destroyCloudinary=true" : "";

  const response = await fetch(
    `${ADMIN_API_BASE_URL}/product-images/${imageId}${queryString}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    }
  );

  const result = await parseAdminProductImageResponse<unknown>(response);

  return normalizeImageMutationData(result.data);
}