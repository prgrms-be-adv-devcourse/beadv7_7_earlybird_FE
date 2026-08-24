import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Order } from "../types";
import { OrderDetailPage } from "./OrderDetailPage";

function makeOrder(status: Order["status"]): Order {
  return {
    id: 26,
    status,
    itemsAmount: 3000,
    shippingFee: 3000,
    totalAmount: 6000,
    receiverName: "김얼리",
    receiverPhone: "010-1234-5678",
    shippingAddress: "서울특별시 강남구 테헤란로 123",
    zipCode: "06234",
    orderItems: [{ id: 1, name: "[얼리버드] 강대혁의 벌레", price: 3000, projectId: 71, rewardId: 104, quantity: 1, subtotal: 3000 }],
  };
}

let currentOrder: Order;
const refetchOrder = vi.fn();

vi.mock("../hooks", () => ({
  useOrder: () => ({ data: currentOrder, isPending: false, isError: false, refetch: refetchOrder }),
  useOrders: () => ({ data: [] }),
  useCancelOrder: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../payments/hooks", () => ({
  useConfirmPayment: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/orders/26"]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("OrderDetailPage 결제 완료 마스코트", () => {
  beforeEach(() => {
    refetchOrder.mockReset();
  });

  it("이미 결제된 주문을 그냥 다시 봤을 때는 마스코트가 재생되지 않는다", () => {
    currentOrder = makeOrder("PAID");
    const { container } = renderPage();

    expect(container.querySelector('img[src="/bird-afterPay.png"]')).not.toBeInTheDocument();
  });

  it("confirmPayment 콜백 없이 PAYMENT_PENDING에서 PAID로 상태가 바뀌기만 해도 마스코트가 뜬다", () => {
    // Toss 콜백(confirmPayment onSuccess)보다 백엔드 Kafka 이벤트 + useOrder의 폴링이 먼저
    // PAID를 반영하는 경우를 재현한다 — 이 레이스에서도 마스코트가 떠야 한다.
    currentOrder = makeOrder("PAYMENT_PENDING");
    const { container, rerender } = renderPage();

    expect(container.querySelector('img[src="/bird-afterPay.png"]')).not.toBeInTheDocument();

    currentOrder = makeOrder("PAID");
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/orders/26"]}>
          <Routes>
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.querySelector('img[src="/bird-afterPay.png"]')).toBeInTheDocument();
  });

  it("성공 배너 문구가 새 카피로 표시된다", () => {
    currentOrder = makeOrder("PAID");
    renderPage();

    expect(screen.getByText("🎉 후원이 잘 전달됐어요")).toBeInTheDocument();
  });
});
