import {useEffect, useRef, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useQueryClient} from "@tanstack/react-query";
import {Minus, Plus} from "lucide-react";
import {useCart, useClearCart, useRemoveCartItem, useUpdateCartItems} from "../hooks";
import {usePlaceOrder} from "../../orders/hooks";
import {useFilesByOwner} from "../../files/hooks";
import {useReward} from "../../projects/hooks";
import {generateUUID} from "../../orders/utils";
import {Button, Card, Dialog, DialogContent, DialogDescription, DialogTitle, Skeleton} from "../../../shared/ui";
import {ErrorState} from "../../../shared/ui/ErrorState";
import {EmptyState} from "../../../shared/ui/EmptyState";
import type {CartProject, CartReward} from "../types";
import {useAuthStore} from "../../../shared/auth/authStore";


function CartRewardRow({
  projectId,
  reward,
  onRemove,
  onChangeQuantity,
  isRemoving,
  isUpdating,
}: {
  projectId: number;
  reward: CartReward;
  onRemove: () => void;
  onChangeQuantity: (quantity: number) => void;
  isRemoving: boolean;
  isUpdating: boolean;
}) {
  const {data: rewardFiles} = useFilesByOwner("REWARD", reward.rewardId, true); // <-- 장바구니 리워드 사진을 조회합니다.
  const {data: rewardDetail} = useReward(reward.rewardId); // <-- 리워드 설명을 조회합니다.
  const thumbnailUrl = rewardFiles?.[0]?.storedUrl;
  const unitPrice = reward.unitPrice > 0 ? reward.unitPrice : reward.totalPrice / (reward.quantity || 1);
  const totalPrice = reward.totalPrice > 0 ? reward.totalPrice : unitPrice * reward.quantity;

  return (
    <li className="flex items-center justify-between border-b border-ink/5 py-3 last:border-none">
      <Link to={`/projects/${projectId}`} className="flex min-w-0 items-center gap-3 hover:text-brand"> {/* <-- 사진과 제목을 누르면 프로젝트 상세로 이동합니다. */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={reward.rewardName}
            className="h-14 w-14 shrink-0 rounded-sm border border-ink/20 bg-paper object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-dashed border-ink/30 bg-paper px-1 text-center text-[9px] leading-tight text-mist">
            이미지 준비중입니다
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-semibold text-ink hover:text-brand">{reward.rewardName}</span>
          <span className="truncate text-xs text-mist">{rewardDetail?.description || "리워드 상세 옵션"}</span>
        </div>
      </Link>
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
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const postcodeContainerRef = useRef<HTMLDivElement>(null);

  const createPostcode = (options?: { width?: number; height?: number }) =>
    new window.kakao.Postcode({
      ...options,
      oncomplete: (data) => {
        setZipCode(data.zonecode);
        setShippingAddress(data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress);
        setIsPostcodeOpen(false);
      },
    });

  useEffect(() => {
    if (isPostcodeOpen && postcodeContainerRef.current) {
      createPostcode().embed(postcodeContainerRef.current); // <-- 모바일 모달 내부에 검색 화면 표시
    }
  }, [isPostcodeOpen]);

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

  // 추가 : 카카오 우편번호 검색 결과를 배송지 정보에 반영
  const handleSearchAddress = () => {
    if (window.innerWidth < 768) {
      setIsPostcodeOpen(true); // <-- 모바일에서는 모달 내부에 표시
      return;
    }

    const width = 500; // <-- 팝업 크기
    const height = 600; // <-- 팝업 크기
    const left = Math.min( // <-- 주문 모달 오른쪽에 표시
      window.screen.availWidth - width - 20,
      window.screenX + window.outerWidth / 2 + 240,
    ) + 20;
    const top = window.screenY + (window.outerHeight - height) / 2;

    createPostcode({ width, height }).open({
      left,
      top,
    });
  };

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
          setIsPostcodeOpen(false);
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
            플랫폼 특성상 창작자 및 프로젝트 단위로 배송 일정과 혜택이 상이하여 프로젝트별 개별 주문·결제가 진행됩니다.
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
                  projectId={project.projectId}
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
                  setIsPostcodeOpen(false);
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
            setIsPostcodeOpen(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogTitle>주문 / 결제 정보 확인</DialogTitle>

          <DialogDescription className="mt-1 flex flex-col gap-2">
            {selectedProject?.projectName && (
                <span>상품명 : [{selectedProject.projectName}]</span>
            )}

            <span>배송지 정보를 확인하고 주문을 완료하세요.</span>
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
              <div className="flex gap-2"> {/* <-- 우편번호 검색 버튼으로 변경 */}
                <input
                  type="text"
                  value={zipCode}
                  readOnly
                  className="w-full rounded-sm border border-ink/30 px-3 py-1.5 text-ink"
                />
                <Button type="button" variant="secondary" onClick={handleSearchAddress} className="shrink-0 px-3 py-1.5 text-xs">
                  우편번호 검색
                </Button>
              </div>
            </div>

            {isPostcodeOpen && (
              <div ref={postcodeContainerRef} className="h-[450px] border border-ink/20" />
            )}

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
                setIsPostcodeOpen(false);
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
