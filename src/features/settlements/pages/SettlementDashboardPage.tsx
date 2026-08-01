import { Badge, Card, EmptyState, ErrorState, Spinner } from "../../../shared/ui";
import { useMySettlements } from "../hooks";

export function SettlementDashboardPage() {
  const { data: settlements, isPending, isError } = useMySettlements();

  if (isPending) return <Spinner label="정산 내역 불러오는 중..." />;
  if (isError) return <ErrorState error={{ message: "정산 내역을 불러오지 못했습니다.", errors: null }} />;
  if (settlements.length === 0) return <EmptyState message="정산 내역이 없어요." />;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-jua text-2xl">정산 대시보드</h1>
      {settlements.map((settlement) => (
        <Card key={settlement.settlementId} className="flex items-center justify-between">
          <span>프로젝트 #{settlement.projectId}</span>
          <Badge tone="lavender">{settlement.status}</Badge>
          <span>{settlement.creatorPayoutAmount.toLocaleString()}원</span>
        </Card>
      ))}
    </div>
  );
}
