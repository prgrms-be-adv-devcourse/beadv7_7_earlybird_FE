import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { SETTLEMENT_SERVICE } from "../../shared/api/endpoints";
import {
  fetchAllSettlements,
  fetchMySettlements,
  fetchSettlementDetail,
  runPgReconciliation,
  runProjectPayout,
} from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
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

  it("fetchAllSettlements는 SETTLEMENT_SERVICE.allSettlements를 ADMIN 헤더와 함께 GET한다", async () => {
    const settlement = {
      settlementId: 1,
      projectId: 5,
      settlementBaseAmount: 100000,
      creatorPayoutAmount: 90000,
      status: "SCHEDULED",
      confirmedAt: "2026-08-01T00:00:00Z",
      scheduledDate: "2026-08-10",
      completedAt: null,
    };
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [settlement], error: null },
    });

    const result = await fetchAllSettlements();

    expect(apiClient.get).toHaveBeenCalledWith(SETTLEMENT_SERVICE.allSettlements, {
      headers: { "X-User-Role": "ADMIN" },
    });
    expect(result).toEqual([settlement]);
  });

  it("fetchSettlementDetail은 settlementId에 해당하는 상세 내역을 GET한다", async () => {
    const detail = {
      settlementId: 1,
      creatorId: 10,
      project: { projectId: 5 },
      confirmedAt: "2026-08-01T00:00:00Z",
    };
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: detail, error: null },
    });

    const result = await fetchSettlementDetail(1);

    expect(apiClient.get).toHaveBeenCalledWith(SETTLEMENT_SERVICE.settlementDetail(1), {
      headers: { "X-User-Role": "ADMIN" },
    });
    expect(result).toEqual(detail);
  });

  it("runProjectPayout은 SETTLEMENT_SERVICE.runPayout에 payoutMonth를 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: { status: "OK" }, error: null },
    });

    const result = await runProjectPayout("2026-08");

    expect(apiClient.post).toHaveBeenCalledWith(
      SETTLEMENT_SERVICE.runPayout,
      { payoutMonth: "2026-08" },
      { headers: { "X-User-Role": "ADMIN" } }
    );
    expect(result).toEqual({ status: "OK" });
  });

  it("runPgReconciliation은 SETTLEMENT_SERVICE.runPgReconciliation에 settlementMonth를 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: { status: "OK" }, error: null },
    });

    const result = await runPgReconciliation("2026-08");

    expect(apiClient.post).toHaveBeenCalledWith(
      SETTLEMENT_SERVICE.runPgReconciliation,
      { settlementMonth: "2026-08" },
      { headers: { "X-User-Role": "ADMIN" } }
    );
    expect(result).toEqual({ status: "OK" });
  });
});

