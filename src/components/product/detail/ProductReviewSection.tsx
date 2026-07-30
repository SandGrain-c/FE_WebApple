"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createReview,
  deleteReview,
  getProductReviews,
  updateReview,
} from "@/services/review.service";
import { useAuthStore } from "@/store/auth.store";
import type {
  CustomerReview,
  ProductReviewsResponseData,
} from "@/types/review.type";

type ProductReviewSectionProps = {
  productId: number;
  productName: string;
};

type ReviewFormState = {
  rating: number;
  comment: string;
};

function getEmptyFormState(): ReviewFormState {
  return {
    rating: 5,
    comment: "",
  };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getReviewerName(review: CustomerReview) {
  return (
    review.fullName ||
    review.customerName ||
    review.userName ||
    `Khách hàng #${review.userId}`
  );
}

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index + 1 <= rating;

        return (
          <span
            key={index}
            className={`material-symbols-outlined text-lg ${
              active ? "text-yellow-500" : "text-outline-variant"
            }`}
          >
            star
          </span>
        );
      })}
    </div>
  );
}

type StarRatingInputProps = {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

function StarRatingInput({
  value,
  disabled = false,
  onChange,
}: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const ratingValue = index + 1;
        const active = ratingValue <= value;

        return (
          <button
            key={ratingValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(ratingValue)}
            className="disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Chọn ${ratingValue} sao`}
          >
            <span
              className={`material-symbols-outlined text-3xl transition ${
                active ? "text-yellow-500" : "text-outline-variant"
              }`}
            >
              star
            </span>
          </button>
        );
      })}
    </div>
  );
}

type ReviewFormProps = {
  mode: "create" | "edit";
  formState: ReviewFormState;
  isSubmitting: boolean;
  submitText: string;
  onChange: (nextFormState: ReviewFormState) => void;
  onCancel?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ReviewForm({
  mode,
  formState,
  isSubmitting,
  submitText,
  onChange,
  onCancel,
  onSubmit,
}: ReviewFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-2xl border p-4 ${
        mode === "create"
          ? "border-surface-container-high bg-surface-container-lowest"
          : "border-primary/20 bg-primary/5"
      }`}
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-on-surface">
          Chọn số sao
        </label>

        <StarRatingInput
          value={formState.rating}
          disabled={isSubmitting}
          onChange={(rating) =>
            onChange({
              ...formState,
              rating,
            })
          }
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-on-surface">
          Nội dung đánh giá
        </label>

        <textarea
          value={formState.comment}
          onChange={(event) =>
            onChange({
              ...formState,
              comment: event.target.value,
            })
          }
          disabled={isSubmitting}
          rows={4}
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
          className="w-full resize-none rounded-2xl border border-surface-container-high bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin text-xl">
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-xl">rate_review</span>
          )}
          {submitText}
        </button>

        {onCancel ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-surface-container-high px-5 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
        ) : null}
      </div>

      {mode === "create" ? (
        <p className="mt-3 text-xs leading-5 text-secondary">
          Bạn chỉ có thể đánh giá nếu đã mua sản phẩm và đơn hàng đã hoàn thành.
        </p>
      ) : null}
    </form>
  );
}

type ReviewItemProps = {
  review: CustomerReview;
  isMine: boolean;
  editingReviewId: number | null;
  editForm: ReviewFormState;
  isSubmitting: boolean;
  onStartEdit: (review: CustomerReview) => void;
  onCancelEdit: () => void;
  onChangeEditForm: (nextFormState: ReviewFormState) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (review: CustomerReview) => void;
};

function ReviewItem({
  review,
  isMine,
  editingReviewId,
  editForm,
  isSubmitting,
  onStartEdit,
  onCancelEdit,
  onChangeEditForm,
  onSubmitEdit,
  onDelete,
}: ReviewItemProps) {
  const isEditing = editingReviewId === review.reviewId;

  return (
    <article className="rounded-2xl border border-surface-container-high bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {getReviewerName(review).charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="font-semibold text-on-surface">
                {getReviewerName(review)}
              </p>

              <p className="text-xs text-secondary">
                {formatDateTime(review.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <StarRatingDisplay rating={review.rating} />
          </div>
        </div>

        {isMine ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onStartEdit(review)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-container-high px-3 text-xs font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Sửa
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onDelete(review)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Xóa
            </button>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-4">
          <ReviewForm
            mode="edit"
            formState={editForm}
            isSubmitting={isSubmitting}
            submitText="Lưu đánh giá"
            onChange={onChangeEditForm}
            onCancel={onCancelEdit}
            onSubmit={onSubmitEdit}
          />
        </div>
      ) : review.comment ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-secondary">
          {review.comment}
        </p>
      ) : null}
    </article>
  );
}

export default function ProductReviewSection({
  productId,
  productName,
}: ProductReviewSectionProps) {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [reviewData, setReviewData] = useState<ProductReviewsResponseData>({
    items: [],
    summary: {
      totalReviews: 0,
      averageRating: 0,
      ratingCounts: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    },
  });

  const [selectedStarFilter, setSelectedStarFilter] = useState<number | "all">(
    "all"
  );
  const [createForm, setCreateForm] =
    useState<ReviewFormState>(getEmptyFormState);
  const [editForm, setEditForm] =
    useState<ReviewFormState>(getEmptyFormState);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const myReview = useMemo(() => {
    if (!user) return null;

    return (
      reviewData.items.find((review) => review.userId === user.id) || null
    );
  }, [reviewData.items, user]);

  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === "all") {
      return reviewData.items;
    }

    return reviewData.items.filter(
      (review) => review.rating === selectedStarFilter
    );
  }, [reviewData.items, selectedStarFilter]);

  async function fetchReviews() {
    try {
      setIsFetching(true);

      const data = await getProductReviews(productId);

      setReviewData(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể tải đánh giá.";

      setMessageType("error");
      setMessage(errorMessage);
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function showMessage(type: "success" | "error", content: string) {
    setMessageType(type);
    setMessage(content);
  }

  async function handleSubmitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !isAuthenticated) {
      showMessage("error", "Bạn cần đăng nhập để đánh giá sản phẩm.");
      return;
    }

    if (!createForm.comment.trim()) {
      showMessage("error", "Vui lòng nhập nội dung đánh giá.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      await createReview(
        {
          productId,
          rating: createForm.rating,
          comment: createForm.comment.trim(),
        },
        accessToken
      );

      showMessage("success", "Gửi đánh giá thành công.");
      setCreateForm(getEmptyFormState());

      await fetchReviews();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể gửi đánh giá.";

      showMessage("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStartEdit(review: CustomerReview) {
    setEditingReviewId(review.reviewId);
    setEditForm({
      rating: review.rating,
      comment: review.comment || "",
    });
    setMessage(null);
  }

  async function handleSubmitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !editingReviewId) {
      return;
    }

    if (!editForm.comment.trim()) {
      showMessage("error", "Vui lòng nhập nội dung đánh giá.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      await updateReview(
        editingReviewId,
        {
          rating: editForm.rating,
          comment: editForm.comment.trim(),
        },
        accessToken
      );

      showMessage("success", "Cập nhật đánh giá thành công.");
      setEditingReviewId(null);
      setEditForm(getEmptyFormState());

      await fetchReviews();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật đánh giá.";

      showMessage("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteReview(review: CustomerReview) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa đánh giá này?");

    if (!confirmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      await deleteReview(review.reviewId, accessToken);

      showMessage("success", "Đã xóa đánh giá.");
      setEditingReviewId(null);

      await fetchReviews();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể xóa đánh giá.";

      showMessage("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const averageRatingText =
    reviewData.summary.averageRating > 0
      ? reviewData.summary.averageRating.toFixed(1)
      : "0.0";

  return (
    <section className="mt-8 rounded-[28px] border border-surface-container-high bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Đánh giá sản phẩm
          </p>

          <h2 className="mt-1 text-xl font-bold text-on-surface sm:text-2xl">
            {productName}
          </h2>
        </div>

        <button
          type="button"
          onClick={fetchReviews}
          disabled={isFetching}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-2xl border border-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary">
              {averageRatingText}
            </p>

            <div className="mt-2 flex justify-center">
              <StarRatingDisplay
                rating={Math.round(reviewData.summary.averageRating)}
              />
            </div>

            <p className="mt-2 text-sm text-secondary">
              {reviewData.summary.totalReviews} lượt đánh giá
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                reviewData.summary.ratingCounts[
                  star as keyof typeof reviewData.summary.ratingCounts
                ] || 0;

              const percent =
                reviewData.summary.totalReviews > 0
                  ? Math.round((count / reviewData.summary.totalReviews) * 100)
                  : 0;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setSelectedStarFilter(
                      selectedStarFilter === star ? "all" : star
                    )
                  }
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition ${
                    selectedStarFilter === star
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-white"
                  }`}
                >
                  <span className="w-10 font-semibold">{star} sao</span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-yellow-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="w-8 text-right text-secondary">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4">
          {message ? (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          ) : null}

          {!isAuthenticated ? (
            <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 text-sm text-secondary">
              Bạn cần{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                đăng nhập
              </Link>{" "}
              để gửi đánh giá sản phẩm.
            </div>
          ) : myReview ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Bạn đã đánh giá sản phẩm này. Bạn có thể sửa hoặc xóa đánh giá của
              mình ở danh sách bên dưới.
            </div>
          ) : (
            <ReviewForm
              mode="create"
              formState={createForm}
              isSubmitting={isSubmitting}
              submitText="Gửi đánh giá"
              onChange={setCreateForm}
              onSubmit={handleSubmitCreate}
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStarFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                selectedStarFilter === "all"
                  ? "border-primary bg-primary text-on-primary"
                  : "border-surface-container-high text-on-surface hover:border-primary hover:text-primary"
              }`}
            >
              Tất cả
            </button>

            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStarFilter(star)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  selectedStarFilter === star
                    ? "border-primary bg-primary text-on-primary"
                    : "border-surface-container-high text-on-surface hover:border-primary hover:text-primary"
                }`}
              >
                {star} sao
              </button>
            ))}
          </div>

          {isFetching && reviewData.items.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-surface-container-lowest"
                />
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-secondary">
                <span className="material-symbols-outlined text-3xl">
                  rate_review
                </span>
              </div>

              <p className="mt-3 font-semibold text-on-surface">
                Chưa có đánh giá phù hợp
              </p>

              <p className="mt-1 text-sm text-secondary">
                Hãy là người đầu tiên chia sẻ trải nghiệm sau khi mua sản phẩm.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review) => (
                <ReviewItem
                  key={review.reviewId}
                  review={review}
                  isMine={Boolean(user && review.userId === user.id)}
                  editingReviewId={editingReviewId}
                  editForm={editForm}
                  isSubmitting={isSubmitting}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={() => {
                    setEditingReviewId(null);
                    setEditForm(getEmptyFormState());
                  }}
                  onChangeEditForm={setEditForm}
                  onSubmitEdit={handleSubmitEdit}
                  onDelete={handleDeleteReview}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}