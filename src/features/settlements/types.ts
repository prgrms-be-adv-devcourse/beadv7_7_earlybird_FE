// settlement-service CreatorProjectSettlementQueryController(settlement-service/.../presentation/
// CreatorProjectSettlementQueryController.java)의 실제 응답 DTO
// (CreatorProjectSettlementListItemResponse, domain/PayoutObligationStatus.java)를 기준으로
// 검증/수정함. 브리프가 가정한 Settlement{id,projectId,amount,status:string}와는 다르다:
// - id 필드가 아니라 settlementId이다.
// - amount 하나가 아니라 정산 기준액(settlementBaseAmount)과 창작자에게 실제 지급되는 금액
//   (creatorPayoutAmount) 두 개로 나뉘어 내려온다.
// - status는 자유 문자열이 아니라 실제 6개 값의 enum(PayoutObligationStatus)이다.
// - 브리프가 언급하지 않은 날짜 필드가 세 개 더 있다: confirmedAt(OffsetDateTime),
//   scheduledDate(LocalDate), completedAt(OffsetDateTime, COMPLETED 상태가 되기 전까지는 null).
//   JSON으로는 전부 ISO 문자열로 내려오므로 string(및 completedAt만 string | null)으로 둔다.
export type PayoutObligationStatus =
  | "CREATOR_PAYOUT_PROFILE_WAITING"
  | "SCHEDULED"
  | "PROCESSING"
  | "RETRY_WAITING"
  | "COMPLETED"
  | "ACTION_REQUIRED";

/** GET /api/v1/settlements 목록 항목 (CreatorProjectSettlementListItemResponse / AdminProjectSettlementListItemResponse). */
export interface Settlement {
  settlementId: number;
  projectId: number;
  settlementBaseAmount: number;
  creatorPayoutAmount: number;
  status: PayoutObligationStatus;
  confirmedAt: string;
  scheduledDate: string;
  completedAt: string | null;
}

export interface FeeDetail {
  rate: number;
  amount: number;
  vatRate: number;
  vatAmount: number;
}

export interface SettlementBreakdown {
  settlementBaseAmount: number;
  paymentAndSettlementAgencyFee: FeeDetail;
  platformFee: FeeDetail;
  otherDeductionAmount: number;
  creatorPayoutAmount: number;
}

export interface PayoutDestination {
  tossSellerId?: string | null;
  bankCode?: string | null;
  maskedAccountNumber?: string | null;
}

export interface PayoutAttempt {
  attemptId: number;
  sequence: number;
  refPayoutId?: string | null;
  idempotencyKey?: string | null;
  tossPayoutId?: string | null;
  amount: number;
  status: string;
  errorCode?: string | null;
  requestedAt?: string | null;
  completedAt?: string | null;
}

export interface PayoutDetail {
  settlementId: number;
  status: PayoutObligationStatus;
  scheduledDate: string;
  completedAt: string | null;
  destination: PayoutDestination;
  attempts: PayoutAttempt[];
}

export interface AdminSettlementDetail {
  settlementId: number;
  creatorId: number;
  project: { projectId: number };
  confirmedAt: string;
  breakdown: SettlementBreakdown;
  payout: PayoutDetail;
}

