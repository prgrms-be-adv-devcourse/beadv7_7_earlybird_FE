import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SettlementAdminPage } from "./SettlementAdminPage";

const refetch = vi.fn();
const runPayout = { mutate: vi.fn((_: string, options: { onSuccess: () => void }) => options.onSuccess()), isPending: false };
const runPgReconciliation = { mutate: vi.fn((_: string, options: { onSuccess: () => void }) => options.onSuccess()), isPending: false };

vi.mock("../../settlements/hooks", () => ({
  useAllSettlements: () => ({ data: [], isPending: false, isError: false, refetch }),
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
  it("수동 실행 성공 뒤 목록만 재조회하고 성공 실행 상세는 표시하지 않는다", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SettlementAdminPage /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: /정산 지급 실행/ }));
    await user.click(screen.getByRole("button", { name: /PG 대사 실행/ }));

    expect(refetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/배치가 성공적으로 실행되었습니다/)).not.toBeInTheDocument();
  });
});
