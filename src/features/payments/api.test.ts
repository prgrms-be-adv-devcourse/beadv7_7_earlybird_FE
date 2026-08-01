import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { PAYMENT_SERVICE } from "../../shared/api/endpoints";
import { confirmPayment } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { post: vi.fn() },
}));

describe("payments api", () => {
  it("confirmPayment는 PAYMENT_SERVICE.confirm으로 paymentKey/pgOrderId/amount를 POST한다", async () => {
    const request = { paymentKey: "pk_test_1", pgOrderId: "pg_order_5", amount: 10000 };
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: { paymentId: 1, orderId: 5, amount: 10000, status: "PAID" }, error: null },
    });

    const result = await confirmPayment(request);

    expect(apiClient.post).toHaveBeenCalledWith(PAYMENT_SERVICE.confirm, request);
    expect(result.paymentId).toBe(1);
    expect(result.orderId).toBe(5);
    expect(result.status).toBe("PAID");
  });
});
