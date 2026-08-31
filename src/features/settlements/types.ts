// settlement-service CreatorProjectSettlementQueryController(settlement-service/.../presentation/
// CreatorProjectSettlementQueryController.java)의 실제 응답 DTO
// (CreatorProjectSettlementListItemResponse, domain/PayoutObligationStatus.java)를 기준으로
// 검증/수정함. 브리프가 가정한 Settlement{id,projectId,amount,status:string}와는 다르다:
// - id 필드가 아니라 settlementId이다.
// - amount 하나가 아니라 정산 기준액(settlementBaseAmount)과 창작자에게 실제 지급되는 금액
//   (creatorPayoutAmount) 두 개로 나뉘어 내려온다.
// - status는 지급 의무의 5개 상태와, 지급 의무가 아직 없는 등록 대기 상태를 구분한다.
// - 브리프가 언급하지 않은 날짜 필드가 세 개 더 있다: confirmedAt(OffsetDateTime),
//   scheduledDate(LocalDate), completedAt(OffsetDateTime, COMPLETED 상태가 되기 전까지는 null).
//   JSON으로는 ISO 문자열로 내려오며, 등록 대기 중 scheduledDate와 completedAt은 null이다.
export type PayoutObligationStatus =
  | "SCHEDULED"
  | "PROCESSING"
  | "RETRY_WAITING"
  | "COMPLETED"
  | "ACTION_REQUIRED";

export type CreatorSettlementStatus =
  | PayoutObligationStatus
  | "REGISTRATION_PENDING"
  | "PAYOUT_PENDING"
  | "APPROVAL_REQUIRED"
  | "KYC_REQUIRED"
  | "PAYOUT_UNAVAILABLE"
  | "RECONCILIATION_REVIEW_REQUIRED"
  | "SETTLEMENT_PENDING"
  | "REFUND_PENDING"
  | "REFUND_REQUESTED"
  | "REFUND_PROCESSING"
  | "REFUND_COMPLETED"
  | "REFUND_ACTION_REQUIRED";

/** GET /api/v1/settlements 목록 항목 (CreatorProjectSettlementListItemResponse / AdminProjectSettlementListItemResponse). */
export interface Settlement {
  settlementId: number | null;
  projectId: number;
  settlementBaseAmount: number | null;
  creatorPayoutAmount: number | null;
  status: CreatorSettlementStatus;
  confirmedAt: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
}

export type AdminSettlementSort = "NAME" | "PUBLISHED_AT" | "PROCESSED_AT";

export type RefundStatus = "REQUESTED" | "PROCESSING" | "COMPLETED" | "ACTION_REQUIRED";

export interface AdminCreatorProfile {
  userId: number;
  name: string;
  phoneNumber: string;
  bankName: string;
  bankCode: string;
  accountHolder: string;
}

export interface AdminProjectRefundDetail {
  refundRequestId: string;
  projectId: number;
  projectName: string;
  reason: "PROJECT_FAILED" | "PROJECT_CANCELLED";
  refundStatus: RefundStatus;
  requestedAt: string;
  paymentResultAt: string | null;
  payments: { orderId: number; pgOrderId: string; actionRequired: boolean }[];
}

export interface AdminProjectReconciliationReviewDetail {
  projectId: number;
  projectName: string;
  payments: { orderId: number; pgOrderId: string; reconciliationStatus: "REVIEW_REQUIRED" }[];
}

/** GET /api/v1/settlements/all 관리자 통합 목록 항목. */
export type AdminSettlementEntry =
  | {
      type: "PAYOUT";
      projectId: number;
      projectName: string;
      payout: {
        settlementId: number;
        creatorId: number;
        settlementBaseAmount: number;
        creatorPayoutAmount: number;
        status: Exclude<PayoutObligationStatus, "CREATOR_PAYOUT_PROFILE_WAITING">;
        confirmedAt: string;
        scheduledDate: string;
      };
    }
  | {
      type: "REFUND";
      projectId: number;
      projectName: string;
      refundRequestId: string;
      refund: {
        reason: "PROJECT_FAILED" | "PROJECT_CANCELLED";
        requestedAt: string;
        refundStatus: RefundStatus;
        paymentResultAt: string | null;
        paymentCount: number;
      };
    }
  | {
      type: "REGISTRATION_PENDING";
      projectId: number;
      projectName: string;
      registrationPending: {
        settlementId: number;
        creatorId: number;
        settlementBaseAmount: number;
        creatorPayoutAmount: number;
        confirmedAt: string;
      };
    }
  | {
      type: "PAYOUT_PENDING" | "APPROVAL_REQUIRED" | "KYC_REQUIRED" | "PAYOUT_UNAVAILABLE";
      projectId: number;
      projectName: string;
      pendingPayout: {
        settlementId: number;
        creatorId: number;
        settlementBaseAmount: number;
        creatorPayoutAmount: number;
        confirmedAt: string;
      };
    }
  | {
      type: "RECONCILIATION_REVIEW_REQUIRED" | "SETTLEMENT_PENDING" | "REFUND_PENDING";
      projectId: number;
      projectName: string;
    };

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

export interface CreatorProjectSettlementDetail {
  settlementId: number;
  project: { projectId: number };
  confirmedAt: string;
  breakdown: SettlementBreakdown;
  payout: {
    status: CreatorSettlementStatus;
    scheduledDate: string | null;
    completedAt: string | null;
  };
}

export interface PayoutDestination {
  tossSellerId?: string | null;
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
