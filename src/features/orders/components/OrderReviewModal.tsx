import { useState, useEffect } from "react";
import { Star, ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../shared/ui";
import { useCreateReview } from "../../board/hooks";
import { useUploadFile } from "../../files/hooks";
import type { OrderItem } from "../types";

interface OrderReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  defaultRewardId?: number;
  onSuccess?: () => void;
}

export function OrderReviewModal({
  open,
  onOpenChange,
  orderItems,
  defaultRewardId,
  onSuccess,
}: OrderReviewModalProps) {
  const [selectedRewardId, setSelectedRewardId] = useState<number | undefined>(defaultRewardId);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [content, setContent] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Determine current active item based on selectedRewardId
  const activeItem =
    orderItems.find((i) => i.rewardId === selectedRewardId) || orderItems[0];
  const targetProjectId = activeItem?.projectId;

  const createReviewMutation = useCreateReview(targetProjectId || 0);
  const uploadPhotoMutation = useUploadFile();

  useEffect(() => {
    if (open) {
      setSelectedRewardId(defaultRewardId ?? orderItems[0]?.rewardId);
      setRating(5);
      setContent("");
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setErrorMsg(null);
      setSuccessMsg(null);
    } else {
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, defaultRewardId, orderItems]);

  const handleFileChange = (file: File | null) => {
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleSubmit = async () => {
    if (!targetProjectId) {
      setErrorMsg("프로젝트 정보를 찾을 수 없습니다.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("후기 내용을 입력해 주세요.");
      return;
    }
    setErrorMsg(null);

    try {
      const createdReview = await createReviewMutation.mutateAsync({
        rewardId: selectedRewardId,
        rating,
        content: content.trim(),
      });

      if (photoFile && createdReview?.id) {
        await uploadPhotoMutation.mutateAsync({
          file: photoFile,
          ownerType: "REVIEW",
          ownerId: createdReview.id,
        });
      }

      setSuccessMsg("후기가 성공적으로 등록되었습니다!");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onOpenChange(false);
      }, 1200);
    } catch (err: any) {
      const status = err?.response?.status;
      const rawMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "";
      if (status === 409 || rawMessage.includes("이미 이 프로젝트에 리뷰를 작성했습니다")) {
        setErrorMsg("이미 이 프로젝트에 작성하신 후기가 등록되어 있습니다. 프로젝트 상세 페이지의 [후기] 탭에서 확인하실 수 있습니다.");
      } else if (
        status === 403 ||
        status === 400 ||
        rawMessage.includes("구매") ||
        rawMessage.includes("확인") ||
        rawMessage.includes("PurchaseNotVerified")
      ) {
        setErrorMsg("주문확정된 사용자만 리뷰 작성이 가능합니다!");
      } else {
        setErrorMsg(rawMessage || "후기 등록 중 오류가 발생했습니다.");
      }
    }
  };

  const isSubmitting = createReviewMutation.isPending || uploadPhotoMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <span>✍️ 후기 작성하기</span>
        </DialogTitle>
        <DialogDescription>
          후원하신 리워드에 대한 솔직한 경험과 소감을 남겨주세요.
        </DialogDescription>

        {successMsg ? (
          <div className="my-6 flex flex-col items-center justify-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-mint animate-bounce" />
            <p className="font-display text-base font-bold text-ink">{successMsg}</p>
            <p className="text-xs text-mist">프로젝트 상세 페이지의 후기 탭에서 확인하실 수 있습니다.</p>
          </div>
        ) : (
          <div className="my-4 flex flex-col gap-4">
            {/* Target Reward Selection */}
            {orderItems.length > 1 ? (
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  후기 대상 리워드 선택
                </label>
                <select
                  value={selectedRewardId ?? ""}
                  onChange={(e) => setSelectedRewardId(Number(e.target.value))}
                  className="w-full rounded border-2 border-ink/20 bg-surface px-3 py-2 text-xs font-bold text-ink outline-none focus:border-brand"
                >
                  {orderItems.map((item) => (
                    <option key={item.id} value={item.rewardId}>
                      {item.name} ({item.price.toLocaleString()}원)
                    </option>
                  ))}
                </select>
              </div>
            ) : activeItem ? (
              <div className="rounded-lg border border-ink/15 bg-paper/60 p-3">
                <span className="text-[11px] font-bold text-mist block mb-0.5">후원 리워드</span>
                <p className="text-xs font-extrabold text-ink">{activeItem.name}</p>
              </div>
            ) : null}

            {/* Star Rating Input */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">만족도 별점</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating ?? rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          isFilled
                            ? "fill-amber-400 text-amber-400"
                            : "text-ink/20 hover:text-amber-300"
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 font-mono text-sm font-extrabold text-ink">
                  {rating} / 5점
                </span>
              </div>
            </div>

            {/* Review Content Textarea */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">후기 내용</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="리워드의 품질, 마감, 배송 등 솔직한 후기를 남겨주세요."
                className="w-full rounded-md border-2 border-ink/20 p-3 text-xs text-ink outline-none focus:border-brand resize-none"
              />
            </div>

            {/* Photo Attachment Input */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-bold text-ink">
                <ImageIcon className="h-3.5 w-3.5 text-mist" />
                <span>사진 첨부 (선택)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-ink file:mr-3 file:rounded file:border file:border-ink/30 file:bg-paper file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-ink hover:file:bg-paper/80"
              />

              {photoPreview && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Review attachment preview"
                    className="max-h-48 max-w-full rounded border-2 border-ink/20 object-contain bg-paper/60 p-0.5 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleFileChange(null)}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white text-[10px] font-black shadow-sm hover:scale-110 transition-transform"
                    title="사진 제거"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md border-2 border-amber-400 bg-amber-50 p-3 text-xs font-bold text-amber-900 shadow-sm">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {!successMsg && (
          <div className="mt-4 flex justify-end gap-2 border-t border-ink/10 pt-3">
            <DialogClose asChild>
              <Button variant="secondary" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "후기 등록하기"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
