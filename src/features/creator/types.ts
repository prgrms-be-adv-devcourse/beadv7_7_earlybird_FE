export type CreatorApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BankInfo {
  name: string;
  code: string;
}

export const BANK_LIST: BankInfo[] = [
  { name: "KB국민은행", code: "06" },
  { name: "신한은행", code: "88" },
  { name: "우리은행", code: "20" },
  { name: "하나은행", code: "81" },
  { name: "카카오뱅크", code: "90" },
  { name: "토스뱅크", code: "92" },
  { name: "NH농협은행", code: "11" },
  { name: "IBK기업은행", code: "03" },
  { name: "SC제일은행", code: "23" },
  { name: "우체국예금보험", code: "71" },
  { name: "한국산업은행", code: "02" },
  { name: "케이뱅크", code: "89" },
  { name: "Sh수협은행", code: "07" },
  { name: "iM뱅크(대구)", code: "31" },
  { name: "부산은행", code: "32" },
  { name: "광주은행", code: "34" },
  { name: "제주은행", code: "35" },
  { name: "전북은행", code: "37" },
  { name: "경남은행", code: "39" },
  { name: "새마을금고", code: "45" },
  { name: "신협", code: "48" },
  { name: "저축은행중앙회", code: "50" },
];

export interface CreatorApplication {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
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
  appliedAt?: string;
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
