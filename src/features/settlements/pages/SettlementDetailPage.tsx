import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../../shared/auth/authStore";
import { Badge, Card, ErrorState, RowSkeleton } from "../../../shared/ui";
import { useCreatorSettlementDetail } from "../hooks";
import { formatSettlementDate, getSettlementStatusInfo } from "../presentation";

const money = (value: number) => `${value.toLocaleString()}원`;

export function SettlementDetailPage() {
  const isCreator = useAuthStore((state) => state.user?.role === "CREATOR");
  const { settlementId } = useParams();
  const parsedSettlementId = settlementId && /^\d+$/.test(settlementId) ? Number(settlementId) : null;
  const { data: detail, isPending, isError } = useCreatorSettlementDetail(parsedSettlementId);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  if (!isCreator || isError || !detail) {
    return <ErrorState error={{ message: "정산 상세를 불러오지 못했습니다.", errors: null }} />;
  }

  const status = getSettlementStatusInfo(detail.payout.status);
  const { breakdown } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link to="/settlements" className="text-sm font-bold text-brand hover:underline">← 정산 목록</Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">프로젝트 #{detail.project.projectId} 정산</h1>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">지급 상태</h2>
        <p className="text-sm text-mist">{status.description}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-mist">정산 확정일</dt><dd className="font-bold text-ink">{formatSettlementDate(detail.confirmedAt)}</dd></div>
          <div><dt className="text-mist">지급 예정일</dt><dd className="font-bold text-ink">{formatSettlementDate(detail.payout.scheduledDate)}</dd></div>
          <div><dt className="text-mist">지급 완료일</dt><dd className="font-bold text-ink">{formatSettlementDate(detail.payout.completedAt)}</dd></div>
        </dl>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-ink">정산 금액</h2>
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-mist">정산 기준 금액</dt><dd className="font-bold text-ink">{money(breakdown.settlementBaseAmount)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-mist">결제·정산 대행 수수료 (부가세 포함)</dt><dd className="font-bold text-ink">{money(breakdown.paymentAndSettlementAgencyFee.amount + breakdown.paymentAndSettlementAgencyFee.vatAmount)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-mist">플랫폼 수수료 (부가세 포함)</dt><dd className="font-bold text-ink">{money(breakdown.platformFee.amount + breakdown.platformFee.vatAmount)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-mist">기타 공제액</dt><dd className="font-bold text-ink">{money(breakdown.otherDeductionAmount)}</dd></div>
          <div className="flex justify-between gap-4 border-t-2 border-ink/15 pt-3 text-base"><dt className="font-bold text-ink">창작자 지급액</dt><dd className="font-bold text-brand">{money(breakdown.creatorPayoutAmount)}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
