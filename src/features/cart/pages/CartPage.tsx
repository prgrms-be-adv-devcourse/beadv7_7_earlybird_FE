import { Card, EmptyState, ErrorState, Spinner } from "../../../shared/ui";
import { useCart } from "../hooks";

export function CartPage() {
  const { data: cart, isPending, isError } = useCart();

  if (isPending) return <Spinner label="장바구니 불러오는 중..." />;
  if (isError || !cart) return <ErrorState error={{ message: "장바구니를 불러오지 못했습니다.", errors: null }} />;
  if (cart.itemCount === 0) return <EmptyState message="장바구니가 비어있어요." />;

  return (
    <Card>
      <h1 className="mb-3 font-jua text-2xl">장바구니</h1>
      <ul className="flex flex-col gap-2">
        {cart.projects.flatMap((project) =>
          project.rewards.map((reward) => (
            <li key={reward.cartItemId} className="flex justify-between rounded-2xl bg-mint/10 p-3">
              <span>
                {reward.rewardName} x {reward.quantity}
              </span>
              <span>{reward.totalPrice.toLocaleString()}원</span>
            </li>
          )),
        )}
      </ul>
    </Card>
  );
}
