export type CreatorApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreatorApplication {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  creatorName: string;
  category: string;
  introduction: string;
  portfolioUrl?: string;
  status: CreatorApplicationStatus;
  rejectReason?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export interface SubmitCreatorApplicationPayload {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  creatorName: string;
  category: string;
  introduction: string;
  portfolioUrl?: string;
}
