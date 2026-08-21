import { useState, useMemo } from "react";
import axios from "axios";
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
  useCreatorProfile,
  useSettlementDetail,
  useRunProjectPayout,
  useRunPgReconciliation,
} from "../../settlements/hooks";
import { useTriggerCloseExpired } from "../hooks";
import { useAuthStore } from "../../../shared/auth/authStore";
import type { AdminSettlementSort, PayoutObligationStatus } from "../../settlements/types";

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

function CreatorProfileDialog({
  creatorId,
  open,
  onOpenChange,
}: {
  creatorId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: creator, isPending, isError, error } = useCreatorProfile(open ? creatorId : null);
  const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>창작자 정보</DialogTitle>
        <DialogDescription>현재 User 서비스에 등록된 창작자 정보입니다.</DialogDescription>
        {isPending && <RowSkeleton />}
        {isError && (
          <ErrorState
            error={{
              message: isForbidden ? "창작자 정보를 조회할 권한이 없습니다." : "창작자 정보를 불러오지 못했습니다.",
              errors: null,
            }}
          />
        )}
        {creator && (
          <dl className="grid grid-cols-2 gap-3 rounded border border-ink/15 bg-paper/60 p-3 text-sm">
            <dt className="text-mist">이름</dt><dd className="font-semibold">{creator.name}</dd>
            <dt className="text-mist">전화번호</dt><dd>{creator.phoneNumber}</dd>
            <dt className="text-mist">은행</dt><dd>{creator.bankName} ({creator.bankCode})</dd>
            <dt className="text-mist">예금주</dt><dd>{creator.accountHolder}</dd>
          </dl>
        )}
        <div className="flex justify-end">
          <DialogClose asChild><Button variant="secondary">닫기</Button></DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
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
  const [sort, setSort] = useState<AdminSettlementSort>("PUBLISHED_AT");
  const { data: settlements, isPending, isError, refetch } = useAllSettlements(sort);
  const triggerCloseExpired = useTriggerCloseExpired();
  const runPayout = useRunProjectPayout();
  const runPgReconciliation = useRunPgReconciliation();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [searchProjectId, setSearchProjectId] = useState<string>("");

  const [selectedSettlementId, setSelectedSettlementId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null);
  const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);

  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Summary statistics
  const summary = useMemo(() => {
    const list = settlements ?? [];
    const payoutEntries = list.filter((entry) => entry.type === "PAYOUT");
    const registrationPendingEntries = list.filter((entry) => entry.type === "REGISTRATION_PENDING");
    const totalBase = [...payoutEntries, ...registrationPendingEntries].reduce(
      (sum, entry) => sum + (entry.type === "PAYOUT" ? entry.payout.settlementBaseAmount : entry.registrationPending.settlementBaseAmount),
      0,
    );
    const totalPayout = payoutEntries.reduce((sum, entry) => sum + entry.payout.creatorPayoutAmount, 0);
    const completedCount = payoutEntries.filter((entry) => entry.payout.status === "COMPLETED").length;
    const processingCount = payoutEntries.filter((entry) => entry.payout.status === "PROCESSING").length;
    const pendingCount = payoutEntries.filter(
      (entry) => entry.payout.status === "SCHEDULED" || entry.payout.status === "RETRY_WAITING",
    ).length + registrationPendingEntries.length;

    return { totalCount: list.length, totalBase, totalPayout, completedCount, processingCount, pendingCount };
  }, [settlements]);

  // The server owns ordering; the search only narrows its returned entries.
  const filteredSettlements = useMemo(() => {
    const query = searchProjectId.trim();
    return query ? (settlements ?? []).filter((entry) => String(entry.projectId).includes(query)) : settlements ?? [];
  }, [settlements, searchProjectId]);

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

      {/* Search & server ordering */}
      <div className="flex flex-col gap-3 rounded-lg border-2 border-ink bg-surface p-3 shadow-stamp-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="프로젝트 ID 검색"
            value={searchProjectId}
            onChange={(e) => setSearchProjectId(e.target.value)}
            className="w-40 rounded border border-ink/30 bg-surface px-2.5 py-1 text-xs text-ink outline-none focus:border-brand"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as AdminSettlementSort)}
            className="rounded border border-ink/30 bg-surface px-2 py-1 text-xs font-bold text-ink outline-none focus:border-brand"
          >
            <option value="PUBLISHED_AT">발행 시간순</option>
            <option value="PROCESSED_AT">처리 시간순</option>
            <option value="NAME">프로젝트명순</option>
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
                <th className="py-3 px-4">유형</th>
                <th className="py-3 px-4">대상 프로젝트</th>
                <th className="py-3 px-4 text-right">정산 기준액</th>
                <th className="py-3 px-4 text-right">창작자 실지급액</th>
                <th className="py-3 px-4">창작자</th>
                <th className="py-3 px-4">기준 시각</th>
                <th className="py-3 px-4 text-center">상태</th>
                <th className="py-3 px-4 text-center">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredSettlements.map((settlement) => {
                const payout = settlement.type === "PAYOUT" ? settlement.payout : null;
                const registrationPending = settlement.type === "REGISTRATION_PENDING" ? settlement.registrationPending : null;
                const refund = settlement.type === "REFUND" ? settlement.refund : null;
                const statusInfo = payout ? getPayoutStatusInfo(payout.status) : null;
                return (
                  <tr
                    key={settlement.type === "REFUND" ? settlement.refundRequestId : payout?.settlementId ?? registrationPending?.settlementId}
                    className="hover:bg-paper/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-ink">
                      {settlement.type === "PAYOUT" ? "지급" : settlement.type === "REFUND" ? "환불" : "등록 대기"}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/projects/${settlement.projectId}`}
                        target="_blank"
                        className="font-bold text-brand hover:underline"
                      >
                        {settlement.projectName} ↗
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-ink tabular-nums">
                      {payout?.settlementBaseAmount?.toLocaleString() ?? registrationPending?.settlementBaseAmount?.toLocaleString() ?? "-"}
                      {(payout || registrationPending) && "원"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-ink tabular-nums">
                      {payout?.creatorPayoutAmount?.toLocaleString() ?? registrationPending?.creatorPayoutAmount?.toLocaleString() ?? "-"}
                      {(payout || registrationPending) && "원"}
                    </td>
                    <td className="py-3 px-4">
                      {(payout || registrationPending) ? (
                        <button
                          type="button"
                          className="font-mono text-brand hover:underline"
                          onClick={() => {
                            setSelectedCreatorId(payout?.creatorId ?? registrationPending?.creatorId ?? null);
                            setCreatorDialogOpen(true);
                          }}
                        >
                          #{payout?.creatorId ?? registrationPending?.creatorId}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-mist text-[11px]">
                      {formatDate(payout?.confirmedAt ?? registrationPending?.confirmedAt ?? refund?.requestedAt)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-extrabold ${statusInfo?.bg ?? "bg-paper text-ink"}`}>
                        {statusInfo?.label ?? refund?.refundStatus ?? "등록 대기"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {payout ? (
                        <Button
                          variant="secondary"
                          className="py-0.5 px-2 text-[11px] font-bold"
                          onClick={() => {
                            setSelectedSettlementId(payout.settlementId);
                            setDetailOpen(true);
                          }}
                        >
                          명세서
                        </Button>
                      ) : (
                        "-"
                      )}
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
      <CreatorProfileDialog
        creatorId={selectedCreatorId}
        open={creatorDialogOpen}
        onOpenChange={setCreatorDialogOpen}
      />
    </div>
  );
}
