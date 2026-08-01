import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { SETTLEMENT_SERVICE } from "../../shared/api/endpoints";
import { fetchMySettlements } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("settlements api", () => {
  it("fetchMySettlements는 SETTLEMENT_SERVICE.mySettlements를 GET한다", async () => {
    const settlement = {
      settlementId: 1,
      projectId: 5,
      settlementBaseAmount: 100000,
      creatorPayoutAmount: 90000,
      status: "COMPLETED",
      confirmedAt: "2026-07-01T00:00:00Z",
      scheduledDate: "2026-07-10",
      completedAt: "2026-07-10T00:00:00Z",
    };
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [settlement], error: null },
    });

    const result = await fetchMySettlements();

    expect(apiClient.get).toHaveBeenCalledWith(SETTLEMENT_SERVICE.mySettlements);
    expect(result).toEqual([settlement]);
  });
});
