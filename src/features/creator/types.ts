export type CreatorApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BankInfo {
  name: string;
  code: string;
}

export const BANK_LIST: BankInfo[] = [
  { name: "KB국민은행", code: "004" },
  { name: "신한은행", code: "088" },
  { name: "우리은행", code: "020" },
  { name: "하나은행", code: "081" },
  { name: "카카오뱅크", code: "090" },
  { name: "토스뱅크", code: "092" },
  { name: "NH농협은행", code: "011" },
  { name: "IBK기업은행", code: "003" },
  { name: "SC제일은행", code: "023" },
  { name: "우체국", code: "071" },
  { name: "KDB산업은행", code: "002" },
  { name: "케이뱅크", code: "089" },
];

export interface CreatorApplication {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  creatorName: string;
  category: string;
  introduction: string;
  businessNumber?: string;
  portfolioUrl?: string;
  status: CreatorApplicationStatus;
  rejectReason?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export interface SubmitCreatorApplicationPayload {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  creatorName: string;
  category: string;
  introduction: string;
  businessNumber?: string;
  portfolioUrl?: string;
}
