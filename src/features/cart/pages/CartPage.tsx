import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, useRemoveCartItem, useClearCart } from "../hooks";
import { useReward } from "../../projects/hooks";
import { usePlaceOrder } from "../../orders/hooks";
import { useAuthStore } from "../../../shared/auth/authStore";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ErrorState,
  RowSkeleton,
} from "../../../shared/ui";

function CartRewardRow({
  reward,
  onRemove,
  isRemoving,
}: {
  reward: {
    cartItemId: number;
    rewardId: number;
    rewardName?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const { data: rewardDetail } = useReward(reward.rewardId);

  const name = reward.rewardName || rewardDetail?.name || `리워드 #${reward.rewardId}`;
  const price = reward.unitPrice > 0 ? reward.unitPrice : rewardDetail?.price || 0;
  const totalPrice = reward.totalPrice > 0 ? reward.totalPrice : price * reward.quantity;

  return (
    <li className="flex items-center justify-between rounded-sm border border-ink/20 p-3">
      <div className="flex flex-col">
        <span className="font-medium text-ink">
          {name} x {reward.quantity}
        </span>
        {price > 0 && (
          <span className="text-xs text-mist">{price.toLocaleString()}원 / 개</span>
        )}
      </div>
      <div className="flex items-center gap-3">
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
  const { data: cart, isPending, isError } = useCart();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const placeOrderMutation = usePlaceOrder();
  const userId = useAuthStore((state) => state.user?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [receiverName, setReceiverName] = useState("김얼리");
  const [receiverPhone, setReceiverPhone] = useState("010-1234-5678");
  const [shippingAddress, setShippingAddress] = useState("서울특별시 강남구 테헤란로 123");
  const [zipCode, setZipCode] = useState("06234");
  const [orderError, setOrderError] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">장바구니</h1>
        {Array.from({ length: 3 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (isError || !cart) return <ErrorState error={{ message: "장바구니를 불러오지 못했습니다.", errors: null }} />;
  if (cart.itemCount === 0 || cart.projects.length === 0) return <EmptyState message="장바구니가 비어있어요." />;

  // Calculate actual total items amount considering enriched pricing
  const totalItemsAmount = cart.totalItemsAmount > 0
    ? cart.totalItemsAmount
    : cart.projects.reduce((acc, p) => acc + p.itemsAmount, 0);

  const shippingFee = totalItemsAmount >= 50000 ? 0 : (cart.totalShippingFee > 0 ? cart.totalShippingFee : 3000);
  const totalAmount = totalItemsAmount + shippingFee;

  const handlePlaceOrder = () => {
    setOrderError(null);
    if (!userId) return;

    const requests = cart.projects.flatMap((project) =>
      project.rewards.map((reward) => ({
        rewardId: reward.rewardId,
        quantity: reward.quantity,
        expectedUnitPrice: reward.unitPrice > 0 ? reward.unitPrice : reward.totalPrice / (reward.quantity || 1),
      }))
    );

    const firstProjectId = cart.projects[0]?.projectId ?? undefined;

    placeOrderMutation.mutate(
      {
        userId,
        projectId: firstProjectId ? Number(firstProjectId) : undefined,
        requests,
        receiverName,
        receiverPhone,
        shippingAddress,
        zipCode,
        expectedItemsAmount: totalItemsAmount,
        expectedTotalAmount: totalAmount,
      },
      {
        onSuccess: (createdOrder) => {
          setIsDialogOpen(false);
          navigate(`/orders/${createdOrder.id}`);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error?.message || err.message || "주문 생성에 실패했습니다.";
          setOrderError(msg);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">장바구니</h1>
        <Button
          variant="secondary"
          onClick={() => clearCartMutation.mutate()}
          disabled={clearCartMutation.isPending}
          className="border-red-300 text-xs text-red-600 hover:bg-red-50"
        >
          {clearCartMutation.isPending ? "비우는 중..." : "장바구니 비우기"}
        </Button>
      </div>

      {cart.projects.map((project) => (
        <Card key={project.projectId}>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">
            {project.projectName || `프로젝트 #${project.projectId}`}
          </h2>
          <ul className="flex flex-col gap-2">
            {project.rewards.map((reward) => (
              <CartRewardRow
                key={reward.cartItemId}
                reward={reward}
                onRemove={() => removeCartItemMutation.mutate(reward.rewardId)}
                isRemoving={removeCartItemMutation.isPending}
              />
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-1 border-t-2 border-ink/10 pt-3 text-sm text-mist">
            <div className="flex justify-between">
              <span>상품 금액</span>
              <span className="tabular-nums">{project.itemsAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span>배송비</span>
              <span className="tabular-nums">{project.shippingFee.toLocaleString()}원</span>
            </div>
          </div>
        </Card>
      ))}

      <Card className="flex flex-col gap-2">
        <div className="flex justify-between text-sm text-mist">
          <span>상품 금액 합계</span>
          <span className="tabular-nums">{totalItemsAmount.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between text-sm text-mist">
          <span>배송비 합계</span>
          <span className="tabular-nums">{shippingFee.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between border-t-2 border-ink/10 pt-2 font-display text-lg font-bold text-ink">
          <span>총 결제 금액</span>
          <span className="tabular-nums">{totalAmount.toLocaleString()}원</span>
        </div>
        <Button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="mt-2 w-full py-3 text-sm font-bold text-white"
        >
          결제하기
        </Button>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>주문 / 결제 정보 확인</DialogTitle>
          <DialogDescription>배송지 정보를 확인하고 주문을 완료하세요.</DialogDescription>

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

            <div className="mt-2 rounded-sm bg-mint/10 p-3 text-ink">
              <div className="flex justify-between font-bold">
                <span>최종 결제 금액:</span>
                <span>{totalAmount.toLocaleString()}원</span>
              </div>
            </div>

            {orderError && <ErrorState error={{ message: orderError, errors: null }} />}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handlePlaceOrder} disabled={placeOrderMutation.isPending}>
              {placeOrderMutation.isPending ? "주문 처리 중..." : "주문 완료 및 결제하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
