export type ProjectStatus =
  | "PENDING_REVIEW"
  | "IN_PROGRESS"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REJECTED";

// projectId (not "id") — cross-checked against project-service ProjectResponse
// (project/project/presentation/dto/response/ProjectResponse.java), whose field is `projectId`.
export interface ProjectSummary {
  projectId: number;
  title: string;
  status: ProjectStatus;
  categoryId: number;
  goalAmount: number;
  fundedAmount: number;
  startAt: string;
  endAt: string;
  thumbnailId: number | null;
}

export interface ProjectDetail extends ProjectSummary {
  summary: string | null;
  description: string | null;
}

// rewardId (not "id") — cross-checked against project-service RewardResponse
// (project/reward/presentation/dto/response/RewardResponse.java), whose field is `rewardId`.
export interface Reward {
  rewardId: number;
  projectId: number;
  name: string;
  price: number;
  totalQuantity: number | null;
  remainingQuantity: number | null;
}
