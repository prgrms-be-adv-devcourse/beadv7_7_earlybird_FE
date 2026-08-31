import type { CreatorSettlementStatus } from "./types";

export function getSettlementStatusInfo(status: CreatorSettlementStatus) {
  switch (status) {
    case "SCHEDULED":
      return { label: "지급 예정", description: "지급 예정일에 지급됩니다.", tone: "peach" as const };
    case "PROCESSING":
      return { label: "지급 처리중", description: "지급을 처리하고 있습니다.", tone: "lavender" as const };
    case "RETRY_WAITING":
      return { label: "재시도 대기", description: "지급을 다시 시도할 예정입니다.", tone: "lavender" as const };
    case "COMPLETED":
      return { label: "지급 완료", description: "지급이 완료되었습니다.", tone: "mint" as const };
    case "ACTION_REQUIRED":
      return { label: "확인 필요", description: "지급 처리를 위해 확인이 필요합니다.", tone: "peach" as const };
    case "REGISTRATION_PENDING":
      return { label: "개인 셀러 등록 대기", description: "개인 셀러 등록이 완료되면 지급이 진행됩니다.", tone: "peach" as const };
    case "PAYOUT_PENDING":
      return { label: "지급 대기", description: "다음 지급 실행을 기다리고 있습니다.", tone: "lavender" as const };
    case "APPROVAL_REQUIRED":
      return { label: "승인 필요", description: "셀러 승인 상태를 확인해 주세요.", tone: "peach" as const };
    case "KYC_REQUIRED":
      return { label: "KYC 필요", description: "본인 확인을 완료해 주세요.", tone: "peach" as const };
    case "PAYOUT_UNAVAILABLE":
      return { label: "지급 불가", description: "지급 프로필 상태를 확인해 주세요.", tone: "peach" as const };
    case "RECONCILIATION_REVIEW_REQUIRED":
      return { label: "대사 검토 필요", description: "결제 대사 확인 후 정산이 진행됩니다.", tone: "peach" as const };
    case "SETTLEMENT_PENDING":
      return { label: "정산 대기", description: "PG 대사 또는 정산 실행을 기다리고 있습니다.", tone: "lavender" as const };
    case "REFUND_PENDING":
      return { label: "환불 대기", description: "환불 요청이 생성될 예정입니다.", tone: "lavender" as const };
    case "REFUND_REQUESTED":
      return { label: "환불 요청", description: "환불 요청을 전달했습니다.", tone: "lavender" as const };
    case "REFUND_PROCESSING":
      return { label: "환불 처리중", description: "환불 결과를 기다리고 있습니다.", tone: "lavender" as const };
    case "REFUND_COMPLETED":
      return { label: "환불 완료", description: "환불 처리가 완료되었습니다.", tone: "mint" as const };
    case "REFUND_ACTION_REQUIRED":
      return { label: "환불 확인 필요", description: "환불 처리 결과를 확인해 주세요.", tone: "peach" as const };
  }
}

export function formatSettlementDate(value: string | null | undefined) {
  if (!value) return "-";
  const datePart = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split("-");
    return `${year}년 ${Number(month)}월 ${Number(day)}일`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}
