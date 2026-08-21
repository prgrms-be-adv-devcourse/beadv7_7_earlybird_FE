import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { SETTLEMENT_SERVICE, USER_SERVICE } from "../../shared/api/endpoints";
import {
  fetchAllSettlements,
  fetchCreatorProfile,
  fetchCreatorSettlementDetail,
  fetchRefundDetail,
  fetchMySettlements,
  fetchSettlementDetail,
  runPgReconciliation,
  runProjectPayout,
  registerCreatorPayoutProfile,
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

  it("fetchAllSettlements는 서버 정렬 query로 관리자 통합 목록을 GET한다", async () => {
    const entry = {
      type: "REFUND",
      projectId: 5,
      projectName: "프로젝트 5",
      refundRequestId: "refund-5",
      refund: {
        reason: "PROJECT_FAILED",
        requestedAt: "2026-08-01T00:00:00+09:00",
        refundStatus: "PROCESSING",
        paymentResultAt: null,
        paymentCount: 1,
      },
    };
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [entry], error: null },
    });

    const result = await fetchAllSettlements("NAME");

    expect(apiClient.get).toHaveBeenCalledWith(SETTLEMENT_SERVICE.allSettlements, {
      params: { sort: "NAME" },
    });
    expect(result).toEqual([entry]);
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

    expect(apiClient.get).toHaveBeenCalledWith(SETTLEMENT_SERVICE.settlementDetail(1));
    expect(result).toEqual(detail);
  });

  it("fetchCreatorSettlementDetail은 창작자 상세 경로를 GET한다", async () => {
    const detail = {
      settlementId: 1,
      project: { projectId: 5 },
      confirmedAt: "2026-08-01T00:00:00+09:00",
      breakdown: { settlementBaseAmount: 100000, creatorPayoutAmount: 90000 },
      payout: { status: "SCHEDULED", scheduledDate: "2026-08-10", completedAt: null },
    };
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: detail, error: null },
    });

    const result = await fetchCreatorSettlementDetail(1);

    expect(apiClient.get).toHaveBeenCalledWith(SETTLEMENT_SERVICE.creatorSettlementDetail(1));
    expect(result).toEqual(detail);
  });

  it("fetchCreatorProfile은 창작자 단건 조회 API를 GET한다", async () => {
    const creator = {
      userId: 10,
      name: "창작자",
      phoneNumber: "010-0000-0000",
      bankName: "신한은행",
      bankCode: "88",
      accountHolder: "창작자",
    };
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: creator, error: null },
    });

    const result = await fetchCreatorProfile(10);

    expect(apiClient.get).toHaveBeenCalledWith(USER_SERVICE.creator(10));
    expect(result).toEqual(creator);
  });

  it("fetchRefundDetail은 refundRequestId로 환불 상세를 GET한다", async () => {
    const detail = {
      refundRequestId: "refund-5",
      projectId: 5,
      projectName: "프로젝트 5",
      reason: "PROJECT_FAILED",
      refundStatus: "COMPLETED",
      requestedAt: "2026-08-01T00:00:00+09:00",
      paymentResultAt: "2026-08-01T00:01:00+09:00",
      payments: [{ orderId: 1, pgOrderId: "pg-1", actionRequired: false }],
    };
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: detail, error: null },
    });

    const result = await fetchRefundDetail("refund-5");

    expect(apiClient.get).toHaveBeenCalledWith(SETTLEMENT_SERVICE.refundDetail("refund-5"));
    expect(result).toEqual(detail);
  });

  it("registerCreatorPayoutProfile은 creatorId로 셀러 등록을 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: null, error: null } });

    await registerCreatorPayoutProfile(10);

    expect(apiClient.post).toHaveBeenCalledWith(SETTLEMENT_SERVICE.registerCreatorPayoutProfile(10));
  });

  it("runProjectPayout은 SETTLEMENT_SERVICE.runPayout에 payoutMonth를 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: { status: "OK" }, error: null },
    });

    const result = await runProjectPayout("2026-08");

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/v1/settlements/project-payouts/runs",
      { payoutMonth: "2026-08" }
    );
    expect(result).toEqual({ status: "OK" });
  });

  it("runPgReconciliation은 SETTLEMENT_SERVICE.runPgReconciliation에 settlementMonth를 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: { status: "OK" }, error: null },
    });

    const result = await runPgReconciliation("2026-08");

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/v1/settlements/pg-reconciliations/runs",
      { settlementMonth: "2026-08" }
    );
    expect(result).toEqual({ status: "OK" });
  });
});
