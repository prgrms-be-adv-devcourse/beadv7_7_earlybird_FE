import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useCart, useRemoveCartItem, useClearCart, useUpdateCartItems } from "../hooks";
import { usePlaceOrder } from "../../orders/hooks";
import { generateUUID } from "../../orders/utils";
import { Card, Button, Skeleton, Dialog, DialogContent, DialogTitle, DialogDescription } from "../../../shared/ui";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { EmptyState } from "../../../shared/ui/EmptyState";
import type { CartProject, CartReward } from "../types";
import { useAuthStore } from "../../../shared/auth/authStore";


function CartRewardRow({
  reward,
  onRemove,
  onChangeQuantity,
  isRemoving,
  isUpdating,
}: {
  reward: CartReward;
  onRemove: () => void;
  onChangeQuantity: (quantity: number) => void;
  isRemoving: boolean;
  isUpdating: boolean;
}) {
  const unitPrice = reward.unitPrice > 0 ? reward.unitPrice : reward.totalPrice / (reward.quantity || 1);
  const totalPrice = reward.totalPrice > 0 ? reward.totalPrice : unitPrice * reward.quantity;

  return (
    <li className="flex items-center justify-between border-b border-ink/5 py-3 last:border-none">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-ink">{reward.rewardName}</span>
        <span className="text-xs text-mist">단가: {unitPrice.toLocaleString()}원</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-sm border border-ink/20">
          <button
            type="button"
            onClick={() => onChangeQuantity(reward.quantity - 1)}
            disabled={isUpdating || reward.quantity <= 1}
            className="p-1.5 text-mist transition-colors hover:text-brand disabled:opacity-30"
            aria-label="수량 감소"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-ink tabular-nums">{reward.quantity}</span>
          <button
            type="button"
            onClick={() => onChangeQuantity(reward.quantity + 1)}
            disabled={isUpdating}
            className="p-1.5 text-mist transition-colors hover:text-brand disabled:opacity-30"
            aria-label="수량 증가"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="tabular-nums text-sm font-semibold text-ink">
          {totalPrice.toLocaleString()}원
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="rounded-sm border border-ink/20 px-2 py-1 text-xs text-mist transition-colors hover:border-red-400 hover:text-red-500"
        >
          삭제
        </button>
      </div>
    </li>
  );
}

export function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cart, isPending, isError } = useCart();
  const removeCartItemMutation = useRemoveCartItem();
  const updateCartItemsMutation = useUpdateCartItems();
  const clearCartMutation = useClearCart();
  const placeOrderMutation = usePlaceOrder();
  const userId = useAuthStore((state) => state.user?.id);

  const [selectedProject, setSelectedProject] = useState<CartProject | null>(null);
  const [receiverName, setReceiverName] = useState("김얼리");
  const [receiverPhone, setReceiverPhone] = useState("010-1234-5678");
  const [shippingAddress, setShippingAddress] = useState("서울특별시 강남구 테헤란로 123");
  const [zipCode, setZipCode] = useState("06234");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">장바구니</h1>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  if (isError || !cart) return <ErrorState error={{ message: "장바구니를 불러오지 못했습니다.", errors: null }} />;
  if (cart.itemCount === 0 || cart.projects.length === 0) return <EmptyState message="장바구니가 비어있어요." />;

  const handlePlaceOrder = () => {
    if (isSubmitting || placeOrderMutation.isPending) return;
    setOrderError(null);
    if (!userId || !selectedProject) return;

    setIsSubmitting(true);

    const currentKey = idempotencyKey || generateUUID();
    if (!idempotencyKey) {
      setIdempotencyKey(currentKey);
    }

    const lines = selectedProject.rewards.map((reward) => ({
      rewardId: reward.rewardId,
      quantity: reward.quantity,
      expectedUnitPrice: reward.unitPrice > 0 ? reward.unitPrice : reward.totalPrice / (reward.quantity || 1),
    }));

    const projectItemsAmount = selectedProject.itemsAmount > 0
      ? selectedProject.itemsAmount
      : selectedProject.rewards.reduce((sum, r) => sum + (r.totalPrice > 0 ? r.totalPrice : r.unitPrice * r.quantity), 0);

    const shippingFee = selectedProject.shippingFee > 0
      ? selectedProject.shippingFee
      : (projectItemsAmount >= 50000 ? 0 : 3000);

    const projectTotalAmount = projectItemsAmount + shippingFee;

    placeOrderMutation.mutate(
      {
        userId,
        projectId: Number(selectedProject.projectId),
        lines,
        requests: lines,
        receiverName,
        receiverPhone,
        shippingAddress,
        zipCode,
        expectedItemsAmount: projectItemsAmount,
        expectedTotalAmount: projectTotalAmount,
        orderIdempotencyKey: currentKey,
      },
      {
        onSuccess: (createdOrder) => {
          setIsSubmitting(false);
          setIdempotencyKey(null);
          setSelectedProject(null);
          queryClient.invalidateQueries({ queryKey: ["cart"] });
          navigate(`/checkout/${createdOrder.id}`);
        },
        onError: (err: any) => {
          setIsSubmitting(false);
          const msg = err.response?.data?.error?.message || err.message || "주문 생성에 실패했습니다.";
          setOrderError(msg);
        },
      }
    );
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">장바구니</h1>
          <p className="mt-1 text-xs text-mist">
            💡 펀딩 결제 정책에 따라 동일 프로젝트의 리워드 단위로 프로젝트별 개별 주문이 진행됩니다.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => clearCartMutation.mutate()}
          disabled={clearCartMutation.isPending}
          className="border-red-300 text-xs text-red-600 hover:bg-red-50"
        >
          {clearCartMutation.isPending ? "비우는 중..." : "장바구니 비우기"}
        </Button>
      </div>

      {cart.projects.map((project) => {
        const projectItemsAmount = project.itemsAmount > 0
          ? project.itemsAmount
          : project.rewards.reduce((sum, r) => sum + (r.totalPrice > 0 ? r.totalPrice : r.unitPrice * r.quantity), 0);

        return (
          <Card key={project.projectId} className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h2 className="font-display text-lg font-bold text-ink">
                {project.projectName || `프로젝트 #${project.projectId}`}
              </h2>
              <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-brand">
                {project.rewards.length}개 리워드 선택됨
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {project.rewards.map((reward) => (
                <CartRewardRow
                  key={reward.cartItemId}
                  reward={reward}
                  onRemove={() => removeCartItemMutation.mutate(reward.rewardId)}
                  onChangeQuantity={(quantity) => {
                    if (quantity < 1) return;
                    updateCartItemsMutation.mutate({
                      projectId: project.projectId,
                      items: [{ rewardId: reward.rewardId, quantity }],
                    });
                  }}
                  isRemoving={removeCartItemMutation.isPending}
                  isUpdating={updateCartItemsMutation.isPending}
                />
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-ink/10 pt-3 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-mist">이 프로젝트 상품 금액</span>
                <span className="tabular-nums text-lg font-bold text-ink">
                  {projectItemsAmount.toLocaleString()}원
                </span>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setSelectedProject(project);
                  setOrderError(null);
                  setIdempotencyKey(null);
                  setIsSubmitting(false);
                }}
                className="px-6 py-2.5 text-sm font-bold text-white"
              >
                이 프로젝트 결제하기
              </Button>
            </div>
          </Card>
        );
      })}

      <Dialog
        open={selectedProject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProject(null);
            setIdempotencyKey(null);
            setIsSubmitting(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle>주문 / 결제 정보 확인</DialogTitle>
          <DialogDescription>
            {selectedProject?.projectName ? `[${selectedProject.projectName}] ` : ""}배송지 정보를 확인하고 주문을 완료하세요.
          </DialogDescription>

          <div className="my-4 flex flex-col gap-3 text-sm">
            <div>
              <label className="mb-1 block font-semibold text-ink">수령인 성함</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">연락처</label>
              <input
                type="text"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">배송지 주소</label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">우편번호</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>

            {(() => {
              const modalItems = selectedProject
                ? selectedProject.itemsAmount > 0
                  ? selectedProject.itemsAmount
                  : selectedProject.rewards.reduce((s, r) => s + (r.totalPrice > 0 ? r.totalPrice : r.unitPrice * r.quantity), 0)
                : 0;
              const modalShipping = selectedProject
                ? selectedProject.shippingFee > 0
                  ? selectedProject.shippingFee
                  : (modalItems >= 50000 ? 0 : 3000)
                : 0;
              const modalTotal = modalItems + modalShipping;

              return (
                <div className="mt-2 flex flex-col gap-1 rounded-sm bg-mint/10 p-3 text-ink">
                  <div className="flex justify-between text-xs text-mist">
                    <span>상품 금액:</span>
                    <span className="tabular-nums">{modalItems.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-xs text-mist">
                    <span>배송비:</span>
                    <span className="tabular-nums">
                      {modalShipping > 0 ? `+${modalShipping.toLocaleString()}원 (5만원 미만 배송비)` : "무료배송"}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-ink/10 pt-1.5 mt-1">
                    <span>최종 결제 금액:</span>
                    <span className="tabular-nums text-brand font-extrabold text-base">
                      {modalTotal.toLocaleString()}원
                    </span>
                  </div>
                </div>
              );
            })()}

            {orderError && <ErrorState error={{ message: orderError, errors: null }} />}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedProject(null);
                setIdempotencyKey(null);
                setIsSubmitting(false);
              }}
            >
              취소
            </Button>
            <Button
              id="orderButton"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || placeOrderMutation.isPending}
            >
              {isSubmitting || placeOrderMutation.isPending ? "주문 처리 중..." : "주문 완료 및 결제하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
