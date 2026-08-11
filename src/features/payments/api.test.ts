import {describe, expect, it, vi} from "vitest";
import {apiClient} from "../../shared/api/client";
import {PAYMENT_SERVICE} from "../../shared/api/endpoints";
import {confirmPayment, getPaymentByOrderId} from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe("payments api", () => {
  it("getPaymentByOrderId는 PAYMENT_SERVICE.paymentByOrder로 준비 결제를 조회한다", async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: { paymentId: 1, orderId: 10, pgOrderId: "pg_order_10_uuid", amount: 15000, status: "READY" }, error: null },
    });

    const result = await getPaymentByOrderId(10);

    expect(apiClient.get).toHaveBeenCalledWith(PAYMENT_SERVICE.paymentByOrder(10));
    expect(result.pgOrderId).toBe("pg_order_10_uuid");
  });

  it("confirmPayment는 PAYMENT_SERVICE.confirm으로 paymentKey/pgOrderId/amount를 POST한다", async () => {
    const request = { paymentKey: "pk_test_1", pgOrderId: "pg_order_5", amount: 10000 };
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: { paymentId: 1, orderId: 5, pgOrderId: "pg_order_5", amount: 10000, status: "PAID" }, error: null },
    });

    const result = await confirmPayment(request);

    expect(apiClient.post).toHaveBeenCalledWith(PAYMENT_SERVICE.confirm, request);
    expect(result.paymentId).toBe(1);
    expect(result.orderId).toBe(5);
    expect(result.status).toBe("PAID");
  });
});
