import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SettlementDashboardPage } from "./SettlementDashboardPage";
import { SettlementDetailPage } from "./SettlementDetailPage";

const user = { id: 1, role: "CREATOR" as const };

vi.mock("../hooks", () => ({
  useMySettlements: () => ({
    data: [{
      settlementId: 7,
      projectId: 42,
      settlementBaseAmount: 100000,
      creatorPayoutAmount: 90000,
      status: "COMPLETED",
      confirmedAt: "2026-08-01T00:00:00+09:00",
      scheduledDate: "2026-08-10",
      completedAt: "2026-08-10T00:00:00+09:00",
    }],
    isPending: false,
    isError: false,
  }),
  useCreatorSettlementDetail: () => ({
    data: {
      settlementId: 7,
      project: { projectId: 42 },
      confirmedAt: "2026-08-01T00:00:00+09:00",
      breakdown: {
        settlementBaseAmount: 100000,
        paymentAndSettlementAgencyFee: { rate: 0.04, amount: 4000, vatRate: 0.1, vatAmount: 400 },
        platformFee: { rate: 0.04, amount: 4000, vatRate: 0.1, vatAmount: 400 },
        otherDeductionAmount: 0,
        creatorPayoutAmount: 91200,
      },
      payout: { status: "COMPLETED", scheduledDate: "2026-08-10", completedAt: "2026-08-10T00:00:00+09:00" },
    },
    isPending: false,
    isError: false,
  }),
}));

vi.mock("../../../shared/auth/authStore", () => ({
  useAuthStore: (selector: (state: { user: typeof user }) => unknown) => selector({ user }),
}));

describe("creator settlement pages", () => {
  it("목록은 상태와 확정일·완료일·상세 이동을 표시한다", () => {
    render(<MemoryRouter><SettlementDashboardPage /></MemoryRouter>);

    expect(screen.getByText("지급 완료")).toBeInTheDocument();
    expect(screen.getByText(/확정일:/)).toBeInTheDocument();
    expect(screen.getByText(/완료일:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상세 보기 →" })).toHaveAttribute("href", "/settlements/7");
  });

  it("상세는 서버의 금액과 지급 일정을 표시하고 계좌 정보를 표시하지 않는다", () => {
    render(<MemoryRouter initialEntries={["/settlements/7"]}><SettlementDetailPage /></MemoryRouter>);

    expect(screen.getByText("프로젝트 #42 정산")).toBeInTheDocument();
    expect(screen.getByText("91,200원")).toBeInTheDocument();
    expect(screen.getAllByText("2026년 8월 10일")).toHaveLength(2);
    expect(screen.queryByText(/계좌|은행|셀러/)).not.toBeInTheDocument();
  });
});
