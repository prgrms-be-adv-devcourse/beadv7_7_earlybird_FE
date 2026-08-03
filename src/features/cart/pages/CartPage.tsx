import { Card, EmptyState, ErrorState, RowSkeleton } from "../../../shared/ui";
import { useCart } from "../hooks";

export function CartPage() {
  const { data: cart, isPending, isError } = useCart();

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
  if (cart.itemCount === 0) return <EmptyState message="장바구니가 비어있어요." />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-ink">장바구니</h1>

      {cart.projects.map((project) => (
        <Card key={project.projectId}>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">{project.projectName}</h2>
          <ul className="flex flex-col gap-2">
            {project.rewards.map((reward) => (
              <li key={reward.cartItemId} className="flex justify-between rounded-sm border border-ink/20 p-3">
                <span>
                  {reward.rewardName} x {reward.quantity}
                </span>
                <span className="tabular-nums text-sm font-semibold text-ink">
                  {reward.totalPrice.toLocaleString()}원
                </span>
              </li>
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
          <span className="tabular-nums">{cart.totalItemsAmount.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between text-sm text-mist">
          <span>배송비 합계</span>
          <span className="tabular-nums">{cart.totalShippingFee.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between border-t-2 border-ink/10 pt-2 font-display text-lg font-bold text-ink">
          <span>총 결제 금액</span>
          <span className="tabular-nums">{cart.totalAmount.toLocaleString()}원</span>
        </div>
        <button
          type="button"
          disabled
          title="주문 생성 연동 준비 중입니다"
          className="mt-2 w-full cursor-not-allowed rounded-sm border-2 border-ink bg-brand px-4 py-3 text-sm font-bold text-white opacity-40"
        >
          결제하기
        </button>
      </Card>
    </div>
  );
}
