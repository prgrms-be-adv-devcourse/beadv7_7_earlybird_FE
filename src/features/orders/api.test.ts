import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { ORDER_SERVICE } from "../../shared/api/endpoints";
import { fetchOrders, fetchOrder, cancelOrder } from "./api";

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
});
