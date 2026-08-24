import {Link} from "react-router-dom";
import {Badge, Card, EmptyState, ErrorState, RowSkeleton} from "../../../shared/ui";
import {useFilesByOwner} from "../../files/hooks";
import {useOrder, useOrders} from "../hooks";
import {getOrderDisplayNumber, getOrderStatusBadgeTone, getOrderStatusLabel} from "../utils";
import type {OrderItem, OrderSummary} from "../types";

// 추가 : 주문 리워드의 사진과 수량을 표시합니다.
function OrderRewardItem({ item }: { item: OrderItem }) {
  const { data: files } = useFilesByOwner("REWARD", item.rewardId, true);
  const thumbnailUrl = files?.[0]?.storedUrl;

  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={item.name}
            className="h-12 w-12 shrink-0 rounded-sm border border-ink/40 bg-paper object-cover"
          />
        )}
        {!thumbnailUrl && ( // <-- 이미지가 없는 리워드에도 같은 크기의 안내 썸네일을 표시합니다.
          <div className="ml-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-dashed border-ink/40 bg-paper px-1 text-center text-[9px] leading-tight text-mist"> {/* <-- 제목 중앙에 맞춰 안내 썸네일을 이동합니다. */}
            이미지 준비중입니다
          </div>
        )}
        <span className="truncate">{item.name} × {item.quantity}개</span>
      </div>
      <span className="shrink-0 tabular-nums font-semibold">{item.subtotal.toLocaleString()}원</span>
    </li>
  );
}

// 추가 : 주문 카드 아래에 주문 리워드를 표시합니다.
function OrderListItem({ order, allOrderIds }: { order: OrderSummary; allOrderIds: number[] }) {
  const { data: orderDetail } = useOrder(order.id, false);

  return (
    <div className="flex flex-col rounded-sm shadow-stamp transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-stamp-lg"> {/* <-- 기본 상태와 hover 모두 주문·리워드 전체가 같은 그림자를 사용합니다. */}
      <Link to={`/orders/${order.id}`}>
        <Card className="flex items-center justify-between rounded-b-none border-b-0 shadow-none"> {/* <-- 리워드 영역과 하나의 카드처럼 연결합니다. */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-ink">주문 #{getOrderDisplayNumber(order.id, allOrderIds)}</span>
            <Badge tone={getOrderStatusBadgeTone(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
            {order.status === "PAID" && (
              <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-800 hidden sm:inline-block">
                ✍️ 후기 작성 가능
              </span>
            )}
          </div>
          <span className="tabular-nums font-bold text-ink">{order.totalAmount.toLocaleString()}원</span>
        </Card>
      </Link>

      {orderDetail?.orderItems.length ? (
        <div className="rounded-b-sm border-x-2 border-b-2 border-ink bg-surface/60 px-5 py-3"> {/* <-- 주문 카드와 맞닿는 진한 테두리입니다. */}
          <p className="mb-1 text-xs font-bold text-mist">주문한 리워드</p>
          <ul className="flex flex-col gap-1 text-sm text-ink">
            {orderDetail.orderItems.map((item) => (
              <OrderRewardItem key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function OrderListPage() {
  const { data: orders, isPending, isError } = useOrders();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState error={{ message: "주문 목록을 불러오지 못했습니다.", errors: null }} />;
  if (orders.length === 0) return <EmptyState message="아직 주문이 없어요." />;

  const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
  const allOrderIds = orders.map((order) => order.id);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-2xl font-bold text-ink mb-2">📦 내 주문 내역</h1>
      {sortedOrders.map((order) => (
        <OrderListItem key={order.id} order={order} allOrderIds={allOrderIds} /> // <-- 리워드를 주문 카드 아래 별도 영역으로 표시합니다.
      ))}
    </div>
  );
}
