"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteAdminReview,
  getAdminReviewById,
  getAdminReviews,
  updateAdminReviewVisibility,
} from "@/services/admin-review.service";
import { useAdminAuthStore } from "@/store/admin-auth.store";
import type {
  AdminReview,
  AdminReviewRatingFilter,
  AdminReviewSort,
  AdminReviewStatusFilter,
} from "@/types/admin-review.type";

const DEFAULT_LIMIT = 10;

const REVIEW_RATING_OPTIONS: {
  label: string;
  value: AdminReviewRatingFilter;
}[] = [
  { label: "Tất cả sao", value: "all" },
  { label: "5 sao", value: "5" },
  { label: "4 sao", value: "4" },
  { label: "3 sao", value: "3" },
  { label: "2 sao", value: "2" },
  { label: "1 sao", value: "1" },
];

const REVIEW_SORT_OPTIONS: {
  label: string;
  value: AdminReviewSort;
}[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Sao tăng dần", value: "rating_asc" },
  { label: "Sao giảm dần", value: "rating_desc" },
];

type ReviewToastVariant = "success" | "error" | "info";

type ReviewToast = {
  id: number;
  variant: ReviewToastVariant;
  title: string;
  description?: string;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCustomerName(review: AdminReview) {
  return (
    review.customerName ||
    review.fullName ||
    review.userName ||
    `User #${review.userId}`
  );
}

function getReviewStatusLabel(review: AdminReview) {
  return review.isActive ? "Đang hiển thị" : "Đã ẩn";
}

function getReviewStatusClass(review: AdminReview) {
  return review.isActive
    ? "bg-green-50 text-green-700"
    : "bg-red-50 text-red-700";
}

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating || 0)));

  return Array.from({ length: 5 }, (_, index) => (
    <span
      key={index}
      className={`material-symbols-outlined text-lg ${
        index < safeRating ? "text-yellow-500" : "text-surface-container-high"
      }`}
    >
      star
    </span>
  ));
}

function getShortComment(comment: string | null | undefined) {
  if (!comment) {
    return "Không có nội dung đánh giá.";
  }

  if (comment.length <= 120) {
    return comment;
  }

  return `${comment.slice(0, 120)}...`;
}

type ReviewToastStackProps = {
  toasts: ReviewToast[];
  onClose: (id: number) => void;
};

function ReviewToastStack({ toasts, onClose }: ReviewToastStackProps) {
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
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ReviewDetailModalProps = {
  review: AdminReview | null;
  isLoading: boolean;
  onClose: () => void;
  onToggleVisibility: (review: AdminReview) => void;
};

function ReviewDetailModal({
  review,
  isLoading,
  onClose,
  onToggleVisibility,
}: ReviewDetailModalProps) {
  if (!review && !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[92vh] w-[min(96vw,820px)] overflow-y-auto rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-container-high bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Review Detail
            </p>

            <h3 className="mt-1 text-xl font-bold text-on-surface">
              {review ? `Review #${review.reviewId}` : "Đang tải review..."}
            </h3>

            {review ? (
              <p className="mt-1 text-sm text-secondary">
                Tạo lúc {formatDateTime(review.createdAt)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-secondary transition hover:bg-surface-container-lowest hover:text-primary"
            aria-label="Đóng chi tiết"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined animate-spin text-xl text-primary">
                progress_activity
              </span>
              Đang tải chi tiết review...
            </div>
          </div>
        ) : review ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Khách hàng
                </p>

                <p className="mt-2 font-bold text-on-surface">
                  {getCustomerName(review)}
                </p>

                <p className="mt-1 text-sm text-secondary">
                  User ID #{review.userId}
                </p>

                {review.email ? (
                  <p className="mt-1 text-sm text-secondary">{review.email}</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Sản phẩm
                </p>

                <p className="mt-2 font-bold text-on-surface">
                  {review.productName || `Product #${review.productId}`}
                </p>

                <p className="mt-1 text-sm text-secondary">
                  Product ID #{review.productId}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Trạng thái
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getReviewStatusClass(
                      review
                    )}`}
                  >
                    {getReviewStatusLabel(review)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleVisibility(review)}
                  className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-surface-container-high bg-white px-3 text-xs font-bold text-on-surface transition hover:border-primary hover:text-primary"
                >
                  <span className="material-symbols-outlined text-lg">
                    {review.isActive ? "visibility_off" : "visibility"}
                  </span>
                  {review.isActive ? "Ẩn review" : "Hiện review"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container-high p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                Số sao
              </p>

              <div className="mt-2 flex items-center gap-1">
                {renderStars(review.rating)}
                <span className="ml-2 text-sm font-bold text-on-surface">
                  {review.rating}/5
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-container-high p-4">
              <h4 className="font-bold text-on-surface">Nội dung đánh giá</h4>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-secondary">
                {review.comment || "Không có nội dung đánh giá."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-surface-container-high p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Created At
                </p>
                <p className="mt-2 text-sm font-semibold text-on-surface">
                  {formatDateTime(review.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl border border-surface-container-high p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Updated At
                </p>
                <p className="mt-2 text-sm font-semibold text-on-surface">
                  {formatDateTime(review.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type VisibilityConfirmModalProps = {
  review: AdminReview | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function VisibilityConfirmModal({
  review,
  isSubmitting,
  onClose,
  onConfirm,
}: VisibilityConfirmModalProps) {
  if (!review) {
    return null;
  }

  const nextVisible = !review.isActive;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(92vw,540px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                nextVisible
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {nextVisible ? "visibility" : "visibility_off"}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold leading-7 text-on-surface">
                {nextVisible ? "Hiện review?" : "Ẩn review?"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Review của{" "}
                <span className="font-semibold text-on-surface">
                  {getCustomerName(review)}
                </span>{" "}
                cho sản phẩm{" "}
                <span className="font-semibold text-on-surface">
                  {review.productName || `#${review.productId}`}
                </span>{" "}
                sẽ được chuyển sang trạng thái{" "}
                <span className="font-semibold text-on-surface">
                  {nextVisible ? "hiển thị" : "ẩn"}
                </span>
                .
              </p>

              {!nextVisible ? (
                <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                  <p className="text-sm leading-6 text-yellow-800">
                    Review bị ẩn sẽ không còn hiển thị ở Product Detail phía
                    khách hàng, nhưng Admin vẫn xem được.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high bg-surface-container-lowest p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                Đang xử lý...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  {nextVisible ? "visibility" : "visibility_off"}
                </span>
                Xác nhận
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

type DeleteReviewModalProps = {
  review: AdminReview | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteReviewModal({
  review,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteReviewModalProps) {
  if (!review) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-[min(92vw,540px)] overflow-hidden rounded-[28px] border border-surface-container-high bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <span className="material-symbols-outlined text-2xl">
                delete
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold leading-7 text-on-surface">
                Xóa mềm review?
              </h3>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Review #{review.reviewId} sẽ được chuyển sang trạng thái ẩn.
              </p>

              <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                <p className="text-sm leading-6 text-yellow-800">
                  DELETE không xóa cứng, chỉ cập nhật `is_active = false` để
                  giữ lịch sử đánh giá.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high bg-surface-container-lowest p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                Đang xóa...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  delete
                </span>
                Xác nhận xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewPageClient() {
  const adminAccessToken = useAdminAuthStore(
    (state) => state.adminAccessToken
  );

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] =
    useState<AdminReviewRatingFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<AdminReviewStatusFilter>("all");
  const [sort, setSort] = useState<AdminReviewSort>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [visibilityReview, setVisibilityReview] =
    useState<AdminReview | null>(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const [deletingReview, setDeletingReview] = useState<AdminReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toasts, setToasts] = useState<ReviewToast[]>([]);

  const summary = useMemo(() => {
    const totalRating = reviews.reduce(
      (total, review) => total + Number(review.rating || 0),
      0
    );

    return {
      visible: reviews.filter((review) => review.isActive).length,
      hidden: reviews.filter((review) => !review.isActive).length,
      averageRating:
        reviews.length > 0 ? Number((totalRating / reviews.length).toFixed(1)) : 0,
      fiveStars: reviews.filter((review) => review.rating === 5).length,
    };
  }, [reviews]);

  function closeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(
    variant: ReviewToastVariant,
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

  const fetchReviews = useCallback(async () => {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const data = await getAdminReviews(adminAccessToken, {
        search,
        page,
        limit,
        sort,
        rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "true",
      });

      setReviews(data.items);
      setPagination(data.pagination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách review.";

      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }, [
    adminAccessToken,
    search,
    page,
    limit,
    sort,
    ratingFilter,
    statusFilter,
  ]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function handleResetFilter() {
    setSearchDraft("");
    setSearch("");
    setRatingFilter("all");
    setStatusFilter("all");
    setSort("newest");
    setPage(1);
    setLimit(DEFAULT_LIMIT);
  }

  async function openReviewDetail(reviewId: number) {
    if (!adminAccessToken) {
      return;
    }

    try {
      setIsDetailLoading(true);
      setSelectedReview(null);

      const data = await getAdminReviewById(adminAccessToken, reviewId);

      setSelectedReview(data.review);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải chi tiết review.";

      showToast("error", "Tải chi tiết thất bại", message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleConfirmVisibility() {
    if (!adminAccessToken || !visibilityReview) {
      return;
    }

    try {
      setIsUpdatingVisibility(true);

      const nextActive = !visibilityReview.isActive;

      await updateAdminReviewVisibility(
        adminAccessToken,
        visibilityReview.reviewId,
        {
          isActive: nextActive,
        }
      );

      showToast(
        "success",
        nextActive ? "Đã hiện review" : "Đã ẩn review",
        nextActive
          ? "Review đã được hiển thị lại ở phía khách hàng."
          : "Review đã được ẩn khỏi phía khách hàng."
      );

      const changedReviewId = visibilityReview.reviewId;
      setVisibilityReview(null);

      await fetchReviews();

      if (selectedReview?.reviewId === changedReviewId) {
        const detail = await getAdminReviewById(adminAccessToken, changedReviewId);
        setSelectedReview(detail.review);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể đổi trạng thái review.";

      showToast("error", "Cập nhật hiển thị thất bại", message);
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  async function handleConfirmDelete() {
    if (!adminAccessToken || !deletingReview) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteAdminReview(adminAccessToken, deletingReview.reviewId);

      showToast(
        "success",
        "Xóa mềm review thành công",
        "Review đã được chuyển sang trạng thái ẩn."
      );

      const deletedReviewId = deletingReview.reviewId;
      setDeletingReview(null);

      if (selectedReview?.reviewId === deletedReviewId) {
        setSelectedReview(null);
      }

      await fetchReviews();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa review.";

      showToast("error", "Xóa review thất bại", message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ReviewToastStack toasts={toasts} onClose={closeToast} />

      <section className="rounded-[28px] border border-surface-container-high bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Admin Review
            </p>

            <h2 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
              Quản lý đánh giá sản phẩm
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
              Theo dõi đánh giá của khách hàng, lọc theo số sao và ẩn/hiện
              review không phù hợp. Review bị ẩn sẽ không hiển thị ở trang sản
              phẩm phía khách hàng.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReviews}
            disabled={isFetching}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-surface-container-high bg-white px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-xl ${
                isFetching ? "animate-spin" : ""
              }`}
            >
              {isFetching ? "progress_activity" : "refresh"}
            </span>
            Làm mới
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Đang hiển thị
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {summary.visible}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
              Đã ẩn
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {summary.hidden}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
              Điểm TB theo trang
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {summary.averageRating}/5
            </p>
          </div>

          <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              Review 5 sao
            </p>
            <p className="mt-2 text-2xl font-bold text-on-surface">
              {summary.fiveStars}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-surface-container-high bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[1fr_160px_180px_190px_130px_auto]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-lowest px-4 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
            <span className="material-symbols-outlined text-xl text-secondary">
              search
            </span>

            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm sản phẩm, khách hàng, nội dung review..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-secondary"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(event) => {
              setRatingFilter(event.target.value as AdminReviewRatingFilter);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {REVIEW_RATING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AdminReviewStatusFilter);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang hiển thị</option>
            <option value="false">Đã ẩn</option>
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as AdminReviewSort);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {REVIEW_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-surface-container-high bg-white px-4 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value={5}>5/trang</option>
            <option value={10}>10/trang</option>
            <option value={20}>20/trang</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              <span className="material-symbols-outlined text-xl">search</span>
              Tìm
            </button>

            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
              aria-label="Reset bộ lọc"
            >
              <span className="material-symbols-outlined text-xl">
                restart_alt
              </span>
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-surface-container-high bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Danh sách review
            </h3>

            <p className="mt-1 text-sm text-secondary">
              Tổng {pagination.totalItems} review · Trang {pagination.page}/
              {pagination.totalPages || 1}
            </p>
          </div>
        </div>

        {fetchError ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {fetchError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-surface-container-lowest">
              <tr className="border-b border-surface-container-high text-xs uppercase tracking-wide text-secondary">
                <th className="px-4 py-3 font-bold">Review</th>
                <th className="px-4 py-3 font-bold">Sản phẩm</th>
                <th className="px-4 py-3 font-bold">Khách hàng</th>
                <th className="px-4 py-3 font-bold">Số sao</th>
                <th className="px-4 py-3 font-bold">Nội dung</th>
                <th className="px-4 py-3 font-bold">Ngày tạo</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined animate-spin text-xl text-primary">
                        progress_activity
                      </span>
                      Đang tải review...
                    </div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          rate_review
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-on-surface">
                        Chưa có review phù hợp
                      </p>

                      <p className="mt-1 text-sm text-secondary">
                        Hãy thử đổi bộ lọc hoặc kiểm tra dữ liệu đánh giá.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr
                    key={review.reviewId}
                    className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-lowest/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-on-surface">
                        #{review.reviewId}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        User #{review.userId} · Product #{review.productId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-[220px] truncate font-semibold text-on-surface">
                        {review.productName || `Product #${review.productId}`}
                      </p>
                      <p className="mt-1 max-w-[220px] truncate text-sm text-secondary">
                        {review.productSlug || "Chưa có slug"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-[180px] truncate font-semibold text-on-surface">
                        {getCustomerName(review)}
                      </p>
                      <p className="mt-1 max-w-[180px] truncate text-sm text-secondary">
                        {review.email || review.phone || "Chưa có liên hệ"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="line-clamp-2 max-w-[300px] text-sm leading-6 text-secondary">
                        {getShortComment(review.comment)}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-secondary">
                      {formatDateTime(review.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getReviewStatusClass(
                          review
                        )}`}
                      >
                        {getReviewStatusLabel(review)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openReviewDetail(review.reviewId)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          onClick={() => setVisibilityReview(review)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-primary/30 px-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-on-primary"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {review.isActive ? "visibility_off" : "visibility"}
                          </span>
                          {review.isActive ? "Ẩn" : "Hiện"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingReview(review)}
                          disabled={!review.isActive}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                          Xóa mềm
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-surface-container-high p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">
            Hiển thị {reviews.length} / {pagination.totalItems} review
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
              Trước
            </button>

            <span className="rounded-2xl bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface">
              {pagination.page || page}/{pagination.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages || 1, current + 1)
                )
              }
              disabled={
                page >= pagination.totalPages ||
                isFetching ||
                pagination.totalPages === 0
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
              <span className="material-symbols-outlined text-lg">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </section>

      <ReviewDetailModal
        review={selectedReview}
        isLoading={isDetailLoading}
        onClose={() => setSelectedReview(null)}
        onToggleVisibility={setVisibilityReview}
      />

      <VisibilityConfirmModal
        review={visibilityReview}
        isSubmitting={isUpdatingVisibility}
        onClose={() => {
          if (!isUpdatingVisibility) {
            setVisibilityReview(null);
          }
        }}
        onConfirm={handleConfirmVisibility}
      />

      <DeleteReviewModal
        review={deletingReview}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingReview(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}