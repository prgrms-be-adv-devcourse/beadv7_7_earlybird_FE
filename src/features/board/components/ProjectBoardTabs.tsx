import { useState } from "react";
import { Star, MessageSquarePlus, MessageCircle, Trash2, Pencil, Megaphone, User, CornerDownRight, ImageIcon } from "lucide-react";
import {
  Card,
  Button,
  EmptyState,
  Badge,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../../shared/ui";
import {
  useNotices,
  useCreateNotice,
  useUpdateNotice,
  useDeleteNotice,
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useComments,
  useCreateComment,
  useReplyToComment,
  useDeleteComment,
} from "../hooks";
import type { ProjectComment } from "../types";
import { useRewards } from "../../projects/hooks";
import { useUploadFile, useFilesByOwner } from "../../files/hooks";
import { useAuthStore } from "../../../shared/auth/authStore";

function ReviewPhotos({ reviewId }: { reviewId: number }) {
  const [expanded, setExpanded] = useState(false);
  const { data: files, isPending } = useFilesByOwner("REVIEW", reviewId, expanded);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 self-start text-xs font-semibold text-brand hover:underline"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        {expanded ? "사진 접기" : "사진 보기"}
      </button>
      {expanded && (
        isPending ? (
          <p className="text-xs text-mist">불러오는 중...</p>
        ) : !files || files.length === 0 ? (
          <p className="text-xs text-mist">등록된 사진이 없어요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <img
                key={f.id}
                src={f.storedUrl}
                alt={f.originalName}
                className="h-24 w-24 rounded-sm border border-ink/20 object-cover"
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function CommentThread({
  comment,
  canReply,
  canDelete,
  onDelete,
  onReply,
  isReplying,
}: {
  comment: ProjectComment;
  canReply: boolean;
  canDelete: boolean;
  onDelete: (commentId: number) => void;
  onReply: (commentId: number, content: string) => void;
  isReplying: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  return (
    <li className="rounded-lg border border-ink/10 bg-surface p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs font-bold text-ink">
          <User className="h-3.5 w-3.5" />
          {comment.authorName || "사용자"}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {comment.createdAt && (
            <span className="text-[11px] text-mist font-mono">{comment.createdAt.split("T")[0]}</span>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="text-mist hover:text-red-500 p-1 transition-colors"
              title="댓글 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-ink/80 whitespace-pre-line leading-relaxed">{comment.content}</p>

      {canReply && (
        <button
          type="button"
          onClick={() => setReplyOpen((v) => !v)}
          className="flex items-center gap-1 self-start text-xs font-semibold text-brand hover:underline"
        >
          <CornerDownRight className="h-3.5 w-3.5" />
          답글
        </button>
      )}

      {replyOpen && (
        <div className="flex flex-col gap-2 pl-4 border-l-2 border-ink/10">
          <textarea
            rows={2}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="답글을 입력하세요."
            className="w-full rounded-md border border-ink/20 p-2 text-xs text-ink outline-none focus:border-brand resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="py-1 px-2 text-xs"
              onClick={() => {
                setReplyOpen(false);
                setReplyContent("");
              }}
            >
              취소
            </Button>
            <Button
              className="py-1 px-2 text-xs"
              disabled={isReplying || !replyContent.trim()}
              onClick={() => {
                onReply(comment.id, replyContent.trim());
                setReplyOpen(false);
                setReplyContent("");
              }}
            >
              등록
            </Button>
          </div>
        </div>
      )}

      {comment.replies.length > 0 && (
        <ul className="flex flex-col gap-2 pl-4 border-l-2 border-ink/10">
          {comment.replies.map((reply) => (
            <li key={reply.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs font-bold text-ink">
                  <User className="h-3.5 w-3.5" />
                  {reply.authorName || "사용자"}
                </span>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(reply.id)}
                    className="text-mist hover:text-red-500 p-1 transition-colors"
                    title="답글 삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-ink/80 whitespace-pre-line leading-relaxed">{reply.content}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function ProjectBoardTabs({ projectId }: { projectId: number }) {
  const [tab, setTab] = useState<"notices" | "reviews" | "comments">("notices");

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.role === "CREATOR";
  const isLoggedIn = !!user;

  const { data: notices, isPending: noticesPending } = useNotices(projectId);
  const { data: reviews, isPending: reviewsPending } = useReviews(projectId);
  const { data: rewards } = useRewards(projectId);
  const { data: comments, isPending: commentsPending } = useComments("PROJECT", projectId);

  const createNoticeMutation = useCreateNotice(projectId);
  const updateNoticeMutation = useUpdateNotice(projectId);
  const deleteNoticeMutation = useDeleteNotice(projectId);

  const createReviewMutation = useCreateReview(projectId);
  const updateReviewMutation = useUpdateReview(projectId);
  const deleteReviewMutation = useDeleteReview(projectId);

  const createCommentMutation = useCreateComment("PROJECT", projectId);
  const replyToCommentMutation = useReplyToComment("PROJECT", projectId);
  const deleteCommentMutation = useDeleteComment("PROJECT", projectId);

  // Notice Modal State (also used for editing — editingNoticeId set => edit mode)
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeError, setNoticeError] = useState<string | null>(null);

  // Review Modal State (also used for editing — editingReviewId set => edit mode)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<number | undefined>(undefined);
  const [rating, setRating] = useState<number>(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewPhotoFile, setReviewPhotoFile] = useState<File | null>(null);
  const uploadReviewPhotoMutation = useUploadFile();

  // Comment Compose State
  const [newCommentContent, setNewCommentContent] = useState("");

  const openCreateNotice = () => {
    setEditingNoticeId(null);
    setNoticeTitle("");
    setNoticeContent("");
    setNoticeError(null);
    setNoticeModalOpen(true);
  };

  const openEditNotice = (notice: { id: number; title: string; content: string }) => {
    setEditingNoticeId(notice.id);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeError(null);
    setNoticeModalOpen(true);
  };

  const handleSubmitNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      setNoticeError("제목과 내용을 입력해주세요.");
      return;
    }
    setNoticeError(null);
    const payload = { title: noticeTitle.trim(), content: noticeContent.trim() };
    const onSuccess = () => {
      setNoticeTitle("");
      setNoticeContent("");
      setNoticeModalOpen(false);
      setEditingNoticeId(null);
    };
    const onError = (err: any) => {
      setNoticeError(err.response?.data?.error?.message || "공지사항 저장에 실패했습니다.");
    };

    if (editingNoticeId) {
      updateNoticeMutation.mutate({ noticeId: editingNoticeId, payload }, { onSuccess, onError });
    } else {
      createNoticeMutation.mutate(payload, { onSuccess, onError });
    }
  };

  const openCreateReview = () => {
    setEditingReviewId(null);
    setSelectedRewardId(undefined);
    setRating(5);
    setReviewContent("");
    setReviewError(null);
    setReviewPhotoFile(null);
    setReviewModalOpen(true);
  };

  const openEditReview = (review: { id: number; rating: number; content: string }) => {
    setEditingReviewId(review.id);
    setRating(review.rating || 5);
    setReviewContent(review.content);
    setReviewError(null);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim()) {
      setReviewError("후기 내용을 입력해주세요.");
      return;
    }
    setReviewError(null);

    try {
      if (editingReviewId) {
        await updateReviewMutation.mutateAsync({
          reviewId: editingReviewId,
          payload: { rating, content: reviewContent.trim() },
        });
      } else {
        const createdReview = await createReviewMutation.mutateAsync({
          rewardId: selectedRewardId,
          rating,
          content: reviewContent.trim(),
        });
        // 후기엔 project의 thumbnailId 같은 필드가 없다 — 사진은 file-service에
        // ownerType=REVIEW/ownerId=review.id로 등록만 해두고, 조회할 때 ReviewPhotos가 따로 불러온다.
        if (reviewPhotoFile) {
          await uploadReviewPhotoMutation.mutateAsync({
            file: reviewPhotoFile,
            ownerType: "REVIEW",
            ownerId: createdReview.id,
          });
        }
      }

      setReviewContent("");
      setRating(5);
      setSelectedRewardId(undefined);
      setReviewPhotoFile(null);
      setReviewModalOpen(false);
      setEditingReviewId(null);
    } catch (err: any) {
      setReviewError(err.response?.data?.error?.message || "후기 저장에 실패했습니다.");
    }
  };

  const handleCreateComment = () => {
    if (!newCommentContent.trim()) return;
    createCommentMutation.mutate(newCommentContent.trim(), {
      onSuccess: () => setNewCommentContent(""),
    });
  };

  // Average Rating calculation
  const avgRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <Card className="flex flex-col gap-4">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-ink/10 pb-3 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold transition-all ${
              tab === "notices"
                ? "bg-brand text-white shadow-stamp-sm"
                : "border border-ink/20 text-mist hover:border-brand/40 hover:text-ink"
            }`}
            onClick={() => setTab("notices")}
          >
            <Megaphone className="h-4 w-4" />
            <span>공지사항 ({notices?.length ?? 0})</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold transition-all ${
              tab === "reviews"
                ? "bg-brand text-white shadow-stamp-sm"
                : "border border-ink/20 text-mist hover:border-brand/40 hover:text-ink"
            }`}
            onClick={() => setTab("reviews")}
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>후기 ({reviews?.length ?? 0})</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold transition-all ${
              tab === "comments"
                ? "bg-brand text-white shadow-stamp-sm"
                : "border border-ink/20 text-mist hover:border-brand/40 hover:text-ink"
            }`}
            onClick={() => setTab("comments")}
          >
            <MessageCircle className="h-4 w-4" />
            <span>문의 ({comments?.length ?? 0})</span>
          </button>
        </div>

        {/* Action Button depending on active Tab */}
        {tab === "notices" && (isCreator || isAdmin) && (
          <Button
            type="button"
            onClick={openCreateNotice}
            className="py-1.5 px-3 text-xs font-bold text-white flex items-center gap-1"
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>공지사항 작성</span>
          </Button>
        )}

        {tab === "reviews" && isLoggedIn && (
          <Button
            type="button"
            onClick={openCreateReview}
            className="py-1.5 px-3 text-xs font-bold text-white flex items-center gap-1"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>후기 작성</span>
          </Button>
        )}
      </div>

      {/* NOTICES TAB CONTENT */}
      {tab === "notices" && (
        <div className="flex flex-col gap-3">
          {noticesPending ? (
            <p className="text-xs text-mist py-4 text-center">공지사항을 불러오는 중...</p>
          ) : !notices || notices.length === 0 ? (
            <EmptyState message="등록된 공지사항이 없어요." />
          ) : (
            <ul className="flex flex-col gap-3">
              {notices.map((notice) => (
                <li
                  key={notice.id}
                  className="rounded-lg border border-ink/10 bg-surface p-4 flex flex-col gap-2 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-ink text-base">{notice.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {notice.createdAt && (
                        <span className="text-[11px] text-mist font-mono">
                          {notice.createdAt.split("T")[0]}
                        </span>
                      )}
                      {(isCreator || isAdmin) && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditNotice(notice)}
                            className="text-mist hover:text-brand p-1 transition-colors"
                            title="공지 수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNoticeMutation.mutate(notice.id)}
                            disabled={deleteNoticeMutation.isPending}
                            className="text-mist hover:text-red-500 p-1 transition-colors"
                            title="공지 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-ink/80 whitespace-pre-line leading-relaxed">
                    {notice.content}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-mist border-t border-ink/5 pt-2 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {notice.authorName || "창작자"}
                    </span>
                    {notice.viewCount !== undefined && (
                      <span>조회수 {notice.viewCount}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* REVIEWS TAB CONTENT */}
      {tab === "reviews" && (
        <div className="flex flex-col gap-4">
          {/* Average Rating Summary Banner */}
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
              <div className="flex items-center gap-1.5 text-2xl font-black text-amber-600 font-display">
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                <span>{avgRating}</span>
              </div>
              <div className="text-xs text-mist">
                총 <strong className="text-ink font-bold">{reviews.length}개</strong>의 후기가 작성되었습니다.
              </div>
            </div>
          )}

          {reviewsPending ? (
            <p className="text-xs text-mist py-4 text-center">후기를 불러오는 중...</p>
          ) : !reviews || reviews.length === 0 ? (
            <EmptyState message="아직 작성된 후기가 없어요. 첫 후기를 작성해보세요!" />
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-lg border border-ink/10 bg-surface p-4 flex flex-col gap-2 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`h-4 w-4 ${
                              idx < (review.rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-ink/20"
                            }`}
                          />
                        ))}
                      </div>
                      {review.rewardName && (
                        <Badge tone="mint" className="text-[11px]">
                          {review.rewardName}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {review.createdAt && (
                        <span className="text-[11px] text-mist font-mono">
                          {review.createdAt.split("T")[0]}
                        </span>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditReview(review)}
                            className="text-mist hover:text-brand p-1 transition-colors"
                            title="후기 수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteReviewMutation.mutate(review.id)}
                            disabled={deleteReviewMutation.isPending}
                            className="text-mist hover:text-red-500 p-1 transition-colors"
                            title="후기 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-ink/80 whitespace-pre-line leading-relaxed">
                    {review.content}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-mist border-t border-ink/5 pt-2 mt-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{review.authorName || "후원자"}</span>
                  </div>

                  <ReviewPhotos reviewId={review.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* COMMENTS (문의) TAB CONTENT */}
      {tab === "comments" && (
        <div className="flex flex-col gap-4">
          {isLoggedIn && (
            <div className="flex flex-col gap-2">
              <textarea
                rows={2}
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="프로젝트에 대해 궁금한 점을 남겨보세요."
                className="w-full rounded-md border border-ink/20 p-3 text-sm text-ink outline-none focus:border-brand resize-none"
              />
              <Button
                type="button"
                className="self-end py-1.5 px-3 text-xs font-bold text-white"
                disabled={createCommentMutation.isPending || !newCommentContent.trim()}
                onClick={handleCreateComment}
              >
                {createCommentMutation.isPending ? "등록 중..." : "문의 등록"}
              </Button>
            </div>
          )}

          {commentsPending ? (
            <p className="text-xs text-mist py-4 text-center">문의를 불러오는 중...</p>
          ) : !comments || comments.length === 0 ? (
            <EmptyState message="등록된 문의가 없어요." />
          ) : (
            <ul className="flex flex-col gap-3">
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  canReply={isCreator || isAdmin}
                  canDelete={isAdmin}
                  isReplying={replyToCommentMutation.isPending}
                  onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
                  onReply={(commentId, content) => replyToCommentMutation.mutate({ commentId, content })}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* CREATE/EDIT NOTICE DIALOG */}
      <Dialog open={noticeModalOpen} onOpenChange={setNoticeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>{editingNoticeId ? "📢 공지사항 수정" : "📢 공지사항 작성"}</DialogTitle>
          <DialogDescription>
            후원자들에게 전할 소식이나 업데이트 사항을 작성하세요.
          </DialogDescription>

          <div className="my-4 flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-ink">공지 제목</label>
              <input
                type="text"
                placeholder="예: 배송 일정 안내 및 시제품 제작 현황"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="w-full rounded-md border border-ink/20 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-ink">공지 내용</label>
              <textarea
                rows={5}
                placeholder="상세 내용을 작성해주세요."
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                className="w-full rounded-md border border-ink/20 p-3 text-sm text-ink outline-none focus:border-brand resize-none"
              />
            </div>

            {noticeError && (
              <p className="text-xs font-semibold text-red-500">{noticeError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNoticeModalOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSubmitNotice}
              disabled={createNoticeMutation.isPending || updateNoticeMutation.isPending}
            >
              {createNoticeMutation.isPending || updateNoticeMutation.isPending
                ? "저장 중..."
                : editingNoticeId
                  ? "공지사항 수정"
                  : "공지사항 등록"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE/EDIT REVIEW DIALOG */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>{editingReviewId ? "✍️ 후기 수정하기" : "✍️ 후기 작성하기"}</DialogTitle>
          <DialogDescription>
            이 프로젝트 및 리워드에 대한 솔직한 후기를 남겨주세요.
          </DialogDescription>

          <div className="my-4 flex flex-col gap-4">
            {/* Star Rating Input */}
            <div>
              <label className="mb-1 block text-xs font-bold text-ink">별점 평가</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-ink/20 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-ink">{rating}점</span>
              </div>
            </div>

            {/* Reward Selector */}
            {!editingReviewId && rewards && rewards.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">후원한 리워드 선택 (선택사항)</label>
                <select
                  value={selectedRewardId ?? ""}
                  onChange={(e) =>
                    setSelectedRewardId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full rounded-md border border-ink/20 px-3 py-2 text-sm text-ink outline-none focus:border-brand bg-white"
                >
                  <option value="">-- 리워드 선택 없음 --</option>
                  {rewards.map((r) => (
                    <option key={r.rewardId} value={r.rewardId}>
                      {r.name} ({r.price.toLocaleString()}원)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Photo Input (수정 모드는 미지원 — 작성 시에만) */}
            {!editingReviewId && (
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">사진 첨부 (선택)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReviewPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-ink file:mr-3 file:rounded-sm file:border file:border-ink/30 file:bg-paper file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-ink"
                />
              </div>
            )}

            {/* Review Content Input */}
            <div>
              <label className="mb-1 block text-xs font-bold text-ink">후기 내용</label>
              <textarea
                rows={4}
                placeholder="리워드 만족도나 사용 소감을 솔직하게 작성해주세요."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="w-full rounded-md border border-ink/20 p-3 text-sm text-ink outline-none focus:border-brand resize-none"
              />
            </div>

            {reviewError && (
              <p className="text-xs font-semibold text-red-500">{reviewError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={
                createReviewMutation.isPending ||
                updateReviewMutation.isPending ||
                uploadReviewPhotoMutation.isPending
              }
            >
              {createReviewMutation.isPending || updateReviewMutation.isPending || uploadReviewPhotoMutation.isPending
                ? "저장 중..."
                : editingReviewId
                  ? "후기 수정하기"
                  : "후기 등록하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
