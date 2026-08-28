import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ErrorState,
} from "../../../shared/ui";
import { useUpdateReward, useDeleteReward } from "../hooks";
import { useFilesByOwner, useUploadFile } from "../../files/hooks";
import { deleteFile } from "../../files/api";
import { ACCEPTED_IMAGE_TYPES, IMAGE_FORMAT_GUIDE } from "../../files/types";
import type { Reward } from "../types";

export function RewardEditModal({
  reward,
  isPublished,
  open,
  onOpenChange,
}: {
  reward: Reward;
  isPublished: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const updateRewardMutation = useUpdateReward();
  const deleteRewardMutation = useDeleteReward();
  const uploadFileMutation = useUploadFile();
  const { data: existingFiles } = useFilesByOwner("REWARD", reward.rewardId, open);

  const [name, setName] = useState(reward.name);
  const [description, setDescription] = useState(reward.description ?? "");
  const [price, setPrice] = useState<number>(reward.price);
  const [totalQuantity, setTotalQuantity] = useState<number | null>(reward.totalQuantity);
  const [increaseQty, setIncreaseQty] = useState<number>(10);

  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(reward.name);
      setDescription(reward.description ?? "");
      setPrice(reward.price);
      setTotalQuantity(reward.totalQuantity);
      setIncreaseQty(10);
      setNewImageFile(null);
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setErrorMsg(null);
    } else {
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, reward]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    try {
      if (newImageFile) {
        // Reward에는 thumbnailId가 없어 표시 쪽이 files[0]을 쓴다 — 새로 올리기 전에 기존
        // REWARD 파일을 지워서 "리워드당 사진 1장" 불변식을 유지한다. 안 지우면 옛 사진이 계속 보인다.
        for (const f of existingFiles ?? []) {
          try {
            await deleteFile(f.id);
          } catch (err) {
            console.warn("기존 리워드 사진 삭제 실패(무시하고 업로드 진행):", err);
          }
        }
        await uploadFileMutation.mutateAsync({
          file: newImageFile,
          ownerType: "REWARD",
          ownerId: reward.rewardId,
        });
        queryClient.invalidateQueries({ queryKey: ["files", "REWARD", reward.rewardId] });
      }

      const data: any = isPublished
        ? { increaseQuantity: Number(increaseQty) }
        : {
            name,
            description,
            price: Number(price),
            totalQuantity: totalQuantity ? Number(totalQuantity) : null,
            clearTotalQuantity: totalQuantity === null,
          };

      await updateRewardMutation.mutateAsync({ rewardId: reward.rewardId, data });
      queryClient.invalidateQueries({ queryKey: ["rewards", reward.projectId] });
      onOpenChange(false);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "리워드 수정에 실패했습니다.";
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    deleteRewardMutation.mutate(reward.rewardId, {
      onSuccess: () => onOpenChange(false),
      onError: (err: any) => {
        const msg = err.response?.data?.error?.message || err.message || "리워드 삭제에 실패했습니다.";
        setErrorMsg(msg);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>🎁 리워드 관리</DialogTitle>
        <DialogDescription>
          {isPublished
            ? "공개(진행중) 프로젝트의 리워드는 수량 추가 및 사진 변경이 가능합니다."
            : "공개 전 리워드 정보와 사진을 자유롭게 수정 또는 삭제합니다."}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="my-4 flex flex-col gap-4 text-sm">
          {!isPublished ? (
            <>
              <div>
                <label className="mb-1 block font-semibold text-ink">리워드 이름 *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">가격 (원) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">구성 설명</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">총 수량 (비워두면 무제한)</label>
                <input
                  type="number"
                  placeholder="무제한"
                  value={totalQuantity ?? ""}
                  onChange={(e) => setTotalQuantity(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none tabular-nums"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1 block font-semibold text-ink">추가할 수량 (원래 수량 + N개)</label>
              <input
                type="number"
                min={1}
                value={increaseQty}
                onChange={(e) => setIncreaseQty(Number(e.target.value))}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none tabular-nums"
              />
              <p className="mt-1 text-xs text-mist">
                * 공개 후 수량 감소 및 비활성화는 후원자 보호를 위해 관리자 전용 권한입니다.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block font-semibold text-ink">리워드 사진 (추가/변경)</label>
            {(imagePreviewUrl || (existingFiles && existingFiles.length > 0)) && (
              <div className="mb-2 flex items-center justify-center w-full rounded-sm border border-ink/20 bg-paper/60 p-1">
                <img
                  src={imagePreviewUrl || existingFiles?.[0]?.storedUrl}
                  alt="리워드 미리보기"
                  className="max-h-48 w-full rounded-sm object-contain transition-all duration-300"
                />
              </div>
            )}
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setNewImageFile(file);
                setImagePreviewUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return file ? URL.createObjectURL(file) : null;
                });
              }}
              className="w-full text-xs text-ink file:mr-3 file:rounded file:border file:border-ink/30 file:bg-paper file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-ink hover:file:bg-paper/80"
            />
            <p className="mt-1 text-[11px] text-mist">
              * 지원 형식: {IMAGE_FORMAT_GUIDE}
            </p>
          </div>

          {errorMsg && <ErrorState error={{ message: errorMsg, errors: null }} />}

          <div className="mt-2 flex items-center justify-between">
            {!isPublished ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleDelete}
                disabled={deleteRewardMutation.isPending || isSaving}
                className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
              >
                {deleteRewardMutation.isPending ? "삭제 중..." : "리워드 삭제"}
              </Button>
            ) : <div />}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving || updateRewardMutation.isPending || uploadFileMutation.isPending}>
                {isSaving ? "저장 중..." : "적용하기"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
