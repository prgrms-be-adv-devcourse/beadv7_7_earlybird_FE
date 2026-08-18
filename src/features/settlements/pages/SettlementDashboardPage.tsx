import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, ErrorState, RowSkeleton } from "../../../shared/ui";
import { useAuthStore } from "../../../shared/auth/authStore";
import { useMySettlements } from "../hooks";
import type { Settlement } from "../types";

function SettlementRow({ settlement }: { settlement: Settlement }) {
  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          to={`/projects/${settlement.projectId}`}
          className="text-sm font-bold text-brand hover:underline"
        >
          프로젝트 #{settlement.projectId}
        </Link>
        <span className="text-xs text-mist">
          예정일: {settlement.scheduledDate || "-"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone="lavender">{settlement.status}</Badge>
        <span className="tabular-nums text-sm font-bold text-ink">
          {settlement.creatorPayoutAmount.toLocaleString()}원
        </span>
      </div>
    </Card>
  );
}

export function SettlementDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
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
      {isAdmin && (
        <div className="flex items-center justify-between rounded-lg border-2 border-ink bg-mint/20 p-4 shadow-stamp-sm">
          <div>
            <span className="text-xs font-bold text-emerald-900 block mb-0.5">ADMIN MODE</span>
            <p className="text-sm font-extrabold text-ink">
              관리자 계정으로 접속 중입니다. 전체 프로젝트의 정산 내역 및 지급 배치를 관리하세요.
            </p>
          </div>
          <Link to="/admin/settlements">
            <Button variant="primary" className="text-xs font-bold">
              💰 관리자 정산 관리 바로가기
            </Button>
          </Link>
        </div>
      )}

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
