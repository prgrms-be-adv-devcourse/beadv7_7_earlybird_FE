import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { ORDER_SERVICE } from "../../shared/api/endpoints";
import { fetchOrders, fetchOrder, cancelOrder, placeOrder } from "./api";
import { generateUUID } from "./utils";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe("orders api", () => {
  it("fetchOrders는 ORDER_SERVICE.myOrders를 userId 쿼리 파라미터와 함께 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchOrders(1);
    expect(apiClient.get).toHaveBeenCalledWith(ORDER_SERVICE.myOrders, { params: { userId: 1 } });
  });

  it("fetchOrder는 ORDER_SERVICE.order(id)를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: { id: 5 }, error: null } });
    await fetchOrder(5);
    expect(apiClient.get).toHaveBeenCalledWith(ORDER_SERVICE.order(5));
  });

  it("cancelOrder는 ORDER_SERVICE.cancel(id)로 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await cancelOrder(5);
    expect(apiClient.post).toHaveBeenCalledWith(ORDER_SERVICE.cancel(5));
  });

  it("placeOrder는 ORDER_SERVICE.orders로 orderIdempotencyKey가 포함된 요청 데이터를 POST한다", async () => {
    const fakeOrder = { id: 10, status: "CREATED", totalAmount: 15000 };
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: fakeOrder, error: null } });

    const idempotencyKey = generateUUID();
    const item = [{ rewardId: 1, quantity: 1, expectedUnitPrice: 15000 }];
    const payload = {
      userId: 1,
      projectId: 100,
      lines: item,
      requests: item,
      receiverName: "김얼리",
      receiverPhone: "010-1234-5678",
      shippingAddress: "서울특별시 강남구",
      zipCode: "06234",
      expectedItemsAmount: 15000,
      expectedTotalAmount: 15000,
      orderIdempotencyKey: idempotencyKey,
    };

    const result = await placeOrder(payload);
    expect(apiClient.post).toHaveBeenCalledWith(
      ORDER_SERVICE.orders,
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": idempotencyKey,
        }),
      })
    );
    expect(result).toEqual(fakeOrder);
  });

  it("generateUUID는 올바른 UUID 형식의 문자열을 생성한다", () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });
});

