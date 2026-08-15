import { Badge, Card, EmptyState, ErrorState, RowSkeleton } from "../../../shared/ui";
import { useAuthStore } from "../../../shared/auth/authStore";
import { useAllSettlements, useMySettlements } from "../hooks";
import type { Settlement } from "../types";

function SettlementRow({ settlement }: { settlement: Settlement }) {
  return (
    <Card className="flex items-center justify-between">
      <span className="text-sm text-mist">프로젝트 #{settlement.projectId}</span>
      <Badge tone="lavender">{settlement.status}</Badge>
      <span className="tabular-nums text-sm font-semibold text-ink">
        {settlement.creatorPayoutAmount.toLocaleString()}원
      </span>
    </Card>
  );
}

export function SettlementDashboardPage() {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  const { data: settlements, isPending, isError } = useMySettlements();
  const { data: allSettlements, isPending: allPending } = useAllSettlements();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">정산 대시보드</h1>
        {Array.from({ length: 5 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState error={{ message: "정산 내역을 불러오지 못했습니다.", errors: null }} />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">정산 대시보드</h1>
        {settlements.length === 0 ? (
          <EmptyState message="정산 내역이 없어요." />
        ) : (
          settlements.map((settlement) => (
            <SettlementRow key={settlement.settlementId} settlement={settlement} />
          ))
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-ink">🛡️ 전체 정산 현황 (관리자)</h2>
          {allPending ? (
            <RowSkeleton />
          ) : !allSettlements || allSettlements.length === 0 ? (
            <EmptyState message="전체 정산 내역이 없어요." />
          ) : (
            allSettlements.map((settlement) => (
              <SettlementRow key={settlement.settlementId} settlement={settlement} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
