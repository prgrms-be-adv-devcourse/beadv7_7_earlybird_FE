import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "../features/home/pages/HomePage";
import type { ProjectSummary } from "../features/projects/types";
import type { ProjectCategory } from "../features/admin/types";

// TEMP visual QA harness — not wired into the app, delete after review.
const now = Date.now();
const day = 86400000;

const mockProjects: ProjectSummary[] = [
  { projectId: 1, title: "손끝에서 완성되는 미니 오디오 인터페이스", status: "IN_PROGRESS", categoryId: 1, goalAmount: 5000000, fundedAmount: 8200000, startAt: new Date(now - 3 * day).toISOString(), endAt: new Date(now + 2 * day).toISOString(), thumbnailId: null },
  { projectId: 2, title: "매일 쓰는 접이식 밀크 스티머", status: "IN_PROGRESS", categoryId: 2, goalAmount: 3000000, fundedAmount: 1200000, startAt: new Date(now - 1 * day).toISOString(), endAt: new Date(now + 20 * day).toISOString(), thumbnailId: null },
  { projectId: 3, title: "필름 카메라 감성의 디지털 뷰파인더", status: "IN_PROGRESS", categoryId: 1, goalAmount: 8000000, fundedAmount: 9600000, startAt: new Date(now - 10 * day).toISOString(), endAt: new Date(now + 5 * day).toISOString(), thumbnailId: null },
  { projectId: 4, title: "책상 위 작은 정원, 자동 급수 플랜터", status: "IN_PROGRESS", categoryId: 3, goalAmount: 4000000, fundedAmount: 4400000, startAt: new Date(now - 15 * day).toISOString(), endAt: new Date(now + 1 * day).toISOString(), thumbnailId: null },
  { projectId: 5, title: "한 손에 잡히는 접이식 키보드", status: "SUCCEEDED", categoryId: 1, goalAmount: 2000000, fundedAmount: 6100000, startAt: new Date(now - 60 * day).toISOString(), endAt: new Date(now - 20 * day).toISOString(), thumbnailId: null },
  { projectId: 6, title: "향이 남는 리필형 디퓨저 세트", status: "SUCCEEDED", categoryId: 3, goalAmount: 1500000, fundedAmount: 3000000, startAt: new Date(now - 90 * day).toISOString(), endAt: new Date(now - 40 * day).toISOString(), thumbnailId: null },
];

const mockCategories: ProjectCategory[] = [
  { id: 1, parentProjectCategoryId: null, name: "테크・가전", children: [] },
  { id: 2, parentProjectCategoryId: null, name: "푸드", children: [] },
  { id: 3, parentProjectCategoryId: null, name: "리빙・라이프스타일", children: [] },
];

export function HomePreview() {
  const [client] = useState(() => {
    const c = new QueryClient();
    c.setQueryData(["projects", "list"], mockProjects);
    c.setQueryData(["admin", "categories"], mockCategories);
    return c;
  });
  return (
    <QueryClientProvider client={client}>
      <HomePage />
    </QueryClientProvider>
  );
}
