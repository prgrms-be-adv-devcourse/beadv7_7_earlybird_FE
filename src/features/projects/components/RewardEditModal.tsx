import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ErrorState,
} from "../../../shared/ui";
import { useUpdateReward, useDeleteReward } from "../hooks";
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
  const updateRewardMutation = useUpdateReward();
  const deleteRewardMutation = useDeleteReward();

  const [name, setName] = useState(reward.name);
  const [description, setDescription] = useState(reward.description ?? "");
  const [price, setPrice] = useState<number>(reward.price);
  const [totalQuantity, setTotalQuantity] = useState<number | null>(reward.totalQuantity);
  const [increaseQty, setIncreaseQty] = useState<number>(10);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const data: any = isPublished
      ? { increaseQuantity: Number(increaseQty) }
      : {
          name,
          description,
          price: Number(price),
          totalQuantity: totalQuantity ? Number(totalQuantity) : null,
        };

    updateRewardMutation.mutate(
      { rewardId: reward.rewardId, data },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err: any) => {
          const msg = err.response?.data?.error?.message || err.message || "리워드 수정에 실패했습니다.";
          setErrorMsg(msg);
        },
      }
    );
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
      <DialogContent className="max-w-md">
        <DialogTitle>🎁 리워드 관리</DialogTitle>
        <DialogDescription>
          {isPublished
            ? "공개(진행중) 프로젝트의 리워드는 수량 추가만 가능합니다."
            : "공개 전 리워드 정보를 자유롭게 수정 또는 삭제합니다."}
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

          {errorMsg && <ErrorState error={{ message: errorMsg, errors: null }} />}

          <div className="mt-2 flex items-center justify-between">
            {!isPublished ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleDelete}
                disabled={deleteRewardMutation.isPending}
                className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
              >
                {deleteRewardMutation.isPending ? "삭제 중..." : "리워드 삭제"}
              </Button>
            ) : <div />}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" disabled={updateRewardMutation.isPending}>
                {updateRewardMutation.isPending ? "적용 중..." : "적용하기"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
