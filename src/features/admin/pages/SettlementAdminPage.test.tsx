import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SettlementAdminPage } from "./SettlementAdminPage";
import type { AdminSettlementEntry } from "../../settlements/types";

const refetch = vi.fn();
const runPayout = { mutate: vi.fn((_: string, options: { onSuccess: () => void }) => options.onSuccess()), isPending: false };
const runPgReconciliation = { mutate: vi.fn((_: string, options: { onSuccess: () => void }) => options.onSuccess()), isPending: false };
const settlementEntries: AdminSettlementEntry[] = [
  {
    type: "PAYOUT",
    projectId: 1,
    projectName: "완료 지급",
    payout: {
      settlementId: 1,
      creatorId: 1,
      settlementBaseAmount: 10000,
      creatorPayoutAmount: 9000,
      status: "COMPLETED",
      confirmedAt: "2026-08-01T00:00:00Z",
      scheduledDate: "2026-08-05",
    },
  },
  {
    type: "PAYOUT",
    projectId: 2,
    projectName: "처리 중 지급",
    payout: {
      settlementId: 2,
      creatorId: 2,
      settlementBaseAmount: 20000,
      creatorPayoutAmount: 18000,
      status: "PROCESSING",
      confirmedAt: "2026-08-01T00:00:00Z",
      scheduledDate: "2026-08-05",
    },
  },
  {
    type: "PAYOUT",
    projectId: 3,
    projectName: "예정 지급",
    payout: {
      settlementId: 3,
      creatorId: 3,
      settlementBaseAmount: 30000,
      creatorPayoutAmount: 27000,
      status: "SCHEDULED",
      confirmedAt: "2026-08-01T00:00:00Z",
      scheduledDate: "2026-08-05",
    },
  },
  {
    type: "REGISTRATION_PENDING",
    projectId: 4,
    projectName: "셀러 등록 대기",
    registrationPending: {
      settlementId: 4,
      creatorId: 4,
      settlementBaseAmount: 40000,
      creatorPayoutAmount: 36000,
      confirmedAt: "2026-08-01T00:00:00Z",
    },
  },
  {
    type: "REFUND",
    projectId: 5,
    projectName: "요청 환불",
    refundRequestId: "refund-1",
    refund: {
      reason: "PROJECT_FAILED",
      requestedAt: "2026-08-01T00:00:00Z",
      refundStatus: "REQUESTED",
      paymentResultAt: null,
      paymentCount: 2,
    },
  },
  {
    type: "REFUND",
    projectId: 6,
    projectName: "처리 중 환불",
    refundRequestId: "refund-2",
    refund: {
      reason: "PROJECT_CANCELLED",
      requestedAt: "2026-08-01T00:00:00Z",
      refundStatus: "PROCESSING",
      paymentResultAt: null,
      paymentCount: 1,
    },
  },
  {
    type: "REFUND",
    projectId: 7,
    projectName: "조치 필요 환불",
    refundRequestId: "refund-3",
    refund: {
      reason: "PROJECT_CANCELLED",
      requestedAt: "2026-08-01T00:00:00Z",
      refundStatus: "ACTION_REQUIRED",
      paymentResultAt: null,
      paymentCount: 3,
    },
  },
];

vi.mock("../../settlements/hooks", () => ({
  useAllSettlements: () => ({ data: settlementEntries, isPending: false, isError: false, refetch }),
  useCreatorProfile: () => ({ data: null, isPending: false, isError: false, error: null }),
  useRefundDetail: () => ({ data: null, isPending: false, isError: false }),
  useSettlementDetail: () => ({ data: null, isPending: false, isError: false }),
  useRunProjectPayout: () => runPayout,
  useRunPgReconciliation: () => runPgReconciliation,
  useRegisterCreatorPayoutProfile: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks", () => ({
  useTriggerCloseExpired: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../shared/auth/authStore", () => ({
  useAuthStore: (selector: (state: { user: { id: number; role: "ADMIN" } }) => unknown) =>
    selector({ user: { id: 1, role: "ADMIN" } }),
}));

describe("SettlementAdminPage", () => {
  it("혼합 지급·환불 목록에서 8개 KPI를 계산한다", () => {
    render(<MemoryRouter><SettlementAdminPage /></MemoryRouter>);

    expect(screen.getByText("전체 내역").parentElement).toHaveTextContent("7건");
    expect(screen.getByText("전체 내역").parentElement).toHaveTextContent("지급 4건 · 환불 3건");
    expect(screen.getByText("총 모금 기준액").parentElement).toHaveTextContent("100,000원");
    expect(screen.getByText("총 지급 완료액").parentElement).toHaveTextContent("9,000원");
    expect(screen.getAllByText("지급 완료")[0].parentElement).toHaveTextContent("1건");
    expect(screen.getByText("지급 진행 / 대기").parentElement).toHaveTextContent("3건");
    expect(screen.getByText("환불 현황").parentElement).toHaveTextContent("3건");
    expect(screen.getByText("환불 현황").parentElement).toHaveTextContent("대상 결제 6건");
    expect(screen.getByText("환불 처리 중").parentElement).toHaveTextContent("2건");
    expect(screen.getByText("조치 필요").parentElement).toHaveTextContent("1건");
  });

  it("수동 실행 성공 뒤 목록만 재조회하고 성공 실행 상세는 표시하지 않는다", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SettlementAdminPage /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: /정산 지급 실행/ }));
    await user.click(screen.getByRole("button", { name: /PG 대사 실행/ }));

    expect(refetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/배치가 성공적으로 실행되었습니다/)).not.toBeInTheDocument();
  });
});
