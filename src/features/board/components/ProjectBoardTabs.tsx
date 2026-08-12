import { useState } from "react";
import { Star, MessageSquarePlus, Trash2, Megaphone, User } from "lucide-react";
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
  useDeleteNotice,
  useReviews,
  useCreateReview,
  useDeleteReview,
} from "../hooks";
import { useRewards } from "../../projects/hooks";
import { useAuthStore } from "../../../shared/auth/authStore";

export function ProjectBoardTabs({ projectId }: { projectId: number }) {
  const [tab, setTab] = useState<"notices" | "reviews">("notices");

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.role === "CREATOR";
  const isLoggedIn = !!user;

  const { data: notices, isPending: noticesPending } = useNotices(projectId);
  const { data: reviews, isPending: reviewsPending } = useReviews(projectId);
  const { data: rewards } = useRewards(projectId);

  const createNoticeMutation = useCreateNotice(projectId);
  const deleteNoticeMutation = useDeleteNotice(projectId);

  const createReviewMutation = useCreateReview(projectId);
  const deleteReviewMutation = useDeleteReview(projectId);

  // Notice Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeError, setNoticeError] = useState<string | null>(null);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<number | undefined>(undefined);
  const [rating, setRating] = useState<number>(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleCreateNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      setNoticeError("제목과 내용을 입력해주세요.");
      return;
    }
    setNoticeError(null);
    createNoticeMutation.mutate(
      { title: noticeTitle.trim(), content: noticeContent.trim() },
      {
        onSuccess: () => {
          setNoticeTitle("");
          setNoticeContent("");
          setNoticeModalOpen(false);
        },
        onError: (err: any) => {
          setNoticeError(err.response?.data?.error?.message || "공지사항 등록에 실패했습니다.");
        },
      }
    );
  };

  const handleCreateReview = () => {
    if (!reviewContent.trim()) {
      setReviewError("후기 내용을 입력해주세요.");
      return;
    }
    setReviewError(null);
    createReviewMutation.mutate(
      {
        rewardId: selectedRewardId,
        rating,
        content: reviewContent.trim(),
      },
      {
        onSuccess: () => {
          setReviewContent("");
          setRating(5);
          setSelectedRewardId(undefined);
          setReviewModalOpen(false);
        },
        onError: (err: any) => {
          setReviewError(err.response?.data?.error?.message || "후기 등록에 실패했습니다.");
        },
      }
    );
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
        </div>

        {/* Action Button depending on active Tab */}
        {tab === "notices" && (isCreator || isAdmin) && (
          <Button
            type="button"
            onClick={() => {
              setNoticeError(null);
              setNoticeModalOpen(true);
            }}
            className="py-1.5 px-3 text-xs font-bold text-white flex items-center gap-1"
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>공지사항 작성</span>
          </Button>
        )}

        {tab === "reviews" && isLoggedIn && (
          <Button
            type="button"
            onClick={() => {
              setReviewError(null);
              setReviewModalOpen(true);
            }}
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
                        <button
                          type="button"
                          onClick={() => deleteNoticeMutation.mutate(notice.id)}
                          disabled={deleteNoticeMutation.isPending}
                          className="text-mist hover:text-red-500 p-1 transition-colors"
                          title="공지 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                        <button
                          type="button"
                          onClick={() => deleteReviewMutation.mutate(review.id)}
                          disabled={deleteReviewMutation.isPending}
                          className="text-mist hover:text-red-500 p-1 transition-colors"
                          title="후기 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* CREATE NOTICE DIALOG */}
      <Dialog open={noticeModalOpen} onOpenChange={setNoticeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>📢 공지사항 작성</DialogTitle>
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
              onClick={handleCreateNotice}
              disabled={createNoticeMutation.isPending}
            >
              {createNoticeMutation.isPending ? "등록 중..." : "공지사항 등록"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE REVIEW DIALOG */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>✍️ 후기 작성하기</DialogTitle>
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
            {rewards && rewards.length > 0 && (
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
              onClick={handleCreateReview}
              disabled={createReviewMutation.isPending}
            >
              {createReviewMutation.isPending ? "등록 중..." : "후기 등록하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
