import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ErrorState,
  RowSkeleton,
} from "../../../shared/ui";
import {
  useAllSettlements,
  useSettlementDetail,
  useRunProjectPayout,
  useRunPgReconciliation,
} from "../../settlements/hooks";
import { useTriggerCloseExpired } from "../hooks";
import { useAuthStore } from "../../../shared/auth/authStore";
import type { PayoutObligationStatus } from "../../settlements/types";

function getPayoutStatusInfo(status: PayoutObligationStatus) {
  switch (status) {
    case "COMPLETED":
      return { label: "지급 완료", tone: "mint" as const, bg: "bg-mint/20 text-emerald-800" };
    case "PROCESSING":
      return { label: "지급 처리중", tone: "lavender" as const, bg: "bg-lavender/30 text-indigo-800" };
    case "SCHEDULED":
      return { label: "지급 예정", tone: "peach" as const, bg: "bg-peach/30 text-amber-900" };
    case "CREATOR_PAYOUT_PROFILE_WAITING":
      return { label: "정산 프로필 대기", tone: "peach" as const, bg: "bg-peach/20 text-amber-800" };
    case "RETRY_WAITING":
      return { label: "재시도 대기", tone: "lavender" as const, bg: "bg-orange-100 text-orange-800" };
    case "ACTION_REQUIRED":
      return { label: "조치 필요", tone: "peach" as const, bg: "bg-red-100 text-red-800" };
    default:
      return { label: status, tone: "lavender" as const, bg: "bg-paper text-ink" };
  }
}

function formatDate(isoString: string | null | undefined) {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return isoString;
  }
}

function SettlementDetailDialog({
  settlementId,
  open,
  onOpenChange,
}: {
  settlementId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: detail, isPending, isError } = useSettlementDetail(open ? settlementId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle className="flex items-center justify-between border-b border-ink/10 pb-3">
          <div className="flex items-center gap-2">
            <span>정산 상세 명세서</span>
            {settlementId && <span className="font-mono text-sm text-mist">#{settlementId}</span>}
          </div>
          {detail && (
            <Badge tone={getPayoutStatusInfo(detail.payout.status).tone}>
              {getPayoutStatusInfo(detail.payout.status).label}
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription className="sr-only">정산 세부 내역 및 수수료 명세</DialogDescription>

        {isPending && (
          <div className="flex flex-col gap-3 py-4">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        )}

        {isError && (
          <div className="py-4">
            <ErrorState error={{ message: "상세 내역을 불러오지 못했습니다.", errors: null }} />
          </div>
        )}

        {detail && (
          <div className="mt-4 flex flex-col gap-6 text-sm">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-3 rounded border border-ink/15 bg-paper/60 p-3.5">
              <div>
                <span className="text-xs text-mist block mb-0.5">대상 프로젝트</span>
                <Link
                  to={`/projects/${detail.project.projectId}`}
                  target="_blank"
                  className="font-bold text-brand hover:underline"
                >
                  프로젝트 #{detail.project.projectId} ↗
                </Link>
              </div>
              <div>
                <span className="text-xs text-mist block mb-0.5">창작자 ID</span>
                <span className="font-semibold text-ink">회원 #{detail.creatorId}</span>
              </div>
              <div>
                <span className="text-xs text-mist block mb-0.5">펀딩 확정일시</span>
                <span className="font-mono text-xs text-ink">{formatDate(detail.confirmedAt)}</span>
              </div>
              <div>
                <span className="text-xs text-mist block mb-0.5">지급 예정일</span>
                <span className="font-mono text-xs text-ink">{detail.payout.scheduledDate || "-"}</span>
              </div>
            </div>

            {/* 수수료 및 정산액 명세 */}
            <div>
              <h3 className="font-display font-bold text-ink mb-2">💰 정산 및 공제 명세</h3>
              <div className="divide-y divide-ink/10 rounded border border-ink/20 overflow-hidden bg-surface text-xs">
                <div className="flex justify-between p-2.5 bg-paper/80 font-bold text-ink">
                  <span>총 펀딩 모금 기준액 (Base Amount)</span>
                  <span className="tabular-nums font-mono text-sm">
                    {Number(detail.breakdown.settlementBaseAmount).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between p-2.5 pl-5 text-ink">
                  <div>
                    <span>PG 결제/정산 대행 수수료</span>
                    <span className="text-mist ml-1 font-mono">
                      (요율 {Number(detail.breakdown.paymentAndSettlementAgencyFee.rate) * 100}%)
                    </span>
                  </div>
                  <span className="tabular-nums font-mono text-red-600">
                    -{(
                      Number(detail.breakdown.paymentAndSettlementAgencyFee.amount) +
                      Number(detail.breakdown.paymentAndSettlementAgencyFee.vatAmount)
                    ).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between p-2.5 pl-5 text-ink">
                  <div>
                    <span>플랫폼 중개 수수료</span>
                    <span className="text-mist ml-1 font-mono">
                      (요율 {Number(detail.breakdown.platformFee.rate) * 100}%)
                    </span>
                  </div>
                  <span className="tabular-nums font-mono text-red-600">
                    -{(
                      Number(detail.breakdown.platformFee.amount) +
                      Number(detail.breakdown.platformFee.vatAmount)
                    ).toLocaleString()}원
                  </span>
                </div>
                {Number(detail.breakdown.otherDeductionAmount) > 0 && (
                  <div className="flex justify-between p-2.5 pl-5 text-ink">
                    <span>기타 공제액</span>
                    <span className="tabular-nums font-mono text-red-600">
                      -{Number(detail.breakdown.otherDeductionAmount).toLocaleString()}원
                    </span>
                  </div>
                )}
                <div className="flex justify-between p-3 bg-brand/10 font-extrabold text-brand text-sm">
                  <span>최종 창작자 실지급액 (Creator Payout)</span>
                  <span className="tabular-nums font-mono text-base">
                    {Number(detail.breakdown.creatorPayoutAmount).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* 지급 수령 계좌 정보 */}
            <div>
              <h3 className="font-display font-bold text-ink mb-2">🏦 수령처 및 지급 현황</h3>
              <div className="grid grid-cols-2 gap-3 rounded border border-ink/15 bg-paper/40 p-3 text-xs">
                <div>
                  <span className="text-mist block">수령 은행</span>
                  <span className="font-semibold text-ink">
                    {detail.payout.destination.bankCode || "미등록"}
                  </span>
                </div>
                <div>
                  <span className="text-mist block">계좌번호</span>
                  <span className="font-mono text-ink">
                    {detail.payout.destination.maskedAccountNumber || "미등록"}
                  </span>
                </div>
                <div>
                  <span className="text-mist block">Toss Seller ID</span>
                  <span className="font-mono text-ink">
                    {detail.payout.destination.tossSellerId || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-mist block">최종 완료일시</span>
                  <span className="font-mono text-ink">
                    {formatDate(detail.payout.completedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* 지급 시도 이력 (Attempts) */}
            {detail.payout.attempts && detail.payout.attempts.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-ink mb-2">📜 지급 시도 이력</h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {detail.payout.attempts.map((attempt) => (
                    <div
                      key={attempt.attemptId}
                      className="flex items-center justify-between rounded border border-ink/10 bg-surface p-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">#{attempt.sequence}차</span>
                        <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[11px] text-mist">
                          {attempt.status}
                        </span>
                        {attempt.errorCode && (
                          <span className="text-red-600 font-mono">[{attempt.errorCode}]</span>
                        )}
                      </div>
                      <div className="text-right font-mono text-mist text-[11px]">
                        <span>{formatDate(attempt.completedAt || attempt.requestedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <DialogClose asChild>
            <Button variant="secondary">닫기</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettlementAdminPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const { data: settlements, isPending, isError, refetch } = useAllSettlements();
  const triggerCloseExpired = useTriggerCloseExpired();
  const runPayout = useRunProjectPayout();
  const runPgReconciliation = useRunPgReconciliation();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchProjectId, setSearchProjectId] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "AMOUNT_DESC" | "AMOUNT_ASC">("NEWEST");

  const [selectedSettlementId, setSelectedSettlementId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Summary statistics
  const summary = useMemo(() => {
    const list = settlements ?? [];
    const totalCount = list.length;
    const totalBase = list.reduce((sum, s) => sum + (s.settlementBaseAmount || 0), 0);
    const totalPayout = list.reduce((sum, s) => sum + (s.creatorPayoutAmount || 0), 0);
    const completedCount = list.filter((s) => s.status === "COMPLETED").length;
    const processingCount = list.filter((s) => s.status === "PROCESSING").length;
    const pendingCount = list.filter(
      (s) => s.status === "SCHEDULED" || s.status === "CREATOR_PAYOUT_PROFILE_WAITING" || s.status === "RETRY_WAITING"
    ).length;

    return { totalCount, totalBase, totalPayout, completedCount, processingCount, pendingCount };
  }, [settlements]);

  // Filtered and sorted settlements
  const filteredSettlements = useMemo(() => {
    let result = [...(settlements ?? [])];

    if (statusFilter !== "ALL") {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (searchProjectId.trim()) {
      const pid = searchProjectId.trim();
      result = result.filter((s) => String(s.projectId).includes(pid) || String(s.settlementId).includes(pid));
    }

    if (sortOrder === "AMOUNT_DESC") {
      result.sort((a, b) => b.creatorPayoutAmount - a.creatorPayoutAmount);
    } else if (sortOrder === "AMOUNT_ASC") {
      result.sort((a, b) => a.creatorPayoutAmount - b.creatorPayoutAmount);
    } else {
      result.sort((a, b) => b.settlementId - a.settlementId);
    }

    return result;
  }, [settlements, statusFilter, searchProjectId, sortOrder]);

  if (!isAdmin) {
    return (
      <ErrorState
        error={{
          message: "관리자(ADMIN) 권한이 필요한 페이지입니다. 관리자 계정으로 로그인해 주세요.",
          errors: null,
        }}
      />
    );
  }

  const handleRunPayout = () => {
    setActionFeedback(null);
    runPayout.mutate(selectedMonth, {
      onSuccess: () => {
        setActionFeedback({
          type: "success",
          message: `${selectedMonth} 정산 지급 배치가 성공적으로 실행되었습니다.`,
        });
        refetch();
      },
      onError: (err: any) => {
        setActionFeedback({
          type: "error",
          message: err?.response?.data?.error?.message || "정산 지급 배치 실행 중 오류가 발생했습니다.",
        });
      },
    });
  };

  const handleRunPgReconcile = () => {
    setActionFeedback(null);
    runPgReconciliation.mutate(selectedMonth, {
      onSuccess: () => {
        setActionFeedback({
          type: "success",
          message: `${selectedMonth} PG 결제 대사 배치가 성공적으로 실행되었습니다.`,
        });
        refetch();
      },
      onError: (err: any) => {
        setActionFeedback({
          type: "error",
          message: err?.response?.data?.error?.message || "PG 대사 배치 실행 중 오류가 발생했습니다.",
        });
      },
    });
  };

  const handleTriggerCloseExpired = () => {
    setActionFeedback(null);
    triggerCloseExpired.mutate(undefined, {
      onSuccess: () => {
        setActionFeedback({
          type: "success",
          message: "만료 프로젝트 일괄 마감 처리가 완료되었습니다.",
        });
        refetch();
      },
      onError: (err: any) => {
        setActionFeedback({
          type: "error",
          message: err?.response?.data?.error?.message || "만료 프로젝트 마감 처리 중 오류가 발생했습니다.",
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b-2 border-ink pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-mint px-2 py-0.5 text-xs font-black text-ink">ADMIN</span>
            <h1 className="font-display text-2xl font-extrabold text-ink">💰 정산 내역 관리</h1>
          </div>
          <p className="mt-1 text-sm text-mist">
            전체 프로젝트의 정산 의무 및 지급 상태를 모니터링하고, 수동 정산 지급 배치를 실행합니다.
          </p>
        </div>

        {/* Quick batch execution control panel */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-ink bg-surface p-2.5 shadow-stamp-sm">
          <div className="flex items-center gap-1.5">
            <label htmlFor="payout-month" className="text-xs font-bold text-ink">
              정산 월:
            </label>
            <input
              id="payout-month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded border border-ink/30 bg-paper px-2 py-1 text-xs font-bold font-mono text-ink outline-none focus:border-brand"
            />
          </div>

          <Button
            variant="primary"
            className="py-1 px-3 text-xs font-bold whitespace-nowrap"
            onClick={handleRunPayout}
            disabled={runPayout.isPending}
          >
            {runPayout.isPending ? "지급 실행 중..." : "⚡ 정산 지급 실행"}
          </Button>

          <Button
            variant="secondary"
            className="py-1 px-2.5 text-xs font-bold whitespace-nowrap"
            onClick={handleRunPgReconcile}
            disabled={runPgReconciliation.isPending}
          >
            {runPgReconciliation.isPending ? "대사 중..." : "🔄 PG 대사 실행"}
          </Button>

          <Button
            variant="secondary"
            className="py-1 px-2.5 text-xs font-bold whitespace-nowrap text-brand border-brand/40 hover:border-brand"
            onClick={handleTriggerCloseExpired}
            disabled={triggerCloseExpired.isPending}
          >
            {triggerCloseExpired.isPending ? "마감 중..." : "⏱️ 만료 마감"}
          </Button>
        </div>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between rounded-sm border-2 p-3 text-sm font-bold ${
            actionFeedback.type === "success"
              ? "border-emerald-600 bg-emerald-50 text-emerald-900"
              : "border-red-600 bg-red-50 text-red-900"
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs underline hover:opacity-80"
          >
            닫기
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Card className="flex flex-col p-3.5 bg-paper/60">
          <span className="text-xs font-bold text-mist">총 정산 건수</span>
          <span className="mt-1 font-mono text-xl font-extrabold text-ink tabular-nums">
            {summary.totalCount}건
          </span>
        </Card>
        <Card className="flex flex-col p-3.5 bg-paper/60">
          <span className="text-xs font-bold text-mist">총 모금 기준액</span>
          <span className="mt-1 font-mono text-lg font-extrabold text-ink tabular-nums">
            {summary.totalBase.toLocaleString()}원
          </span>
        </Card>
        <Card className="flex flex-col p-3.5 bg-mint/20 border-mint/40">
          <span className="text-xs font-bold text-emerald-900">총 지급 완료액</span>
          <span className="mt-1 font-mono text-lg font-extrabold text-emerald-950 tabular-nums">
            {summary.totalPayout.toLocaleString()}원
          </span>
        </Card>
        <Card className="flex flex-col p-3.5 bg-paper/60">
          <span className="text-xs font-bold text-emerald-700">지급 완료</span>
          <span className="mt-1 font-mono text-xl font-extrabold text-emerald-800 tabular-nums">
            {summary.completedCount}건
          </span>
        </Card>
        <Card className="flex flex-col p-3.5 bg-lavender/20">
          <span className="text-xs font-bold text-indigo-800">처리 진행 중</span>
          <span className="mt-1 font-mono text-xl font-extrabold text-indigo-900 tabular-nums">
            {summary.processingCount}건
          </span>
        </Card>
        <Card className="flex flex-col p-3.5 bg-peach/20">
          <span className="text-xs font-bold text-amber-900">지급 대기 / 예정</span>
          <span className="mt-1 font-mono text-xl font-extrabold text-amber-950 tabular-nums">
            {summary.pendingCount}건
          </span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border-2 border-ink bg-surface p-3 shadow-stamp-sm md:flex-row md:items-center md:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "ALL", label: "전체" },
            { id: "COMPLETED", label: "지급 완료" },
            { id: "PROCESSING", label: "처리중" },
            { id: "SCHEDULED", label: "예정" },
            { id: "CREATOR_PAYOUT_PROFILE_WAITING", label: "프로필 대기" },
            { id: "RETRY_WAITING", label: "재시도 대기" },
            { id: "ACTION_REQUIRED", label: "조치 필요" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded px-2.5 py-1 text-xs font-extrabold transition-colors ${
                statusFilter === tab.id
                  ? "bg-ink text-surface"
                  : "bg-paper text-mist hover:bg-paper/80 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="프로젝트/정산 ID 검색"
            value={searchProjectId}
            onChange={(e) => setSearchProjectId(e.target.value)}
            className="w-40 rounded border border-ink/30 bg-surface px-2.5 py-1 text-xs text-ink outline-none focus:border-brand"
          />

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="rounded border border-ink/30 bg-surface px-2 py-1 text-xs font-bold text-ink outline-none focus:border-brand"
          >
            <option value="NEWEST">최신 정산순</option>
            <option value="AMOUNT_DESC">지급액 높은순</option>
            <option value="AMOUNT_ASC">지급액 낮은순</option>
          </select>
        </div>
      </div>

      {/* Main Content: Settlement Table */}
      {isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState error={{ message: "정산 내역 목록을 불러오지 못했습니다.", errors: null }} />
      )}

      {!isPending && !isError && filteredSettlements.length === 0 && (
        <EmptyState message="해당 조건의 정산 내역이 없습니다." />
      )}

      {!isPending && !isError && filteredSettlements.length > 0 && (
        <div className="overflow-x-auto rounded-lg border-2 border-ink bg-surface shadow-stamp">
          <table className="w-full text-left text-xs">
            <thead className="border-b-2 border-ink bg-paper font-extrabold text-ink">
              <tr>
                <th className="py-3 px-4">정산 ID</th>
                <th className="py-3 px-4">대상 프로젝트</th>
                <th className="py-3 px-4 text-right">정산 기준액</th>
                <th className="py-3 px-4 text-right">창작자 실지급액</th>
                <th className="py-3 px-4">확정일시</th>
                <th className="py-3 px-4">지급예정일</th>
                <th className="py-3 px-4 text-center">상태</th>
                <th className="py-3 px-4 text-center">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredSettlements.map((settlement) => {
                const statusInfo = getPayoutStatusInfo(settlement.status);
                return (
                  <tr key={settlement.settlementId} className="hover:bg-paper/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ink">
                      #{settlement.settlementId}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/projects/${settlement.projectId}`}
                        target="_blank"
                        className="font-bold text-brand hover:underline"
                      >
                        프로젝트 #{settlement.projectId} ↗
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-ink tabular-nums">
                      {settlement.settlementBaseAmount.toLocaleString()}원
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-ink tabular-nums">
                      {settlement.creatorPayoutAmount.toLocaleString()}원
                    </td>
                    <td className="py-3 px-4 font-mono text-mist text-[11px]">
                      {formatDate(settlement.confirmedAt)}
                    </td>
                    <td className="py-3 px-4 font-mono text-ink text-[11px]">
                      {settlement.scheduledDate || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-extrabold ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="secondary"
                        className="py-0.5 px-2 text-[11px] font-bold"
                        onClick={() => {
                          setSelectedSettlementId(settlement.settlementId);
                          setDetailOpen(true);
                        }}
                      >
                        명세서
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Settlement Detail Modal */}
      <SettlementDetailDialog
        settlementId={selectedSettlementId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
