// project-service ProjectCategoryController의 GET /api/v1/project-categories (목록)는
// 단일 항목용 ProjectCategoryResponse(id, parentProjectCategoryId, name)가 아니라
// 재귀적인 children을 가진 ProjectCategoryTreeResponse를 반환한다 — 트리 구조 그대로 반영.
export interface ProjectCategory {
  id: number;
  parentProjectCategoryId: number | null;
  name: string;
  children: ProjectCategory[];
}
