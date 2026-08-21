import { Link } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorState, RowSkeleton } from "../../../shared/ui";
import { useAuthStore } from "../../../shared/auth/authStore";
import { useMySettlements } from "../hooks";
import type { Settlement } from "../types";
import { formatSettlementDate, getSettlementStatusInfo } from "../presentation";

function SettlementRow({ settlement }: { settlement: Settlement }) {
  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <Link to={`/projects/${settlement.projectId}`} className="text-sm font-bold text-brand hover:underline">
            프로젝트 #{settlement.projectId}
          </Link>
          <span className="text-xs text-mist">확정일: {formatSettlementDate(settlement.confirmedAt)}</span>
          <span className="text-xs text-mist">
            {settlement.status === "COMPLETED" ? "완료일" : "지급 예정일"}: {formatSettlementDate(settlement.status === "COMPLETED" ? settlement.completedAt : settlement.scheduledDate)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <Badge tone={getSettlementStatusInfo(settlement.status).tone}>{getSettlementStatusInfo(settlement.status).label}</Badge>
          <span className="text-xs text-mist">{getSettlementStatusInfo(settlement.status).description}</span>
          <span className="tabular-nums text-sm font-bold text-ink">{settlement.creatorPayoutAmount.toLocaleString()}원</span>
          <Link to={`/settlements/${settlement.settlementId}`} className="text-xs font-bold text-brand hover:underline">상세 보기 →</Link>
        </div>
      </div>
    </Card>
  );
}

export function SettlementDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isCreator = user?.role === "CREATOR";
  const { data: settlements, isPending, isError } = useMySettlements();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">창작자 정산 대시보드</h1>
        {Array.from({ length: 5 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError && isCreator) {
    return <ErrorState error={{ message: "정산 내역을 불러오지 못했습니다.", errors: null }} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">창작자 정산 대시보드</h1>
          <p className="text-xs text-mist mt-0.5">내 프로젝트의 펀딩 모금액 정산 및 지급 현황입니다.</p>
        </div>

        {!settlements || settlements.length === 0 ? (
          <EmptyState message="정산 내역이 아직 없어요." />
        ) : (
          settlements.map((settlement) => (
            <SettlementRow key={settlement.settlementId} settlement={settlement} />
          ))
        )}
      </div>
    </div>
  );
}
