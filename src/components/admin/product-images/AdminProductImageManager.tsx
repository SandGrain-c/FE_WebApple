// src/components/admin/product-images/AdminProductImageManager.tsx

"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  bulkUploadAdminProductImages,
  deleteAdminProductImage,
  getAdminProductImages,
  setAdminProductImageThumbnail,
} from "@/services/admin-product-image.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type { AdminProductImage } from "@/types/admin-product-image.type";
import type { AdminVariant } from "@/types/admin-variant.type";

type AdminProductImageManagerProps = {
  productId: number;
  variants: AdminVariant[];
  onImagesChanged?: () => void;
  // Báo số ảnh active hiện tại lên Product Detail
  onImageCountChange?: (count: number) => void;
};

type ImageToastVariant = "success" | "error" | "info";

type ImageToast = {
  id: number;
  variant: ImageToastVariant;
  title: string;
  description?: string;
};

const MAX_UPLOAD_FILES = 10;

function getVariantLabel(variant: AdminVariant) {
  const parts = [
    variant.color,
    variant.capacity,
    variant.ram,
    variant.country,
  ].filter(Boolean);

  if (parts.length === 0) {
    return variant.sku;
  }

  return `${parts.join(" - ")} · ${variant.sku}`;
}

function getVariantColor(variants: AdminVariant[], variantId: string) {
  const numericVariantId = Number(variantId);

  const variant = variants.find((item) => item.variantId === numericVariantId);

  return variant?.color || "";
}

type ImageToastStackProps = {
  toasts: ImageToast[];
  onClose: (id: number) => void;
};

function ImageToastStack({ toasts, onClose }: ImageToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[9999] mx-auto flex max-w-[560px] flex-col gap-3 sm:top-6">
      {toasts.map((toast) => {
        const iconName =
          toast.variant === "success"
            ? "check"
            : toast.variant === "error"
              ? "close"
              : "info";

        const colorClass =
          toast.variant === "success"
            ? "border-green-400 bg-green-50 text-green-600"
            : toast.variant === "error"
              ? "border-red-400 bg-red-50 text-red-600"
              : "border-primary/40 bg-white text-primary";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] ${colorClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white">
                <span className="material-symbols-outlined text-xl">
                  {iconName}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-bold">{toast.title}</p>

                {toast.description ? (
                  <p className="mt-1 break-words text-sm leading-5 text-on-surface">
                    {toast.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface transition hover:bg-white hover:text-primary"
                aria-label="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-xl">
                  close
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminProductImageManager({
  productId,
  variants,
  onImagesChanged,
  onImageCountChange,
}: AdminProductImageManagerProps) {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [images, setImages] = useState<AdminProductImage[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("all");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [uploadVariantId, setUploadVariantId] = useState("");
  const [uploadColor, setUploadColor] = useState("");
  const [altText, setAltText] = useState("");
  const [thumbnailIndex, setThumbnailIndex] = useState("0");
  const [sortOrderStart, setSortOrderStart] = useState("1");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [actionImageId, setActionImageId] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ImageToast[]>([]);

  const imagePreviewItems = useMemo(() => {
    return selectedFiles.map((file, index) => ({
      file,
      index,
      previewUrl: URL.createObjectURL(file),
    }));
  }, [selectedFiles]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: ImageToastVariant,
    title: string,
    description?: string
  ) {
    const id = Date.now() + Math.random();

    setToasts((current) => [
      {
        id,
        variant,
        title,
        description,
      },
      ...current.slice(0, 2),
    ]);

    window.setTimeout(() => {
      closeToast(id);
    }, 3500);
  }

  const fetchImages = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminProductImages(adminAccessToken, productId, {
        includeInactive,
        variantId:
          selectedVariantId === "all" ? undefined : Number(selectedVariantId),
      });

      setImages(data);
      // Đếm ảnh active để đồng bộ số liệu ở card Tổng ảnh sản phẩm
      const activeImageCount = data.filter((image) => image.isActive).length;
      onImageCountChange?.(activeImageCount);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách ảnh sản phẩm.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [adminAccessToken, productId, includeInactive, selectedVariantId,onImageCountChange]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    return () => {
      imagePreviewItems.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [imagePreviewItems]);

  function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
  const newFiles = Array.from(event.target.files || []);

  if (newFiles.length === 0) {
    return;
  }

  const currentFileKeys = new Set(selectedFiles.map(getFileKey));

  /**
   * Chỉ thêm file mới, tránh trùng file nếu admin chọn lại cùng ảnh.
   */
  const uniqueNewFiles = newFiles.filter((file) => {
    return !currentFileKeys.has(getFileKey(file));
  });

  if (uniqueNewFiles.length === 0) {
    showToast(
      "info",
      "Ảnh đã được chọn",
      "Các ảnh bạn vừa chọn đã có trong danh sách chờ upload."
    );

    event.target.value = "";
    return;
  }

  const mergedFiles = [...selectedFiles, ...uniqueNewFiles];

  if (mergedFiles.length > MAX_UPLOAD_FILES) {
    showToast(
      "error",
      "Vượt quá số lượng ảnh",
      `Bạn chỉ nên upload tối đa ${MAX_UPLOAD_FILES} ảnh mỗi lần.`
    );

    setSelectedFiles(mergedFiles.slice(0, MAX_UPLOAD_FILES));
  } else {
    setSelectedFiles(mergedFiles);
  }

  if (!altText) {
    setAltText(`Ảnh sản phẩm ${productId}`);
  }

  /**
   * Reset value để lần sau admin có thể chọn tiếp file khác
   * hoặc chọn lại cùng file nếu cần.
   */
  event.target.value = "";
}

  function handleUploadVariantChange(nextVariantId: string) {
    setUploadVariantId(nextVariantId);

    if (!nextVariantId) {
      setUploadColor("");
      return;
    }

    const variantColor = getVariantColor(variants, nextVariantId);

    if (variantColor) {
      setUploadColor(variantColor);
    }
  }

  async function handleBulkUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminAccessToken) {
      showToast("error", "Chưa có token Admin", "Vui lòng đăng nhập lại.");
      return;
    }

    if (selectedFiles.length === 0) {
      showToast("error", "Chưa chọn ảnh", "Vui lòng chọn ít nhất một ảnh.");
      return;
    }

    const numericThumbnailIndex = Number(thumbnailIndex);
    const numericSortOrderStart = Number(sortOrderStart);

    if (
      Number.isNaN(numericThumbnailIndex) ||
      numericThumbnailIndex < 0 ||
      numericThumbnailIndex >= selectedFiles.length
    ) {
      showToast(
        "error",
        "Thumbnail index không hợp lệ",
        "Vị trí thumbnail phải nằm trong danh sách ảnh đã chọn."
      );
      return;
    }

    if (Number.isNaN(numericSortOrderStart) || numericSortOrderStart < 0) {
      showToast(
        "error",
        "Sort order không hợp lệ",
        "Thứ tự bắt đầu phải là số không âm."
      );
      return;
    }

    try {
      setIsUploading(true);

      await bulkUploadAdminProductImages(adminAccessToken, productId, {
        files: selectedFiles,
        variantId: uploadVariantId ? Number(uploadVariantId) : undefined,
        color: uploadColor.trim() || undefined,
        altText: altText.trim() || undefined,
        thumbnailIndex: numericThumbnailIndex,
        sortOrderStart: numericSortOrderStart,
        isActive: true,
      });

      showToast(
        "success",
        "Upload ảnh thành công",
        "Ảnh sản phẩm đã được lưu lên Cloudinary và database."
      );

      setSelectedFiles([]);
      setAltText("");
      setThumbnailIndex("0");
      setSortOrderStart("1");

if (fileInputRef.current) {
  fileInputRef.current.value = "";
}

      await fetchImages();
      onImagesChanged?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể upload ảnh.";

      showToast("error", "Upload ảnh thất bại", message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSetThumbnail(image: AdminProductImage) {
    if (!adminAccessToken) {
      return;
    }

    try {
      setActionImageId(image.imageId);

      await setAdminProductImageThumbnail(adminAccessToken, image.imageId);

      showToast(
        "success",
        "Đặt thumbnail thành công",
        "Ảnh đã được đặt làm ảnh đại diện cho màu/variant tương ứng."
      );

      await fetchImages();
      onImagesChanged?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể đặt thumbnail.";

      showToast("error", "Đặt thumbnail thất bại", message);
    } finally {
      setActionImageId(null);
    }
  }

  async function handleDeleteImage(image: AdminProductImage) {
    if (!adminAccessToken) {
      return;
    }

    const shouldDelete = window.confirm(
      `Bạn có chắc muốn xóa mềm ảnh #${image.imageId}?`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setActionImageId(image.imageId);

      await deleteAdminProductImage(adminAccessToken, image.imageId, false);

      showToast(
        "success",
        "Xóa mềm ảnh thành công",
        "Ảnh đã được chuyển sang trạng thái không hoạt động."
      );

      await fetchImages();
      onImagesChanged?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa ảnh.";

      showToast("error", "Xóa ảnh thất bại", message);
    } finally {
      setActionImageId(null);
    }
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-surface-container-high bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
      <ImageToastStack toasts={toasts} onClose={closeToast} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Product Images
          </p>

          <h3 className="mt-2 text-xl font-bold text-on-surface">
            Quản lý ảnh sản phẩm
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
            Upload ảnh theo variant/màu. API bulk dùng field{" "}
            <span className="font-semibold text-on-surface">files</span>, còn
            upload một ảnh dùng field{" "}
            <span className="font-semibold text-on-surface">file</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchImages}
          disabled={isFetching}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-xl ${
              isFetching ? "animate-spin" : ""
            }`}
          >
            {isFetching ? "progress_activity" : "refresh"}
          </span>
          Làm mới ảnh
        </button>
      </div>

      <form
        onSubmit={handleBulkUpload}
        className="rounded-[24px] border border-dashed border-primary/30 bg-primary/5 p-4"
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <div>
            <label
              htmlFor="uploadVariantId"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Gắn với variant
            </label>

            <select
              id="uploadVariantId"
              value={uploadVariantId}
              onChange={(event) => handleUploadVariantChange(event.target.value)}
              disabled={isUploading}
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">Không chọn variant</option>

              {variants.map((variant) => (
                <option key={variant.variantId} value={variant.variantId}>
                  {getVariantLabel(variant)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="uploadColor"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Màu
            </label>

            <input
              id="uploadColor"
              type="text"
              value={uploadColor}
              onChange={(event) => setUploadColor(event.target.value)}
              disabled={isUploading}
              placeholder="Ví dụ: Đen"
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label
              htmlFor="thumbnailIndex"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Thumbnail index
            </label>

            <input
              id="thumbnailIndex"
              type="number"
              min={0}
              value={thumbnailIndex}
              onChange={(event) => setThumbnailIndex(event.target.value)}
              disabled={isUploading}
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />

            <p className="mt-1 text-xs text-secondary">
              0 nghĩa là ảnh đầu tiên.
            </p>
          </div>

          <div>
            <label
              htmlFor="sortOrderStart"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Sort order start
            </label>

            <input
              id="sortOrderStart"
              type="number"
              min={0}
              value={sortOrderStart}
              onChange={(event) => setSortOrderStart(event.target.value)}
              disabled={isUploading}
              className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="altText"
            className="mb-1.5 block text-sm font-semibold text-on-surface"
          >
            Alt text
          </label>

          <input
            id="altText"
            type="text"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            disabled={isUploading}
            placeholder="Ví dụ: iPhone 16 Pro Max màu Đen"
            className="h-12 w-full rounded-2xl border border-surface-container-high bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="productImages"
            className="mb-1.5 block text-sm font-semibold text-on-surface"
          >
            Chọn ảnh
          </label>

          <input
            ref={fileInputRef}
            id="productImages"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full cursor-pointer rounded-2xl border border-surface-container-high bg-white px-4 py-3 text-sm text-secondary file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
          />

          <p className="mt-1 text-xs text-secondary">
            Đã chọn {selectedFiles.length}/{MAX_UPLOAD_FILES} ảnh. Có thể chọn nhiều ảnh
            một lần hoặc bấm chọn tiếp để thêm ảnh mới. Chỉ nên upload JPEG, PNG, WEBP,
            khoảng 5MB/file.
          </p>
        </div>

        {imagePreviewItems.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {imagePreviewItems.map((item) => (
              <div
                key={`${item.file.name}-${item.index}`}
                className={`overflow-hidden rounded-2xl border bg-white ${
                  Number(thumbnailIndex) === item.index
                    ? "border-primary"
                    : "border-surface-container-high"
                }`}
              >
                <div className="aspect-square bg-surface-container-lowest">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="p-3">
                  <p className="truncate text-xs font-semibold text-on-surface">
                    #{item.index} · {item.file.name}
                  </p>

                  <button
                    type="button"
                    onClick={() => setThumbnailIndex(String(item.index))}
                    className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                  >
                    Chọn thumbnail
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => {
            setSelectedFiles([]);

            if (fileInputRef.current) {
            fileInputRef.current.value = "";
            }
            }}
            disabled={isUploading || selectedFiles.length === 0}
            className="h-11 rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50">
            Xóa file đã chọn
          </button>

          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                Đang upload...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  cloud_upload
                </span>
                Upload ảnh
              </>
            )}
          </button>
        </div>
      </form>

      <div className="rounded-[24px] border border-surface-container-high bg-white">
        <div className="flex flex-col gap-3 border-b border-surface-container-high p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="font-bold text-on-surface">Danh sách ảnh</h4>
            <p className="mt-1 text-sm text-secondary">
              Tổng {images.length} ảnh đang được hiển thị theo bộ lọc.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedVariantId}
              onChange={(event) => setSelectedVariantId(event.target.value)}
              className="h-10 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="all">Tất cả variant</option>

              {variants.map((variant) => (
                <option key={variant.variantId} value={variant.variantId}>
                  {getVariantLabel(variant)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIncludeInactive((current) => !current)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                includeInactive
                  ? "border-primary bg-primary text-on-primary"
                  : "border-surface-container-high bg-white text-on-surface hover:border-primary hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                visibility
              </span>
              {includeInactive ? "Gồm ảnh đã ẩn" : "Chỉ ảnh active"}
            </button>
          </div>
        </div>

        {fetchError ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {fetchError}
          </div>
        ) : null}

        {isFetching ? (
          <div className="flex items-center justify-center p-10">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined animate-spin text-xl text-primary">
                progress_activity
              </span>
              Đang tải ảnh sản phẩm...
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
              <span className="material-symbols-outlined text-2xl">
                image
              </span>
            </div>

            <p className="mt-3 font-bold text-on-surface">
              Chưa có ảnh phù hợp
            </p>

            <p className="mt-1 text-sm text-secondary">
              Hãy upload ảnh theo variant/màu để sản phẩm hiển thị đẹp hơn.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {images.map((image) => (
              <article
                key={image.imageId}
                className={`overflow-hidden rounded-[22px] border bg-white ${
                  image.isThumbnail
                    ? "border-primary shadow-[0_16px_45px_rgba(15,23,42,0.12)]"
                    : "border-surface-container-high shadow-sm"
                }`}
              >
                <div className="relative aspect-square bg-surface-container-lowest">
                  <img
                    src={image.imageUrl}
                    alt={image.altText || `Ảnh sản phẩm #${image.imageId}`}
                    className="h-full w-full object-contain"
                  />

                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {image.isThumbnail ? (
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">
                        Thumbnail
                      </span>
                    ) : null}

                    {!image.isActive ? (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      Image #{image.imageId}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-secondary">
                      Variant: {image.variantId || "Không gắn variant"} · Màu:{" "}
                      {image.color || "—"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-secondary">
                      Sort: {image.sortOrder} · Active:{" "}
                      {image.isActive ? "true" : "false"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-container-lowest p-3">
                    <p className="line-clamp-2 text-xs leading-5 text-secondary">
                      {image.altText || "Chưa có alt text"}
                    </p>

                    {image.cloudinaryPublicId ? (
                      <p className="mt-2 line-clamp-2 break-all text-[11px] leading-4 text-secondary">
                        Public ID: {image.cloudinaryPublicId}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetThumbnail(image)}
                      disabled={
                        actionImageId === image.imageId ||
                        image.isThumbnail ||
                        !image.isActive
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">
                        star
                      </span>
                      Đặt thumbnail
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image)}
                      disabled={actionImageId === image.imageId || !image.isActive}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                      Xóa mềm
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}