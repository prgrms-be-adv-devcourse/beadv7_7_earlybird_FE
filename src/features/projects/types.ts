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
  creatorId?: number | null;
  title: string;
  summary?: string | null;
  status: ProjectStatus;
  categoryId: number;
  goalAmount: number;
  fundedAmount: number;
  startAt: string;
  endAt: string;
  thumbnailId: number | null;
  // ProjectController's list/me endpoints return the same full ProjectResponse as the
  // detail endpoint, so these are present at runtime even though list views don't use them.
  description?: string | null;
  rejectReason?: string | null;
}

export interface ProjectDetail extends ProjectSummary {
  summary: string | null;
  description: string | null;
  // true when the backend rejected a direct single-project fetch (e.g. PENDING_REVIEW
  // is not publicly viewable) and this was reconstructed from the owner's "my projects" list instead.
  isOwnerPreview?: boolean;
}

// rewardId (not "id") — cross-checked against project-service RewardResponse
// (project/reward/presentation/dto/response/RewardResponse.java), whose field is `rewardId`.
export interface Reward {
  rewardId: number;
  projectId: number;
  name: string;
  description?: string | null;
  price: number;
  totalQuantity: number | null;
  remainingQuantity: number | null;
}

export interface CreateProjectRequest {
  title: string;
  categoryId: number;
  summary: string;
  description: string;
  goalAmount: number;
  startAt: string;
  endAt: string;
  thumbnailId?: number | null;
}

export interface CreateRewardRequest {
  name: string;
  description: string;
  price: number;
  totalQuantity?: number | null;
}
